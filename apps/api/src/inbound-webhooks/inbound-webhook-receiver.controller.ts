import {
  Controller,
  Post,
  Param,
  Body,
  Headers,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  Logger,
  RawBodyRequest,
  Req,
} from "@nestjs/common";
import { Request } from "express";

import { InboundWebhooksService } from "./inbound-webhooks.service";
import { TasksService } from "../tasks/tasks.service";
import { WebhookTaskDto } from "./dto/webhook-task.dto";
import { WebhookBatchDto } from "./dto/webhook-batch.dto";
import { Task } from "@openspawn/database";

@Controller("webhooks/inbound")
export class InboundWebhookReceiverController {
  private readonly logger = new Logger(InboundWebhookReceiverController.name);

  constructor(
    private readonly inboundWebhooksService: InboundWebhooksService,
    private readonly tasksService: TasksService,
  ) {}

  /**
   * Verify the HMAC signature if present
   */
  private verifySignature(
    req: RawBodyRequest<Request>,
    secret: string,
    signatureHeader?: string,
  ): void {
    if (!signatureHeader) {
      // Signature is optional
      return;
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException("Raw body not available for signature verification");
    }

    const payload = rawBody.toString("utf8");
    const isValid = this.inboundWebhooksService.verifySignature(
      secret,
      payload,
      signatureHeader,
    );

    if (!isValid) {
      throw new UnauthorizedException("Invalid webhook signature");
    }
  }

  /**
   * Single task creation endpoint
   */
  @Post(":key")
  async createTask(
    @Param("key") key: string,
    @Body() dto: WebhookTaskDto,
    @Headers("x-openspawn-signature") signature: string | undefined,
    @Req() req: RawBodyRequest<Request>,
  ): Promise<Task> {
    // Find and validate the webhook key
    const webhookKey = await this.inboundWebhooksService.findByKey(key);
    if (!webhookKey) {
      throw new NotFoundException("Webhook key not found or disabled");
    }

    // Verify signature if provided
    this.verifySignature(req, webhookKey.secret, signature);

    this.logger.log(
      `Creating task via webhook: ${webhookKey.name} (${webhookKey.id})`,
    );

    // Merge defaults with provided values
    const priority = dto.priority || webhookKey.defaultPriority || undefined;
    const assigneeId = dto.assigneeId || webhookKey.defaultAgentId || undefined;
    const tags = [...(webhookKey.defaultTags || []), ...(dto.tags || [])];

    // Create the task - use first user in org as creator (system task)
    // In a real scenario, you might want a system user or webhook-specific creator
    const task = await this.tasksService.create(webhookKey.orgId, webhookKey.orgId, {
      title: dto.title,
      description: dto.description,
      priority,
      assigneeId,
      tags: tags.length > 0 ? tags : undefined,
      metadata: {
        ...dto.metadata,
        createdViaWebhook: true,
        webhookKeyId: webhookKey.id,
        webhookKeyName: webhookKey.name,
      },
    });

    // Update last used timestamp
    await this.inboundWebhooksService.updateLastUsed(webhookKey.id);

    return task;
  }

  /**
   * Batch task creation endpoint
   */
  @Post(":key/batch")
  async createTasks(
    @Param("key") key: string,
    @Body() dto: WebhookBatchDto,
    @Headers("x-openspawn-signature") signature: string | undefined,
    @Req() req: RawBodyRequest<Request>,
  ): Promise<Task[]> {
    // Find and validate the webhook key
    const webhookKey = await this.inboundWebhooksService.findByKey(key);
    if (!webhookKey) {
      throw new NotFoundException("Webhook key not found or disabled");
    }

    // Verify signature if provided
    this.verifySignature(req, webhookKey.secret, signature);

    this.logger.log(
      `Creating ${dto.tasks.length} tasks via webhook: ${webhookKey.name} (${webhookKey.id})`,
    );

    // Create all tasks
    const tasks = await Promise.all(
      dto.tasks.map(async (taskDto) => {
        const priority = taskDto.priority || webhookKey.defaultPriority || undefined;
        const assigneeId =
          taskDto.assigneeId || webhookKey.defaultAgentId || undefined;
        const tags = [...(webhookKey.defaultTags || []), ...(taskDto.tags || [])];

        return this.tasksService.create(webhookKey.orgId, webhookKey.orgId, {
          title: taskDto.title,
          description: taskDto.description,
          priority,
          assigneeId,
          tags: tags.length > 0 ? tags : undefined,
          metadata: {
            ...taskDto.metadata,
            createdViaWebhook: true,
            webhookKeyId: webhookKey.id,
            webhookKeyName: webhookKey.name,
          },
        });
      }),
    );

    // Update last used timestamp
    await this.inboundWebhooksService.updateLastUsed(webhookKey.id);

    return tasks;
  }
}
