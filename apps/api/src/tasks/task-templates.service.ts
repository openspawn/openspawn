import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Agent, Task, TaskTag } from "@openspawn/database";
import { TaskPriority, TaskStatus } from "@openspawn/shared-types";

import { EventsService } from "../events";
import { TaskIdentifierService } from "./task-identifier.service";

export interface TaskTemplate {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  title: string;
  taskDescription?: string;
  priority: TaskPriority;
  estimatedMinutes?: number;
  requiredCapabilities: string[];
  tags: string[];
  approvalRequired: boolean;
  subtasks: SubtaskTemplate[];
  createdBy: string;
  createdAt: Date;
  metadata: Record<string, unknown>;
}

export interface SubtaskTemplate {
  title: string;
  description?: string;
  priority: TaskPriority;
  requiredCapabilities: string[];
  dependsOnIndex?: number; // Index of subtask this depends on
}

export interface CreateTemplateDto {
  name: string;
  description?: string;
  title: string;
  taskDescription?: string;
  priority?: TaskPriority;
  estimatedMinutes?: number;
  requiredCapabilities?: string[];
  tags?: string[];
  approvalRequired?: boolean;
  subtasks?: SubtaskTemplate[];
  metadata?: Record<string, unknown>;
}

export interface InstantiateTemplateDto {
  templateId: string;
  titleOverride?: string;
  descriptionOverride?: string;
  assigneeId?: string;
  dueAt?: string;
  variables?: Record<string, string>;
}

// In-memory template store (could be moved to DB entity later)
const templates = new Map<string, TaskTemplate>();

