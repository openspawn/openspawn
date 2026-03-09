import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import { TaskStatus, AgentStatus } from "@openspawn/shared-types";

// ─── Row types (mirror the SQLite schema) ────────────────────────────────────

export interface AgentRow {
  id: string;
  name: string;
  role: string | null;
  level: number;
  department: string | null;
  status: string;
  model: string | null;
  hired_at: string;
  metadata: string | null;
}

export interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  assignee: string | null;
  created_by: string | null;
  priority: number;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  result: string | null;
  metadata: string | null;
}

export interface EventRow {
  id: number;
  timestamp: string;
  agent_id: string | null;
  event_type: string;
  payload: string | null;
  task_id: string | null;
}

export interface EscalationRow {
  id: string;
  from_agent: string;
  to_agent: string | null;
  task_id: string | null;
  reason: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

interface StatusCountRow {
  status: string;
  count: number;
}

interface CountRow {
  count: number;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS agents (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  role        TEXT,
  level       INTEGER DEFAULT 3,
  department  TEXT,
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK(status IN ('active','paused','fired')),
  model       TEXT,
  hired_at    TEXT NOT NULL DEFAULT (datetime('now')),
  metadata    TEXT
);

CREATE TABLE IF NOT EXISTS tasks (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'todo'
                CHECK(status IN ('todo','in_progress','review','done','blocked','cancelled')),
  assignee    TEXT,
  created_by  TEXT,
  priority    INTEGER DEFAULT 0,
  parent_id   TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  result      TEXT,
  metadata    TEXT,
  FOREIGN KEY (assignee) REFERENCES agents(id),
  FOREIGN KEY (parent_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp   TEXT NOT NULL DEFAULT (datetime('now')),
  agent_id    TEXT,
  event_type  TEXT NOT NULL,
  payload     TEXT,
  task_id     TEXT,
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS escalations (
  id          TEXT PRIMARY KEY,
  from_agent  TEXT NOT NULL,
  to_agent    TEXT,
  task_id     TEXT,
  reason      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open'
                CHECK(status IN ('open','acknowledged','resolved','dismissed')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT,
  FOREIGN KEY (from_agent) REFERENCES agents(id),
  FOREIGN KEY (to_agent) REFERENCES agents(id),
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_agent ON events(agent_id);
CREATE INDEX IF NOT EXISTS idx_escalations_status ON escalations(status);
`;

export function createDb(path: string): Database.Database {
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  return db;
}

export function generateId(): string {
  return randomUUID().split("-")[0];
}

// --- Agent operations ---

export function registerAgent(
  db: Database.Database,
  agent: {
    id: string;
    name: string;
    role?: string;
    level?: number;
    department?: string;
    model?: string;
  },
) {
  const stmt = db.prepare(`
    INSERT INTO agents (id, name, role, level, department, model)
    VALUES (@id, @name, @role, @level, @department, @model)
  `);
  stmt.run({
    id: agent.id,
    name: agent.name,
    role: agent.role ?? null,
    level: agent.level ?? 3,
    department: agent.department ?? null,
    model: agent.model ?? null,
  });
  logEvent(db, agent.id, "agent.hire", { name: agent.name, role: agent.role });
}

export function listAgents(db: Database.Database, status?: string): AgentRow[] {
  if (status) {
    return db.prepare<[string], AgentRow>("SELECT * FROM agents WHERE status = ?").all(status);
  }
  return db.prepare<[], AgentRow>("SELECT * FROM agents").all();
}

export function updateAgentStatus(db: Database.Database, id: string, status: string) {
  db.prepare("UPDATE agents SET status = ? WHERE id = ?").run(status, id);
  logEvent(db, id, `agent.${status}`, { id });
}

// --- Task operations ---

export function createTask(
  db: Database.Database,
  task: {
    title: string;
    description?: string;
    assignee?: string;
    created_by?: string;
    priority?: number;
    parent_id?: string;
  },
) {
  const id = generateId();
  db.prepare(`
    INSERT INTO tasks (id, title, description, assignee, created_by, priority, parent_id)
    VALUES (@id, @title, @description, @assignee, @created_by, @priority, @parent_id)
  `).run({
    id,
    title: task.title,
    description: task.description ?? null,
    assignee: task.assignee ?? null,
    created_by: task.created_by ?? null,
    priority: task.priority ?? 0,
    parent_id: task.parent_id ?? null,
  });
  logEvent(db, task.created_by ?? null, "task.create", { id, title: task.title }, id);
  return id;
}

export function claimTask(db: Database.Database, taskId: string, agentId: string) {
  const task = db.prepare<[string], TaskRow>("SELECT * FROM tasks WHERE id = ?").get(taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);
  if (task.status !== TaskStatus.TODO)
    throw new Error(`Task ${taskId} is ${task.status}, not claimable`);

  db.prepare(`
    UPDATE tasks SET assignee = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(agentId, TaskStatus.IN_PROGRESS, taskId);
  logEvent(db, agentId, "task.claim", { taskId }, taskId);
}

export function completeTask(
  db: Database.Database,
  taskId: string,
  agentId: string,
  result?: import("./schemas.js").TaskResult,
) {
  const task = db.prepare<[string], TaskRow>("SELECT * FROM tasks WHERE id = ?").get(taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);

  db.prepare(`
    UPDATE tasks
    SET status = ?, completed_at = datetime('now'), updated_at = datetime('now'), result = ?
    WHERE id = ?
  `).run(TaskStatus.DONE, result ? JSON.stringify(result) : null, taskId);
  logEvent(db, agentId, "task.complete", { taskId, result: result ?? null }, taskId);
}

export function listTasks(
  db: Database.Database,
  filters?: {
    status?: string;
    assignee?: string;
  },
) {
  let query = "SELECT * FROM tasks WHERE 1=1";
  const params: string[] = [];
  if (filters?.status) {
    query += " AND status = ?";
    params.push(filters.status);
  }
  if (filters?.assignee) {
    query += " AND assignee = ?";
    params.push(filters.assignee);
  }
  query += " ORDER BY priority DESC, created_at ASC";
  return db.prepare<string[], TaskRow>(query).all(...params);
}

export function updateTaskStatus(
  db: Database.Database,
  taskId: string,
  status: string,
  agentId?: string,
) {
  db.prepare(`
    UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ?
  `).run(status, taskId);
  logEvent(db, agentId ?? null, `task.${status}`, { taskId }, taskId);
}

// --- Escalation operations ---

export function escalate(
  db: Database.Database,
  opts: {
    from_agent: string;
    to_agent?: string;
    task_id?: string;
    reason: string;
  },
) {
  const id = generateId();
  db.prepare(`
    INSERT INTO escalations (id, from_agent, to_agent, task_id, reason)
    VALUES (@id, @from_agent, @to_agent, @task_id, @reason)
  `).run({
    id,
    from_agent: opts.from_agent,
    to_agent: opts.to_agent ?? null,
    task_id: opts.task_id ?? null,
    reason: opts.reason,
  });
  logEvent(
    db,
    opts.from_agent,
    "escalation.create",
    { id, reason: opts.reason },
    opts.task_id ?? null,
  );
  return id;
}

export function resolveEscalation(db: Database.Database, id: string, agentId: string) {
  db.prepare(`
    UPDATE escalations SET status = 'resolved', resolved_at = datetime('now') WHERE id = ?
  `).run(id);
  logEvent(db, agentId, "escalation.resolve", { id });
}

export function listEscalations(db: Database.Database, status?: string): EscalationRow[] {
  if (status) {
    return db
      .prepare<[string], EscalationRow>("SELECT * FROM escalations WHERE status = ?")
      .all(status);
  }
  return db.prepare<[], EscalationRow>("SELECT * FROM escalations ORDER BY created_at DESC").all();
}

// --- Event operations ---

export function logEvent(
  db: Database.Database,
  agentId: string | null,
  eventType: string,
  payload?: Record<string, unknown> | null,
  taskId?: string | null,
) {
  db.prepare(`
    INSERT INTO events (agent_id, event_type, payload, task_id)
    VALUES (?, ?, ?, ?)
  `).run(agentId, eventType, payload ? JSON.stringify(payload) : null, taskId ?? null);
}

export function getEvents(
  db: Database.Database,
  opts?: {
    limit?: number;
    agent_id?: string;
    event_type?: string;
  },
) {
  let query = "SELECT * FROM events WHERE 1=1";
  const params: (string | number)[] = [];
  if (opts?.agent_id) {
    query += " AND agent_id = ?";
    params.push(opts.agent_id);
  }
  if (opts?.event_type) {
    query += " AND event_type = ?";
    params.push(opts.event_type);
  }
  query += " ORDER BY id DESC";
  if (opts?.limit) {
    query += " LIMIT ?";
    params.push(opts.limit);
  }
  return db.prepare<(string | number)[], EventRow>(query).all(...params);
}

// --- Status/Dashboard ---

export function orgStatus(db: Database.Database) {
  const agents = db
    .prepare<[], StatusCountRow>("SELECT status, COUNT(*) as count FROM agents GROUP BY status")
    .all();
  const tasks = db
    .prepare<[], StatusCountRow>("SELECT status, COUNT(*) as count FROM tasks GROUP BY status")
    .all();
  const openEscalations = db
    .prepare<[string], CountRow>("SELECT COUNT(*) as count FROM escalations WHERE status = ?")
    .get("open");
  const recentEvents = db
    .prepare<[], EventRow>("SELECT * FROM events ORDER BY id DESC LIMIT 10")
    .all();

  return {
    agents: Object.fromEntries(agents.map((r) => [r.status, r.count])),
    tasks: Object.fromEntries(tasks.map((r) => [r.status, r.count])),
    openEscalations: openEscalations?.count ?? 0,
    recentEvents,
  };
}
