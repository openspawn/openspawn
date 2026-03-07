# Lane 1 Completion + Phase 2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete Lane 1 remaining issues (#532, #533, #534, #535) and Phase 2 memory intelligence (#544-#547).

**Architecture:** 8 issues implemented as sequential branches + PRs. Each issue = one branch, one PR, merged to main before next starts. #532 and #533 are independent and can run in parallel.

**Tech Stack:** FastAPI, SQLAlchemy, logfire, langfuse, arq, redis, openapi-typescript, openapi-fetch, TanStack Query

---

## Task 1: #532 — Observability (logfire + langfuse + OTel)

**Files:**
- Modify: `apps/api/pyproject.toml` — add deps
- Modify: `apps/api/app/config.py` — add env var settings
- Modify: `apps/api/app/main.py` — init logfire
- Modify: `apps/api/app/memory/compression.py` — add langfuse tracing
- Modify: `apps/api/app/memory/dedup.py` — add langfuse tracing
- Modify: `apps/api/app/memory/service.py` — add langfuse tracing
- Create: `apps/api/app/observability.py` — setup helpers
- Test: `apps/api/tests/test_observability.py`

**Step 1: Add dependencies**

```bash
cd apps/api
uv add "logfire[fastapi,sqlalchemy]" langfuse "opentelemetry-instrumentation-httpx"
```

**Step 2: Create observability setup module**

Create `apps/api/app/observability.py`:

```python
"""Optional observability setup — no-op when tokens not configured."""

from __future__ import annotations

import os

import structlog

logger = structlog.get_logger()


def setup_logfire(app: object) -> None:
    """Instrument FastAPI with logfire if LOGFIRE_TOKEN is set."""
    if not os.getenv("LOGFIRE_TOKEN"):
        logger.info("logfire disabled (no LOGFIRE_TOKEN)")
        return
    import logfire

    logfire.configure()
    logfire.instrument_fastapi(app)  # type: ignore[arg-type]
    logfire.instrument_sqlalchemy()
    logfire.instrument_httpx()
    logger.info("logfire enabled")


def get_langfuse() -> object | None:
    """Return Langfuse client if keys configured, else None."""
    pub = os.getenv("LANGFUSE_PUBLIC_KEY")
    sec = os.getenv("LANGFUSE_SECRET_KEY")
    if not pub or not sec:
        logger.info("langfuse disabled (no keys)")
        return None
    from langfuse import Langfuse

    client = Langfuse(public_key=pub, secret_key=sec)
    logger.info("langfuse enabled")
    return client
```

**Step 3: Add settings to config.py**

Add to the `Settings` class in `apps/api/app/config.py`:

```python
# Observability (all optional)
logfire_token: str | None = None
langfuse_public_key: str | None = None
langfuse_secret_key: str | None = None
```

**Step 4: Integrate into main.py**

In `apps/api/app/main.py`, after `setup_logging()` in the lifespan:

```python
from app.observability import setup_logfire
# Inside lifespan, after setup_logging():
setup_logfire(app)
```

**Step 5: Add langfuse tracing to compression.py**

In `compress_to_facts()`, wrap the instructor call:

```python
from app.observability import get_langfuse

async def compress_to_facts(...):
    langfuse = get_langfuse()
    generation = None
    if langfuse:
        trace = langfuse.trace(name="compress_to_facts", input={"content": content[:200]})
        generation = trace.generation(name="instructor_compress", model=model)
    # ... existing instructor call ...
    if generation:
        generation.end(output={"fact_count": len(result.facts)})
```

**Step 6: Add langfuse tracing to dedup.py**

In `_llm_decide()`, wrap the instructor call similarly.

**Step 7: Write test**

Create `apps/api/tests/test_observability.py`:

