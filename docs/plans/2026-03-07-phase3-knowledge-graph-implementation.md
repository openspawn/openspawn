# Phase 3: Knowledge Graph — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build entity extraction pipeline, knowledge graph storage, cross-agent overlap analysis, agent file export/import, and dashboard visualization for issues #548, #549, #550.

**Architecture:** Postgres adjacency tables via GraphStore protocol inside `app/memory/graph/`. LLM entity extraction via instructor + litellm in arq workers. Cytoscape.js dashboard visualization. Agent File as JSON export/import.

**Tech Stack:** FastAPI, SQLAlchemy, pgvector, instructor, litellm, arq, Cytoscape.js, React, TanStack Query

---

## Task 1: Graph Data Models + Alembic Migration

**Files:**
- Create: `apps/api/app/models/graph.py`
- Modify: `apps/api/app/models/enums.py`
- Create: `apps/api/alembic/versions/xxxx_add_graph_tables.py` (via autogenerate)
- Test: `apps/api/tests/test_graph_models.py`

**Step 1: Write the failing test**

Create `apps/api/tests/test_graph_models.py`:

```python
"""Tests for graph entity and relationship models."""

from __future__ import annotations


class TestGraphEntityModel:
    def test_entity_type_enum_values(self) -> None:
        from app.models.enums import EntityType

        assert EntityType.PERSON == "person"
        assert EntityType.TOOL == "tool"
        assert EntityType.CONCEPT == "concept"
        assert EntityType.PROCESS == "process"
        assert EntityType.SYSTEM == "system"
        assert EntityType.LOCATION == "location"
        assert EntityType.EVENT == "event"

    def test_graph_entity_has_required_columns(self) -> None:
        from app.models.graph import GraphEntity

        columns = {c.name for c in GraphEntity.__table__.columns}
        required = {
            "id", "org_id", "name", "entity_type", "description",
            "embedding", "mention_count", "confidence", "last_seen_at",
            "metadata_", "created_at", "updated_at",
        }
        assert required.issubset(columns)

    def test_graph_entity_unique_constraint(self) -> None:
        from app.models.graph import GraphEntity

        constraints = {c.name for c in GraphEntity.__table__.constraints}
        assert "uq_graph_entity_org_name_type" in constraints


class TestGraphRelationshipModel:
    def test_relationship_has_required_columns(self) -> None:
        from app.models.graph import GraphRelationship

        columns = {c.name for c in GraphRelationship.__table__.columns}
        required = {
            "id", "org_id", "source_entity_id", "target_entity_id",
            "relationship_type", "weight", "last_seen_at",
            "evidence_count", "metadata_", "created_at", "updated_at",
        }
        assert required.issubset(columns)


class TestMemoryEntityLinkModel:
    def test_link_has_required_columns(self) -> None:
        from app.models.graph import MemoryEntityLink

        columns = {c.name for c in MemoryEntityLink.__table__.columns}
        required = {"memory_id", "entity_id", "agent_id", "created_at"}
        assert required.issubset(columns)
```

**Step 2: Run test to verify it fails**

```bash
cd apps/api && uv run pytest tests/test_graph_models.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'app.models.graph'`

**Step 3: Add EntityType enum**

Add to `apps/api/app/models/enums.py`:

```python
class EntityType(enum.StrEnum):
    PERSON = "person"
    TOOL = "tool"
    CONCEPT = "concept"
    PROCESS = "process"
    SYSTEM = "system"
    LOCATION = "location"
    EVENT = "event"
```

**Step 4: Create graph models**

Create `apps/api/app/models/graph.py`:

```python
"""Graph entity, relationship, and memory-entity link models."""

from __future__ import annotations

import uuid
from datetime import datetime

import pendulum
from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Float,
    ForeignKey,
    Integer,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

EMBEDDING_DIMENSIONS = 1024


class GraphEntity(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "graph_entities"
    __table_args__ = (
        UniqueConstraint(
            "org_id", "name", "entity_type",
            name="uq_graph_entity_org_name_type",
        ),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    entity_type: Mapped[str] = mapped_column(String(50))
    description: Mapped[str] = mapped_column(Text, default="")
    embedding: Mapped[list[float] | None] = mapped_column(
        Vector(EMBEDDING_DIMENSIONS), nullable=True,
    )
    mention_count: Mapped[int] = mapped_column(Integer, default=0)
    confidence: Mapped[float] = mapped_column(Float, default=50.0)
    last_seen_at: Mapped[datetime] = mapped_column(
        default=lambda: pendulum.now("UTC"),
    )
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)


class GraphRelationship(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "graph_relationships"

    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"), index=True)
    source_entity_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("graph_entities.id"), index=True,
    )
    target_entity_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("graph_entities.id"), index=True,
    )
    relationship_type: Mapped[str] = mapped_column(String(100))
    weight: Mapped[float] = mapped_column(Float, default=0.5)
    last_seen_at: Mapped[datetime] = mapped_column(
        default=lambda: pendulum.now("UTC"),
    )
    evidence_count: Mapped[int] = mapped_column(Integer, default=1)
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)


class MemoryEntityLink(Base):
    __tablename__ = "memory_entity_links"

    memory_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("memories.id"), primary_key=True,
    )
    entity_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("graph_entities.id"), primary_key=True, index=True,
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("agents.id"), index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: pendulum.now("UTC"),
    )
```

**Step 5: Run test to verify it passes**

```bash
cd apps/api && uv run pytest tests/test_graph_models.py -v
```

Expected: PASS

**Step 6: Generate Alembic migration**

```bash
cd apps/api && uv run alembic revision --autogenerate -m "add graph_entities, graph_relationships, memory_entity_links"
```

Review generated migration. Manually add pgvector HNSW index on `graph_entities.embedding` if not auto-detected:

```python
op.create_index(
    "ix_graph_entities_embedding",
    "graph_entities",
    ["embedding"],
    postgresql_using="hnsw",
    postgresql_with={"m": 16, "ef_construction": 64},
    postgresql_ops={"embedding": "vector_cosine_ops"},
)
```

**Step 7: Lint + commit**

```bash
cd apps/api && uv run ruff check app/ tests/ --fix && uv run ruff format app/ tests/
git checkout -b adamwdennis/feat-548-graph-models
git add apps/api/app/models/graph.py apps/api/app/models/enums.py apps/api/alembic/versions/ apps/api/tests/test_graph_models.py
git commit -m "feat(memory): add graph entity + relationship models

graph_entities, graph_relationships, memory_entity_links tables
with pgvector HNSW index and composite unique constraints"
```

---

## Task 2: GraphStore Protocol + Postgres Implementation

**Files:**
- Create: `apps/api/app/memory/graph/__init__.py`
- Create: `apps/api/app/memory/graph/protocol.py`
- Create: `apps/api/app/memory/graph/schemas.py`
- Create: `apps/api/app/memory/graph/postgres_store.py`
- Test: `apps/api/tests/test_graph_store.py`

**Step 1: Write the failing test**

Create `apps/api/tests/test_graph_store.py`:

```python
"""Tests for GraphStore protocol and Postgres implementation."""

from __future__ import annotations


class TestGraphStoreProtocol:
    def test_postgres_store_implements_protocol(self) -> None:
        from app.memory.graph.postgres_store import PostgresGraphStore
        from app.memory.graph.protocol import GraphStore

        assert isinstance(PostgresGraphStore(), GraphStore)

    def test_protocol_has_required_methods(self) -> None:
        from app.memory.graph.protocol import GraphStore

        required = {
            "upsert_entity", "get_entity", "find_entity",
            "find_similar_entity", "list_entities", "merge_entities",
            "upsert_relationship", "get_relationships",
            "link_memory_entity",
            "get_neighbors", "get_agent_entities", "get_entity_agents",
            "compute_overlap", "find_gaps",
            "export_agent_subgraph", "export_org_graph",
        }
        protocol_methods = {
            name for name in dir(GraphStore)
            if not name.startswith("_")
        }
        assert required.issubset(protocol_methods)


class TestGraphSchemas:
    def test_graph_entity_response(self) -> None:
        import uuid

        from app.memory.graph.schemas import GraphEntityResponse

        resp = GraphEntityResponse(
            id=uuid.uuid4(),
            org_id=uuid.uuid4(),
            name="Docker",
            entity_type="tool",
            description="Container platform",
            mention_count=5,
            confidence=85.0,
        )
        assert resp.name == "Docker"

    def test_overlap_result(self) -> None:
        import uuid

        from app.memory.graph.schemas import OverlapResult

        result = OverlapResult(
            agent_a=uuid.uuid4(),
            agent_b=uuid.uuid4(),
            jaccard_score=0.75,
            shared_count=15,
            union_count=20,
        )
        assert result.jaccard_score == 0.75

    def test_gap_result(self) -> None:
        from app.memory.graph.schemas import GapResult

        gap = GapResult(
            entity_name="security",
            entity_type="concept",
            agent_count=1,
            risk="single_point_of_failure",
        )
        assert gap.risk == "single_point_of_failure"

    def test_sub_graph(self) -> None:
        from app.memory.graph.schemas import SubGraph

        sg = SubGraph(entities=[], relationships=[])
        assert len(sg.entities) == 0
```

