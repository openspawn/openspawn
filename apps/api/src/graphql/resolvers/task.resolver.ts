import { Args, ID, Query, Resolver, Subscription } from "@nestjs/graphql";

import { TaskStatus } from "@openspawn/shared-types";

import { TasksService } from "../../tasks";
import { PubSubProvider, TASK_UPDATED } from "../pubsub.provider";
import { TaskType } from "../types";

@Resolver(() => TaskType)
export class TaskResolver {
  constructor(
    private readonly tasksService: TasksService,
    private readonly pubSub: PubSubProvider,
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

  @Subscription(() => TaskType, {
    filter: (payload, variables) => payload.taskUpdated.orgId === variables.orgId,
  })
  taskUpdated(@Args("orgId", { type: () => ID }) _orgId: string): AsyncIterator<TaskType> {
    return this.pubSub.asyncIterableIterator(TASK_UPDATED);
  }
}
