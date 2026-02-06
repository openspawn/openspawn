import { Args, ID, Int, Query, Resolver, Subscription } from "@nestjs/graphql";

import { CreditsService } from "../../credits";
import { CREDIT_TRANSACTION_CREATED, PubSubProvider } from "../pubsub.provider";
import { CreditTransactionType } from "../types";

@Resolver(() => CreditTransactionType)
export class CreditResolver {
  constructor(
    private readonly creditsService: CreditsService,
    private readonly pubSub: PubSubProvider,
  ) {}

  @Query(() => [CreditTransactionType])
  async creditHistory(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("agentId", { type: () => ID }) agentId: string,
    @Args("limit", { type: () => Int, defaultValue: 50 }) limit: number,
    @Args("offset", { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<CreditTransactionType[]> {
    const { transactions } = await this.creditsService.getHistory(orgId, agentId, limit, offset);
    return transactions;
  }

  @Subscription(() => CreditTransactionType, {
    filter: (payload, variables) => payload.creditTransactionCreated.orgId === variables.orgId,
  })
  creditTransactionCreated(
    @Args("orgId", { type: () => ID }) _orgId: string,
  ): AsyncIterator<CreditTransactionType> {
    return this.pubSub.asyncIterableIterator(CREDIT_TRANSACTION_CREATED);
  }
}
