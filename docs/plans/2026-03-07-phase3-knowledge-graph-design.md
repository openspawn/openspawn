# Phase 3: Knowledge Graph — Design Document

> Approved design for issues #548, #549, #550. Implementation plan to follow.

---

## Overview

The knowledge graph is the organizational brain of OpenSpawn. As agents learn through tasks, observations, and interactions, they push knowledge to OpenSpawn's memory API. OpenSpawn extracts entities and relationships, building a shared graph that enables cross-agent knowledge discovery, gap analysis, and agent file portability.

**Target deployment:** Mac Mini (16-48GB RAM) running 4-32 OpenClaw instances, or VPS (2GB+ RAM) for smaller setups.

**Issues:**

- #548: Knowledge graph + visualization
- #549: Agent File export/import
- #550: Cross-agent knowledge overlap analysis

---

## Data Model

Three new Postgres tables. No external graph DB required — Postgres adjacency tables with pgvector embeddings.

### graph_entities

| Column        | Type         | Notes                                                         |
| ------------- | ------------ | ------------------------------------------------------------- |
| id            | UUID         | PK                                                            |
| org_id        | UUID         | FK → organizations                                            |
| name          | VARCHAR(255) | Indexed, case-insensitive                                     |
| entity_type   | VARCHAR(50)  | Enum: person, tool, concept, process, system, location, event |
| description   | TEXT         | LLM-generated summary                                         |
| embedding     | VECTOR(1024) | For semantic dedup                                            |
| mention_count | INT          | Incremented on each new memory link                           |
| confidence    | FLOAT        | Weighted avg of linked memory confidences                     |
| last_seen_at  | TIMESTAMPTZ  | Updated on new memory link                                    |
| metadata      | JSONB        | Extensible                                                    |
| created_at    | TIMESTAMPTZ  |                                                               |

**Indexes:** `(org_id, name, entity_type)` unique, `embedding` ivfflat/hnsw, `(org_id, entity_type)`, `(org_id, mention_count DESC)`.

### graph_relationships

| Column            | Type         | Notes                                          |
| ----------------- | ------------ | ---------------------------------------------- |
| id                | UUID         | PK                                             |
| org_id            | UUID         | FK → organizations                             |
| source_entity_id  | UUID         | FK → graph_entities                            |
| target_entity_id  | UUID         | FK → graph_entities                            |
| relationship_type | VARCHAR(100) | Free-form, LLM-generated, normalized lowercase |
| weight            | FLOAT        | Base weight, subject to decay                  |
| last_seen_at      | TIMESTAMPTZ  | For decay calculation                          |
| evidence_count    | INT          | Number of supporting memories                  |
| metadata          | JSONB        |                                                |
| created_at        | TIMESTAMPTZ  |                                                |

**Indexes:** `(source_entity_id)`, `(target_entity_id)`, `(org_id, relationship_type)`.

### memory_entity_links

| Column     | Type        | Notes                                |
| ---------- | ----------- | ------------------------------------ |
| memory_id  | UUID        | FK → memories                        |
| entity_id  | UUID        | FK → graph_entities                  |
| agent_id   | UUID        | FK → agents (who surfaced this link) |
| created_at | TIMESTAMPTZ |                                      |

**Indexes:** `(memory_id)`, `(entity_id)`, `(agent_id, entity_id)`.

---

## Entity Extraction Pipeline

### Flow

1. Agent stores memory via `POST /memory/store`
2. Sync path: memory saved immediately (existing behavior)
3. Async path: arq worker picks up the memory, calls LLM to extract entities + relationships
4. Extracted entities are deduped against existing org entities (embedding cosine similarity >= 0.90)
5. New `memory_entity_links` rows connect memory to entities
6. Entity `mention_count`, `confidence`, `last_seen_at` updated
7. Relationships upserted with evidence count incremented

### LLM Extraction

Same `instructor` + `litellm` pattern as compression/dedup. Pydantic models define structured output:

```python
class ExtractedEntity(BaseModel):
    name: str
    entity_type: str  # person, tool, concept, process, system, location, event
    description: str
    confidence: float  # 0-1, derived from language signals ("maybe" = lower)

class ExtractedRelationship(BaseModel):
    source: str  # entity name
    target: str  # entity name
    relationship_type: str  # free-form, e.g. "uses", "depends_on", "created_by"
    weight: float  # 0-1

class ExtractionResult(BaseModel):
    entities: list[ExtractedEntity]
    relationships: list[ExtractedRelationship]
```

### Entity Dedup

Three-layer dedup (mirrors memory dedup pattern):

1. Exact name match (case-insensitive) within same org + entity_type
2. Embedding cosine similarity >= 0.90 within same org
3. Periodic `merge_entities` arq job for deferred dedup

### Integration with Enrichment Worker

Replaces the `derive_facts` stub in `enrichment.py`. New jobs:

- `extract_entities`: runs on each new memory (replaces `derive_facts`)
- `merge_entities`: periodic dedup sweep (new cron, daily)

### Cost Control

