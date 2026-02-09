import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { EscalationReason } from "@openspawn/shared-types";

import { CurrentAgent, type AuthenticatedAgent } from "../auth";

import { EscalationService } from "./escalation.service";

/**
 * Handles escalation-specific operations.
 * Task-specific escalation routes (escalate, get task escalations) are in TasksController.
 */
@Controller("tasks/escalations")
export class EscalationsController {
  constructor(private readonly escalationService: EscalationService) {}

  @Get("open")
  async getOpenEscalations(@CurrentAgent() agent: AuthenticatedAgent) {
    const escalations = await this.escalationService.getOpenEscalations(agent.orgId);
    return { data: escalations };
  }

  @Post(":escalationId/resolve")
  async resolveEscalation(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param("escalationId") escalationId: string,
  ) {
    const escalation = await this.escalationService.resolveEscalation(escalationId);
    return { data: escalation, message: "Escalation resolved" };
  }
}
