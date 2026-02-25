import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Agent } from "@openspawn/database";
import { AgentStatus } from "@openspawn/shared-types";

import { EventsService } from "../events";

/**
 * Capacity limits per agent level
 * Higher level agents can manage more sub-agents
 */
const LEVEL_CAPACITY: Record<number, number> = {
  1: 0,   // Workers can't spawn agents
  2: 0,
  3: 2,   // Team leads can have 2 workers
  4: 3,
  5: 5,   // Managers can have 5 reports
  6: 8,
  7: 12,  // Directors can have 12
  8: 20,
  9: 50,  // VPs can have 50
  10: 100, // L10 (Founder) can have 100
};

export interface SpawnAgentDto {
  agentId: string;
  name: string;
  level?: number;
  model?: string;
  budgetPeriodLimit?: number;
  capabilities?: { capability: string; proficiency: string }[];
}

@Injectable()
export class AgentOnboardingService {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Get the maximum number of children an agent can have based on level
   */
  getCapacityForLevel(level: number): number {
    return LEVEL_CAPACITY[level] || 0;
  }

  /**
   * Count current active children of an agent
   */
  async countChildren(agentId: string): Promise<number> {
    return this.agentRepository.count({
      where: {
        parentId: agentId,
        status: AgentStatus.ACTIVE,
      },
    });
  }

  /**
   * Check if an agent can spawn more children
   */
  async canSpawnChild(parentId: string): Promise<{ canSpawn: boolean; reason?: string; current: number; max: number }> {
    const parent = await this.agentRepository.findOne({ where: { id: parentId } });
    if (!parent) {
      return { canSpawn: false, reason: "Parent agent not found", current: 0, max: 0 };
    }

    const maxCapacity = parent.maxChildren || this.getCapacityForLevel(parent.level);
    const currentChildren = await this.countChildren(parentId);

    if (currentChildren >= maxCapacity) {
      return {
        canSpawn: false,
        reason: `Agent at capacity (${currentChildren}/${maxCapacity})`,
        current: currentChildren,
        max: maxCapacity,
      };
    }

    return { canSpawn: true, current: currentChildren, max: maxCapacity };
  }

  /**
   * Spawn a new agent as a child of the parent
   * New agents start in PENDING status until activated
   */
  async spawnAgent(
    orgId: string,
    parentId: string,
    dto: SpawnAgentDto,
    hmacSecretEnc: Buffer,
  ): Promise<Agent> {
    // Verify capacity
    const capacityCheck = await this.canSpawnChild(parentId);
    if (!capacityCheck.canSpawn) {
      throw new ForbiddenException(capacityCheck.reason);
    }

    const parent = await this.agentRepository.findOne({ where: { id: parentId } });
    if (!parent) {
      throw new NotFoundException("Parent agent not found");
    }

    // Child level must be less than parent level
    const childLevel = dto.level || parent.level - 1;
    if (childLevel >= parent.level) {
      throw new BadRequestException(
        `Child level (${childLevel}) must be less than parent level (${parent.level})`
      );
    }

    if (childLevel < 1) {
      throw new BadRequestException("Agent level must be at least 1");
    }

    // Create the agent in PENDING status
    const agent = this.agentRepository.create({
      orgId,
      agentId: dto.agentId,
      name: dto.name,
      level: childLevel,
      model: dto.model || parent.model,
      status: AgentStatus.PENDING,
      parentId,
      maxChildren: this.getCapacityForLevel(childLevel),
      currentBalance: 0,
      budgetPeriodSpent: 0,
      budgetPeriodLimit: dto.budgetPeriodLimit,
      hmacSecretEnc,
      metadata: {},
    });

    const saved = await this.agentRepository.save(agent);

    // Emit event
    await this.eventsService.emit({
      orgId,
      type: "agent.spawned",
      actorId: parentId,
      entityType: "agent",
      entityId: saved.id,
      data: {
        agentId: saved.agentId,
        name: saved.name,
        level: saved.level,
        parentId,
        status: AgentStatus.PENDING,
      },
    });

    return saved;
  }

