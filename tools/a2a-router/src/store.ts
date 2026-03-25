// ── SQLite Store ─────────────────────────────────────────────────────────────

import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { v4 as uuidv4 } from "uuid";
import type {
  AgentCard as InternalAgentCard,
  AgentRow,
  CompleteTaskRequest,
  Task as InternalTask,
  TaskStatus as InternalTaskStatus,
} from "./types.js";
import type {
  Message as A2AMessage,
  Task as A2ATask,
  TaskState as A2ATaskState,
  TasksListParams,
  TasksListResult,
} from "./a2a-types.js";

const DEFAULT_DB_PATH = `${process.env.HOME}/.openspawn/a2a/tasks.db`;

// ── Internal DB row types ────────────────────────────────────────────────────

interface TaskRow {
  id: string;
  sender_id: string;
  target_id: string;
  message: string;
  status: string;
  result: string | null;
  context_id: string | null;
  messages_json: string | null;
  artifacts_json: string | null;
  metadata_json: string | null;
  created_at: string;
  updated_at: string;
}

export class Store {
  private db: Database.Database;

  constructor(dbPath: string = DEFAULT_DB_PATH) {
    // Auto-create directory
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.migrate();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agents (
        agent_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        skills TEXT,
        gateway_url TEXT NOT NULL,
        gateway_token TEXT,
        hook_path TEXT DEFAULT '/hooks/agent',
        registered_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'submitted',
        result TEXT,
        context_id TEXT,
        messages_json TEXT,
        artifacts_json TEXT,
        metadata_json TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (sender_id) REFERENCES agents(agent_id),
        FOREIGN KEY (target_id) REFERENCES agents(agent_id)
      );
    `);

    // Migration: add columns if they don't exist (for existing databases)
    const cols = this.db.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;
    const colNames = new Set(cols.map((c) => c.name));
    if (!colNames.has("context_id")) {
      this.db.exec("ALTER TABLE tasks ADD COLUMN context_id TEXT");
    }
    if (!colNames.has("messages_json")) {
      this.db.exec("ALTER TABLE tasks ADD COLUMN messages_json TEXT");
    }
    if (!colNames.has("artifacts_json")) {
      this.db.exec("ALTER TABLE tasks ADD COLUMN artifacts_json TEXT");
    }
    if (!colNames.has("metadata_json")) {
      this.db.exec("ALTER TABLE tasks ADD COLUMN metadata_json TEXT");
    }
  }

  // ── Agents ───────────────────────────────────────────────────────────────

  registerAgent(agent: InternalAgentCard): InternalAgentCard {
    const stmt = this.db.prepare(`
      INSERT INTO agents (agent_id, name, skills, gateway_url, gateway_token, hook_path)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(agent_id) DO UPDATE SET
        name = excluded.name,
        skills = excluded.skills,
        gateway_url = excluded.gateway_url,
        gateway_token = excluded.gateway_token,
        hook_path = excluded.hook_path
    `);
    const skills = JSON.stringify(agent.skills ?? []);
    stmt.run(agent.agent_id, agent.name, skills, agent.gateway_url, agent.gateway_token ?? null, agent.hook_path ?? "/hooks/agent");
    const result = this.getAgent(agent.agent_id);
    if (!result) throw new Error(`Failed to upsert agent ${agent.agent_id}`);
    return result;
  }

  getAgent(agentId: string): InternalAgentCard | null {
    const row = this.db.prepare("SELECT * FROM agents WHERE agent_id = ?").get(agentId) as AgentRow | undefined;
    if (!row) return null;
    return this.rowToAgent(row);
  }

  listAgents(): InternalAgentCard[] {
    const rows = this.db.prepare("SELECT * FROM agents ORDER BY registered_at DESC").all() as AgentRow[];
    return rows.map((r) => this.rowToAgent(r));
  }

  private rowToAgent(row: AgentRow): InternalAgentCard {
    return {
      agent_id: row.agent_id,
      name: row.name,
      skills: JSON.parse(row.skills ?? "[]"),
      gateway_url: row.gateway_url,
      gateway_token: row.gateway_token ?? undefined,
      hook_path: row.hook_path,
      registered_at: row.registered_at,
    };
  }

  // ── Tasks (Legacy REST interface) ────────────────────────────────────────

  createTask(senderId: string, targetId: string, message: string): InternalTask {
    const id = uuidv4();
    this.db.prepare(`
      INSERT INTO tasks (id, sender_id, target_id, message, status)
      VALUES (?, ?, ?, ?, 'submitted')
    `).run(id, senderId, targetId, message);
    const task = this.getTask(id);
    if (!task) throw new Error(`Failed to create task ${id}`);
    return task;
  }

  getTask(taskId: string): InternalTask | null {
    const row = this.db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId) as TaskRow | undefined;
    if (!row) return null;
    return {
      id: row.id,
      sender_id: row.sender_id,
      target_id: row.target_id,
      message: row.message,
      status: row.status as InternalTaskStatus,
      result: row.result,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  listTasks(agentId?: string): InternalTask[] {
    let rows: TaskRow[];
    if (agentId) {
      rows = this.db.prepare(
        "SELECT * FROM tasks WHERE sender_id = ? OR target_id = ? ORDER BY created_at DESC"
      ).all(agentId, agentId) as TaskRow[];
    } else {
      rows = this.db.prepare("SELECT * FROM tasks ORDER BY created_at DESC").all() as TaskRow[];
    }
    return rows.map((r) => ({
      id: r.id,
      sender_id: r.sender_id,
      target_id: r.target_id,
      message: r.message,
      status: r.status as InternalTaskStatus,
      result: r.result,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  }

  updateTaskStatus(taskId: string, status: InternalTaskStatus, result?: string): InternalTask | null {
    this.db.prepare(`
      UPDATE tasks SET status = ?, result = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(status, result ?? null, taskId);
    return this.getTask(taskId);
  }

