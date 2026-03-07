# Phase 3: Knowledge Graph — Design Notes

> Working document. Not a final plan — raw notes + analysis before design decisions.

---

## Context

OpenSpawn is a multi-agent coordination platform. Agents form organizational hierarchies (L1-L10), get tasks, earn credits, communicate. The knowledge graph is FOUNDATIONAL — it's the organizational brain that knows what all agents know collectively.

**Deployment target:** Mac Mini (16-48GB RAM) running 4-32 OpenClaw instances orchestrated by OpenSpawn. Also VPS deployments (2GB+ RAM) for smaller setups.

**Architecture:** Push-based. Agents call OpenSpawn's memory API as they learn. OpenSpawn extracts entities/relationships and builds the org knowledge graph.

**Graph storage:** Postgres adjacency tables (default). GraphStore protocol for future Neo4j/etc backends.

**Issues:**
- #548: Knowledge graph + visualization
- #549: Agent File export format
- #550: Cross-agent knowledge overlap analysis

---

## What Exists Today

### Memory System (Phase 1-2, complete)
- Memory model: content, raw_content, embedding(1024d), confidence, strength, source, visibility
- 3-layer dedup: hash → vector(0.90) → LLM decision (ADD/UPDATE/NOOP/CONFLICT)
- Hybrid search: pgvector cosine + tsvector BM25 + RRF fusion
- Scoring: 0.50 vector + 0.20 recency + 0.15 access + 0.15 helpfulness
- Compression: raw content → atomic facts via instructor/litellm
- Contradiction resolution: metadata-based linking, 4 strategies
- TTL/expiry: soft-delete via metadata.expired
- Enrichment workers: arq/Redis cron jobs (boost_co_retrieved, identify_stale, derive_facts stub, expire_memories)
- Embedding providers: Voyage 3.5 / OpenAI / Ollama (pluggable via EmbeddingProvider protocol)
- Rate limiting: 10/min, 1000/day per agent; 100K/org
- Visibility: shared / private / targeted

### Existing Enums
- MemoryType: EPISODIC, SEMANTIC, GRAPH (reserved for Phase 3)
- MemorySource: TASK_COMPLETION, CODE_CHANGE, OBSERVATION, INFERENCE, UNKNOWN

### Agent Model
- Agents have: id, name, level(1-10), role, status, trustScore, model, mode, teamId, parentId
- Agent capabilities: skills with proficiency levels
- Hierarchical: parent-child relationships, teams

### Dashboard
- Memory page exists with search, filters, stats, source distribution
- Demo mode with 12 fixture memories

---

## Phase 3 Requirements — Raw List

### #548: Knowledge Graph + Visualization

**Entity Extraction Pipeline:**
- When a memory is stored, extract entities (people, tools, concepts, processes, systems)
- Extract relationships between entities
- LLM-based extraction via instructor/litellm (same pattern as compression/dedup)
- Should run async (arq worker) to not block memory storage
- Need entity deduplication (same concept from different agents/memories)

**Entity Dedup:**
- Exact name match (case-insensitive)
- Semantic similarity via embedding (e.g., "CI pipeline" vs "continuous integration pipeline")
- LLM decision for ambiguous cases (same as memory dedup pattern)
- Merge entities when discovered to be the same thing

**Graph Queries Needed:**
- Get all entities for an org (nodes for visualization)
- Get all relationships for an org (edges for visualization)
- Get entity neighbors (1-2 hops)
- Get entity by name/type
- Get entities for a specific agent
- Get memories linked to an entity
- Get agents who know about an entity

**Visualization (Cytoscape.js on dashboard):**
- Nodes = entities (colored by type, sized by mention_count)
- Edges = relationships (weighted by strength, labeled by type)
- Filter by: agent, entity type, time range
- Click node → show related memories + which agents know about it
- Click edge → show evidence memories
- Search within graph (find entity by name)
- Zoom, pan, layout algorithms (force-directed, hierarchical)

### #549: Agent File Export

