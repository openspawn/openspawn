import { Args, ID, Int, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";

import { getReputationLevel, ReputationLevel } from "@openspawn/shared-types";
import { OrgFromContext, validateOrgAccess } from "../../auth/decorators";
import { AgentsService, TrustService } from "../../agents";
import {
  AgentType,
  AgentReputationType,
  ReputationHistoryEntryType,
  LeaderboardEntryType,
} from "../types";

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
  constructor(
    private readonly agentsService: AgentsService,
    private readonly trustService: TrustService,
  ) {}

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

  @ResolveField(() => ReputationLevel)
  reputationLevel(@Parent() agent: AgentType): ReputationLevel {
    return getReputationLevel(agent.trustScore);
  }

  @Query(() => AgentReputationType, { nullable: true })
  async agentReputation(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("agentId", { type: () => ID }) agentId: string,
    @OrgFromContext() authenticatedOrgId: string | undefined,
  ): Promise<AgentReputationType | null> {
    validateOrgAccess(orgId, authenticatedOrgId);
    try {
      const summary = await this.trustService.getReputationSummary(agentId);
      return {
        ...summary,
        promotionProgress: summary.promotionProgress
          ? {
              ...summary.promotionProgress,
              nextLevel: summary.promotionProgress.nextLevel ?? 0,
              trustScoreRequired: summary.promotionProgress.trustScoreRequired ?? 0,
              tasksRequired: summary.promotionProgress.tasksRequired ?? 0,
            }
          : null,
      };
    } catch {
      return null;
    }
  }

  @Query(() => [ReputationHistoryEntryType])
  async reputationHistory(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("agentId", { type: () => ID }) agentId: string,
    @OrgFromContext() authenticatedOrgId: string | undefined,
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
  ): Promise<ReputationHistoryEntryType[]> {
    validateOrgAccess(orgId, authenticatedOrgId);
    const result = await this.trustService.getReputationHistory(agentId, { limit });
    return result.events.map((e) => ({
      id: e.id,
      eventType: e.type,
      delta: e.impact,
      previousScore: e.previousScore,
      newScore: e.newScore,
      reason: e.reason ?? "",
      createdAt: e.createdAt,
    }));
  }

  @Query(() => [LeaderboardEntryType])
  async trustLeaderboard(
    @Args("orgId", { type: () => ID }) orgId: string,
    @OrgFromContext() authenticatedOrgId: string | undefined,
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
  ): Promise<LeaderboardEntryType[]> {
    validateOrgAccess(orgId, authenticatedOrgId);
    return this.trustService.getLeaderboard(orgId, limit ?? 10);
  }
}
