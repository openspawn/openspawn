import { NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { Agent, AgentCapability, Task } from "@openspawn/database";
import { AgentStatus, Proficiency } from "@openspawn/shared-types";

import { EventsService } from "../events";

import { TaskRoutingService, type RoutingCandidate } from "./task-routing.service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeAgent = (overrides: Partial<Agent> = {}): Agent =>
  ({
    id: "agent-1",
    orgId: "org-1",
    name: "Worker Agent",
    level: 1,
    status: AgentStatus.ACTIVE,
    tasksCompleted: 0,
    ...overrides,
  }) as Agent;

const makeCapability = (
  agentId: string,
  capability: string,
  proficiency = Proficiency.STANDARD,
): AgentCapability =>
  ({
    id: `cap-${agentId}-${capability}`,
    orgId: "org-1",
    agentId,
    capability,
    proficiency,
    createdAt: new Date(),
  }) as AgentCapability;

const makeTask = (overrides: Partial<Task> = {}): Task =>
  ({
    id: "task-1",
    orgId: "org-1",
    identifier: "TASK-001",
    title: "Test Task",
    assigneeId: null,
    metadata: { requiredCapabilities: ["typescript", "nestjs"] },
    ...overrides,
  }) as Task;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("TaskRoutingService", () => {
  let service: TaskRoutingService;
  let taskRepo: Partial<Repository<Task>>;
  let agentRepo: Partial<Repository<Agent>>;
  let capabilityRepo: Partial<Repository<AgentCapability>>;
  let eventsService: Partial<EventsService>;

  const makeQueryBuilder = (rawResults: Record<string, string>[] = []) => ({
    select: vi.fn().mockReturnThis(),
    addSelect: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    getRawMany: vi.fn().mockResolvedValue(rawResults),
  });

  beforeEach(() => {
    vi.clearAllMocks();

    taskRepo = {
      findOne: vi.fn(),
      save: vi.fn().mockImplementation((t) => Promise.resolve(t)),
      createQueryBuilder: vi.fn().mockReturnValue(makeQueryBuilder()),
    };

    agentRepo = {
      find: vi.fn().mockResolvedValue([]),
    };

    capabilityRepo = {
      find: vi.fn().mockResolvedValue([]),
    };

    eventsService = {
      emit: vi.fn().mockResolvedValue(undefined),
    };

    service = new TaskRoutingService(
      taskRepo as Repository<Task>,
      agentRepo as Repository<Agent>,
      capabilityRepo as Repository<AgentCapability>,
      eventsService as EventsService,
    );
  });

  // -------------------------------------------------------------------------
  // findCandidates
  // -------------------------------------------------------------------------
  describe("findCandidates", () => {
    it("should throw NotFoundException when task does not exist", async () => {
      (taskRepo.findOne as Mock).mockResolvedValue(null);

      await expect(
        service.findCandidates("org-1", "nonexistent"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should return empty candidates when task has no required capabilities", async () => {
      const task = makeTask({ metadata: {} });
      (taskRepo.findOne as Mock).mockResolvedValue(task);

      const result = await service.findCandidates("org-1", "task-1");

      expect(result.candidates).toEqual([]);
      expect(result.bestMatch).toBeNull();
      expect(result.autoAssigned).toBe(false);
    });

    it("should return empty candidates when no agents have matching capabilities", async () => {
      const task = makeTask({ metadata: { requiredCapabilities: ["rare-skill"] } });
      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (capabilityRepo.find as Mock).mockResolvedValue([]);

      const result = await service.findCandidates("org-1", "task-1");

      expect(result.candidates).toEqual([]);
      expect(result.bestMatch).toBeNull();
      expect(result.requiredCapabilities).toEqual(["rare-skill"]);
    });

    it("should return candidates sorted by score descending", async () => {
      const task = makeTask({ metadata: { requiredCapabilities: ["typescript"] } });
      const agent1 = makeAgent({ id: "agent-1", name: "Junior", level: 1 });
      const agent2 = makeAgent({ id: "agent-2", name: "Expert", level: 5 });

      const caps = [
        makeCapability("agent-1", "typescript", Proficiency.BASIC),
        makeCapability("agent-2", "typescript", Proficiency.EXPERT),
      ];

      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (capabilityRepo.find as Mock).mockResolvedValue(caps);
      (agentRepo.find as Mock).mockResolvedValue([agent1, agent2]);
      (taskRepo.createQueryBuilder as Mock).mockReturnValue(makeQueryBuilder());

      const result = await service.findCandidates("org-1", "task-1");

      expect(result.candidates.length).toBeGreaterThan(0);
      // Best match should have higher score
      const scores = result.candidates.map((c) => c.score);
      for (let i = 0; i < scores.length - 1; i++) {
        expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
      }
    });

    it("should exclude specified agent IDs", async () => {
      const task = makeTask({ metadata: { requiredCapabilities: ["typescript"] } });
      const agent1 = makeAgent({ id: "agent-1" });
      const agent2 = makeAgent({ id: "agent-2" });

      const caps = [
        makeCapability("agent-1", "typescript"),
        makeCapability("agent-2", "typescript"),
      ];

      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (capabilityRepo.find as Mock).mockResolvedValue(caps);
      (agentRepo.find as Mock).mockResolvedValue([agent1, agent2]);
      (taskRepo.createQueryBuilder as Mock).mockReturnValue(makeQueryBuilder());

      const result = await service.findCandidates("org-1", "task-1", {
        excludeAgentIds: ["agent-1"],
      });

      expect(result.candidates.every((c) => c.agentId !== "agent-1")).toBe(true);
    });

    it("should filter candidates below minCoverage threshold", async () => {
      const task = makeTask({ metadata: { requiredCapabilities: ["skill-a", "skill-b"] } });
      const agent = makeAgent({ id: "agent-1" });
      // Only has one of two required capabilities → 50% coverage
      const caps = [makeCapability("agent-1", "skill-a")];

      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (capabilityRepo.find as Mock).mockResolvedValue(caps);
      (agentRepo.find as Mock).mockResolvedValue([agent]);
      (taskRepo.createQueryBuilder as Mock).mockReturnValue(makeQueryBuilder());

      const result = await service.findCandidates("org-1", "task-1", { minCoverage: 80 });

      expect(result.candidates).toHaveLength(0);
      expect(result.bestMatch).toBeNull();
    });

    it("should respect maxResults limit", async () => {
      const task = makeTask({ metadata: { requiredCapabilities: ["typescript"] } });
      const agents = [
        makeAgent({ id: "agent-1" }),
        makeAgent({ id: "agent-2" }),
        makeAgent({ id: "agent-3" }),
      ];
      const caps = agents.map((a) => makeCapability(a.id, "typescript"));

      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (capabilityRepo.find as Mock).mockResolvedValue(caps);
      (agentRepo.find as Mock).mockResolvedValue(agents);
      (taskRepo.createQueryBuilder as Mock).mockReturnValue(makeQueryBuilder());

      const result = await service.findCandidates("org-1", "task-1", { maxResults: 2 });

      expect(result.candidates.length).toBeLessThanOrEqual(2);
    });

    it("should set the best match to the highest scoring candidate", async () => {
      const task = makeTask({ metadata: { requiredCapabilities: ["typescript"] } });
      const agent1 = makeAgent({ id: "agent-1", level: 1 });
      const agent2 = makeAgent({ id: "agent-2", level: 10 }); // Much higher level

      const caps = [
        makeCapability("agent-1", "typescript", Proficiency.BASIC),
        makeCapability("agent-2", "typescript", Proficiency.EXPERT),
      ];

      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (capabilityRepo.find as Mock).mockResolvedValue(caps);
      (agentRepo.find as Mock).mockResolvedValue([agent1, agent2]);
      (taskRepo.createQueryBuilder as Mock).mockReturnValue(makeQueryBuilder());

      const result = await service.findCandidates("org-1", "task-1");

      expect(result.bestMatch).not.toBeNull();
      expect(result.bestMatch!.agentId).toBe("agent-2"); // Higher level expert wins
    });

    it("should include coverage percentage in candidate info", async () => {
      const task = makeTask({ metadata: { requiredCapabilities: ["skill-a", "skill-b"] } });
      const agent = makeAgent({ id: "agent-1" });
      // Only has skill-a (50% coverage)
      const caps = [makeCapability("agent-1", "skill-a")];

      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (capabilityRepo.find as Mock).mockResolvedValue(caps);
      (agentRepo.find as Mock).mockResolvedValue([agent]);
      (taskRepo.createQueryBuilder as Mock).mockReturnValue(makeQueryBuilder());

      const result = await service.findCandidates("org-1", "task-1");

      const candidate = result.candidates[0];
      expect(candidate.coveragePercent).toBe(50);
      expect(candidate.missingCapabilities).toContain("skill-b");
    });

    it("should factor in workload (lower task count = higher score)", async () => {
      const task = makeTask({ metadata: { requiredCapabilities: ["typescript"] } });
      const idleAgent = makeAgent({ id: "idle-agent", level: 3 });
      const busyAgent = makeAgent({ id: "busy-agent", level: 3 });

      const caps = [
        makeCapability("idle-agent", "typescript", Proficiency.STANDARD),
        makeCapability("busy-agent", "typescript", Proficiency.STANDARD),
      ];

      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (capabilityRepo.find as Mock).mockResolvedValue(caps);
      (agentRepo.find as Mock).mockResolvedValue([idleAgent, busyAgent]);

      // idle has 0 tasks, busy has 8 tasks
      const qb = makeQueryBuilder([
        { assigneeId: "busy-agent", count: "8" },
      ]);
      (taskRepo.createQueryBuilder as Mock).mockReturnValue(qb);

      const result = await service.findCandidates("org-1", "task-1");

      const idleCandidate = result.candidates.find((c) => c.agentId === "idle-agent");
      const busyCandidate = result.candidates.find((c) => c.agentId === "busy-agent");

      expect(idleCandidate!.score).toBeGreaterThan(busyCandidate!.score);
    });

    it("should return autoAssigned: false", async () => {
      const task = makeTask({ metadata: { requiredCapabilities: ["typescript"] } });
      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (capabilityRepo.find as Mock).mockResolvedValue([]);

      const result = await service.findCandidates("org-1", "task-1");

      expect(result.autoAssigned).toBe(false);
    });

    it("should normalize required capabilities to lowercase", async () => {
      const task = makeTask({ metadata: { requiredCapabilities: ["TypeScript", " NestJS "] } });
      const agent = makeAgent({ id: "agent-1" });
      const caps = [
        makeCapability("agent-1", "typescript"),
        makeCapability("agent-1", "nestjs"),
      ];

      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (capabilityRepo.find as Mock).mockResolvedValue(caps);
      (agentRepo.find as Mock).mockResolvedValue([agent]);
      (taskRepo.createQueryBuilder as Mock).mockReturnValue(makeQueryBuilder());

      const result = await service.findCandidates("org-1", "task-1");

      expect(result.requiredCapabilities).toEqual(["typescript", "nestjs"]);
    });
  });

  // -------------------------------------------------------------------------
  // autoAssign
  // -------------------------------------------------------------------------
  describe("autoAssign", () => {
    it("should return result with autoAssigned: false when no candidates found", async () => {
      const task = makeTask({ metadata: { requiredCapabilities: ["ultra-rare"] } });
      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (capabilityRepo.find as Mock).mockResolvedValue([]);

      const result = await service.autoAssign("org-1", "actor-1", "task-1");

      expect(result.autoAssigned).toBe(false);
      expect(result.bestMatch).toBeNull();
      // Should not have saved the task
      expect(taskRepo.save).not.toHaveBeenCalled();
    });

    it("should assign task to the best matching agent", async () => {
      const task = makeTask({ metadata: { requiredCapabilities: ["typescript"] } });
      const agent = makeAgent({ id: "agent-1", name: "TypeScript Expert" });
      const caps = [makeCapability("agent-1", "typescript", Proficiency.EXPERT)];

      (taskRepo.findOne as Mock)
        .mockResolvedValueOnce(task) // findCandidates call
        .mockResolvedValueOnce(task); // autoAssign re-fetches task
      (capabilityRepo.find as Mock).mockResolvedValue(caps);
      (agentRepo.find as Mock).mockResolvedValue([agent]);
      (taskRepo.createQueryBuilder as Mock).mockReturnValue(makeQueryBuilder());

      const result = await service.autoAssign("org-1", "actor-1", "task-1");

      expect(result.autoAssigned).toBe(true);
      expect(result.bestMatch?.agentId).toBe("agent-1");
      expect(taskRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ assigneeId: "agent-1" }),
      );
    });

    it("should emit task.auto_assigned event after assigning", async () => {
      const task = makeTask({ metadata: { requiredCapabilities: ["python"] }, assigneeId: null });
      const agent = makeAgent({ id: "agent-py", name: "Python Dev" });
      const caps = [makeCapability("agent-py", "python", Proficiency.EXPERT)];

      (taskRepo.findOne as Mock)
        .mockResolvedValueOnce(task)
        .mockResolvedValueOnce(task);
      (capabilityRepo.find as Mock).mockResolvedValue(caps);
      (agentRepo.find as Mock).mockResolvedValue([agent]);
      (taskRepo.createQueryBuilder as Mock).mockReturnValue(makeQueryBuilder());

      await service.autoAssign("org-1", "actor-1", "task-1");

      expect(eventsService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "task.auto_assigned",
          orgId: "org-1",
          entityId: "task-1",
          data: expect.objectContaining({ newAssignee: "agent-py" }),
        }),
      );
    });

    it("should throw NotFoundException when task not found during assignment", async () => {
      const task = makeTask({ metadata: { requiredCapabilities: ["typescript"] } });
      const agent = makeAgent({ id: "agent-1" });
      const caps = [makeCapability("agent-1", "typescript")];

      (taskRepo.findOne as Mock)
        .mockResolvedValueOnce(task) // findCandidates
        .mockResolvedValueOnce(null); // second findOne for actual assignment
      (capabilityRepo.find as Mock).mockResolvedValue(caps);
      (agentRepo.find as Mock).mockResolvedValue([agent]);
      (taskRepo.createQueryBuilder as Mock).mockReturnValue(makeQueryBuilder());

      await expect(
        service.autoAssign("org-1", "actor-1", "task-1"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should respect minCoverage option", async () => {
      const task = makeTask({ metadata: { requiredCapabilities: ["a", "b", "c"] } });
      const agent = makeAgent({ id: "agent-1" });
      // Only covers 1/3 capabilities = ~33% coverage
      const caps = [makeCapability("agent-1", "a")];

      (taskRepo.findOne as Mock).mockResolvedValue(task);
      (capabilityRepo.find as Mock).mockResolvedValue(caps);
      (agentRepo.find as Mock).mockResolvedValue([agent]);
      (taskRepo.createQueryBuilder as Mock).mockReturnValue(makeQueryBuilder());

      const result = await service.autoAssign("org-1", "actor-1", "task-1", { minCoverage: 80 });

      expect(result.autoAssigned).toBe(false);
      expect(taskRepo.save).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // suggestAgents
  // -------------------------------------------------------------------------
  describe("suggestAgents", () => {
    it("should return empty array when no agents have matching capabilities", async () => {
      (capabilityRepo.find as Mock).mockResolvedValue([]);

      const result = await service.suggestAgents("org-1", ["rare-skill"]);

      expect(result).toEqual([]);
    });

    it("should return suggestions sorted by score descending", async () => {
      const agent1 = makeAgent({ id: "agent-1", level: 1 });
      const agent2 = makeAgent({ id: "agent-2", level: 5 });
      const caps = [
        makeCapability("agent-1", "python", Proficiency.BASIC),
        makeCapability("agent-2", "python", Proficiency.EXPERT),
      ];

      (capabilityRepo.find as Mock).mockResolvedValue(caps);
      (agentRepo.find as Mock).mockResolvedValue([agent1, agent2]);

      const result = await service.suggestAgents("org-1", ["python"]);

      const scores = result.map((c) => c.score);
      for (let i = 0; i < scores.length - 1; i++) {
        expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
      }
    });

    it("should limit results to the specified number", async () => {
      const agents = Array.from({ length: 10 }, (_, i) =>
        makeAgent({ id: `agent-${i}`, level: i + 1 }),
      );
      const caps = agents.map((a) => makeCapability(a.id, "skill-x"));

      (capabilityRepo.find as Mock).mockResolvedValue(caps);
      (agentRepo.find as Mock).mockResolvedValue(agents);

      const result = await service.suggestAgents("org-1", ["skill-x"], 3);

      expect(result.length).toBeLessThanOrEqual(3);
    });

    it("should use default limit of 5", async () => {
      const agents = Array.from({ length: 10 }, (_, i) =>
        makeAgent({ id: `agent-${i}`, level: i + 1 }),
      );
      const caps = agents.map((a) => makeCapability(a.id, "skill-y"));

      (capabilityRepo.find as Mock).mockResolvedValue(caps);
      (agentRepo.find as Mock).mockResolvedValue(agents);

      const result = await service.suggestAgents("org-1", ["skill-y"]);

      expect(result.length).toBeLessThanOrEqual(5);
    });

    it("should only include ACTIVE agents", async () => {
      const activeAgent = makeAgent({ id: "active", status: AgentStatus.ACTIVE });
      const caps = [makeCapability("active", "react")];

      (capabilityRepo.find as Mock).mockResolvedValue(caps);
      // agentRepo.find called with filter for ACTIVE status
      (agentRepo.find as Mock).mockResolvedValue([activeAgent]);

      const result = await service.suggestAgents("org-1", ["react"]);

      expect(agentRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: AgentStatus.ACTIVE }),
        }),
      );
      expect(result.every((c: RoutingCandidate) => c.agentId === "active")).toBe(true);
    });

    it("should normalize capability names to lowercase", async () => {
      (capabilityRepo.find as Mock).mockResolvedValue([]);

      await service.suggestAgents("org-1", ["TypeScript", "REACT"]);

      // TypeORM wraps the array in an In() FindOperator — inspect the internal _value
      expect(capabilityRepo.find).toHaveBeenCalledTimes(1);
      const callArg = (capabilityRepo.find as Mock).mock.calls[0][0] as {
        where: { orgId: string; capability: { _value: string[] } };
      };
      expect(callArg.where.orgId).toBe("org-1");
      expect(callArg.where.capability._value).toEqual(
        expect.arrayContaining(["typescript", "react"]),
      );
    });

    it("should compute coverage percent correctly", async () => {
      const agent = makeAgent({ id: "agent-1" });
      // Has 1 of 2 required capabilities
      const caps = [makeCapability("agent-1", "skill-a")];

      (capabilityRepo.find as Mock).mockResolvedValue(caps);
      (agentRepo.find as Mock).mockResolvedValue([agent]);

      const result = await service.suggestAgents("org-1", ["skill-a", "skill-b"]);

      expect(result[0].coveragePercent).toBe(50);
      expect(result[0].missingCapabilities).toContain("skill-b");
    });
  });
});
