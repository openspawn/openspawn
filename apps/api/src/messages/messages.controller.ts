import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";

import { CurrentAgent, type AuthenticatedAgent } from "../auth";

import { ChannelsService } from "./channels.service";
import { DirectMessagesService, type SendDirectMessageDto } from "./direct-messages.service";
import { CreateChannelDto } from "./dto/create-channel.dto";
import { SendMessageDto } from "./dto/send-message.dto";
import { MessagesService } from "./messages.service";

@Controller()
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly channelsService: ChannelsService,
    private readonly directMessagesService: DirectMessagesService,
  ) {}

  // Channel endpoints
  @Post("channels")
  async createChannel(@CurrentAgent() agent: AuthenticatedAgent, @Body() dto: CreateChannelDto) {
    const channel = await this.channelsService.create({
      orgId: agent.orgId,
      name: dto.name,
      type: dto.type,
      taskId: dto.taskId,
      actorId: agent.id,
      metadata: dto.metadata,
    });
    return { data: channel };
  }

  @Get("channels")
  async listChannels(@CurrentAgent() agent: AuthenticatedAgent) {
    const channels = await this.channelsService.findAll(agent.orgId);
    return { data: channels };
  }

  @Get("channels/:id")
  async getChannel(@CurrentAgent() agent: AuthenticatedAgent, @Param("id") id: string) {
    const channel = await this.channelsService.findOne(agent.orgId, id);
    return { data: channel };
  }

  // Message endpoints
  @Post("messages")
  async sendMessage(@CurrentAgent() agent: AuthenticatedAgent, @Body() dto: SendMessageDto) {
    const message = await this.messagesService.send({
      orgId: agent.orgId,
      channelId: dto.channelId,
      senderId: agent.id,
      type: dto.type,
      body: dto.body,
      parentMessageId: dto.parentMessageId,
      metadata: dto.metadata,
    });
    return { data: message };
  }

  @Get("messages")
  async listMessages(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Query("channelId") channelId: string,
    @Query("limit") limit?: number,
    @Query("before") before?: string,
  ) {
    const messages = await this.messagesService.findByChannel(
      agent.orgId,
      channelId,
      limit || 50,
      before,
    );
    return { data: messages };
  }

  @Get("messages/:id")
  async getMessage(@CurrentAgent() agent: AuthenticatedAgent, @Param("id") id: string) {
    const message = await this.messagesService.findOne(agent.orgId, id);
    return { data: message };
  }

  @Get("messages/:id/thread")
  async getThread(@CurrentAgent() agent: AuthenticatedAgent, @Param("id") id: string) {
    const messages = await this.messagesService.getThread(agent.orgId, id);
    return { data: messages };
  }

  // ============ Direct Messages Endpoints ============

  /**
   * Send a direct message to another agent
   */
  @Post("dm")
  async sendDirectMessage(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Body() dto: SendDirectMessageDto,
  ) {
    const message = await this.directMessagesService.sendDirectMessage(
      agent.orgId,
      agent.id,
      dto,
    );
    return { data: message };
  }

  /**
   * Get all conversations for the current agent
   */
  @Get("dm/conversations")
  async getConversations(@CurrentAgent() agent: AuthenticatedAgent) {
    const conversations = await this.directMessagesService.getConversations(
      agent.orgId,
      agent.id,
    );
    return { data: conversations };
  }

  /**
   * Get total unread DM count
   */
  @Get("dm/unread")
  async getUnreadCount(@CurrentAgent() agent: AuthenticatedAgent) {
    const count = await this.directMessagesService.getUnreadCount(
      agent.orgId,
      agent.id,
    );
    return { data: { count } };
  }

  /**
   * Get direct messages with a specific agent
   */
  @Get("dm/:agentId")
  async getDirectMessages(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param("agentId") otherAgentId: string,
    @Query("limit") limit?: number,
    @Query("before") before?: string,
  ) {
    const messages = await this.directMessagesService.getDirectMessages(
      agent.orgId,
      agent.id,
      otherAgentId,
      limit || 50,
      before,
    );
    return { data: messages };
  }

  /**
   * Mark messages from a specific agent as read
   */
  @Patch("dm/:agentId/read")
  async markAsRead(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param("agentId") otherAgentId: string,
  ) {
    const count = await this.directMessagesService.markAsRead(
      agent.orgId,
      agent.id,
      otherAgentId,
    );
    return { data: { markedRead: count } };
  }
}
