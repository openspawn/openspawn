import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";

import { CurrentAgent, type AuthenticatedAgent } from "../auth";

import { TaskRoutingService } from "./task-routing.service";
import { TaskTemplatesService, type CreateTemplateDto, type InstantiateTemplateDto } from "./task-templates.service";

@Controller("tasks")
export class TaskTemplatesController {
  constructor(
    private readonly templatesService: TaskTemplatesService,
    private readonly routingService: TaskRoutingService,
  ) {}

  @Get("templates")
  async getTemplates(@CurrentAgent() agent: AuthenticatedAgent) {
    const templates = await this.templatesService.getTemplates(agent.orgId);
    return { data: templates };
  }

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

  @Get("templates/:templateId")
  async getTemplate(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param("templateId") templateId: string,
  ) {
    const template = await this.templatesService.getTemplate(agent.orgId, templateId);
    return { data: template };
  }

  @Delete("templates/:templateId")
  async deleteTemplate(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param("templateId") templateId: string,
  ) {
    await this.templatesService.deleteTemplate(agent.orgId, agent.id, templateId);
    return { message: "Template deleted" };
  }

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