**Step 2: Run test to verify it fails**

```bash
cd apps/api && uv run pytest tests/test_graph_store.py -v
```

Expected: FAIL

**Step 3: Create graph schemas**

Create `apps/api/app/memory/graph/__init__.py`:

```python
"""Knowledge graph module."""
```

Create `apps/api/app/memory/graph/schemas.py`:

```python
"""Pydantic schemas for graph queries and responses."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class GraphEntityResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    name: str
    entity_type: str
    description: str = ""
    mention_count: int = 0
    confidence: float = 50.0
    last_seen_at: datetime | None = None
    metadata: dict = Field(default_factory=dict)
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class GraphRelationshipResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    source_entity_id: uuid.UUID
    target_entity_id: uuid.UUID
    relationship_type: str
    weight: float = 0.5
    evidence_count: int = 1
    last_seen_at: datetime | None = None
    metadata: dict = Field(default_factory=dict)

    model_config = {"from_attributes": True}


class SubGraph(BaseModel):
    entities: list[GraphEntityResponse] = Field(default_factory=list)
    relationships: list[GraphRelationshipResponse] = Field(default_factory=list)


class OverlapResult(BaseModel):
    agent_a: uuid.UUID
    agent_b: uuid.UUID
    jaccard_score: float
    shared_count: int
    union_count: int
    shared_entities: list[GraphEntityResponse] = Field(default_factory=list)


class GapResult(BaseModel):
    entity_name: str
    entity_type: str
    agent_count: int
    risk: str  # single_point_of_failure, no_coverage, low_confidence


class CytoscapeNode(BaseModel):
    data: dict  # id, label, type, mention_count, confidence


class CytoscapeEdge(BaseModel):
    data: dict  # id, source, target, label, weight


class CytoscapeGraph(BaseModel):
    nodes: list[CytoscapeNode] = Field(default_factory=list)
    edges: list[CytoscapeEdge] = Field(default_factory=list)
```

**Step 4: Create GraphStore protocol**

Create `apps/api/app/memory/graph/protocol.py`:

```python
"""GraphStore protocol — pluggable backend for knowledge graph storage."""

from __future__ import annotations

import uuid
from typing import Protocol, runtime_checkable

from app.memory.graph.schemas import (
    GapResult,
    GraphEntityResponse,
    GraphRelationshipResponse,
    OverlapResult,
    SubGraph,
)


@runtime_checkable
class GraphStore(Protocol):
    async def upsert_entity(
        self, org_id: uuid.UUID, name: str, entity_type: str,
        description: str, embedding: list[float] | None,
        metadata: dict | None = None,
    ) -> uuid.UUID: ...

    async def get_entity(self, entity_id: uuid.UUID) -> GraphEntityResponse | None: ...

    async def find_entity(
        self, org_id: uuid.UUID, name: str, entity_type: str,
    ) -> GraphEntityResponse | None: ...

    async def find_similar_entity(
        self, org_id: uuid.UUID, embedding: list[float], threshold: float = 0.90,
    ) -> GraphEntityResponse | None: ...

    async def list_entities(
        self, org_id: uuid.UUID, entity_type: str | None = None, limit: int = 100,
    ) -> list[GraphEntityResponse]: ...

    async def merge_entities(
        self, keep_id: uuid.UUID, merge_id: uuid.UUID,
    ) -> GraphEntityResponse: ...

    async def upsert_relationship(
        self, org_id: uuid.UUID, source_id: uuid.UUID, target_id: uuid.UUID,
        rel_type: str, weight: float = 0.5,
        evidence_memory_ids: list[uuid.UUID] | None = None,
    ) -> uuid.UUID: ...

    async def get_relationships(
        self, entity_id: uuid.UUID, direction: str = "both",
    ) -> list[GraphRelationshipResponse]: ...

    async def link_memory_entity(
        self, memory_id: uuid.UUID, entity_id: uuid.UUID, agent_id: uuid.UUID,
    ) -> None: ...

    async def get_neighbors(
        self, entity_id: uuid.UUID, hops: int = 1,
    ) -> SubGraph: ...

    async def get_agent_entities(
        self, org_id: uuid.UUID, agent_id: uuid.UUID,
    ) -> list[GraphEntityResponse]: ...

    async def get_entity_agents(self, entity_id: uuid.UUID) -> list[uuid.UUID]: ...

    async def compute_overlap(
        self, org_id: uuid.UUID, agent_a: uuid.UUID, agent_b: uuid.UUID,
    ) -> OverlapResult: ...

    async def find_gaps(self, org_id: uuid.UUID) -> list[GapResult]: ...

    async def export_agent_subgraph(
        self, org_id: uuid.UUID, agent_id: uuid.UUID,
    ) -> SubGraph: ...

    async def export_org_graph(self, org_id: uuid.UUID) -> SubGraph: ...
```

**Step 5: Create Postgres implementation**

Create `apps/api/app/memory/graph/postgres_store.py`:

