// ── File-based Task Store ────────────────────────────────────────────────────

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import type { Task, TaskStore, TaskStatus } from "./types.js";

const EMPTY_STORE: TaskStore = { version: 1, tasks: [], budgets: {} };

function storePath(dir: string): string {
  return join(dir, ".openspawn", "tasks.json");
}

export function loadStore(dir: string): TaskStore {
  const p = storePath(dir);
  if (!existsSync(p)) return { ...EMPTY_STORE, tasks: [], budgets: {} };
  return JSON.parse(readFileSync(p, "utf-8")) as TaskStore;
}

export function saveStore(dir: string, store: TaskStore): void {
  const p = storePath(dir);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(store, null, 2) + "\n");
}

let counter = 0;
function nextId(tasks: Task[]): string {
  const maxNum = tasks.reduce((max, t) => {
    const m = t.id.match(/^task-(\d+)$/);
    return m ? Math.max(max, parseInt(m[1])) : max;
  }, 0);
  counter = Math.max(counter, maxNum);
  return `task-${String(++counter).padStart(3, "0")}`;
}

export function createTask(
  dir: string,
  description: string,
  opts?: { assignee?: string; delegatedBy?: string },
): Task {
  const store = loadStore(dir);
  const now = new Date().toISOString();
  const task: Task = {
    id: nextId(store.tasks),
    description,
    assignee: opts?.assignee,
    delegatedBy: opts?.delegatedBy,
    status: opts?.assignee ? "claimed" : "open",
    createdAt: now,
    updatedAt: now,
  };
  store.tasks.push(task);
  saveStore(dir, store);
  return task;
}

export function listTasks(
  dir: string,
  filter?: { assignee?: string; status?: TaskStatus },
): Task[] {
  const store = loadStore(dir);
  return store.tasks.filter((t) => {
    if (filter?.assignee && t.assignee !== filter.assignee) return false;
    if (filter?.status && t.status !== filter.status) return false;
    return true;
  });
}

export function claimTask(dir: string, agentId: string, taskId?: string): Task | null {
  const store = loadStore(dir);
  let task: Task | undefined;
  if (taskId) {
    task = store.tasks.find((t) => t.id === taskId && t.status === "open");
  } else {
    task = store.tasks.find((t) => t.status === "open");
  }
  if (!task) return null;
  task.assignee = agentId;
  task.status = "claimed";
  task.updatedAt = new Date().toISOString();
  saveStore(dir, store);
  return task;
}

export function updateTask(
  dir: string,
  taskId: string,
  updates: { status?: TaskStatus; pr?: number; assignee?: string },
): Task | null {
  const store = loadStore(dir);
  const task = store.tasks.find((t) => t.id === taskId);
  if (!task) return null;
  if (updates.status) task.status = updates.status;
  if (updates.pr !== undefined) task.pr = updates.pr;
  if (updates.assignee !== undefined) task.assignee = updates.assignee;
  task.updatedAt = new Date().toISOString();
  saveStore(dir, store);
  return task;
}

export function getTask(dir: string, taskId: string): Task | null {
  const store = loadStore(dir);
  return store.tasks.find((t) => t.id === taskId) ?? null;
}
