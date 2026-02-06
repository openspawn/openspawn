import { Args, ID, Int, Parent, Query, ResolveField, Resolver, Subscription } from "@nestjs/graphql";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Agent } from "@openspawn/database";

import { EventsService } from "../../events";
import { EVENT_CREATED, PubSubProvider } from "../pubsub.provider";
import { AgentType, EventType } from "../types";

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
  ): Promise<EventType[]> {
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
    return this.pubSub.asyncIterableIterator(EVENT_CREATED);
  }
}