  completeTask(taskId: string, req: CompleteTaskRequest): InternalTask | null {
    const task = this.getTask(taskId);
    if (!task) return null;
    if (task.target_id !== req.agentId) return null;
    return this.updateTaskStatus(taskId, req.status, req.result);
  }

  // ── A2A Tasks (JSON-RPC interface) ───────────────────────────────────────

  createA2ATask(
    senderId: string,
    targetId: string,
    message: A2AMessage,
    contextId?: string,
    metadata?: Record<string, unknown>,
  ): A2ATask {
    const id = uuidv4();
    const plainText = message.parts
      .filter((p): p is { kind: "text"; text: string } => p.kind === "text")
      .map((p) => p.text)
      .join("\n");

    const messagesJson = JSON.stringify([message]);

    this.db.prepare(`
      INSERT INTO tasks (id, sender_id, target_id, message, status, context_id, messages_json, metadata_json)
      VALUES (?, ?, ?, ?, 'submitted', ?, ?, ?)
    `).run(
      id,
      senderId,
      targetId,
      plainText || "(structured message)",
      contextId ?? null,
      messagesJson,
      metadata ? JSON.stringify(metadata) : null,
    );

    // Transition to working immediately
    this.db.prepare(`
      UPDATE tasks SET status = 'working', updated_at = datetime('now')
      WHERE id = ?
    `).run(id);

    const task = this.getA2ATask(id);
    if (!task) throw new Error(`Failed to create A2A task ${id}`);
    return task;
  }

  getA2ATask(taskId: string): A2ATask | null {
    const row = this.db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId) as TaskRow | undefined;
    if (!row) return null;
    return this.rowToA2ATask(row);
  }

  listA2ATasks(params: TasksListParams): TasksListResult {
    const conditions: string[] = [];
    const values: (string | number)[] = [];

    if (params.agentId) {
      conditions.push("(sender_id = ? OR target_id = ?)");
      values.push(params.agentId, params.agentId);
    }
    if (params.status) {
      conditions.push("status = ?");
      values.push(params.status);
    }
    if (params.contextId) {
      conditions.push("context_id = ?");
      values.push(params.contextId);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = params.limit ?? 50;
    const offset = params.offset ?? 0;

    const countRow = this.db.prepare(`SELECT COUNT(*) as cnt FROM tasks ${where}`).get(...values) as { cnt: number };
    const total = countRow.cnt;

    const rows = this.db.prepare(
      `SELECT * FROM tasks ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(...values, limit, offset) as TaskRow[];

    return {
      tasks: rows.map((r) => this.rowToA2ATask(r)),
      total,
      limit,
      offset,
    };
  }

  updateA2ATaskStatus(taskId: string, state: A2ATaskState, statusMessage?: string): A2ATask | null {
    this.db.prepare(`
      UPDATE tasks SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(state, taskId);

    if (statusMessage !== undefined) {
      this.db.prepare(`UPDATE tasks SET result = ? WHERE id = ?`).run(statusMessage, taskId);
    }

    return this.getA2ATask(taskId);
  }

  appendA2AMessage(taskId: string, message: A2AMessage): A2ATask | null {
    const row = this.db.prepare("SELECT messages_json FROM tasks WHERE id = ?").get(taskId) as { messages_json: string | null } | undefined;
    if (!row) return null;

    const messages: A2AMessage[] = row.messages_json ? JSON.parse(row.messages_json) : [];
    messages.push(message);

    this.db.prepare(`
      UPDATE tasks SET messages_json = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(JSON.stringify(messages), taskId);

    return this.getA2ATask(taskId);
  }

  private rowToA2ATask(row: TaskRow): A2ATask {
    const messages: A2AMessage[] = row.messages_json ? JSON.parse(row.messages_json) : [];
    const artifacts = row.artifacts_json ? JSON.parse(row.artifacts_json) : undefined;
    const metadata = row.metadata_json ? JSON.parse(row.metadata_json) : undefined;

    return {
      id: row.id,
      contextId: row.context_id ?? undefined,
      status: {
        state: row.status as A2ATaskState,
        message: row.result ?? undefined,
        timestamp: row.updated_at,
      },
      messages,
      artifacts,
      metadata,
    };
  }

  close(): void {
    this.db.close();
  }
}
