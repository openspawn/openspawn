import { Args, ID, Query, Resolver } from "@nestjs/graphql";

import { AgentsService } from "../../agents";
import { AgentType } from "../types";

@Resolver(() => AgentType)
export class AgentResolver {
  constructor(private readonly agentsService: AgentsService) {}

  @Query(() => [AgentType])
  async agents(@Args("orgId", { type: () => ID }) orgId: string): Promise<AgentType[]> {
    return this.agentsService.findAll(orgId);
  }

  @Query(() => AgentType, { nullable: true })
  async agent(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("id", { type: () => ID }) id: string,
  ): Promise<AgentType | null> {
    try {
      return await this.agentsService.findOne(orgId, id);
    } catch {
      return null;
    }
  }
}
