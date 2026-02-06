import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";

import { Agent, CreditRateConfig, CreditTransaction } from "@openspawn/database";
import { CreditType } from "@openspawn/shared-types";

import { EventsService } from "../events";

export interface SpendParams {
  orgId: string;
  agentId: string;
  amount: number;
  reason: string;
  triggerType?: string;
  sourceTaskId?: string;
  sourceAgentId?: string;
  idempotencyKey?: string;
}

export interface EarnParams {
  orgId: string;
  agentId: string;
  amount: number;
  reason: string;
  triggerType?: string;
  sourceTaskId?: string;
  sourceAgentId?: string;
}

export interface AdjustParams {
  orgId: string;
  agentId: string;
  amount: number;
  type: CreditType;
  reason: string;
  actorId: string;
}

@Injectable()
export class CreditsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(CreditTransaction)
    private readonly transactionRepository: Repository<CreditTransaction>,
    @InjectRepository(CreditRateConfig)
    private readonly rateConfigRepository: Repository<CreditRateConfig>,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Get agent's current balance
   */
  async getBalance(
    orgId: string,
    agentId: string,
  ): Promise<{ balance: number; budgetPeriodSpent: number; budgetPeriodLimit: number | null }> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId, orgId },
    });

    if (!agent) {
      throw new NotFoundException("Agent not found");
    }

    return {
      balance: agent.currentBalance,
      budgetPeriodSpent: agent.budgetPeriodSpent,
      budgetPeriodLimit: agent.budgetPeriodLimit,
    };
  }

  /**
   * Spend credits (debit) - atomic transaction
   */
  async spend(params: SpendParams): Promise<CreditTransaction> {
    const { orgId, agentId, amount, reason, triggerType, sourceTaskId, sourceAgentId } = params;

    if (amount <= 0) {
      throw new BadRequestException("Amount must be positive");
    }

    return this.dataSource.transaction(async (manager) => {
      // Lock agent row for update
      const agent = await manager
        .getRepository(Agent)
        .createQueryBuilder("agent")
        .setLock("pessimistic_write")
        .where("agent.id = :id AND agent.org_id = :orgId", { id: agentId, orgId })
        .getOne();

      if (!agent) {
        throw new NotFoundException("Agent not found");
      }

      // Check balance
      if (agent.currentBalance < amount) {
        throw new BadRequestException("Insufficient balance");
      }

      // Check budget limit if set
      if (agent.budgetPeriodLimit !== null) {
        if (agent.budgetPeriodSpent + amount > agent.budgetPeriodLimit) {
          throw new BadRequestException("Budget limit exceeded");
        }
      }

      // Create transaction record
      const transaction = manager.getRepository(CreditTransaction).create({
        orgId,
        agentId,
        type: CreditType.DEBIT,
        amount,
        reason,
        balanceAfter: agent.currentBalance - amount,
        triggerType,
        sourceTaskId,
        sourceAgentId,
      });

      const savedTransaction = await manager.getRepository(CreditTransaction).save(transaction);

      // Update agent balance
      await manager.getRepository(Agent).update(agentId, {
        currentBalance: agent.currentBalance - amount,
        budgetPeriodSpent: agent.budgetPeriodSpent + amount,
      });

      return savedTransaction;
    });
  }

  /**
   * Earn credits (credit) - atomic transaction
   */
  async earn(params: EarnParams): Promise<CreditTransaction> {
    const { orgId, agentId, amount, reason, triggerType, sourceTaskId, sourceAgentId } = params;

    if (amount <= 0) {
      throw new BadRequestException("Amount must be positive");
    }

    return this.dataSource.transaction(async (manager) => {
      // Lock agent row for update
      const agent = await manager
        .getRepository(Agent)
        .createQueryBuilder("agent")
        .setLock("pessimistic_write")
        .where("agent.id = :id AND agent.org_id = :orgId", { id: agentId, orgId })
        .getOne();

      if (!agent) {
        throw new NotFoundException("Agent not found");
      }

      // Create transaction record
      const transaction = manager.getRepository(CreditTransaction).create({
        orgId,
        agentId,
        type: CreditType.CREDIT,
        amount,
        reason,
        balanceAfter: agent.currentBalance + amount,
        triggerType,
        sourceTaskId,
        sourceAgentId,
      });

      const savedTransaction = await manager.getRepository(CreditTransaction).save(transaction);

      // Update agent balance
      await manager.getRepository(Agent).update(agentId, {
        currentBalance: agent.currentBalance + amount,
      });

      return savedTransaction;
    });
  }

  /**
   * Admin adjustment (credit or debit)
   */
  async adjust(params: AdjustParams): Promise<CreditTransaction> {
    const { orgId, agentId, amount, type, reason, actorId } = params;

    if (amount <= 0) {
      throw new BadRequestException("Amount must be positive");
    }

    return this.dataSource.transaction(async (manager) => {
      const agent = await manager
        .getRepository(Agent)
        .createQueryBuilder("agent")
        .setLock("pessimistic_write")
        .where("agent.id = :id AND agent.org_id = :orgId", { id: agentId, orgId })
        .getOne();

      if (!agent) {
        throw new NotFoundException("Agent not found");
      }

      const newBalance =
        type === CreditType.CREDIT ? agent.currentBalance + amount : agent.currentBalance - amount;

      if (newBalance < 0) {
        throw new BadRequestException("Adjustment would result in negative balance");
      }

      const transaction = manager.getRepository(CreditTransaction).create({
        orgId,
        agentId,
        type,
        amount,
        reason: `[Admin] ${reason}`,
        balanceAfter: newBalance,
        triggerType: "admin_adjustment",
        sourceAgentId: actorId,
      });

      const savedTransaction = await manager.getRepository(CreditTransaction).save(transaction);

      await manager.getRepository(Agent).update(agentId, {
        currentBalance: newBalance,
      });

      await this.eventsService.emit({
        orgId,
        type: "credit.adjusted",
        actorId,
        entityType: "agent",
        entityId: agentId,
        data: { amount, type, reason },
      });

      return savedTransaction;
    });
  }

  /**
   * Get transaction history
   */
  async getHistory(
    orgId: string,
    agentId: string,
    limit = 50,
    offset = 0,
  ): Promise<{ transactions: CreditTransaction[]; total: number }> {
    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: { orgId, agentId },
      order: { createdAt: "DESC" },
      take: limit,
      skip: offset,
    });

    return { transactions, total };
  }

  /**
   * Get rate config for a specific trigger type
   */
  async getRateConfig(orgId: string, triggerType: string): Promise<CreditRateConfig | null> {
    return this.rateConfigRepository.findOne({
      where: { orgId, triggerType },
    });
  }

  /**
   * Process LiteLLM callback for usage-based billing
   */
  async processLiteLLMCallback(
    orgId: string,
    agentId: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    callId: string,
  ): Promise<CreditTransaction | null> {
    // Get rate config for the model
    const rateConfig = await this.getRateConfig(orgId, `llm.${model}`);

    if (!rateConfig || rateConfig.amount === null) {
      // No rate config = free
      return null;
    }

    // Calculate cost based on tokens
    // Rate is stored as credits per 1M tokens
    const totalTokens = inputTokens + outputTokens;
    const cost = Math.ceil((totalTokens / 1_000_000) * rateConfig.amount);

    if (cost <= 0) {
      return null;
    }

    return this.spend({
      orgId,
      agentId,
      amount: cost,
      reason: `LLM usage: ${model} (${totalTokens} tokens)`,
      triggerType: "llm_call",
      idempotencyKey: callId,
    });
  }
}