- Use Claude Haiku (fast, cheap)
- Extraction configurable per org (can disable)
- Runs async via arq — never blocks memory storage
- ~1000 calls/day at 100 agents x 10 memories/day

### Hallucination Risk

Entities extracted from low-confidence or hallucinated memories can pollute the graph. Mitigations:

- **Confidence propagation:** entity confidence = weighted average of linked memory confidences. An entity backed only by low-confidence inferences scores low.
- **Minimum confidence threshold:** entities with confidence < 20 are excluded from org-wide graph queries and visualization (still queryable via direct lookup).
- **Evidence count signal:** entities with `mention_count == 1` from a single low-confidence memory are flagged as unverified in the UI.

---

## Privacy & Visibility

**Rule: respect memory visibility boundaries.**

- Private memory entities: only in that agent's subgraph
- Shared memory entities: appear in org-wide graph
- Targeted memory entities: visible to sender + target agents
- An agent promotes knowledge by storing a shared memory about the same topic

Consistent with existing memory visibility model. No surprising privacy leaks.

---

## Temporal Aspects & Decay

- **Entities:** `last_seen_at` updated on each new memory link
- **Relationships:** `weight` decays with exponential formula (half-life 30 days), same as memory search recency
- **Reinforcement:** weight resets when new evidence memory links to both endpoints
- **Entity confidence:** weighted average of linked memory confidences, recomputed on link/unlink

---

## GraphStore Protocol

Pluggable storage backend, like `EmbeddingProvider`. Default: Postgres. Future: Neo4j, etc.

**Module location:** `app/memory/graph/` — inside the memory module, respecting clean boundary rules (no other module imports from memory/ except via memory service).

```python
class GraphStore(Protocol):
    # Entity CRUD
    async def upsert_entity(self, org_id, name, entity_type, description, embedding, metadata) -> UUID
    async def get_entity(self, entity_id) -> GraphEntity | None
    async def find_entity(self, org_id, name, entity_type) -> GraphEntity | None
    async def find_similar_entity(self, org_id, embedding, threshold=0.90) -> GraphEntity | None
    async def list_entities(self, org_id, entity_type=None, limit=100) -> list[GraphEntity]
    async def merge_entities(self, keep_id, merge_id) -> GraphEntity

    # Relationship CRUD
    async def upsert_relationship(self, org_id, source_id, target_id, rel_type, weight, evidence_memory_ids) -> UUID
    async def get_relationships(self, entity_id, direction="both") -> list[GraphRelationship]

    # Linking
    async def link_memory_entity(self, memory_id, entity_id, agent_id) -> None

    # Queries
    async def get_neighbors(self, entity_id, hops=1) -> SubGraph
    async def get_agent_entities(self, org_id, agent_id) -> list[GraphEntity]
    async def get_entity_agents(self, entity_id) -> list[UUID]
    async def compute_overlap(self, org_id, agent_a, agent_b) -> OverlapResult
    async def find_gaps(self, org_id) -> list[GapResult]

    # Export
    async def export_agent_subgraph(self, org_id, agent_id) -> SubGraph
    async def export_org_graph(self, org_id) -> SubGraph
```

---

## API Endpoints

```
# Entities
GET    /memory/graph/entities?type=...&limit=100         # list entities
GET    /memory/graph/entities/{id}                        # entity detail
GET    /memory/graph/entities/{id}/memories               # memories linked to entity
GET    /memory/graph/entities/{id}/agents                 # agents who know this entity
GET    /memory/graph/entities/{id}/neighbors?hops=1       # graph traversal

# Relationships
GET    /memory/graph/relationships?entity_id=...          # relationships for entity

# Analysis
GET    /memory/graph/overlap?agent_a=...&agent_b=...      # pairwise overlap (Jaccard)
GET    /memory/graph/overlap/matrix                       # full org overlap matrix
GET    /memory/graph/gaps                                 # knowledge gaps

# Visualization
GET    /memory/graph/cytoscape?limit=500                  # Cytoscape.js formatted data

# Agent File
POST   /memory/agent-file/export/{agent_id}               # export agent file
POST   /memory/agent-file/import                          # import agent file
```

---

## Agent File Export/Import (#549)

### Export Format (JSON)

```json
{
  "version": "1.0",
  "exported_at": "2026-03-07T12:00:00Z",
  "agent": {
    "name": "agent-alpha",
    "role": "researcher",
    "level": 3,
    "capabilities": [{ "skill": "python", "proficiency": 8 }]
  },
  "memories": [
    {
      "content": "compressed atomic facts...",
      "metadata": {},
      "confidence": 85,
      "source": "task_completion",
      "visibility": "shared",
      "created_at": "2026-03-01T10:00:00Z"
    }
  ],
  "entities": [{ "name": "Docker", "type": "tool", "description": "..." }],
  "relationships": [
    { "source": "Docker", "target": "CI pipeline", "type": "used_by", "weight": 0.8 }
  ]
}
```

**Included:** compressed content, metadata, confidence, source, visibility, entity/relationship subgraph, agent metadata, format version.

**Excluded:** raw embeddings (re-embed on import), private memories of other agents.