```python
"""Postgres-backed GraphStore implementation using adjacency tables."""

from __future__ import annotations

import uuid

import pendulum
import structlog
from sqlalchemy import and_, delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.graph import GraphEntity, GraphRelationship, MemoryEntityLink
from app.memory.graph.schemas import (
    GapResult,
    GraphEntityResponse,
    GraphRelationshipResponse,
    OverlapResult,
    SubGraph,
)

logger = structlog.get_logger()


class PostgresGraphStore:
    def __init__(self, session: AsyncSession | None = None) -> None:
        self._session = session

    @property
    def session(self) -> AsyncSession:
        if self._session is None:
            msg = "Session not set"
            raise RuntimeError(msg)
        return self._session

    def with_session(self, session: AsyncSession) -> PostgresGraphStore:
        return PostgresGraphStore(session)

    async def upsert_entity(
        self, org_id: uuid.UUID, name: str, entity_type: str,
        description: str, embedding: list[float] | None,
        metadata: dict | None = None,
    ) -> uuid.UUID:
        now = pendulum.now("UTC")
        existing = await self.find_entity(org_id, name, entity_type)
        if existing:
            await self.session.execute(
                update(GraphEntity)
                .where(GraphEntity.id == existing.id)
                .values(
                    description=description,
                    embedding=embedding,
                    mention_count=GraphEntity.mention_count + 1,
                    last_seen_at=now,
                    metadata_=metadata or {},
                )
            )
            return existing.id

        entity = GraphEntity(
            org_id=org_id,
            name=name.lower().strip(),
            entity_type=entity_type.lower().strip(),
            description=description,
            embedding=embedding,
            mention_count=1,
            confidence=50.0,
            last_seen_at=now,
            metadata_=metadata or {},
        )
        self.session.add(entity)
        await self.session.flush()
        return entity.id

    async def get_entity(self, entity_id: uuid.UUID) -> GraphEntityResponse | None:
        entity = await self.session.get(GraphEntity, entity_id)
        if not entity:
            return None
        return GraphEntityResponse.model_validate(entity)

    async def find_entity(
        self, org_id: uuid.UUID, name: str, entity_type: str,
    ) -> GraphEntityResponse | None:
        result = await self.session.execute(
            select(GraphEntity).where(
                and_(
                    GraphEntity.org_id == org_id,
                    func.lower(GraphEntity.name) == name.lower().strip(),
                    func.lower(GraphEntity.entity_type) == entity_type.lower().strip(),
                )
            )
        )
        entity = result.scalar_one_or_none()
        if not entity:
            return None
        return GraphEntityResponse.model_validate(entity)

    async def find_similar_entity(
        self, org_id: uuid.UUID, embedding: list[float], threshold: float = 0.90,
    ) -> GraphEntityResponse | None:
        embedding_str = "[" + ",".join(str(v) for v in embedding) + "]"
        result = await self.session.execute(
            select(GraphEntity)
            .where(
                and_(
                    GraphEntity.org_id == org_id,
                    GraphEntity.embedding.is_not(None),
                )
            )
            .order_by(GraphEntity.embedding.cosine_distance(embedding_str))
            .limit(1)
        )
        entity = result.scalar_one_or_none()
        if not entity or not entity.embedding:
            return None
        # Compute similarity (1 - distance)
        from pgvector.sqlalchemy import cosine_distance
        dist_result = await self.session.execute(
            select(
                (1 - GraphEntity.embedding.cosine_distance(embedding_str)).label("similarity")
            ).where(GraphEntity.id == entity.id)
        )
        similarity = dist_result.scalar_one()
        if similarity < threshold:
            return None
        return GraphEntityResponse.model_validate(entity)

    async def list_entities(
        self, org_id: uuid.UUID, entity_type: str | None = None, limit: int = 100,
    ) -> list[GraphEntityResponse]:
        stmt = select(GraphEntity).where(GraphEntity.org_id == org_id)
        if entity_type:
            stmt = stmt.where(func.lower(GraphEntity.entity_type) == entity_type.lower())
        stmt = stmt.order_by(GraphEntity.mention_count.desc()).limit(limit)
        result = await self.session.execute(stmt)
        return [GraphEntityResponse.model_validate(e) for e in result.scalars()]

    async def merge_entities(
        self, keep_id: uuid.UUID, merge_id: uuid.UUID,
    ) -> GraphEntityResponse:
        keep = await self.session.get(GraphEntity, keep_id)
        merge = await self.session.get(GraphEntity, merge_id)
        if not keep or not merge:
            msg = "Entity not found"
            raise ValueError(msg)

        # Move all links from merge → keep
        await self.session.execute(
            update(MemoryEntityLink)
            .where(MemoryEntityLink.entity_id == merge_id)
            .values(entity_id=keep_id)
        )
        # Move relationships
        await self.session.execute(
            update(GraphRelationship)
            .where(GraphRelationship.source_entity_id == merge_id)
            .values(source_entity_id=keep_id)
        )
        await self.session.execute(
            update(GraphRelationship)
            .where(GraphRelationship.target_entity_id == merge_id)
            .values(target_entity_id=keep_id)
        )
        # Update keep stats
        keep.mention_count += merge.mention_count
        keep.last_seen_at = max(keep.last_seen_at, merge.last_seen_at)
        # Delete merged entity
        await self.session.execute(
            delete(GraphEntity).where(GraphEntity.id == merge_id)
        )
        await self.session.flush()
        return GraphEntityResponse.model_validate(keep)

    async def upsert_relationship(
        self, org_id: uuid.UUID, source_id: uuid.UUID, target_id: uuid.UUID,
        rel_type: str, weight: float = 0.5,
        evidence_memory_ids: list[uuid.UUID] | None = None,
    ) -> uuid.UUID:
        now = pendulum.now("UTC")
        normalized_type = rel_type.lower().strip()
        result = await self.session.execute(
            select(GraphRelationship).where(
                and_(
                    GraphRelationship.org_id == org_id,
                    GraphRelationship.source_entity_id == source_id,
                    GraphRelationship.target_entity_id == target_id,
                    func.lower(GraphRelationship.relationship_type) == normalized_type,
                )
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            existing.evidence_count += 1
            existing.last_seen_at = now
            existing.weight = min(1.0, existing.weight + 0.1)
            return existing.id

        rel = GraphRelationship(
            org_id=org_id,
            source_entity_id=source_id,
            target_entity_id=target_id,
            relationship_type=normalized_type,
            weight=weight,
            last_seen_at=now,
            evidence_count=1,
        )
        self.session.add(rel)
        await self.session.flush()
        return rel.id

    async def get_relationships(
        self, entity_id: uuid.UUID, direction: str = "both",
    ) -> list[GraphRelationshipResponse]:
        if direction == "outgoing":
            stmt = select(GraphRelationship).where(
                GraphRelationship.source_entity_id == entity_id
            )
        elif direction == "incoming":
            stmt = select(GraphRelationship).where(
                GraphRelationship.target_entity_id == entity_id
            )
        else:
            stmt = select(GraphRelationship).where(
                (GraphRelationship.source_entity_id == entity_id)
                | (GraphRelationship.target_entity_id == entity_id)
            )
        result = await self.session.execute(stmt)
        return [GraphRelationshipResponse.model_validate(r) for r in result.scalars()]

    async def link_memory_entity(
        self, memory_id: uuid.UUID, entity_id: uuid.UUID, agent_id: uuid.UUID,
    ) -> None:
        link = MemoryEntityLink(
            memory_id=memory_id,
            entity_id=entity_id,
            agent_id=agent_id,
        )
        self.session.add(link)
        await self.session.flush()

    async def get_neighbors(
        self, entity_id: uuid.UUID, hops: int = 1,
    ) -> SubGraph:
        visited_ids: set[uuid.UUID] = {entity_id}
        all_rels: list[GraphRelationshipResponse] = []
        frontier = {entity_id}

        for _ in range(hops):
            next_frontier: set[uuid.UUID] = set()
            for eid in frontier:
                rels = await self.get_relationships(eid)
                for rel in rels:
                    all_rels.append(rel)
                    for neighbor_id in (rel.source_entity_id, rel.target_entity_id):
                        if neighbor_id not in visited_ids:
                            visited_ids.add(neighbor_id)
                            next_frontier.add(neighbor_id)
            frontier = next_frontier

        entities = []
        for eid in visited_ids:
            entity = await self.get_entity(eid)
            if entity:
                entities.append(entity)

        return SubGraph(entities=entities, relationships=all_rels)

    async def get_agent_entities(
        self, org_id: uuid.UUID, agent_id: uuid.UUID,
    ) -> list[GraphEntityResponse]:
        result = await self.session.execute(
            select(GraphEntity)
            .join(MemoryEntityLink, MemoryEntityLink.entity_id == GraphEntity.id)
            .where(
                and_(
                    GraphEntity.org_id == org_id,
                    MemoryEntityLink.agent_id == agent_id,
                )
            )
            .distinct()
            .order_by(GraphEntity.mention_count.desc())
        )
        return [GraphEntityResponse.model_validate(e) for e in result.scalars()]

    async def get_entity_agents(self, entity_id: uuid.UUID) -> list[uuid.UUID]:
        result = await self.session.execute(
            select(MemoryEntityLink.agent_id)
            .where(MemoryEntityLink.entity_id == entity_id)
            .distinct()
        )
        return list(result.scalars())

    async def compute_overlap(
        self, org_id: uuid.UUID, agent_a: uuid.UUID, agent_b: uuid.UUID,
    ) -> OverlapResult:
        entities_a = {e.id for e in await self.get_agent_entities(org_id, agent_a)}
        entities_b = {e.id for e in await self.get_agent_entities(org_id, agent_b)}
        shared = entities_a & entities_b
        union = entities_a | entities_b
        jaccard = len(shared) / len(union) if union else 0.0

        shared_entities = []
        for eid in shared:
            entity = await self.get_entity(eid)
            if entity:
                shared_entities.append(entity)

        return OverlapResult(
            agent_a=agent_a,
            agent_b=agent_b,
            jaccard_score=jaccard,
            shared_count=len(shared),
            union_count=len(union),
            shared_entities=shared_entities,
        )

    async def find_gaps(self, org_id: uuid.UUID) -> list[GapResult]:
        # Entities known by only 1 agent
        result = await self.session.execute(
            select(
                GraphEntity.name,
                GraphEntity.entity_type,
                func.count(func.distinct(MemoryEntityLink.agent_id)).label("agent_count"),
            )
            .join(MemoryEntityLink, MemoryEntityLink.entity_id == GraphEntity.id)
            .where(GraphEntity.org_id == org_id)
            .group_by(GraphEntity.id, GraphEntity.name, GraphEntity.entity_type)
            .having(func.count(func.distinct(MemoryEntityLink.agent_id)) == 1)
        )
        gaps = []
        for row in result:
            gaps.append(GapResult(
                entity_name=row.name,
                entity_type=row.entity_type,
                agent_count=row.agent_count,
                risk="single_point_of_failure",
            ))
        return gaps

    async def export_agent_subgraph(
        self, org_id: uuid.UUID, agent_id: uuid.UUID,
    ) -> SubGraph:
        entities = await self.get_agent_entities(org_id, agent_id)
        entity_ids = {e.id for e in entities}
        all_rels = []
        for entity in entities:
            rels = await self.get_relationships(entity.id)
            for rel in rels:
                if rel.source_entity_id in entity_ids and rel.target_entity_id in entity_ids:
                    all_rels.append(rel)
        return SubGraph(entities=entities, relationships=all_rels)

    async def export_org_graph(self, org_id: uuid.UUID) -> SubGraph:
        entities = await self.list_entities(org_id, limit=10000)
        entity_ids = {e.id for e in entities}
        all_rels = []
        for entity in entities:
            rels = await self.get_relationships(entity.id, direction="outgoing")
            for rel in rels:
                if rel.target_entity_id in entity_ids:
                    all_rels.append(rel)
        return SubGraph(entities=entities, relationships=all_rels)
```

**Step 6: Run tests**

```bash
cd apps/api && uv run pytest tests/test_graph_store.py -v
```

Expected: PASS

**Step 7: Lint + commit**

