import { Args, ID, Int, Query, Resolver, Subscription } from "@nestjs/graphql";

import { OrgFromContext, validateOrgAccess } from "../../auth/decorators";
import { CreditsService } from "../../credits";
import { CREDIT_TRANSACTION_CREATED, PubSubProvider } from "../pubsub.provider";
import { CreditTransactionType } from "../types";

/**
 * Security Model:
 * Organization access is validated at the gateway level via JWT claims.
 * Direct API access requires agent HMAC authentication which is org-scoped.
 *
 * All queries validate that the requested orgId matches the authenticated context
 * to prevent cross-organization data access.
 */
@Resolver(() => CreditTransactionType)
export class CreditResolver {
  constructor(
    private readonly creditsService: CreditsService,
    private readonly pubSub: PubSubProvider,
  ) {}

  @Query(() => [CreditTransactionType])
  async creditHistory(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("agentId", { type: () => ID, nullable: true }) agentId: string | undefined,
    @Args("limit", { type: () => Int, defaultValue: 50 }) limit: number,
    @Args("offset", { type: () => Int, defaultValue: 0 }) offset: number,
    @OrgFromContext() authenticatedOrgId?: string,
  ): Promise<CreditTransactionType[]> {
    validateOrgAccess(orgId, authenticatedOrgId);
    const { transactions } = await this.creditsService.getHistory(orgId, agentId, limit, offset);
    return transactions;
  }

  @Subscription(() => CreditTransactionType, {
    filter: (payload, variables) => payload.creditTransactionCreated.orgId === variables.orgId,
  })
  creditTransactionCreated(
    @Args("orgId", { type: () => ID }) _orgId: string,
  ): AsyncIterator<CreditTransactionType> {
    // Note: Subscription authorization is handled in the filter function above.
    // The subscription only emits events matching the requested orgId.
    // Full subscription auth should be implemented via connection params.
    // TODO: Validate orgId against connection-level auth context
    return this.pubSub.asyncIterableIterator(CREDIT_TRANSACTION_CREATED);
  }
}
