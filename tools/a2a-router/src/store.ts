// ── SQLite Store ─────────────────────────────────────────────────────────────

import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { v4 as uuidv4 } from "uuid";
import type { AgentCard, AgentRow, CompleteTaskRequest, Task, TaskStatus } from "./types.js";

const DEFAULT_DB_PATH = `${process.env.HOME}/.openspawn/a2a/tasks.db`;

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
        hook_path TEXT DEFAULT '/hooks/ingest',
        registered_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'submitted',
        result TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (sender_id) REFERENCES agents(agent_id),
        FOREIGN KEY (target_id) REFERENCES agents(agent_id)
      );
    `);
  }

  // ── Agents ───────────────────────────────────────────────────────────────

  registerAgent(agent: AgentCard): AgentCard {
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
    stmt.run(agent.agent_id, agent.name, skills, agent.gateway_url, agent.gateway_token ?? null, agent.hook_path ?? "/hooks/ingest");
    return this.getAgent(agent.agent_id)!;
  }

  getAgent(agentId: string): AgentCard | null {
    const row = this.db.prepare("SELECT * FROM agents WHERE agent_id = ?").get(agentId) as AgentRow | undefined;
    if (!row) return null;
    return this.rowToAgent(row);
  }

  listAgents(): AgentCard[] {
    const rows = this.db.prepare("SELECT * FROM agents ORDER BY registered_at DESC").all() as AgentRow[];
    return rows.map((r) => this.rowToAgent(r));
  }

  private rowToAgent(row: AgentRow): AgentCard {
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

  // ── Tasks ────────────────────────────────────────────────────────────────

  createTask(senderId: string, targetId: string, message: string): Task {
    const id = uuidv4();
    this.db.prepare(`
      INSERT INTO tasks (id, sender_id, target_id, message, status)
      VALUES (?, ?, ?, ?, 'submitted')
    `).run(id, senderId, targetId, message);
    return this.getTask(id)!;
  }

  getTask(taskId: string): Task | null {
    return this.db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId) as Task | null ?? null;
  }

  listTasks(agentId?: string): Task[] {
    if (agentId) {
      return this.db.prepare(
        "SELECT * FROM tasks WHERE sender_id = ? OR target_id = ? ORDER BY created_at DESC"
      ).all(agentId, agentId) as Task[];
    }
    return this.db.prepare("SELECT * FROM tasks ORDER BY created_at DESC").all() as Task[];
  }

  updateTaskStatus(taskId: string, status: TaskStatus, result?: string): Task | null {
    this.db.prepare(`
      UPDATE tasks SET status = ?, result = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(status, result ?? null, taskId);
    return this.getTask(taskId);
  }

  completeTask(taskId: string, req: CompleteTaskRequest): Task | null {
    const task = this.getTask(taskId);
    if (!task) return null;
    if (task.target_id !== req.agentId) return null;
    return this.updateTaskStatus(taskId, req.status, req.result);
  }

  close(): void {
    this.db.close();
  }
}
