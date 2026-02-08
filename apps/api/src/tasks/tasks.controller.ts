import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";

import { ConsensusType, EscalationReason, TaskStatus, VoteValue } from "@openspawn/shared-types";

import { CurrentAgent, type AuthenticatedAgent } from "../auth";

import { AddCommentDto } from "./dto/add-comment.dto";
import { AddDependencyDto } from "./dto/add-dependency.dto";
import { AssignTaskDto } from "./dto/assign-task.dto";
import { CreateTaskDto } from "./dto/create-task.dto";
import { TransitionTaskDto } from "./dto/transition-task.dto";
import { ConsensusService, type CreateConsensusDto } from "./consensus.service";
import { EscalationService } from "./escalation.service";
import { TaskRoutingService } from "./task-routing.service";
import { TaskTemplatesService, type CreateTemplateDto, type InstantiateTemplateDto } from "./task-templates.service";
import { TasksService } from "./tasks.service";

@Controller("tasks")
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly templatesService: TaskTemplatesService,
    private readonly routingService: TaskRoutingService,
    private readonly escalationService: EscalationService,
    private readonly consensusService: ConsensusService,
  ) {}

  @Post()
  async create(@CurrentAgent() agent: AuthenticatedAgent, @Body() dto: CreateTaskDto) {
    const task = await this.tasksService.create(agent.orgId, agent.id, dto);
    return { data: task };
  }

  @Get()
  async findAll(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Query("status") status?: TaskStatus,
    @Query("assigneeId") assigneeId?: string,
    @Query("creatorId") creatorId?: string,
    @Query("parentTaskId") parentTaskId?: string,
  ) {
    const tasks = await this.tasksService.findAll(agent.orgId, {
      status,
      assigneeId,
      creatorId,
      parentTaskId,
    });
    return { data: tasks };
  }

  @Get(":id")
  async findOne(@CurrentAgent() agent: AuthenticatedAgent, @Param("id") id: string) {
    const task = await this.tasksService.findOne(agent.orgId, id);
    return { data: task };
  }

  @Post(":id/transition")
  async transition(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param("id") id: string,
    @Body() dto: TransitionTaskDto,
  ) {
    const task = await this.tasksService.transition(agent.orgId, agent.id, id, dto);
    return { data: task };
  }

  @Post(":id/approve")
  async approve(@CurrentAgent() agent: AuthenticatedAgent, @Param("id") id: string) {
    const task = await this.tasksService.approve(agent.orgId, agent.id, id);
    return { data: task };
  }

  @Post(":id/assign")
  async assign(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param("id") id: string,
    @Body() dto: AssignTaskDto,
  ) {
    const task = await this.tasksService.assign(agent.orgId, agent.id, id, dto.assigneeId);
    return { data: task };
  }

  @Post(":id/dependencies")
  async addDependency(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param("id") id: string,
    @Body() dto: AddDependencyDto,
  ) {
    const dependency = await this.tasksService.addDependency(
      agent.orgId,
      agent.id,
      id,
      dto.dependsOnId,
      dto.blocking,
    );
    return { data: dependency };
  }

  @Delete(":id/dependencies/:depId")
  async removeDependency(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param("id") id: string,
    @Param("depId") depId: string,
  ) {
    await this.tasksService.removeDependency(agent.orgId, agent.id, id, depId);
    return { message: "Dependency removed" };
  }

  @Post(":id/comments")
  async addComment(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param("id") id: string,
    @Body() dto: AddCommentDto,
  ) {
    const comment = await this.tasksService.addComment(
      agent.orgId,
      agent.id,
      id,
      dto.body,
      dto.parentCommentId,
    );
    return { data: comment };
  }

  @Get(":id/comments")
  async getComments(@CurrentAgent() agent: AuthenticatedAgent, @Param("id") id: string) {
    const comments = await this.tasksService.getComments(agent.orgId, id);
    return { data: comments };
  }

  // ============ Template Endpoints ============

  /**
   * Get all task templates
   */
  @Get("templates")
  async getTemplates(@CurrentAgent() agent: AuthenticatedAgent) {
    const templates = await this.templatesService.getTemplates(agent.orgId);
    return { data: templates };
  }

  /**
   * Create a new task template
   */
  @Post("templates")
  async createTemplate(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Body() dto: CreateTemplateDto,
  ) {
    const template = await this.templatesService.createTemplate(
      agent.orgId,
      agent.id,
      dto,
    );
    return { data: template };
  }

  /**
   * Get a specific template
   */
  @Get("templates/:templateId")
  async getTemplate(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param("templateId") templateId: string,
  ) {
    const template = await this.templatesService.getTemplate(agent.orgId, templateId);
    return { data: template };
  }

  /**
   * Delete a template
   */
  @Delete("templates/:templateId")
  async deleteTemplate(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param("templateId") templateId: string,
  ) {
    await this.templatesService.deleteTemplate(agent.orgId, agent.id, templateId);
    return { message: "Template deleted" };
  }

  /**
   * Instantiate a template to create tasks
   */
  @Post("templates/instantiate")
  async instantiateTemplate(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Body() dto: InstantiateTemplateDto,
  ) {
    const tasks = await this.templatesService.instantiateTemplate(
      agent.orgId,
      agent.id,
      dto,
    );
    return { data: tasks };
  }

  /**
   * Create a template from an existing task
   */
  @Post(":id/create-template")
  async createTemplateFromTask(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param("id") id: string,
    @Body() body: { name: string },
  ) {
    const template = await this.templatesService.createFromTask(
      agent.orgId,
      agent.id,
      id,
      body.name,
    );
    return { data: template };
  }

  // ============ Routing Endpoints ============

  /**
   * Find candidate agents for a task based on required capabilities
   */
  @Get(":id/candidates")
  async findCandidates(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param("id") id: string,
    @Query("minCoverage") minCoverage?: string,
    @Query("maxResults") maxResults?: string,
  ) {
    const result = await this.routingService.findCandidates(agent.orgId, id, {
      minCoverage: minCoverage ? parseInt(minCoverage, 10) : undefined,
      maxResults: maxResults ? parseInt(maxResults, 10) : undefined,
    });
    return { data: result };
  }

  /**
   * Auto-assign a task to the best matching agent
   */
  @Post(":id/auto-assign")
  async autoAssign(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param("id") id: string,
    @Body() body: { minCoverage?: number; excludeAgentIds?: string[] },
  ) {
    const result = await this.routingService.autoAssign(agent.orgId, agent.id, id, {
      minCoverage: body.minCoverage,
      excludeAgentIds: body.excludeAgentIds,
    });
    return { data: result };
  }

  /**
   * Get suggested agents for a set of capabilities
   */
  @Get("routing/suggest")
  async suggestAgents(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Query("capabilities") capabilities: string,
    @Query("limit") limit?: string,
  ) {
    const capList = capabilities.split(",").map((c) => c.trim()).filter(Boolean);
    const suggestions = await this.routingService.suggestAgents(
      agent.orgId,
      capList,
      limit ? parseInt(limit, 10) : 5,
    );
    return { data: suggestions };
  }

  // ============================================
  // Escalation Endpoints
  // ============================================

  /**
   * Escalate a task to a higher-level agent
   */
  @Post(":id/escalate")
  async escalateTask(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param("id") id: string,
    @Body() dto: { reason: EscalationReason; notes?: string; targetAgentId?: string },
  ) {
    const escalation = await this.escalationService.escalateTask({
      orgId: agent.orgId,
      taskId: id,
      reason: dto.reason,
      notes: dto.notes,
      targetAgentId: dto.targetAgentId,
      isAutomatic: false,
    });
    return { data: escalation, message: "Task escalated" };
  }

  /**
   * Get escalation history for a task
   */
  @Get(":id/escalations")
  async getTaskEscalations(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param("id") id: string,
  ) {
    const escalations = await this.escalationService.getTaskEscalations(id);
    return { data: escalations };
  }

  /**
   * Get all open escalations in the org
   */
  @Get("escalations/open")
  async getOpenEscalations(@CurrentAgent() agent: AuthenticatedAgent) {
    const escalations = await this.escalationService.getOpenEscalations(agent.orgId);
    return { data: escalations };
  }

  /**
   * Resolve an escalation
   */
  @Post("escalations/:escalationId/resolve")
  async resolveEscalation(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param("escalationId") escalationId: string,
  ) {
    const escalation = await this.escalationService.resolveEscalation(escalationId);
    return { data: escalation, message: "Escalation resolved" };
  }

  // ============================================
  // Consensus Endpoints
  // ============================================

  /**
   * Create a consensus request
   */
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

  /**
   * Get all pending consensus requests
   */
  @Get("consensus/pending")
  async getPendingConsensus(@CurrentAgent() agent: AuthenticatedAgent) {
    const requests = await this.consensusService.getPendingRequests(agent.orgId);
    return { data: requests };
  }

  /**
   * Get consensus requests the agent can vote on
   */
  @Get("consensus/votable")
  async getVotableConsensus(@CurrentAgent() agent: AuthenticatedAgent) {
    const requests = await this.consensusService.getVotableRequests(
      agent.orgId,
      agent.id,
    );
    return { data: requests };
  }

  /**
   * Get a specific consensus request
   */
  @Get("consensus/:requestId")
  async getConsensusRequest(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param("requestId") requestId: string,
  ) {
    const request = await this.consensusService.getRequest(requestId);
    return { data: request };
  }

  /**
   * Vote on a consensus request
   */
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

  /**
   * Cancel a consensus request (requester only)
   */
  @Delete("consensus/:requestId")
  async cancelConsensus(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param("requestId") requestId: string,
  ) {
    const request = await this.consensusService.cancelRequest(requestId, agent.id);
    return { data: request, message: "Consensus request cancelled" };
  }
}
