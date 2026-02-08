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
import { TaskStatus } from "@openspawn/shared-types";

import { TrustService } from "../agents";
import { EventsService } from "../events";

import { CreateTaskDto } from "./dto/create-task.dto";
import { TransitionTaskDto } from "./dto/transition-task.dto";
import { TaskIdentifierService } from "./task-identifier.service";
import { TaskTransitionService } from "./task-transition.service";

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

      task.completedAt = new Date();
    }

    const previousStatus = task.status;
    task.status = dto.status;

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
}
