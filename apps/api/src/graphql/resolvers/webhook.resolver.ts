import { Args, ID, Mutation, Query, Resolver } from "@nestjs/graphql";
import { NotFoundException } from "@nestjs/common";

import { OrgFromContext, validateOrgAccess } from "../../auth/decorators";
import { WebhooksService } from "../../webhooks";
import { WebhookType, CreateWebhookInput, UpdateWebhookInput } from "../types";

/**
 * Security Model:
 * Organization access is validated at the gateway level via JWT claims.
 * Direct API access requires agent HMAC authentication which is org-scoped.
 *
 * All queries validate that the requested orgId matches the authenticated context
 * to prevent cross-organization data access.
 */
@Resolver(() => WebhookType)
export class WebhookResolver {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Query(() => [WebhookType])
  async webhooks(
    @Args("orgId", { type: () => ID }) orgId: string,
    @OrgFromContext() authenticatedOrgId?: string,
  ): Promise<WebhookType[]> {
    validateOrgAccess(orgId, authenticatedOrgId);
    return this.webhooksService.findByOrg(orgId);
  }

  @Query(() => WebhookType, { nullable: true })
  async webhook(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("id", { type: () => ID }) id: string,
    @OrgFromContext() authenticatedOrgId?: string,
  ): Promise<WebhookType | null> {
    validateOrgAccess(orgId, authenticatedOrgId);
    return this.webhooksService.findById(orgId, id);
  }

  @Mutation(() => WebhookType)
  async createWebhook(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("input") input: CreateWebhookInput,
    @OrgFromContext() authenticatedOrgId?: string,
  ): Promise<WebhookType> {
    validateOrgAccess(orgId, authenticatedOrgId);
    return this.webhooksService.create(orgId, input);
  }

  @Mutation(() => WebhookType)
  async updateWebhook(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("id", { type: () => ID }) id: string,
    @Args("input") input: UpdateWebhookInput,
    @OrgFromContext() authenticatedOrgId?: string,
  ): Promise<WebhookType> {
    validateOrgAccess(orgId, authenticatedOrgId);
    const webhook = await this.webhooksService.update(orgId, id, input);
    if (!webhook) {
      throw new NotFoundException("Webhook not found");
    }
    return webhook;
  }

  @Mutation(() => Boolean)
  async deleteWebhook(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("id", { type: () => ID }) id: string,
    @OrgFromContext() authenticatedOrgId?: string,
  ): Promise<boolean> {
    validateOrgAccess(orgId, authenticatedOrgId);
    return this.webhooksService.delete(orgId, id);
  }

  @Mutation(() => Boolean)
  async testWebhook(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("id", { type: () => ID }) id: string,
    @OrgFromContext() authenticatedOrgId?: string,
  ): Promise<boolean> {
    validateOrgAccess(orgId, authenticatedOrgId);
    const result = await this.webhooksService.sendTestEvent(orgId, id);
    return result.success;
  }
}
