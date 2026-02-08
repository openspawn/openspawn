import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";

import { Agent, AgentCapability, Task } from "@openspawn/database";
import { AgentStatus, Proficiency } from "@openspawn/shared-types";

import { EventsService } from "../events";

export interface RoutingCandidate {
  agentId: string;
  agentName: string;
  level: number;
  matchedCapabilities: string[];
  missingCapabilities: string[];
  coveragePercent: number;
  avgProficiency: number;
  currentTaskCount: number;
  score: number;
}

export interface RoutingResult {
  taskId: string;
  requiredCapabilities: string[];
  candidates: RoutingCandidate[];
  bestMatch: RoutingCandidate | null;
  autoAssigned: boolean;
}

// Proficiency weights for scoring
const PROFICIENCY_WEIGHTS: Record<Proficiency, number> = {
  [Proficiency.BASIC]: 1,
  [Proficiency.STANDARD]: 2,
  [Proficiency.EXPERT]: 3,
};

@Injectable()
export class TaskRoutingService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(AgentCapability)
    private readonly capabilityRepository: Repository<AgentCapability>,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Get required capabilities for a task from its metadata
   */
  private getRequiredCapabilities(task: Task): string[] {
    const metadata = task.metadata as Record<string, unknown>;
    const caps = metadata?.requiredCapabilities;
    if (Array.isArray(caps)) {
      return caps.map((c) => String(c).toLowerCase().trim());
    }
    return [];
  }

  /**
   * Find candidates for a task based on required capabilities
   */
  async findCandidates(
    orgId: string,
    taskId: string,
    options?: {
      minCoverage?: number;
      excludeAgentIds?: string[];
      maxResults?: number;
    },
  ): Promise<RoutingResult> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, orgId },
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    const requiredCapabilities = this.getRequiredCapabilities(task);

    if (requiredCapabilities.length === 0) {
      return {
        taskId,
        requiredCapabilities: [],
        candidates: [],
        bestMatch: null,
        autoAssigned: false,
      };
    }

    // Get all agents with relevant capabilities
    const capabilities = await this.capabilityRepository.find({
      where: {
        orgId,
        capability: In(requiredCapabilities),
      },
    });

    // Get unique agent IDs
    const agentIds = [...new Set(capabilities.map((c) => c.agentId))];

    if (agentIds.length === 0) {
      return {
        taskId,
        requiredCapabilities,
        candidates: [],
        bestMatch: null,
        autoAssigned: false,
      };
    }

    // Get agent details
    const agents = await this.agentRepository.find({
      where: { id: In(agentIds), orgId, status: AgentStatus.ACTIVE },
    });

    const agentMap = new Map(agents.map((a) => [a.id, a]));

    // Filter excluded agents
    const excludeSet = new Set(options?.excludeAgentIds || []);

    // Get current task counts for workload balancing
    const taskCounts = await this.taskRepository
      .createQueryBuilder("task")
      .select("task.assignee_id", "assigneeId")
      .addSelect("COUNT(*)", "count")
      .where("task.org_id = :orgId", { orgId })
      .andWhere("task.assignee_id IN (:...agentIds)", { agentIds })
      .andWhere("task.status NOT IN (:...terminal)", {
        terminal: ["done", "cancelled"],
      })
      .groupBy("task.assignee_id")
      .getRawMany();

    const taskCountMap = new Map(
      taskCounts.map((r) => [r.assigneeId, parseInt(r.count, 10)])
    );

    // Group capabilities by agent
    const agentCapMap = new Map<string, AgentCapability[]>();
    for (const cap of capabilities) {
      if (excludeSet.has(cap.agentId)) continue;
      if (!agentMap.has(cap.agentId)) continue;

      const existing = agentCapMap.get(cap.agentId) || [];
      existing.push(cap);
      agentCapMap.set(cap.agentId, existing);
    }

    // Score each candidate
    const candidates: RoutingCandidate[] = [];

    for (const [agentId, agentCaps] of agentCapMap) {
      const agent = agentMap.get(agentId)!;
      const matchedCapabilities = agentCaps.map((c) => c.capability);
      const missingCapabilities = requiredCapabilities.filter(
        (c) => !matchedCapabilities.includes(c)
      );

      const coveragePercent = Math.round(
        (matchedCapabilities.length / requiredCapabilities.length) * 100
      );

      // Skip if below minimum coverage
      if (options?.minCoverage && coveragePercent < options.minCoverage) {
        continue;
      }

      // Calculate average proficiency
      const proficiencySum = agentCaps.reduce(
        (sum, c) => sum + PROFICIENCY_WEIGHTS[c.proficiency],
        0
      );
      const avgProficiency = proficiencySum / agentCaps.length;

      const currentTaskCount = taskCountMap.get(agentId) || 0;

      // Score formula:
      // - Coverage: 40% weight (0-100 scaled to 0-40)
      // - Proficiency: 30% weight (1-3 scaled to 0-30)
      // - Level: 15% weight (1-10 scaled to 0-15)
      // - Workload: 15% weight (inverse of task count)
      const coverageScore = coveragePercent * 0.4;
      const proficiencyScore = ((avgProficiency - 1) / 2) * 30;
      const levelScore = ((agent.level - 1) / 9) * 15;
      const workloadScore = Math.max(0, 15 - currentTaskCount * 1.5);

      const score = Math.round(
        coverageScore + proficiencyScore + levelScore + workloadScore
      );

      candidates.push({
        agentId,
        agentName: agent.name,
        level: agent.level,
        matchedCapabilities,
        missingCapabilities,
        coveragePercent,
        avgProficiency,
        currentTaskCount,
        score,
      });
    }

    // Sort by score (descending)
    candidates.sort((a, b) => b.score - a.score);

    // Limit results
    const limitedCandidates = options?.maxResults
      ? candidates.slice(0, options.maxResults)
      : candidates;

    const bestMatch = limitedCandidates.length > 0 ? limitedCandidates[0] : null;

    return {
      taskId,
      requiredCapabilities,
      candidates: limitedCandidates,
      bestMatch,
      autoAssigned: false,
    };
  }

  /**
   * Auto-assign a task to the best matching agent
   */
  async autoAssign(
    orgId: string,
    actorId: string,
    taskId: string,
    options?: {
      minCoverage?: number;
      excludeAgentIds?: string[];
    },
  ): Promise<RoutingResult> {
    const result = await this.findCandidates(orgId, taskId, {
      ...options,
      maxResults: 1,
    });

    if (!result.bestMatch) {
      return result;
    }

    // Assign the task
    const task = await this.taskRepository.findOne({
      where: { id: taskId, orgId },
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    const previousAssignee = task.assigneeId;
    task.assigneeId = result.bestMatch.agentId;
    await this.taskRepository.save(task);

    await this.eventsService.emit({
      orgId,
      type: "task.auto_assigned",
      actorId,
      entityType: "task",
      entityId: taskId,
      data: {
        previousAssignee,
        newAssignee: result.bestMatch.agentId,
        score: result.bestMatch.score,
        coveragePercent: result.bestMatch.coveragePercent,
        matchedCapabilities: result.bestMatch.matchedCapabilities,
      },
    });

    return {
      ...result,
      autoAssigned: true,
    };
  }

  /**
   * Get suggested assignees for a set of capabilities (without a task)
   */
  async suggestAgents(
    orgId: string,
    capabilities: string[],
    limit = 5,
  ): Promise<RoutingCandidate[]> {
    const normalized = capabilities.map((c) => c.toLowerCase().trim());

    // Get all agents with relevant capabilities
    const agentCaps = await this.capabilityRepository.find({
      where: {
        orgId,
        capability: In(normalized),
      },
    });

    const agentIds = [...new Set(agentCaps.map((c) => c.agentId))];

    if (agentIds.length === 0) {
      return [];
    }

    const agents = await this.agentRepository.find({
      where: { id: In(agentIds), orgId, status: AgentStatus.ACTIVE },
    });

    const agentMap = new Map(agents.map((a) => [a.id, a]));

    // Group by agent
    const agentCapMap = new Map<string, AgentCapability[]>();
    for (const cap of agentCaps) {
      if (!agentMap.has(cap.agentId)) continue;
      const existing = agentCapMap.get(cap.agentId) || [];
      existing.push(cap);
      agentCapMap.set(cap.agentId, existing);
    }

    const candidates: RoutingCandidate[] = [];

    for (const [agentId, caps] of agentCapMap) {
      const agent = agentMap.get(agentId)!;
      const matchedCapabilities = caps.map((c) => c.capability);
      const missingCapabilities = normalized.filter(
        (c) => !matchedCapabilities.includes(c)
      );

      const coveragePercent = Math.round(
        (matchedCapabilities.length / normalized.length) * 100
      );

      const proficiencySum = caps.reduce(
        (sum, c) => sum + PROFICIENCY_WEIGHTS[c.proficiency],
        0
      );
      const avgProficiency = proficiencySum / caps.length;

      const score = Math.round(coveragePercent * 0.6 + avgProficiency * 10 + agent.level);

      candidates.push({
        agentId,
        agentName: agent.name,
        level: agent.level,
        matchedCapabilities,
        missingCapabilities,
        coveragePercent,
        avgProficiency,
        currentTaskCount: 0,
        score,
      });
    }

    candidates.sort((a, b) => b.score - a.score);

    return candidates.slice(0, limit);
  }
}