**Import:** entity dedup against existing org entities. Optionally create new agent or import into existing. Validate format version.

---

## Cross-Agent Overlap (#550)

### Overlap Metric

Jaccard similarity: `|shared_entities| / |union_entities|` per agent pair. Range 0-1.

### Gap Detection

- **Single point of failure:** entities known by only 1 agent
- **Blind spots:** entity types with zero coverage in the org
- **Low confidence areas:** entity types where avg confidence < threshold

### Dashboard Visualization

- Agent-to-agent overlap heatmap matrix
- Knowledge coverage grid (entity types x agents)
- Gap alerts for critical single-agent-only knowledge

### Knowledge Sharing Suggestions

Deferred to later phase. Start with visibility into gaps, not automated routing.

---

## MCP Tools

Four new tools for agents:

| Tool                     | Purpose                            |
| ------------------------ | ---------------------------------- |
| `memory_graph_entities`  | List entities the agent knows      |
| `memory_graph_related`   | Find entities related to a concept |
| `memory_graph_who_knows` | Which agents know about entity X   |
| `memory_graph_gaps`      | Org knowledge gaps                 |

---

## Dashboard: Graph Visualization + Unfinished Phase 2 Panels

**Library:** Cytoscape.js

### Graph Page (new)

- Nodes = entities (colored by type, sized by mention_count)
- Edges = relationships (weighted by strength, labeled by type)
- Filters: agent, entity type, time range
- Click node: show related memories + which agents know about it
- Click edge: show evidence memories
- Search within graph (find entity by name)
- Layout: force-directed default
- Top N entities by mention_count shown; filter/search to drill down

### Memory Page Additions (unfinished Phase 2 frontend)

These were designed in Phase 2 but only the backend was implemented. Ship with Phase 3:

- **Feedback buttons** on memory search results (helpful/unhelpful) — wired to `POST /memory/{id}/feedback`
- **Contradictions panel** showing linked contradiction pairs — wired to `GET /memory/contradictions` + `POST /memory/contradictions/{id}/resolve`

---

## Demo Mode

Add graph fixtures to `libs/demo-data/`:

- ~20 entities derived from the 12 existing fixture memories
- ~15 relationships connecting them
- Pre-formatted Cytoscape.js data for dashboard

---

## Migrations

New Alembic migrations:

- `graph_entities` table + pgvector index + composite indexes
- `graph_relationships` table + FK indexes
- `memory_entity_links` table + FK indexes

---

## Testing

### Unit Tests

- GraphStore CRUD operations (upsert, find, merge entities)
- Entity dedup logic (exact match, embedding similarity threshold)
- Confidence propagation calculation
- Overlap scoring (Jaccard similarity)
- Gap detection logic
- Agent File serialization/deserialization + format validation

### Integration Tests

- Store memory → extraction → entity appears in graph
- Entity dedup across multiple memories from different agents
- Visibility enforcement (private memory entities excluded from org graph)
- Agent File export → import round-trip preserves data
- Overlap matrix computation across 3+ agents

### Load Tests

- 50 concurrent memory stores triggering 50 concurrent entity extractions
- Graph query latency at 10K, 50K, 100K entities
- Cytoscape.js endpoint response time with 500-node limit
- Overlap matrix computation at 20+ agents

---

## Decisions Summary

| Decision                  | Choice                                      | Reasoning                                                                                                  |
| ------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Graph storage             | Postgres adjacency tables                   | Zero additional RAM, works everywhere, pgvector already available                                          |
| Pluggable backend         | GraphStore protocol                         | Same pattern as EmbeddingProvider, future Neo4j optional                                                   |
| Entity types              | Fixed enum (7 types)                        | Simple, sufficient for v1, extensible via metadata later                                                   |
| Relationship types        | Free-form LLM-generated                     | Too many valid types to enumerate; normalize to lowercase                                                  |
| Entity dedup              | Embedding similarity >= 0.90                | Same proven pattern as memory vector dedup                                                                 |
| Overlap metric            | Jaccard similarity                          | Simple, interpretable, 0-1 range                                                                           |
| Agent File embeddings     | Exclude, re-embed on import                 | Too large, provider may differ                                                                             |
| Private entity visibility | Agent-only subgraph                         | Respect existing visibility model                                                                          |
| Graph-enhanced search     | Phase 4                                     | Avoid coupling complexity now                                                                              |
| Extraction frequency      | Every memory, async                         | arq worker pattern handles it cleanly                                                                      |
| Dashboard layout          | Force-directed default                      | Most intuitive for knowledge graphs                                                                        |
| Extraction model          | Claude Haiku                                | Fast, cheap, sufficient for structured extraction                                                          |
| Graph module location     | `app/memory/graph/`                         | Respects clean boundary rules from RFC                                                                     |
| Cognee for extraction     | No — custom instructor + litellm            | Matches existing patterns, full control over entity types/confidence (closes RFC "revisit" recommendation) |
| Hallucination mitigation  | Confidence propagation + min threshold (20) | Low-confidence entities excluded from org-wide views                                                       |
