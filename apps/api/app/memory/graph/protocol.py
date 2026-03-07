from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Protocol, runtime_checkable

if TYPE_CHECKING:
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
        self,
        org_id: uuid.UUID,
        name: str,
        entity_type: str,
        description: str = "",
        embedding: list[float] | None = None,
        metadata: dict | None = None,
    ) -> uuid.UUID: ...

    async def get_entity(self, entity_id: uuid.UUID) -> GraphEntityResponse | None: ...

    async def find_entity(
        self, org_id: uuid.UUID, name: str, entity_type: str
    ) -> GraphEntityResponse | None: ...

    async def find_similar_entity(
        self,
        org_id: uuid.UUID,
        embedding: list[float],
        threshold: float = 0.90,
    ) -> GraphEntityResponse | None: ...

    async def list_entities(
        self,
        org_id: uuid.UUID,
        entity_type: str | None = None,
        limit: int = 100,
    ) -> list[GraphEntityResponse]: ...

    async def merge_entities(
        self, keep_id: uuid.UUID, merge_id: uuid.UUID
    ) -> GraphEntityResponse: ...

    async def upsert_relationship(
        self,
        org_id: uuid.UUID,
        source_id: uuid.UUID,
        target_id: uuid.UUID,
        rel_type: str,
        weight: float = 0.5,
        evidence_memory_ids: list[uuid.UUID] | None = None,
    ) -> uuid.UUID: ...

    async def get_relationships(
        self, entity_id: uuid.UUID, direction: str = "both"
    ) -> list[GraphRelationshipResponse]: ...

    async def link_memory_entity(
        self, memory_id: uuid.UUID, entity_id: uuid.UUID, agent_id: uuid.UUID
    ) -> None: ...

    async def get_neighbors(self, entity_id: uuid.UUID, hops: int = 1) -> SubGraph: ...

    async def get_agent_entities(
        self, org_id: uuid.UUID, agent_id: uuid.UUID
    ) -> list[GraphEntityResponse]: ...

    async def get_entity_agents(self, entity_id: uuid.UUID) -> list[uuid.UUID]: ...

    async def compute_overlap(
        self, org_id: uuid.UUID, agent_a: uuid.UUID, agent_b: uuid.UUID
    ) -> OverlapResult: ...

    async def find_gaps(self, org_id: uuid.UUID) -> list[GapResult]: ...

    async def export_agent_subgraph(self, org_id: uuid.UUID, agent_id: uuid.UUID) -> SubGraph: ...

    async def export_org_graph(self, org_id: uuid.UUID) -> SubGraph: ...
