# Agent Spawning Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `openspawn start` boots a unified Python coordinator (FastAPI + SQLite + MCP) and spawns Claude Code CLI subprocesses as agents.

**Architecture:** FastAPI serves REST + MCP on a single port. SQLite for local mode, PostgreSQL for deployed. Agent processes are ephemeral Claude Code CLI invocations managed by an async spawner with concurrency cap.

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy (async), aiosqlite, sqlite-vec, FastMCP, asyncio, Claude Code CLI

**Phases:** 5 phases, each independently shippable. Phase 5 (asyncio scheduler) is deferrable.

---

## Phase 1: Prune Deprecated Code

Remove Go CLI, TypeScript MCP server, and CLI commands replaced by the Python API.

### Task 1.1: Remove Go CLI

**Files:**

- Delete: `packages/cli/` (entire directory)

**Step 1: Verify no monorepo references**

Run: `grep -r "packages/cli" nx.json project.json tsconfig*.json pnpm-workspace.yaml`
If any references found, remove them.

**Step 2: Delete the directory**

```bash
rm -rf packages/cli/
```

**Step 3: Remove from pnpm-workspace.yaml if listed**

Check `pnpm-workspace.yaml` for `packages/cli` entry and remove it.

**Step 4: Commit**

```bash
git add -A packages/cli/ pnpm-workspace.yaml
git commit -m "chore(cli): remove deprecated Go CLI

replaced by npm CLI (packages/openspawn/) per agent-spawning design"
```

### Task 1.2: Remove TypeScript MCP Server & Runtime Modules

**Files:**

- Delete: `packages/openspawn/src/mcp/server.ts`
- Delete: `packages/openspawn/src/mcp/tools.ts`
- Delete: `packages/openspawn/src/core/task-store.ts`
- Delete: `packages/openspawn/src/core/task-store.test.ts`
- Delete: `packages/openspawn/src/core/budget.ts`
- Delete: `packages/openspawn/src/core/budget.test.ts`
- Modify: `packages/openspawn/src/index.ts` (remove deleted exports)
- Modify: `packages/openspawn/package.json` (remove `@modelcontextprotocol/sdk` dep)

**Step 1: Remove MCP directory**

```bash
rm -rf packages/openspawn/src/mcp/
```

**Step 2: Remove task-store and budget**

```bash
rm packages/openspawn/src/core/task-store.ts
rm packages/openspawn/src/core/task-store.test.ts
rm packages/openspawn/src/core/budget.ts
rm packages/openspawn/src/core/budget.test.ts
```

**Step 3: Update index.ts exports**

Remove all re-exports of deleted modules. Keep only:

- `core/types.js`
- `core/org-parser.js`
- `core/config.js`

**Step 4: Remove `@modelcontextprotocol/sdk` and `zod` from package.json dependencies**

These were only used by the MCP server. Check if `zod` is used elsewhere (wizard, etc.) before removing.

**Step 5: Run tests**

Run: `cd packages/openspawn && pnpm exec vitest run`
Expected: remaining tests pass (org-parser, config, templates, wizard, workspace-generator, alignment, dry-run, init)

**Step 6: Commit**

```bash
git add -A packages/openspawn/
git commit -m "chore(openspawn): remove TS MCP server, task-store, budget

replaced by Python API (apps/api/) per agent-spawning design"
```

### Task 1.3: Remove Deprecated CLI Commands

**Files:**

- Delete: `packages/openspawn/src/cli/commands/delegate.ts`
- Delete: `packages/openspawn/src/cli/commands/escalate.ts`
- Delete: `packages/openspawn/src/cli/commands/hire.ts`
- Delete: `packages/openspawn/src/cli/commands/fire.ts`
- Delete: `packages/openspawn/src/cli/commands/report.ts`
- Delete: `packages/openspawn/src/cli/commands/task.ts`
- Delete: `packages/openspawn/src/cli/commands/budget.ts`
- Delete: `packages/openspawn/src/cli/commands/org.ts`
- Delete: `packages/openspawn/src/cli/commands/status.ts`
- Delete: `packages/openspawn/src/cli/commands/start.ts`
- Modify: `packages/openspawn/src/cli/index.ts` (remove command routing for deleted commands)

**Step 1: Delete command files**

```bash
rm packages/openspawn/src/cli/commands/{delegate,escalate,hire,fire,report,task,budget,org,status,start}.ts
```

**Step 2: Update CLI router**

Modify `packages/openspawn/src/cli/index.ts` to only route:

- `init` — existing wizard/scaffold
- `start` — new thin wrapper (Task 5.1)
- `--help` / `--version`

Remove all other command imports and routing cases.

**Step 3: Run tests**

Run: `cd packages/openspawn && pnpm exec vitest run`
Expected: all remaining tests pass

**Step 4: Commit**

