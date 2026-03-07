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
    const { orgId, channelId, senderId, type, body, parentMessageId, metadata } = params;

    const message = this.messageRepository.create({
      orgId,
      channelId,
      senderId,
      type,
      body,
      parentMessageId,
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
}
