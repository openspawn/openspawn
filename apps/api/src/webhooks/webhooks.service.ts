import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { OnEvent, EventEmitter2 } from "@nestjs/event-emitter";
import { Repository } from "typeorm";
import { Webhook, Event } from "@openspawn/database";
import * as crypto from "node:crypto";
import * as dns from "node:dns/promises";

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface PreHookResult {
  allow: boolean;
  reason?: string;
  blockedBy?: string[];
  executionTimeMs?: number;
}

export interface PreHookResponse {
  allow: boolean;
  reason?: string;
}

interface HookExecutionEvent {
  webhookId: string;
  webhookName: string;
  orgId: string;
  eventType: string;
  hookType: "pre" | "post";
  success: boolean;
  blocked?: boolean;
  reason?: string;
  executionTimeMs: number;
  error?: string;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(Webhook)
    private readonly webhookRepo: Repository<Webhook>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Validates webhook URL to prevent SSRF attacks.
   * Blocks requests to internal/private IP ranges.
   */
  private async validateWebhookUrl(url: string): Promise<void> {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new BadRequestException("Invalid webhook URL");
    }

    // Only allow http/https
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new BadRequestException("Webhook URL must use HTTP or HTTPS protocol");
    }

    const hostname = parsedUrl.hostname;

    // Block obvious localhost variants
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
      throw new BadRequestException("Webhook URL cannot target localhost");
    }

    // Resolve hostname to IP addresses
    let addresses: string[];
    try {
      const result = await dns.lookup(hostname, { all: true });
      addresses = result.map((r) => r.address);
    } catch {
      throw new BadRequestException(`Cannot resolve webhook hostname: ${hostname}`);
    }

    for (const ip of addresses) {
      if (this.isPrivateIp(ip)) {
        throw new BadRequestException("Webhook URL cannot target internal/private IP addresses");
      }
    }
  }

  /**
   * Checks if an IP address is in a private/internal range.
   */
  private isPrivateIp(ip: string): boolean {
    // IPv4 checks
    if (ip.includes(".")) {
      const parts = ip.split(".").map(Number);
      if (parts.length !== 4) return false;

      // 127.0.0.0/8 - Loopback
      if (parts[0] === 127) return true;

      // 10.0.0.0/8 - Private
      if (parts[0] === 10) return true;

      // 172.16.0.0/12 - Private (172.16.x.x - 172.31.x.x)
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

      // 192.168.0.0/16 - Private
      if (parts[0] === 192 && parts[1] === 168) return true;

      // 169.254.0.0/16 - Link-local (AWS metadata, etc.)
      if (parts[0] === 169 && parts[1] === 254) return true;

      // 0.0.0.0/8 - Current network
      if (parts[0] === 0) return true;
    }

    // IPv6 checks
    if (ip.includes(":")) {
      const normalized = ip.toLowerCase();

      // ::1 - Loopback
      if (normalized === "::1") return true;

      // fc00::/7 - Unique local addresses (fc00:: - fdff::)
      if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;

      // fe80::/10 - Link-local
      if (normalized.startsWith("fe80")) return true;

      // :: - Unspecified
      if (normalized === "::") return true;
    }

    return false;
  }

  async create(
    orgId: string,
    data: {
      name: string;
      url: string;
      secret?: string;
      events: string[];
      hookType?: "pre" | "post";
      canBlock?: boolean;
      timeoutMs?: number;
    },
  ): Promise<Webhook> {
    await this.validateWebhookUrl(data.url);

    const webhook = this.webhookRepo.create({
      orgId,
      name: data.name,
      url: data.url,
      secret: data.secret,
      events: data.events,
      enabled: true,
      hookType: data.hookType ?? "post",
      canBlock: data.canBlock ?? false,
      timeoutMs: data.timeoutMs ?? 5000,
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
    data: Partial<{
      name: string;
      url: string;
      secret: string;
      events: string[];
      enabled: boolean;
      hookType: "pre" | "post";
      canBlock: boolean;
      timeoutMs: number;
    }>,
  ): Promise<Webhook | null> {
    const webhook = await this.findById(orgId, id);
    if (!webhook) return null;

    if (data.url) {
      await this.validateWebhookUrl(data.url);
    }

    Object.assign(webhook, data);
    return this.webhookRepo.save(webhook);
  }

  async delete(orgId: string, id: string): Promise<boolean> {
    const result = await this.webhookRepo.delete({ id, orgId });
    return (result.affected ?? 0) > 0;
  }

  /**
   * Execute pre-hooks for an action. If any blocking pre-hook returns allow: false,
   * the action should be blocked.
   */
  async executePreHooks(
    orgId: string,
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<PreHookResult> {
    const startTime = Date.now();

    // Find all enabled pre-hooks for this event type
    const preHooks = await this.webhookRepo.find({
      where: { orgId, enabled: true, hookType: "pre" },
    });

    // Filter hooks that match this event type
    const matchingHooks = preHooks.filter(
      (w) => w.events.length === 0 || w.events.includes(eventType) || w.events.includes("*"),
    );

    if (matchingHooks.length === 0) {
      return { allow: true, executionTimeMs: Date.now() - startTime };
    }

    this.logger.debug(`Executing ${matchingHooks.length} pre-hooks for ${eventType}`);

    // Execute all pre-hooks in parallel with individual timeouts
    const results = await Promise.allSettled(
      matchingHooks.map((hook) => this.executePreHook(hook, eventType, payload)),
    );

    // Process results
    const blockedBy: string[] = [];
    const reasons: string[] = [];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const hook = matchingHooks[i];

      if (result.status === "rejected") {
        // Hook failed - emit event for audit
        this.emitHookExecution({
          webhookId: hook.id,
          webhookName: hook.name,
          orgId,
          eventType,
          hookType: "pre",
          success: false,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
          executionTimeMs: hook.timeoutMs,
        });
        continue;
      }

      const { allow, reason, executionTimeMs } = result.value;

      // Emit execution event for audit trail
      this.emitHookExecution({
        webhookId: hook.id,
        webhookName: hook.name,
        orgId,
        eventType,
        hookType: "pre",
        success: true,
        blocked: !allow && hook.canBlock,
        reason,
        executionTimeMs,
      });

      // Only blocking hooks can actually block the action
      if (!allow && hook.canBlock) {
        blockedBy.push(hook.name);
        if (reason) {
          reasons.push(`${hook.name}: ${reason}`);
        }
      }
    }

    const executionTimeMs = Date.now() - startTime;

    if (blockedBy.length > 0) {
      return {
        allow: false,
        reason: reasons.length > 0 ? reasons.join("; ") : `Blocked by: ${blockedBy.join(", ")}`,
        blockedBy,
        executionTimeMs,
      };
    }

    return { allow: true, executionTimeMs };
  }

  /**
   * Execute a single pre-hook and return the result
   */
  private async executePreHook(
    hook: Webhook,
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<{ allow: boolean; reason?: string; executionTimeMs: number }> {
    const startTime = Date.now();

    // Validate URL at execution time
    await this.validateWebhookUrl(hook.url);

    const webhookPayload: WebhookPayload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data: {
        ...payload,
        hookType: "pre",
        requiresResponse: true,
      },
    };

    const body = JSON.stringify(webhookPayload);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-BikiniBottom-Event": eventType,
      "X-BikiniBottom-Delivery": crypto.randomUUID(),
      "X-BikiniBottom-Hook-Type": "pre",
    };

    if (hook.secret) {
      const signature = crypto
        .createHmac("sha256", hook.secret)
        .update(body)
        .digest("hex");
      headers["X-BikiniBottom-Signature"] = `sha256=${signature}`;
    }

    try {
      const response = await fetch(hook.url, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(hook.timeoutMs),
      });

      const executionTimeMs = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Update last triggered
      await this.webhookRepo.update(hook.id, {
        lastTriggeredAt: new Date(),
        failureCount: 0,
        lastError: undefined,
      });

      // Parse response to get allow/deny decision
      const responseData = (await response.json()) as PreHookResponse;

      return {
        allow: responseData.allow !== false, // Default to allow if not specified
        reason: responseData.reason,
        executionTimeMs,
      };
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.warn(`Pre-hook ${hook.id} failed: ${errorMessage}`);

      await this.webhookRepo.update(hook.id, {
        failureCount: hook.failureCount + 1,
        lastError: errorMessage,
      });

      // Disable after 10 consecutive failures
      if (hook.failureCount >= 9) {
        await this.webhookRepo.update(hook.id, { enabled: false });
        this.logger.warn(`Pre-hook ${hook.id} disabled after 10 failures`);
      }

      // On failure, default to allow (fail-open) to prevent blocking on webhook issues
      return { allow: true, executionTimeMs };
    }
  }

  private emitHookExecution(event: HookExecutionEvent): void {
    this.eventEmitter.emit("webhook.executed", event);
  }

  async dispatchEvent(orgId: string, eventType: string, data: Record<string, unknown>): Promise<void> {
    // Only dispatch to post-hooks (pre-hooks are handled separately via executePreHooks)
    const webhooks = await this.webhookRepo.find({
      where: { orgId, enabled: true, hookType: "post" },
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

  /**
   * Get pre-hook execution logs for an organization
   */
  async getPreHookLogs(orgId: string, limit = 50): Promise<Webhook[]> {
    return this.webhookRepo.find({
      where: { orgId, hookType: "pre" },
      order: { lastTriggeredAt: "DESC" },
      take: limit,
    });
  }

  private async sendWebhook(webhook: Webhook, payload: WebhookPayload): Promise<void> {
    // Validate URL at delivery time to catch URLs stored before validation existed
    await this.validateWebhookUrl(webhook.url);

    const body = JSON.stringify(payload);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-BikiniBottom-Event": payload.event,
      "X-BikiniBottom-Delivery": crypto.randomUUID(),
    };

    if (webhook.secret) {
      const signature = crypto
        .createHmac("sha256", webhook.secret)
        .update(body)
        .digest("hex");
      headers["X-BikiniBottom-Signature"] = `sha256=${signature}`;
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
