# Coordination Layer

<span class="status status-active">In Design</span>

*Updated: Feb 26, 2026*

## The Problem

Agent-to-agent communication wastes tokens. Dennis + CEO burned hundreds of messages echoing each other ("agreed", "good point", "nice work"). AutoGen-style group chat has 40-60% coordination overhead.

## Decision: SQLite + MCP Tools

| Approach | Verdict |
|----------|---------|
| File-based (HANDOFF.md, PLAN.md) | ❌ Mutex/race conditions |
| Free-form chat (Discord, group) | ❌ Token waste, ping-pong |
| SQLite + MCP tools | ✅ Transactional, agent-native, dashboard-friendly |
| Redis/Postgres | ❌ Overkill, infrastructure dependency |

## Architecture

```
Agent → MCP Tool Call → SQLite (WAL mode) → Dashboard
                                          → Event Stream (SSE)
```

- Agents never touch DB directly — they call MCP tools
- SQLite handles concurrency (WAL = concurrent reads + single writer)
- Dashboard reads same DB — no separate API
- Single file, ships with the org, zero infrastructure

## MCP Tools (Task Board)

| Tool | Description |
|------|-------------|
| `task_create` | Create a task with assignee, priority, dependencies |
| `task_claim` | Atomically claim an open task (no double-assignment) |
| `task_complete` | Mark done with result artifact |
| `task_list` | Query tasks by status, assignee, priority |
| `escalate` | Push issue up the chain of command |
| `org_status` | Current org state, agent statuses, budget usage |

## Communication Rules (baked into SOUL.md)

1. **Workspace files are primary.** Write PLAN.md, RESULT.md — not chat.
2. **Silence = success.** No "I'm done!" unless orchestrator explicitly needs it.
3. **4 message types only:** TASK, RESULT, ESCALATION, DECISION. No ACKs.
4. **Max 3 turns** for any direct exchange. Unresolved → escalate to human.
5. **No echoing.** "If your message doesn't add new information, don't send it."

## SQLite Schema (Draft)

```sql
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  level INTEGER,
  reports_to TEXT,
  status TEXT DEFAULT 'idle',
  budget_used INTEGER DEFAULT 0,
  budget_limit INTEGER
);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open',  -- open, claimed, done, blocked
  created_by TEXT REFERENCES agents(id),
  assigned_to TEXT REFERENCES agents(id),
  claimed_at TEXT,
  completed_at TEXT,
  result TEXT,
  priority INTEGER DEFAULT 0,
  parent_task TEXT REFERENCES tasks(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,  -- task_created, task_claimed, task_completed, escalation, decision
  agent_id TEXT REFERENCES agents(id),
  task_id TEXT REFERENCES tasks(id),
  payload TEXT,  -- JSON
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,  -- TASK, RESULT, ESCALATION, DECISION
  from_agent TEXT REFERENCES agents(id),
  to_agent TEXT REFERENCES agents(id),
  content TEXT,
  task_id TEXT REFERENCES tasks(id),
  created_at TEXT DEFAULT (datetime('now'))
);
```

## Build Order

1. SQLite schema + migrations
2. MCP tools for task management
3. Wire into `openspawn start` — boots MCP server alongside agents
4. Dashboard reads from same DB
5. Event stream (SSE) for live updates