```bash
cd apps/api && uv run ruff check app/ tests/ --fix && uv run ruff format app/ tests/
git add apps/api/app/memory/graph/
git add apps/api/tests/test_graph_store.py
git commit -m "feat(memory): GraphStore protocol + Postgres implementation

pluggable graph storage with entity CRUD, relationship management,
overlap scoring, gap detection, and subgraph export"
```

---

## Task 3: Entity Extraction Pipeline (LLM + arq Worker)

**Files:**
- Create: `apps/api/app/memory/graph/extraction.py`
- Modify: `apps/api/app/workers/enrichment.py` — replace `derive_facts` stub
- Test: `apps/api/tests/test_graph_extraction.py`

**Step 1: Write the failing test**

Create `apps/api/tests/test_graph_extraction.py`:

```python
"""Tests for entity extraction pipeline."""

from __future__ import annotations


class TestExtractionModels:
    def test_extracted_entity_model(self) -> None:
        from app.memory.graph.extraction import ExtractedEntity

        entity = ExtractedEntity(
            name="Docker",
            entity_type="tool",
            description="Container platform",
            confidence=0.9,
        )
        assert entity.name == "Docker"
        assert entity.entity_type == "tool"

    def test_extracted_relationship_model(self) -> None:
        from app.memory.graph.extraction import ExtractedRelationship

        rel = ExtractedRelationship(
            source="Docker",
            target="CI pipeline",
            relationship_type="used_by",
            weight=0.8,
        )
        assert rel.source == "Docker"

    def test_extraction_result_model(self) -> None:
        from app.memory.graph.extraction import ExtractionResult

        result = ExtractionResult(entities=[], relationships=[])
        assert len(result.entities) == 0


class TestExtractionPrompt:
    def test_prompt_exists(self) -> None:
        from app.memory.graph.extraction import EXTRACTION_PROMPT

        assert "entities" in EXTRACTION_PROMPT.lower()
        assert "relationships" in EXTRACTION_PROMPT.lower()


class TestConfidencePropagation:
    def test_weighted_average(self) -> None:
        from app.memory.graph.extraction import compute_entity_confidence

        # High-confidence memories should yield high entity confidence
        confidences = [90, 85, 80]
        result = compute_entity_confidence(confidences)
        assert result >= 80.0

    def test_low_confidence_memories(self) -> None:
        from app.memory.graph.extraction import compute_entity_confidence

        confidences = [40, 30]
        result = compute_entity_confidence(confidences)
        assert result <= 40.0

    def test_empty_list_returns_default(self) -> None:
        from app.memory.graph.extraction import compute_entity_confidence

        result = compute_entity_confidence([])
        assert result == 50.0


class TestMinConfidenceThreshold:
    def test_threshold_value(self) -> None:
        from app.memory.graph.extraction import MIN_ENTITY_CONFIDENCE

        assert MIN_ENTITY_CONFIDENCE == 20


class TestEnrichmentWorkerUpdated:
    def test_extract_entities_replaces_derive_facts(self) -> None:
        from app.workers.enrichment import WorkerSettings

        fn_names = [fn.__name__ for fn in WorkerSettings.functions]
        assert "extract_entities" in fn_names
        assert "derive_facts" not in fn_names

    def test_merge_entities_job_registered(self) -> None:
        from app.workers.enrichment import WorkerSettings

        fn_names = [fn.__name__ for fn in WorkerSettings.functions]
        assert "merge_entities" in fn_names
```

**Step 2: Run test to verify it fails**

```bash
cd apps/api && uv run pytest tests/test_graph_extraction.py -v
```

Expected: FAIL

**Step 3: Create extraction module**

Create `apps/api/app/memory/graph/extraction.py`:

```python
"""LLM-based entity and relationship extraction from memories."""

from __future__ import annotations

import structlog
from pydantic import BaseModel, Field
from tenacity import retry, stop_after_attempt, wait_exponential

logger = structlog.get_logger()

DEFAULT_MODEL = "anthropic/claude-haiku-4-5-20251001"

MIN_ENTITY_CONFIDENCE = 20

EXTRACTION_PROMPT = """Extract entities and relationships from this memory content.

Entities are people, tools, concepts, processes, systems, locations, or events mentioned.
Relationships connect two entities (e.g., "uses", "depends_on", "created_by").

For each entity:
- Provide a short name (lowercase, no articles)
- Classify as: person, tool, concept, process, system, location, or event
- Write a 1-sentence description
- Rate confidence 0-1 (lower if hedging language like "maybe", "I think")

For each relationship:
- Reference source and target entities by name
- Provide a relationship type (lowercase verb phrase)
- Rate weight 0-1 (strength of the relationship)

Content:
{content}"""


class ExtractedEntity(BaseModel):
    name: str
    entity_type: str
    description: str
    confidence: float = Field(ge=0.0, le=1.0)


class ExtractedRelationship(BaseModel):
    source: str
    target: str
    relationship_type: str
    weight: float = Field(ge=0.0, le=1.0, default=0.5)


class ExtractionResult(BaseModel):
    entities: list[ExtractedEntity] = Field(default_factory=list)
    relationships: list[ExtractedRelationship] = Field(default_factory=list)


def compute_entity_confidence(memory_confidences: list[int]) -> float:
    """Weighted average of linked memory confidences."""
    if not memory_confidences:
        return 50.0
    return sum(memory_confidences) / len(memory_confidences)


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
async def extract_from_content(
    content: str,
    model: str = DEFAULT_MODEL,
) -> ExtractionResult:
    """Extract entities and relationships from memory content via LLM."""
    import instructor
    import litellm

    client = instructor.from_litellm(litellm.acompletion)
    try:
        result = await client.chat.completions.create(
            model=model,
            response_model=ExtractionResult,
            messages=[
                {"role": "user", "content": EXTRACTION_PROMPT.format(content=content)},
            ],
            max_tokens=1024,
        )
    except Exception:
        logger.warning("entity_extraction_failed", content_len=len(content))
        return ExtractionResult()

    return result
```

**Step 4: Update enrichment worker**

Modify `apps/api/app/workers/enrichment.py`:
- Replace `derive_facts` with `extract_entities`
- Add `merge_entities` job
- Update `WorkerSettings.functions` and `cron_jobs`

Replace the `derive_facts` function (lines 98-105) with:

```python
async def extract_entities(ctx: dict) -> None:
    """Extract entities and relationships from recent unprocessed memories."""
    from app.memory.graph.extraction import MIN_ENTITY_CONFIDENCE, extract_from_content
    from app.memory.graph.postgres_store import PostgresGraphStore

    async with async_session() as session:
        # Find memories without entity links from last 24h
        result = await session.execute(
            text("""
                SELECT m.id, m.org_id, m.agent_id, m.content, m.confidence
                FROM memories m
                LEFT JOIN memory_entity_links mel ON mel.memory_id = m.id
                WHERE mel.memory_id IS NULL
                  AND m.created_at > NOW() - INTERVAL '24 hours'
                  AND m.content IS NOT NULL
                ORDER BY m.created_at DESC
                LIMIT 100
            """)
        )
        memories = result.fetchall()
        if not memories:
            logger.info("extract_entities: no unprocessed memories")
            return

        store = PostgresGraphStore(session)
        for mem in memories:
            if mem.confidence < MIN_ENTITY_CONFIDENCE:
                continue
            extraction = await extract_from_content(mem.content)
            for entity in extraction.entities:
                entity_id = await store.upsert_entity(
                    org_id=mem.org_id,
                    name=entity.name,
                    entity_type=entity.entity_type,
                    description=entity.description,
                    embedding=None,  # Embed separately if needed
                )
                await store.link_memory_entity(mem.id, entity_id, mem.agent_id)

            # Resolve entity names to IDs for relationships
            for rel in extraction.relationships:
                source = await store.find_entity(mem.org_id, rel.source, "")
                target = await store.find_entity(mem.org_id, rel.target, "")
                if source and target:
                    await store.upsert_relationship(
                        org_id=mem.org_id,
                        source_id=source.id,
                        target_id=target.id,
                        rel_type=rel.relationship_type,
                        weight=rel.weight,
                    )
            await session.commit()
        logger.info("extract_entities completed", processed=len(memories))


async def merge_duplicate_entities(ctx: dict) -> None:
    """Periodic entity dedup sweep via embedding similarity."""
    logger.info("merge_duplicate_entities: stub — implement with embedding comparison")
```

Update `WorkerSettings`:

```python
class WorkerSettings:
    functions: ClassVar[list] = [
        boost_co_retrieved, identify_stale, extract_entities,
        expire_memories, merge_duplicate_entities,
    ]
    cron_jobs: ClassVar[list] = [
        cron(boost_co_retrieved, hour={0, 6, 12, 18}),
        cron(identify_stale, hour={3}),
        cron(extract_entities, hour={4}),
        cron(expire_memories, minute={0}),
        cron(merge_duplicate_entities, hour={5}),
    ]
    redis_settings = get_redis_settings()
```

