from __future__ import annotations

import uuid
from collections import deque
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import and_, delete, func, or_, select, update

from app.memory.graph.schemas import (
    GapResult,
    GraphEntityResponse,
    GraphRelationshipResponse,
    OverlapResult,
    SubGraph,
)
from app.models.graph import GraphEntity, GraphRelationship, MemoryEntityLink

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession


def _entity_response(entity: GraphEntity) -> GraphEntityResponse:
    return GraphEntityResponse.model_validate(entity)


def _relationship_response(rel: GraphRelationship) -> GraphRelationshipResponse:
    return GraphRelationshipResponse.model_validate(rel)


class PostgresGraphStore:
    def __init__(self, session: AsyncSession | None = None) -> None:
        self._session = session

    @property
    def session(self) -> AsyncSession:
        if self._session is None:
            msg = "No database session configured"
            raise RuntimeError(msg)
        return self._session

    def set_session(self, session: AsyncSession) -> None:
        self._session = session

    async def upsert_entity(
        self,
        org_id: uuid.UUID,
        name: str,
        entity_type: str,
        description: str = "",
        embedding: list[float] | None = None,
        metadata: dict | None = None,
    ) -> uuid.UUID:
        normalized = name.strip().lower()
        existing = await self.find_entity(org_id, normalized, entity_type)
        now = datetime.now(UTC)

        if existing:
            stmt = (
                update(GraphEntity)
                .where(GraphEntity.id == existing.id)
                .values(
                    mention_count=GraphEntity.mention_count + 1,
                    last_seen_at=now,
                    description=description or existing.description,
                    embedding=embedding or None,
                )
            )
            await self.session.execute(stmt)
            await self.session.flush()
            return existing.id

        entity = GraphEntity(
            org_id=org_id,
            name=normalized,
            entity_type=entity_type,
            description=description,
            embedding=embedding,
            mention_count=1,
            last_seen_at=now,
            metadata_=metadata or {},
        )
        self.session.add(entity)
        await self.session.flush()
        return entity.id

    async def get_entity(self, entity_id: uuid.UUID) -> GraphEntityResponse | None:
        result = await self.session.execute(select(GraphEntity).where(GraphEntity.id == entity_id))
        entity = result.scalar_one_or_none()
        if entity is None:
            return None
        return _entity_response(entity)

    async def find_entity(
        self, org_id: uuid.UUID, name: str, entity_type: str
    ) -> GraphEntityResponse | None:
        normalized = name.strip().lower()
        result = await self.session.execute(
            select(GraphEntity).where(
                GraphEntity.org_id == org_id,
                GraphEntity.name == normalized,
                GraphEntity.entity_type == entity_type,
            )
        )
        entity = result.scalar_one_or_none()
        if entity is None:
            return None
        return _entity_response(entity)

    async def find_similar_entity(
        self,
        org_id: uuid.UUID,
        embedding: list[float],
        threshold: float = 0.90,
    ) -> GraphEntityResponse | None:
        distance = GraphEntity.embedding.cosine_distance(embedding)
        result = await self.session.execute(
            select(GraphEntity)
            .where(
                GraphEntity.org_id == org_id,
                GraphEntity.embedding.isnot(None),
                (1 - distance) >= threshold,
            )
            .order_by(distance)
            .limit(1)
        )
        entity = result.scalar_one_or_none()
        if entity is None:
            return None
        return _entity_response(entity)

    async def list_entities(
        self,
        org_id: uuid.UUID,
        entity_type: str | None = None,
        limit: int = 100,
    ) -> list[GraphEntityResponse]:
        q = select(GraphEntity).where(GraphEntity.org_id == org_id)
        if entity_type is not None:
            q = q.where(GraphEntity.entity_type == entity_type)
        q = q.order_by(GraphEntity.mention_count.desc()).limit(limit)
        result = await self.session.execute(q)
        return [_entity_response(e) for e in result.scalars().all()]

    async def merge_entities(self, keep_id: uuid.UUID, merge_id: uuid.UUID) -> GraphEntityResponse:
        # Move MemoryEntityLinks from merge -> keep
        await self.session.execute(
            update(MemoryEntityLink)
            .where(MemoryEntityLink.entity_id == merge_id)
            .values(entity_id=keep_id)
        )

        # Move relationships: source
        await self.session.execute(
            update(GraphRelationship)
            .where(GraphRelationship.source_entity_id == merge_id)
            .values(source_entity_id=keep_id)
        )

        # Move relationships: target
        await self.session.execute(
            update(GraphRelationship)
            .where(GraphRelationship.target_entity_id == merge_id)
            .values(target_entity_id=keep_id)
        )

        # Sum mention counts
        merged = await self.session.execute(select(GraphEntity).where(GraphEntity.id == merge_id))
        merged_entity = merged.scalar_one_or_none()
        merged_count = merged_entity.mention_count if merged_entity else 0

        await self.session.execute(
            update(GraphEntity)
            .where(GraphEntity.id == keep_id)
            .values(mention_count=GraphEntity.mention_count + merged_count)
        )

        # Delete merged entity
        await self.session.execute(delete(GraphEntity).where(GraphEntity.id == merge_id))
        await self.session.flush()

        entity = await self.get_entity(keep_id)
        if entity is None:
            msg = f"Entity {keep_id} not found after merge"
            raise ValueError(msg)
        return entity

    async def upsert_relationship(
        self,
        org_id: uuid.UUID,
        source_id: uuid.UUID,
        target_id: uuid.UUID,
        rel_type: str,
        weight: float = 0.5,
        evidence_memory_ids: list[uuid.UUID] | None = None,
    ) -> uuid.UUID:
        result = await self.session.execute(
            select(GraphRelationship).where(
                GraphRelationship.org_id == org_id,
                GraphRelationship.source_entity_id == source_id,
                GraphRelationship.target_entity_id == target_id,
                GraphRelationship.relationship_type == rel_type,
            )
        )
        existing = result.scalar_one_or_none()
        now = datetime.now(UTC)

        if existing:
            new_weight = min(1.0, existing.weight + 0.1)
            stmt = (
                update(GraphRelationship)
                .where(GraphRelationship.id == existing.id)
                .values(
                    evidence_count=GraphRelationship.evidence_count + 1,
                    weight=new_weight,
                    last_seen_at=now,
                )
            )
            await self.session.execute(stmt)
            await self.session.flush()
            return existing.id

        rel = GraphRelationship(
            org_id=org_id,
            source_entity_id=source_id,
            target_entity_id=target_id,
            relationship_type=rel_type,
            weight=weight,
            last_seen_at=now,
            metadata_={"evidence_memory_ids": [str(m) for m in (evidence_memory_ids or [])]},
        )
        self.session.add(rel)
        await self.session.flush()
        return rel.id

    async def get_relationships(
        self, entity_id: uuid.UUID, direction: str = "both"
    ) -> list[GraphRelationshipResponse]:
        if direction == "outgoing":
            condition = GraphRelationship.source_entity_id == entity_id
        elif direction == "incoming":
            condition = GraphRelationship.target_entity_id == entity_id
        else:
            condition = or_(
                GraphRelationship.source_entity_id == entity_id,
                GraphRelationship.target_entity_id == entity_id,
            )

        result = await self.session.execute(select(GraphRelationship).where(condition))
        return [_relationship_response(r) for r in result.scalars().all()]

    async def link_memory_entity(
        self, memory_id: uuid.UUID, entity_id: uuid.UUID, agent_id: uuid.UUID
    ) -> None:
        existing = await self.session.execute(
            select(MemoryEntityLink).where(
                MemoryEntityLink.memory_id == memory_id,
                MemoryEntityLink.entity_id == entity_id,
            )
        )
        if existing.scalar_one_or_none() is not None:
            return

        link = MemoryEntityLink(
            memory_id=memory_id,
            entity_id=entity_id,
            agent_id=agent_id,
        )
        self.session.add(link)
        await self.session.flush()

    async def get_neighbors(self, entity_id: uuid.UUID, hops: int = 1) -> SubGraph:
        visited_ids: set[uuid.UUID] = set()
        all_relationships: list[GraphRelationshipResponse] = []
        queue: deque[tuple[uuid.UUID, int]] = deque([(entity_id, 0)])

        while queue:
            current_id, depth = queue.popleft()
            if current_id in visited_ids:
                continue
            visited_ids.add(current_id)

            if depth < hops:
                rels = await self.get_relationships(current_id)
                for rel in rels:
                    all_relationships.append(rel)
                    neighbor_id = (
                        rel.target_entity_id
                        if rel.source_entity_id == current_id
                        else rel.source_entity_id
                    )
                    if neighbor_id not in visited_ids:
                        queue.append((neighbor_id, depth + 1))

        entities: list[GraphEntityResponse] = []
        for eid in visited_ids:
            entity = await self.get_entity(eid)
            if entity is not None:
                entities.append(entity)

        seen_rel_ids: set[uuid.UUID] = set()
        unique_rels: list[GraphRelationshipResponse] = []
        for rel in all_relationships:
            if rel.id not in seen_rel_ids:
                seen_rel_ids.add(rel.id)
                unique_rels.append(rel)

        return SubGraph(entities=entities, relationships=unique_rels)

    async def get_agent_entities(
        self, org_id: uuid.UUID, agent_id: uuid.UUID
    ) -> list[GraphEntityResponse]:
        result = await self.session.execute(
            select(GraphEntity)
            .join(MemoryEntityLink, MemoryEntityLink.entity_id == GraphEntity.id)
            .where(
                GraphEntity.org_id == org_id,
                MemoryEntityLink.agent_id == agent_id,
            )
            .distinct()
        )
        return [_entity_response(e) for e in result.scalars().all()]

    async def get_entity_agents(self, entity_id: uuid.UUID) -> list[uuid.UUID]:
        result = await self.session.execute(
            select(MemoryEntityLink.agent_id)
            .where(MemoryEntityLink.entity_id == entity_id)
            .distinct()
        )
        return list(result.scalars().all())

    async def compute_overlap(
        self, org_id: uuid.UUID, agent_a: uuid.UUID, agent_b: uuid.UUID
    ) -> OverlapResult:
        entities_a = await self.get_agent_entities(org_id, agent_a)
        entities_b = await self.get_agent_entities(org_id, agent_b)

        ids_a = {e.id for e in entities_a}
        ids_b = {e.id for e in entities_b}

        shared_ids = ids_a & ids_b
        union_ids = ids_a | ids_b

        jaccard = len(shared_ids) / len(union_ids) if union_ids else 0.0
        shared = [e for e in entities_a if e.id in shared_ids]

        return OverlapResult(
            agent_a=agent_a,
            agent_b=agent_b,
            jaccard_score=jaccard,
            shared_count=len(shared_ids),
            union_count=len(union_ids),
            shared_entities=shared,
        )

    async def find_gaps(self, org_id: uuid.UUID) -> list[GapResult]:
        agent_count_sub = (
            select(
                MemoryEntityLink.entity_id,
                func.count(func.distinct(MemoryEntityLink.agent_id)).label("agent_count"),
            )
            .group_by(MemoryEntityLink.entity_id)
            .subquery()
        )

        result = await self.session.execute(
            select(
                GraphEntity.name,
                GraphEntity.entity_type,
                agent_count_sub.c.agent_count,
            )
            .join(agent_count_sub, agent_count_sub.c.entity_id == GraphEntity.id)
            .where(
                GraphEntity.org_id == org_id,
                agent_count_sub.c.agent_count == 1,
            )
            .order_by(GraphEntity.mention_count.desc())
        )

        gaps: list[GapResult] = []
        for row in result.all():
            risk = "high" if row.entity_type in ("process", "system") else "medium"
            gaps.append(
                GapResult(
                    entity_name=row.name,
                    entity_type=row.entity_type,
                    agent_count=row.agent_count,
                    risk=risk,
                )
            )
        return gaps

    async def export_agent_subgraph(self, org_id: uuid.UUID, agent_id: uuid.UUID) -> SubGraph:
        entities = await self.get_agent_entities(org_id, agent_id)
        entity_ids = {e.id for e in entities}

        if not entity_ids:
            return SubGraph(entities=[], relationships=[])

        result = await self.session.execute(
            select(GraphRelationship).where(
                and_(
                    GraphRelationship.org_id == org_id,
                    GraphRelationship.source_entity_id.in_(entity_ids),
                    GraphRelationship.target_entity_id.in_(entity_ids),
                )
            )
        )
        relationships = [_relationship_response(r) for r in result.scalars().all()]
        return SubGraph(entities=entities, relationships=relationships)

    async def export_org_graph(self, org_id: uuid.UUID) -> SubGraph:
        entity_result = await self.session.execute(
            select(GraphEntity).where(GraphEntity.org_id == org_id)
        )
        entities = [_entity_response(e) for e in entity_result.scalars().all()]

        rel_result = await self.session.execute(
            select(GraphRelationship).where(GraphRelationship.org_id == org_id)
        )
        relationships = [_relationship_response(r) for r in rel_result.scalars().all()]

        return SubGraph(entities=entities, relationships=relationships)
