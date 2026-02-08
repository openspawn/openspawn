import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";

import { TaskStatus } from "@openspawn/shared-types";

import { CurrentAgent, type AuthenticatedAgent } from "../auth";

import { AddCommentDto } from "./dto/add-comment.dto";
import { AddDependencyDto } from "./dto/add-dependency.dto";
import { AssignTaskDto } from "./dto/assign-task.dto";
import { CreateTaskDto } from "./dto/create-task.dto";
import { TransitionTaskDto } from "./dto/transition-task.dto";
import { TaskRoutingService } from "./task-routing.service";
import { TaskTemplatesService, type CreateTemplateDto, type InstantiateTemplateDto } from "./task-templates.service";
import { TasksService } from "./tasks.service";

@Controller("tasks")
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly templatesService: TaskTemplatesService,
    private readonly routingService: TaskRoutingService,
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
}
