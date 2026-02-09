import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Agent, AgentCapability } from "@openspawn/database";
import {
  AgentMode,
  AgentRole,
  AgentStatus,
  encryptSecret,
  generateSigningSecret,
} from "@openspawn/shared-types";

import { EventsService } from "../events";

import { CreateAgentDto } from "./dto/create-agent.dto";
import { UpdateAgentDto } from "./dto/update-agent.dto";

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(AgentCapability)
    private readonly capabilityRepository: Repository<AgentCapability>,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Register a new agent (HR role only)
   * Returns the plaintext secret ONCE - it cannot be recovered after this.
   */
  async register(
    orgId: string,
    actorId: string,
    dto: CreateAgentDto,
  ): Promise<{ agent: Agent; secret: string }> {
    // Check if agent_id already exists
    const existing = await this.agentRepository.findOne({
      where: { orgId, agentId: dto.agentId },
    });

    if (existing) {
      throw new ConflictException(`Agent with ID "${dto.agentId}" already exists`);
    }

    // Generate and encrypt secret
    const plaintextSecret = generateSigningSecret();
    const encryptionKey = process.env["ENCRYPTION_KEY"];
    if (!encryptionKey) {
      throw new Error("ENCRYPTION_KEY not configured");
    }
    const encryptedSecret = encryptSecret(plaintextSecret, encryptionKey);

    // Create agent
    const agent = this.agentRepository.create({
      orgId,
      agentId: dto.agentId,
      name: dto.name,
      level: dto.level || 1,
      model: dto.model || "sonnet",
      status: AgentStatus.ACTIVE,
      role: dto.role || AgentRole.WORKER,
      mode: dto.mode || AgentMode.WORKER,
      managementFeePct: dto.managementFeePct || 0,
      currentBalance: 0,
      budgetPeriodSpent: 0,
      budgetPeriodLimit: dto.budgetPeriodLimit,
      hmacSecretEnc: encryptedSecret,
      metadata: dto.metadata || {},
    });

    const saved = await this.agentRepository.save(agent);

    // Add capabilities if provided
    if (dto.capabilities?.length) {
      const capabilities = dto.capabilities.map((cap) =>
        this.capabilityRepository.create({
          orgId,
          agentId: saved.id,
          capability: cap.capability,
          proficiency: cap.proficiency,
        }),
      );
      await this.capabilityRepository.save(capabilities);
    }

    // Emit event
    await this.eventsService.emit({
      orgId,
      type: "agent.registered",
      actorId,
      entityType: "agent",
      entityId: saved.id,
      data: {
        agentId: saved.agentId,
        name: saved.name,
        role: saved.role,
        level: saved.level,
      },
    });

    return { agent: saved, secret: plaintextSecret };
  }

  async findAll(orgId: string): Promise<Agent[]> {
    return this.agentRepository.find({
      where: { orgId },
      order: { createdAt: "DESC" },
    });
  }

  async findOne(orgId: string, id: string): Promise<Agent> {
    const agent = await this.agentRepository.findOne({
      where: { id, orgId },
      relations: ["capabilities"],
    });

    if (!agent) {
      throw new NotFoundException("Agent not found");
    }

    return agent;
  }

  async findByAgentId(orgId: string, agentId: string): Promise<Agent | null> {
    return this.agentRepository.findOne({
      where: { orgId, agentId },
    });
  }

  async update(orgId: string, actorId: string, id: string, dto: UpdateAgentDto): Promise<Agent> {
    const agent = await this.findOne(orgId, id);

    // Update allowed fields
    if (dto.name !== undefined) agent.name = dto.name;
    if (dto.level !== undefined) agent.level = dto.level;
    if (dto.model !== undefined) agent.model = dto.model;
    if (dto.mode !== undefined) agent.mode = dto.mode;
    if (dto.managementFeePct !== undefined) agent.managementFeePct = dto.managementFeePct;
    if (dto.budgetPeriodLimit !== undefined) agent.budgetPeriodLimit = dto.budgetPeriodLimit;
    if (dto.metadata !== undefined) agent.metadata = dto.metadata;

    const saved = await this.agentRepository.save(agent);

    await this.eventsService.emit({
      orgId,
      type: "agent.updated",
      actorId,
      entityType: "agent",
      entityId: id,
      data: { changes: dto },
    });

    return saved;
  }

  async revoke(orgId: string, actorId: string, id: string): Promise<Agent> {
    const agent = await this.findOne(orgId, id);

    if (agent.status === AgentStatus.REVOKED) {
      throw new ConflictException("Agent is already revoked");
    }

    // Prevent self-revocation
    if (agent.id === actorId) {
      throw new ForbiddenException("Cannot revoke yourself");
    }

    agent.status = AgentStatus.REVOKED;
    const saved = await this.agentRepository.save(agent);

    await this.eventsService.emit({
      orgId,
      type: "agent.revoked",
      actorId,
      entityType: "agent",
      entityId: id,
      data: { previousStatus: AgentStatus.ACTIVE },
    });

    return saved;
  }

  async getBalance(orgId: string, id: string): Promise<{ balance: number }> {
    const agent = await this.findOne(orgId, id);
    return { balance: agent.currentBalance };
  }
}