**Step 5: Update enrichment + expiry test counts**

Update `apps/api/tests/test_enrichment.py`: change function count from 4 → 5, cron count from 4 → 5.

Update `apps/api/tests/test_expiry.py`: same count updates.

**Step 6: Run all tests**

```bash
cd apps/api && uv run pytest tests/test_graph_extraction.py tests/test_enrichment.py tests/test_expiry.py -v
```

Expected: PASS

**Step 7: Lint + commit**

```bash
cd apps/api && uv run ruff check app/ tests/ --fix && uv run ruff format app/ tests/
git add apps/api/app/memory/graph/extraction.py apps/api/app/workers/enrichment.py
git add apps/api/tests/test_graph_extraction.py apps/api/tests/test_enrichment.py apps/api/tests/test_expiry.py
git commit -m "feat(memory): entity extraction pipeline + arq worker

LLM extraction via instructor+litellm, confidence propagation,
replaces derive_facts stub, adds merge_duplicate_entities job"
```

---

## Task 4: Graph API Router + Endpoints

**Files:**
- Create: `apps/api/app/memory/graph/router.py`
- Modify: `apps/api/app/main.py` — register graph router
- Test: `apps/api/tests/test_graph_routes.py`

**Step 1: Write the failing test**

Create `apps/api/tests/test_graph_routes.py`:

```python
"""Smoke tests for graph API routes."""

from __future__ import annotations

import pytest


class TestGraphRouteRegistration:
    @pytest.fixture
    def routes(self) -> list[str]:
        from app.main import app

        return [route.path for route in app.routes]

    def test_entities_route(self, routes: list[str]) -> None:
        assert "/memory/graph/entities" in routes

    def test_entity_detail_route(self, routes: list[str]) -> None:
        assert "/memory/graph/entities/{entity_id}" in routes

    def test_entity_memories_route(self, routes: list[str]) -> None:
        assert "/memory/graph/entities/{entity_id}/memories" in routes

    def test_entity_agents_route(self, routes: list[str]) -> None:
        assert "/memory/graph/entities/{entity_id}/agents" in routes

    def test_entity_neighbors_route(self, routes: list[str]) -> None:
        assert "/memory/graph/entities/{entity_id}/neighbors" in routes

    def test_relationships_route(self, routes: list[str]) -> None:
        assert "/memory/graph/relationships" in routes

    def test_overlap_route(self, routes: list[str]) -> None:
        assert "/memory/graph/overlap" in routes

    def test_overlap_matrix_route(self, routes: list[str]) -> None:
        assert "/memory/graph/overlap/matrix" in routes

    def test_gaps_route(self, routes: list[str]) -> None:
        assert "/memory/graph/gaps" in routes

    def test_cytoscape_route(self, routes: list[str]) -> None:
        assert "/memory/graph/cytoscape" in routes
```

**Step 2: Create graph router**

Create `apps/api/app/memory/graph/router.py`:

```python
"""API endpoints for knowledge graph queries and visualization."""

from __future__ import annotations

import uuid

import structlog
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import AuthContext, require_auth
from app.database import get_db
from app.memory.graph.postgres_store import PostgresGraphStore
from app.memory.graph.schemas import (
    CytoscapeGraph,
    CytoscapeEdge,
    CytoscapeNode,
    GapResult,
    GraphEntityResponse,
    GraphRelationshipResponse,
    OverlapResult,
    SubGraph,
)

logger = structlog.get_logger()

router = APIRouter(prefix="/memory/graph", tags=["graph"])


def _get_store(session: AsyncSession = Depends(get_db)) -> PostgresGraphStore:
    return PostgresGraphStore(session)


@router.get("/entities", response_model=list[GraphEntityResponse])
async def list_entities(
    entity_type: str | None = None,
    limit: int = Query(default=100, le=500),
    auth: AuthContext = Depends(require_auth),
    store: PostgresGraphStore = Depends(_get_store),
) -> list[GraphEntityResponse]:
    return await store.list_entities(auth.org_id, entity_type=entity_type, limit=limit)


@router.get("/entities/{entity_id}", response_model=GraphEntityResponse)
async def get_entity(
    entity_id: uuid.UUID,
    auth: AuthContext = Depends(require_auth),
    store: PostgresGraphStore = Depends(_get_store),
) -> GraphEntityResponse:
    entity = await store.get_entity(entity_id)
    if not entity:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Entity not found")
    return entity


@router.get("/entities/{entity_id}/memories")
async def get_entity_memories(
    entity_id: uuid.UUID,
    auth: AuthContext = Depends(require_auth),
    session: AsyncSession = Depends(get_db),
) -> list[dict]:
    from sqlalchemy import select
    from app.models.graph import MemoryEntityLink
    from app.models.memory import Memory

    result = await session.execute(
        select(Memory)
        .join(MemoryEntityLink, MemoryEntityLink.memory_id == Memory.id)
        .where(MemoryEntityLink.entity_id == entity_id)
        .order_by(Memory.created_at.desc())
        .limit(50)
    )
    memories = result.scalars().all()
    return [
        {"id": str(m.id), "content": m.content, "confidence": m.confidence,
         "source": m.source, "agent_id": str(m.agent_id), "created_at": str(m.created_at)}
        for m in memories
    ]


@router.get("/entities/{entity_id}/agents")
async def get_entity_agents(
    entity_id: uuid.UUID,
    auth: AuthContext = Depends(require_auth),
    store: PostgresGraphStore = Depends(_get_store),
) -> list[str]:
    agent_ids = await store.get_entity_agents(entity_id)
    return [str(aid) for aid in agent_ids]


@router.get("/entities/{entity_id}/neighbors", response_model=SubGraph)
async def get_entity_neighbors(
    entity_id: uuid.UUID,
    hops: int = Query(default=1, le=3),
    auth: AuthContext = Depends(require_auth),
    store: PostgresGraphStore = Depends(_get_store),
) -> SubGraph:
    return await store.get_neighbors(entity_id, hops=hops)


@router.get("/relationships", response_model=list[GraphRelationshipResponse])
async def get_relationships(
    entity_id: uuid.UUID,
    direction: str = Query(default="both"),
    auth: AuthContext = Depends(require_auth),
    store: PostgresGraphStore = Depends(_get_store),
) -> list[GraphRelationshipResponse]:
    return await store.get_relationships(entity_id, direction=direction)


@router.get("/overlap", response_model=OverlapResult)
async def compute_overlap(
    agent_a: uuid.UUID,
    agent_b: uuid.UUID,
    auth: AuthContext = Depends(require_auth),
    store: PostgresGraphStore = Depends(_get_store),
) -> OverlapResult:
    return await store.compute_overlap(auth.org_id, agent_a, agent_b)


@router.get("/overlap/matrix")
async def overlap_matrix(
    auth: AuthContext = Depends(require_auth),
    session: AsyncSession = Depends(get_db),
    store: PostgresGraphStore = Depends(_get_store),
) -> list[OverlapResult]:
    from sqlalchemy import select, distinct
    from app.models.graph import MemoryEntityLink

    result = await session.execute(
        select(distinct(MemoryEntityLink.agent_id))
    )
    agent_ids = list(result.scalars())
    matrix = []
    for i, a in enumerate(agent_ids):
        for b in agent_ids[i + 1:]:
            overlap = await store.compute_overlap(auth.org_id, a, b)
            matrix.append(overlap)
    return matrix


@router.get("/gaps", response_model=list[GapResult])
async def find_gaps(
    auth: AuthContext = Depends(require_auth),
    store: PostgresGraphStore = Depends(_get_store),
) -> list[GapResult]:
    return await store.find_gaps(auth.org_id)


@router.get("/cytoscape", response_model=CytoscapeGraph)
async def cytoscape_graph(
    limit: int = Query(default=500, le=1000),
    entity_type: str | None = None,
    auth: AuthContext = Depends(require_auth),
    store: PostgresGraphStore = Depends(_get_store),
) -> CytoscapeGraph:
    entities = await store.list_entities(auth.org_id, entity_type=entity_type, limit=limit)
    entity_ids = {e.id for e in entities}

    nodes = [
        CytoscapeNode(data={
            "id": str(e.id),
            "label": e.name,
            "type": e.entity_type,
            "mention_count": e.mention_count,
            "confidence": e.confidence,
        })
        for e in entities
    ]

    edges = []
    for entity in entities:
        rels = await store.get_relationships(entity.id, direction="outgoing")
        for rel in rels:
            if rel.target_entity_id in entity_ids:
                edges.append(CytoscapeEdge(data={
                    "id": str(rel.id),
                    "source": str(rel.source_entity_id),
                    "target": str(rel.target_entity_id),
                    "label": rel.relationship_type,
                    "weight": rel.weight,
                }))

    return CytoscapeGraph(nodes=nodes, edges=edges)
```

