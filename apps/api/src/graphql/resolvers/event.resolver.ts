import { Args, ID, Int, Parent, Query, ResolveField, Resolver, Subscription } from "@nestjs/graphql";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Agent } from "@openspawn/database";

import { OrgFromContext, validateOrgAccess } from "../../auth/decorators";
import { EventsService } from "../../events";
import { EVENT_CREATED, PubSubProvider } from "../pubsub.provider";
import { AgentType, EventType } from "../types";

/**
 * Security Model:
 * Organization access is validated at the gateway level via JWT claims.
 * Direct API access requires agent HMAC authentication which is org-scoped.
 *
 * All queries validate that the requested orgId matches the authenticated context
 * to prevent cross-organization data access.
 */
@Resolver(() => EventType)
export class EventResolver {
  constructor(
    private readonly eventsService: EventsService,
    private readonly pubSub: PubSubProvider,
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
  ) {}

  @Query(() => [EventType])
  async events(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("limit", { type: () => Int, defaultValue: 50 }) limit: number,
    @Args("page", { type: () => Int, defaultValue: 1 }) page: number,
    @OrgFromContext() authenticatedOrgId?: string,
  ): Promise<EventType[]> {
    validateOrgAccess(orgId, authenticatedOrgId);
    const { events } = await this.eventsService.findAll(orgId, {}, page, limit);
    return events;
  }

  @ResolveField(() => AgentType, { nullable: true })
  async actor(@Parent() event: EventType): Promise<AgentType | null> {
    if (!event.actorId) return null;
    return this.agentRepository.findOne({ where: { id: event.actorId } });
  }

  @Subscription(() => EventType, {
    filter: (payload, variables) => payload.eventCreated.orgId === variables.orgId,
  })
  eventCreated(@Args("orgId", { type: () => ID }) _orgId: string): AsyncIterator<EventType> {
    // Note: Subscription authorization is handled in the filter function above.
    // The subscription only emits events matching the requested orgId.
    // Full subscription auth should be implemented via connection params.
    // TODO: Validate orgId against connection-level auth context
    return this.pubSub.asyncIterableIterator(EVENT_CREATED);
  }
}
