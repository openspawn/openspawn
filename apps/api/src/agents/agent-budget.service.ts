import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan } from "typeorm";

import { Agent, CreditTransaction } from "@openspawn/database";
import { AgentStatus, CreditType } from "@openspawn/shared-types";

import { EventsService } from "../events";

export interface SetBudgetDto {
  budgetPeriodLimit: number;
  resetCurrentPeriod?: boolean;
}

export interface TransferCreditsDto {
  toAgentId: string;
  amount: number;
  reason?: string;
}

export interface BudgetStatus {
  agentId: string;
  currentBalance: number;
  budgetPeriodLimit: number | null;
  budgetPeriodSpent: number;
  budgetRemaining: number | null;
  budgetPeriodStart: Date | null;
  utilizationPercent: number | null;
}

@Injectable()
export class AgentBudgetService {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(CreditTransaction)
    private readonly transactionRepository: Repository<CreditTransaction>,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Get budget status for an agent
   */
  async getBudgetStatus(orgId: string, agentId: string): Promise<BudgetStatus> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId, orgId },
    });

    if (!agent) {
      throw new NotFoundException("Agent not found");
    }

    const budgetRemaining = agent.budgetPeriodLimit
      ? agent.budgetPeriodLimit - agent.budgetPeriodSpent
      : null;

    const utilizationPercent = agent.budgetPeriodLimit
      ? Math.round((agent.budgetPeriodSpent / agent.budgetPeriodLimit) * 100)
      : null;

    return {
      agentId: agent.id,
      currentBalance: agent.currentBalance,
      budgetPeriodLimit: agent.budgetPeriodLimit,
      budgetPeriodSpent: agent.budgetPeriodSpent,
      budgetRemaining,
      budgetPeriodStart: agent.budgetPeriodStart,
      utilizationPercent,
    };
  }

  /**
   * Set budget limit for an agent
   * Only parent or L10 can set budgets
   */
  async setBudget(
    orgId: string,
    actorId: string,
    targetAgentId: string,
    dto: SetBudgetDto,
  ): Promise<BudgetStatus> {
    const [actor, target] = await Promise.all([
      this.agentRepository.findOne({ where: { id: actorId } }),
      this.agentRepository.findOne({ where: { id: targetAgentId, orgId } }),
    ]);

    if (!actor) {
      throw new ForbiddenException("Actor not found");
    }

    if (!target) {
      throw new NotFoundException("Target agent not found");
    }

    // Authorization: parent or L10
    const isParent = target.parentId === actorId;
    const isL10 = actor.level === 10;

    if (!isParent && !isL10) {
      throw new ForbiddenException(
        "Only parent agent or L10 can set budgets"
      );
    }

    if (dto.budgetPeriodLimit < 0) {
      throw new BadRequestException("Budget limit cannot be negative");
    }

    target.budgetPeriodLimit = dto.budgetPeriodLimit;
    
    if (dto.resetCurrentPeriod) {
      target.budgetPeriodSpent = 0;
      target.budgetPeriodStart = new Date();
    }

    await this.agentRepository.save(target);

    await this.eventsService.emit({
      orgId,
      type: "agent.budget_set",
      actorId,
      entityType: "agent",
      entityId: targetAgentId,
      data: {
        budgetPeriodLimit: dto.budgetPeriodLimit,
        resetCurrentPeriod: dto.resetCurrentPeriod,
      },
    });

    return this.getBudgetStatus(orgId, targetAgentId);
  }

  /**
   * Transfer credits between agents
   * Credits flow down the hierarchy (parent -> child)
   */
  async transferCredits(
    orgId: string,
    fromAgentId: string,
    dto: TransferCreditsDto,
  ): Promise<{ from: BudgetStatus; to: BudgetStatus }> {
    const [fromAgent, toAgent] = await Promise.all([
      this.agentRepository.findOne({ where: { id: fromAgentId, orgId } }),
      this.agentRepository.findOne({ where: { id: dto.toAgentId, orgId } }),
    ]);

    if (!fromAgent) {
      throw new NotFoundException("Source agent not found");
    }

    if (!toAgent) {
      throw new NotFoundException("Target agent not found");
    }

    if (dto.amount <= 0) {
      throw new BadRequestException("Transfer amount must be positive");
    }

    if (fromAgent.currentBalance < dto.amount) {
      throw new BadRequestException(
        `Insufficient balance (${fromAgent.currentBalance} < ${dto.amount})`
      );
    }

    // Verify hierarchy: can only transfer to children or siblings
    const isChild = toAgent.parentId === fromAgentId;
    const isSibling = fromAgent.parentId && fromAgent.parentId === toAgent.parentId;
    const isL10 = fromAgent.level === 10;

    if (!isChild && !isSibling && !isL10) {
      throw new ForbiddenException(
        "Can only transfer credits to children or sibling agents"
      );
    }

    // Perform transfer
    fromAgent.currentBalance -= dto.amount;
    toAgent.currentBalance += dto.amount;

    await this.agentRepository.save([fromAgent, toAgent]);

    // Record transactions
    const now = new Date();
    await this.transactionRepository.save([
      {
        orgId,
        agentId: fromAgentId,
        type: CreditType.DEBIT,
        amount: dto.amount,
        description: dto.reason || `Transfer to ${toAgent.name}`,
        referenceType: "transfer",
        referenceId: dto.toAgentId,
        createdAt: now,
      },
      {
        orgId,
        agentId: dto.toAgentId,
        type: CreditType.CREDIT,
        amount: dto.amount,
        description: dto.reason || `Transfer from ${fromAgent.name}`,
        referenceType: "transfer",
        referenceId: fromAgentId,
        createdAt: now,
      },
    ]);

    await this.eventsService.emit({
      orgId,
      type: "credits.transferred",
      actorId: fromAgentId,
      entityType: "agent",
      entityId: dto.toAgentId,
      data: {
        fromAgent: fromAgentId,
        toAgent: dto.toAgentId,
        amount: dto.amount,
        reason: dto.reason,
      },
    });

    return {
      from: await this.getBudgetStatus(orgId, fromAgentId),
      to: await this.getBudgetStatus(orgId, dto.toAgentId),
    };
  }

  /**
   * Check if an agent can spend a certain amount
   */
  async canSpend(orgId: string, agentId: string, amount: number): Promise<{
    canSpend: boolean;
    reason?: string;
    currentBalance: number;
    budgetRemaining: number | null;
  }> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId, orgId },
    });

    if (!agent) {
      return {
        canSpend: false,
        reason: "Agent not found",
        currentBalance: 0,
        budgetRemaining: null,
      };
    }

    if (agent.status !== AgentStatus.ACTIVE) {
      return {
        canSpend: false,
        reason: `Agent is not active (status: ${agent.status})`,
        currentBalance: agent.currentBalance,
        budgetRemaining: null,
      };
    }

    // Check balance
    if (agent.currentBalance < amount) {
      return {
        canSpend: false,
        reason: `Insufficient balance (${agent.currentBalance} < ${amount})`,
        currentBalance: agent.currentBalance,
        budgetRemaining: null,
      };
    }

    // Check budget limit
    if (agent.budgetPeriodLimit !== null) {
      const budgetRemaining = agent.budgetPeriodLimit - agent.budgetPeriodSpent;
      if (amount > budgetRemaining) {
        return {
          canSpend: false,
          reason: `Would exceed budget limit (remaining: ${budgetRemaining})`,
          currentBalance: agent.currentBalance,
          budgetRemaining,
        };
      }
    }

    return {
      canSpend: true,
      currentBalance: agent.currentBalance,
      budgetRemaining: agent.budgetPeriodLimit
        ? agent.budgetPeriodLimit - agent.budgetPeriodSpent
        : null,
    };
  }

  /**
   * Get agents approaching budget limit (>80% used)
   */
  async getAgentsNearBudgetLimit(orgId: string): Promise<BudgetStatus[]> {
    const agents = await this.agentRepository.find({
      where: {
        orgId,
        status: AgentStatus.ACTIVE,
        budgetPeriodLimit: MoreThan(0),
      },
    });

    const statuses: BudgetStatus[] = [];

    for (const agent of agents) {
      if (agent.budgetPeriodLimit) {
        const utilization = agent.budgetPeriodSpent / agent.budgetPeriodLimit;
        if (utilization >= 0.8) {
          statuses.push({
            agentId: agent.id,
            currentBalance: agent.currentBalance,
            budgetPeriodLimit: agent.budgetPeriodLimit,
            budgetPeriodSpent: agent.budgetPeriodSpent,
            budgetRemaining: agent.budgetPeriodLimit - agent.budgetPeriodSpent,
            budgetPeriodStart: agent.budgetPeriodStart,
            utilizationPercent: Math.round(utilization * 100),
          });
        }
      }
    }

    return statuses.sort((a, b) => (b.utilizationPercent || 0) - (a.utilizationPercent || 0));
  }
}
