import { Controller, Get, Param, Query } from "@nestjs/common";

import { CurrentAgent } from "../auth";
import type { AuthenticatedAgent } from "../auth";

import { QueryEventsDto } from "./dto/query-events.dto";
import { EventsService } from "./events.service";

@Controller("events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async findAll(@CurrentAgent() agent: AuthenticatedAgent, @Query() query: QueryEventsDto) {
    const { events, total } = await this.eventsService.findAll(
      agent.orgId,
      {
        type: query.type,
        actorId: query.actorId,
        entityType: query.entityType,
        entityId: query.entityId,
        severity: query.severity,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
      },
      query.page || 1,
      query.limit || 50,
    );

    return {
      data: events,
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 50,
      },
    };
  }

  @Get(":id")
  async findOne(@CurrentAgent() agent: AuthenticatedAgent, @Param("id") id: string) {
    const event = await this.eventsService.findOne(agent.orgId, id);
    return { data: event };
  }
}
