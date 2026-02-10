import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as crypto from "node:crypto";

import { InboundWebhookKey } from "@openspawn/database";

import { CreateInboundWebhookKeyDto } from "./dto/create-inbound-webhook-key.dto";
import { UpdateInboundWebhookKeyDto } from "./dto/update-inbound-webhook-key.dto";

@Injectable()
export class InboundWebhooksService {
  constructor(
    @InjectRepository(InboundWebhookKey)
    private readonly webhookKeyRepo: Repository<InboundWebhookKey>,
  ) {}

  /**
   * Generate a random webhook key with "iwk_" prefix
   */
  private generateKey(): string {
    const random = crypto.randomBytes(32).toString("hex");
    return `iwk_${random}`;
  }

  /**
   * Generate a random secret for HMAC verification
   */
  private generateSecret(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Create a new inbound webhook key
   */
  async create(
    orgId: string,
    dto: CreateInboundWebhookKeyDto,
  ): Promise<InboundWebhookKey> {
    const key = this.generateKey();
    const secret = this.generateSecret();

    const webhookKey = this.webhookKeyRepo.create({
      orgId,
      name: dto.name,
      key,
      secret,
      defaultAgentId: dto.defaultAgentId,
      defaultPriority: dto.defaultPriority,
      defaultTags: dto.defaultTags || [],
      enabled: true,
    });

    return this.webhookKeyRepo.save(webhookKey);
  }

  /**
   * List all webhook keys for an organization
   */
  async findAll(orgId: string): Promise<InboundWebhookKey[]> {
    return this.webhookKeyRepo.find({
      where: { orgId },
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Get a single webhook key by ID
   */
  async findOne(orgId: string, id: string): Promise<InboundWebhookKey> {
    const webhookKey = await this.webhookKeyRepo.findOne({
      where: { id, orgId },
    });

    if (!webhookKey) {
      throw new NotFoundException("Webhook key not found");
    }

    return webhookKey;
  }

  /**
   * Find webhook key by key string (for authentication)
   */
  async findByKey(key: string): Promise<InboundWebhookKey | null> {
    return this.webhookKeyRepo.findOne({
      where: { key, enabled: true },
    });
  }

  /**
   * Update a webhook key
   */
  async update(
    orgId: string,
    id: string,
    dto: UpdateInboundWebhookKeyDto,
  ): Promise<InboundWebhookKey> {
    const webhookKey = await this.findOne(orgId, id);

    if (dto.name !== undefined) webhookKey.name = dto.name;
    if (dto.defaultAgentId !== undefined)
      webhookKey.defaultAgentId = dto.defaultAgentId;
    if (dto.defaultPriority !== undefined)
      webhookKey.defaultPriority = dto.defaultPriority;
    if (dto.defaultTags !== undefined) webhookKey.defaultTags = dto.defaultTags;
    if (dto.enabled !== undefined) webhookKey.enabled = dto.enabled;

    return this.webhookKeyRepo.save(webhookKey);
  }

  /**
   * Rotate the key and secret
   */
  async rotate(orgId: string, id: string): Promise<InboundWebhookKey> {
    const webhookKey = await this.findOne(orgId, id);

    webhookKey.key = this.generateKey();
    webhookKey.secret = this.generateSecret();

    return this.webhookKeyRepo.save(webhookKey);
  }

  /**
   * Delete a webhook key
   */
  async remove(orgId: string, id: string): Promise<void> {
    const webhookKey = await this.findOne(orgId, id);
    await this.webhookKeyRepo.remove(webhookKey);
  }

  /**
   * Update the last used timestamp
   */
  async updateLastUsed(id: string): Promise<void> {
    await this.webhookKeyRepo.update(id, {
      lastUsedAt: new Date(),
    });
  }

  /**
   * Verify HMAC signature
   */
  verifySignature(secret: string, payload: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expectedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuf, expectedBuf);
  }
}
