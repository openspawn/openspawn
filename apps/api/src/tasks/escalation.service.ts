import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan, In, Not, IsNull } from "typeorm";

import { Agent, Escalation, Task } from "@openspawn/database";
import {
  AgentStatus,
  EscalationReason,
  ESCALATION_THRESHOLDS,
  EventSeverity,
  TaskPriority,
  TaskStatus,
} from "@openspawn/shared-types";

import { EventsService } from "../events";

@Injectable()
export class EscalationService {
  constructor(
    @InjectRepository(Escalation)
    private readonly escalationRepo: Repository<Escalation>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Agent)
    private readonly agentRepo: Repository<Agent>,
    private readonly eventsService: EventsService
  ) {}

  /**
   * Escalate a task to a higher-level agent
   */
  async escalateTask(params: {
    orgId: string;
    taskId: string;
    reason: EscalationReason;
    notes?: string;
    isAutomatic?: boolean;
    targetAgentId?: string; // Specific agent to escalate to
  }): Promise<Escalation> {
    const task = await this.taskRepo.findOne({
      where: { id: params.taskId, orgId: params.orgId },
      relations: ["assignee"],
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    if (!task.assigneeId) {
      throw new Error("Cannot escalate unassigned task");
    }

    const fromAgent = task.assignee!;
    let toAgent: Agent;

    if (params.targetAgentId) {
      // Escalate to specific agent
      const target = await this.agentRepo.findOneBy({ id: params.targetAgentId });
      if (!target) throw new NotFoundException("Target agent not found");
      toAgent = target;
    } else if (fromAgent.parentId) {
      // Escalate to parent
      const parent = await this.agentRepo.findOneBy({ id: fromAgent.parentId });
      if (!parent) throw new Error("Parent agent not found");
      toAgent = parent;
    } else {
      // Find any higher-level agent
      const higherAgent = await this.agentRepo.findOne({
        where: {
          orgId: params.orgId,
          level: fromAgent.level + 1,
          status: AgentStatus.ACTIVE,
        },
        order: { tasksCompleted: "DESC" }, // Prefer experienced agents
      });

      if (!higherAgent) {
        throw new Error("No higher-level agent available for escalation");
      }
      toAgent = higherAgent;
    }

    const levelsEscalated = toAgent.level - fromAgent.level;

    // Create escalation record
    const escalation = this.escalationRepo.create({
      orgId: params.orgId,
      taskId: params.taskId,
      fromAgentId: fromAgent.id,
      toAgentId: toAgent.id,
      reason: params.reason,
      levelsEscalated,
      notes: params.notes ?? null,
      isAutomatic: params.isAutomatic ?? true,
    });
    await this.escalationRepo.save(escalation);

    // Reassign the task
    task.assigneeId = toAgent.id;
    await this.taskRepo.save(task);

    // Emit event
    await this.eventsService.emit({
      orgId: params.orgId,
      type: "task.escalated",
      actorId: fromAgent.id,
      entityType: "task",
      entityId: params.taskId,
      severity: EventSeverity.WARNING,
      data: {
        reason: params.reason,
        fromAgentId: fromAgent.id,
        fromAgentName: fromAgent.name,
        toAgentId: toAgent.id,
        toAgentName: toAgent.name,
        levelsEscalated,
        isAutomatic: params.isAutomatic ?? true,
      },
    });

    return escalation;
  }

  /**
   * Check for tasks that need automatic escalation
   * Run this as a scheduled task
   */
  async checkForAutoEscalations(orgId: string): Promise<number> {
    let escalatedCount = 0;

    // Find blocked tasks
    const blockedTasks = await this.taskRepo.find({
      where: {
        orgId,
        status: TaskStatus.BLOCKED,
        assigneeId: In(await this.getActiveAgentIds(orgId)),
      },
    });

    const now = new Date();

    for (const task of blockedTasks) {
      const thresholdHours = this.getThresholdForPriority(task.priority);
      const blockedSince = task.updatedAt;
      const hoursBlocked = (now.getTime() - blockedSince.getTime()) / (1000 * 60 * 60);

      if (hoursBlocked >= thresholdHours) {
        try {
          await this.escalateTask({
            orgId,
            taskId: task.id,
            reason: EscalationReason.BLOCKED_TIMEOUT,
            notes: `Auto-escalated after ${Math.round(hoursBlocked)} hours blocked`,
            isAutomatic: true,
          });
          escalatedCount++;
        } catch (error) {
          // Log but continue with other tasks
          console.error(`Failed to escalate task ${task.id}:`, error);
        }
      }
    }

    // Check for SLA breaches (tasks past due date)
    const overdueTasks = await this.taskRepo.find({
      where: {
        orgId,
        dueDate: LessThan(now),
        status: In([TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED]),
        assigneeId: In(await this.getActiveAgentIds(orgId)),
      },
    });

    for (const task of overdueTasks) {
      // Check if already escalated for SLA
      const existingEscalation = await this.escalationRepo.findOne({
        where: {
          taskId: task.id,
          reason: EscalationReason.SLA_BREACH,
          resolvedAt: IsNull(),
        },
      });

      if (!existingEscalation) {
        try {
          await this.escalateTask({
            orgId,
            taskId: task.id,
            reason: EscalationReason.SLA_BREACH,
            notes: `Task past due date: ${task.dueDate?.toISOString()}`,
            isAutomatic: true,
          });
          escalatedCount++;
        } catch (error) {
          console.error(`Failed to escalate task ${task.id}:`, error);
        }
      }
    }

    return escalatedCount;
  }

  /**
   * Mark an escalation as resolved
   */
  async resolveEscalation(escalationId: string): Promise<Escalation> {
    const escalation = await this.escalationRepo.findOneByOrFail({ id: escalationId });
    escalation.resolvedAt = new Date();
    return this.escalationRepo.save(escalation);
  }

  /**
   * Get escalation history for a task
   */
  async getTaskEscalations(taskId: string): Promise<Escalation[]> {
    return this.escalationRepo.find({
      where: { taskId },
      relations: ["fromAgent", "toAgent"],
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Get all open escalations for an org
   */
  async getOpenEscalations(orgId: string): Promise<Escalation[]> {
    return this.escalationRepo.find({
      where: { orgId, resolvedAt: IsNull() },
      relations: ["task", "fromAgent", "toAgent"],
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Get escalation stats for an agent
   */
  async getAgentEscalationStats(agentId: string): Promise<{
    escalatedFrom: number;
    escalatedTo: number;
    resolved: number;
    pending: number;
  }> {
    const escalatedFrom = await this.escalationRepo.count({
      where: { fromAgentId: agentId },
    });

    const escalatedTo = await this.escalationRepo.count({
      where: { toAgentId: agentId },
    });

    const resolved = await this.escalationRepo.count({
      where: { toAgentId: agentId, resolvedAt: Not(IsNull()) },
    });

    const pending = escalatedTo - resolved;

    return { escalatedFrom, escalatedTo, resolved, pending };
  }

  private getThresholdForPriority(priority: TaskPriority): number {
    return ESCALATION_THRESHOLDS[priority] || ESCALATION_THRESHOLDS.NORMAL;
  }

  private async getActiveAgentIds(orgId: string): Promise<string[]> {
    const agents = await this.agentRepo.find({
      where: { orgId, status: AgentStatus.ACTIVE },
      select: ["id"],
    });
    return agents.map((a) => a.id);
  }
}