```bash
git add -A packages/openspawn/src/cli/
git commit -m "chore(openspawn): remove CLI commands replaced by Python API

agents use MCP tools directly; humans use REST API or dashboard"
```

---

## Phase 2: SQLite Backend for API

Make the FastAPI backend work with both SQLite (local) and PostgreSQL (deployed).

### Task 2.1: Add SQLite Dependencies

**Files:**

- Modify: `apps/api/pyproject.toml`

**Step 1: Add aiosqlite dependency**

Add to `[project.dependencies]`:

```
aiosqlite>=0.20.0
```

**Step 2: Install**

Run: `cd apps/api && uv sync`
Expected: installs without errors

**Step 3: Commit**

```bash
git add apps/api/pyproject.toml apps/api/uv.lock
git commit -m "chore(api): add aiosqlite for SQLite backend support"
```

### Task 2.2: Dual-Backend Database Configuration

**Files:**

- Modify: `apps/api/app/config.py`
- Modify: `apps/api/app/database.py`
- Create: `apps/api/tests/test_sqlite_config.py`

**Step 1: Write the failing test**

```python
# apps/api/tests/test_sqlite_config.py
"""Tests for SQLite backend configuration."""
import os
import pytest
from unittest.mock import patch


def test_sqlite_url_not_rewritten():
    """SQLite URLs should not be rewritten to asyncpg."""
    with patch.dict(os.environ, {"DATABASE_URL": "sqlite+aiosqlite:///test.db"}):
        from importlib import reload
        import app.config as cfg
        reload(cfg)
        assert "asyncpg" not in cfg.settings.database_url
        assert "sqlite" in cfg.settings.database_url


def test_is_sqlite_flag():
    """Config should expose is_sqlite property."""
    with patch.dict(os.environ, {"DATABASE_URL": "sqlite+aiosqlite:///test.db"}):
        from importlib import reload
        import app.config as cfg
        reload(cfg)
        assert cfg.settings.is_sqlite is True
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && uv run pytest tests/test_sqlite_config.py -v`
Expected: FAIL (is_sqlite doesn't exist, URL gets rewritten)

**Step 3: Update config.py**

Modify `apps/api/app/config.py`:

- Add `is_sqlite` computed property: `return self.database_url.startswith("sqlite")`
- Guard the `postgresql://` → `postgresql+asyncpg://` rewrite: only apply if URL starts with `postgresql://`
- Set `pool_size` and `max_overflow` to `0` when SQLite (not applicable)

**Step 4: Update database.py**

Modify `apps/api/app/database.py`:

- When SQLite: create engine without pool settings (`poolclass=StaticPool` for async SQLite)
- When PostgreSQL: keep existing pool config
- Add startup function: `create_tables()` that calls `Base.metadata.create_all()` for SQLite (no Alembic needed locally)

**Step 5: Run test to verify it passes**

Run: `cd apps/api && uv run pytest tests/test_sqlite_config.py -v`
Expected: PASS

**Step 6: Commit**

```bash
git add apps/api/app/config.py apps/api/app/database.py apps/api/tests/test_sqlite_config.py
git commit -m "feat(api): dual-backend database config for SQLite and PostgreSQL"
```

### Task 2.3: Abstract Postgres-Specific Column Types

**Files:**

- Create: `apps/api/app/models/compat.py`
- Create: `apps/api/tests/test_model_compat.py`
- Modify: `apps/api/app/models/memory.py`
- Modify: `apps/api/app/models/graph.py`

**Step 1: Write the failing test**

```python
# apps/api/tests/test_model_compat.py
"""Tests for cross-dialect column type compatibility."""
from app.models.compat import CompatVector, CompatArray, compat_tsvector


def test_compat_vector_returns_type():
    """CompatVector should return a column type."""
    col_type = CompatVector(1024)
    assert col_type is not None


def test_compat_array_returns_type():
    """CompatArray should return JSON for SQLite, ARRAY for Postgres."""
    col_type = CompatArray()
    assert col_type is not None
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && uv run pytest tests/test_model_compat.py -v`
Expected: FAIL (module doesn't exist)

**Step 3: Create compat.py**

```python
# apps/api/app/models/compat.py
"""Cross-dialect type helpers for SQLite + PostgreSQL."""
from __future__ import annotations

from sqlalchemy import JSON, Text, TypeDecorator
from sqlalchemy.dialects.postgresql import ARRAY as PG_ARRAY

# Conditionally import pgvector — not available with SQLite
try:
    from pgvector.sqlalchemy import Vector as PGVector
except ImportError:
    PGVector = None


class CompatVector(TypeDecorator):
    """Vector column: pgvector on Postgres, JSON on SQLite."""
    impl = JSON
    cache_ok = True

    def __init__(self, dimensions: int = 1024):
        super().__init__()
        self.dimensions = dimensions

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql" and PGVector:
            return dialect.type_descriptor(PGVector(self.dimensions))
        return dialect.type_descriptor(JSON())


class CompatArray(TypeDecorator):
    """Array column: ARRAY on Postgres, JSON on SQLite."""
    impl = JSON
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_ARRAY(Text))
        return dialect.type_descriptor(JSON())


def compat_tsvector(dialect_name: str):
    """Return TSVector type for Postgres, skip for SQLite (use FTS5 instead)."""
    if dialect_name == "postgresql":
        from sqlalchemy.dialects.postgresql import TSVECTOR
        return TSVECTOR()
    return Text()
```

**Step 4: Update Memory model**

Modify `apps/api/app/models/memory.py`:

- Replace `Vector(1024)` with `CompatVector(1024)`
- Replace `ARRAY(Text)` with `CompatArray()`
- Replace `TSVECTOR` with `Text` (FTS5 handled separately)
- Ensure all imports come from `app.models.compat`

**Step 5: Update Graph models**

Modify `apps/api/app/models/graph.py`:

- Replace `Vector(1024)` with `CompatVector(1024)`

**Step 6: Run all model tests**

Run: `cd apps/api && uv run pytest tests/test_model_compat.py tests/test_memory_service.py -v`
Expected: PASS

**Step 7: Commit**

```bash
git add apps/api/app/models/compat.py apps/api/app/models/memory.py apps/api/app/models/graph.py apps/api/tests/test_model_compat.py
git commit -m "feat(api): cross-dialect column types for SQLite compatibility

CompatVector, CompatArray, compat_tsvector abstract pgvector/ARRAY/TSVECTOR"
```

### Task 2.4: Abstract Raw SQL Date Arithmetic

**Files:**

- Create: `apps/api/app/models/sql_helpers.py`
- Create: `apps/api/tests/test_sql_helpers.py`
- Modify: `apps/api/app/workers/enrichment.py`
- Modify: `apps/api/app/workers/expiry.py`

**Step 1: Write the failing test**

```python
# apps/api/tests/test_sql_helpers.py
"""Tests for cross-dialect SQL helpers."""
from app.models.sql_helpers import ago


def test_ago_postgres():
    result = ago("24 hours", dialect="postgresql")
    assert "INTERVAL" in result


def test_ago_sqlite():
    result = ago("24 hours", dialect="sqlite")
    assert "datetime" in result
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && uv run pytest tests/test_sql_helpers.py -v`
Expected: FAIL

**Step 3: Create sql_helpers.py**

```python
# apps/api/app/models/sql_helpers.py
"""Cross-dialect SQL expression helpers."""
from __future__ import annotations

from sqlalchemy import text


def ago(interval: str, dialect: str = "postgresql") -> str:
    """Return dialect-appropriate 'now minus interval' expression.

    Usage: ago("24 hours"), ago("60 days")
    """
    if dialect == "sqlite":
        return f"datetime('now', '-{interval}')"
    return f"NOW() - INTERVAL '{interval}'"


def json_extract(column: str, key: str, dialect: str = "postgresql") -> str:
    """Return dialect-appropriate JSON field access.

    Usage: json_extract("retrieval_context", "query")
    """
    if dialect == "sqlite":
        return f"json_extract({column}, '$.{key}')"
    return f"{column}->>'{key}'"


def now(dialect: str = "postgresql") -> str:
    """Return dialect-appropriate current timestamp."""
    if dialect == "sqlite":
        return "datetime('now')"
    return "NOW()"
```

**Step 4: Update enrichment.py and expiry.py**

Replace hardcoded Postgres SQL with `ago()`, `json_extract()`, `now()` calls.
Pass `dialect` from a helper that reads the engine dialect name.

**Step 5: Run tests**

Run: `cd apps/api && uv run pytest tests/test_sql_helpers.py -v`
Expected: PASS

**Step 6: Commit**

```bash
git add apps/api/app/models/sql_helpers.py apps/api/tests/test_sql_helpers.py apps/api/app/workers/
git commit -m "feat(api): cross-dialect SQL helpers for date arithmetic and JSON access"
```

### Task 2.5: SQLite Integration Test

**Files:**

- Create: `apps/api/tests/test_sqlite_integration.py`

**Step 1: Write integration test**

Test that the full FastAPI app boots with SQLite and can:

1. Create the schema (`create_all`)
2. Register an agent
3. Create a task
4. Store a memory
5. Search memories (keyword, not vector)

```python
# apps/api/tests/test_sqlite_integration.py
"""Integration test: full API lifecycle on SQLite backend."""
import os
import pytest
from unittest.mock import patch
from httpx import ASGITransport, AsyncClient


@pytest.fixture
def sqlite_env(tmp_path):
    db_path = tmp_path / "test.db"
    env = {"DATABASE_URL": f"sqlite+aiosqlite:///{db_path}"}
    with patch.dict(os.environ, env):
        yield


@pytest.mark.asyncio
async def test_full_lifecycle_sqlite(sqlite_env):
    # Import after env patching
    from app.main import app
    from app.database import create_tables
    await create_tables()

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # Health check
        r = await client.get("/health")
        assert r.status_code == 200
```

**Step 2: Run test**

Run: `cd apps/api && uv run pytest tests/test_sqlite_integration.py -v`
Expected: PASS (after all compat work is done)

**Step 3: Commit**

```bash
git add apps/api/tests/test_sqlite_integration.py
git commit -m "test(api): SQLite integration test for full API lifecycle"
```

---

## Phase 3: Local Mode Startup

Wire `openspawn start` to boot the Python API with SQLite.

### Task 3.1: ORG.md Seeder

**Files:**

- Create: `apps/api/app/seeder.py`
- Create: `apps/api/tests/test_seeder.py`

The seeder reads ORG.md, parses it, and inserts agents into the database on first run.

**Step 1: Write the failing test**

```python
# apps/api/tests/test_seeder.py
"""Tests for ORG.md database seeder."""
import pytest
from app.seeder import parse_org_md, seed_agents


def test_parse_org_md_extracts_agents(tmp_path):
    org = tmp_path / "ORG.md"
    org.write_text("""# Test Org

## Agents

| Name | Role | Level | Domain | Reports To |
|------|------|-------|--------|------------|
| Alice | lead | 8 | engineering | — |
| Bob | worker | 4 | engineering | Alice |
""")
    agents = parse_org_md(str(org))
    assert len(agents) == 2
    assert agents[0]["name"] == "Alice"
    assert agents[1]["level"] == 4
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && uv run pytest tests/test_seeder.py::test_parse_org_md_extracts_agents -v`
Expected: FAIL

**Step 3: Implement seeder**

Parse the Markdown agent table from ORG.md. Insert agents via SQLAlchemy if they don't already exist (upsert by name).

**Step 4: Run test to verify it passes**

Run: `cd apps/api && uv run pytest tests/test_seeder.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/app/seeder.py apps/api/tests/test_seeder.py
git commit -m "feat(api): ORG.md seeder for database initialization"
```

### Task 3.2: Local Mode Entrypoint

**Files:**

- Create: `apps/api/app/local.py`
- Create: `apps/api/tests/test_local_entrypoint.py`

This is the entrypoint for `openspawn start` — boots FastAPI with SQLite, seeds from ORG.md, serves MCP.

**Step 1: Write the failing test**

```python
# apps/api/tests/test_local_entrypoint.py
"""Tests for local mode entrypoint."""
from app.local import build_local_config


def test_build_local_config(tmp_path):
    config = build_local_config(str(tmp_path))
    assert "sqlite" in config["database_url"]
    assert config["port"] == 8787
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && uv run pytest tests/test_local_entrypoint.py -v`
Expected: FAIL

**Step 3: Implement local.py**

```python
# apps/api/app/local.py
"""Local mode entrypoint for openspawn start."""
from __future__ import annotations

import json
import os
from pathlib import Path


def build_local_config(project_dir: str) -> dict:
    """Build configuration for local mode from openspawn.config.json."""
    config_path = Path(project_dir) / "openspawn.config.json"
    db_path = Path(project_dir) / ".openspawn" / "openspawn.db"

    user_config = {}
    if config_path.exists():
        user_config = json.loads(config_path.read_text())

    port = user_config.get("coordinator", {}).get("port", 8787)

    return {
        "database_url": f"sqlite+aiosqlite:///{db_path}",
        "port": port,
        "project_dir": project_dir,
        "org_file": str(Path(project_dir) / user_config.get("orgFile", "ORG.md")),
    }


async def start_local(project_dir: str) -> None:
    """Boot FastAPI in local mode with SQLite."""
    import uvicorn
    from app.database import create_tables
    from app.seeder import seed_from_org

    config = build_local_config(project_dir)

    # Set environment for the app
    os.environ["DATABASE_URL"] = config["database_url"]
    os.environ.setdefault("CORS_ORIGINS", "http://localhost:4200")

    # Create tables (no Alembic for SQLite)
    await create_tables()

    # Seed agents from ORG.md
    await seed_from_org(config["org_file"])

    # Start server
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=config["port"],
        log_level="info",
    )
```

**Step 4: Add CLI entrypoint**

Add to `apps/api/pyproject.toml` under `[project.scripts]`:

```toml
[project.scripts]
openspawn-server = "app.local:main"
```

Where `main()` is an `asyncio.run(start_local(cwd))` wrapper.

**Step 5: Run test to verify it passes**

Run: `cd apps/api && uv run pytest tests/test_local_entrypoint.py -v`
Expected: PASS

**Step 6: Commit**

```bash
git add apps/api/app/local.py apps/api/tests/test_local_entrypoint.py apps/api/pyproject.toml
git commit -m "feat(api): local mode entrypoint for openspawn start

boots FastAPI with SQLite, seeds from ORG.md, no Docker required"
```

### Task 3.3: Thin TypeScript Start Command

**Files:**

- Create: `packages/openspawn/src/cli/commands/start.ts` (new version)
- Create: `packages/openspawn/src/cli/commands/start.test.ts`

The new `start.ts` detects `uv`, invokes the Python server.

**Step 1: Write the failing test**

```typescript
// packages/openspawn/src/cli/commands/start.test.ts
import { describe, it, expect } from "vitest";
import { buildServerCommand } from "./start.js";

describe("start command", () => {
  it("builds uv run command with project dir", () => {
    const cmd = buildServerCommand("/tmp/myorg");
    expect(cmd).toContain("uv");
    expect(cmd).toContain("openspawn-server");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/openspawn && pnpm exec vitest run src/cli/commands/start.test.ts`
Expected: FAIL

**Step 3: Implement start.ts**

```typescript
// packages/openspawn/src/cli/commands/start.ts
import { execSync, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

export function buildServerCommand(dir: string): string[] {
  return ["uv", "run", "--directory", getApiDir(), "openspawn-server", "--project-dir", dir];
}

function getApiDir(): string {
  // In development: relative to monorepo
  // In production: bundled or installed separately
  const candidates = [
    join(__dirname, "../../../../apps/api"),
    join(__dirname, "../../../apps/api"),
  ];
  for (const c of candidates) {
    if (existsSync(join(c, "pyproject.toml"))) return c;
  }
  return "openspawn-api"; // fallback: assume globally installed
}

export async function startCommand(args: string[], ctx: { dir: string }) {
  // Check uv is available
  try {
    execSync("uv --version", { stdio: "ignore" });
  } catch {
    console.error(
      "Error: uv is required. Install: curl -LsSf https://astral.sh/uv/install.sh | sh",
    );
    process.exit(1);
  }

  const cmd = buildServerCommand(ctx.dir);
  console.log(`Starting OpenSpawn coordinator...`);

  const proc = spawn(cmd[0], cmd.slice(1), {
    stdio: "inherit",
    env: { ...process.env },
  });

  proc.on("exit", (code) => process.exit(code ?? 0));
}
```

**Step 4: Update CLI router**

Add `start` case back to `packages/openspawn/src/cli/index.ts` pointing at new `start.ts`.

**Step 5: Run test to verify it passes**

Run: `cd packages/openspawn && pnpm exec vitest run src/cli/commands/start.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add packages/openspawn/src/cli/commands/start.ts packages/openspawn/src/cli/commands/start.test.ts packages/openspawn/src/cli/index.ts
git commit -m "feat(openspawn): new start command invokes Python coordinator via uv"
```

---

## Phase 4: Agent Spawning

The core feature: spawn Claude Code CLI subprocesses as agents.

### Task 4.1: Spawning Config Schema

**Files:**

- Modify: `packages/openspawn/src/core/types.ts`
- Modify: `packages/openspawn/src/core/config.ts`
- Create: `packages/openspawn/src/core/config-spawn.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/openspawn/src/core/config-spawn.test.ts
import { describe, it, expect } from "vitest";
import { defaultConfig } from "./config.js";

describe("spawn config defaults", () => {
  it("has maxConcurrentAgents default of 2", () => {
    expect(defaultConfig.spawning.maxConcurrentAgents).toBe(2);
  });

  it("has idleTimeoutSeconds default of 300", () => {
    expect(defaultConfig.spawning.idleTimeoutSeconds).toBe(300);
  });

  it("has runtime mode default of local", () => {
    expect(defaultConfig.runtime.mode).toBe("local");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/openspawn && pnpm exec vitest run src/core/config-spawn.test.ts`
Expected: FAIL (spawning and runtime don't exist)

**Step 3: Add types**

Add to `packages/openspawn/src/core/types.ts`:

```typescript
export enum RuntimeMode {
  Local = "local",
  Deployed = "deployed",
}

export enum BootstrapMode {
  Hybrid = "hybrid",
  TaskOnly = "task-only",
  SelfDirected = "self-directed",
}

// Add to OpenSpawnConfig interface:
spawning: {
  maxConcurrentAgents: number;
  idleTimeoutSeconds: number;
  bootstrapMode: BootstrapMode;
}
runtime: {
  mode: RuntimeMode;
  database: string;
}
```

**Step 4: Update defaultConfig**

Add to `packages/openspawn/src/core/config.ts`:

```typescript
spawning: {
  maxConcurrentAgents: 2,
  idleTimeoutSeconds: 300,
  bootstrapMode: BootstrapMode.Hybrid,
},
runtime: {
  mode: RuntimeMode.Local,
  database: ".openspawn/openspawn.db",
},
```

**Step 5: Run test to verify it passes**

Run: `cd packages/openspawn && pnpm exec vitest run src/core/config-spawn.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add packages/openspawn/src/core/types.ts packages/openspawn/src/core/config.ts packages/openspawn/src/core/config-spawn.test.ts
git commit -m "feat(openspawn): add spawning and runtime config schema"
```

### Task 4.2: Agent Spawner (Python)

**Files:**

- Create: `apps/api/app/spawner/__init__.py`
- Create: `apps/api/app/spawner/manager.py`
- Create: `apps/api/app/spawner/process.py`
- Create: `apps/api/app/spawner/prompt.py`
- Create: `apps/api/tests/test_spawner.py`

This is the core spawning logic. The manager maintains a queue of agents, respects the concurrency cap, and spawns/recycles Claude Code processes.

**Step 1: Write the failing test**

```python
# apps/api/tests/test_spawner.py
"""Tests for agent spawner."""
import pytest
from app.spawner.prompt import build_bootstrap_prompt
from app.spawner.manager import SpawnManager


def test_build_bootstrap_prompt_with_task():
    prompt = build_bootstrap_prompt(
        agent_name="Alice",
        soul_md="You are Alice, L8 engineering lead.",
        task_description="Fix the login bug",
    )
    assert "Alice" in prompt
    assert "Fix the login bug" in prompt
    assert "SOUL" in prompt or "soul" in prompt.lower()


def test_build_bootstrap_prompt_without_task():
    prompt = build_bootstrap_prompt(
        agent_name="Bob",
        soul_md="You are Bob, L4 worker.",
        task_description=None,
    )
    assert "Bob" in prompt
    assert "claim" in prompt.lower() or "task_claim" in prompt.lower()


@pytest.mark.asyncio
async def test_spawn_manager_respects_cap():
    manager = SpawnManager(max_concurrent=2, dry_run=True)
    manager.enqueue("agent-1", "/tmp/ws1", "prompt1")
    manager.enqueue("agent-2", "/tmp/ws2", "prompt2")
    manager.enqueue("agent-3", "/tmp/ws3", "prompt3")
    assert manager.queued_count == 3
    assert manager.active_count == 0
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && uv run pytest tests/test_spawner.py -v`
Expected: FAIL

**Step 3: Implement prompt.py**

```python
# apps/api/app/spawner/prompt.py
"""Bootstrap prompt builder for Claude Code agent processes."""
from __future__ import annotations


def build_bootstrap_prompt(
    agent_name: str,
    soul_md: str,
    task_description: str | None = None,
    mcp_url: str = "http://localhost:8787",
) -> str:
    """Build the -p prompt for a Claude Code subprocess."""
    parts = [
        f"You are {agent_name}.",
        "",
        "## Your Identity (SOUL.md)",
        "",
        soul_md,
        "",
        "## Instructions",
        "",
        f"You have access to MCP tools via the OpenSpawn coordinator at {mcp_url}.",
        "Use these tools to coordinate with your team:",
        "- task_claim: claim the next available task",
        "- task_update: report progress",
        "- report: report completion",
        "- delegate: delegate subtasks to lower-level agents",
        "- escalate: escalate blockers to your manager",
        "- memory_store: save important learnings",
        "- memory_search: recall organizational knowledge",
        "",
    ]

    if task_description:
        parts.extend([
            "## Your Current Task",
            "",
            task_description,
            "",
            "Complete this task, then report completion via the report tool.",
        ])
    else:
        parts.extend([
            "## Getting Started",
            "",
            "Use task_claim to get your next task from the queue.",
            "If no tasks are available, report that you are idle.",
        ])

    return "\n".join(parts)
```

**Step 4: Implement manager.py**

```python
# apps/api/app/spawner/manager.py
"""Agent spawn manager with concurrency control."""
from __future__ import annotations

import asyncio
import structlog
from dataclasses import dataclass, field
from collections import deque

logger = structlog.get_logger()


@dataclass
class SpawnRequest:
    agent_id: str
    workspace: str
    prompt: str
    task_id: str | None = None


class SpawnManager:
    """Manages Claude Code subprocess lifecycle with concurrency cap."""

    def __init__(self, max_concurrent: int = 2, dry_run: bool = False):
        self.max_concurrent = max_concurrent
        self.dry_run = dry_run
        self._queue: deque[SpawnRequest] = deque()
        self._active: dict[str, asyncio.subprocess.Process] = {}
        self._lock = asyncio.Lock()

    @property
    def queued_count(self) -> int:
        return len(self._queue)

    @property
    def active_count(self) -> int:
        return len(self._active)

    def enqueue(self, agent_id: str, workspace: str, prompt: str, task_id: str | None = None) -> None:
        self._queue.append(SpawnRequest(agent_id, workspace, prompt, task_id))

    async def drain(self) -> None:
        """Process the queue, spawning agents up to the concurrency cap."""
        async with self._lock:
            while self._queue and self.active_count < self.max_concurrent:
                req = self._queue.popleft()
                await self._spawn(req)

    async def _spawn(self, req: SpawnRequest) -> None:
        if self.dry_run:
            logger.info("spawn.dry_run", agent=req.agent_id)
            return

        from app.spawner.process import spawn_claude_process
        proc = await spawn_claude_process(req.agent_id, req.workspace, req.prompt)
        self._active[req.agent_id] = proc
        asyncio.create_task(self._watch(req.agent_id, proc))

    async def _watch(self, agent_id: str, proc: asyncio.subprocess.Process) -> None:
        """Watch a subprocess and recycle its slot when it exits."""
        await proc.wait()
        self._active.pop(agent_id, None)
        logger.info("spawn.exited", agent=agent_id, returncode=proc.returncode)
        await self.drain()  # spawn next queued agent
```

**Step 5: Implement process.py**

```python
# apps/api/app/spawner/process.py
"""Claude Code CLI subprocess management."""
from __future__ import annotations

import asyncio
import json
import shutil
import structlog
from pathlib import Path

logger = structlog.get_logger()


def find_claude_cli() -> str:
    """Find the claude CLI binary."""
    path = shutil.which("claude")
    if not path:
        raise FileNotFoundError(
            "Claude Code CLI not found. Install: https://docs.anthropic.com/en/docs/claude-code"
        )
    return path


def build_mcp_config(mcp_url: str, workspace: str) -> dict:
    """Build MCP client config for a Claude Code subprocess."""
    return {
        "mcpServers": {
            "openspawn": {
                "url": f"{mcp_url}/mcp",
            }
        }
    }


async def spawn_claude_process(
    agent_id: str,
    workspace: str,
    prompt: str,
    mcp_url: str = "http://localhost:8787",
) -> asyncio.subprocess.Process:
    """Spawn a Claude Code CLI subprocess for an agent."""
    claude = find_claude_cli()

    # Write MCP config to workspace
    mcp_config_path = Path(workspace) / ".mcp.json"
    mcp_config = build_mcp_config(mcp_url, workspace)
    mcp_config_path.write_text(json.dumps(mcp_config, indent=2))

    cmd = [
        claude,
        "--print",
        "--mcp-config", str(mcp_config_path),
        "-p", prompt,
    ]

    logger.info("spawn.starting", agent=agent_id, workspace=workspace)

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        cwd=workspace,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    return proc
```

**Step 6: Run tests**

Run: `cd apps/api && uv run pytest tests/test_spawner.py -v`
Expected: PASS

**Step 7: Commit**

```bash
git add apps/api/app/spawner/ apps/api/tests/test_spawner.py
git commit -m "feat(api): agent spawner with concurrency cap and Claude Code integration

SpawnManager queues agents, respects maxConcurrentAgents, recycles slots on exit"
```

### Task 4.3: Wire Spawner into Local Entrypoint

**Files:**

- Modify: `apps/api/app/local.py`
- Create: `apps/api/tests/test_local_spawning.py`

**Step 1: Write the failing test**

```python
# apps/api/tests/test_local_spawning.py
"""Tests for agent spawning in local mode."""
import pytest
from unittest.mock import patch, AsyncMock
from app.local import resolve_agents_to_spawn


def test_resolve_agents_to_spawn(tmp_path):
    config = {
        "project_dir": str(tmp_path),
        "spawning": {"maxConcurrentAgents": 2},
    }
    # Create a workspace with SOUL.md
    ws = tmp_path / "workspaces" / "alice"
    ws.mkdir(parents=True)
    (ws / "SOUL.md").write_text("You are Alice, L8 lead.")

    agents = resolve_agents_to_spawn(config)
    assert len(agents) == 1
    assert agents[0]["name"] == "alice"
    assert "Alice" in agents[0]["soul_md"]
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && uv run pytest tests/test_local_spawning.py -v`
Expected: FAIL

**Step 3: Add agent resolution and spawning to local.py**

Add `resolve_agents_to_spawn()` that scans `workspaces/` for SOUL.md files.
Update `start_local()` to spawn agents after server is ready.

**Step 4: Run test to verify it passes**

Run: `cd apps/api && uv run pytest tests/test_local_spawning.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/app/local.py apps/api/tests/test_local_spawning.py
git commit -m "feat(api): wire agent spawner into local mode entrypoint

scans workspaces/ for SOUL.md, spawns agents up to concurrency cap"
```

---

## Phase 5: Asyncio Scheduler (Deferrable)

Replace Redis + arq with asyncio scheduled tasks for local mode. This phase is not required for MVP — memory store/search work without enrichment.

### Task 5.1: Asyncio Cron Scheduler

**Files:**

- Create: `apps/api/app/workers/local_scheduler.py`
- Create: `apps/api/tests/test_local_scheduler.py`

**Step 1: Write the failing test**

```python
# apps/api/tests/test_local_scheduler.py
"""Tests for asyncio-based local scheduler."""
import asyncio
import pytest
from app.workers.local_scheduler import LocalScheduler


@pytest.mark.asyncio
async def test_scheduler_runs_job():
    call_count = 0

    async def dummy_job(ctx):
        nonlocal call_count
        call_count += 1

    scheduler = LocalScheduler()
    scheduler.add_job(dummy_job, interval_seconds=0.1)

    task = asyncio.create_task(scheduler.start())
    await asyncio.sleep(0.35)
    scheduler.stop()
    await task

    assert call_count >= 2
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && uv run pytest tests/test_local_scheduler.py -v`
Expected: FAIL

**Step 3: Implement local_scheduler.py**

```python
# apps/api/app/workers/local_scheduler.py
"""Asyncio-based cron scheduler for local mode (replaces arq + Redis)."""
from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from typing import Callable, Coroutine

import structlog

logger = structlog.get_logger()


@dataclass
class ScheduledJob:
    func: Callable
    interval_seconds: float
    name: str = ""


class LocalScheduler:
    """Simple asyncio scheduler that runs jobs at fixed intervals."""

    def __init__(self):
        self._jobs: list[ScheduledJob] = []
        self._running = False

    def add_job(self, func: Callable, interval_seconds: float, name: str = "") -> None:
        self._jobs.append(ScheduledJob(func, interval_seconds, name or func.__name__))

    async def start(self) -> None:
        self._running = True
        tasks = [asyncio.create_task(self._run_job(job)) for job in self._jobs]
        await asyncio.gather(*tasks, return_exceptions=True)

    def stop(self) -> None:
        self._running = False

    async def _run_job(self, job: ScheduledJob) -> None:
        while self._running:
            try:
                await job.func({})
            except Exception:
                logger.exception("scheduler.job_failed", job=job.name)
            await asyncio.sleep(job.interval_seconds)
```

**Step 4: Run test to verify it passes**

Run: `cd apps/api && uv run pytest tests/test_local_scheduler.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/app/workers/local_scheduler.py apps/api/tests/test_local_scheduler.py
git commit -m "feat(api): asyncio cron scheduler for local mode

replaces arq + Redis for background enrichment jobs when running locally"
```

### Task 5.2: Wire Scheduler into Local Mode

**Files:**

- Modify: `apps/api/app/local.py`

**Step 1: Add scheduler startup**

In `start_local()`, after seeding agents, create a `LocalScheduler` with the same jobs as `WorkerSettings.cron_jobs` but at adjusted intervals:

| Job                  | arq schedule | Local interval                                             |
| -------------------- | ------------ | ---------------------------------------------------------- |
| `boost_co_retrieved` | 4x daily     | 6 hours (21600s)                                           |
| `identify_stale`     | daily        | 24 hours (86400s)                                          |
| `extract_entities`   | daily        | 1 hour (3600s) — more frequent locally for faster feedback |
| `expire_memories`    | hourly       | 1 hour (3600s)                                             |
| `monitor_sla`        | every minute | 60s                                                        |

Skip `merge_duplicate_entities` (stub).

**Step 2: Run full integration test**

Run: `cd apps/api && uv run pytest tests/test_sqlite_integration.py tests/test_local_scheduler.py -v`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/api/app/local.py
git commit -m "feat(api): wire asyncio scheduler into local mode startup"
```

---

## Phase Summary

| Phase                | Tasks | Ships                                   | Deferrable?             |
| -------------------- | ----- | --------------------------------------- | ----------------------- |
| 1: Prune             | 3     | Clean codebase                          | No                      |
| 2: SQLite            | 5     | API works with SQLite                   | No                      |
| 3: Local startup     | 3     | `openspawn start` boots Python API      | No                      |
| 4: Agent spawning    | 3     | Claude Code agents spawn and coordinate | No                      |
| 5: Asyncio scheduler | 2     | Background enrichment without Redis     | Yes (MVP works without) |

## Post-Implementation

After all phases complete:

- Update `AGENTS.md` to reflect new architecture
- Update `ARCHITECTURE.md` with local mode details
- Update `docs/` (Astro) getting started guide
- Run full test suite: `cd apps/api && uv run pytest && cd ../../packages/openspawn && pnpm exec vitest run`
- Format: `pnpm exec oxfmt --write . && cd apps/api && uv run ruff format .`
- Lint: `pnpm exec nx run-many -t lint && cd apps/api && uv run ruff check .`

## Unresolved Questions

- `claude --print` vs `claude -p` — verify correct flag for headless execution with MCP
- sqlite-vec installation: Python package `sqlite-vec` or load extension at runtime?
- Should agent stdout be streamed to coordinator logs or written to per-agent files in `workspaces/<agent>/logs/`?
- ORG.md seeder: re-seed on every start, or only first run + explicit `openspawn seed`?
- How to handle `openspawn start` when API dir isn't at a known relative path (installed via pip vs monorepo)?