  /**
   * Activate a pending agent
   * Can only be done by the parent or L10
   */
  async activateAgent(
    orgId: string,
    actorId: string,
    agentId: string,
  ): Promise<Agent> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId, orgId },
    });

    if (!agent) {
      throw new NotFoundException("Agent not found");
    }

    if (agent.status !== AgentStatus.PENDING) {
      throw new BadRequestException(
        `Agent is not pending activation (status: ${agent.status})`
      );
    }

    // Check authorization: must be parent or L10
    const actor = await this.agentRepository.findOne({ where: { id: actorId } });
    if (!actor) {
      throw new ForbiddenException("Actor not found");
    }

    const isParent = agent.parentId === actorId;
    const isL10 = actor.level === 10;

    if (!isParent && !isL10) {
      throw new ForbiddenException(
        "Only the parent agent or L10 can activate this agent"
      );
    }

    // Activate
    agent.status = AgentStatus.ACTIVE;
    const saved = await this.agentRepository.save(agent);

    await this.eventsService.emit({
      orgId,
      type: "agent.activated",
      actorId,
      entityType: "agent",
      entityId: agentId,
      data: {
        agentId: agent.agentId,
        name: agent.name,
        activatedBy: actorId,
      },
    });

    return saved;
  }

  /**
   * Reject a pending agent (delete it)
   */
  async rejectAgent(
    orgId: string,
    actorId: string,
    agentId: string,
    reason?: string,
  ): Promise<void> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId, orgId },
    });

    if (!agent) {
      throw new NotFoundException("Agent not found");
    }

    if (agent.status !== AgentStatus.PENDING) {
      throw new BadRequestException("Can only reject pending agents");
    }

    // Check authorization
    const actor = await this.agentRepository.findOne({ where: { id: actorId } });
    if (!actor) {
      throw new ForbiddenException("Actor not found");
    }

    const isParent = agent.parentId === actorId;
    const isL10 = actor.level === 10;

    if (!isParent && !isL10) {
      throw new ForbiddenException(
        "Only the parent agent or L10 can reject this agent"
      );
    }

    await this.eventsService.emit({
      orgId,
      type: "agent.rejected",
      actorId,
      entityType: "agent",
      entityId: agentId,
      data: {
        agentId: agent.agentId,
        name: agent.name,
        reason,
      },
    });

    // Soft delete
    await this.agentRepository.softDelete(agentId);
  }

  /**
   * Get pending agents for an actor (their children or all if L10)
   */
  async getPendingAgents(orgId: string, actorId: string): Promise<Agent[]> {
    const actor = await this.agentRepository.findOne({ where: { id: actorId } });
    if (!actor) {
      return [];
    }

    if (actor.level === 10) {
      // L10 sees all pending agents
      return this.agentRepository.find({
        where: { orgId, status: AgentStatus.PENDING },
        order: { createdAt: "ASC" },
      });
    }

    // Others see only their pending children
    return this.agentRepository.find({
      where: { orgId, parentId: actorId, status: AgentStatus.PENDING },
      order: { createdAt: "ASC" },
    });
  }

  /**
   * Get agent hierarchy (children and their children)
   */
  async getHierarchy(orgId: string, rootId: string, depth = 3): Promise<Agent & { children?: Agent[] }> {
    const agent = await this.agentRepository.findOne({
      where: { id: rootId, orgId },
    });

    if (!agent) {
      throw new NotFoundException("Agent not found");
    }

    if (depth <= 0) {
      return agent;
    }

    const children = await this.agentRepository.find({
      where: { parentId: rootId, orgId },
      order: { level: "DESC", name: "ASC" },
    });

    const childrenWithHierarchy = await Promise.all(
      children.map((child) => this.getHierarchy(orgId, child.id, depth - 1))
    );

    return {
      ...agent,
      children: childrenWithHierarchy,
    };
  }
}
