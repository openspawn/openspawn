import { Args, ID, Int, Mutation, Parent, Query, ResolveField, Resolver, Subscription } from "@nestjs/graphql";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Agent } from "@openspawn/database";
import { TaskStatus } from "@openspawn/shared-types";

import { OrgFromContext, validateOrgAccess } from "../../auth/decorators";
import { TasksService } from "../../tasks";
import { PubSubProvider, TASK_UPDATED } from "../pubsub.provider";
import { AgentType, ClaimTaskResultType, TaskRejectionType, TaskType } from "../types";

/**
 * Security Model:
 * Organization access is validated at the gateway level via JWT claims.
 * Direct API access requires agent HMAC authentication which is org-scoped.
 *
 * All queries validate that the requested orgId matches the authenticated context
 * to prevent cross-organization data access.
 */
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
    @OrgFromContext() authenticatedOrgId?: string,
  ): Promise<TaskType[]> {
    validateOrgAccess(orgId, authenticatedOrgId);
    return this.tasksService.findAll(orgId, { status, assigneeId });
  }

  @Query(() => TaskType, { nullable: true })
  async task(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("id", { type: () => ID }) id: string,
    @OrgFromContext() authenticatedOrgId?: string,
  ): Promise<TaskType | null> {
    validateOrgAccess(orgId, authenticatedOrgId);
    try {
      return await this.tasksService.findOne(orgId, id);
    } catch {
      return null;
    }
  }

  @Query(() => Int, { description: "Get count of tasks available to claim" })
  async claimableTaskCount(
    @Args("orgId", { type: () => ID }) orgId: string,
    @OrgFromContext() authenticatedOrgId?: string,
  ): Promise<number> {
    validateOrgAccess(orgId, authenticatedOrgId);
    return this.tasksService.getClaimableTaskCount(orgId);
  }

  @Mutation(() => ClaimTaskResultType, { description: "Claim the next available task" })
  async claimNextTask(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("agentId", { type: () => ID }) agentId: string,
    @OrgFromContext() authenticatedOrgId?: string,
  ): Promise<ClaimTaskResultType> {
    validateOrgAccess(orgId, authenticatedOrgId);
    return this.tasksService.claimNextTask(orgId, agentId);
  }

  @ResolveField(() => AgentType, { nullable: true })
  async assignee(@Parent() task: TaskType): Promise<AgentType | null> {
    if (!task.assigneeId) return null;
    return this.agentRepository.findOne({ where: { id: task.assigneeId } });
  }

  @ResolveField(() => TaskRejectionType, { nullable: true })
  rejection(@Parent() task: TaskType & { metadata?: Record<string, unknown> }): TaskRejectionType | null {
    const metadata = task.metadata;
    if (!metadata?.rejectionFeedback) return null;

    return {
      feedback: metadata.rejectionFeedback as string,
      rejectedAt: new Date(metadata.rejectedAt as string),
      rejectedBy: metadata.rejectedBy as string,
      rejectionCount: (metadata.rejectionCount as number) || 1,
    };
  }

  @Subscription(() => TaskType, {
    filter: (payload, variables) => payload.taskUpdated.orgId === variables.orgId,
  })
  taskUpdated(@Args("orgId", { type: () => ID }) _orgId: string): AsyncIterator<TaskType> {
    // Note: Subscription authorization is handled in the filter function above.
    // The subscription only emits events matching the requested orgId.
    // Full subscription auth should be implemented via connection params.
    // TODO: Validate orgId against connection-level auth context
    return this.pubSub.asyncIterableIterator(TASK_UPDATED);
  }
}
