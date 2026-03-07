import { describe, it, expect, beforeEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createTask, listTasks, claimTask, updateTask, loadStore } from "./task-store.js";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "openspawn-test-"));
});

describe("task-store", () => {
  it("creates and lists tasks", () => {
    createTask(dir, "Test task 1");
    createTask(dir, "Test task 2");
    const tasks = listTasks(dir);
    expect(tasks.length).toBe(2);
    expect(tasks[0].status).toBe("open");
  });

  it("claims a task", () => {
    createTask(dir, "Claimable task");
    const claimed = claimTask(dir, "agent-1");
    expect(claimed).not.toBeNull();
    expect(claimed!.assignee).toBe("agent-1");
    expect(claimed!.status).toBe("claimed");
  });

  it("returns null when no open tasks", () => {
    const claimed = claimTask(dir, "agent-1");
    expect(claimed).toBeNull();
  });

  it("updates task status", () => {
    const task = createTask(dir, "Update me");
    const updated = updateTask(dir, task.id, { status: "done", pr: 42 });
    expect(updated!.status).toBe("done");
    expect(updated!.pr).toBe(42);
  });

  it("filters by assignee and status", () => {
    createTask(dir, "Task A", { assignee: "alice" });
    createTask(dir, "Task B", { assignee: "bob" });
    createTask(dir, "Task C");
    expect(listTasks(dir, { assignee: "alice" }).length).toBe(1);
    expect(listTasks(dir, { status: "open" }).length).toBe(1);
  });
});
