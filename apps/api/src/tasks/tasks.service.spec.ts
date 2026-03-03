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
        getOne: vi.fn().mockResolvedValue(null),
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
      const task = createMockTask({ id: "task-1", status: TaskStatus.BACKLOG });

      (taskRepo.createQueryBuilder as Mock).mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([task]),
      });

      // Non-blocking dependencies are not returned when querying with blocking: true
      // So return empty array to simulate no blocking dependencies
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
      expect(result.task).toBeNull();
    });

    it("should claim the first task at URGENT priority", async () => {
      const urgentTask = createMockTask({
        id: "urgent",
        identifier: "TASK-URGENT",
        priority: TaskPriority.URGENT,
        status: TaskStatus.TODO,
      });

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

      expect(result.success).toBe(true);
      expect(result.task?.id).toBe("urgent");
      expect(result.task?.assigneeId).toBe(agentId);
      expect(result.task?.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it("should try lower priorities when higher priorities have no tasks", async () => {
      const normalTask = createMockTask({
        id: "normal",
        identifier: "TASK-NORMAL",
        priority: TaskPriority.NORMAL,
        status: TaskStatus.TODO,
      });

      let callCount = 0;
      const mockManager = {
        createQueryBuilder: vi.fn().mockReturnValue({
          setLock: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          andWhere: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          getOne: vi.fn().mockImplementation(() => {
            callCount++;
            // Return null for URGENT, HIGH; return task for NORMAL
            if (callCount <= 2) return Promise.resolve(null);
            return Promise.resolve(normalTask);
          }),
        }),
        find: vi.fn().mockResolvedValue([]),
        save: vi.fn().mockImplementation((task) => Promise.resolve(task)),
      };
      (taskRepo.manager!.transaction as Mock).mockImplementation((cb) => cb(mockManager));

      const result = await service.claimNextTask(orgId, agentId);

      expect(result.success).toBe(true);
      expect(result.task?.id).toBe("normal");
    });

    it("should skip blocked tasks and try next priority", async () => {
      const urgentBlockedTask = createMockTask({
        id: "blocked",
        priority: TaskPriority.URGENT,
        status: TaskStatus.TODO,
      });
      const highTask = createMockTask({
        id: "high",
        priority: TaskPriority.HIGH,
        status: TaskStatus.TODO,
      });

      let callCount = 0;
      const mockManager = {
        createQueryBuilder: vi.fn().mockReturnValue({
          setLock: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          andWhere: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          getOne: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) return Promise.resolve(urgentBlockedTask);
            if (callCount === 2) return Promise.resolve(highTask);
            return Promise.resolve(null);
          }),
        }),
        save: vi.fn().mockImplementation((task) => Promise.resolve(task)),
      };
      (taskRepo.manager!.transaction as Mock).mockImplementation((cb) => cb(mockManager));

      // Mock dependencyRepo.find (used inside the transaction)
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
      expect(result.task?.id).toBe("high");
    });

    it("should return failure when no tasks available at any priority", async () => {
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
      expect(result.task).toBeNull();
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

    it("should include task identifier in success message", async () => {
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

      expect(result.message).toContain("TASK-123");
    });
  });
});

// =============================================================================
// Additional coverage: create, findAll, findOne, approve, assign
// =============================================================================