**Step 3: Register router in main.py**

Add to `apps/api/app/main.py`:

```python
from app.memory.graph.router import router as graph_router
# In the router registration section:
app.include_router(graph_router)
```

**Step 4: Run tests**

```bash
cd apps/api && uv run pytest tests/test_graph_routes.py -v
```

Expected: PASS

**Step 5: Lint + commit**

```bash
cd apps/api && uv run ruff check app/ tests/ --fix && uv run ruff format app/ tests/
git add apps/api/app/memory/graph/router.py apps/api/app/main.py apps/api/tests/test_graph_routes.py
git commit -m "feat(memory): graph API endpoints + Cytoscape visualization

entities, relationships, overlap, gaps, neighbors, cytoscape data"
```

---

## Task 5: Agent File Export/Import (#549)

**Files:**
- Create: `apps/api/app/memory/graph/agent_file.py`
- Modify: `apps/api/app/memory/graph/router.py` — add export/import endpoints
- Test: `apps/api/tests/test_agent_file.py`

**Step 1: Write the failing test**

Create `apps/api/tests/test_agent_file.py`:

```python
"""Tests for Agent File export/import format."""

from __future__ import annotations

import json
import uuid


class TestAgentFileSchema:
    def test_export_format_has_version(self) -> None:
        from app.memory.graph.agent_file import AgentFileExport

        export = AgentFileExport(
            version="1.0",
            exported_at="2026-03-07T12:00:00Z",
            agent={"name": "test", "role": "researcher", "level": 3},
            memories=[],
            entities=[],
            relationships=[],
        )
        assert export.version == "1.0"

    def test_export_serializes_to_json(self) -> None:
        from app.memory.graph.agent_file import AgentFileExport

        export = AgentFileExport(
            version="1.0",
            exported_at="2026-03-07T12:00:00Z",
            agent={"name": "test", "role": "researcher", "level": 3},
            memories=[],
            entities=[],
            relationships=[],
        )
        data = json.loads(export.model_dump_json())
        assert data["version"] == "1.0"
        assert "memories" in data
        assert "entities" in data

    def test_export_keys_are_sorted(self) -> None:
        from app.memory.graph.agent_file import AgentFileExport

        export = AgentFileExport(
            version="1.0",
            exported_at="2026-03-07T12:00:00Z",
            agent={"name": "test"},
            memories=[],
            entities=[],
            relationships=[],
        )
        raw = export.model_dump_json(indent=2)
        data = json.loads(raw)
        assert list(data.keys()) == sorted(data.keys())


class TestAgentFileImportValidation:
    def test_rejects_unknown_version(self) -> None:
        import pytest
        from pydantic import ValidationError

        from app.memory.graph.agent_file import AgentFileExport

        with pytest.raises(ValidationError):
            AgentFileExport(
                version="99.0",
                exported_at="2026-03-07T12:00:00Z",
                agent={"name": "test"},
                memories=[],
                entities=[],
                relationships=[],
            )

    def test_accepts_valid_version(self) -> None:
        from app.memory.graph.agent_file import AgentFileExport

        export = AgentFileExport(
            version="1.0",
            exported_at="2026-03-07T12:00:00Z",
            agent={"name": "test"},
            memories=[],
            entities=[],
            relationships=[],
        )
        assert export.version == "1.0"
```

**Step 2: Create agent file module**

Create `apps/api/app/memory/graph/agent_file.py`:

```python
"""Agent File export/import — portable agent knowledge format."""

from __future__ import annotations

import uuid
from typing import Literal

import pendulum
import structlog
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.memory.graph.postgres_store import PostgresGraphStore
from app.models.graph import MemoryEntityLink
from app.models.memory import Memory

logger = structlog.get_logger()

SUPPORTED_VERSIONS = {"1.0"}


class AgentFileMemory(BaseModel):
    content: str
    metadata: dict = Field(default_factory=dict)
    confidence: int = 50
    source: str = "unknown"
    visibility: str = "shared"
    created_at: str | None = None

    model_config = {"json_schema_extra": {"sort_keys": True}}


class AgentFileEntity(BaseModel):
    name: str
    type: str
    description: str = ""

    model_config = {"json_schema_extra": {"sort_keys": True}}


class AgentFileRelationship(BaseModel):
    source: str
    target: str
    type: str
    weight: float = 0.5

    model_config = {"json_schema_extra": {"sort_keys": True}}


class AgentFileExport(BaseModel):
    agent: dict
    entities: list[AgentFileEntity] = Field(default_factory=list)
    exported_at: str
    memories: list[AgentFileMemory] = Field(default_factory=list)
    relationships: list[AgentFileRelationship] = Field(default_factory=list)
    version: str

    model_config = {"json_schema_extra": {"sort_keys": True}}

    @field_validator("version")
    @classmethod
    def validate_version(cls, v: str) -> str:
        if v not in SUPPORTED_VERSIONS:
            msg = f"Unsupported version: {v}. Supported: {SUPPORTED_VERSIONS}"
            raise ValueError(msg)
        return v


async def export_agent_file(
    org_id: uuid.UUID,
    agent_id: uuid.UUID,
    session: AsyncSession,
) -> AgentFileExport:
    """Export an agent's memories and knowledge subgraph."""
    # Fetch agent memories (shared + own private)
    result = await session.execute(
        select(Memory).where(
            Memory.org_id == org_id,
            Memory.agent_id == agent_id,
        ).order_by(Memory.created_at.desc())
    )
    memories = result.scalars().all()

    store = PostgresGraphStore(session)
    subgraph = await store.export_agent_subgraph(org_id, agent_id)

    return AgentFileExport(
        version="1.0",
        exported_at=pendulum.now("UTC").to_iso8601_string(),
        agent={"id": str(agent_id)},
        memories=[
            AgentFileMemory(
                content=m.content,
                metadata=m.metadata_ or {},
                confidence=m.confidence,
                source=m.source,
                visibility=m.visibility,
                created_at=str(m.created_at) if m.created_at else None,
            )
            for m in memories
        ],
        entities=[
            AgentFileEntity(
                name=e.name,
                type=e.entity_type,
                description=e.description,
            )
            for e in subgraph.entities
        ],
        relationships=[
            AgentFileRelationship(
                source=str(r.source_entity_id),
                target=str(r.target_entity_id),
                type=r.relationship_type,
                weight=r.weight,
            )
            for r in subgraph.relationships
        ],
    )
```

**Step 3: Add export/import endpoints to graph router**

Add to `apps/api/app/memory/graph/router.py`:

```python
@router.post("/agent-file/export/{agent_id}")
async def export_agent(
    agent_id: uuid.UUID,
    auth: AuthContext = Depends(require_auth),
    session: AsyncSession = Depends(get_db),
) -> dict:
    from app.memory.graph.agent_file import export_agent_file
    result = await export_agent_file(auth.org_id, agent_id, session)
    return result.model_dump()


@router.post("/agent-file/import")
async def import_agent(
    data: dict,
    auth: AuthContext = Depends(require_auth),
    session: AsyncSession = Depends(get_db),
) -> dict:
    from app.memory.graph.agent_file import AgentFileExport
    agent_file = AgentFileExport.model_validate(data)
    # Import memories + entities (entity dedup handled by upsert_entity)
    store = PostgresGraphStore(session)
    imported_entities = 0
    for entity in agent_file.entities:
        await store.upsert_entity(
            org_id=auth.org_id,
            name=entity.name,
            entity_type=entity.type,
            description=entity.description,
            embedding=None,
        )
        imported_entities += 1
    await session.commit()
    return {"imported_entities": imported_entities, "imported_memories": len(agent_file.memories)}
```

**Step 4: Run tests + lint + commit**

```bash
cd apps/api && uv run pytest tests/test_agent_file.py -v
uv run ruff check app/ tests/ --fix && uv run ruff format app/ tests/
git add apps/api/app/memory/graph/agent_file.py apps/api/app/memory/graph/router.py apps/api/tests/test_agent_file.py
git commit -m "feat(memory): Agent File export/import format (#549)

JSON format with version validation, deterministic key ordering,
export agent memories + knowledge subgraph, import with entity dedup"
```

---

## Task 6: MCP Tools for Graph

**Files:**
- Modify: `apps/mcp/` — add graph tools (or `apps/api/app/mcp/` if MCP is in API)
- Test: `apps/api/tests/test_graph_mcp.py`

**Step 1: Locate MCP server**

Check `apps/mcp/` structure. Add 4 new tools:
- `memory_graph_entities` — list entities the agent knows
- `memory_graph_related` — find entities related to a concept
- `memory_graph_who_knows` — which agents know about entity X
- `memory_graph_gaps` — org knowledge gaps

