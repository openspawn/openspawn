import { Args, ID, Query, Resolver } from "@nestjs/graphql";

import { OrgFromContext, validateOrgAccess } from "../../auth/decorators";
import { AgentsService } from "../../agents";
import { AgentType } from "../types";

/**
 * Security Model:
 * Organization access is validated at the gateway level via JWT claims.
 * Direct API access requires agent HMAC authentication which is org-scoped.
 *
 * All queries validate that the requested orgId matches the authenticated context
 * to prevent cross-organization data access.
 */
@Resolver(() => AgentType)
export class AgentResolver {
  constructor(private readonly agentsService: AgentsService) {}

  @Query(() => [AgentType])
  async agents(
    @Args("orgId", { type: () => ID }) orgId: string,
    @OrgFromContext() authenticatedOrgId: string | undefined,
  ): Promise<AgentType[]> {
    validateOrgAccess(orgId, authenticatedOrgId);
    return this.agentsService.findAll(orgId);
  }

  @Query(() => AgentType, { nullable: true })
  async agent(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("id", { type: () => ID }) id: string,
    @OrgFromContext() authenticatedOrgId: string | undefined,
  ): Promise<AgentType | null> {
    validateOrgAccess(orgId, authenticatedOrgId);
    try {
      return await this.agentsService.findOne(orgId, id);
    } catch {
      return null;
    }
  }
}
