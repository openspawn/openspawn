# Agent Spawning Design

**Date:** 2026-03-08
**Status:** Approved

## Problem

OpenSpawn is a coordination layer (MCP server + task routing + memory + dashboard) but does not spawn agents. The CLI scaffolds org files and starts a coordinator, but nothing launches actual agent processes. Users must manually bridge this gap.

## Key Decisions

1. **Claude Code CLI as agent runtime** — `openspawn start` spawns `claude` CLI subprocesses, one per agent. No custom agent runtime to build.
2. **Python API is the coordinator** — the FastAPI backend (`apps/api/`) replaces the TypeScript MCP coordinator. One codebase for memory, tasks, coordination.
3. **SQLite for local mode** — SQLAlchemy swaps `sqlite://` (local) vs `postgresql://` (deployed). Full memory system works everywhere, zero Docker.
4. **No Redis for local mode** — background jobs (enrichment, expiry, entity extraction) run as `asyncio` scheduled tasks in-process. Redis only needed for deployed mode.
5. **Configurable concurrency cap** — `maxConcurrentAgents` in config (default: 2) prevents API rate limiting. Coordinator queues agents beyond the cap.
6. **Hybrid bootstrap prompt** — agents get SOUL.md identity + explicit task if assigned, otherwise claim from queue.
7. **TypeScript CLI stays for scaffolding** — `npx openspawn init` (wizard, templates, scaffold) remains TypeScript. `openspawn start` invokes the Python runtime.

## Architecture

```
npx openspawn init        (TypeScript, runs once)
  → Wizard, templates, scaffold
  → Outputs: ORG.md, openspawn.config.json, workspaces/, .openspawn/

openspawn start            (Python, long-running)
  → Boots FastAPI with SQLite (.openspawn/openspawn.db)
  → Seeds database from ORG.md on first run
  → Starts MCP server on configured port
  → Runs enrichment/expiry cron in-process (asyncio)
  → Spawns Claude Code subprocesses per agent
  → Manages concurrency queue

openspawn start --deployed (Python, production)
  → Same FastAPI, but postgresql:// + Redis
  → arq workers for background jobs
  → Full production scale
```

### Agent Spawn Flow

```
openspawn start
    |
    +-- Start MCP coordinator on :8787
    |     +-- 33 tools (task_*, memory_*, graph_*, delegate, escalate, ...)
    |
    +-- Read openspawn.config.json + ORG.md
    |     +-- Seed agents into database
    |     +-- Resolve models per agent (level >= threshold -> senior model)
    |
    +-- Spawn up to N claude processes (N = maxConcurrentAgents, default 2)
          |
          +-- Each process:
          |     - Working dir: workspaces/<agent-name>/
          |     - MCP config: auto-generated, points at coordinator
          |     - Bootstrap: SOUL.md identity + assigned task (or "claim from queue")
          |
          +-- Lifecycle:
                - Agent process exits when task complete (or idle timeout)
                - Coordinator recycles the slot, spawns next queued agent
                - If delegate/escalate triggers spawn, assign + spawn within cap
```

### Memory Architecture (unified)

```
Local mode:
  SQLite (.openspawn/openspawn.db)
    +-- memories table (content, embeddings via sqlite-vec, metadata)
    +-- graph_entities / graph_relationships (knowledge graph)
    +-- FTS5 index (full-text search)
    +-- asyncio cron: enrichment, expiry, entity extraction

Deployed mode:
  PostgreSQL + pgvector
    +-- Same schema, same SQLAlchemy models
    +-- Redis + arq for background jobs
    +-- Production-grade vector search (HNSW index)
```

All agents share the same memory database. Cross-agent memory queries ("what does the org know about X?") work identically in both modes.

## Config Changes

Add to `openspawn.config.json`:

```json
{
  "spawning": {
    "maxConcurrentAgents": 2,
    "idleTimeoutSeconds": 300,
    "bootstrapMode": "hybrid"
  },
  "runtime": {
    "mode": "local",
    "database": ".openspawn/openspawn.db"
  }
}
```

## SQLite Compatibility

Postgres-specific patterns that need abstraction:

