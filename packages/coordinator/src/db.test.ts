import { describe, it, expect, beforeEach } from "vitest";
import {
  createDb,
  registerAgent,
  listAgents,
  updateAgentStatus,
  createTask,
  claimTask,
  completeTask,
  listTasks,
  escalate,
  resolveEscalation,
  listEscalations,
  getEvents,
  orgStatus,
} from "./db.js";
import type Database from "better-sqlite3";

let db: Database.Database;

beforeEach(() => {
  db = createDb(":memory:");
});

describe("agents", () => {
  it("registers and lists agents", () => {
    registerAgent(db, { id: "a1", name: "Alice", role: "engineer", level: 5 });
    registerAgent(db, { id: "a2", name: "Bob", role: "reviewer", level: 7 });
    const agents = listAgents(db);
    expect(agents).toHaveLength(2);
  });

  it("filters by status", () => {
    registerAgent(db, { id: "a1", name: "Alice" });
    registerAgent(db, { id: "a2", name: "Bob" });
    updateAgentStatus(db, "a2", "paused");
    expect(listAgents(db, "active")).toHaveLength(1);
    expect(listAgents(db, "paused")).toHaveLength(1);
  });

  it("fires agent", () => {
    registerAgent(db, { id: "a1", name: "Alice" });
    updateAgentStatus(db, "a1", "fired");
    expect(listAgents(db, "fired")).toHaveLength(1);
  });
});

describe("tasks", () => {
  beforeEach(() => {
    registerAgent(db, { id: "a1", name: "Alice" });
    registerAgent(db, { id: "a2", name: "Bob" });
  });

  it("creates and lists tasks", () => {
    const id = createTask(db, { title: "Fix bug", created_by: "a1" });
    expect(id).toBeTruthy();
    const tasks = listTasks(db);
    expect(tasks).toHaveLength(1);
    expect((tasks[0] as any).title).toBe("Fix bug");
  });

  it("claims a task", () => {
    const id = createTask(db, { title: "Fix bug" });
    claimTask(db, id, "a1");
    const tasks = listTasks(db, { assignee: "a1" });
    expect(tasks).toHaveLength(1);
    expect((tasks[0] as any).status).toBe("in_progress");
  });

  it("rejects claiming non-todo task", () => {
    const id = createTask(db, { title: "Fix bug" });
    claimTask(db, id, "a1");
    expect(() => claimTask(db, id, "a2")).toThrow("not claimable");
  });

  it("completes a task", () => {
    const id = createTask(db, { title: "Fix bug" });
    claimTask(db, id, "a1");
    completeTask(db, id, "a1");
    const tasks = listTasks(db, { status: "done" });
    expect(tasks).toHaveLength(1);
    expect((tasks[0] as any).completed_at).toBeTruthy();
  });

  it("filters by status", () => {
    createTask(db, { title: "Todo 1" });
    const id2 = createTask(db, { title: "In progress" });
    claimTask(db, id2, "a1");
    expect(listTasks(db, { status: "todo" })).toHaveLength(1);
    expect(listTasks(db, { status: "in_progress" })).toHaveLength(1);
  });

  it("supports subtasks", () => {
    const parent = createTask(db, { title: "Epic" });
    const child = createTask(db, { title: "Subtask", parent_id: parent });
    const tasks = listTasks(db);
    expect(tasks).toHaveLength(2);
    expect((tasks.find((t: any) => t.id === child) as any).parent_id).toBe(parent);
  });
});

describe("escalations", () => {
  beforeEach(() => {
    registerAgent(db, { id: "a1", name: "Alice" });
    registerAgent(db, { id: "a2", name: "Bob" });
  });

  it("creates and resolves escalation", () => {
    const id = escalate(db, { from_agent: "a1", to_agent: "a2", reason: "Blocked on API key" });
    expect(listEscalations(db, "open")).toHaveLength(1);
    resolveEscalation(db, id, "a2");
    expect(listEscalations(db, "open")).toHaveLength(0);
    expect(listEscalations(db, "resolved")).toHaveLength(1);
  });
});

describe("events", () => {
  it("logs all operations", () => {
    registerAgent(db, { id: "a1", name: "Alice" });
    const taskId = createTask(db, { title: "Test", created_by: "a1" });
    claimTask(db, taskId, "a1");
    completeTask(db, taskId, "a1");

    const events = getEvents(db);
    expect(events.length).toBeGreaterThanOrEqual(4); // hire, create, claim, complete
    expect((events[0] as any).event_type).toBe("task.complete");
  });
});

describe("orgStatus", () => {
  it("returns summary", () => {
    registerAgent(db, { id: "a1", name: "Alice" });
    createTask(db, { title: "T1" });
    createTask(db, { title: "T2" });
    escalate(db, { from_agent: "a1", reason: "Help" });

    const status = orgStatus(db);
    expect(status.agents.active).toBe(1);
    expect(status.tasks.todo).toBe(2);
    expect(status.openEscalations).toBe(1);
    expect(status.recentEvents.length).toBeGreaterThan(0);
  });
});
