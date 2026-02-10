import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan, MoreThan } from "typeorm";

import { Agent, ReputationEvent } from "@openspawn/database";
import {
  EventSeverity,
  ReputationEventType,
  ReputationLevel,
  REPUTATION_IMPACT,
  getReputationLevel,
} from "@openspawn/shared-types";

import { EventsService } from "../events";

/** Promotion requirements by level */
const PROMOTION_REQUIREMENTS: Record<
  number,
  { minTrustScore: number; minTasksCompleted: number }
> = {
  1: { minTrustScore: 55, minTasksCompleted: 3 },
  2: { minTrustScore: 60, minTasksCompleted: 10 },
  3: { minTrustScore: 65, minTasksCompleted: 25 },
  4: { minTrustScore: 70, minTasksCompleted: 50 },
  5: { minTrustScore: 75, minTasksCompleted: 100 },
  6: { minTrustScore: 80, minTasksCompleted: 200 },
  7: { minTrustScore: 85, minTasksCompleted: 400 },
  8: { minTrustScore: 90, minTasksCompleted: 750 },
  9: { minTrustScore: 95, minTasksCompleted: 1500 },
};

@Injectable()
export class TrustService {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepo: Repository<Agent>,
    @InjectRepository(ReputationEvent)
    private readonly reputationRepo: Repository<ReputationEvent>,
    private readonly eventsService: EventsService
  ) {}

  /**
   * Record a reputation event and update agent's trust score
   */
  async recordEvent(params: {
    orgId: string;
    agentId: string;
    type: ReputationEventType;
    taskId?: string;
    triggeredBy?: string;
    reason?: string;
    customImpact?: number;
  }): Promise<ReputationEvent> {
    const agent = await this.agentRepo.findOneByOrFail({ id: params.agentId });
    const impact = params.customImpact ?? REPUTATION_IMPACT[params.type];

    const previousScore = agent.trustScore;
    const newScore = Math.max(0, Math.min(100, previousScore + impact));

    // Create the reputation event
    const event = this.reputationRepo.create({
      orgId: params.orgId,
      agentId: params.agentId,
      type: params.type,
      impact,
      previousScore,
      newScore,
      taskId: params.taskId ?? null,
      triggeredBy: params.triggeredBy ?? null,
      reason: params.reason ?? null,
    });
    await this.reputationRepo.save(event);

    // Update agent trust score and activity timestamp
    await this.agentRepo.update(params.agentId, {
      trustScore: newScore,
      lastActivityAt: new Date(),
    });

    // Log system event
    await this.eventsService.emit({
      orgId: params.orgId,
      type: "reputation.changed",
      actorId: params.triggeredBy ?? params.agentId,
      severity: impact >= 0 ? EventSeverity.INFO : EventSeverity.WARNING,
      entityType: "agent",
      entityId: params.agentId,
      data: {
        agentId: params.agentId,
        eventType: params.type,
        impact,
        previousScore,
        newScore,
        reputationLevel: getReputationLevel(newScore),
      },
    });

    return event;
  }

  /**
   * Record successful task completion
   */
  async recordTaskCompleted(params: {
    orgId: string;
    agentId: string;
    taskId: string;
    onTime: boolean;
  }): Promise<void> {
    // Record completion event
    await this.recordEvent({
      orgId: params.orgId,
      agentId: params.agentId,
      type: ReputationEventType.TASK_COMPLETED,
      taskId: params.taskId,
      reason: "Task completed successfully",
    });

    // Record on-time/late delivery
    await this.recordEvent({
      orgId: params.orgId,
      agentId: params.agentId,
      type: params.onTime
        ? ReputationEventType.ON_TIME_DELIVERY
        : ReputationEventType.LATE_DELIVERY,
      taskId: params.taskId,
    });

    // Update task counters
    await this.agentRepo.increment({ id: params.agentId }, "tasksCompleted", 1);
    await this.agentRepo.increment({ id: params.agentId }, "tasksSuccessful", 1);

    // Check for auto-promotion
    await this.checkAutoPromotion(params.agentId);
  }

  /**
   * Record task failure
   */
  async recordTaskFailed(params: {
    orgId: string;
    agentId: string;
    taskId: string;
    reason?: string;
  }): Promise<void> {
    await this.recordEvent({
      orgId: params.orgId,
      agentId: params.agentId,
      type: ReputationEventType.TASK_FAILED,
      taskId: params.taskId,
      reason: params.reason,
    });

    // Increment completed but not successful
    await this.agentRepo.increment({ id: params.agentId }, "tasksCompleted", 1);
  }

  /**
   * Record task sent back for rework
   */
  async recordTaskRework(params: {
    orgId: string;
    agentId: string;
    taskId: string;
    triggeredBy: string;
    reason?: string;
  }): Promise<void> {
    await this.recordEvent({
      orgId: params.orgId,
      agentId: params.agentId,
      type: ReputationEventType.TASK_REWORK,
      taskId: params.taskId,
      triggeredBy: params.triggeredBy,
      reason: params.reason,
    });
  }

  /**
   * Award quality bonus from supervisor
   */
  async awardQualityBonus(params: {
    orgId: string;
    agentId: string;
    awardedBy: string;
    reason: string;
    bonusAmount?: number;
  }): Promise<ReputationEvent> {
    return this.recordEvent({
      orgId: params.orgId,
      agentId: params.agentId,
      type: ReputationEventType.QUALITY_BONUS,
      triggeredBy: params.awardedBy,
      reason: params.reason,
      customImpact: params.bonusAmount,
    });
  }

  /**
   * Apply quality penalty from supervisor
   */
  async applyQualityPenalty(params: {
    orgId: string;
    agentId: string;
    appliedBy: string;
    reason: string;
    penaltyAmount?: number;
  }): Promise<ReputationEvent> {
    return this.recordEvent({
      orgId: params.orgId,
      agentId: params.agentId,
      type: ReputationEventType.QUALITY_PENALTY,
      triggeredBy: params.appliedBy,
      reason: params.reason,
      customImpact: params.penaltyAmount
        ? -Math.abs(params.penaltyAmount)
        : undefined,
    });
  }

  /**
   * Check if agent qualifies for automatic promotion
   */
  async checkAutoPromotion(agentId: string): Promise<boolean> {
    const agent = await this.agentRepo.findOneByOrFail({ id: agentId });

    // Can't auto-promote beyond L9
    if (agent.level >= 9) return false;

    const requirements = PROMOTION_REQUIREMENTS[agent.level];
    if (!requirements) return false;

    // Check if agent meets requirements
    if (
      agent.trustScore >= requirements.minTrustScore &&
      agent.tasksCompleted >= requirements.minTasksCompleted
    ) {
      // Check cooldown (at least 7 days since last promotion)
      if (agent.lastPromotionAt) {
        const daysSincePromotion =
          (Date.now() - agent.lastPromotionAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSincePromotion < 7) return false;
      }

      // Promote!
      await this.promoteAgent(agent);
      return true;
    }

    return false;
  }

  /**
   * Promote an agent to the next level
   */
  async promoteAgent(agent: Agent): Promise<void> {
    const newLevel = agent.level + 1;

    await this.agentRepo.update(agent.id, {
      level: newLevel,
      lastPromotionAt: new Date(),
    });

    await this.recordEvent({
      orgId: agent.orgId,
      agentId: agent.id,
      type: ReputationEventType.LEVEL_UP,
      reason: `Automatically promoted from L${agent.level} to L${newLevel}`,
    });

    await this.eventsService.emit({
      orgId: agent.orgId,
      type: "agent.promoted",
      actorId: agent.id,
      severity: EventSeverity.INFO,
      entityType: "agent",
      entityId: agent.id,
      data: {
        agentId: agent.id,
        previousLevel: agent.level,
        newLevel,
        trustScore: agent.trustScore,
        tasksCompleted: agent.tasksCompleted,
      },
    });
  }

  /**
   * Demote an agent (usually manual action)
   */
  async demoteAgent(params: {
    agentId: string;
    demotedBy: string;
    reason: string;
  }): Promise<void> {
    const agent = await this.agentRepo.findOneByOrFail({ id: params.agentId });

    if (agent.level <= 1) {
      throw new Error("Cannot demote agent below level 1");
    }

    const newLevel = agent.level - 1;

    await this.agentRepo.update(agent.id, { level: newLevel });

    await this.recordEvent({
      orgId: agent.orgId,
      agentId: agent.id,
      type: ReputationEventType.LEVEL_DOWN,
      triggeredBy: params.demotedBy,
      reason: params.reason,
    });

    await this.eventsService.emit({
      orgId: agent.orgId,
      type: "agent.demoted",
      actorId: params.demotedBy,
      severity: EventSeverity.WARNING,
      entityType: "agent",
      entityId: agent.id,
      data: {
        agentId: agent.id,
        previousLevel: agent.level,
        newLevel,
        reason: params.reason,
      },
    });
  }

  /**
   * Get agent's reputation summary
   */
  async getReputationSummary(agentId: string): Promise<{
    trustScore: number;
    reputationLevel: ReputationLevel;
    tasksCompleted: number;
    tasksSuccessful: number;
    successRate: number;
    lastActivityAt: Date | null;
    promotionProgress: {
      currentLevel: number;
      nextLevel: number | null;
      trustScoreRequired: number | null;
      tasksRequired: number | null;
      trustScoreProgress: number;
      tasksProgress: number;
    } | null;
  }> {
    const agent = await this.agentRepo.findOneByOrFail({ id: agentId });
    const successRate =
      agent.tasksCompleted > 0
        ? Math.round((agent.tasksSuccessful / agent.tasksCompleted) * 100)
        : 100;

    let promotionProgress = null;
    if (agent.level < 9) {
      const requirements = PROMOTION_REQUIREMENTS[agent.level];
      if (requirements) {
        promotionProgress = {
          currentLevel: agent.level,
          nextLevel: agent.level + 1,
          trustScoreRequired: requirements.minTrustScore,
          tasksRequired: requirements.minTasksCompleted,
          trustScoreProgress: Math.min(
            100,
            Math.round((agent.trustScore / requirements.minTrustScore) * 100)
          ),
          tasksProgress: Math.min(
            100,
            Math.round(
              (agent.tasksCompleted / requirements.minTasksCompleted) * 100
            )
          ),
        };
      }
    }

    return {
      trustScore: agent.trustScore,
      reputationLevel: getReputationLevel(agent.trustScore),
      tasksCompleted: agent.tasksCompleted,
      tasksSuccessful: agent.tasksSuccessful,
      successRate,
      lastActivityAt: agent.lastActivityAt,
      promotionProgress,
    };
  }

  /**
   * Get reputation history for an agent
   */
  async getReputationHistory(
    agentId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ events: ReputationEvent[]; total: number }> {
    const [events, total] = await this.reputationRepo.findAndCount({
      where: { agentId },
      order: { createdAt: "DESC" },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    });

    return { events, total };
  }

  /**
   * Apply inactivity decay to all agents who haven't been active
   * Run this as a scheduled task (e.g., weekly)
   */
  async applyInactivityDecay(daysThreshold = 14): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

    const inactiveAgents = await this.agentRepo.find({
      where: {
        lastActivityAt: LessThan(cutoffDate),
        trustScore: MoreThan(30), // Don't decay below NEW level
      },
    });

    for (const agent of inactiveAgents) {
      await this.recordEvent({
        orgId: agent.orgId,
        agentId: agent.id,
        type: ReputationEventType.INACTIVITY_DECAY,
        reason: `No activity for ${daysThreshold}+ days`,
      });
    }

    return inactiveAgents.length;
  }

  /**
   * Get leaderboard of top agents by trust score
   */
  async getLeaderboard(
    orgId: string,
    limit = 10
  ): Promise<
    Array<{
      id: string;
      agentId: string;
      name: string;
      level: number;
      trustScore: number;
      reputationLevel: ReputationLevel;
      tasksCompleted: number;
    }>
  > {
    const agents = await this.agentRepo.find({
      where: { orgId },
      order: { trustScore: "DESC", tasksCompleted: "DESC" },
      take: limit,
    });

    return agents.map((agent) => ({
      id: agent.id,
      agentId: agent.agentId,
      name: agent.name,
      level: agent.level,
      trustScore: agent.trustScore,
      reputationLevel: getReputationLevel(agent.trustScore),
      tasksCompleted: agent.tasksCompleted,
    }));
  }
}
