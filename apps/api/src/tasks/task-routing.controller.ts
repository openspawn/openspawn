import { Controller, Get, Query } from "@nestjs/common";

import { CurrentAgent, type AuthenticatedAgent } from "../auth";

import { TaskRoutingService } from "./task-routing.service";

/**
 * Handles task routing suggestions.
 * Task-specific routing routes (candidates, auto-assign) are in TasksController.
 */
@Controller("tasks/routing")
export class TaskRoutingController {
  constructor(private readonly routingService: TaskRoutingService) {}

  @Get("suggest")
  async suggestAgents(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Query("capabilities") capabilities: string,
    @Query("limit") limit?: string,
  ) {
    const capList = capabilities.split(",").map((c) => c.trim()).filter(Boolean);
    const suggestions = await this.routingService.suggestAgents(
      agent.orgId,
      capList,
      limit ? parseInt(limit, 10) : 5,
    );
    return { data: suggestions };
  }
}
