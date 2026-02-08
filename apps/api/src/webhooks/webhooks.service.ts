import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { OnEvent } from "@nestjs/event-emitter";
import { Repository } from "typeorm";
import { Webhook, Event } from "@openspawn/database";
import * as crypto from "node:crypto";

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(Webhook)
    private readonly webhookRepo: Repository<Webhook>,
  ) {}

  async create(
    orgId: string,
    data: { name: string; url: string; secret?: string; events: string[] },
  ): Promise<Webhook> {
    const webhook = this.webhookRepo.create({
      orgId,
      name: data.name,
      url: data.url,
      secret: data.secret,
      events: data.events,
      enabled: true,
    });
    return this.webhookRepo.save(webhook);
  }

  async findByOrg(orgId: string): Promise<Webhook[]> {
    return this.webhookRepo.find({
      where: { orgId },
      order: { createdAt: "DESC" },
    });
  }

  async findById(orgId: string, id: string): Promise<Webhook | null> {
    return this.webhookRepo.findOne({ where: { id, orgId } });
  }

  async update(
    orgId: string,
    id: string,
    data: Partial<{ name: string; url: string; secret: string; events: string[]; enabled: boolean }>,
  ): Promise<Webhook | null> {
    const webhook = await this.findById(orgId, id);
    if (!webhook) return null;

    Object.assign(webhook, data);
    return this.webhookRepo.save(webhook);
  }

  async delete(orgId: string, id: string): Promise<boolean> {
    const result = await this.webhookRepo.delete({ id, orgId });
    return (result.affected ?? 0) > 0;
  }

  async dispatchEvent(orgId: string, eventType: string, data: Record<string, unknown>): Promise<void> {
    const webhooks = await this.webhookRepo.find({
      where: { orgId, enabled: true },
    });

    const payload: WebhookPayload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data,
    };

    const matchingWebhooks = webhooks.filter(
      (w) => w.events.length === 0 || w.events.includes(eventType) || w.events.includes("*"),
    );

    await Promise.allSettled(
      matchingWebhooks.map((webhook) => this.sendWebhook(webhook, payload)),
    );
  }

  private async sendWebhook(webhook: Webhook, payload: WebhookPayload): Promise<void> {
    const body = JSON.stringify(payload);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-OpenSpawn-Event": payload.event,
      "X-OpenSpawn-Delivery": crypto.randomUUID(),
    };

    if (webhook.secret) {
      const signature = crypto
        .createHmac("sha256", webhook.secret)
        .update(body)
        .digest("hex");
      headers["X-OpenSpawn-Signature"] = `sha256=${signature}`;
    }

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      await this.webhookRepo.update(webhook.id, {
        lastTriggeredAt: new Date(),
        failureCount: 0,
        lastError: undefined,
      });

      this.logger.debug(`Webhook ${webhook.id} delivered: ${payload.event}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Webhook ${webhook.id} failed: ${errorMessage}`);

      await this.webhookRepo.update(webhook.id, {
        failureCount: webhook.failureCount + 1,
        lastError: errorMessage,
      });

      // Disable after 10 consecutive failures
      if (webhook.failureCount >= 9) {
        await this.webhookRepo.update(webhook.id, { enabled: false });
        this.logger.warn(`Webhook ${webhook.id} disabled after 10 failures`);
      }
    }
  }

  async sendTestEvent(orgId: string, id: string): Promise<{ success: boolean; error?: string }> {
    const webhook = await this.findById(orgId, id);
    if (!webhook) {
      return { success: false, error: "Webhook not found" };
    }

    const payload: WebhookPayload = {
      event: "test",
      timestamp: new Date().toISOString(),
      data: { message: "This is a test webhook from OpenSpawn" },
    };

    try {
      await this.sendWebhook(webhook, payload);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Listen for all events and dispatch to registered webhooks
   */
  @OnEvent("event.created")
  async handleEventCreated(event: Event): Promise<void> {
    try {
      await this.dispatchEvent(event.orgId, event.type, {
        id: event.id,
        actorId: event.actorId,
        entityType: event.entityType,
        entityId: event.entityId,
        severity: event.severity,
        data: event.data,
        createdAt: event.createdAt,
      });
    } catch (error) {
      this.logger.error(`Failed to dispatch webhooks for event ${event.id}:`, error);
    }
  }
}
