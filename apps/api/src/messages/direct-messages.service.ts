import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Agent, Channel, Message } from "@openspawn/database";
import { ChannelType, MessageType, AgentStatus } from "@openspawn/shared-types";

import { EventsService } from "../events";

export interface SendDirectMessageDto {
  toAgentId: string;
  body: string;
  type?: MessageType;
  metadata?: Record<string, unknown>;
}

export interface DirectMessage {
  id: string;
  fromAgentId: string;
  fromAgentName: string;
  toAgentId: string;
  toAgentName: string;
  body: string;
  type: MessageType;
  createdAt: Date;
  read: boolean;
}

export interface Conversation {
  channelId: string;
  otherAgentId: string;
  otherAgentName: string;
  otherAgentLevel: number;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
}

@Injectable()
export class DirectMessagesService {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Generate a consistent DM channel name for two agents
   * Uses sorted IDs to ensure same channel regardless of who initiates
   */
  private getDMChannelName(agentId1: string, agentId2: string): string {
    const sorted = [agentId1, agentId2].sort();
    return `dm:${sorted[0]}:${sorted[1]}`;
  }

  /**
   * Get or create a DM channel between two agents
   */
  async getOrCreateDMChannel(
    orgId: string,
    agentId1: string,
    agentId2: string,
  ): Promise<Channel> {
    const name = this.getDMChannelName(agentId1, agentId2);

    // Try to find existing channel
    let channel = await this.channelRepository.findOne({
      where: { orgId, name },
    });

    if (!channel) {
      // Create new DM channel
      channel = this.channelRepository.create({
        orgId,
        name,
        type: ChannelType.AGENT,
        metadata: {
          participants: [agentId1, agentId2],
        },
      });
      channel = await this.channelRepository.save(channel);
    }

    return channel;
  }

  /**
   * Send a direct message to another agent
   */
  async sendDirectMessage(
    orgId: string,
    fromAgentId: string,
    dto: SendDirectMessageDto,
  ): Promise<Message> {
    // Verify both agents exist and are in same org
    const [fromAgent, toAgent] = await Promise.all([
      this.agentRepository.findOne({ where: { id: fromAgentId, orgId } }),
      this.agentRepository.findOne({ where: { id: dto.toAgentId, orgId } }),
    ]);

    if (!fromAgent) {
      throw new NotFoundException("Sender agent not found");
    }

    if (!toAgent) {
      throw new NotFoundException("Recipient agent not found");
    }

    // Check if sender is active
    if (fromAgent.status !== AgentStatus.ACTIVE) {
      throw new ForbiddenException("Sender agent is not active");
    }

    // Get or create the DM channel
    const channel = await this.getOrCreateDMChannel(orgId, fromAgentId, dto.toAgentId);

    // Create the message
    const message = this.messageRepository.create({
      orgId,
      channelId: channel.id,
      senderId: fromAgentId,
      type: dto.type || MessageType.TEXT,
      body: dto.body,
      metadata: {
        ...dto.metadata,
        recipientId: dto.toAgentId,
        read: false,
      },
    });

    const saved = await this.messageRepository.save(message);

    // Emit event
    await this.eventsService.emit({
      orgId,
      type: "message.direct",
      actorId: fromAgentId,
      entityType: "message",
      entityId: saved.id,
      data: {
        fromAgent: fromAgentId,
        toAgent: dto.toAgentId,
        channelId: channel.id,
      },
    });

    return saved;
  }

  /**
   * Get direct messages between current agent and another agent
   */
  async getDirectMessages(
    orgId: string,
    currentAgentId: string,
    otherAgentId: string,
    limit = 50,
    before?: string,
  ): Promise<DirectMessage[]> {
    const channel = await this.getOrCreateDMChannel(orgId, currentAgentId, otherAgentId);

    // Get agents for names
    const [currentAgent, otherAgent] = await Promise.all([
      this.agentRepository.findOne({ where: { id: currentAgentId } }),
      this.agentRepository.findOne({ where: { id: otherAgentId } }),
    ]);

    if (!currentAgent || !otherAgent) {
      throw new NotFoundException("Agent not found");
    }

    const query = this.messageRepository
      .createQueryBuilder("message")
      .where("message.channel_id = :channelId", { channelId: channel.id })
      .orderBy("message.created_at", "DESC")
      .take(limit);

    if (before) {
      const beforeMessage = await this.messageRepository.findOne({
        where: { id: before },
      });
      if (beforeMessage) {
        query.andWhere("message.created_at < :beforeTime", {
          beforeTime: beforeMessage.createdAt,
        });
      }
    }

    const messages = await query.getMany();

    // Transform and return in chronological order
    return messages.reverse().map((m) => ({
      id: m.id,
      fromAgentId: m.senderId,
      fromAgentName: m.senderId === currentAgentId ? currentAgent.name : otherAgent.name,
      toAgentId: m.senderId === currentAgentId ? otherAgentId : currentAgentId,
      toAgentName: m.senderId === currentAgentId ? otherAgent.name : currentAgent.name,
      body: m.body,
      type: m.type,
      createdAt: m.createdAt,
      read: (m.metadata as Record<string, unknown>)?.["read"] === true,
    }));
  }

