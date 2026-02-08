import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";

import { AgentRole } from "@openspawn/shared-types";

import { CurrentAgent, Roles, type AuthenticatedAgent } from "../auth";

import { AgentsService } from "./agents.service";
import { AgentOnboardingService, type SpawnAgentDto } from "./agent-onboarding.service";
import { AgentBudgetService, type SetBudgetDto, type TransferCreditsDto } from "./agent-budget.service";
import { CreateAgentDto } from "./dto/create-agent.dto";
import { UpdateAgentDto } from "./dto/update-agent.dto";

@Controller("agents")
export class AgentsController {
  constructor(
    private readonly agentsService: AgentsService,
    private readonly onboardingService: AgentOnboardingService,
    private readonly budgetService: AgentBudgetService,
  ) {}

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

  // ============ Onboarding Endpoints ============

  /**
   * Spawn a new child agent (starts in PENDING status)
   */
  @Post("spawn")
  async spawn(
    @CurrentAgent() actor: AuthenticatedAgent,
    @Body() dto: SpawnAgentDto & { hmacSecretEnc?: string },
  ) {
    // For now, generate a new secret (in production, might be passed in)
    const { generateSigningSecret, encryptSecret } = await import("@openspawn/shared-types");
    const plaintextSecret = generateSigningSecret();
    const encryptionKey = process.env["ENCRYPTION_KEY"];
    if (!encryptionKey) {
      throw new Error("ENCRYPTION_KEY not configured");
    }
    const hmacSecretEnc = encryptSecret(plaintextSecret, encryptionKey);

    const agent = await this.onboardingService.spawnAgent(
      actor.orgId,
      actor.id,
      dto,
      hmacSecretEnc,
    );

    return {
      data: {
        id: agent.id,
        agentId: agent.agentId,
        name: agent.name,
        level: agent.level,
        status: agent.status,
        parentId: agent.parentId,
      },
      secret: plaintextSecret,
      message: "Agent spawned in PENDING status. Parent or L10 must activate.",
    };
  }

  /**
   * Check spawn capacity
   */
  @Get("capacity")
  async getCapacity(@CurrentAgent() actor: AuthenticatedAgent) {
    const capacity = await this.onboardingService.canSpawnChild(actor.id);
    return { data: capacity };
  }

  /**
   * Get pending agents awaiting activation
   */
  @Get("pending")
  async getPending(@CurrentAgent() actor: AuthenticatedAgent) {
    const pending = await this.onboardingService.getPendingAgents(actor.orgId, actor.id);
    return {
      data: pending.map((a) => ({
        id: a.id,
        agentId: a.agentId,
        name: a.name,
        level: a.level,
        parentId: a.parentId,
        createdAt: a.createdAt,
      })),
    };
  }

  /**
   * Activate a pending agent
   */
  @Post(":id/activate")
  async activate(
    @CurrentAgent() actor: AuthenticatedAgent,
    @Param("id") id: string,
  ) {
    const agent = await this.onboardingService.activateAgent(actor.orgId, actor.id, id);
    return {
      data: { id: agent.id, status: agent.status },
      message: "Agent activated successfully",
    };
  }

  /**
   * Reject a pending agent
   */
  @Delete(":id/reject")
  async reject(
    @CurrentAgent() actor: AuthenticatedAgent,
    @Param("id") id: string,
    @Body() body: { reason?: string },
  ) {
    await this.onboardingService.rejectAgent(actor.orgId, actor.id, id, body.reason);
    return { message: "Agent rejected" };
  }

  /**
   * Get agent hierarchy
   */
  @Get(":id/hierarchy")
  async getHierarchy(
    @CurrentAgent() actor: AuthenticatedAgent,
    @Param("id") id: string,
    @Query("depth") depth?: string,
  ) {
    const hierarchy = await this.onboardingService.getHierarchy(
      actor.orgId,
      id,
      depth ? parseInt(depth, 10) : 3,
    );
    return { data: hierarchy };
  }

  // ============ Budget Endpoints ============

  /**
   * Get budget status for an agent
   */
  @Get(":id/budget")
  async getBudgetStatus(
    @CurrentAgent() actor: AuthenticatedAgent,
    @Param("id") id: string,
  ) {
    const status = await this.budgetService.getBudgetStatus(actor.orgId, id);
    return { data: status };
  }

  /**
   * Set budget for an agent
   */
  @Patch(":id/budget")
  async setBudget(
    @CurrentAgent() actor: AuthenticatedAgent,
    @Param("id") id: string,
    @Body() dto: SetBudgetDto,
  ) {
    const status = await this.budgetService.setBudget(actor.orgId, actor.id, id, dto);
    return { data: status };
  }

  /**
   * Transfer credits to another agent
   */
  @Post("credits/transfer")
  async transferCredits(
    @CurrentAgent() actor: AuthenticatedAgent,
    @Body() dto: TransferCreditsDto,
  ) {
    const result = await this.budgetService.transferCredits(actor.orgId, actor.id, dto);
    return { data: result };
  }

  /**
   * Check if an agent can spend an amount
   */
  @Get(":id/budget/can-spend")
  async canSpend(
    @CurrentAgent() actor: AuthenticatedAgent,
    @Param("id") id: string,
    @Query("amount") amount: string,
  ) {
    const result = await this.budgetService.canSpend(
      actor.orgId,
      id,
      parseInt(amount, 10),
    );
    return { data: result };
  }

  /**
   * Get agents near budget limit
   */
  @Get("budget/alerts")
  async getBudgetAlerts(@CurrentAgent() actor: AuthenticatedAgent) {
    const alerts = await this.budgetService.getAgentsNearBudgetLimit(actor.orgId);
    return { data: alerts };
  }
}
