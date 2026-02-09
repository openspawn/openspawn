import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";

import { CurrentAgent, type AuthenticatedAgent } from "../auth";

import { TaskTemplatesService, type CreateTemplateDto, type InstantiateTemplateDto } from "./task-templates.service";

/**
 * Handles task template CRUD operations.
 * Task-specific template routes (create-template from task) are in TasksController.
 */
@Controller("tasks/templates")
export class TaskTemplatesController {
  constructor(private readonly templatesService: TaskTemplatesService) {}

  @Get()
  async getTemplates(@CurrentAgent() agent: AuthenticatedAgent) {
    const templates = await this.templatesService.getTemplates(agent.orgId);
    return { data: templates };
  }

  @Post()
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

  @Get(":templateId")
  async getTemplate(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param("templateId") templateId: string,
  ) {
    const template = await this.templatesService.getTemplate(agent.orgId, templateId);
    return { data: template };
  }

  @Delete(":templateId")
  async deleteTemplate(
    @CurrentAgent() agent: AuthenticatedAgent,
    @Param("templateId") templateId: string,
  ) {
    await this.templatesService.deleteTemplate(agent.orgId, agent.id, templateId);
    return { message: "Template deleted" };
  }

  @Post("instantiate")
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
}
