import { Args, ID, Int, Query, Resolver, Subscription } from "@nestjs/graphql";

import { EventsService } from "../../events";
import { EVENT_CREATED, PubSubProvider } from "../pubsub.provider";
import { EventType } from "../types";

@Resolver(() => EventType)
export class EventResolver {
  constructor(
    private readonly eventsService: EventsService,
    private readonly pubSub: PubSubProvider,
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

  @Subscription(() => EventType, {
    filter: (payload, variables) => payload.eventCreated.orgId === variables.orgId,
  })
  eventCreated(@Args("orgId", { type: () => ID }) _orgId: string): AsyncIterator<EventType> {
    return this.pubSub.asyncIterableIterator(EVENT_CREATED);
  }
}
