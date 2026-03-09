# Spike #536: Cognee Assumption Validation — Findings

**Date:** 2026-03-06
**Status:** Complete
**Recommendation:** NO-GO on Cognee as primary engine. GO on custom pipeline.

---

## Executive Summary

Cognee is a capable knowledge graph + memory framework, but it is too opinionated for OpenSpawn's needs. It manages its own data layer, lacks hybrid search (vector + BM25 + RRF), and provides only basic hash dedup. Our RFC requires fine-grained control over schema, search, and dedup that Cognee cannot provide without fighting its abstractions.

**Decision: Build custom pipeline with `instructor` + `litellm` + `pgvector`.**

---

## Questions & Findings

### 1. Custom embedding providers (Voyage 3.5, BGE-M3 via Ollama)?

**PARTIAL** — Cognee supports custom embedding providers via env vars:

- `EMBEDDING_PROVIDER` — supports `ollama`, `openai`, `azure`
- `EMBEDDING_MODEL` — model name
- `EMBEDDING_ENDPOINT` — custom endpoint URL
- `EMBEDDING_API_KEY` — API key

BGE-M3 via Ollama: natively supported (`EMBEDDING_PROVIDER=ollama`).
Voyage 3.5: would need OpenAI-compatible wrapper or custom provider class.

**Gap:** No direct Voyage provider. Embedding dimensions appear model-determined, not configurable at Cognee level. Our RFC needs 1024d consistently.

### 2. Dataset concept for org/agent scoping?

**PASS** — Cognee datasets are named collections. You can use arbitrary names like `org:{uuid}:agent:{uuid}`. Both `cognee.add(dataset_name=...)` and `cognee.search(datasets=[...])` support this. Dataset CRUD API is comprehensive.

### 3. pgvector native support?

**PASS** — `VECTOR_DB_PROVIDER=pgvector` with `cognee[postgres]` extra. Uses same Postgres instance. Also supports lancedb (default), qdrant, weaviate, chromadb.

### 4. Latency of add() + cognify() for ~500 chars?

**NEEDS EMPIRICAL TESTING** — `cognee.add()` is fast (file/text ingestion). `cognee.cognify()` triggers LLM calls for entity extraction, relationship building, and embedding — expected 2-8s for short text depending on LLM provider. Background mode available via `run_in_background=True`.

**Note:** Our two-tier resilience design (store raw immediately, process async) handles this regardless of engine choice.

### 5. Dedup behavior controllable?

**PARTIAL** — Cognee has `content_hash` on data models for basic hash dedup. However:

- No vector similarity dedup (our RFC needs 0.90 threshold check)
- No LLM-based ADD/UPDATE/NOOP/CONFLICT decision
- No configurable dedup pipeline

**Gap:** Our RFC requires 3-layer dedup (SHA-256 hash -> vector similarity -> LLM decision). Cognee only provides layer 1.

### 6. Hybrid search (vector + full-text)?

**FAIL** — Cognee search types:

- `GRAPH_COMPLETION` — graph-traversal + LLM completion
- `RAG_COMPLETION` — vector retrieval + LLM completion
- `CHUNKS` — raw vector similarity
- `SUMMARIES` — pre-generated summaries
- `FEELING_LUCKY` — auto-select

**No hybrid vector + BM25 + Reciprocal Rank Fusion.** This is a hard requirement from our RFC (validated by OpenClaw at ~84% precision vs ~62% vector-only). Must build ourselves.

### 7. Coexist with existing Postgres tables?

**PASS** — Cognee supports `DB_PROVIDER=postgres` with configurable connection params. Creates its own tables. Can share Postgres server; recommend separate `DB_NAME` to avoid table conflicts.

---

## Critical Gaps

| Gap                                       | Severity   | Impact                                                 |
| ----------------------------------------- | ---------- | ------------------------------------------------------ |
| No hybrid search (vector + BM25 + RRF)    | **HIGH**   | Core search quality requirement unmet                  |
| Basic dedup only (hash, no vector/LLM)    | **HIGH**   | Must build 3-layer dedup regardless                    |
| Own data layer (tables, schema, graph DB) | **MEDIUM** | Conflicts with our custom Memory schema (20+ columns)  |
| No direct Voyage 3.5 provider             | **LOW**    | Solvable with wrapper, but adds complexity             |
| Graph DB dependency (kuzu/neo4j)          | **MEDIUM** | Extra infra for Phase 1; not needed until Phase 3      |
| Embedding dimensions not configurable     | **LOW**    | Model-determined; manageable with correct model choice |

---

## Recommendation

### NO-GO on Cognee as primary engine

Cognee adds value for knowledge graph construction (Phase 3) but creates friction for Phase 1:

1. **Search mismatch** — We need hybrid vector+BM25+RRF. Cognee has graph-based and vector-only search. Building RRF on top of Cognee means bypassing its search entirely.
2. **Schema ownership** — Our Memory table has 20+ purpose-built columns (confidence, strength, visibility, access tracking, bi-temporal timestamps). Cognee manages its own schema. Running both means data duplication.
3. **Dedup mismatch** — Our 3-layer dedup (hash -> vector similarity -> LLM decision) is a core differentiator. Cognee's hash-only dedup means we build this anyway.

### GO on custom pipeline

Build with `instructor` + `litellm` + `pgvector` as the RFC's fallback path:

| Component          | Tool                           | Why                                    |
| ------------------ | ------------------------------ | -------------------------------------- |
| Structured LLM I/O | instructor + litellm           | Pydantic-native, provider-agnostic     |
| Embeddings         | Voyage 3.5 / BGE-M3 via Ollama | Direct SDK, 1024d native               |
| Vector storage     | pgvector (SQLAlchemy)          | Already in our stack, no new infra     |
| Full-text search   | PostgreSQL tsvector            | Already in our stack                   |
| Hybrid ranking     | Custom RRF implementation      | ~50 lines of Python                    |
| Dedup              | Custom 3-layer pipeline        | SHA-256 + pgvector cosine + instructor |
| Compression        | instructor + litellm           | Atomic fact extraction                 |

### Revisit Cognee for Phase 3

When we build the knowledge graph (#548-#550), Cognee's `cognify()` entity/relationship extraction and graph construction become valuable. At that point, evaluate using Cognee as a **graph enrichment layer** alongside our custom memory pipeline.

---

## Spike Script

Runnable validation script at `apps/api/spikes/cognee_spike.py`. Install cognee to run empirical tests:

```bash
cd apps/api
uv add "cognee[postgres]"
uv run python spikes/cognee_spike.py
```

---

## Impact on Downstream Issues

| Issue                         | Impact                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| #537 Memory entity + pgvector | No change — build with SQLAlchemy + pgvector directly                                 |
| #538 Cognee integration       | **Rescoped** — becomes "Embedding providers + LLM compression" (instructor + litellm) |
| #539 Dedup pipeline           | No change — always planned as custom (hash + vector + LLM)                            |
| #540 Hybrid search            | No change — always planned as custom (pgvector + tsvector + RRF)                      |
| #541-#543                     | No change                                                                             |
