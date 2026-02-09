import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { EscalationReason } from "@openspawn/shared-types";

import { CurrentAgent, type AuthenticatedAgent } from "../auth";

import { EscalationService } from "./escalation.service";

@Controller("tasks")
export class EscalationsController {
  constructor(private readonly escalationService: EscalationService) {}

  @Post(":id/escalate")
  async escalateTask(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param("id") id: string,
    @Body() dto: { reason: EscalationReason; notes?: string; targetAgentId?: string },
  ) {
    const escalation = await this.escalationService.escalateTask({
      orgId: agent.orgId,
      taskId: id,
      reason: dto.reason,
      notes: dto.notes,
      targetAgentId: dto.targetAgentId,
      isAutomatic: false,
    });
    return { data: escalation, message: "Task escalated" };
  }

  @Get(":id/escalations")
  async getTaskEscalations(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param("id") id: string,
  ) {
    const escalations = await this.escalationService.getTaskEscalations(id);
    return { data: escalations };
  }

  @Get("escalations/open")
  async getOpenEscalations(@CurrentAgent() agent: AuthenticatedAgent) {
    const escalations = await this.escalationService.getOpenEscalations(agent.orgId);
    return { data: escalations };
  }

  @Post("escalations/:escalationId/resolve")
  async resolveEscalation(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param("escalationId") escalationId: string,
  ) {
    const escalation = await this.escalationService.resolveEscalation(escalationId);
    return { data: escalation, message: "Escalation resolved" };
  }
}
