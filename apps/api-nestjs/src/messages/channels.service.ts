import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Channel } from "@openspawn/database";
import { ChannelType } from "@openspawn/shared-types";

import { EventsService } from "../events";

export interface CreateChannelParams {
  orgId: string;
  name: string;
  type: ChannelType;
  taskId?: string;
  actorId: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    private readonly eventsService: EventsService,
  ) {}

  async create(params: CreateChannelParams): Promise<Channel> {
    const { orgId, name, type, taskId, actorId, metadata } = params;

    // Check for duplicate name in org
    const existing = await this.channelRepository.findOne({
      where: { orgId, name },
    });

    if (existing) {
      throw new ConflictException(`Channel "${name}" already exists`);
    }

    const channel = this.channelRepository.create({
      orgId,
      name,
      type,
      taskId,
      metadata: metadata || {},
    });

    const saved = await this.channelRepository.save(channel);

    await this.eventsService.emit({
      orgId,
      type: "channel.created",
      actorId,
      entityType: "channel",
      entityId: saved.id,
      data: { name, type, taskId },
    });

    return saved;
  }

  async findAll(orgId: string): Promise<Channel[]> {
    return this.channelRepository.find({
      where: { orgId },
      order: { createdAt: "DESC" },
    });
  }

  async findOne(orgId: string, id: string): Promise<Channel> {
    const channel = await this.channelRepository.findOne({
      where: { id, orgId },
    });

    if (!channel) {
      throw new NotFoundException("Channel not found");
    }

    return channel;
  }

  async findByTask(orgId: string, taskId: string): Promise<Channel | null> {
    return this.channelRepository.findOne({
      where: { orgId, taskId },
    });
  }

  /**
   * Create a task-specific channel (auto-called when task is created)
   */
  async createTaskChannel(
    orgId: string,
    taskId: string,
    taskIdentifier: string,
    actorId: string,
  ): Promise<Channel> {
    return this.create({
      orgId,
      name: `#${taskIdentifier.toLowerCase()}`,
      type: ChannelType.TASK,
      taskId,
      actorId,
    });
  }
}
