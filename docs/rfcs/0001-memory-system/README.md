# OpenSpawn Memory System — Design Document

## Date: 2026-03-06

## Status: Approved

## Epic: #519

---

## 1. Summary

Add shared long-term memory to OpenSpawn so agents can store, search, and build on collective knowledge. This includes migrating the backend from NestJS to FastAPI, a custom memory pipeline (`instructor` + `litellm` + `pgvector`), and dropping GraphQL in favor of REST-only with OpenAPI.

---

## 2. Decisions Made

| Decision              | Choice                                                                            | Reasoning                                                                                                         |
| --------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Backend framework     | FastAPI + SQLAlchemy (async)                                                      | Python-native AI ecosystem, less boilerplate                                                                      |
| Package manager       | uv                                                                                | Current Python standard, replaces pip/virtualenv/pip-tools                                                        |
| Memory engine         | Custom pipeline (instructor + litellm + pgvector)                                 | Cognee NO-GO (#536): lacks hybrid search, basic dedup only, schema conflicts. Custom gives full control           |
| Embedding provider    | Voyage 3.5 (cloud, 1024d) / BGE-M3 via Ollama (self-hosted, 1024d)                | Best retrieval quality at pgvector-friendly dimensions                                                            |
| Embedding dimensions  | 1024                                                                              | Sweet spot: pgvector perf + quality. Voyage and BGE-M3 both output 1024 natively                                  |
| Vector storage        | Postgres + pgvector                                                               | Already using Postgres, no new infra                                                                              |
| API protocol          | REST-only with OpenAPI                                                            | Eliminates GraphQL security surface (introspection, depth attacks, batching), FastAPI auto-generates OpenAPI spec |
| Frontend types        | openapi-typescript codegen                                                        | Replaces GraphQL codegen, same DX                                                                                 |
| Memory table          | Single table with type enum                                                       | Simpler queries, single vector index, type-specific data in metadata jsonb                                        |
| Memory scoping        | Org + agent + visibility (SHARED/PRIVATE/TARGETED)                                | Default SHARED, fine-grained when needed                                                                          |
| Search                | Hybrid: pgvector cosine + tsvector BM25 + Reciprocal Rank Fusion                  | Validated by OpenClaw (189K stars) in production. ~84% precision vs ~62% vector-only                              |
| Dedup strategy        | SHA-256 hash (instant) -> vector similarity 0.90 -> LLM ADD/UPDATE/NOOP/CONFLICT  | Layered: free instant dedup, then semantic dedup, then LLM decision                                               |
| Content handling      | LLM compression to atomic facts on ingest via instructor + litellm, raw preserved | Inspired by SimpleMem Stage 1. Better embeddings from normalized content                                          |
| Rate limiting         | 10/min burst, 1000/day/agent, 100K/org (configurable per org)                     | Prevents memory explosion without blocking productive agents                                                      |
| Architecture approach | Thin memory module in API, clean boundary, documented extraction path             | Build as module, extract to service when signals warrant                                                          |
| Real-time             | SSE / WebSocket (FastAPI native)                                                  | Replaces GraphQL subscriptions                                                                                    |
| LLM structured output | instructor + litellm                                                              | Pydantic-native structured outputs, provider-agnostic LLM calls                                                   |
| MCP server            | fastmcp standalone v3.1.0                                                         | Ahead of bundled mcp SDK with OTel, auth, versioning                                                              |
| Task queue            | arq (Redis-backed async)                                                          | Lighter than Celery, async-native                                                                                 |
| Retries               | tenacity                                                                          | Higher LLM training coverage for agent-written retry logic                                                        |
| Observability         | OpenTelemetry + structlog + logfire + langfuse                                    | FastAPI/Pydantic tracing (logfire) + LLM-specific spans (langfuse)                                                |
| Migrations            | Alembic                                                                           | Industry standard for SQLAlchemy                                                                                  |
| Rate limiting lib     | limits (Redis-backed)                                                             | Production-grade, configurable                                                                                    |
| Caching               | cashews (Redis-backed async)                                                      | Better async API than aiocache                                                                                    |
| Auth                  | authlib + passlib + bcrypt                                                        | More actively maintained than python-jose                                                                         |
| Testing               | pytest + pytest-asyncio + respx + factory-boy + hypothesis                        | Comprehensive: async, mocking, fixtures, property-based                                                           |
| Datetime handling     | pendulum                                                                          | Better timezone support than stdlib                                                                               |

### Deliberate omissions

- **cognee / mem0 / zep** — evaluated in #536 spike; no hybrid search, basic dedup, schema conflicts. Revisit Cognee for Phase 3 knowledge graph
- **langchain / llamaindex** — too opinionated for a platform we control
- **celery** — overkill; arq is lighter and async-native
- **stamina** — tenacity has higher LLM training coverage
- **qdrant / chromadb** — pgvector is sufficient for Phase 1; add dedicated vector DB only if scaling demands it
- **temporalio / prefect** — not needed for Phase 1; evaluate for Phase 2 durable workflows

### Uncertainty to track

- **fastmcp standalone vs bundled mcp** — as of March 2026, standalone fastmcp v3.1.0 is ahead of the official mcp SDK. Track whether they converge or diverge.

---

## 3. Architecture

```
Agents (Claude, Codex, OpenClaw)
  |
  v
FastAPI (Python)
  - Auth (authlib, HMAC + API key)
  - Org/agent scoping, rate limiting (limits)
  - REST endpoints + auto-generated OpenAPI spec
  - MCP tools (fastmcp)
  - Structured LLM I/O (instructor + litellm)
  |
  v
Memory Pipeline (custom)
  - instructor + litellm  -> LLM compression to atomic facts
  - EmbeddingProvider      -> Voyage 3.5 / BGE-M3 via Ollama (1024d)
  - Dedup pipeline         -> SHA-256 + vector similarity + LLM decision
  - Hybrid search          -> pgvector cosine + tsvector BM25 + RRF
  - Background enrichment  -> arq worker (Phase 2)
  |
  v
Postgres + pgvector
  - Memory table (embeddings, content, metadata)
  - tsvector column for full-text search
  - HNSW index for vector similarity
  - Existing tables (agents, tasks, etc.)
  |
Redis
  - arq task queue (async memory processing)
  - Rate limiting (limits)
  - Caching (cashews)
```

### Communication flow

```
Store memory:
  Agent -> POST /memory -> FastAPI (auth, scope, rate limit)
    -> LLM compress to atomic facts (instructor + litellm)
    -> 3-layer dedup (SHA-256 -> vector similarity -> LLM decision)
    -> embed via EmbeddingProvider (Voyage 3.5 / BGE-M3)
    -> store in Postgres + pgvector
    -> return memory ID

Search memory:
  Agent -> GET /memory/search?query=... -> FastAPI (auth, scope, visibility filter)
    -> pgvector cosine similarity + tsvector BM25
    -> Reciprocal Rank Fusion to merge rankings
    -> apply confidence, recency weighting, access tracking
    -> return ranked results

Background enrichment (Phase 2):
  arq worker -> prune stale, strengthen co-retrieved, derive new facts
```

---

## 4. Technology Stack

### Type Safety & Code Quality

- pydantic v2
- pyright
- ruff (linting + formatting)

### API & Web

- fastapi
- httpx (async HTTP client)
- python-multipart (file uploads)

### Structured LLM I/O

- instructor (Pydantic-native structured outputs)
- litellm (unified interface to 100+ LLM providers)

### MCP

- fastmcp v3.1.0 standalone (OTel, auth, versioning)

### LLM Provider SDKs

- anthropic
- openai
- voyageai

### Database & Migrations

- sqlalchemy (async, 2.0 style)
- alembic
- asyncpg (Postgres async driver)
- pgvector (SQLAlchemy extension)

### Task Queue & Workers

- arq (Redis-native async)
- redis (redis-py with async support)

### Resilience

- tenacity (retries + backoff)

### Configuration & Secrets

- pydantic-settings (BaseSettings + env var parsing)
- python-dotenv

### Observability & Tracing

- opentelemetry-sdk + opentelemetry-api
- opentelemetry-exporter-otlp
- logfire (FastAPI/Pydantic-native tracing)
- structlog (structured logging)
- langfuse (LLM-specific tracing)

### Testing

- pytest + pytest-asyncio + pytest-cov
- respx (mock httpx calls)
- hypothesis (property-based testing)
- factory-boy (SQLAlchemy model fixtures)

### Security & Auth

- authlib (OAuth2, JWT)
- passlib + bcrypt
- cryptography

### Schema & Contracts

- jsonschema (MCP tool definition validation)
- anyio (async abstraction)

### Caching

- cashews (async-native, Redis-backed)

### Rate Limiting

- limits (Redis-backed)

### Utilities

- pendulum (datetime + timezone handling)
- rich (terminal output, debug logging)
- typer (CLI tooling)

---

## 5. Data Model

### Memory entity

| Column            | Type                             | Notes                                                          |
| ----------------- | -------------------------------- | -------------------------------------------------------------- |
| id                | uuid PK                          |                                                                |
| org_id            | uuid FK                          | Org-scoped                                                     |
| agent_id          | uuid FK                          | Which agent wrote this                                         |
| type              | enum (EPISODIC, SEMANTIC, GRAPH) | Discriminator                                                  |
| content           | text                             | Compressed atomic fact                                         |
| raw_content       | text                             | Original input, up to 8K chars                                 |
| summary           | text, nullable                   | LLM-generated summary                                          |
| embedding         | vector(1024)                     | pgvector, nullable until async embed completes                 |
| content_tsv       | tsvector                         | Full-text search column                                        |
| content_hash      | varchar(64)                      | SHA-256 of compressed content, unique per agent                |
| visibility        | enum (SHARED, PRIVATE, TARGETED) | Default SHARED                                                 |
| target_agent_ids  | uuid[]                           | Only when visibility = TARGETED                                |
| confidence        | smallint                         | 0-100, source-based default                                    |
| strength          | smallint, default 50             | Co-retrieval boosting (memify Phase 2)                         |
| source            | varchar                          | e.g. task_completion, code_change, observation                 |
| access_count      | int, default 0                   | Incremented on retrieval                                       |
| helpful_count     | int, default 0                   | Feedback tracking                                              |
| unhelpful_count   | int, default 0                   | Feedback tracking                                              |
| occurred_at       | timestamptz                      | When the event happened (bi-temporal)                          |
| expires_at        | timestamptz, nullable            | Time-bound memories                                            |
| last_accessed_at  | timestamptz, nullable            | Recency signal                                                 |
| retrieval_context | jsonb, nullable                  | What query triggered last retrieval (future optimization data) |
| metadata          | jsonb                            | Type-specific fields, max 8KB                                  |
| created_at        | timestamptz                      | When stored (bi-temporal)                                      |
| updated_at        | timestamptz                      |                                                                |

### Indexes

- `(org_id, created_at)` — recent memories per org
- `(org_id, agent_id, created_at)` — per-agent timeline
- `(org_id, type)` — filter by memory type
- `(org_id, agent_id, content_hash)` UNIQUE — instant dedup
- HNSW on `embedding` using cosine distance — vector search
- GIN on `content_tsv` — full-text search

### Confidence tiers (source-based defaults)

| Source          | Base Confidence |
| --------------- | --------------- |
| task_completion | 90              |
| code_change     | 85              |
| observation     | 60              |
| inference       | 40              |
| unknown         | 50              |

---

## 6. Memory Pipeline (write path)

```
1. Input arrives (raw_content, up to 8K chars)
2. Rate limit check (10/min, 1000/day, 100K/org) via limits
3. LLM compresses -> atomic facts with resolved references (instructor + litellm)
4. SHA-256 hash each fact
5. If hash exists for this agent -> NOOP (free, instant)
6. If no hash match -> pgvector cosine similarity check at 0.90 threshold
7. If vector match -> LLM decides ADD / UPDATE / NOOP / CONFLICT
   - Uses instructor for typed Pydantic response
   - Uses litellm for provider-agnostic LLM call
   - CONFLICT: keep both, flag contradiction, reduce old confidence
8. Store memory with embedding via EmbeddingProvider + pgvector
9. Set confidence based on source tier
```

### Two-tier resilience

- Fast path: store raw_content immediately, searchable right away
- Async (arq worker): LLM compression + embedding catches up
- If LLM/embedding provider is down, memories still stored and searchable (lower quality)
- tenacity retries on transient failures

---

## 7. Memory Retrieval (read path)

### Hybrid search scoring

```
score = (0.6 * cosine_similarity) + (0.25 * recency_decay) + (0.15 * access_frequency_normalized)
```

- pgvector cosine similarity for semantic matching
- tsvector BM25 for keyword matching
- Reciprocal Rank Fusion to merge both result sets
- Recency decay: exponential decay from last_accessed_at
- Access frequency: normalized access_count

### Visibility enforcement

- SHARED: always returned for org members
- PRIVATE: only returned when requesting agent matches agent_id
- TARGETED: only returned when requesting agent is in target_agent_ids

### On retrieval

- Increment access_count
- Update last_accessed_at
- Store query in retrieval_context (future optimization data)

---

## 8. API Endpoints

### Memory

| Method | Path                  | Purpose                           |
| ------ | --------------------- | --------------------------------- |
| POST   | /memory               | Store a memory                    |
| GET    | /memory/search        | Semantic + keyword hybrid search  |
| GET    | /memory               | List memories with filters        |
| GET    | /memory/{id}          | Get single memory                 |
| POST   | /memory/{id}/feedback | Submit helpful/unhelpful feedback |

### MCP Tools (fastmcp)

| Tool            | Maps to                    |
| --------------- | -------------------------- |
| memory_store    | POST /memory               |
| memory_search   | GET /memory/search         |
| memory_list     | GET /memory                |
| memory_feedback | POST /memory/{id}/feedback |

---

## 9. Embedding Provider Interface

```python
class EmbeddingProvider(Protocol):
    async def embed(self, text: str) -> list[float]: ...
    async def embed_batch(self, texts: list[str]) -> list[list[float]]: ...
    dimensions: int
    model_name: str
```

### Implementations

- VoyageProvider: Voyage 3.5 API, 1024d (cloud default)
- OpenAIProvider: text-embedding-3-large truncated to 1024d (alternative)
- OllamaProvider: BGE-M3 via local Ollama, 1024d (self-hosted default)

Selection via EMBEDDING_PROVIDER env var.

---

## 10. Dashboard — Memory Page

### Layout (3 sections)

1. Memory list/table (top)
   - TanStack Table, columns: agent, type, content, visibility, source, confidence, timestamp
   - Search bar triggers hybrid search, empty shows recent
   - Filter chips for type and agent

2. Memory growth chart (bottom left)
   - Line chart, memory count over time, grouped by type

3. Agent memory breakdown (bottom right)
   - Bar chart showing memory count per agent

### Demo mode

- Memory fixtures in libs/demo-data/
- Works without backend, matching existing demo patterns

---

## 11. Backend Migration (NestJS -> FastAPI)

### What migrates

- All 25+ entities (TypeORM -> SQLAlchemy async 2.0)
- All REST endpoints (NestJS controllers -> FastAPI routers)
- Auth middleware (HMAC + API key -> authlib + passlib)
- Webhook handlers (GitHub, Linear)
- MCP server (Node -> fastmcp Python)

### What changes

- TypeORM -> SQLAlchemy (async, mapped_column, 2.0 style)
- NestJS modules/controllers/services -> FastAPI routers + service functions
- GraphQL resolvers -> deleted (REST-only with OpenAPI)
- NestJS EventEmitter -> Python signals or direct function calls
- pnpm run codegen (GraphQL) -> openapi-typescript codegen
- Migrations: TypeORM -> Alembic (stamp existing schema as baseline)

### What stays the same

- Postgres schema (same tables, same columns, same constraints)
- React frontend (apps/demo, apps/team)
- Nx for frontend builds
- Docker deployment pattern
- All existing REST API contracts (same routes, same request/response shapes)
- Sandbox server (tools/sandbox/) stays Node — routes API traffic to FastAPI

---

## 12. Frontend Type Generation

```
FastAPI Pydantic models
  -> auto-generated openapi.json
  -> openapi-typescript
  -> typed fetch functions in React
  -> TanStack Query hooks
```

Replaces current GraphQL codegen pipeline with same result.

---

## 13. Module Structure

```
apps/api/                     # FastAPI application (Python, managed by uv)
  main.py                     # App entry, middleware, routers
  config.py                   # Settings via pydantic-settings
  auth/                       # Auth middleware (authlib, HMAC verification)
  agents/                     # Agent CRUD + hierarchy
  tasks/                      # Task CRUD + status transitions
  credits/                    # Credit engine (unique business logic)
  messages/                   # Message + channel CRUD
  events/                     # Append-only event log
  memory/                     # Memory endpoints + custom pipeline
    router.py                 # REST endpoints
    service.py                # Business logic (scoping, rate limiting, confidence)
    compression.py            # LLM compression to atomic facts (instructor + litellm)
    dedup.py                  # Hash + vector + LLM dedup pipeline
    search.py                 # Hybrid search (pgvector + tsvector + RRF)
    providers/                # Embedding provider interface + implementations
  integrations/               # GitHub, Linear webhook handlers
  models/                     # SQLAlchemy models (all entities)
  schemas/                    # Pydantic request/response models
  workers/                    # arq workers (async memory processing)

libs/shared-types/            # Keep for frontend enum sharing
```

### Clean boundary rules (for future memory extraction)

- No other module imports from memory/ except via memory service
- Memory service is the only public API
- Memory module does not import other domain modules
- Receives org_id/agent_id as params, never fetches agent entities

---

## 14. Extraction Path (when to separate memory service)

### Signals to extract

| Signal                             | Action                     |
| ---------------------------------- | -------------------------- |
| Memory writes >10x task writes     | Independent scaling needed |
| Memory pipeline becomes bottleneck | Dedicated worker process   |
| Multiple external consumers        | Separate auth/routing      |

### How to extract (mechanical)

1. Create separate FastAPI app for memory
2. Move memory/ module into new app
3. Replace direct imports with httpx client
4. MCP tools switch to HTTP calls
5. Add service-to-service auth
6. Optional: separate Postgres (memory schema -> own server)

Estimated effort: 1-2 days.

---

## 15. Testing Strategy

### Unit tests (pytest + hypothesis)

- Memory service: scoping, rate limiting, confidence assignment
- Dedup logic: hash dedup, vector similarity threshold
- Visibility enforcement
- Retrieval scoring formula

### Integration tests (pytest-asyncio + respx + factory-boy)

- Agent stores memory -> search returns it
- Dedup prevents duplicate storage
- Visibility rules enforced across agents
- Memory pipeline: store -> compress -> embed -> search round-trip
- Migration validation: FastAPI endpoints match NestJS responses

### Load tests

- 50 agents writing memory simultaneously
- Search latency under concurrent writes
- Rate limiting under burst conditions
- pgvector HNSW query performance at 10K, 50K, 100K memories

---

## 16. Phased Rollout

### Phase 1: Foundation (Issues #525-#543)

Track A — API Rewrite:

- #525 FastAPI scaffold + tooling (uv, ruff, pyright, pytest)
- #526 SQLAlchemy models (all 25+ entities)
- #527 Alembic setup (stamp existing schema as baseline)
- #528 Auth middleware (HMAC + API key via authlib)
- #529 Core CRUD endpoints (agents, tasks, credits, messages, events)
- #530 GitHub + Linear integrations
- #531 MCP server (fastmcp v3.1.0)
- #532 Observability (OTel + structlog + logfire + langfuse)
- #533 CI/CD + Docker + sandbox proxy update
- #534 openapi-typescript codegen pipeline
- #535 Frontend: replace GraphQL with REST + TanStack Query

Track B — Memory System (parallel after #526):

- #536 Cognee spike — NO-GO decision, validated custom pipeline path
- #537 Memory entity + pgvector + Alembic migration
- #538 Embedding providers (Voyage 3.5 / OpenAI / Ollama) + LLM compression
- #539 Dedup pipeline (hash + vector + LLM via instructor/litellm)
- #540 Hybrid search (pgvector + tsvector + RRF)
- #541 Memory REST API + MCP tools + rate limiting + confidence
- #542 Dashboard: memory page + demo fixtures
- #543 Integration + load tests

### Phase 2: Intelligence (Issues #544-#547)

- #544 Background enrichment pipeline (arq worker)
- #545 Feedback loop + retrieval optimization
- #546 Contradiction resolution
- #547 Auto-expire time-bound memories

### Phase 3: Knowledge Graph (Issues #548-#550)

- #548 Knowledge graph + visualization (Cytoscape.js)
- #549 Agent File export format (inspired by Letta)
- #550 Cross-agent knowledge overlap analysis

---

## 17. Risks & Mitigations

| Risk                                  | Mitigation                                                                          |
| ------------------------------------- | ----------------------------------------------------------------------------------- |
| Memory explosion                      | Rate limiting (limits) + hash/vector dedup + Phase 2 pruning                        |
| Hallucination poisoning               | Confidence scoring + corroboration boost + contradiction tracking                   |
| LLM provider dependency               | instructor + litellm abstracts providers; tenacity retries; graceful degradation    |
| FastAPI migration breaks clients      | Same REST routes + response shapes, integration tests comparing NestJS vs FastAPI   |
| Embedding provider outage             | Two-tier write (store raw immediately via fast path, embed async via arq)           |
| pgvector perf at scale                | 1024d optimized, HNSW index, separate Postgres option documented                    |
| LLM call failures (dedup/compression) | tenacity retries, graceful degradation (store uncompressed)                         |

---

## 18. Research Sources

Architecture informed by:

- Cognee: evaluated and rejected for Phase 1 (#536 spike — NO-GO). Revisit for Phase 3 knowledge graph
- Supermemory: contradiction handling, auto-forget (#1 on LongMemEval/LoCoMo/ConvoMem)
- Mem0: ADD/UPDATE/DELETE/NOOP consolidation pattern (26% accuracy boost)
- SimpleMem: semantic compression, 30x token savings (arxiv 2601.02553)
- Memsearch/OpenClaw: hybrid search with RRF, content hashing dedup (189K GitHub stars)
- Zep/Graphiti: bi-temporal model (occurred_at vs created_at)
- Letta: Agent File format for serializing agent state
- ALMA: meta-learned memory designs, retrieval optimization (arxiv 2602.07755)
- Voyage 3.5: 8.26% retrieval improvement over OpenAI-v3-large at lower cost
- Supabase: fewer dimensions are better for pgvector performance

---

## 19. Resolved Questions

1. **Memory engine** — Cognee evaluated in spike (#536), NO-GO. Custom pipeline with instructor + litellm + pgvector selected. See `docs/spikes/0536-cognee-findings.md`.
2. **Embedding providers** — Custom EmbeddingProvider protocol with Voyage 3.5, OpenAI, and Ollama implementations. No dependency on Cognee.
3. **Migrations** — Alembic. Stamp existing schema as baseline, all future changes through Alembic.
4. **MCP server** — rewrite in Python using fastmcp standalone v3.1.0.
5. **Sandbox server** — stays Node. Update to proxy API routes to FastAPI.
6. **Frontend build pipeline** — Nx stays for React apps. Python API managed by uv, separate from Nx. CI runs both.

---

## 20. Dependency Graph

```
#536 (Cognee spike — NO-GO) ─────────────────────────┐
                                                      v
#525 (scaffold) -> #526 (models) -> #527 (alembic) -> #537 (memory entity)
                       |                                    |
                       v                                    v
                   #528 (auth)                         #538 (embedding providers)
                       |                                    |
                       v                                    v
                   #529 (endpoints)                    #539 (dedup)
                       |                                    |
                   #530 (integrations)                 #540 (hybrid search)
                   #531 (MCP)                               |
                   #532 (observability)                     v
                       |                              #541 (memory API)
                       v                                    |
                   #533 (CI/CD)                        #542 (dashboard)
                   #534 (codegen)                      #543 (tests)
                       |
                       v
                   #535 (frontend migration)
```