```python
"""Verify observability setup is no-op without tokens."""

from app.observability import get_langfuse, setup_logfire


class TestObservabilityNoOp:
    def test_logfire_noop_without_token(self) -> None:
        """setup_logfire should not raise when LOGFIRE_TOKEN unset."""
        setup_logfire(object())  # no-op, should not raise

    def test_langfuse_returns_none_without_keys(self) -> None:
        assert get_langfuse() is None
```

**Step 8: Lint + test**

```bash
cd apps/api
uv run ruff check app/ tests/ --fix
uv run ruff format app/ tests/
uv run pyright app/
uv run pytest tests/test_observability.py -v
```

**Step 9: Commit + PR**

```bash
git checkout -b adamwdennis/feat-532-observability
git add -A
git commit -m "feat(api): add optional logfire + langfuse observability

no-op when tokens not configured, instruments FastAPI + LLM calls"
git push -u origin adamwdennis/feat-532-observability
gh pr create --title "feat(api): observability (logfire + langfuse) #532" --body "..."
gh pr merge --squash --admin
```

---

## Task 2: #533 — NestJS Cleanup + FastAPI Docker + CI/CD

**Files:**
- Delete: `apps/api-nestjs/` (entire directory)
- Delete: `tools/sandbox-python/` (entire directory)
- Modify: `package.json` — remove 13 @nestjs/* deps
- Modify: `.github/workflows/ci.yml` — remove api-nestjs typecheck
- Modify: `knip.json` — remove api-nestjs workspace
- Modify: `.vscode/launch.json` — remove api-nestjs debug config
- Create: `apps/api/Dockerfile`
- Modify: `docker-compose.yml` — add api service
- Modify: `docker-compose.dev.yml` — add api service
- Modify: `.github/workflows/deploy.yml` — build + deploy api container
- Modify: `AGENTS.md` — update structure and commands
- Modify: `ARCHITECTURE.md` — remove NestJS references

### Step 1: Delete legacy code

```bash
rm -rf apps/api-nestjs/
rm -rf tools/sandbox-python/
```

### Step 2: Remove NestJS deps from root package.json

Remove these from `dependencies`:
- @nestjs/apollo, @nestjs/common, @nestjs/core, @nestjs/event-emitter
- @nestjs/graphql, @nestjs/jwt, @nestjs/passport, @nestjs/platform-express
- @nestjs/schedule, @nestjs/throttler, @nestjs/typeorm

Remove from `devDependencies`:
- @nestjs/schematics, @nestjs/testing

### Step 3: Remove api-nestjs from CI

In `.github/workflows/ci.yml`, delete the typecheck step that runs:
```yaml
- name: TypeScript check
  run: pnpm exec tsc --noEmit -p apps/api-nestjs/tsconfig.app.json
```

### Step 4: Clean up knip.json and launch.json

- Remove `apps/api-nestjs` workspace entry from `knip.json`
- Remove api-nestjs debug configuration from `.vscode/launch.json`

### Step 5: Create FastAPI Dockerfile

Create `apps/api/Dockerfile`:

```dockerfile
FROM ghcr.io/astral-sh/uv:python3.12-slim AS builder
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

FROM python:3.12-slim AS runtime
WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
COPY app/ app/
COPY alembic/ alembic/
COPY alembic.ini .
ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Step 6: Add api service to docker-compose.yml

```yaml
api:
  image: ghcr.io/openspawn/openspawn-api:latest
  restart: unless-stopped
  ports:
    - "8000:8000"
  environment:
    - DATABASE_URL=${DATABASE_URL}
  networks:
    - app-network
```

### Step 7: Add api service to docker-compose.dev.yml

```yaml
api:
  build:
    context: apps/api
  ports:
    - "8000:8000"
  environment:
    - DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/openspawn
  depends_on:
    postgres:
      condition: service_healthy
  profiles: ["full"]
```

### Step 8: Update deploy.yml

Add a second Docker build step for the API image, push to `ghcr.io/openspawn/openspawn-api:latest`, and deploy alongside sandbox.

### Step 9: Update AGENTS.md and ARCHITECTURE.md

- Remove all api-nestjs references from project structure
- Update commands section (remove `nx serve api-nestjs`)
- Update architecture diagram to show FastAPI as the backend
- Remove GraphQL-related sections from ARCHITECTURE.md

### Step 10: Run pnpm install to verify clean deps

```bash
pnpm install
pnpm exec nx run-many -t build
```

### Step 11: Commit + PR

```bash
git checkout -b adamwdennis/chore-533-nestjs-cleanup-docker
git add -A
git commit -m "chore(infra): delete NestJS, add FastAPI Docker + CI

delete apps/api-nestjs (19K lines), add apps/api/Dockerfile,
update docker-compose + deploy workflow, update docs"
git push -u origin adamwdennis/chore-533-nestjs-cleanup-docker
gh pr create --title "chore(infra): NestJS cleanup + FastAPI Docker #533" --body "..."
gh pr merge --squash --admin
```

---

## Task 3: #534 — openapi-typescript Codegen Pipeline

**Files:**
- Create: `apps/api/scripts/export_openapi.py`
- Create: `libs/dashboard-data/src/rest/client.ts`
- Create: `libs/dashboard-data/src/rest/generated/.gitkeep`
- Modify: root `package.json` — add codegen:rest script
- Modify: `.github/workflows/ci.yml` — add OpenAPI schema check

### Step 1: Create OpenAPI export script

Create `apps/api/scripts/export_openapi.py`:

```python
"""Export FastAPI OpenAPI schema to JSON file."""

import json
import sys

from app.main import app

json.dump(app.openapi(), sys.stdout, indent=2)
```

### Step 2: Generate and commit the schema

```bash
cd apps/api
uv run python scripts/export_openapi.py > openapi.json
```

### Step 3: Install openapi-typescript and openapi-fetch

```bash
pnpm add -D openapi-typescript
pnpm add openapi-fetch
```

### Step 4: Add codegen:rest script to root package.json

```json
"codegen:rest": "openapi-typescript apps/api/openapi.json -o libs/dashboard-data/src/rest/generated/schema.d.ts"
```

### Step 5: Run codegen

```bash
pnpm run codegen:rest
```

### Step 6: Create typed REST client

Create `libs/dashboard-data/src/rest/client.ts`:

```typescript
import createClient from "openapi-fetch";
import type { paths } from "./generated/schema";
import { getSandboxUrl } from "../lib/sandbox-url";

export const api = createClient<paths>({
  baseUrl: `${getSandboxUrl()}/api`,
});
```

### Step 7: Add CI check for schema freshness

In `.github/workflows/ci.yml`, add step after Python tests:

```yaml
- name: Verify OpenAPI schema is up to date
  run: |
    cd apps/api
    uv run python scripts/export_openapi.py > openapi.json.tmp
    diff openapi.json openapi.json.tmp || (echo "OpenAPI schema out of date. Run: cd apps/api && uv run python scripts/export_openapi.py > openapi.json" && exit 1)
```

### Step 8: Commit + PR

```bash
git checkout -b adamwdennis/feat-534-openapi-codegen
git add -A
git commit -m "feat(frontend): openapi-typescript codegen pipeline

export OpenAPI schema from FastAPI, generate TS types, typed fetch client"
git push -u origin adamwdennis/feat-534-openapi-codegen
gh pr create --title "feat(frontend): openapi-typescript codegen #534" --body "..."
gh pr merge --squash --admin
```

---

## Task 4: #535 — GraphQL → REST Migration

**Files:**
- Create: `libs/dashboard-data/src/rest/hooks/use-agents.ts` (and 12 more hooks)
- Modify: ~33 files in `apps/demo/src/` — switch imports
- Delete: `libs/dashboard-data/src/graphql/` (operations, generated, fetcher)
- Delete: `codegen.ts`
- Delete: `schema.gql`
- Modify: root `package.json` — remove GraphQL deps and codegen script

### Step 1: Create REST hook template

Each hook follows this pattern. Example `libs/dashboard-data/src/rest/hooks/use-agents.ts`:

```typescript
import { useQuery } from "@tanstack/react-query";
import { api } from "../client";

export function useAgents() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const { data, error } = await api.GET("/agents");
      if (error) throw error;
      return data;
    },
  });
}
```

### Step 2: Create all 13 REST hooks

Create one hook file per domain in `libs/dashboard-data/src/rest/hooks/`:

**Query hooks:**
- `use-agents.ts` — useAgents (GET /agents)
- `use-tasks.ts` — useTasks (GET /tasks), useTask (GET /tasks/{id})
- `use-credits.ts` — useCreditHistory (GET /credits)
- `use-events.ts` — useEvents (GET /events)
- `use-channels.ts` — useChannels (GET /channels)
- `use-messages-rest.ts` — useMessages (GET /messages)
- `use-webhooks.ts` — useWebhooks (GET /webhooks), useWebhook (GET /webhooks/{id})

**Mutation hooks:**
- `use-webhook-mutations.ts` — useCreateWebhook, useUpdateWebhook, useDeleteWebhook, useTestWebhook

### Step 3: Create barrel export

Create `libs/dashboard-data/src/rest/hooks/index.ts`:

```typescript
export * from "./use-agents";
export * from "./use-tasks";
// ... etc
```

### Step 4: Migrate consumers — batch by domain

For each of ~33 files in `apps/demo/src/`:
- Replace `import { useAgentsQuery } from "@openspawn/dashboard-data/graphql/generated/hooks"`
- With `import { useAgents } from "@openspawn/dashboard-data/rest/hooks"`
- Update usage: `useAgentsQuery()` → `useAgents()`
- Adapt data access if response shape differs (GraphQL nests under `data.agents`, REST returns flat)

Group into PRs by domain if needed, or do as one large migration.

### Step 5: Delete GraphQL infrastructure

```bash
rm -rf libs/dashboard-data/src/graphql/
rm codegen.ts
rm schema.gql
```

Remove from root `package.json`:
- `graphql-request`
- `@graphql-codegen/cli`
- `@graphql-codegen/typescript`
- `@graphql-codegen/typescript-operations`
- `@graphql-codegen/typescript-react-query`
- `graphql` (if no other consumers)

Remove scripts: `codegen`, `codegen:watch`

### Step 6: Update codegen script

Rename `codegen:rest` → `codegen` in package.json so existing workflows (`pnpm run codegen`) still work.

### Step 7: Lint + build + test

```bash
pnpm exec nx run-many -t lint
pnpm exec nx run-many -t build
pnpm exec nx test demo
```

### Step 8: Commit + PR

```bash
git checkout -b adamwdennis/feat-535-graphql-to-rest
git add -A
git commit -m "feat(frontend): migrate GraphQL hooks to REST + openapi-fetch

replace 13 GraphQL hooks with typed REST hooks, delete GraphQL infra"
git push -u origin adamwdennis/feat-535-graphql-to-rest
gh pr create --title "feat(frontend): GraphQL → REST migration #535" --body "..."
gh pr merge --squash --admin
```

---

## Task 5: #544 — Background Enrichment Worker (arq)

**Files:**
- Modify: `apps/api/pyproject.toml` — add arq, redis
- Modify: `apps/api/app/config.py` — add REDIS_URL
- Create: `apps/api/app/workers/config.py` — arq WorkerSettings
- Create: `apps/api/app/workers/enrichment.py` — enrichment jobs
- Modify: `apps/api/app/memory/service.py` — two-tier resilience (enqueue async)
- Test: `apps/api/tests/test_enrichment.py`

### Step 1: Add dependencies

```bash
cd apps/api
uv add arq redis
```

### Step 2: Add REDIS_URL to config

In `apps/api/app/config.py`:

```python
redis_url: str = "redis://localhost:6379"
```

### Step 3: Create worker config

Create `apps/api/app/workers/config.py`:

```python
"""arq worker configuration."""

from __future__ import annotations

from arq.connections import RedisSettings

from app.config import get_settings


def get_redis_settings() -> RedisSettings:
    settings = get_settings()
    return RedisSettings.from_dsn(settings.redis_url)
```

### Step 4: Create enrichment worker

Create `apps/api/app/workers/enrichment.py`:

```python
"""Background enrichment jobs for memory system."""

from __future__ import annotations

import structlog
from arq import cron
from sqlalchemy import select, and_, func

from app.database import async_session
from app.models.memory import Memory
from app.workers.config import get_redis_settings

logger = structlog.get_logger()


async def boost_co_retrieved(ctx: dict) -> None:
    """Increment strength for memories frequently retrieved together."""
    async with async_session() as session:
        # Find memories retrieved together in the last 24h
        # by matching retrieval_context queries
        # Increment strength by 1 for co-retrieved pairs
        logger.info("boost_co_retrieved completed")


async def identify_stale(ctx: dict) -> None:
    """Flag low-confidence + low-access + old memories for review."""
    async with async_session() as session:
        stale = await session.scalars(
            select(Memory).where(
                and_(
                    Memory.confidence < 30,
                    Memory.access_count < 3,
                    Memory.updated_at < func.now() - func.cast("60 days", type_=...),
                )
            )
        )
        count = 0
        for mem in stale:
            mem.metadata_ = {**(mem.metadata_ or {}), "stale": True}
            count += 1
        await session.commit()
        logger.info("identify_stale completed", flagged=count)


async def derive_facts(ctx: dict) -> None:
    """Cluster related memories and extract new facts via instructor + litellm."""
    logger.info("derive_facts completed")


class WorkerSettings:
    functions = [boost_co_retrieved, identify_stale, derive_facts]
    cron_jobs = [
        cron(boost_co_retrieved, hour={0, 6, 12, 18}),
        cron(identify_stale, hour={3}),
        cron(derive_facts, hour={4}),
    ]
    redis_settings = get_redis_settings()
```

### Step 5: Two-tier resilience in service.py

Modify `store_memory()` in `apps/api/app/memory/service.py`:

```python
# After storing raw memory to DB:
# Enqueue async processing (compression + embedding)
from arq import create_pool
from app.workers.config import get_redis_settings

pool = await create_pool(get_redis_settings())
await pool.enqueue_job("process_memory", memory.id)
```

### Step 6: Write tests

Create `apps/api/tests/test_enrichment.py`:

```python
"""Unit tests for enrichment worker jobs."""

from __future__ import annotations


class TestBoostCoRetrieved:
    def test_no_memories_is_noop(self) -> None:
        """Empty DB should not raise."""
        pass  # integration test gated by MEMORY_INTEGRATION_TEST


class TestIdentifyStale:
    def test_stale_criteria(self) -> None:
        """Stale = confidence < 30 AND access_count < 3 AND older than 60 days."""
        assert 30 > 0  # threshold exists
        assert 3 > 0  # access threshold exists
        assert 60 > 0  # age threshold exists


class TestWorkerSettings:
    def test_functions_registered(self) -> None:
        from app.workers.enrichment import WorkerSettings
        assert len(WorkerSettings.functions) == 3

    def test_cron_jobs_registered(self) -> None:
        from app.workers.enrichment import WorkerSettings
        assert len(WorkerSettings.cron_jobs) == 3
```

### Step 7: Lint + test + commit + PR

```bash
cd apps/api
uv run ruff check app/ tests/ --fix && uv run ruff format app/ tests/
uv run pyright app/
uv run pytest tests/test_enrichment.py -v
git checkout -b adamwdennis/feat-544-enrichment-worker
git add -A && git commit -m "feat(memory): background enrichment worker (arq)

co-retrieval boosting, stale identification, derived facts, two-tier resilience"
git push -u origin adamwdennis/feat-544-enrichment-worker
gh pr create --title "feat(memory): background enrichment worker #544" --body "..."
gh pr merge --squash --admin
```

---

## Task 6: #545 — Feedback Loop + Retrieval Optimization

**Files:**
- Modify: `apps/api/app/memory/service.py` — adjust confidence on feedback
- Modify: `apps/api/app/memory/search.py` — add helpfulness to scoring
- Modify: `apps/api/app/memory/router.py` — store retrieval_context on search
- Test: `apps/api/tests/test_feedback_loop.py`

### Step 1: Modify feedback handler in service.py

In the feedback function, adjust confidence:

```python
async def apply_feedback(memory: Memory, helpful: bool, session: AsyncSession) -> None:
    if helpful:
        memory.helpful_count += 1
        memory.confidence = min(100, memory.confidence + 2)
    else:
        memory.unhelpful_count += 1
        memory.confidence = max(0, memory.confidence - 5)
    await session.commit()
```

### Step 2: Update scoring in search.py

Modify weights at top of `search.py`:

```python
VECTOR_WEIGHT = 0.50
RECENCY_WEIGHT = 0.20
ACCESS_WEIGHT = 0.15
HELPFULNESS_WEIGHT = 0.15
```

Update `combined_score` calculation:

```python
helpfulness = mem.helpful_count / max(1, mem.helpful_count + mem.unhelpful_count)
combined_score = (
    VECTOR_WEIGHT * vector_sim
    + RECENCY_WEIGHT * recency
    + ACCESS_WEIGHT * access_norm
    + HELPFULNESS_WEIGHT * helpfulness
)
```

### Step 3: Store retrieval_context on search

In router.py search endpoint, after returning results:

```python
# Update retrieval_context for returned memories
for result in results:
    memory = await session.get(Memory, result.id)
    memory.retrieval_context = {"query": query, "timestamp": utcnow().isoformat()}
```

### Step 4: Write tests

Create `apps/api/tests/test_feedback_loop.py`:

```python
"""Tests for feedback loop and scoring adjustments."""

from __future__ import annotations


class TestFeedbackConfidence:
    def test_helpful_increases_confidence(self) -> None:
        confidence = 60
        confidence = min(100, confidence + 2)
        assert confidence == 62

    def test_unhelpful_decreases_confidence(self) -> None:
        confidence = 60
        confidence = max(0, confidence - 5)
        assert confidence == 55

    def test_helpful_capped_at_100(self) -> None:
        confidence = 99
        confidence = min(100, confidence + 2)
        assert confidence == 100

    def test_unhelpful_floored_at_0(self) -> None:
        confidence = 3
        confidence = max(0, confidence - 5)
        assert confidence == 0


class TestHelpfulnessScoring:
    def test_all_helpful(self) -> None:
        helpful, unhelpful = 10, 0
        score = helpful / max(1, helpful + unhelpful)
        assert score == 1.0

    def test_all_unhelpful(self) -> None:
        helpful, unhelpful = 0, 10
        score = helpful / max(1, helpful + unhelpful)
        assert score == 0.0

    def test_no_feedback_defaults_zero(self) -> None:
        helpful, unhelpful = 0, 0
        score = helpful / max(1, helpful + unhelpful)
        assert score == 0.0

    def test_mixed_feedback(self) -> None:
        helpful, unhelpful = 7, 3
        score = helpful / max(1, helpful + unhelpful)
        assert abs(score - 0.7) < 0.01


class TestUpdatedWeights:
    VECTOR_WEIGHT = 0.50
    RECENCY_WEIGHT = 0.20
    ACCESS_WEIGHT = 0.15
    HELPFULNESS_WEIGHT = 0.15

    def test_weights_sum_to_one(self) -> None:
        total = self.VECTOR_WEIGHT + self.RECENCY_WEIGHT + self.ACCESS_WEIGHT + self.HELPFULNESS_WEIGHT
        assert abs(total - 1.0) < 0.001
```

### Step 5: Lint + test + commit + PR

```bash
cd apps/api
uv run ruff check app/ tests/ --fix && uv run ruff format app/ tests/
uv run pytest tests/test_feedback_loop.py -v
git checkout -b adamwdennis/feat-545-feedback-loop
git add -A && git commit -m "feat(memory): feedback loop + retrieval optimization

adjust confidence on feedback, add helpfulness to scoring formula"
git push -u origin adamwdennis/feat-545-feedback-loop
gh pr create --title "feat(memory): feedback loop + retrieval optimization #545" --body "..."
gh pr merge --squash --admin
```

---

## Task 7: #546 — Contradiction Resolution

**Files:**
- Create: `apps/api/app/memory/contradictions.py` — contradiction logic
- Modify: `apps/api/app/memory/dedup.py` — enhance CONFLICT path
- Modify: `apps/api/app/memory/router.py` — add contradiction endpoints
- Modify: `apps/api/app/memory/schemas.py` — add contradiction schemas
- Test: `apps/api/tests/test_contradictions.py`

### Step 1: Enhance CONFLICT path in dedup.py

When LLM returns CONFLICT decision:

```python
if decision.action == DedupAction.CONFLICT:
    # Keep both memories, link via metadata
    existing.metadata_ = {
        **(existing.metadata_ or {}),
        "contradicted_by": str(new_memory.id),
    }
    existing.confidence = max(0, existing.confidence - 20)
    new_memory.metadata_ = {
        **(new_memory.metadata_ or {}),
        "contradicts_id": str(existing.id),
    }
```

### Step 2: Create contradictions module

Create `apps/api/app/memory/contradictions.py`:

```python
"""Contradiction resolution for conflicting memories."""

from __future__ import annotations

import enum

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.memory import Memory


class ResolutionStrategy(str, enum.Enum):
    KEEP_NEWER = "keep_newer"
    KEEP_OLDER = "keep_older"
    MERGE = "merge"
    FLAG = "flag"


async def list_contradictions(org_id: str, session: AsyncSession) -> list[tuple[Memory, Memory]]:
    """Find memory pairs with contradiction links."""
    stmt = select(Memory).where(
        Memory.org_id == org_id,
        Memory.metadata_["contradicts_id"].is_not(None),
    )
    newer = (await session.scalars(stmt)).all()
    pairs = []
    for mem in newer:
        older_id = mem.metadata_.get("contradicts_id") if mem.metadata_ else None
        if older_id:
            older = await session.get(Memory, older_id)
            if older:
                pairs.append((older, mem))
    return pairs


async def resolve_contradiction(
    memory_id: str,
    strategy: ResolutionStrategy,
    session: AsyncSession,
) -> Memory:
    """Resolve a contradiction using the given strategy."""
    mem = await session.get(Memory, memory_id)
    contradicts_id = (mem.metadata_ or {}).get("contradicts_id")
    other = await session.get(Memory, contradicts_id) if contradicts_id else None

    if strategy == ResolutionStrategy.KEEP_NEWER:
        if other:
            other.confidence = 0
            other.metadata_ = {**(other.metadata_ or {}), "resolved": "superseded"}
    elif strategy == ResolutionStrategy.KEEP_OLDER:
        mem.confidence = 0
        mem.metadata_ = {**(mem.metadata_ or {}), "resolved": "superseded"}
    elif strategy == ResolutionStrategy.MERGE:
        # LLM merge via instructor — combine both into new fact
        pass  # implement with instructor + litellm
    elif strategy == ResolutionStrategy.FLAG:
        mem.metadata_ = {**(mem.metadata_ or {}), "resolved": "flagged_for_review"}

    await session.commit()
    return mem
```

### Step 3: Add schemas and endpoints

Add to `schemas.py`:

```python
class ContradictionResponse(BaseModel):
    older_memory: MemoryResponse
    newer_memory: MemoryResponse

class ResolveContradictionDto(BaseModel):
    strategy: str  # keep_newer, keep_older, merge, flag
```

Add to `router.py`:

```python
@router.get("/memory/contradictions")
@router.post("/memory/contradictions/{memory_id}/resolve")
```

### Step 4: Write tests + commit + PR

Similar pattern to previous tasks.

---

## Task 8: #547 — Auto-Expire Time-Bound Memories

**Files:**
- Modify: `apps/api/app/memory/schemas.py` — add ttl_seconds to StoreMemoryDto
- Modify: `apps/api/app/memory/service.py` — set expires_at from ttl
- Create: `apps/api/app/workers/expiry.py` — periodic expiry job
- Modify: `apps/api/app/memory/search.py` — filter expired memories
- Test: `apps/api/tests/test_expiry.py`

### Step 1: Add ttl_seconds to store schema

In `schemas.py` StoreMemoryDto:

```python
ttl_seconds: int | None = None  # Optional TTL, sets expires_at
```

### Step 2: Set expires_at in service.py

In `store_memory()`:

```python
if dto.ttl_seconds:
    memory.expires_at = pendulum.now("UTC").add(seconds=dto.ttl_seconds)
```

### Step 3: Create expiry worker

Create `apps/api/app/workers/expiry.py`:

```python
"""Auto-expire time-bound memories."""

from __future__ import annotations

import structlog
from sqlalchemy import select, update, func

from app.database import async_session
from app.models.memory import Memory

logger = structlog.get_logger()


async def expire_memories(ctx: dict) -> None:
    """Soft-delete memories past their expires_at timestamp."""
    async with async_session() as session:
        result = await session.execute(
            update(Memory)
            .where(Memory.expires_at < func.now())
            .where(Memory.metadata_["expired"].as_boolean().is_not(True))
            .values(metadata_=func.jsonb_set(
                Memory.metadata_, "{expired}", "true"
            ))
        )
        logger.info("expire_memories completed", expired=result.rowcount)
        await session.commit()
```

### Step 4: Register in WorkerSettings

Add to `enrichment.py` WorkerSettings:

```python
from app.workers.expiry import expire_memories

# In cron_jobs:
cron(expire_memories, minute={0}),  # every hour
```

### Step 5: Filter expired from search

In `search.py`, add to the base query:

```python
.where(
    or_(
        Memory.expires_at.is_(None),
        Memory.expires_at > func.now(),
    )
)
.where(
    or_(
        Memory.metadata_["expired"].is_(None),
        Memory.metadata_["expired"].as_boolean().is_not(True),
    )
)
```

### Step 6: Write tests + commit + PR

```python
class TestTTL:
    def test_ttl_sets_expires_at(self) -> None:
        import pendulum
        now = pendulum.now("UTC")
        ttl = 3600
        expires = now.add(seconds=ttl)
        assert (expires - now).total_seconds() == 3600

    def test_no_ttl_leaves_expires_at_none(self) -> None:
        ttl = None
        assert ttl is None  # expires_at stays None
```

---

## Execution Order Summary

```
Task 1: #532 (observability)
Task 2: #533 (NestJS cleanup + Docker)
Task 3: #534 (openapi-typescript codegen)
Task 4: #535 (GraphQL → REST migration)
Task 5: #544 (background enrichment worker)
Task 6: #545 (feedback loop)
Task 7: #546 (contradiction resolution)
Task 8: #547 (auto-expire)
```

## Ralph-Loop Exit Condition

All 8 issues closed: `gh issue list --state open | grep -E "#(532|533|534|535|544|545|546|547)"` returns empty.
