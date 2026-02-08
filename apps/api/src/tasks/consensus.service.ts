import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";

import { Agent, ConsensusRequest, ConsensusVote } from "@openspawn/database";
import {
  ConsensusStatus,
  ConsensusType,
  EventSeverity,
  VoteValue,
} from "@openspawn/shared-types";

import { EventsService } from "../events";

export interface CreateConsensusDto {
  type: ConsensusType;
  title: string;
  description: string;
  subjectId?: string;
  subjectType?: string;
  quorumRequired?: number;
  approvalThreshold?: number;
  expiresInHours?: number;
  voterIds?: string[]; // Specific agents who can vote (optional)
}

@Injectable()
export class ConsensusService {
  constructor(
    @InjectRepository(ConsensusRequest)
    private readonly requestRepo: Repository<ConsensusRequest>,
    @InjectRepository(ConsensusVote)
    private readonly voteRepo: Repository<ConsensusVote>,
    @InjectRepository(Agent)
    private readonly agentRepo: Repository<Agent>,
    private readonly eventsService: EventsService
  ) {}

  /**
   * Create a new consensus request
   */
  async createRequest(
    orgId: string,
    requesterId: string,
    dto: CreateConsensusDto
  ): Promise<ConsensusRequest> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (dto.expiresInHours ?? 24));

    const request = this.requestRepo.create({
      orgId,
      type: dto.type,
      title: dto.title,
      description: dto.description,
      requesterId,
      subjectId: dto.subjectId ?? null,
      subjectType: dto.subjectType ?? null,
      quorumRequired: dto.quorumRequired ?? 2,
      approvalThreshold: dto.approvalThreshold ?? 50,
      expiresAt,
      metadata: dto.voterIds ? { eligibleVoters: dto.voterIds } : {},
    });

    const saved = await this.requestRepo.save(request);

    await this.eventsService.emit({
      orgId,
      type: "consensus.created",
      actorId: requesterId,
      entityType: "consensus",
      entityId: saved.id,
      severity: EventSeverity.INFO,
      data: {
        type: dto.type,
        title: dto.title,
        quorumRequired: saved.quorumRequired,
        expiresAt: saved.expiresAt.toISOString(),
      },
    });

    return saved;
  }

  /**
   * Cast a vote on a consensus request
   */
  async castVote(
    orgId: string,
    voterId: string,
    requestId: string,
    vote: VoteValue,
    reason?: string
  ): Promise<ConsensusVote> {
    const request = await this.requestRepo.findOneBy({ id: requestId, orgId });
    if (!request) {
      throw new NotFoundException("Consensus request not found");
    }

    if (request.status !== ConsensusStatus.PENDING) {
      throw new BadRequestException("Voting is closed for this request");
    }

    if (new Date() > request.expiresAt) {
      throw new BadRequestException("Voting period has expired");
    }

    // Check if agent is eligible to vote
    const eligibleVoters = request.metadata?.eligibleVoters as string[] | undefined;
    if (eligibleVoters && !eligibleVoters.includes(voterId)) {
      throw new ForbiddenException("You are not eligible to vote on this request");
    }

    // Check if already voted
    const existingVote = await this.voteRepo.findOne({
      where: { requestId, voterId },
    });
    if (existingVote) {
      throw new BadRequestException("You have already voted on this request");
    }

    // Get voter info
    const voter = await this.agentRepo.findOneByOrFail({ id: voterId });

    // Create vote
    const voteRecord = this.voteRepo.create({
      orgId,
      requestId,
      voterId,
      vote,
      reason: reason ?? null,
      voterLevel: voter.level,
    });
    await this.voteRepo.save(voteRecord);

    // Update vote counts
    if (vote === VoteValue.APPROVE) {
      request.votesApprove++;
    } else if (vote === VoteValue.REJECT) {
      request.votesReject++;
    } else {
      request.votesAbstain++;
    }

    await this.requestRepo.save(request);

    // Check if quorum reached and decision can be made
    await this.checkAndFinalizeRequest(request);

    await this.eventsService.emit({
      orgId,
      type: "consensus.voted",
      actorId: voterId,
      entityType: "consensus",
      entityId: requestId,
      severity: EventSeverity.INFO,
      data: {
        vote,
        voterLevel: voter.level,
        currentApprove: request.votesApprove,
        currentReject: request.votesReject,
      },
    });

    return voteRecord;
  }

  /**
   * Check if a request has reached quorum and finalize if so
   */
  private async checkAndFinalizeRequest(request: ConsensusRequest): Promise<void> {
    const totalVotes = request.votesApprove + request.votesReject + request.votesAbstain;

    if (totalVotes < request.quorumRequired) {
      return; // Quorum not yet reached
    }

    const effectiveVotes = request.votesApprove + request.votesReject;
    if (effectiveVotes === 0) {
      return; // All abstains, wait for more votes
    }

    const approvalPercentage = (request.votesApprove / effectiveVotes) * 100;

    if (approvalPercentage >= request.approvalThreshold) {
      request.status = ConsensusStatus.APPROVED;
    } else {
      request.status = ConsensusStatus.REJECTED;
    }

    request.decidedAt = new Date();
    await this.requestRepo.save(request);

    await this.eventsService.emit({
      orgId: request.orgId,
      type: "consensus.decided",
      actorId: request.requesterId,
      entityType: "consensus",
      entityId: request.id,
      severity: request.status === ConsensusStatus.APPROVED
        ? EventSeverity.INFO
        : EventSeverity.WARNING,
      data: {
        decision: request.status,
        votesApprove: request.votesApprove,
        votesReject: request.votesReject,
        votesAbstain: request.votesAbstain,
        approvalPercentage: Math.round(approvalPercentage),
      },
    });
  }

  /**
   * Expire old pending requests
   * Run as a scheduled task
   */
  async expireOldRequests(orgId: string): Promise<number> {
    const now = new Date();

    const expired = await this.requestRepo.find({
      where: {
        orgId,
        status: ConsensusStatus.PENDING,
        expiresAt: LessThan(now),
      },
    });

    for (const request of expired) {
      request.status = ConsensusStatus.EXPIRED;
      request.decidedAt = now;
      await this.requestRepo.save(request);

      await this.eventsService.emit({
        orgId,
        type: "consensus.expired",
        actorId: request.requesterId,
        entityType: "consensus",
        entityId: request.id,
        severity: EventSeverity.WARNING,
        data: {
          title: request.title,
          votesApprove: request.votesApprove,
          votesReject: request.votesReject,
          quorumRequired: request.quorumRequired,
        },
      });
    }

    return expired.length;
  }

  /**
   * Cancel a consensus request (by requester only)
   */
  async cancelRequest(requestId: string, cancelledBy: string): Promise<ConsensusRequest> {
    const request = await this.requestRepo.findOneByOrFail({ id: requestId });

    if (request.requesterId !== cancelledBy) {
      throw new ForbiddenException("Only the requester can cancel this request");
    }

    if (request.status !== ConsensusStatus.PENDING) {
      throw new BadRequestException("Can only cancel pending requests");
    }

    request.status = ConsensusStatus.CANCELLED;
    request.decidedAt = new Date();

    return this.requestRepo.save(request);
  }

  /**
   * Get a consensus request by ID
   */
  async getRequest(requestId: string): Promise<ConsensusRequest> {
    return this.requestRepo.findOneOrFail({
      where: { id: requestId },
      relations: ["requester", "votes", "votes.voter"],
    });
  }

  /**
   * Get all pending requests for an org
   */
  async getPendingRequests(orgId: string): Promise<ConsensusRequest[]> {
    return this.requestRepo.find({
      where: { orgId, status: ConsensusStatus.PENDING },
      relations: ["requester"],
      order: { expiresAt: "ASC" },
    });
  }

  /**
   * Get requests an agent can vote on
   */
  async getVotableRequests(orgId: string, agentId: string): Promise<ConsensusRequest[]> {
    const pending = await this.getPendingRequests(orgId);

    // Filter out requests the agent has already voted on
    const votedRequestIds = await this.voteRepo
      .find({ where: { voterId: agentId }, select: ["requestId"] })
      .then((votes) => votes.map((v) => v.requestId));

    return pending.filter((r) => {
      // Already voted
      if (votedRequestIds.includes(r.id)) return false;

      // Check eligibility
      const eligibleVoters = r.metadata?.eligibleVoters as string[] | undefined;
      if (eligibleVoters && !eligibleVoters.includes(agentId)) return false;

      return true;
    });
  }
}
