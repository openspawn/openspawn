import { Args, ID, Parent, Query, ResolveField, Resolver, Subscription } from "@nestjs/graphql";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Agent } from "@openspawn/database";
import { TaskStatus } from "@openspawn/shared-types";

import { TasksService } from "../../tasks";
import { PubSubProvider, TASK_UPDATED } from "../pubsub.provider";
import { AgentType, TaskType } from "../types";

@Resolver(() => TaskType)
export class TaskResolver {
  constructor(
    private readonly tasksService: TasksService,
    private readonly pubSub: PubSubProvider,
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
  ) {}

  @Query(() => [TaskType])
  async tasks(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("status", { type: () => TaskStatus, nullable: true }) status?: TaskStatus,
    @Args("assigneeId", { type: () => ID, nullable: true }) assigneeId?: string,
  ): Promise<TaskType[]> {
    return this.tasksService.findAll(orgId, { status, assigneeId });
  }

  @Query(() => TaskType, { nullable: true })
  async task(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("id", { type: () => ID }) id: string,
  ): Promise<TaskType | null> {
    try {
      return await this.tasksService.findOne(orgId, id);
    } catch {
      return null;
    }
  }

  @ResolveField(() => AgentType, { nullable: true })
  async assignee(@Parent() task: TaskType): Promise<AgentType | null> {
    if (!task.assigneeId) return null;
    return this.agentRepository.findOne({ where: { id: task.assigneeId } });
  }

  @Subscription(() => TaskType, {
    filter: (payload, variables) => payload.taskUpdated.orgId === variables.orgId,
  })
  taskUpdated(@Args("orgId", { type: () => ID }) _orgId: string): AsyncIterator<TaskType> {
    return this.pubSub.asyncIterableIterator(TASK_UPDATED);
  }
}