@Injectable()
export class TaskTemplatesService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskTag)
    private readonly tagRepository: Repository<TaskTag>,
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    private readonly taskIdentifierService: TaskIdentifierService,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Create a new task template
   */
  async createTemplate(
    orgId: string,
    actorId: string,
    dto: CreateTemplateDto,
  ): Promise<TaskTemplate> {
    // Check for duplicate name
    const existing = Array.from(templates.values()).find(
      (t) => t.orgId === orgId && t.name.toLowerCase() === dto.name.toLowerCase()
    );

    if (existing) {
      throw new ConflictException(`Template "${dto.name}" already exists`);
    }

    const template: TaskTemplate = {
      id: `tmpl_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      orgId,
      name: dto.name,
      description: dto.description,
      title: dto.title,
      taskDescription: dto.taskDescription,
      priority: dto.priority || TaskPriority.NORMAL,
      estimatedMinutes: dto.estimatedMinutes,
      requiredCapabilities: dto.requiredCapabilities || [],
      tags: dto.tags || [],
      approvalRequired: dto.approvalRequired ?? false,
      subtasks: dto.subtasks || [],
      createdBy: actorId,
      createdAt: new Date(),
      metadata: dto.metadata || {},
    };

    templates.set(template.id, template);

    await this.eventsService.emit({
      orgId,
      type: "task.template.created",
      actorId,
      entityType: "template",
      entityId: template.id,
      data: { name: template.name },
    });

    return template;
  }

  /**
   * Get all templates for an org
   */
  async getTemplates(orgId: string): Promise<TaskTemplate[]> {
    return Array.from(templates.values()).filter((t) => t.orgId === orgId);
  }

  /**
   * Get a specific template
   */
  async getTemplate(orgId: string, templateId: string): Promise<TaskTemplate> {
    const template = templates.get(templateId);
    if (!template || template.orgId !== orgId) {
      throw new NotFoundException("Template not found");
    }
    return template;
  }

  /**
   * Delete a template
   */
  async deleteTemplate(orgId: string, actorId: string, templateId: string): Promise<void> {
    const template = await this.getTemplate(orgId, templateId);
    templates.delete(templateId);

    await this.eventsService.emit({
      orgId,
      type: "task.template.deleted",
      actorId,
      entityType: "template",
      entityId: templateId,
      data: { name: template.name },
    });
  }

  /**
   * Apply variable substitution to a string
   */
  private applyVariables(text: string, variables: Record<string, string>): string {
    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }
    return result;
  }

  /**
   * Instantiate a template to create actual tasks
   */
  async instantiateTemplate(
    orgId: string,
    actorId: string,
    dto: InstantiateTemplateDto,
  ): Promise<Task[]> {
    const template = await this.getTemplate(orgId, dto.templateId);
    const variables = dto.variables || {};
    const createdTasks: Task[] = [];

    // Create main task
    const mainIdentifier = await this.taskIdentifierService.generateIdentifier(orgId);
    const mainTitle = this.applyVariables(dto.titleOverride || template.title, variables);
    const mainDescription = this.applyVariables(
      dto.descriptionOverride || template.taskDescription || "",
      variables
    );

    const mainTask = this.taskRepository.create({
      orgId,
      identifier: mainIdentifier,
      title: mainTitle,
      description: mainDescription,
      status: TaskStatus.BACKLOG,
      priority: template.priority,
      creatorId: actorId,
      assigneeId: dto.assigneeId,
      approvalRequired: template.approvalRequired,
      dueDate: dto.dueAt ? new Date(dto.dueAt) : undefined,
      metadata: {
        ...template.metadata,
        templateId: template.id,
        templateName: template.name,
        estimatedMinutes: template.estimatedMinutes,
        requiredCapabilities: template.requiredCapabilities,
      },
    });

    const savedMain = await this.taskRepository.save(mainTask);
    createdTasks.push(savedMain);

    // Add tags
    if (template.tags.length > 0) {
      const tags = template.tags.map((tag) =>
        this.tagRepository.create({
          orgId,
          taskId: savedMain.id,
          tag: this.applyVariables(tag, variables),
        })
      );
      await this.tagRepository.save(tags);
    }

    // Create subtasks
    const subtaskMap: Task[] = [];
    for (let i = 0; i < template.subtasks.length; i++) {
      const subtaskTemplate = template.subtasks[i];
      const subIdentifier = await this.taskIdentifierService.generateIdentifier(orgId);

      const subtask = this.taskRepository.create({
        orgId,
        identifier: subIdentifier,
        title: this.applyVariables(subtaskTemplate.title, variables),
        description: subtaskTemplate.description
          ? this.applyVariables(subtaskTemplate.description, variables)
          : undefined,
        status: TaskStatus.BACKLOG,
        priority: subtaskTemplate.priority,
        creatorId: actorId,
        parentTaskId: savedMain.id,
        metadata: {
          templateId: template.id,
          requiredCapabilities: subtaskTemplate.requiredCapabilities,
        },
      });

      const savedSubtask = await this.taskRepository.save(subtask);
      subtaskMap.push(savedSubtask);
      createdTasks.push(savedSubtask);
    }

    // Note: Dependencies between subtasks would be added here
    // using subtaskTemplate.dependsOnIndex -> subtaskMap[index].id

    await this.eventsService.emit({
      orgId,
      type: "task.template.instantiated",
      actorId,
      entityType: "task",
      entityId: savedMain.id,
      data: {
        templateId: template.id,
        templateName: template.name,
        mainTaskId: savedMain.id,
        subtaskCount: template.subtasks.length,
      },
    });

    return createdTasks;
  }

  /**
   * Create a template from an existing task
   */
  async createFromTask(
    orgId: string,
    actorId: string,
    taskId: string,
    templateName: string,
  ): Promise<TaskTemplate> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, orgId },
      relations: ["tags"],
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    return this.createTemplate(orgId, actorId, {
      name: templateName,
      title: task.title,
      taskDescription: task.description || undefined,
      priority: task.priority,
      tags: task.tags?.map((t) => t.tag) || [],
      approvalRequired: task.approvalRequired,
      metadata: { createdFromTaskId: taskId },
    });
  }
}
