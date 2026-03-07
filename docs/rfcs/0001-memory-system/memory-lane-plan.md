# Memory System Plan — Lane 2

## Context

OpenSpawn is adding shared long-term memory powered by Cognee. Full design: `docs/rfcs/0001-memory-system/README.md`. Epic: #519.

## Dependency

**#536 (Cognee spike) can start immediately — no dependencies.**

Issues #537-#543 depend on #526 (SQLAlchemy models) from the API rewrite lane. Wait for that PR to merge before starting #537. You can work on the spike while waiting.

## Issue Order

### 1. #536 — Cognee spike (START IMMEDIATELY)

2-hour investigation. Answer these questions with working code:

```python
import cognee
```

Questions:
- Can Cognee use custom embedding providers (Voyage 3.5, BGE-M3 via Ollama)?
- Does `dataset` support org/agent scoping (e.g. `dataset="org:{uuid}:agent:{uuid}"`)?
- Does Cognee use pgvector natively or require Qdrant/Weaviate/ChromaDB?
- What's the latency of `cognee.add()` + `cognee.cognify()` for ~500 char text?
- Can we control dedup behavior or does Cognee have its own?
- Does `cognee.search()` support hybrid search (vector + full-text)?
- Can Cognee run against an existing Postgres with other tables?

**Deliverable:** Written findings in `docs/rfcs/0001-memory-system/cognee-spike-results.md` with go/no-go.

**If Cognee doesn't fit:** Fallback is custom pipeline with `instructor` + `litellm` + `pgvector` SQLAlchemy extension. Design doc Section 3 documents this fallback.

### 2. #537 — Memory entity + pgvector (WAIT FOR #526)

Create Memory SQLAlchemy model in the FastAPI app (from Lane 1).

Schema (from design doc Section 5):
- id, org_id, agent_id, type, content, raw_content, summary
- embedding vector(1024), content_tsv tsvector, content_hash varchar(64)
- visibility, target_agent_ids, confidence, strength, source
- access_count, helpful_count, unhelpful_count
- occurred_at, expires_at, last_accessed_at, retrieval_context, metadata
- created_at, updated_at

Indexes:
- (org_id, created_at), (org_id, agent_id, created_at), (org_id, type)
- (org_id, agent_id, content_hash) UNIQUE
- HNSW on embedding (cosine)
- GIN on content_tsv

Alembic migration to enable pgvector extension + create table.

Libraries: `pgvector` (SQLAlchemy extension)

### 3. #538 — Cognee integration + embedding providers

Wire up Cognee (or fallback pipeline) based on spike results.

Embedding provider interface:
```python
class EmbeddingProvider(Protocol):
    async def embed(self, text: str) -> list[float]: ...
    async def embed_batch(self, texts: list[str]) -> list[list[float]]: ...
    dimensions: int
    model_name: str
```

Implementations:
- VoyageProvider (Voyage 3.5, 1024d, cloud default)
- OpenAIProvider (text-embedding-3-large @ 1024d)
- OllamaProvider (BGE-M3, 1024d, self-hosted)

EMBEDDING_PROVIDER env var for selection.

Two-tier write: store raw immediately, Cognee/pipeline processes async.

Libraries: `cognee`, `voyageai`, `openai`, `instructor`, `litellm`

### 4. #539 — Dedup pipeline

Layered dedup on write:
1. LLM compresses raw_content -> atomic facts (instructor + litellm)
2. SHA-256 hash each fact
3. Hash exists for agent -> NOOP (instant, free)
4. No hash match -> vector similarity at 0.90 threshold
5. Vector match -> LLM decides ADD/UPDATE/NOOP/CONFLICT (instructor for typed output)
6. CONFLICT: keep both, reduce old confidence

Libraries: `instructor`, `litellm`, `tenacity`

### 5. #540 — Hybrid search

pgvector cosine + tsvector BM25 + Reciprocal Rank Fusion.

Scoring: `score = (0.6 * cosine) + (0.25 * recency_decay) + (0.15 * access_freq)`

- Postgres trigger to keep content_tsv updated
- Visibility enforcement (SHARED/PRIVATE/TARGETED)
- On retrieval: increment access_count, update last_accessed_at, store retrieval_context

### 6. #541 — Memory REST API + MCP tools + rate limiting + confidence

Endpoints:
- POST /memory
- GET /memory/search
- GET /memory
- GET /memory/{id}
- POST /memory/{id}/feedback

MCP tools (wire to fastmcp from Lane 1 #531):
- memory_store, memory_search, memory_list, memory_feedback

Rate limiting (limits, Redis-backed):
- 10/min per agent, 1000/day per agent, 100K per org
- Configurable per org via org metadata

Confidence: source-based defaults (task_completion=90, code_change=85, observation=60, inference=40, unknown=50). Corroboration boost on cross-agent near-matches.

### 7. #542 — Dashboard memory page

New page: `apps/demo/src/pages/memory.tsx`
- TanStack Table: agent, type, content, visibility, source, confidence, timestamp
- Search bar (hybrid search), filter chips (type, agent)
- Memory growth line chart (bottom left)
- Agent memory breakdown bar chart (bottom right)
- Demo mode fixtures in `libs/demo-data/src/fixtures/memories.ts`
- Add route + nav link

### 8. #543 — Integration + load tests

- Store -> search round-trip
- Dedup: exact + near-duplicate
- Visibility enforcement
- Rate limiting
- Hybrid search: keyword + semantic
- Load: 50 concurrent agents, pgvector perf at 10K/50K/100K memories

Libraries: `pytest`, `pytest-asyncio`, `respx`, `factory-boy`, `hypothesis`

## Libraries (memory-specific, beyond Lane 1)

```
cognee
voyageai
pgvector  # SQLAlchemy extension
instructor
litellm
```

## Conventions

Same as Lane 1:
- Scoped conventional commits: `feat(memory): ...`
- One PR per issue
- `ruff format .` and `ruff check .` before finishing
- No `Any` types
- Python string enums
