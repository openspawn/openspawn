import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, MoreThanOrEqual } from "typeorm";

import { Agent, CreditTransaction } from "@openspawn/database";
import { CreditType, AgentStatus } from "@openspawn/shared-types";

export interface SpendingTrend {
  date: string;
  credits: number;
  debits: number;
  net: number;
}

export interface AgentSpendingSummary {
  agentId: string;
  agentName: string;
  level: number;
  currentBalance: number;
  totalEarned: number;
  totalSpent: number;
  transactionCount: number;
  avgTransactionSize: number;
  lastActivity: Date | null;
}

export interface TriggerBreakdown {
  triggerType: string;
  count: number;
  totalAmount: number;
  avgAmount: number;
}

export interface CreditAlert {
  agentId: string;
  agentName: string;
  alertType: "low_balance" | "high_velocity" | "budget_exceeded";
  message: string;
  severity: "warning" | "critical";
  value: number;
  threshold: number;
}

@Injectable()
export class CreditAnalyticsService {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(CreditTransaction)
    private readonly transactionRepository: Repository<CreditTransaction>,
  ) {}

  /**
   * Get spending trends over time
   */
  async getSpendingTrends(
    orgId: string,
    days = 30,
    agentId?: string,
  ): Promise<SpendingTrend[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const query = this.transactionRepository
      .createQueryBuilder("tx")
      .select("DATE(tx.created_at)", "date")
      .addSelect(
        "SUM(CASE WHEN tx.type = 'CREDIT' THEN tx.amount ELSE 0 END)",
        "credits"
      )
      .addSelect(
        "SUM(CASE WHEN tx.type = 'DEBIT' THEN tx.amount ELSE 0 END)",
        "debits"
      )
      .where("tx.org_id = :orgId", { orgId })
      .andWhere("tx.created_at >= :startDate", { startDate })
      .groupBy("DATE(tx.created_at)")
      .orderBy("DATE(tx.created_at)", "ASC");

    if (agentId) {
      query.andWhere("tx.agent_id = :agentId", { agentId });
    }

    const results = await query.getRawMany();

    return results.map((r) => ({
      date: r.date,
      credits: parseInt(r.credits, 10) || 0,
      debits: parseInt(r.debits, 10) || 0,
      net: (parseInt(r.credits, 10) || 0) - (parseInt(r.debits, 10) || 0),
    }));
  }

  /**
   * Get spending summary by agent
   */
  async getAgentSpendingSummary(orgId: string): Promise<AgentSpendingSummary[]> {
    const agents = await this.agentRepository.find({
      where: { orgId, status: AgentStatus.ACTIVE },
    });

    const summaries: AgentSpendingSummary[] = [];

    for (const agent of agents) {
      const stats = await this.transactionRepository
        .createQueryBuilder("tx")
        .select("COUNT(*)", "count")
        .addSelect(
          "SUM(CASE WHEN tx.type = 'CREDIT' THEN tx.amount ELSE 0 END)",
          "earned"
        )
        .addSelect(
          "SUM(CASE WHEN tx.type = 'DEBIT' THEN tx.amount ELSE 0 END)",
          "spent"
        )
        .addSelect("MAX(tx.created_at)", "lastActivity")
        .where("tx.agent_id = :agentId", { agentId: agent.id })
        .getRawOne();

      const count = parseInt(stats.count, 10) || 0;
      const earned = parseInt(stats.earned, 10) || 0;
      const spent = parseInt(stats.spent, 10) || 0;

      summaries.push({
        agentId: agent.id,
        agentName: agent.name,
        level: agent.level,
        currentBalance: agent.currentBalance,
        totalEarned: earned,
        totalSpent: spent,
        transactionCount: count,
        avgTransactionSize: count > 0 ? Math.round((earned + spent) / count) : 0,
        lastActivity: stats.lastActivity ? new Date(stats.lastActivity) : null,
      });
    }

    // Sort by total spent (descending)
    return summaries.sort((a, b) => b.totalSpent - a.totalSpent);
  }

  /**
   * Get breakdown by trigger type
   */
  async getTriggerBreakdown(
    orgId: string,
    type?: CreditType,
    days = 30,
  ): Promise<TriggerBreakdown[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const query = this.transactionRepository
      .createQueryBuilder("tx")
      .select("COALESCE(tx.trigger_type, 'unknown')", "triggerType")
      .addSelect("COUNT(*)", "count")
      .addSelect("SUM(tx.amount)", "totalAmount")
      .where("tx.org_id = :orgId", { orgId })
      .andWhere("tx.created_at >= :startDate", { startDate })
      .groupBy("tx.trigger_type")
      .orderBy("SUM(tx.amount)", "DESC");

    if (type) {
      query.andWhere("tx.type = :type", { type });
    }

    const results = await query.getRawMany();

    return results.map((r) => ({
      triggerType: r.triggerType,
      count: parseInt(r.count, 10),
      totalAmount: parseInt(r.totalAmount, 10),
      avgAmount: Math.round(parseInt(r.totalAmount, 10) / parseInt(r.count, 10)),
    }));
  }

  /**
   * Get credit alerts (low balance, high velocity, budget exceeded)
   */
  async getAlerts(orgId: string): Promise<CreditAlert[]> {
    const alerts: CreditAlert[] = [];

    const agents = await this.agentRepository.find({
      where: { orgId, status: AgentStatus.ACTIVE },
    });

    for (const agent of agents) {
      // Low balance alert (< 100 credits)
      if (agent.currentBalance < 100) {
        alerts.push({
          agentId: agent.id,
          agentName: agent.name,
          alertType: "low_balance",
          message: `Balance critically low: ${agent.currentBalance} credits`,
          severity: agent.currentBalance < 20 ? "critical" : "warning",
          value: agent.currentBalance,
          threshold: 100,
        });
      }

      // Budget exceeded alert
      if (
        agent.budgetPeriodLimit &&
        agent.budgetPeriodSpent > agent.budgetPeriodLimit
      ) {
        alerts.push({
          agentId: agent.id,
          agentName: agent.name,
          alertType: "budget_exceeded",
          message: `Budget exceeded: ${agent.budgetPeriodSpent}/${agent.budgetPeriodLimit}`,
          severity: "critical",
          value: agent.budgetPeriodSpent,
          threshold: agent.budgetPeriodLimit,
        });
      }

      // High velocity alert (spent > 500 credits in last hour)
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const recentSpending = await this.transactionRepository
        .createQueryBuilder("tx")
        .select("SUM(tx.amount)", "total")
        .where("tx.agent_id = :agentId", { agentId: agent.id })
        .andWhere("tx.type = :type", { type: CreditType.DEBIT })
        .andWhere("tx.created_at >= :since", { since: oneHourAgo })
        .getRawOne();

      const hourlySpent = parseInt(recentSpending?.total, 10) || 0;
      if (hourlySpent > 500) {
        alerts.push({
          agentId: agent.id,
          agentName: agent.name,
          alertType: "high_velocity",
          message: `High spending velocity: ${hourlySpent} credits in last hour`,
          severity: hourlySpent > 1000 ? "critical" : "warning",
          value: hourlySpent,
          threshold: 500,
        });
      }
    }

    // Sort by severity (critical first)
    return alerts.sort((a, b) => {
      if (a.severity === b.severity) return 0;
      return a.severity === "critical" ? -1 : 1;
    });
  }

  /**
   * Get top spenders
   */
  async getTopSpenders(orgId: string, days = 7, limit = 10): Promise<{
    agentId: string;
    agentName: string;
    totalSpent: number;
  }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const results = await this.transactionRepository
      .createQueryBuilder("tx")
      .select("tx.agent_id", "agentId")
      .addSelect("SUM(tx.amount)", "totalSpent")
      .where("tx.org_id = :orgId", { orgId })
      .andWhere("tx.type = :type", { type: CreditType.DEBIT })
      .andWhere("tx.created_at >= :startDate", { startDate })
      .groupBy("tx.agent_id")
      .orderBy("SUM(tx.amount)", "DESC")
      .limit(limit)
      .getRawMany();

    // Get agent names
    const agentIds = results.map((r) => r.agentId);
    const agents = await this.agentRepository.findByIds(agentIds);
    const agentMap = new Map(agents.map((a) => [a.id, a.name]));

    return results.map((r) => ({
      agentId: r.agentId,
      agentName: agentMap.get(r.agentId) || "Unknown",
      totalSpent: parseInt(r.totalSpent, 10),
    }));
  }

  /**
   * Get org-wide stats
   */
  async getOrgStats(orgId: string): Promise<{
    totalAgents: number;
    activeAgents: number;
    totalBalance: number;
    totalTransactions: number;
    totalEarned: number;
    totalSpent: number;
    avgBalance: number;
  }> {
    const agents = await this.agentRepository.find({ where: { orgId } });
    const activeAgents = agents.filter((a) => a.status === AgentStatus.ACTIVE);
    const totalBalance = agents.reduce((sum, a) => sum + a.currentBalance, 0);

    const txStats = await this.transactionRepository
      .createQueryBuilder("tx")
      .select("COUNT(*)", "count")
      .addSelect(
        "SUM(CASE WHEN tx.type = 'CREDIT' THEN tx.amount ELSE 0 END)",
        "earned"
      )
      .addSelect(
        "SUM(CASE WHEN tx.type = 'DEBIT' THEN tx.amount ELSE 0 END)",
        "spent"
      )
      .where("tx.org_id = :orgId", { orgId })
      .getRawOne();

    return {
      totalAgents: agents.length,
      activeAgents: activeAgents.length,
      totalBalance,
      totalTransactions: parseInt(txStats.count, 10) || 0,
      totalEarned: parseInt(txStats.earned, 10) || 0,
      totalSpent: parseInt(txStats.spent, 10) || 0,
      avgBalance: agents.length > 0 ? Math.round(totalBalance / agents.length) : 0,
    };
  }
}
