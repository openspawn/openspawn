import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";

import { AgentRole } from "@openspawn/shared-types";

import { CurrentAgent, Roles, type AuthenticatedAgent } from "../auth";

import { AgentsService } from "./agents.service";
import { CreateAgentDto } from "./dto/create-agent.dto";
import { UpdateAgentDto } from "./dto/update-agent.dto";

@Controller("agents")
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  /**
   * Register a new agent - HR role only (Talent Agent)
   * Returns the plaintext secret ONCE
   */
  @Post("register")
  @Roles(AgentRole.HR)
  async register(@CurrentAgent() actor: AuthenticatedAgent, @Body() dto: CreateAgentDto) {
    const { agent, secret } = await this.agentsService.register(actor.orgId, actor.id, dto);

    return {
      data: {
        id: agent.id,
        agentId: agent.agentId,
        name: agent.name,
        role: agent.role,
        level: agent.level,
        model: agent.model,
      },
      secret,
      message: "IMPORTANT: Save this secret securely. It cannot be recovered.",
    };
  }

  @Get()
  async findAll(@CurrentAgent() agent: AuthenticatedAgent) {
    const agents = await this.agentsService.findAll(agent.orgId);
    return {
      data: agents.map((a) => ({
        id: a.id,
        agentId: a.agentId,
        name: a.name,
        role: a.role,
        level: a.level,
        model: a.model,
        status: a.status,
        currentBalance: a.currentBalance,
        createdAt: a.createdAt,
      })),
    };
  }

  @Get(":id")
  async findOne(@CurrentAgent() actor: AuthenticatedAgent, @Param("id") id: string) {
    const agent = await this.agentsService.findOne(actor.orgId, id);
    return {
      data: {
        id: agent.id,
        agentId: agent.agentId,
        name: agent.name,
        role: agent.role,
        level: agent.level,
        model: agent.model,
        status: agent.status,
        currentBalance: agent.currentBalance,
        managementFeePct: agent.managementFeePct,
        budgetPeriodLimit: agent.budgetPeriodLimit,
        budgetPeriodSpent: agent.budgetPeriodSpent,
        capabilities: agent.capabilities,
        metadata: agent.metadata,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
      },
    };
  }

  @Patch(":id")
  @Roles(AgentRole.HR)
  async update(
    @CurrentAgent() actor: AuthenticatedAgent,
    @Param("id") id: string,
    @Body() dto: UpdateAgentDto,
  ) {
    const agent = await this.agentsService.update(actor.orgId, actor.id, id, dto);
    return { data: agent };
  }

  @Post(":id/revoke")
  @Roles(AgentRole.HR)
  async revoke(@CurrentAgent() actor: AuthenticatedAgent, @Param("id") id: string) {
    const agent = await this.agentsService.revoke(actor.orgId, actor.id, id);
    return {
      data: { id: agent.id, status: agent.status },
      message: "Agent has been revoked",
    };
  }

  @Get(":id/credits/balance")
  async getBalance(@CurrentAgent() actor: AuthenticatedAgent, @Param("id") id: string) {
    const balance = await this.agentsService.getBalance(actor.orgId, id);
    return { data: balance };
  }
}
