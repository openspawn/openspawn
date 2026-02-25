import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  IntegrationLink,
  type IntegrationSourceType,
  type IntegrationTargetType,
} from "@openspawn/database";

@Injectable()
export class IntegrationLinkService {
  constructor(
    @InjectRepository(IntegrationLink)
    private readonly linkRepo: Repository<IntegrationLink>,
  ) {}

  async createLink(params: {
    orgId: string;
    provider: string;
    sourceType: IntegrationSourceType;
    sourceId: string;
    targetType: IntegrationTargetType;
    targetId: string;
    metadata?: Record<string, unknown>;
  }): Promise<IntegrationLink> {
    const link = this.linkRepo.create({
      orgId: params.orgId,
      provider: params.provider,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      targetType: params.targetType,
      targetId: params.targetId,
      metadata: params.metadata || {},
    });
    return this.linkRepo.save(link);
  }

  async findBySource(
    orgId: string,
    sourceType: IntegrationSourceType,
    sourceId: string,
  ): Promise<IntegrationLink | null> {
    return this.linkRepo.findOne({
      where: { orgId, sourceType, sourceId },
    });
  }

  async findByTarget(
    orgId: string,
    targetType: IntegrationTargetType,
    targetId: string,
  ): Promise<IntegrationLink[]> {
    return this.linkRepo.find({
      where: { orgId, targetType, targetId },
    });
  }

  async findByOrg(orgId: string, provider?: string): Promise<IntegrationLink[]> {
    const where: Record<string, unknown> = { orgId };
    if (provider) where.provider = provider;
    return this.linkRepo.find({ where, order: { createdAt: "DESC" } });
  }

  async deleteLink(orgId: string, id: string): Promise<void> {
    await this.linkRepo.delete({ id, orgId });
  }
}
