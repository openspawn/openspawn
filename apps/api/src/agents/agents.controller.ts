import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";

import { AgentRole, Proficiency, generateSigningSecret, encryptSecret } from "@openspawn/shared-types";

import { CurrentAgent, Roles, type AuthenticatedAgent } from "../auth";

import { AgentsService } from "./agents.service";
import { AgentOnboardingService, type SpawnAgentDto } from "./agent-onboarding.service";
import { AgentBudgetService, type SetBudgetDto, type TransferCreditsDto } from "./agent-budget.service";
import { AgentCapabilitiesService, type AddCapabilityDto, type UpdateCapabilityDto } from "./agent-capabilities.service";
import { TrustService } from "./trust.service";
import { CreateAgentDto } from "./dto/create-agent.dto";
import { UpdateAgentDto } from "./dto/update-agent.dto";

@Controller("agents")
export class AgentsController {
  constructor(
    private readonly agentsService: AgentsService,
    private readonly onboardingService: AgentOnboardingService,
    private readonly budgetService: AgentBudgetService,
    private readonly capabilitiesService: AgentCapabilitiesService,
    private readonly trustService: TrustService,
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

  // ============ Capability Endpoints ============

  /**
   * Get all unique capabilities in the organization
   */
  @Get("capabilities")
  async getOrgCapabilities(@CurrentAgent() actor: AuthenticatedAgent) {
    const capabilities = await this.capabilitiesService.getOrgCapabilities(actor.orgId);
    return { data: capabilities };
  }

  /**
   * Find agents with specific capabilities
   */
  @Get("capabilities/match")
  async findAgentsWithCapabilities(
    @CurrentAgent() actor: AuthenticatedAgent,
    @Query("capabilities") capabilities: string,
    @Query("minProficiency") minProficiency?: string,
    @Query("onlyActive") onlyActive?: string,
  ) {
    const capList = capabilities.split(",").map((c) => c.trim()).filter(Boolean);
    
    const matches = await this.capabilitiesService.findAgentsWithCapabilities(
      actor.orgId,
      capList,
      {
        minProficiency: minProficiency as Proficiency | undefined,
        onlyActive: onlyActive === "true",
      },
    );
    
    return { data: matches };
  }

  /**
   * Find the best agent match for a set of capabilities
   */
  @Get("capabilities/best-match")
  async findBestMatch(
    @CurrentAgent() actor: AuthenticatedAgent,
    @Query("capabilities") capabilities: string,
    @Query("minProficiency") minProficiency?: string,
  ) {
    const capList = capabilities.split(",").map((c) => c.trim()).filter(Boolean);
    
    const match = await this.capabilitiesService.findBestMatch(
      actor.orgId,
      capList,
      {
        minProficiency: minProficiency as Proficiency | undefined,
        onlyActive: true,
      },
    );
    
    return { data: match };
  }

  /**
   * Get capabilities for an agent
   */
  @Get(":id/capabilities")
  async getAgentCapabilities(
    @CurrentAgent() actor: AuthenticatedAgent,
    @Param("id") id: string,
  ) {
    const capabilities = await this.capabilitiesService.getAgentCapabilities(
      actor.orgId,
      id,
    );
    return { data: capabilities };
  }

  /**
   * Add a capability to an agent
   */
  @Post(":id/capabilities")
  async addCapability(
    @CurrentAgent() actor: AuthenticatedAgent,
    @Param("id") id: string,
    @Body() dto: AddCapabilityDto,
  ) {
    const capability = await this.capabilitiesService.addCapability(
      actor.orgId,
      actor.id,
      id,
      dto,
    );
    return { data: capability };
  }

  /**
   * Update a capability's proficiency
   */
  @Patch("capabilities/:capabilityId")
  async updateCapability(
    @CurrentAgent() actor: AuthenticatedAgent,
    @Param("capabilityId") capabilityId: string,
    @Body() dto: UpdateCapabilityDto,
  ) {
    const capability = await this.capabilitiesService.updateCapability(
      actor.orgId,
      actor.id,
      capabilityId,
      dto,
    );
    return { data: capability };
  }

  /**
   * Remove a capability from an agent
   */
  @Delete("capabilities/:capabilityId")
  async removeCapability(
    @CurrentAgent() actor: AuthenticatedAgent,
    @Param("capabilityId") capabilityId: string,
  ) {
    await this.capabilitiesService.removeCapability(
      actor.orgId,
      actor.id,
      capabilityId,
    );
    return { message: "Capability removed" };
  }

  // ============================================
  // Trust & Reputation Endpoints
  // ============================================

  /**
   * Get reputation summary for an agent
   */
  @Get(":id/reputation")
  async getReputation(
    @CurrentAgent() actor: AuthenticatedAgent,
    @Param("id") agentId: string,
  ) {
    const summary = await this.trustService.getReputationSummary(agentId);
    return { data: summary };
  }

  /**
   * Get reputation event history for an agent
   */
  @Get(":id/reputation/history")
  async getReputationHistory(
    @CurrentAgent() actor: AuthenticatedAgent,
    @Param("id") agentId: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    const result = await this.trustService.getReputationHistory(agentId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
    return { data: result.events, total: result.total };
  }

  /**
   * Award quality bonus to an agent (L7+ or parent only)
   */
  @Post(":id/reputation/bonus")
  async awardQualityBonus(
    @CurrentAgent() actor: AuthenticatedAgent,
    @Param("id") agentId: string,
    @Body() dto: { reason: string; amount?: number },
  ) {
    // Verify actor has permission (L7+ or parent)
    const agent = await this.agentsService.findOne(actor.orgId, agentId);
    if (actor.level < 7 && agent.parentId !== actor.id) {
      throw new Error("Only L7+ agents or parent can award bonuses");
    }

    const event = await this.trustService.awardQualityBonus({
      orgId: actor.orgId,
      agentId,
      awardedBy: actor.id,
      reason: dto.reason,
      bonusAmount: dto.amount,
    });
    return { data: event, message: "Quality bonus awarded" };
  }

  /**
   * Apply quality penalty to an agent (L7+ or parent only)
   */
  @Post(":id/reputation/penalty")
  async applyQualityPenalty(
    @CurrentAgent() actor: AuthenticatedAgent,
    @Param("id") agentId: string,
    @Body() dto: { reason: string; amount?: number },
  ) {
    // Verify actor has permission (L7+ or parent)
    const agent = await this.agentsService.findOne(actor.orgId, agentId);
    if (actor.level < 7 && agent.parentId !== actor.id) {
      throw new Error("Only L7+ agents or parent can apply penalties");
    }

    const event = await this.trustService.applyQualityPenalty({
      orgId: actor.orgId,
      agentId,
      appliedBy: actor.id,
      reason: dto.reason,
      penaltyAmount: dto.amount,
    });
    return { data: event, message: "Quality penalty applied" };
  }

  /**
   * Manually demote an agent (L9+ only)
   */
  @Post(":id/demote")
  @Roles(AgentRole.FOUNDER, AgentRole.ADMIN)
  async demoteAgent(
    @CurrentAgent() actor: AuthenticatedAgent,
    @Param("id") agentId: string,
    @Body() dto: { reason: string },
  ) {
    if (actor.level < 9) {
      throw new Error("Only L9+ agents can demote");
    }

    await this.trustService.demoteAgent({
      agentId,
      demotedBy: actor.id,
      reason: dto.reason,
    });
    return { message: "Agent demoted" };
  }

  /**
   * Get trust leaderboard for the organization
   */
  @Get("leaderboard/trust")
  async getTrustLeaderboard(
    @CurrentAgent() actor: AuthenticatedAgent,
    @Query("limit") limit?: string,
  ) {
    const leaderboard = await this.trustService.getLeaderboard(
      actor.orgId,
      limit ? parseInt(limit, 10) : 10,
    );
    return { data: leaderboard };
  }
}