Implementation depends on existing MCP server structure. Each tool calls the corresponding graph API endpoint.

**Step 2: Write tests for tool registration**

```python
"""Tests for graph MCP tools."""

from __future__ import annotations


class TestGraphMCPTools:
    def test_graph_entities_tool_exists(self) -> None:
        # Verify tool is registered in MCP server
        pass  # Implementation depends on MCP server structure

    def test_graph_related_tool_exists(self) -> None:
        pass

    def test_graph_who_knows_tool_exists(self) -> None:
        pass

    def test_graph_gaps_tool_exists(self) -> None:
        pass
```

**Step 3: Implement + lint + commit**

```bash
git commit -m "feat(mcp): add knowledge graph tools

memory_graph_entities, memory_graph_related,
memory_graph_who_knows, memory_graph_gaps"
```

---

## Task 7: Demo Fixtures for Graph

**Files:**
- Create: `libs/demo-data/src/fixtures/graph.ts`
- Modify: `libs/demo-data/src/fixtures/index.ts` — export graph fixtures

**Step 1: Create graph fixtures**

Create `libs/demo-data/src/fixtures/graph.ts`:

```typescript
import { AGENT_IDS } from "./agents";
import { MEMORY_IDS } from "./memory";

export const ENTITY_IDS = {
  docker: "e0000000-0000-0000-0000-000000000001",
  ciPipeline: "e0000000-0000-0000-0000-000000000002",
  redis: "e0000000-0000-0000-0000-000000000003",
  deployment: "e0000000-0000-0000-0000-000000000004",
  caddy: "e0000000-0000-0000-0000-000000000005",
  monitoring: "e0000000-0000-0000-0000-000000000006",
  caching: "e0000000-0000-0000-0000-000000000007",
  loadBalancing: "e0000000-0000-0000-0000-000000000008",
  security: "e0000000-0000-0000-0000-000000000009",
  database: "e0000000-0000-0000-0000-000000000010",
  api: "e0000000-0000-0000-0000-000000000011",
  testing: "e0000000-0000-0000-0000-000000000012",
  kubernetes: "e0000000-0000-0000-0000-000000000013",
  logging: "e0000000-0000-0000-0000-000000000014",
  authentication: "e0000000-0000-0000-0000-000000000015",
  rateLimit: "e0000000-0000-0000-0000-000000000016",
  webhook: "e0000000-0000-0000-0000-000000000017",
  pgvector: "e0000000-0000-0000-0000-000000000018",
  nginx: "e0000000-0000-0000-0000-000000000019",
  ssl: "e0000000-0000-0000-0000-000000000020",
} as const;

export interface DemoEntity {
  id: string;
  name: string;
  entityType: string;
  description: string;
  mentionCount: number;
  confidence: number;
  agentIds: string[];
}

export interface DemoRelationship {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: string;
  weight: number;
  evidenceCount: number;
}

export const demoEntities: DemoEntity[] = [
  { id: ENTITY_IDS.docker, name: "docker", entityType: "tool", description: "Container platform for deployment", mentionCount: 8, confidence: 88, agentIds: [AGENT_IDS.spongebob, AGENT_IDS.sandy] },
  { id: ENTITY_IDS.ciPipeline, name: "ci pipeline", entityType: "process", description: "Continuous integration workflow", mentionCount: 6, confidence: 85, agentIds: [AGENT_IDS.spongebob, AGENT_IDS.squidward] },
  { id: ENTITY_IDS.redis, name: "redis", entityType: "tool", description: "In-memory data store for caching and queues", mentionCount: 7, confidence: 90, agentIds: [AGENT_IDS.spongebob, AGENT_IDS.sandy, AGENT_IDS.patrick] },
  { id: ENTITY_IDS.deployment, name: "deployment", entityType: "process", description: "Production deployment pipeline", mentionCount: 5, confidence: 82, agentIds: [AGENT_IDS.sandy] },
  { id: ENTITY_IDS.caddy, name: "caddy", entityType: "tool", description: "Reverse proxy with auto-HTTPS", mentionCount: 3, confidence: 78, agentIds: [AGENT_IDS.sandy] },
  { id: ENTITY_IDS.monitoring, name: "monitoring", entityType: "concept", description: "System observability and alerting", mentionCount: 4, confidence: 75, agentIds: [AGENT_IDS.squidward] },
  { id: ENTITY_IDS.caching, name: "caching", entityType: "concept", description: "Data caching strategies", mentionCount: 5, confidence: 86, agentIds: [AGENT_IDS.spongebob, AGENT_IDS.patrick] },
  { id: ENTITY_IDS.loadBalancing, name: "load balancing", entityType: "concept", description: "Traffic distribution across servers", mentionCount: 2, confidence: 70, agentIds: [AGENT_IDS.sandy] },
  { id: ENTITY_IDS.security, name: "security", entityType: "concept", description: "Application security practices", mentionCount: 3, confidence: 72, agentIds: [AGENT_IDS.squidward] },
  { id: ENTITY_IDS.database, name: "postgres", entityType: "tool", description: "Primary relational database", mentionCount: 9, confidence: 92, agentIds: [AGENT_IDS.spongebob, AGENT_IDS.sandy, AGENT_IDS.squidward] },
  { id: ENTITY_IDS.api, name: "fastapi", entityType: "tool", description: "Python web framework for REST APIs", mentionCount: 6, confidence: 88, agentIds: [AGENT_IDS.spongebob, AGENT_IDS.sandy] },
  { id: ENTITY_IDS.testing, name: "testing", entityType: "process", description: "Automated test suite", mentionCount: 4, confidence: 80, agentIds: [AGENT_IDS.spongebob] },
  { id: ENTITY_IDS.kubernetes, name: "kubernetes", entityType: "tool", description: "Container orchestration (future)", mentionCount: 1, confidence: 40, agentIds: [AGENT_IDS.sandy] },
  { id: ENTITY_IDS.logging, name: "structured logging", entityType: "concept", description: "structlog-based application logging", mentionCount: 3, confidence: 76, agentIds: [AGENT_IDS.squidward] },
  { id: ENTITY_IDS.authentication, name: "authentication", entityType: "concept", description: "API key + HMAC auth system", mentionCount: 4, confidence: 84, agentIds: [AGENT_IDS.spongebob, AGENT_IDS.squidward] },
  { id: ENTITY_IDS.rateLimit, name: "rate limiting", entityType: "concept", description: "Per-agent request throttling", mentionCount: 3, confidence: 82, agentIds: [AGENT_IDS.spongebob] },
  { id: ENTITY_IDS.webhook, name: "webhook", entityType: "concept", description: "Event notification system", mentionCount: 2, confidence: 68, agentIds: [AGENT_IDS.patrick] },
  { id: ENTITY_IDS.pgvector, name: "pgvector", entityType: "tool", description: "Postgres vector similarity extension", mentionCount: 5, confidence: 90, agentIds: [AGENT_IDS.spongebob, AGENT_IDS.sandy] },
  { id: ENTITY_IDS.nginx, name: "nginx", entityType: "tool", description: "Web server (replaced by Caddy)", mentionCount: 1, confidence: 35, agentIds: [AGENT_IDS.sandy] },
  { id: ENTITY_IDS.ssl, name: "ssl certificates", entityType: "concept", description: "HTTPS certificate management", mentionCount: 2, confidence: 74, agentIds: [AGENT_IDS.sandy] },
];

export const demoRelationships: DemoRelationship[] = [
  { id: "r001", sourceEntityId: ENTITY_IDS.docker, targetEntityId: ENTITY_IDS.deployment, relationshipType: "used_in", weight: 0.9, evidenceCount: 4 },
  { id: "r002", sourceEntityId: ENTITY_IDS.ciPipeline, targetEntityId: ENTITY_IDS.docker, relationshipType: "builds", weight: 0.85, evidenceCount: 3 },
  { id: "r003", sourceEntityId: ENTITY_IDS.redis, targetEntityId: ENTITY_IDS.caching, relationshipType: "implements", weight: 0.9, evidenceCount: 5 },
  { id: "r004", sourceEntityId: ENTITY_IDS.caddy, targetEntityId: ENTITY_IDS.ssl, relationshipType: "manages", weight: 0.8, evidenceCount: 2 },
  { id: "r005", sourceEntityId: ENTITY_IDS.caddy, targetEntityId: ENTITY_IDS.loadBalancing, relationshipType: "provides", weight: 0.7, evidenceCount: 1 },
  { id: "r006", sourceEntityId: ENTITY_IDS.api, targetEntityId: ENTITY_IDS.database, relationshipType: "connects_to", weight: 0.95, evidenceCount: 6 },
  { id: "r007", sourceEntityId: ENTITY_IDS.api, targetEntityId: ENTITY_IDS.redis, relationshipType: "uses", weight: 0.85, evidenceCount: 4 },
  { id: "r008", sourceEntityId: ENTITY_IDS.database, targetEntityId: ENTITY_IDS.pgvector, relationshipType: "extends_with", weight: 0.9, evidenceCount: 3 },
  { id: "r009", sourceEntityId: ENTITY_IDS.api, targetEntityId: ENTITY_IDS.authentication, relationshipType: "enforces", weight: 0.9, evidenceCount: 4 },
  { id: "r010", sourceEntityId: ENTITY_IDS.api, targetEntityId: ENTITY_IDS.rateLimit, relationshipType: "enforces", weight: 0.85, evidenceCount: 3 },
  { id: "r011", sourceEntityId: ENTITY_IDS.monitoring, targetEntityId: ENTITY_IDS.logging, relationshipType: "includes", weight: 0.8, evidenceCount: 2 },
  { id: "r012", sourceEntityId: ENTITY_IDS.ciPipeline, targetEntityId: ENTITY_IDS.testing, relationshipType: "runs", weight: 0.9, evidenceCount: 3 },
  { id: "r013", sourceEntityId: ENTITY_IDS.nginx, targetEntityId: ENTITY_IDS.caddy, relationshipType: "replaced_by", weight: 0.6, evidenceCount: 1 },
  { id: "r014", sourceEntityId: ENTITY_IDS.deployment, targetEntityId: ENTITY_IDS.caddy, relationshipType: "proxied_by", weight: 0.8, evidenceCount: 2 },
  { id: "r015", sourceEntityId: ENTITY_IDS.webhook, targetEntityId: ENTITY_IDS.api, relationshipType: "calls", weight: 0.7, evidenceCount: 2 },
];

export function getCytoscapeData() {
  return {
    nodes: demoEntities.map((e) => ({
      data: { id: e.id, label: e.name, type: e.entityType, mention_count: e.mentionCount, confidence: e.confidence },
    })),
    edges: demoRelationships.map((r) => ({
      data: { id: r.id, source: r.sourceEntityId, target: r.targetEntityId, label: r.relationshipType, weight: r.weight },
    })),
  };
}
```

