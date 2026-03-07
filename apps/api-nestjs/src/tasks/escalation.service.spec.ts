import { NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { Agent, Escalation, Task } from "@openspawn/database";
import { AgentStatus, EscalationReason, TaskPriority, TaskStatus } from "@openspawn/shared-types";

import { EventsService } from "../events";

import { EscalationService } from "./escalation.service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeAgent = (overrides: Partial<Agent> = {}): Agent =>
  ({
    id: "agent-1",
    orgId: "org-1",
    agentId: "agent-id-1",
    name: "Worker Agent",
    level: 1,
    status: AgentStatus.ACTIVE,
    parentId: null,
    tasksCompleted: 10,
    ...overrides,
  }) as Agent;

const makeTask = (overrides: Partial<Task> = {}): Task =>
  ({
    id: "task-1",
    orgId: "org-1",
    identifier: "TASK-001",
    title: "Test Task",
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.NORMAL,
    assigneeId: "agent-1",
    assignee: makeAgent(),
    dueDate: null,
    updatedAt: new Date(),
    metadata: {},
    ...overrides,
  }) as Task;

const makeEscalation = (overrides: Partial<Escalation> = {}): Escalation =>
  ({
    id: "esc-1",
    orgId: "org-1",
    taskId: "task-1",
    fromAgentId: "agent-1",
    toAgentId: "agent-2",
    reason: EscalationReason.MANUAL,
    levelsEscalated: 1,
    notes: null,
    isAutomatic: false,
    resolvedAt: null,
    metadata: {},
    createdAt: new Date(),
    ...overrides,
  }) as Escalation;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("EscalationService", () => {
  let service: EscalationService;
  let escalationRepo: Partial<Repository<Escalation>>;
  let taskRepo: Partial<Repository<Task>>;
  let agentRepo: Partial<Repository<Agent>>;
  let eventsService: Partial<EventsService>;

  beforeEach(() => {
    vi.clearAllMocks();

    escalationRepo = {
      create: vi.fn().mockImplementation((data) => data),
      save: vi.fn().mockImplementation((e) => Promise.resolve({ id: "esc-new", ...e })),
      findOne: vi.fn(),
      findOneByOrFail: vi.fn(),
      find: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    };

    taskRepo = {
      findOne: vi.fn(),
      save: vi.fn().mockImplementation((t) => Promise.resolve(t)),
      find: vi.fn().mockResolvedValue([]),
      createQueryBuilder: vi.fn(),
    };

    agentRepo = {
      findOneBy: vi.fn(),
      findOne: vi.fn(),
      find: vi.fn().mockResolvedValue([]),
    };

    eventsService = {
      emit: vi.fn().mockResolvedValue(undefined),
    };

    service = new EscalationService(
      escalationRepo as Repository<Escalation>,
      taskRepo as Repository<Task>,
      agentRepo as Repository<Agent>,
      eventsService as EventsService,
    );
  });

  // -------------------------------------------------------------------------
  // escalateTask
  // -------------------------------------------------------------------------
  describe("escalateTask", () => {
    it("should throw NotFoundException when task does not exist", async () => {
      (taskRepo.findOne as Mock).mockResolvedValue(null);

      await expect(
        service.escalateTask({
          orgId: "org-1",
          taskId: "nonexistent",
          reason: EscalationReason.MANUAL,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw when task has no assignee", async () => {
      const task = makeTask({ assigneeId: undefined as any, assignee: undefined as any });
      (taskRepo.findOne as Mock).mockResolvedValue(task);

      await expect(
        service.escalateTask({
          orgId: "org-1",
          taskId: "task-1",
          reason: EscalationReason.MANUAL,
        }),
      ).rejects.toThrow("Cannot escalate unassigned task");
    });

    it("should escalate to a specific target agent when targetAgentId is provided", async () => {
      const fromAgent = makeAgent({ id: "agent-1", level: 1 });
      const toAgent = makeAgent({ id: "agent-2", level: 2, name: "Senior Agent" });
      const task = makeTask({ assignee: fromAgent, assigneeId: fromAgent.id });

      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (agentRepo.findOneBy as Mock).mockResolvedValue(toAgent);

      const result = await service.escalateTask({
        orgId: "org-1",
        taskId: "task-1",
        reason: EscalationReason.MANUAL,
        targetAgentId: "agent-2",
      });

      expect(result.toAgentId).toBe("agent-2");
      expect(result.fromAgentId).toBe("agent-1");
      expect(result.levelsEscalated).toBe(1);
    });

    it("should throw NotFoundException when specified target agent does not exist", async () => {
      const fromAgent = makeAgent({ id: "agent-1", level: 1 });
      const task = makeTask({ assignee: fromAgent, assigneeId: fromAgent.id });

      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (agentRepo.findOneBy as Mock).mockResolvedValue(null);

      await expect(
        service.escalateTask({
          orgId: "org-1",
          taskId: "task-1",
          reason: EscalationReason.MANUAL,
          targetAgentId: "nonexistent",
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should escalate to parent agent when parentId is set", async () => {
      const parentAgent = makeAgent({ id: "parent-1", level: 2, name: "Parent" });
      const fromAgent = makeAgent({ id: "agent-1", level: 1, parentId: "parent-1" });
      const task = makeTask({ assignee: fromAgent, assigneeId: fromAgent.id });

      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (agentRepo.findOneBy as Mock).mockResolvedValue(parentAgent);

      const result = await service.escalateTask({
        orgId: "org-1",
        taskId: "task-1",
        reason: EscalationReason.BLOCKED_TIMEOUT,
      });

      expect(result.toAgentId).toBe("parent-1");
      expect(result.levelsEscalated).toBe(1);
    });

    it("should throw when parent agent is not found", async () => {
      const fromAgent = makeAgent({ id: "agent-1", level: 1, parentId: "missing-parent" });
      const task = makeTask({ assignee: fromAgent, assigneeId: fromAgent.id });

      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (agentRepo.findOneBy as Mock).mockResolvedValue(null);

      await expect(
        service.escalateTask({
          orgId: "org-1",
          taskId: "task-1",
          reason: EscalationReason.MANUAL,
        }),
      ).rejects.toThrow("Parent agent not found");
    });

    it("should find a higher-level agent when no parent is set", async () => {
      const fromAgent = makeAgent({ id: "agent-1", level: 1, parentId: null });
      const higherAgent = makeAgent({ id: "agent-3", level: 2, name: "L2 Agent" });
      const task = makeTask({ assignee: fromAgent, assigneeId: fromAgent.id });

      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (agentRepo.findOne as Mock).mockResolvedValue(higherAgent);

      const result = await service.escalateTask({
        orgId: "org-1",
        taskId: "task-1",
        reason: EscalationReason.SLA_BREACH,
      });

      expect(result.toAgentId).toBe("agent-3");
    });

    it("should throw when no higher-level agent exists", async () => {
      const fromAgent = makeAgent({ id: "agent-1", level: 5, parentId: null });
      const task = makeTask({ assignee: fromAgent, assigneeId: fromAgent.id });

      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (agentRepo.findOne as Mock).mockResolvedValue(null);

      await expect(
        service.escalateTask({
          orgId: "org-1",
          taskId: "task-1",
          reason: EscalationReason.STALE_TASK,
        }),
      ).rejects.toThrow("No higher-level agent available for escalation");
    });

    it("should reassign the task to the target agent", async () => {
      const fromAgent = makeAgent({ id: "agent-1", level: 1 });
      const toAgent = makeAgent({ id: "agent-2", level: 2 });
      const task = makeTask({ assignee: fromAgent, assigneeId: fromAgent.id });

      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (agentRepo.findOneBy as Mock).mockResolvedValue(toAgent);

      await service.escalateTask({
        orgId: "org-1",
        taskId: "task-1",
        reason: EscalationReason.MANUAL,
        targetAgentId: "agent-2",
      });

      expect(taskRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ assigneeId: "agent-2" }),
      );
    });

    it("should emit task.escalated event", async () => {
      const fromAgent = makeAgent({ id: "agent-1", level: 1 });
      const toAgent = makeAgent({ id: "agent-2", level: 2 });
      const task = makeTask({ assignee: fromAgent, assigneeId: fromAgent.id });

      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (agentRepo.findOneBy as Mock).mockResolvedValue(toAgent);

      await service.escalateTask({
        orgId: "org-1",
        taskId: "task-1",
        reason: EscalationReason.MANUAL,
        targetAgentId: "agent-2",
        notes: "Manual escalation",
      });

      expect(eventsService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: "org-1",
          type: "task.escalated",
          entityId: "task-1",
          data: expect.objectContaining({
            reason: EscalationReason.MANUAL,
            fromAgentId: "agent-1",
            toAgentId: "agent-2",
          }),
        }),
      );
    });

    it("should store notes on the escalation record", async () => {
      const fromAgent = makeAgent({ id: "agent-1", level: 1 });
      const toAgent = makeAgent({ id: "agent-2", level: 2 });
      const task = makeTask({ assignee: fromAgent, assigneeId: fromAgent.id });

      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (agentRepo.findOneBy as Mock).mockResolvedValue(toAgent);

      await service.escalateTask({
        orgId: "org-1",
        taskId: "task-1",
        reason: EscalationReason.BLOCKED_TIMEOUT,
        targetAgentId: "agent-2",
        notes: "Blocked for 48 hours",
      });

      expect(escalationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ notes: "Blocked for 48 hours" }),
      );
    });

    it("should set isAutomatic based on param (default true)", async () => {
      const fromAgent = makeAgent({ id: "agent-1", level: 1 });
      const toAgent = makeAgent({ id: "agent-2", level: 2 });
      const task = makeTask({ assignee: fromAgent, assigneeId: fromAgent.id });

      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (agentRepo.findOneBy as Mock).mockResolvedValue(toAgent);

      await service.escalateTask({
        orgId: "org-1",
        taskId: "task-1",
        reason: EscalationReason.MANUAL,
        targetAgentId: "agent-2",
        isAutomatic: false,
      });

      expect(escalationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ isAutomatic: false }),
      );
    });

    it("should calculate levelsEscalated as difference between agent levels", async () => {
      const fromAgent = makeAgent({ id: "agent-1", level: 2 });
      const toAgent = makeAgent({ id: "agent-2", level: 5 });
      const task = makeTask({ assignee: fromAgent, assigneeId: fromAgent.id });

      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (agentRepo.findOneBy as Mock).mockResolvedValue(toAgent);

      await service.escalateTask({
        orgId: "org-1",
        taskId: "task-1",
        reason: EscalationReason.QUALITY_ISSUES,
        targetAgentId: "agent-2",
      });

      expect(escalationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ levelsEscalated: 3 }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // checkForAutoEscalations
  // -------------------------------------------------------------------------
  describe("checkForAutoEscalations", () => {
    it("should return 0 when there are no blocked or overdue tasks", async () => {
      (agentRepo.find as Mock).mockResolvedValue([]);
      (taskRepo.find as Mock).mockResolvedValue([]);

      const count = await service.checkForAutoEscalations("org-1");

      expect(count).toBe(0);
    });

    it("should not escalate blocked tasks that are within threshold", async () => {
      const agent = makeAgent({ id: "agent-1" });
      const task = makeTask({
        id: "task-1",
        status: TaskStatus.BLOCKED,
        priority: TaskPriority.NORMAL, // 24-hour threshold
        assigneeId: "agent-1",
        assignee: agent,
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      });

      (agentRepo.find as Mock).mockResolvedValue([agent]);
      // First call is for blocked tasks, second for overdue
      (taskRepo.find as Mock).mockResolvedValueOnce([task]).mockResolvedValueOnce([]);

      const count = await service.checkForAutoEscalations("org-1");

      // Task is within 24hr threshold, so should not escalate
      expect(count).toBe(0);
    });

    it("should escalate blocked tasks past the threshold for their priority", async () => {
      const fromAgent = makeAgent({ id: "agent-1", level: 1, parentId: null });
      const higherAgent = makeAgent({ id: "agent-2", level: 2 });
      const task = makeTask({
        id: "task-1",
        status: TaskStatus.BLOCKED,
        priority: TaskPriority.NORMAL, // 24-hour threshold
        assigneeId: "agent-1",
        assignee: fromAgent,
        updatedAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
      });

      (agentRepo.find as Mock).mockResolvedValue([fromAgent]);
      (taskRepo.find as Mock).mockResolvedValueOnce([task]).mockResolvedValueOnce([]);
      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (agentRepo.findOne as Mock).mockResolvedValue(higherAgent);

      const count = await service.checkForAutoEscalations("org-1");

      expect(count).toBe(1);
    });

    it("should escalate overdue tasks that haven't been escalated for SLA", async () => {
      const fromAgent = makeAgent({ id: "agent-1", level: 1, parentId: null });
      const higherAgent = makeAgent({ id: "agent-2", level: 2 });
      const overdueTask = makeTask({
        id: "task-overdue",
        status: TaskStatus.IN_PROGRESS,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // past due
        assigneeId: "agent-1",
        assignee: fromAgent,
      });

      (agentRepo.find as Mock).mockResolvedValue([fromAgent]);
      (taskRepo.find as Mock)
        .mockResolvedValueOnce([]) // blocked tasks
        .mockResolvedValueOnce([overdueTask]); // overdue tasks
      (escalationRepo.findOne as Mock).mockResolvedValue(null); // no existing SLA escalation
      (taskRepo.findOne as Mock).mockResolvedValue(overdueTask);
      (agentRepo.findOne as Mock).mockResolvedValue(higherAgent);

      const count = await service.checkForAutoEscalations("org-1");

      expect(count).toBe(1);
    });

    it("should skip overdue tasks already escalated for SLA", async () => {
      const fromAgent = makeAgent({ id: "agent-1", level: 1 });
      const overdueTask = makeTask({
        id: "task-overdue",
        status: TaskStatus.IN_PROGRESS,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        assigneeId: "agent-1",
        assignee: fromAgent,
      });

      (agentRepo.find as Mock).mockResolvedValue([fromAgent]);
      (taskRepo.find as Mock)
        .mockResolvedValueOnce([]) // no blocked tasks
        .mockResolvedValueOnce([overdueTask]);
      (escalationRepo.findOne as Mock).mockResolvedValue(
        makeEscalation({ reason: EscalationReason.SLA_BREACH, resolvedAt: null }),
      );

      const count = await service.checkForAutoEscalations("org-1");

      expect(count).toBe(0);
    });

    it("should continue processing other tasks when one escalation fails", async () => {
      const fromAgent = makeAgent({ id: "agent-1", level: 1, parentId: null });
      // Use 25 hours ago so the NORMAL fallback threshold (24h) is exceeded
      // (ESCALATION_THRESHOLDS keys are uppercase; TaskPriority values are lowercase,
      //  so URGENT/"urgent" mismatches and we fall back to NORMAL=24h threshold)
      const task1 = makeTask({
        id: "task-1",
        status: TaskStatus.BLOCKED,
        priority: TaskPriority.NORMAL,
        assigneeId: "agent-1",
        assignee: fromAgent,
        updatedAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
      });
      const task2 = makeTask({
        id: "task-2",
        status: TaskStatus.BLOCKED,
        priority: TaskPriority.NORMAL,
        assigneeId: "agent-1",
        assignee: fromAgent,
        updatedAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
      });

      (agentRepo.find as Mock).mockResolvedValue([fromAgent]);
      (taskRepo.find as Mock).mockResolvedValueOnce([task1, task2]).mockResolvedValueOnce([]);

      // First task throws (not found), second succeeds
      const higherAgent = makeAgent({ id: "agent-2", level: 2 });
      (taskRepo.findOne as Mock)
        .mockResolvedValueOnce(null) // task1 fails (not found)
        .mockResolvedValueOnce(task2); // task2 succeeds
      (agentRepo.findOne as Mock).mockResolvedValue(higherAgent);

      // Should not throw, should count only successful escalations
      const count = await service.checkForAutoEscalations("org-1");

      expect(count).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // resolveEscalation
  // -------------------------------------------------------------------------
  describe("resolveEscalation", () => {
    it("should set resolvedAt on the escalation", async () => {
      const escalation = makeEscalation({ resolvedAt: null });
      (escalationRepo.findOneByOrFail as Mock).mockResolvedValue(escalation);
      (escalationRepo.save as Mock).mockImplementation((e) => Promise.resolve(e));

      const result = await service.resolveEscalation("esc-1");

      expect(result.resolvedAt).toBeInstanceOf(Date);
    });

    it("should throw when escalation does not exist", async () => {
      (escalationRepo.findOneByOrFail as Mock).mockRejectedValue(
        new Error("Could not find any entity"),
      );

      await expect(service.resolveEscalation("nonexistent")).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // getTaskEscalations
  // -------------------------------------------------------------------------
  describe("getTaskEscalations", () => {
    it("should return escalations for the given task ordered by createdAt DESC", async () => {
      const escalations = [
        makeEscalation({ id: "esc-2", createdAt: new Date("2024-01-02") }),
        makeEscalation({ id: "esc-1", createdAt: new Date("2024-01-01") }),
      ];
      (escalationRepo.find as Mock).mockResolvedValue(escalations);

      const result = await service.getTaskEscalations("task-1");

      expect(result).toHaveLength(2);
      expect(escalationRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { taskId: "task-1" },
          order: { createdAt: "DESC" },
        }),
      );
    });

    it("should return empty array when no escalations exist", async () => {
      (escalationRepo.find as Mock).mockResolvedValue([]);

      const result = await service.getTaskEscalations("task-no-escals");

      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // getOpenEscalations
  // -------------------------------------------------------------------------
  describe("getOpenEscalations", () => {
    it("should return open (unresolved) escalations for the org", async () => {
      const open = [makeEscalation({ resolvedAt: null })];
      (escalationRepo.find as Mock).mockResolvedValue(open);

      const result = await service.getOpenEscalations("org-1");

      expect(result).toHaveLength(1);
      expect(escalationRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: "org-1" }),
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // getAgentEscalationStats
  // -------------------------------------------------------------------------
  describe("getAgentEscalationStats", () => {
    it("should return correct stats for an agent", async () => {
      (escalationRepo.count as Mock)
        .mockResolvedValueOnce(5) // escalatedFrom
        .mockResolvedValueOnce(3) // escalatedTo
        .mockResolvedValueOnce(2); // resolved (subset of escalatedTo)

      const stats = await service.getAgentEscalationStats("agent-1");

      expect(stats.escalatedFrom).toBe(5);
      expect(stats.escalatedTo).toBe(3);
      expect(stats.resolved).toBe(2);
      expect(stats.pending).toBe(1); // 3 - 2
    });

    it("should return all zeros for an agent with no escalations", async () => {
      (escalationRepo.count as Mock).mockResolvedValue(0);

      const stats = await service.getAgentEscalationStats("new-agent");

      expect(stats.escalatedFrom).toBe(0);
      expect(stats.escalatedTo).toBe(0);
      expect(stats.resolved).toBe(0);
      expect(stats.pending).toBe(0);
    });
  });
});
