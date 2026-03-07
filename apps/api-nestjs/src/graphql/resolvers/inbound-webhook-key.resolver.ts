import { Args, ID, Mutation, Query, Resolver } from "@nestjs/graphql";

import { OrgFromContext, validateOrgAccess } from "../../auth/decorators";
import { InboundWebhooksService } from "../../inbound-webhooks/inbound-webhooks.service";
import {
  InboundWebhookKeyType,
  CreateInboundWebhookKeyInput,
  UpdateInboundWebhookKeyInput,
} from "../types/inbound-webhook-key.type";

@Resolver(() => InboundWebhookKeyType)
export class InboundWebhookKeyResolver {
  constructor(private readonly inboundWebhooksService: InboundWebhooksService) {}

  @Query(() => [InboundWebhookKeyType])
  async inboundWebhookKeys(
    @Args("orgId", { type: () => ID }) orgId: string,
    @OrgFromContext() authenticatedOrgId: string | undefined,
  ): Promise<InboundWebhookKeyType[]> {
    validateOrgAccess(orgId, authenticatedOrgId);
    return this.inboundWebhooksService.findAll(orgId);
  }

  @Query(() => InboundWebhookKeyType, { nullable: true })
  async inboundWebhookKey(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("id", { type: () => ID }) id: string,
    @OrgFromContext() authenticatedOrgId: string | undefined,
  ): Promise<InboundWebhookKeyType | null> {
    validateOrgAccess(orgId, authenticatedOrgId);
    try {
      return await this.inboundWebhooksService.findOne(orgId, id);
    } catch {
      return null;
    }
  }

  @Mutation(() => InboundWebhookKeyType)
  async createInboundWebhookKey(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("input") input: CreateInboundWebhookKeyInput,
    @OrgFromContext() authenticatedOrgId: string | undefined,
  ): Promise<InboundWebhookKeyType> {
    validateOrgAccess(orgId, authenticatedOrgId);
    return this.inboundWebhooksService.create(orgId, {
      name: input.name,
      defaultAgentId: input.defaultAgentId,
      defaultPriority: input.defaultPriority,
      defaultTags: input.defaultTags,
    });
  }

  @Mutation(() => InboundWebhookKeyType)
  async updateInboundWebhookKey(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("id", { type: () => ID }) id: string,
    @Args("input") input: UpdateInboundWebhookKeyInput,
    @OrgFromContext() authenticatedOrgId: string | undefined,
  ): Promise<InboundWebhookKeyType> {
    validateOrgAccess(orgId, authenticatedOrgId);
    return this.inboundWebhooksService.update(orgId, id, {
      name: input.name,
      defaultAgentId: input.defaultAgentId,
      defaultPriority: input.defaultPriority,
      defaultTags: input.defaultTags,
      enabled: input.enabled,
    });
  }

  @Mutation(() => InboundWebhookKeyType)
  async rotateInboundWebhookKey(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("id", { type: () => ID }) id: string,
    @OrgFromContext() authenticatedOrgId: string | undefined,
  ): Promise<InboundWebhookKeyType> {
    validateOrgAccess(orgId, authenticatedOrgId);
    return this.inboundWebhooksService.rotate(orgId, id);
  }

  @Mutation(() => Boolean)
  async deleteInboundWebhookKey(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("id", { type: () => ID }) id: string,
    @OrgFromContext() authenticatedOrgId: string | undefined,
  ): Promise<boolean> {
    validateOrgAccess(orgId, authenticatedOrgId);
    await this.inboundWebhooksService.remove(orgId, id);
    return true;
  }
}