**Step 2: Export from index**

Add to `libs/demo-data/src/fixtures/index.ts`:

```typescript
export * from "./graph";
```

**Step 3: Lint + commit**

```bash
pnpm exec nx lint demo-data
git add libs/demo-data/src/fixtures/graph.ts libs/demo-data/src/fixtures/index.ts
git commit -m "feat(demo): add knowledge graph fixtures

20 entities, 15 relationships, Cytoscape.js data formatter"
```

---

## Task 8: Dashboard — Graph Visualization Page

**Files:**
- Create: `apps/demo/src/pages/graph.tsx`
- Modify: `apps/demo/src/pages/index.ts` — export GraphPage
- Modify: `apps/demo/src/pages/routes.tsx` — add `/graph` route
- Modify: `apps/demo/src/components/layout.tsx` — add nav link

**Step 1: Install Cytoscape.js**

```bash
pnpm add cytoscape
pnpm add -D @types/cytoscape
```

**Step 2: Create graph page**

Create `apps/demo/src/pages/graph.tsx` with:
- Cytoscape.js canvas rendering graph from demo fixtures (or API if backend available)
- Nodes colored by entity type, sized by mention_count
- Edges labeled by relationship type, weighted by strength
- Sidebar: entity type filter, search input
- Click node: panel showing entity details + linked memories + agent list
- Click edge: panel showing evidence
- Stats: total entities, relationships, avg confidence

**Step 3: Add route + nav**

Add to `routes.tsx`:

```typescript
import { GraphPage } from "../pages/graph";
// In layout children:
createRoute({ getParentRoute: () => layoutRoute, path: "/graph", component: GraphPage }),
```

Add to `pages/index.ts`:

```typescript
export * from "./graph";
```

Add nav link in `layout.tsx`:
```typescript
{ to: "/graph", label: "Graph", icon: Share2 }
```

**Step 4: Lint + build + commit**

```bash
pnpm exec nx lint demo && pnpm exec nx build demo
git add apps/demo/src/pages/graph.tsx apps/demo/src/pages/index.ts apps/demo/src/pages/routes.tsx apps/demo/src/components/layout.tsx
git commit -m "feat(dashboard): knowledge graph visualization page

Cytoscape.js force-directed graph, entity filtering, click-to-inspect,
demo mode with fixture data"
```

---

## Task 9: Dashboard — Memory Page Feedback + Contradictions Panels

**Files:**
- Modify: `apps/demo/src/pages/memory.tsx` — add feedback buttons + contradictions panel

**Step 1: Add feedback buttons to MemoryCard**

In the MemoryCard component, add thumbs-up/thumbs-down buttons that call `POST /memory/{id}/feedback`. In demo mode, toggle local state.

**Step 2: Add contradictions panel**

Below the memory list, add a "Contradictions" section showing linked pairs from `GET /memory/contradictions`. Each pair shows resolve button with strategy dropdown.

In demo mode, show 2-3 fixture contradiction pairs.

**Step 3: Lint + build + commit**

```bash
pnpm exec nx lint demo && pnpm exec nx build demo
git add apps/demo/src/pages/memory.tsx
git commit -m "feat(dashboard): feedback buttons + contradictions panel

complete Phase 2 unfinished frontend work on memory page"
```

---

## Task 10: OpenAPI Schema + Frontend Types

**Files:**
- Modify: `apps/api/openapi.json` — regenerate
- Modify: `libs/dashboard-data/src/rest/generated/schema.d.ts` — regenerate

**Step 1: Export updated OpenAPI schema**

```bash
cd apps/api && uv run python scripts/export_openapi.py > openapi.json
```

**Step 2: Regenerate TypeScript types**

```bash
pnpm run codegen:rest
```

**Step 3: Commit**

```bash
git add apps/api/openapi.json libs/dashboard-data/src/rest/generated/
git commit -m "chore(api): regenerate OpenAPI schema + frontend types

includes graph endpoints, agent file, overlap, gaps"
```

---

## Task 11: Integration Tests

**Files:**
- Create: `apps/api/tests/test_graph_integration.py`

**Step 1: Write integration tests**

```python
"""Integration tests for knowledge graph (requires DB + MEMORY_INTEGRATION_TEST=1)."""

from __future__ import annotations

import os
import uuid

import pytest

pytestmark = pytest.mark.skipif(
    not os.getenv("MEMORY_INTEGRATION_TEST"),
    reason="Set MEMORY_INTEGRATION_TEST=1",
)


class TestEntityExtractionIntegration:
    async def test_store_memory_triggers_extraction(self) -> None:
        """Store a memory, run extraction, verify entities appear."""
        pass

    async def test_entity_dedup_across_agents(self) -> None:
        """Two agents store memories about Docker → single entity."""
        pass


class TestVisibilityEnforcement:
    async def test_private_memory_entities_excluded(self) -> None:
        """Private memory entities not in org-wide graph."""
        pass


class TestAgentFileRoundTrip:
    async def test_export_import_preserves_data(self) -> None:
        """Export agent file, import into new org, verify entities."""
        pass


class TestOverlapComputation:
    async def test_overlap_matrix_3_agents(self) -> None:
        """3 agents with shared entities → correct Jaccard scores."""
        pass
```

**Step 2: Commit**

```bash
git add apps/api/tests/test_graph_integration.py
git commit -m "test(memory): integration test stubs for knowledge graph

extraction, dedup, visibility, agent file, overlap"
```

---

## Task 12: Final PR + Merge

**Step 1: Run full test suite**

```bash
cd apps/api && uv run ruff check app/ tests/ --fix && uv run ruff format app/ tests/
uv run pytest tests/ -v --ignore=tests/test_memory_integration.py --ignore=tests/test_memory_load.py
pnpm exec nx lint demo
pnpm exec nx build demo
```

**Step 2: Create PR**

```bash
git push -u origin adamwdennis/feat-548-knowledge-graph
gh pr create --title "feat(memory): knowledge graph + agent file + overlap (#548, #549, #550)" --body "..."
```

**Step 3: Merge**

```bash
gh pr merge --squash --admin
```

---

## Execution Order Summary

```
Task 1:  Graph models + Alembic migration
Task 2:  GraphStore protocol + Postgres implementation
Task 3:  Entity extraction pipeline + arq worker
Task 4:  Graph API router + endpoints
Task 5:  Agent File export/import (#549)
Task 6:  MCP tools for graph
Task 7:  Demo fixtures
Task 8:  Dashboard graph visualization page
Task 9:  Dashboard memory page feedback + contradictions
Task 10: OpenAPI schema + frontend types
Task 11: Integration tests
Task 12: Final PR + merge
```

Dependencies: Tasks 1-5 are sequential (each builds on prior). Tasks 6-9 are parallelizable after Task 5. Tasks 10-12 are final.
