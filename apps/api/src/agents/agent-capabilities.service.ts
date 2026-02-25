import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";

import { Agent, AgentCapability } from "@openspawn/database";
import { AgentStatus, Proficiency } from "@openspawn/shared-types";

import { EventsService } from "../events";

export interface AddCapabilityDto {
  capability: string;
  proficiency?: Proficiency;
}

export interface UpdateCapabilityDto {
  proficiency: Proficiency;
}

export interface CapabilityMatch {
  agentId: string;
  agentName: string;
  level: number;
  status: AgentStatus;
  capability: string;
  proficiency: Proficiency;
  score: number; // Match score based on proficiency
}

// Proficiency score weights for matching
const PROFICIENCY_SCORES: Record<Proficiency, number> = {
  [Proficiency.BASIC]: 1,
  [Proficiency.STANDARD]: 2,
  [Proficiency.EXPERT]: 3,
};

@Injectable()
export class AgentCapabilitiesService {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(AgentCapability)
    private readonly capabilityRepository: Repository<AgentCapability>,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Get all capabilities for an agent
   */
  async getAgentCapabilities(orgId: string, agentId: string): Promise<AgentCapability[]> {
    return this.capabilityRepository.find({
      where: { orgId, agentId },
      order: { capability: "ASC" },
    });
  }

  /**
   * Add a capability to an agent
   */
  async addCapability(
    orgId: string,
    actorId: string,
    agentId: string,
    dto: AddCapabilityDto,
  ): Promise<AgentCapability> {
    // Verify authorization: self, parent, or L10
    const [actor, agent] = await Promise.all([
      this.agentRepository.findOne({ where: { id: actorId } }),
      this.agentRepository.findOne({ where: { id: agentId, orgId } }),
    ]);

    if (!actor) {
      throw new ForbiddenException("Actor not found");
    }

    if (!agent) {
      throw new NotFoundException("Agent not found");
    }

    const isSelf = actorId === agentId;
    const isParent = agent.parentId === actorId;
    const isL10 = actor.level === 10;

    if (!isSelf && !isParent && !isL10) {
      throw new ForbiddenException(
        "Only the agent, their parent, or L10 can modify capabilities"
      );
    }

    // Normalize capability name
    const capability = dto.capability.toLowerCase().trim();

    // Check if capability already exists
    const existing = await this.capabilityRepository.findOne({
      where: { orgId, agentId, capability },
    });

    if (existing) {
      throw new BadRequestException(`Agent already has capability: ${capability}`);
    }

    const cap = this.capabilityRepository.create({
      orgId,
      agentId,
      capability,
      proficiency: dto.proficiency || Proficiency.STANDARD,
    });

    const saved = await this.capabilityRepository.save(cap);

    await this.eventsService.emit({
      orgId,
      type: "agent.capability_added",
      actorId,
      entityType: "agent",
      entityId: agentId,
      data: {
        capability: saved.capability,
        proficiency: saved.proficiency,
      },
    });

    return saved;
  }

  /**
   * Update a capability's proficiency level
   */
  async updateCapability(
    orgId: string,
    actorId: string,
    capabilityId: string,
    dto: UpdateCapabilityDto,
  ): Promise<AgentCapability> {
    const cap = await this.capabilityRepository.findOne({
      where: { id: capabilityId, orgId },
    });

    if (!cap) {
      throw new NotFoundException("Capability not found");
    }

    // Verify authorization
    const [actor, agent] = await Promise.all([
      this.agentRepository.findOne({ where: { id: actorId } }),
      this.agentRepository.findOne({ where: { id: cap.agentId, orgId } }),
    ]);

    if (!actor || !agent) {
      throw new ForbiddenException("Actor or agent not found");
    }

    const isSelf = actorId === cap.agentId;
    const isParent = agent.parentId === actorId;
    const isL10 = actor.level === 10;

    if (!isSelf && !isParent && !isL10) {
      throw new ForbiddenException("Insufficient permissions");
    }

    const oldProficiency = cap.proficiency;
    cap.proficiency = dto.proficiency;
    const saved = await this.capabilityRepository.save(cap);

    await this.eventsService.emit({
      orgId,
      type: "agent.capability_updated",
      actorId,
      entityType: "agent",
      entityId: cap.agentId,
      data: {
        capability: cap.capability,
        oldProficiency,
        newProficiency: dto.proficiency,
      },
    });

    return saved;
  }

  /**
   * Remove a capability from an agent
   */
  async removeCapability(
    orgId: string,
    actorId: string,
    capabilityId: string,
  ): Promise<void> {
    const cap = await this.capabilityRepository.findOne({
      where: { id: capabilityId, orgId },
    });

    if (!cap) {
      throw new NotFoundException("Capability not found");
    }

    // Verify authorization
    const [actor, agent] = await Promise.all([
      this.agentRepository.findOne({ where: { id: actorId } }),
      this.agentRepository.findOne({ where: { id: cap.agentId, orgId } }),
    ]);

    if (!actor || !agent) {
      throw new ForbiddenException("Actor or agent not found");
    }

    const isParent = agent.parentId === actorId;
    const isL10 = actor.level === 10;

    // Self can't remove their own capabilities (only parent/L10 can)
    if (!isParent && !isL10) {
      throw new ForbiddenException("Only parent or L10 can remove capabilities");
    }

    await this.capabilityRepository.delete(capabilityId);

    await this.eventsService.emit({
      orgId,
      type: "agent.capability_removed",
      actorId,
      entityType: "agent",
      entityId: cap.agentId,
      data: {
        capability: cap.capability,
      },
    });
  }