**Export Format:**
- JSON (or YAML) containing:
  - Agent metadata (name, role, level, capabilities)
  - All memories for that agent (content, metadata, confidence, source, timestamps)
  - Entity/relationship subgraph for that agent
  - Settings/preferences if any
- Version field for format evolution
- VCS-friendly (deterministic key ordering, stable serialization)
- Should be importable to restore agent memory state

**Import:**
- Upload Agent File → create memories + entities + relationships
- Handle entity dedup on import (merge with existing org entities)
- Optionally create agent or import into existing agent
- Validate format version, handle migrations

**Questions:**
- Do we include raw_content or just compressed content?
- Do we include embeddings (large!) or re-embed on import?
- What about private memories — export them? Redact them?
- File size limits?

### #550: Cross-Agent Knowledge Overlap

**Overlap Scoring:**
- For each pair of agents, count shared entities
- Normalize by total entities per agent (Jaccard similarity? Cosine?)
- Score range 0-1 (0 = no overlap, 1 = identical knowledge)

**Knowledge Gap Detection:**
- Entities known by only 1 agent (single point of failure)
- Entity types with no coverage (e.g., no agent knows about "security")
- Topics where team has low confidence

**Knowledge Sharing Suggestions:**
- "Agent A knows about X, Agent B needs X for their current task"
- Based on task assignments + entity coverage
- Could feed into task routing ("assign this to Agent C, they have the most relevant knowledge")

**Dashboard Visualization:**
- Agent-to-agent overlap matrix (heatmap)
- Or Venn diagram style for 2-3 agents
- Knowledge coverage map (entity types vs agents)
- Gap alerts (critical topics with no/single agent coverage)

---

## Things We Might Be Missing

### 1. Confidence Propagation
If a memory has confidence=40 (inference), should entities extracted from it inherit that confidence? An entity mentioned in 5 high-confidence memories should be "more real" than one from a single low-confidence memory.

**Proposal:** Entity confidence = weighted average of linked memory confidences.

### 2. Temporal Aspects
Entities and relationships change over time. "Agent A uses Python" might become stale. The graph should reflect recency.

**Proposal:** `last_seen_at` on entities/relationships. Decay weight in overlap scoring based on recency.

### 3. Visibility / Privacy
If a memory is PRIVATE, should its entities appear in the org-wide graph? If Agent A privately learned about a security vulnerability, should that entity be visible to other agents?

**Options:**
- a) Private memory entities are visible in org graph (knowledge exists, source is hidden)
- b) Private memory entities are only in that agent's subgraph
- c) Private memory entities contribute to aggregate stats but not individual visibility

**Recommendation:** Option (b) — respect visibility. Private knowledge stays private. The agent can choose to share by storing a SHARED memory about the same topic.

### 4. Entity Merging
Two agents might surface "CI/CD pipeline" and "continuous integration" as separate entities. We need a merge mechanism.

**Proposal:** Embedding-based similarity check during extraction. If >0.90 cosine similarity to existing entity in same org, merge. Same pattern as memory vector dedup.

### 5. Relationship Weight Decay
Relationships should weaken if not reinforced by new evidence. A relationship from 6 months ago with no new supporting memories is less relevant.

**Proposal:** Weight = base_weight * recency_factor. Recency factor uses same exponential decay as memory search (half-life 30 days). Reinforced when new evidence memory is linked.

### 6. Graph-Enhanced Search
Currently search is pure vector+BM25+RRF over memories. Could we use the graph to enhance results?

**Example:** Search for "deployment" → find "deployment" entity → find related entities ("CI pipeline", "Docker", "Caddy") → boost memories connected to those entities.

**Proposal:** Phase 4. Don't couple graph into search yet. Keep them independent.

### 7. Agent Capability Matching via Graph
The existing `agent_capabilities` table has skills with proficiency levels. The knowledge graph adds a richer signal — which agent has ACTUALLY worked with a concept, not just what they're configured to do.

**Proposal:** Expose via API: "which agents have knowledge about entity X?" This is a simple JOIN. Task routing can use this later.

### 8. MCP Tools for Graph
Agents interact via MCP. What graph tools should they have?

