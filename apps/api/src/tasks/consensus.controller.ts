import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";

import { VoteValue } from "@openspawn/shared-types";

import { CurrentAgent, type AuthenticatedAgent } from "../auth";

import { ConsensusService, type CreateConsensusDto } from "./consensus.service";

@Controller("tasks")
export class ConsensusController {
  constructor(private readonly consensusService: ConsensusService) {}

  @Post("consensus")
  async createConsensusRequest(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Body() dto: CreateConsensusDto,
  ) {
    const request = await this.consensusService.createRequest(
      agent.orgId,
      agent.id,
      dto,
    );
    return { data: request };
  }

  @Get("consensus/pending")
  async getPendingConsensus(@CurrentAgent() agent: AuthenticatedAgent) {
    const requests = await this.consensusService.getPendingRequests(agent.orgId);
    return { data: requests };
  }

  @Get("consensus/votable")
  async getVotableConsensus(@CurrentAgent() agent: AuthenticatedAgent) {
    const requests = await this.consensusService.getVotableRequests(
      agent.orgId,
      agent.id,
    );
    return { data: requests };
  }

  @Get("consensus/:requestId")
  async getConsensusRequest(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param("requestId") requestId: string,
  ) {
    const request = await this.consensusService.getRequest(requestId);
    return { data: request };
  }

  @Post("consensus/:requestId/vote")
  async voteOnConsensus(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param("requestId") requestId: string,
    @Body() dto: { vote: VoteValue; reason?: string },
  ) {
    const vote = await this.consensusService.castVote(
      agent.orgId,
      agent.id,
      requestId,
      dto.vote,
      dto.reason,
    );
    return { data: vote, message: "Vote recorded" };
  }

  @Delete("consensus/:requestId")
  async cancelConsensus(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param("requestId") requestId: string,
  ) {
    const request = await this.consensusService.cancelRequest(requestId, agent.id);
    return { data: request, message: "Consensus request cancelled" };
  }
}