  /**
   * Find agents with specific capabilities
   * Returns agents sorted by match score (best matches first)
   */
  async findAgentsWithCapabilities(
    orgId: string,
    requiredCapabilities: string[],
    options?: {
      minProficiency?: Proficiency;
      onlyActive?: boolean;
      excludeAgentIds?: string[];
    },
  ): Promise<CapabilityMatch[]> {
    const normalized = requiredCapabilities.map((c) => c.toLowerCase().trim());

    // Find all matching capabilities
    const caps = await this.capabilityRepository.find({
      where: {
        orgId,
        capability: In(normalized),
      },
    });

    // Get unique agent IDs
    const agentIds = [...new Set(caps.map((c) => c.agentId))];

    if (agentIds.length === 0) {
      return [];
    }

    // Get agent details
    const agents = await this.agentRepository.find({
      where: { id: In(agentIds), orgId },
    });

    const agentMap = new Map(agents.map((a) => [a.id, a]));

    // Filter and score
    const results: CapabilityMatch[] = [];

    for (const cap of caps) {
      const agent = agentMap.get(cap.agentId);
      if (!agent) continue;

      // Filter by status
      if (options?.onlyActive && agent.status !== AgentStatus.ACTIVE) {
        continue;
      }

      // Filter excluded agents
      if (options?.excludeAgentIds?.includes(cap.agentId)) {
        continue;
      }

      // Filter by min proficiency
      if (options?.minProficiency) {
        const minScore = PROFICIENCY_SCORES[options.minProficiency];
        const capScore = PROFICIENCY_SCORES[cap.proficiency];
        if (capScore < minScore) {
          continue;
        }
      }

      results.push({
        agentId: agent.id,
        agentName: agent.name,
        level: agent.level,
        status: agent.status as AgentStatus,
        capability: cap.capability,
        proficiency: cap.proficiency,
        score: PROFICIENCY_SCORES[cap.proficiency],
      });
    }

    // Sort by score (descending), then level (descending)
    return results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.level - a.level;
    });
  }

  /**
   * Get the best agent match for a set of required capabilities
   * Returns the agent that best covers all requirements
   */
  async findBestMatch(
    orgId: string,
    requiredCapabilities: string[],
    options?: {
      minProficiency?: Proficiency;
      onlyActive?: boolean;
      excludeAgentIds?: string[];
    },
  ): Promise<{
    agentId: string;
    agentName: string;
    level: number;
    matchedCapabilities: { capability: string; proficiency: Proficiency }[];
    coveragePercent: number;
    totalScore: number;
  } | null> {
    const matches = await this.findAgentsWithCapabilities(
      orgId,
      requiredCapabilities,
      options,
    );

    if (matches.length === 0) {
      return null;
    }

    // Group by agent and calculate coverage
    const agentScores = new Map<
      string,
      {
        agent: { id: string; name: string; level: number };
        capabilities: { capability: string; proficiency: Proficiency }[];
        totalScore: number;
      }
    >();

    for (const match of matches) {
      const existing = agentScores.get(match.agentId);
      if (existing) {
        existing.capabilities.push({
          capability: match.capability,
          proficiency: match.proficiency,
        });
        existing.totalScore += match.score;
      } else {
        agentScores.set(match.agentId, {
          agent: {
            id: match.agentId,
            name: match.agentName,
            level: match.level,
          },
          capabilities: [
            { capability: match.capability, proficiency: match.proficiency },
          ],
          totalScore: match.score,
        });
      }
    }

    // Find best coverage
    let best: {
      agentId: string;
      agentName: string;
      level: number;
      matchedCapabilities: { capability: string; proficiency: Proficiency }[];
      coveragePercent: number;
      totalScore: number;
    } | null = null;

    for (const [agentId, data] of agentScores) {
      const coveragePercent = Math.round(
        (data.capabilities.length / requiredCapabilities.length) * 100
      );

      if (
        !best ||
        coveragePercent > best.coveragePercent ||
        (coveragePercent === best.coveragePercent &&
          data.totalScore > best.totalScore)
      ) {
        best = {
          agentId,
          agentName: data.agent.name,
          level: data.agent.level,
          matchedCapabilities: data.capabilities,
          coveragePercent,
          totalScore: data.totalScore,
        };
      }
    }

    return best;
  }

  /**
   * Get all unique capabilities in the organization
   */
  async getOrgCapabilities(orgId: string): Promise<{ capability: string; count: number }[]> {
    const result = await this.capabilityRepository
      .createQueryBuilder("cap")
      .select("cap.capability", "capability")
      .addSelect("COUNT(*)", "count")
      .where("cap.org_id = :orgId", { orgId })
      .groupBy("cap.capability")
      .orderBy("count", "DESC")
      .getRawMany();

    return result.map((r) => ({
      capability: r.capability,
      count: parseInt(r.count, 10),
    }));
  }
}