  /**
   * Mark messages as read
   */
  async markAsRead(
    orgId: string,
    currentAgentId: string,
    otherAgentId: string,
  ): Promise<number> {
    const channel = await this.getOrCreateDMChannel(orgId, currentAgentId, otherAgentId);

    // Update all unread messages from the other agent
    const result = await this.messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({
        metadata: () => `metadata || '{"read": true}'::jsonb`,
      })
      .where("channel_id = :channelId", { channelId: channel.id })
      .andWhere("sender_id = :senderId", { senderId: otherAgentId })
      .andWhere("metadata->>'read' = 'false' OR metadata->>'read' IS NULL")
      .execute();

    return result.affected || 0;
  }

  /**
   * Get all conversations for an agent
   */
  async getConversations(orgId: string, agentId: string): Promise<Conversation[]> {
    // Find all DM channels this agent is part of
    const channels = await this.channelRepository
      .createQueryBuilder("channel")
      .where("channel.org_id = :orgId", { orgId })
      .andWhere("channel.type = :type", { type: ChannelType.AGENT })
      .andWhere("channel.name LIKE :pattern", { pattern: `dm:%${agentId}%` })
      .getMany();

    const conversations: Conversation[] = [];

    for (const channel of channels) {
      const participants = (channel.metadata as Record<string, unknown>)?.["participants"] as string[] | undefined;
      if (!participants) continue;

      const otherAgentId = participants.find((id) => id !== agentId);
      if (!otherAgentId) continue;

      // Get other agent details
      const otherAgent = await this.agentRepository.findOne({
        where: { id: otherAgentId },
      });

      if (!otherAgent) continue;

      // Get last message
      const lastMessage = await this.messageRepository.findOne({
        where: { channelId: channel.id },
        order: { createdAt: "DESC" },
      });

      // Count unread messages (messages from other agent that are not read)
      const unreadCount = await this.messageRepository
        .createQueryBuilder("message")
        .where("message.channel_id = :channelId", { channelId: channel.id })
        .andWhere("message.sender_id = :senderId", { senderId: otherAgentId })
        .andWhere("(message.metadata->>'read' = 'false' OR message.metadata->>'read' IS NULL)")
        .getCount();

      conversations.push({
        channelId: channel.id,
        otherAgentId,
        otherAgentName: otherAgent.name,
        otherAgentLevel: otherAgent.level,
        lastMessage: lastMessage?.body || "",
        lastMessageAt: lastMessage?.createdAt || channel.createdAt,
        unreadCount,
      });
    }

    // Sort by last message time (most recent first)
    return conversations.sort(
      (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
    );
  }

  /**
   * Get total unread message count for an agent
   */
  async getUnreadCount(orgId: string, agentId: string): Promise<number> {
    // Find all DM channels this agent is part of
    const channels = await this.channelRepository
      .createQueryBuilder("channel")
      .where("channel.org_id = :orgId", { orgId })
      .andWhere("channel.type = :type", { type: ChannelType.AGENT })
      .andWhere("channel.name LIKE :pattern", { pattern: `dm:%${agentId}%` })
      .getMany();

    let total = 0;

    for (const channel of channels) {
      const participants = (channel.metadata as Record<string, unknown>)?.["participants"] as string[] | undefined;
      if (!participants) continue;

      const otherAgentId = participants.find((id) => id !== agentId);
      if (!otherAgentId) continue;

      const count = await this.messageRepository
        .createQueryBuilder("message")
        .where("message.channel_id = :channelId", { channelId: channel.id })
        .andWhere("message.sender_id = :senderId", { senderId: otherAgentId })
        .andWhere("(message.metadata->>'read' = 'false' OR message.metadata->>'read' IS NULL)")
        .getCount();

      total += count;
    }

    return total;
  }
}