**Candidates:**
- `memory_graph_entities` — list entities the agent knows about
- `memory_graph_related` — find entities related to a concept
- `memory_graph_who_knows` — which other agents know about X
- `memory_graph_gaps` — what knowledge gaps exist in the org

### 9. Demo Mode
The dashboard works in demo mode (no backend). Need graph fixtures.

**Proposal:** Add demo entities + relationships to libs/demo-data. Generate a small but realistic graph from the 12 existing fixture memories.

### 10. Extraction Prompt Engineering
The LLM extraction prompt is critical. Need to extract:
- Named entities with types
- Relationships with labels
- Temporal context ("as of March 2026")
- Confidence signals ("maybe", "I think" → lower confidence)

**Proposal:** Use instructor structured output (same as compression/dedup). Define Pydantic models for extraction response.

### 11. Extraction Cost
Every memory storage triggers LLM extraction. At 100 agents × 10 memories/day = 1000 LLM calls/day for extraction alone. Plus compression + dedup.

**Proposal:** Use Claude Haiku (fast, cheap). Batch where possible. Make extraction optional (configurable per org). Run async via arq worker.

### 12. Graph Size Management
At 100K memories with ~5 entities each = 500K entities. With dedup, maybe 50K-100K unique entities. That's manageable for Postgres but the visualization needs to be smart about what it shows.

**Proposal:** Dashboard shows top N entities by mention_count. Filter/search to drill down. Don't render 100K nodes.

### 13. Alembic Migrations
New tables need Alembic migrations. Need to handle:
- graph_entities table + indexes
- graph_relationships table + indexes
- memory_entity_links table
- Embedding column on graph_entities (pgvector)

### 14. OpenAPI Schema Update
New endpoints need to be in the OpenAPI schema. Run codegen for frontend types.

### 15. Integration with Existing Enrichment Worker
The `derive_facts` job in enrichment.py is currently a stub. It was designed to "cluster related memories and extract derived facts." This IS the entity extraction job.

**Proposal:** Replace the `derive_facts` stub with the actual entity extraction pipeline. Add a new `merge_entities` job for periodic entity dedup.

---

## GraphStore Protocol (Draft)

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
    async def get_entity_agents(self, entity_id) -> list[UUID]  # which agents know this
    async def compute_overlap(self, org_id, agent_a, agent_b) -> OverlapResult
    async def find_gaps(self, org_id) -> list[GapResult]

    # Export
    async def export_agent_subgraph(self, org_id, agent_id) -> SubGraph
    async def export_org_graph(self, org_id) -> SubGraph
```

---

## API Endpoints (Draft)

```
# Entities
GET    /memory/graph/entities?type=...&limit=100         # list entities
GET    /memory/graph/entities/{id}                        # get entity detail
GET    /memory/graph/entities/{id}/memories               # memories linked to entity
GET    /memory/graph/entities/{id}/agents                 # agents who know this entity
GET    /memory/graph/entities/{id}/neighbors?hops=1       # graph traversal

# Relationships
GET    /memory/graph/relationships?entity_id=...          # relationships for entity

# Analysis
GET    /memory/graph/overlap?agent_a=...&agent_b=...      # pairwise overlap score
GET    /memory/graph/overlap/matrix                       # full org overlap matrix
GET    /memory/graph/gaps                                 # knowledge gaps

# Visualization
GET    /memory/graph/cytoscape?limit=500                  # Cytoscape.js formatted data

# Agent File
POST   /memory/agent-file/export/{agent_id}               # export agent file
POST   /memory/agent-file/import                          # import agent file
```

---

## Open Questions

1. Entity types — is `person, tool, concept, process, system, location, event` enough? Should it be extensible?
2. Relationship types — predefined set or free-form text from LLM?
3. Overlap metric — Jaccard similarity, cosine similarity, or custom?
4. Agent File — include embeddings (large) or re-embed on import?
5. Private memory entities — visible in org graph or not?
6. Graph-enhanced search — Phase 3 or Phase 4?
7. Extraction frequency — every memory, or batch periodically?
8. Dashboard graph layout — force-directed, hierarchical, or user-selectable?
