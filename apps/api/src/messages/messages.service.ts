import { Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Message } from "@openspawn/database";
import { MessageType } from "@openspawn/shared-types";

import { EventsService } from "../events";

export interface SendMessageParams {
  orgId: string;
  channelId: string;
  senderId: string;
  type: MessageType;
  body: string;
  parentMessageId?: string;
  recipientId?: string;
  metadata?: Record<string, unknown>;
}

export interface SendDirectMessageParams {
  orgId: string;
  fromId: string;
  toId: string;
  body: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly eventsService: EventsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async send(params: SendMessageParams): Promise<Message> {
    const { orgId, channelId, senderId, type, body, parentMessageId, recipientId, metadata } =
      params;

    const message = this.messageRepository.create({
      orgId,
      channelId,
      senderId,
      type,
      body,
      parentMessageId,
      recipientId,
      metadata: metadata || {},
    });

    const saved = await this.messageRepository.save(message);

    await this.eventsService.emit({
      orgId,
      type: "message.sent",
      actorId: senderId,
      entityType: "message",
      entityId: saved.id,
      data: {
        channelId,
        type,
        hasParent: !!parentMessageId,
      },
    });

    // Emit for real-time subscriptions
    this.eventEmitter.emit("message.created", saved);

    return saved;
  }

  async findByChannel(
    orgId: string,
    channelId: string,
    limit = 50,
    before?: string,
  ): Promise<Message[]> {
    const query = this.messageRepository
      .createQueryBuilder("message")
      .where("message.org_id = :orgId", { orgId })
      .andWhere("message.channel_id = :channelId", { channelId })
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
    return messages.reverse(); // Return in chronological order
  }

  async findOne(orgId: string, id: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id, orgId },
    });

    if (!message) {
      throw new NotFoundException("Message not found");
    }

    return message;
  }

  async getThread(orgId: string, parentId: string): Promise<Message[]> {
    return this.messageRepository.find({
      where: { orgId, parentMessageId: parentId },
      order: { createdAt: "ASC" },
    });
  }

  /**
   * Send a direct message between two agents (peer-to-peer messaging)
   */
  async sendDirect(params: SendDirectMessageParams): Promise<Message> {
    const { orgId, fromId, toId, body, metadata } = params;

    const message = this.messageRepository.create({
      orgId,
      channelId: await this.getOrCreateDirectChannel(orgId, fromId, toId),
      senderId: fromId,
      recipientId: toId,
      type: MessageType.TEXT,
      body,
      metadata: metadata || {},
    });

    const saved = await this.messageRepository.save(message);

    await this.eventsService.emit({
      orgId,
      type: "message.direct",
      actorId: fromId,
      entityType: "message",
      entityId: saved.id,
      data: {
        recipientId: toId,
      },
    });

    // Emit for real-time subscriptions
    this.eventEmitter.emit("message.direct", saved);

    return saved;
  }

  /**
   * Get conversation between two agents
   */
  async getConversation(
    orgId: string,
    agent1Id: string,
    agent2Id: string,
    limit = 50,
  ): Promise<Message[]> {
    const messages = await this.messageRepository
      .createQueryBuilder("message")
      .where("message.org_id = :orgId", { orgId })
      .andWhere(
        "(message.sender_id = :agent1Id AND message.recipient_id = :agent2Id) OR " +
          "(message.sender_id = :agent2Id AND message.recipient_id = :agent1Id)",
        { agent1Id, agent2Id },
      )
      .orderBy("message.created_at", "DESC")
      .take(limit)
      .getMany();

    return messages.reverse(); // Return in chronological order
  }

  /**
   * Get all direct messages for an agent
   */
  async getDirectMessages(orgId: string, agentId: string, limit = 100): Promise<Message[]> {
    return this.messageRepository
      .createQueryBuilder("message")
      .where("message.org_id = :orgId", { orgId })
      .andWhere(
        "(message.sender_id = :agentId AND message.recipient_id IS NOT NULL) OR " +
          "message.recipient_id = :agentId",
        { agentId },
      )
      .orderBy("message.created_at", "DESC")
      .take(limit)
      .getMany();
  }

  /**
   * Get or create a direct channel between two agents
   * For now, we use the "general" channel as DMs are stored with recipientId
   * In the future, we could create dedicated DM channels
   */
  private async getOrCreateDirectChannel(
    orgId: string,
    _agent1Id: string,
    _agent2Id: string,
  ): Promise<string> {
    // For now, use a placeholder channel ID for direct messages
    // In production, you'd want to create/retrieve a DIRECT channel type
    // This allows DMs to work without requiring channel infrastructure changes
    const directChannelId = `${orgId}-direct`;

    // The channel would be created on first use in a real implementation
    // For now, we store DMs with recipientId which is sufficient for queries
    return directChannelId;
  }
}
