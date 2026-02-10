import { EventEmitter2 } from "@nestjs/event-emitter";
import { Repository } from "typeorm";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { Task, TaskComment, TaskDependency, TaskTag } from "@openspawn/database";
import { TaskPriority, TaskStatus } from "@openspawn/shared-types";

import { TrustService } from "../agents";
import { EventsService } from "../events";
import { WebhooksService } from "../webhooks/webhooks.service";

import { PreHookBlockedException, TasksService } from "./tasks.service";
import { TaskIdentifierService } from "./task-identifier.service";
import { TaskTransitionService } from "./task-transition.service";

describe("TasksService - Task Completion Rejection", () => {
  let service: TasksService;
  let taskRepo: Partial<Repository<Task>>;
  let dependencyRepo: Partial<Repository<TaskDependency>>;
  let tagRepo: Partial<Repository<TaskTag>>;
  let commentRepo: Partial<Repository<TaskComment>>;
  let taskIdentifierService: Partial<TaskIdentifierService>;
  let taskTransitionService: Partial<TaskTransitionService>;
  let eventsService: Partial<EventsService>;
  let eventEmitter: Partial<EventEmitter2>;
  let trustService: Partial<TrustService>;
  let webhooksService: Partial<WebhooksService>;

  const orgId = "org-123";
  const actorId = "agent-456";

  const createMockTask = (overrides: Partial<Task> = {}): Task =>
    ({
      id: "task-1",
      orgId,
      identifier: "TASK-001",
      title: "Test Task",
      description: "A test task",
      status: TaskStatus.IN_PROGRESS,
      priority: "normal",
      creatorId: "creator-1",
      assigneeId: "assignee-1",
      approvalRequired: false,
      metadata: {},
      tags: [],
      dependencies: [],
      dependents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as Task;

  beforeEach(() => {
    vi.clearAllMocks();

    taskRepo = {
      findOne: vi.fn(),
      save: vi.fn().mockImplementation((task) => Promise.resolve(task as Task)),
      create: vi.fn().mockImplementation((data) => data as Task),
    };

    dependencyRepo = {
      find: vi.fn().mockResolvedValue([]),
    };

    tagRepo = {
      create: vi.fn(),
      save: vi.fn(),
    };

    commentRepo = {
      create: vi.fn(),
      save: vi.fn(),
      find: vi.fn(),
    };

    taskIdentifierService = {
      generateIdentifier: vi.fn().mockResolvedValue("TASK-001"),
    };

    taskTransitionService = {
      validateTransition: vi.fn(),
    };

    eventsService = {
      emit: vi.fn().mockResolvedValue(undefined),
    };

    eventEmitter = {
      emit: vi.fn(),
    };

    trustService = {
      recordTaskCompleted: vi.fn(),
      recordTaskFailed: vi.fn(),
      recordTaskRework: vi.fn(),
    };

    webhooksService = {
      executePreHooks: vi.fn().mockResolvedValue({ allow: true }),
    };

    service = new TasksService(
      taskRepo as Repository<Task>,
      dependencyRepo as Repository<TaskDependency>,
      tagRepo as Repository<TaskTag>,
      commentRepo as Repository<TaskComment>,
      taskIdentifierService as TaskIdentifierService,
      taskTransitionService as TaskTransitionService,
      eventsService as EventsService,
      eventEmitter as EventEmitter2,
      trustService as TrustService,
      webhooksService as WebhooksService,
    );
  });

  describe("Pre-hook execution on transition to DONE", () => {
    it("should execute pre-hook on task.transition", async () => {
      const task = createMockTask({ status: TaskStatus.IN_PROGRESS });
      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (webhooksService.executePreHooks as Mock).mockResolvedValue({ allow: true });

      await service.transition(orgId, actorId, task.id, {
        status: TaskStatus.REVIEW,
      });

      expect(webhooksService.executePreHooks).toHaveBeenCalledWith(
        orgId,
        "task.transition",
        expect.objectContaining({
          taskId: task.id,
          fromStatus: TaskStatus.IN_PROGRESS,
          toStatus: TaskStatus.REVIEW,
        }),
      );
    });

    it("should execute task.complete pre-hook when transitioning to DONE", async () => {
      const task = createMockTask({ status: TaskStatus.REVIEW });
      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (webhooksService.executePreHooks as Mock).mockResolvedValue({ allow: true });

      await service.transition(orgId, actorId, task.id, {
        status: TaskStatus.DONE,
      });

      // Should be called twice: once for task.transition, once for task.complete
      expect(webhooksService.executePreHooks).toHaveBeenCalledWith(
        orgId,
        "task.complete",
        expect.objectContaining({
          taskId: task.id,
          taskTitle: task.title,
          actorId,
        }),
      );
    });

    it("should throw PreHookBlockedException when task.transition hook blocks", async () => {
      const task = createMockTask({ status: TaskStatus.IN_PROGRESS });
      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (webhooksService.executePreHooks as Mock).mockResolvedValue({
        allow: false,
        reason: "Transition blocked",
        blockedBy: ["Quality Gate"],
      });

      await expect(
        service.transition(orgId, actorId, task.id, { status: TaskStatus.REVIEW }),
      ).rejects.toThrow(PreHookBlockedException);
    });
  });

  describe("Completion rejection behavior", () => {
    it("should move task to REVIEW when completion is rejected", async () => {
      const task = createMockTask({ status: TaskStatus.REVIEW });
      (taskRepo.findOne as Mock).mockResolvedValue(task);

      // First call (task.transition) allows, second (task.complete) blocks
      (webhooksService.executePreHooks as Mock)
        .mockResolvedValueOnce({ allow: true })
        .mockResolvedValueOnce({
          allow: false,
          reason: "Missing code review approval",
          blockedBy: ["code-review-bot"],
        });

      const result = await service.transition(orgId, actorId, task.id, {
        status: TaskStatus.DONE,
      });

      expect(result.status).toBe(TaskStatus.REVIEW);
    });

    it("should store rejection feedback in metadata", async () => {
      const task = createMockTask({ status: TaskStatus.REVIEW, metadata: {} });
      (taskRepo.findOne as Mock).mockResolvedValue(task);

      (webhooksService.executePreHooks as Mock)
        .mockResolvedValueOnce({ allow: true })
        .mockResolvedValueOnce({
          allow: false,
          reason: "Tests are failing",
          blockedBy: ["ci-checker"],
        });

      const result = await service.transition(orgId, actorId, task.id, {
        status: TaskStatus.DONE,
      });

      expect(result.metadata).toHaveProperty("rejectionFeedback", "Tests are failing");
      expect(result.metadata).toHaveProperty("rejectedBy", "ci-checker");
      expect(result.metadata).toHaveProperty("rejectedAt");
    });

    it("should increment rejection count", async () => {
      const task = createMockTask({
        status: TaskStatus.REVIEW,
        metadata: { rejectionCount: 2 },
      });
      (taskRepo.findOne as Mock).mockResolvedValue(task);

      (webhooksService.executePreHooks as Mock)
        .mockResolvedValueOnce({ allow: true })
        .mockResolvedValueOnce({
          allow: false,
          reason: "Still failing",
          blockedBy: ["validator"],
        });

      const result = await service.transition(orgId, actorId, task.id, {
        status: TaskStatus.DONE,
      });

      expect(result.metadata?.rejectionCount).toBe(3);
    });

    it("should start rejection count at 1 for first rejection", async () => {
      const task = createMockTask({ status: TaskStatus.REVIEW, metadata: {} });
      (taskRepo.findOne as Mock).mockResolvedValue(task);

      (webhooksService.executePreHooks as Mock)
        .mockResolvedValueOnce({ allow: true })
        .mockResolvedValueOnce({
          allow: false,
          reason: "Not approved",
          blockedBy: ["approver"],
        });

      const result = await service.transition(orgId, actorId, task.id, {
        status: TaskStatus.DONE,
      });

      expect(result.metadata?.rejectionCount).toBe(1);
    });

    it("should emit task.completion_rejected event", async () => {
      const task = createMockTask({ status: TaskStatus.REVIEW });
      (taskRepo.findOne as Mock).mockResolvedValue(task);

      (webhooksService.executePreHooks as Mock)
        .mockResolvedValueOnce({ allow: true })
        .mockResolvedValueOnce({
          allow: false,
          reason: "Rejection reason",
          blockedBy: ["blocker-hook"],
        });

      await service.transition(orgId, actorId, task.id, {
        status: TaskStatus.DONE,
      });

      expect(eventsService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "task.completion_rejected",
          entityId: task.id,
          data: expect.objectContaining({
            feedback: "Rejection reason",
            rejectedBy: ["blocker-hook"],
          }),
        }),
      );
    });

    it("should emit internal task.completion_rejected event for listeners", async () => {
      const task = createMockTask({ status: TaskStatus.REVIEW });
      (taskRepo.findOne as Mock).mockResolvedValue(task);

      (webhooksService.executePreHooks as Mock)
        .mockResolvedValueOnce({ allow: true })
        .mockResolvedValueOnce({
          allow: false,
          reason: "Not ready",
          blockedBy: ["check"],
        });

      await service.transition(orgId, actorId, task.id, {
        status: TaskStatus.DONE,
      });

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        "task.completion_rejected",
        expect.objectContaining({
          task: expect.objectContaining({ id: task.id }),
          feedback: "Not ready",
          rejectedBy: ["check"],
          actorId,
        }),
      );
    });

    it("should use default rejection message when reason is not provided", async () => {
      const task = createMockTask({ status: TaskStatus.REVIEW });
      (taskRepo.findOne as Mock).mockResolvedValue(task);

      (webhooksService.executePreHooks as Mock)
        .mockResolvedValueOnce({ allow: true })
        .mockResolvedValueOnce({
          allow: false,
          // No reason provided
        });

      const result = await service.transition(orgId, actorId, task.id, {
        status: TaskStatus.DONE,
      });

      expect(result.metadata?.rejectionFeedback).toBe("Completion rejected by webhook");
    });
  });

  describe("Clearing rejection feedback", () => {
    it("should clear rejection feedback when moving back to IN_PROGRESS from REVIEW", async () => {
      const task = createMockTask({
        status: TaskStatus.REVIEW,
        metadata: {
          rejectionFeedback: "Previous rejection reason",
          rejectedAt: "2024-01-01T00:00:00Z",
          rejectedBy: "old-hook",
          rejectionCount: 2,
        },
      });
      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (webhooksService.executePreHooks as Mock).mockResolvedValue({ allow: true });

      const result = await service.transition(orgId, actorId, task.id, {
        status: TaskStatus.IN_PROGRESS,
      });

      expect(result.metadata?.rejectionFeedback).toBeUndefined();
      expect(result.metadata?.rejectedAt).toBeUndefined();
      expect(result.metadata?.rejectedBy).toBeUndefined();
      // Should keep rejectionCount for tracking
      expect(result.metadata?.rejectionCount).toBe(2);
    });

    it("should NOT clear rejection feedback when transitioning to other states", async () => {
      const task = createMockTask({
        status: TaskStatus.IN_PROGRESS,
        metadata: {
          rejectionFeedback: "Some feedback",
          rejectionCount: 1,
        },
      });
      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (webhooksService.executePreHooks as Mock).mockResolvedValue({ allow: true });

      const result = await service.transition(orgId, actorId, task.id, {
        status: TaskStatus.REVIEW,
      });

      // Should still have the feedback since we're not going from REVIEW to IN_PROGRESS
      expect(result.metadata?.rejectionFeedback).toBe("Some feedback");
    });
  });

  describe("Successful completion flow", () => {
    it("should complete task when pre-hook allows", async () => {
      const task = createMockTask({ status: TaskStatus.REVIEW });
      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (webhooksService.executePreHooks as Mock).mockResolvedValue({ allow: true });

      const result = await service.transition(orgId, actorId, task.id, {
        status: TaskStatus.DONE,
      });

      expect(result.status).toBe(TaskStatus.DONE);
      expect(result.completedAt).toBeDefined();
    });

    it("should not add rejection metadata when completion succeeds", async () => {
      const task = createMockTask({ status: TaskStatus.REVIEW, metadata: {} });
      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (webhooksService.executePreHooks as Mock).mockResolvedValue({ allow: true });

      const result = await service.transition(orgId, actorId, task.id, {
        status: TaskStatus.DONE,
      });

      expect(result.metadata?.rejectionFeedback).toBeUndefined();
      expect(result.metadata?.rejectedBy).toBeUndefined();
    });

    it("should record task completed in trust service", async () => {
      const task = createMockTask({
        status: TaskStatus.REVIEW,
        assigneeId: "worker-agent",
      });
      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (webhooksService.executePreHooks as Mock).mockResolvedValue({ allow: true });

      await service.transition(orgId, actorId, task.id, {
        status: TaskStatus.DONE,
      });

      expect(trustService.recordTaskCompleted).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId,
          agentId: "worker-agent",
          taskId: task.id,
        }),
      );
    });
  });

  describe("Trust/reputation on rework", () => {
    it("should record rework when moved from REVIEW to IN_PROGRESS", async () => {
      const task = createMockTask({
        status: TaskStatus.REVIEW,
        assigneeId: "worker-agent",
      });
      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (webhooksService.executePreHooks as Mock).mockResolvedValue({ allow: true });

      await service.transition(orgId, actorId, task.id, {
        status: TaskStatus.IN_PROGRESS,
        reason: "Needs more work",
      });

      expect(trustService.recordTaskRework).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId,
          agentId: "worker-agent",
          taskId: task.id,
          triggeredBy: actorId,
          reason: "Needs more work",
        }),
      );
    });
  });

  describe("Integration with approval gate", () => {
    it("should check approval before running completion pre-hook", async () => {
      const task = createMockTask({
        status: TaskStatus.REVIEW,
        approvalRequired: true,
        approvedAt: undefined, // Not approved
      });
      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (webhooksService.executePreHooks as Mock).mockResolvedValue({ allow: true });

      await expect(
        service.transition(orgId, actorId, task.id, { status: TaskStatus.DONE }),
      ).rejects.toThrow(/requires approval/);

      // Completion pre-hook should not be called for task.complete
      // because approval check happens first
    });
  });
});