describe("TasksService - create / findAll / findOne / approve / assign", () => {
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

  const orgId = "org-abc";
  const actorId = "actor-xyz";

  const createMockTask = (overrides: Partial<Task> = {}): Task =>
    ({
      id: "task-1",
      orgId,
      identifier: "TASK-001",
      title: "Test Task",
      description: "A test task",
      status: TaskStatus.BACKLOG,
      priority: TaskPriority.NORMAL,
      creatorId: actorId,
      assigneeId: null,
      approvalRequired: false,
      approvedAt: undefined,
      approvedBy: undefined,
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
      save: vi.fn().mockImplementation((t) => Promise.resolve(t as Task)),
      create: vi.fn().mockImplementation((data) => data as Task),
      createQueryBuilder: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      }),
      manager: {
        transaction: vi.fn(),
      } as any,
    };

    dependencyRepo = {
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(null),
      save: vi.fn(),
      create: vi.fn().mockImplementation((data) => data),
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    tagRepo = {
      create: vi.fn().mockImplementation((data) => data),
      save: vi.fn().mockResolvedValue(undefined),
    };

    commentRepo = {
      create: vi.fn().mockImplementation((data) => data),
      save: vi.fn().mockResolvedValue(undefined),
      find: vi.fn().mockResolvedValue([]),
    };

    taskIdentifierService = {
      generateIdentifier: vi.fn().mockResolvedValue("TASK-042"),
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

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe("create", () => {
    it("should generate an identifier and save the task", async () => {
      const savedTask = createMockTask({ id: "new-task", identifier: "TASK-042" });
      (taskRepo.save as Mock).mockResolvedValue(savedTask);
      (taskRepo.findOne as Mock).mockResolvedValue(savedTask);

      const result = await service.create(orgId, actorId, {
        title: "New Task",
        priority: TaskPriority.HIGH,
      });

      expect(taskIdentifierService.generateIdentifier).toHaveBeenCalledWith(orgId);
      expect(taskRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ orgId, title: "New Task" }),
      );
      expect(taskRepo.save).toHaveBeenCalled();
      expect(result.id).toBe("new-task");
    });

    it("should default status to BACKLOG", async () => {
      const savedTask = createMockTask({ status: TaskStatus.BACKLOG });
      (taskRepo.save as Mock).mockResolvedValue(savedTask);
      (taskRepo.findOne as Mock).mockResolvedValue(savedTask);

      await service.create(orgId, actorId, { title: "Task", priority: TaskPriority.NORMAL });

      expect(taskRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: TaskStatus.BACKLOG }),
      );
    });

    it("should set creatorId to actorId", async () => {
      const savedTask = createMockTask({ creatorId: actorId });
      (taskRepo.save as Mock).mockResolvedValue(savedTask);
      (taskRepo.findOne as Mock).mockResolvedValue(savedTask);

      await service.create(orgId, actorId, { title: "Task", priority: TaskPriority.NORMAL });

      expect(taskRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ creatorId: actorId }),
      );
    });

    it("should emit task.created event", async () => {
      const savedTask = createMockTask({ id: "event-task" });
      (taskRepo.save as Mock).mockResolvedValue(savedTask);
      (taskRepo.findOne as Mock).mockResolvedValue(savedTask);

      await service.create(orgId, actorId, { title: "Task", priority: TaskPriority.NORMAL });

      expect(eventsService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId,
          type: "task.created",
          actorId,
          entityType: "task",
        }),
      );
    });

    it("should default approvalRequired to false", async () => {
      const savedTask = createMockTask();
      (taskRepo.save as Mock).mockResolvedValue(savedTask);
      (taskRepo.findOne as Mock).mockResolvedValue(savedTask);

      await service.create(orgId, actorId, { title: "Task", priority: TaskPriority.NORMAL });

      expect(taskRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ approvalRequired: false }),
      );
    });

    it("should set approvalRequired when provided in DTO", async () => {
      const savedTask = createMockTask({ approvalRequired: true });
      (taskRepo.save as Mock).mockResolvedValue(savedTask);
      (taskRepo.findOne as Mock).mockResolvedValue(savedTask);

      await service.create(orgId, actorId, {
        title: "Approval Task",
        priority: TaskPriority.HIGH,
        approvalRequired: true,
      });

      expect(taskRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ approvalRequired: true }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------
  describe("findAll", () => {
    it("should return all tasks for an org (no filters)", async () => {
      const tasks = [createMockTask(), createMockTask({ id: "task-2" })];
      const qb = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(tasks),
      };
      (taskRepo.createQueryBuilder as Mock).mockReturnValue(qb);

      const result = await service.findAll(orgId);

      expect(qb.where).toHaveBeenCalledWith("task.org_id = :orgId", { orgId });
      expect(result).toHaveLength(2);
    });

    it("should apply status filter when provided", async () => {
      const qb = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      };
      (taskRepo.createQueryBuilder as Mock).mockReturnValue(qb);

      await service.findAll(orgId, { status: TaskStatus.IN_PROGRESS });

      expect(qb.andWhere).toHaveBeenCalledWith("task.status = :status", {
        status: TaskStatus.IN_PROGRESS,
      });
    });

    it("should apply assigneeId filter when provided", async () => {
      const qb = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      };
      (taskRepo.createQueryBuilder as Mock).mockReturnValue(qb);

      await service.findAll(orgId, { assigneeId: "agent-42" });

      expect(qb.andWhere).toHaveBeenCalledWith("task.assignee_id = :assigneeId", {
        assigneeId: "agent-42",
      });
    });

    it("should return empty array when no tasks match", async () => {
      const qb = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      };
      (taskRepo.createQueryBuilder as Mock).mockReturnValue(qb);

      const result = await service.findAll(orgId);

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // findOne
  // ---------------------------------------------------------------------------
  describe("findOne", () => {
    it("should return task when found", async () => {
      const task = createMockTask({ id: "found-task" });
      (taskRepo.findOne as Mock).mockResolvedValue(task);

      const result = await service.findOne(orgId, "found-task");

      expect(result.id).toBe("found-task");
      expect(taskRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "found-task", orgId },
        }),
      );
    });

    it("should throw NotFoundException when task does not exist", async () => {
      (taskRepo.findOne as Mock).mockResolvedValue(null);

      await expect(service.findOne(orgId, "nonexistent")).rejects.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // approve
  // ---------------------------------------------------------------------------
  describe("approve", () => {
    it("should throw when task does not require approval", async () => {
      const task = createMockTask({ approvalRequired: false });
      (taskRepo.findOne as Mock).mockResolvedValue(task);

      await expect(service.approve(orgId, actorId, task.id)).rejects.toThrow();
    });

    it("should throw when task is already approved", async () => {
      const task = createMockTask({
        approvalRequired: true,
        approvedAt: new Date(),
      });
      (taskRepo.findOne as Mock).mockResolvedValue(task);

      await expect(service.approve(orgId, actorId, task.id)).rejects.toThrow();
    });

    it("should set approvedAt and approvedBy on the task", async () => {
      const task = createMockTask({
        approvalRequired: true,
        approvedAt: undefined,
      });
      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (taskRepo.save as Mock).mockImplementation((t) => Promise.resolve(t));

      const result = await service.approve(orgId, actorId, task.id);

      expect(result.approvedAt).toBeInstanceOf(Date);
      expect(result.approvedBy).toBe(actorId);
    });

    it("should emit task.approved event", async () => {
      const task = createMockTask({ approvalRequired: true, approvedAt: undefined });
      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (taskRepo.save as Mock).mockImplementation((t) => Promise.resolve(t));

      await service.approve(orgId, actorId, task.id);

      expect(eventsService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId,
          type: "task.approved",
          actorId,
          entityType: "task",
          entityId: task.id,
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // assign
  // ---------------------------------------------------------------------------
  describe("assign", () => {
    it("should update assigneeId on the task", async () => {
      const task = createMockTask({ assigneeId: null });
      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (taskRepo.save as Mock).mockImplementation((t) => Promise.resolve(t));

      const result = await service.assign(orgId, actorId, task.id, "new-agent");

      expect(result.assigneeId).toBe("new-agent");
    });

    it("should emit task.assigned event with previous and new assignee", async () => {
      const task = createMockTask({ assigneeId: "old-agent" });
      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (taskRepo.save as Mock).mockImplementation((t) => Promise.resolve(t));

      await service.assign(orgId, actorId, task.id, "new-agent");

      expect(eventsService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId,
          type: "task.assigned",
          actorId,
          entityId: task.id,
          data: expect.objectContaining({
            previousAssignee: "old-agent",
            newAssignee: "new-agent",
          }),
        }),
      );
    });

    it("should throw NotFoundException when task does not exist", async () => {
      (taskRepo.findOne as Mock).mockResolvedValue(null);

      await expect(
        service.assign(orgId, actorId, "nonexistent", "agent-1"),
      ).rejects.toThrow();
    });

    it("should save the task after updating the assignee", async () => {
      const task = createMockTask({ assigneeId: null });
      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (taskRepo.save as Mock).mockImplementation((t) => Promise.resolve(t));

      await service.assign(orgId, actorId, task.id, "agent-1");

      expect(taskRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ assigneeId: "agent-1" }),
      );
    });
  });
});
