import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";

import { TaskStatus } from "@openspawn/shared-types";

import { CurrentAgent, type AuthenticatedAgent } from "../auth";

import { AddCommentDto } from "./dto/add-comment.dto";
import { AddDependencyDto } from "./dto/add-dependency.dto";
import { AssignTaskDto } from "./dto/assign-task.dto";
import { CreateTaskDto } from "./dto/create-task.dto";
import { TransitionTaskDto } from "./dto/transition-task.dto";
import { TasksService } from "./tasks.service";

@Controller("tasks")
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

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
}