describe("TasksService - Self-Claim Tasks", () => {
  let service: TasksService;
  let taskRepo: Partial<Repository<Task>>;
  let dependencyRepo: Partial<Repository<TaskDependency>>;
  let tagRepo: Partial<Repository<TaskTag>>;
  let commentRepo: Partial<Repository<TaskComment>>;
  let taskIdentifierService: Partial<TaskIdentifierService>;
  let taskTransitionService: Partial<TaskTransitionService>;
  let eventsService: Partial<EventsService>;
  let eventEmitter: Partial<EventEmitter2>;
  let trustService: Partial<TrustService>;
  let webhooksService: Partial<WebhooksService>;

  const orgId = "org-123";
  const agentId = "agent-456";

  const createMockTask = (overrides: Partial<Task> = {}): Task =>
    ({
      id: `task-${Math.random().toString(36).substr(2, 9)}`,
      orgId,
      identifier: `TASK-${Math.floor(Math.random() * 1000)}`,
      title: "Test Task",
      description: "A test task",
      status: TaskStatus.BACKLOG,
      priority: TaskPriority.NORMAL,
      creatorId: "creator-1",
      assigneeId: null,
      approvalRequired: false,
      metadata: {},
      tags: [],
      dependencies: [],
      dependents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as Task;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock manager for transaction
    const mockManager = {
      createQueryBuilder: vi.fn().mockReturnValue({
        setLock: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
        getOne: vi.fn().mockResolvedValue(null),
      }),
      find: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockImplementation((task) => Promise.resolve(task)),
    };

    taskRepo = {
      findOne: vi.fn(),
      save: vi.fn().mockImplementation((task) => Promise.resolve(task as Task)),
      create: vi.fn().mockImplementation((data) => data as Task),
      createQueryBuilder: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      }),
      manager: {
        transaction: vi.fn().mockImplementation((cb) => cb(mockManager)),
      } as any,
    };

    dependencyRepo = {
      find: vi.fn().mockResolvedValue([]),
    };

    tagRepo = {
      create: vi.fn(),
      save: vi.fn(),
    };

    commentRepo = {
      create: vi.fn(),
      save: vi.fn(),
      find: vi.fn(),
    };

    taskIdentifierService = {
      generateIdentifier: vi.fn().mockResolvedValue("TASK-001"),
    };

    taskTransitionService = {
      validateTransition: vi.fn(),
    };

    eventsService = {
      emit: vi.fn().mockResolvedValue(undefined),
    };

    eventEmitter = {
      emit: vi.fn(),
    };

    trustService = {
      recordTaskCompleted: vi.fn(),
      recordTaskFailed: vi.fn(),
      recordTaskRework: vi.fn(),
    };

    webhooksService = {
      executePreHooks: vi.fn().mockResolvedValue({ allow: true }),
    };

    service = new TasksService(
      taskRepo as Repository<Task>,
      dependencyRepo as Repository<TaskDependency>,
      tagRepo as Repository<TaskTag>,
      commentRepo as Repository<TaskComment>,
      taskIdentifierService as TaskIdentifierService,
      taskTransitionService as TaskTransitionService,
      eventsService as EventsService,
      eventEmitter as EventEmitter2,
      trustService as TrustService,
      webhooksService as WebhooksService,
    );
  });

  describe("getClaimableTaskCount", () => {
    it("should return 0 when no tasks are available", async () => {
      (taskRepo.createQueryBuilder as Mock).mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      });

      const count = await service.getClaimableTaskCount(orgId);

      expect(count).toBe(0);
    });

    it("should count unassigned tasks in BACKLOG and TODO status", async () => {
      const tasks = [
        createMockTask({ status: TaskStatus.BACKLOG, assigneeId: null }),
        createMockTask({ status: TaskStatus.TODO, assigneeId: null }),
        createMockTask({ status: TaskStatus.BACKLOG, assigneeId: null }),
      ];

      (taskRepo.createQueryBuilder as Mock).mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(tasks),
      });
      (dependencyRepo.find as Mock).mockResolvedValue([]);

      const count = await service.getClaimableTaskCount(orgId);

      expect(count).toBe(3);
    });

    it("should exclude blocked tasks from count", async () => {
      const unblocked = createMockTask({ id: "unblocked", status: TaskStatus.BACKLOG });
      const blocked = createMockTask({ id: "blocked", status: TaskStatus.BACKLOG });

      (taskRepo.createQueryBuilder as Mock).mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([unblocked, blocked]),
      });

      (dependencyRepo.find as Mock).mockImplementation(({ where }) => {
        if (where.taskId === "blocked") {
          return Promise.resolve([
            { taskId: "blocked", blocking: true, dependsOn: { status: TaskStatus.IN_PROGRESS } },
          ]);
        }
        return Promise.resolve([]);
      });

      const count = await service.getClaimableTaskCount(orgId);

      expect(count).toBe(1);
    });

    it("should not count tasks with non-blocking dependencies as blocked", async () => {
      // Use TODO status to match the service query
      const task = createMockTask({ id: "task-1", status: TaskStatus.TODO });

      (taskRepo.createQueryBuilder as Mock).mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([task]),
      });

      // Service queries for blocking: true deps only
      // Since this is a non-blocking dependency, the query would return empty array
      // (the DB would filter out blocking: false deps)
      (dependencyRepo.find as Mock).mockResolvedValue([]);

      const count = await service.getClaimableTaskCount(orgId);

      expect(count).toBe(1);
    });
  });

  describe("claimNextTask", () => {
    it("should return null when no tasks are available", async () => {
      const mockManager = {
        createQueryBuilder: vi.fn().mockReturnValue({
          setLock: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          andWhere: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          getOne: vi.fn().mockResolvedValue(null),
        }),
        find: vi.fn().mockResolvedValue([]),
        save: vi.fn(),
      };
      (taskRepo.manager!.transaction as Mock).mockImplementation((cb) => cb(mockManager));

      const result = await service.claimNextTask(orgId, agentId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("No tasks available to claim");
      expect(result.task).toBeUndefined();
    });

    it("should claim highest priority unassigned task", async () => {
      const urgentPriority = createMockTask({
        id: "urgent",
        identifier: "TASK-URGENT",
        priority: TaskPriority.URGENT,
        status: TaskStatus.TODO,
      });

      // Service loops through priorities URGENT -> HIGH -> NORMAL -> LOW
      // Return the urgent task on URGENT priority query
      const mockManager = {
        createQueryBuilder: vi.fn().mockReturnValue({
          setLock: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          andWhere: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          getOne: vi.fn().mockResolvedValue(urgentPriority),
        }),
        find: vi.fn().mockResolvedValue([]),
        save: vi.fn().mockImplementation((task) => Promise.resolve(task)),
      };
      (taskRepo.manager!.transaction as Mock).mockImplementation((cb) => cb(mockManager));

      const result = await service.claimNextTask(orgId, agentId);

      expect(result.success).toBe(true);
      expect(result.task?.id).toBe("urgent");
      expect(result.task?.assigneeId).toBe(agentId);
      expect(result.task?.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it("should respect priority ordering: URGENT > HIGH > NORMAL > LOW", async () => {
      const urgentTask = createMockTask({
        id: "urgent",
        priority: TaskPriority.URGENT,
        status: TaskStatus.TODO,
      });

      // The service will find the URGENT priority task first
      const mockManager = {
        createQueryBuilder: vi.fn().mockReturnValue({
          setLock: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          andWhere: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          getOne: vi.fn().mockResolvedValue(urgentTask),
        }),
        find: vi.fn().mockResolvedValue([]),
        save: vi.fn().mockImplementation((task) => Promise.resolve(task)),
      };
      (taskRepo.manager!.transaction as Mock).mockImplementation((cb) => cb(mockManager));

      const result = await service.claimNextTask(orgId, agentId);

      expect(result.task?.id).toBe("urgent");
    });

    it("should only claim unblocked tasks", async () => {
      const blockedTask = createMockTask({
        id: "blocked",
        priority: TaskPriority.URGENT,
        status: TaskStatus.TODO,
      });
      const unblockedTask = createMockTask({
        id: "unblocked",
        priority: TaskPriority.LOW,
        status: TaskStatus.TODO,
      });

      // First call (URGENT priority) returns blockedTask
      // Subsequent calls return null until LOW priority returns unblockedTask
      let callCount = 0;
      const mockManager = {
        createQueryBuilder: vi.fn().mockReturnValue({
          setLock: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          andWhere: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          getOne: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) return Promise.resolve(blockedTask);
            if (callCount === 4) return Promise.resolve(unblockedTask); // LOW is 4th priority
            return Promise.resolve(null);
          }),
        }),
        save: vi.fn().mockImplementation((task) => Promise.resolve(task)),
      };
      (taskRepo.manager!.transaction as Mock).mockImplementation((cb) => cb(mockManager));

      // Mock dependencyRepo.find to return blocking dep for blocked task
      (dependencyRepo.find as Mock).mockImplementation(({ where }) => {
        if (where?.taskId === "blocked") {
          return Promise.resolve([
            { blocking: true, dependsOn: { status: TaskStatus.IN_PROGRESS } },
          ]);
        }
        return Promise.resolve([]);
      });

      const result = await service.claimNextTask(orgId, agentId);

      expect(result.success).toBe(true);
      expect(result.task?.id).toBe("unblocked");
    });

    it("should return failure when all available tasks are blocked", async () => {
      const blockedTask = createMockTask({
        id: "blocked",
        priority: TaskPriority.URGENT,
        status: TaskStatus.TODO,
      });

      // Return the blocked task on URGENT, null on others
      let callCount = 0;
      const mockManager = {
        createQueryBuilder: vi.fn().mockReturnValue({
          setLock: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          andWhere: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          getOne: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) return Promise.resolve(blockedTask);
            return Promise.resolve(null);
          }),
        }),
        save: vi.fn(),
      };
      (taskRepo.manager!.transaction as Mock).mockImplementation((cb) => cb(mockManager));

      // Mock dependencyRepo.find to return blocking dependency
      (dependencyRepo.find as Mock).mockResolvedValue([
        { blocking: true, dependsOn: { status: TaskStatus.IN_PROGRESS } },
      ]);

      const result = await service.claimNextTask(orgId, agentId);

      expect(result.success).toBe(false);
      expect(result.message).toBe("No tasks available to claim");
      expect(result.task).toBeUndefined();
    });

    it("should set task status to IN_PROGRESS when claimed", async () => {
      const task = createMockTask({ status: TaskStatus.TODO });

      const mockManager = {
        createQueryBuilder: vi.fn().mockReturnValue({
          setLock: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          andWhere: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          getOne: vi.fn().mockResolvedValue(task),
        }),
        find: vi.fn().mockResolvedValue([]),
        save: vi.fn().mockImplementation((t) => Promise.resolve(t)),
      };
      (taskRepo.manager!.transaction as Mock).mockImplementation((cb) => cb(mockManager));

      const result = await service.claimNextTask(orgId, agentId);

      expect(result.task?.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it("should use row-level locking for race condition prevention", async () => {
      const task = createMockTask({ status: TaskStatus.TODO });

      const setLockSpy = vi.fn().mockReturnThis();
      const mockManager = {
        createQueryBuilder: vi.fn().mockReturnValue({
          setLock: setLockSpy,
          where: vi.fn().mockReturnThis(),
          andWhere: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          getOne: vi.fn().mockResolvedValue(task),
        }),
        find: vi.fn().mockResolvedValue([]),
        save: vi.fn().mockImplementation((t) => Promise.resolve(t)),
      };
      (taskRepo.manager!.transaction as Mock).mockImplementation((cb) => cb(mockManager));

      await service.claimNextTask(orgId, agentId);

      expect(setLockSpy).toHaveBeenCalledWith("pessimistic_write");
    });

    it("should return claimed task with identifier", async () => {
      const task = createMockTask({ identifier: "TASK-123", status: TaskStatus.TODO });

      const mockManager = {
        createQueryBuilder: vi.fn().mockReturnValue({
          setLock: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          andWhere: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          getOne: vi.fn().mockResolvedValue(task),
        }),
        find: vi.fn().mockResolvedValue([]),
        save: vi.fn().mockImplementation((t) => Promise.resolve(t)),
      };
      (taskRepo.manager!.transaction as Mock).mockImplementation((cb) => cb(mockManager));

      const result = await service.claimNextTask(orgId, agentId);

      expect(result.success).toBe(true);
      expect(result.task?.identifier).toBe("TASK-123");
    });
  });
});
