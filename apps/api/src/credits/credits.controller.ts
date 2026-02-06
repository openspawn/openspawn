import { Body, Controller, Get, Post, Query } from "@nestjs/common";

import { AgentRole } from "@openspawn/shared-types";

import { CurrentAgent, Public, Roles, type AuthenticatedAgent } from "../auth";

import { CreditsService } from "./credits.service";
import { AdjustCreditsDto } from "./dto/adjust-credits.dto";
import { LiteLLMCallbackDto } from "./dto/litellm-callback.dto";
import { SpendCreditsDto } from "./dto/spend-credits.dto";

@Controller("credits")
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get("balance")
  async getBalance(@CurrentAgent() agent: AuthenticatedAgent) {
    const balance = await this.creditsService.getBalance(agent.orgId, agent.id);
    return { data: balance };
  }

  @Post("spend")
  async spend(@CurrentAgent() agent: AuthenticatedAgent, @Body() dto: SpendCreditsDto) {
    const transaction = await this.creditsService.spend({
      orgId: agent.orgId,
      agentId: agent.id,
      amount: dto.amount,
      reason: dto.reason,
      triggerType: dto.triggerType,
      sourceTaskId: dto.sourceTaskId,
      sourceAgentId: dto.sourceAgentId,
    });
    return { data: transaction };
  }

  @Get("history")
  async getHistory(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Query("limit") limit?: number,
    @Query("offset") offset?: number,
  ) {
    const { transactions, total } = await this.creditsService.getHistory(
      agent.orgId,
      agent.id,
      limit || 50,
      offset || 0,
    );
    return {
      data: transactions,
      meta: { total, limit: limit || 50, offset: offset || 0 },
    };
  }

  @Post("adjust")
  @Roles(AgentRole.HR, AgentRole.ADMIN)
  async adjust(@CurrentAgent() actor: AuthenticatedAgent, @Body() dto: AdjustCreditsDto) {
    const transaction = await this.creditsService.adjust({
      orgId: actor.orgId,
      agentId: dto.agentId,
      amount: dto.amount,
      type: dto.type,
      reason: dto.reason,
      actorId: actor.id,
    });
    return { data: transaction };
  }

  /**
   * LiteLLM callback endpoint - internal use only
   * In production, this should be secured with a shared secret
   */
  @Public()
  @Post("litellm-callback")
  async litellmCallback(@Body() dto: LiteLLMCallbackDto, @Query("orgId") orgId: string) {
    const transaction = await this.creditsService.processLiteLLMCallback(
      orgId,
      dto.agentId,
      dto.model,
      dto.inputTokens,
      dto.outputTokens,
      dto.callId,
    );
    return { data: transaction, message: transaction ? "Charged" : "No charge" };
  }
}
