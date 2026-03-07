# Lane 1 Completion + Phase 2 — Design Document

**Date:** 2026-03-06
**Status:** Approved
**Epic:** #519

---

## Scope

Complete Lane 1 remaining issues (#532, #533, #534, #535) and Phase 2 memory intelligence (#544, #545, #546, #547).

---

## 1. #532 — Observability

### Current state

- structlog configured in `app/logging.py`, integrated into FastAPI lifespan
- No logfire, langfuse, or OTel instrumentation

### Design

Add observability as **optional** — app works without tokens, instruments when configured.

**Dependencies to add:**
- `logfire[fastapi,sqlalchemy]` — auto-traces requests, Pydantic validation, SQLAlchemy
- `langfuse` — LLM-specific spans for instructor/litellm calls
- `opentelemetry-instrumentation-httpx` — trace outbound HTTP (embedding providers)

**Integration points:**
- `app/main.py` — `logfire.instrument_fastapi(app)` (guarded by `LOGFIRE_TOKEN` env var)
- `app/memory/compression.py` — langfuse trace decorator on LLM compression calls
- `app/memory/dedup.py` — langfuse trace decorator on LLM dedup decisions
- `app/memory/providers/*.py` — logfire span on embed calls

**Config (all optional env vars):**
- `LOGFIRE_TOKEN` — enables logfire (no-op without)
- `LANGFUSE_PUBLIC_KEY` + `LANGFUSE_SECRET_KEY` — enables langfuse (no-op without)

**No-op pattern:**
```python
import logfire
logfire.configure()  # no-op if LOGFIRE_TOKEN not set
logfire.instrument_fastapi(app)
```

---

## 2. #533 — CI/CD + Docker + NestJS Cleanup

### Current state

- CI pipeline tests Python API (lint, format, typecheck, pytest)
- Deploy builds Node sandbox image only
- `apps/api-nestjs/` — 170 files, ~19K lines, zero production usage, fully replaced
- `tools/sandbox-python/` — experimental, not deployed
- 13 @nestjs/* deps in root package.json
- CI has stale api-nestjs typecheck step

### Design

#### 2a. Delete legacy code

- Delete `apps/api-nestjs/` entirely
- Delete `tools/sandbox-python/` entirely
- Remove 13 @nestjs/* deps from root `package.json`
- Remove api-nestjs typecheck from `.github/workflows/ci.yml`
- Remove api-nestjs from `knip.json`
- Remove api-nestjs from `.vscode/launch.json`

#### 2b. FastAPI Dockerfile

Create `apps/api/Dockerfile`:
```dockerfile
FROM ghcr.io/astral-sh/uv:python3.12-slim AS builder
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
COPY app/ app/
COPY alembic/ alembic/
COPY alembic.ini .

FROM python:3.12-slim AS runtime
WORKDIR /app
COPY --from=builder /app .
EXPOSE 8000
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### 2c. docker-compose update

Add `api` service:
```yaml
api:
  build: apps/api
  ports: ["8000:8000"]
  depends_on: [postgres]
  env_file: .env
```

#### 2d. Deploy workflow update

- Build both images (sandbox + api)
- Push both to GHCR
- Deploy both containers

#### 2e. Sandbox proxy

Add route in `tools/sandbox/src` to proxy `/api/*` → `http://api:8000` (container networking).

#### 2f. Documentation updates

- AGENTS.md — remove api-nestjs from structure, commands, key URLs
- ARCHITECTURE.md — remove NestJS sections, update tech stack
- README.md — remove api-nestjs references

---

## 3. #534 — openapi-typescript Codegen Pipeline

### Current state

- FastAPI auto-generates OpenAPI schema at `/openapi.json`
- GraphQL codegen pipeline exists (`codegen.ts`, `@graphql-codegen/*`)
- No REST type generation

### Design

**Step 1: Export OpenAPI schema**

Script in `apps/api/scripts/export-openapi.py`:
```python
from app.main import app
import json, sys
json.dump(app.openapi(), sys.stdout, indent=2)
```

CI step: `uv run python scripts/export-openapi.py > openapi.json`

**Step 2: Install tooling**

```bash
pnpm add -D openapi-typescript openapi-fetch
```

**Step 3: Codegen script**

In root `package.json`:
```json
"codegen:rest": "openapi-typescript apps/api/openapi.json -o libs/dashboard-data/src/rest/generated/schema.d.ts"
```

**Step 4: Typed fetch client**

`libs/dashboard-data/src/rest/client.ts`:
```typescript
import createClient from "openapi-fetch";
import type { paths } from "./generated/schema";

export const api = createClient<paths>({ baseUrl: getSandboxUrl() });
```

**Output structure:**
```
libs/dashboard-data/src/rest/
  generated/
    schema.d.ts          # auto-generated types
  client.ts              # typed fetch client
```

---

## 4. #535 — GraphQL → REST Migration

### Current state

- 33 files import GraphQL hooks
- 13 generated GraphQL hooks (8 queries, 4 mutations, 1 fragment)
- TanStack Query already installed and used

### Design

**Strategy:** Incremental, page-by-page migration.

**Step 1: Create REST hooks**

In `libs/dashboard-data/src/hooks/`, create REST equivalents using TanStack Query + openapi-fetch client:

| GraphQL Hook | REST Hook | Endpoint |
|--|--|--|
| useTasksQuery | useTasks | GET /tasks |
| useTaskQuery | useTask | GET /tasks/:id |
| useAgentsQuery | useAgents | GET /agents |
| useCreditHistoryQuery | useCreditHistory | GET /credits |
| useEventsQuery | useEvents | GET /events |
| useChannelsQuery | useChannels | GET /channels |
| useMessagesQuery | useMessages | GET /messages |
| useWebhooksQuery | useWebhooks | GET /webhooks |
| useWebhookQuery | useWebhook | GET /webhooks/:id |
| useCreateWebhookMutation | useCreateWebhook | POST /webhooks |
| useUpdateWebhookMutation | useUpdateWebhook | PATCH /webhooks/:id |
| useDeleteWebhookMutation | useDeleteWebhook | DELETE /webhooks/:id |
| useTestWebhookMutation | useTestWebhook | POST /webhooks/:id/test |

**Step 2: Migrate consumers**

Group migrations by domain (one PR per group):
1. Agents (useAgents) — ~8 files
2. Tasks (useTasks, useTask) — ~6 files
3. Credits (useCreditHistory) — ~3 files
4. Messages (useChannels, useMessages) — ~5 files
5. Events (useEvents) — ~4 files
6. Webhooks (all 5 webhook hooks) — ~4 files
7. Remaining/shared components — ~3 files

**Step 3: Delete GraphQL**

After all consumers migrated:
- Delete `libs/dashboard-data/src/graphql/` (operations, generated hooks, fetcher)
- Delete `schema.gql`
- Delete `codegen.ts`
- Remove `graphql-request`, `@graphql-codegen/*` from deps
- Remove `pnpm run codegen` (replace with `pnpm run codegen:rest`)

---

## 5. Phase 2 — Memory Intelligence

### 5a. #544 — Background Enrichment Worker

**New deps:** `arq`, `redis`

**Files:**
- `app/workers/enrichment.py` — arq worker with jobs:
  - `boost_co_retrieved()` — increment strength for memories retrieved together
  - `identify_stale()` — flag low-confidence + low-access + old memories
  - `derive_facts()` — cluster related memories, extract new facts via instructor + litellm
- `app/workers/config.py` — arq WorkerSettings, Redis connection
- `app/config.py` — add `REDIS_URL` setting

**Triggers:**
- Cron: run enrichment every 6 hours
- Event: after every 100 new memories per org

**Two-tier resilience (deferred from Phase 1):**
- Fast path in `service.py`: store raw_content immediately (searchable via tsvector)
- Enqueue arq job for async: LLM compression + embedding
- If worker is down, memories still stored and searchable at lower quality

### 5b. #545 — Feedback Loop + Retrieval Optimization

**Changes:**
- `service.py` — on retrieval, store query in `retrieval_context` jsonb
- `service.py` — on feedback (helpful/unhelpful), adjust confidence:
  - helpful: confidence += 2 (capped at 100)
  - unhelpful: confidence -= 5 (floored at 0)
- `search.py` — incorporate helpful_count into scoring formula:
  ```
  score = 0.5 * cosine + 0.2 * recency + 0.15 * access_freq + 0.15 * helpfulness
  ```
- Dashboard: add feedback buttons to memory search results

### 5c. #546 — Contradiction Resolution

**Changes:**
- `dedup.py` — CONFLICT path already exists. Enhance:
  - Store both memories, link via `metadata.contradicts_id`
  - Reduce old memory confidence by 20
  - New memory gets source confidence
- `app/memory/contradictions.py` — new module:
  - `list_contradictions(org_id)` — find memory pairs with contradicts_id
  - `resolve_contradiction(id, strategy)` — strategies: KEEP_NEWER, KEEP_OLDER, MERGE, FLAG
  - MERGE uses instructor + litellm to synthesize
- `router.py` — add `GET /memory/contradictions` and `POST /memory/contradictions/{id}/resolve`
- Dashboard: contradictions panel on memory page

### 5d. #547 — Auto-Expire Time-Bound Memories

**Changes:**
- `router.py` — add optional `ttl_seconds` param to POST /memory
  - Sets `expires_at = now + ttl_seconds`
- `app/workers/expiry.py` — arq periodic job (runs hourly):
  - Soft-delete memories where `expires_at < now()`
  - Soft-delete = set `metadata.expired = true`, exclude from search
- `search.py` — filter out expired memories from results

---

## Execution Order

```
#532 (observability) ──────────┐
                               ├── parallel
#533 (Docker + NestJS cleanup) ┘
          ↓
#534 (openapi-typescript codegen)
          ↓
#535 (GraphQL → REST migration)
          ↓
#544 (background enrichment) ──┐
                               ├── parallel
#545 (feedback loop)      ─────┘
          ↓
#546 (contradiction resolution)
          ↓
#547 (auto-expire)
```

---

## Success Criteria (ralph-loop exit condition)

All 8 issues (#532, #533, #534, #535, #544, #545, #546, #547) closed on GitHub with merged PRs.

Verification: `gh issue list -l memory -l phase-2 --state open` returns 0 results.
