import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Task, TaskComment, TaskDependency, TaskTag } from "@openspawn/database";
import { TaskPriority, TaskStatus } from "@openspawn/shared-types";

import { TrustService } from "../agents";
import { EventsService } from "../events";
import { WebhooksService } from "../webhooks/webhooks.service";

import { CreateTaskDto } from "./dto/create-task.dto";
import { TransitionTaskDto } from "./dto/transition-task.dto";
import { TaskIdentifierService } from "./task-identifier.service";
import { TaskTransitionService } from "./task-transition.service";

/** Exception thrown when a pre-hook blocks an action */
export class PreHookBlockedException extends ForbiddenException {
  constructor(
    public readonly reason: string,
    public readonly blockedBy: string[],
  ) {
    super(`Action blocked by webhook: ${reason}`);
  }
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskDependency)
    private readonly dependencyRepository: Repository<TaskDependency>,
    @InjectRepository(TaskTag)
    private readonly tagRepository: Repository<TaskTag>,
    @InjectRepository(TaskComment)
    private readonly commentRepository: Repository<TaskComment>,
    private readonly taskIdentifierService: TaskIdentifierService,
    private readonly taskTransitionService: TaskTransitionService,
    private readonly eventsService: EventsService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => TrustService))
    private readonly trustService: TrustService,
    @Inject(forwardRef(() => WebhooksService))
    private readonly webhooksService: WebhooksService,
  ) {}

  async create(orgId: string, actorId: string, dto: CreateTaskDto): Promise<Task> {
    // Generate task identifier
    const identifier = await this.taskIdentifierService.generateIdentifier(orgId);

    const task = this.taskRepository.create({
      orgId,
      identifier,
      title: dto.title,
      description: dto.description,
      status: TaskStatus.BACKLOG,
      priority: dto.priority,
      creatorId: actorId,
      assigneeId: dto.assigneeId,
      parentTaskId: dto.parentTaskId,
      approvalRequired: dto.approvalRequired ?? false,
      dueDate: dto.dueAt ? new Date(dto.dueAt) : undefined,
      metadata: dto.metadata || {},
    });

    const saved = await this.taskRepository.save(task);

    // Add tags if provided
    if (dto.tags?.length) {
      const tags = dto.tags.map((tag) =>
        this.tagRepository.create({
          orgId,
          taskId: saved.id,
          tag,
        }),
      );
      await this.tagRepository.save(tags);
    }

    await this.eventsService.emit({
      orgId,
      type: "task.created",
      actorId,
      entityType: "task",
      entityId: saved.id,
      data: {
        identifier: saved.identifier,
        title: saved.title,
        priority: saved.priority,
        assigneeId: saved.assigneeId,
      },
    });

    return this.findOne(orgId, saved.id);
  }

  async findAll(
    orgId: string,
    filters?: {
      status?: TaskStatus;
      assigneeId?: string;
      creatorId?: string;
      parentTaskId?: string;
    },
  ): Promise<Task[]> {
    const query = this.taskRepository
      .createQueryBuilder("task")
      .where("task.org_id = :orgId", { orgId })
      .leftJoinAndSelect("task.tags", "tags")
      .orderBy("task.created_at", "DESC");

    if (filters?.status) {
      query.andWhere("task.status = :status", { status: filters.status });
    }
    if (filters?.assigneeId) {
      query.andWhere("task.assignee_id = :assigneeId", {
        assigneeId: filters.assigneeId,
      });
    }
    if (filters?.creatorId) {
      query.andWhere("task.creator_id = :creatorId", {
        creatorId: filters.creatorId,
      });
    }
    if (filters?.parentTaskId) {
      query.andWhere("task.parent_task_id = :parentTaskId", {
        parentTaskId: filters.parentTaskId,
      });
    }

    return query.getMany();
  }

  async findOne(orgId: string, id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id, orgId },
      relations: ["tags", "dependencies", "dependents"],
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    return task;
  }

  async transition(
    orgId: string,
    actorId: string,
    id: string,
    dto: TransitionTaskDto,
  ): Promise<Task> {
    const task = await this.findOne(orgId, id);

    // Validate transition
    this.taskTransitionService.validateTransition(task.status, dto.status);

    // Execute pre-hooks for task transitions
    const preHookResult = await this.webhooksService.executePreHooks(orgId, "task.transition", {
      taskId: id,
      taskIdentifier: task.identifier,
      taskTitle: task.title,
      fromStatus: task.status,
      toStatus: dto.status,
      actorId,
      assigneeId: task.assigneeId,
      reason: dto.reason,
    });

    if (!preHookResult.allow) {
      throw new PreHookBlockedException(
        preHookResult.reason || "Transition blocked by webhook",
        preHookResult.blockedBy || [],
      );
    }

    // Check blocking dependencies for moving to done
    if (dto.status === TaskStatus.DONE) {
      const blockingDeps = await this.dependencyRepository.find({
        where: { taskId: id, blocking: true },
        relations: ["dependsOn"],
      });

      const incomplete = blockingDeps.filter((dep) => dep.dependsOn?.status !== TaskStatus.DONE);

      if (incomplete.length > 0) {
        throw new ConflictException(
          `Cannot complete: ${incomplete.length} blocking dependencies not done`,
        );
      }

      // Check approval gate
      if (task.approvalRequired && !task.approvedAt) {
        throw new ForbiddenException("Task requires approval before completion");
      }

      // Execute pre-hooks specifically for task completion
      const completionHookResult = await this.webhooksService.executePreHooks(
        orgId,
        "task.complete",
        {
          taskId: id,
          taskIdentifier: task.identifier,
          taskTitle: task.title,
          task: {
            id: task.id,
            identifier: task.identifier,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            assigneeId: task.assigneeId,
            creatorId: task.creatorId,
            metadata: task.metadata,
          },
          actorId,
          assigneeId: task.assigneeId,
        },
      );

      // If completion is rejected by pre-hook, redirect to REVIEW with feedback
      if (!completionHookResult.allow) {
        const previousStatus = task.status;
        task.status = TaskStatus.REVIEW;
        task.metadata = {
          ...task.metadata,
          rejectionFeedback: completionHookResult.reason || "Completion rejected by webhook",
          rejectedAt: new Date().toISOString(),
          rejectedBy: completionHookResult.blockedBy?.join(", ") || "pre-hook",
          rejectionCount: ((task.metadata?.rejectionCount as number) || 0) + 1,
        };

        const saved = await this.taskRepository.save(task);

        // Emit completion rejected event
        await this.eventsService.emit({
          orgId,
          type: "task.completion_rejected",
          actorId,
          entityType: "task",
          entityId: id,
          data: {
            from: previousStatus,
            feedback: completionHookResult.reason,
            rejectedBy: completionHookResult.blockedBy,
          },
        });

        // Emit for other listeners
        this.eventEmitter.emit("task.completion_rejected", {
          task: saved,
          from: previousStatus,
          feedback: completionHookResult.reason,
          rejectedBy: completionHookResult.blockedBy,
          actorId,
        });

        return saved;
      }

      task.completedAt = new Date();
    }

    const previousStatus = task.status;
    task.status = dto.status;

    // Clear rejection feedback when moving back to IN_PROGRESS from REVIEW
    if (dto.status === TaskStatus.IN_PROGRESS && previousStatus === TaskStatus.REVIEW) {
      if (task.metadata?.rejectionFeedback) {
        task.metadata = {
          ...task.metadata,
          rejectionFeedback: undefined,
          rejectedAt: undefined,
          rejectedBy: undefined,
          // Keep rejectionCount for tracking
        };
      }
    }

    const saved = await this.taskRepository.save(task);

    await this.eventsService.emit({
      orgId,
      type: "task.transitioned",
      actorId,
      entityType: "task",
      entityId: id,
      data: {
        from: previousStatus,
        to: dto.status,
        reason: dto.reason,
      },
    });

    // Emit for credit system to pick up
    this.eventEmitter.emit("task.transitioned", {
      task: saved,
      from: previousStatus,
      to: dto.status,
      actorId,
    });

    // Update trust/reputation based on outcome
    if (saved.assigneeId) {
      if (dto.status === TaskStatus.DONE) {
        // Check if on time (if dueDate was set)
        const onTime = !saved.dueDate || saved.completedAt! <= saved.dueDate;
        await this.trustService.recordTaskCompleted({
          orgId,
          agentId: saved.assigneeId,
          taskId: saved.id,
          onTime,
        });
      } else if (dto.status === TaskStatus.CANCELLED && previousStatus !== TaskStatus.BACKLOG) {
        // Task cancelled after work started = failure
        await this.trustService.recordTaskFailed({
          orgId,
          agentId: saved.assigneeId,
          taskId: saved.id,
          reason: dto.reason,
        });
      } else if (dto.status === TaskStatus.IN_PROGRESS && previousStatus === TaskStatus.REVIEW) {
        // Sent back from review = rework needed
        await this.trustService.recordTaskRework({
          orgId,
          agentId: saved.assigneeId,
          taskId: saved.id,
          triggeredBy: actorId,
          reason: dto.reason,
        });
      }
    }

    return saved;
  }

  async approve(orgId: string, actorId: string, id: string): Promise<Task> {
    const task = await this.findOne(orgId, id);

    if (!task.approvalRequired) {
      throw new ConflictException("Task does not require approval");
    }

    if (task.approvedAt) {
      throw new ConflictException("Task is already approved");
    }

    task.approvedAt = new Date();
    task.approvedBy = actorId;

    const saved = await this.taskRepository.save(task);

    await this.eventsService.emit({
      orgId,
      type: "task.approved",
      actorId,
      entityType: "task",
      entityId: id,
      data: { identifier: task.identifier },
    });

    return saved;
  }

  async assign(orgId: string, actorId: string, id: string, assigneeId: string): Promise<Task> {
    const task = await this.findOne(orgId, id);
    const previousAssignee = task.assigneeId;

    task.assigneeId = assigneeId;
    const saved = await this.taskRepository.save(task);

    await this.eventsService.emit({
      orgId,
      type: "task.assigned",
      actorId,
      entityType: "task",
      entityId: id,
      data: {
        previousAssignee,
        newAssignee: assigneeId,
      },
    });

    return saved;
  }

  async addDependency(
    orgId: string,
    actorId: string,
    taskId: string,
    dependsOnId: string,
    blocking = true,
  ): Promise<TaskDependency> {
    // Check both tasks exist
    await this.findOne(orgId, taskId);
    await this.findOne(orgId, dependsOnId);

    // Prevent self-dependency
    if (taskId === dependsOnId) {
      throw new ConflictException("Task cannot depend on itself");
    }

    // Check for circular dependency using BFS
    const visited = new Set<string>();
    const queue = [dependsOnId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === taskId) {
        throw new ConflictException("Circular dependency detected");
      }

      if (visited.has(current)) continue;
      visited.add(current);

      const deps = await this.dependencyRepository.find({
        where: { taskId: current },
      });

      for (const dep of deps) {
        queue.push(dep.dependsOnId);
      }
    }

    // Check if dependency already exists
    const existing = await this.dependencyRepository.findOne({
      where: { taskId, dependsOnId },
    });

    if (existing) {
      throw new ConflictException("Dependency already exists");
    }

    const dependency = this.dependencyRepository.create({
      orgId,
      taskId,
      dependsOnId,
      blocking,
    });

    const saved = await this.dependencyRepository.save(dependency);

    await this.eventsService.emit({
      orgId,
      type: "task.dependency.added",
      actorId,
      entityType: "task",
      entityId: taskId,
      data: { dependsOnId, blocking },
    });

    return saved;
  }

  async removeDependency(
    orgId: string,
    actorId: string,
    taskId: string,
    dependsOnId: string,
  ): Promise<void> {
    const result = await this.dependencyRepository.delete({
      taskId,
      dependsOnId,
    });

    if (result.affected === 0) {
      throw new NotFoundException("Dependency not found");
    }

    await this.eventsService.emit({
      orgId,
      type: "task.dependency.removed",
      actorId,
      entityType: "task",
      entityId: taskId,
      data: { dependsOnId },
    });
  }

  async addComment(
    orgId: string,
    actorId: string,
    taskId: string,
    body: string,
    parentCommentId?: string,
  ): Promise<TaskComment> {
    await this.findOne(orgId, taskId);

    const comment = this.commentRepository.create({
      orgId,
      taskId,
      authorId: actorId,
      body,
      parentCommentId,
    });

    const saved = await this.commentRepository.save(comment);

    await this.eventsService.emit({
      orgId,
      type: "task.comment.added",
      actorId,
      entityType: "task",
      entityId: taskId,
      data: { commentId: saved.id },
    });

    return saved;
  }

  async getComments(orgId: string, taskId: string): Promise<TaskComment[]> {
    await this.findOne(orgId, taskId);

    return this.commentRepository.find({
      where: { taskId },
      order: { createdAt: "ASC" },
    });
  }

  /**
   * Get count of tasks available to claim (unassigned, unblocked, TODO status)
   */
  async getClaimableTaskCount(orgId: string): Promise<number> {
    // Get all unassigned TODO tasks
    const unassignedTasks = await this.taskRepository
      .createQueryBuilder("task")
      .where("task.org_id = :orgId", { orgId })
      .andWhere("task.assignee_id IS NULL")
      .andWhere("task.status = :status", { status: TaskStatus.TODO })
      .getMany();

    // Filter out tasks with blocking dependencies
    let claimableCount = 0;
    for (const task of unassignedTasks) {
      const blockingDeps = await this.dependencyRepository.find({
        where: { taskId: task.id, blocking: true },
        relations: ["dependsOn"],
      });

      const hasUnfinishedBlocker = blockingDeps.some(
        (dep) => dep.dependsOn?.status !== TaskStatus.DONE,
      );

      if (!hasUnfinishedBlocker) {
        claimableCount++;
      }
    }

    return claimableCount;
  }

  /**
   * Claim the next available task for an agent
   * Uses row-level locking to prevent race conditions
   */
  async claimNextTask(
    orgId: string,
    agentId: string,
  ): Promise<{ success: boolean; task?: Task; message?: string }> {
    // Use a transaction with row-level locking
    return this.taskRepository.manager.transaction(async (manager) => {
      // Find next claimable task ordered by priority
      const priorityOrder = ["URGENT", "HIGH", "NORMAL", "LOW"];

      for (const priority of priorityOrder) {
        // Find unassigned TODO task with this priority, lock for update
        const task = await manager
          .createQueryBuilder(Task, "task")
          .setLock("pessimistic_write")
          .where("task.org_id = :orgId", { orgId })
          .andWhere("task.assignee_id IS NULL")
          .andWhere("task.status = :status", { status: TaskStatus.TODO })
          .andWhere("task.priority = :priority", { priority })
          .orderBy("task.created_at", "ASC")
          .getOne();

        if (task) {
          // Check for blocking dependencies
          const blockingDeps = await this.dependencyRepository.find({
            where: { taskId: task.id, blocking: true },
            relations: ["dependsOn"],
          });

          const hasUnfinishedBlocker = blockingDeps.some(
            (dep) => dep.dependsOn?.status !== TaskStatus.DONE,
          );

          if (hasUnfinishedBlocker) {
            continue; // Try next priority level
          }

          // Claim the task
          task.assigneeId = agentId;
          task.status = TaskStatus.IN_PROGRESS;
          const saved = await manager.save(task);

          await this.eventsService.emit({
            orgId,
            type: "task.claimed",
            actorId: agentId,
            entityType: "task",
            entityId: task.id,
            data: {
              identifier: task.identifier,
              title: task.title,
              priority: task.priority,
            },
          });

          return { success: true, task: saved };
        }
      }

      return { success: false, message: "No tasks available to claim" };
    });
  }
}