| Pattern | Postgres | SQLite |
|---------|----------|--------|
| Date arithmetic | `NOW() - INTERVAL '24h'` | `datetime('now', '-24 hours')` |
| JSONB access | `col->>'key'` | `json_extract(col, '$.key')` |
| Vector search | pgvector + HNSW | sqlite-vec + brute-force KNN |
| Background jobs | arq + Redis | asyncio scheduled tasks |

Strategy: SQLAlchemy dialect handles most differences. Raw SQL queries wrapped in helper functions with dialect branching.

## Deprecated Code to Remove

| Path | Reason |
|------|--------|
| `packages/cli/` | Go CLI, replaced by npm CLI |
| `packages/openspawn/src/mcp/` | TS MCP server, replaced by Python API |
| `packages/openspawn/src/core/task-store.ts` + tests | Tasks in API database |
| `packages/openspawn/src/core/budget.ts` + tests | Budget in API database |
| `packages/openspawn/src/cli/commands/start.ts` | Replaced by Python invocation |
| `packages/openspawn/src/cli/commands/delegate.ts` | Agents use MCP tools directly |
| `packages/openspawn/src/cli/commands/escalate.ts` | Agents use MCP tools directly |
| `packages/openspawn/src/cli/commands/hire.ts` | Agents use MCP tools directly |
| `packages/openspawn/src/cli/commands/fire.ts` | Agents use MCP tools directly |
| `packages/openspawn/src/cli/commands/report.ts` | Agents use MCP tools directly |
| `packages/openspawn/src/cli/commands/task.ts` | Agents use MCP tools directly |
| `packages/openspawn/src/cli/commands/budget.ts` | Agents use MCP tools directly |
| `packages/openspawn/src/cli/commands/org.ts` | Agents use MCP tools directly |
| `packages/openspawn/src/cli/commands/status.ts` | Agents use MCP tools directly |

### Keep in TypeScript (`packages/openspawn/`)

- `cli/commands/init.ts` — wizard, scaffold
- `cli/wizard.ts` — interactive prompts
- `cli/workspace-generator.ts` — SOUL.md, AGENTS.md, workspaces
- `cli/docker-generator.ts` — optional Docker infra
- `cli/templates/` — org templates
- `cli/alignment.ts` — values framework
- `cli/dry-run.ts` — scaffold simulation
- `core/org-parser.ts` — parse ORG.md for tree display
- `core/config.ts` — read/write openspawn.config.json
- `core/types.ts` — shared type definitions
- New: thin `cli/commands/start.ts` — detects uv, invokes Python server

## TODO: Language-Agnostic Installation

Plan installation methods so users don't need to manually install Node.js + Python + uv:

- **curl one-liner** (like OpenClaw: `curl -sSL https://openspawn.ai/install | sh`) — detects OS/arch, installs standalone binary or bootstraps dependencies
- **Homebrew** — `brew install openspawn`
- **Docker** — `docker run openspawn/openspawn init` for users who prefer containers
- **pip/pipx** — `pipx install openspawn` for Python-native users
- **npx** (current) — `npx openspawn init` stays as the Node.js entry point
- **Standalone binary** — PyInstaller or Nuitka bundle of the Python runtime, no Python required. Pairs with the curl installer.
- **Windows** — `winget install openspawn` or `.msi` installer

Priority: curl one-liner first (covers macOS + Linux), then Homebrew, then standalone binary. npx remains for existing Node.js users. Design the installer to auto-detect and install `uv` + Python if missing.

## Unresolved Questions

- sqlite-vec npm/Python package maturity — need to spike before committing (fallback: FTS5-only locally, vector search only in deployed mode)
- `aiosqlite` performance under concurrent MCP tool calls — need load test
- Should `openspawn start` auto-seed the database from ORG.md every time, or only on first run? (recommend: first run + explicit `openspawn seed` command)
- Claude Code CLI flags for headless agent spawning — need to verify `claude --mcp-config <path> -p "prompt"` works reliably for long-running tasks
- How to handle agent stdout/stderr — aggregate in coordinator logs? Per-agent log files?
