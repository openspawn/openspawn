from __future__ import annotations

import uuid
from itertools import combinations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import AuthContext, require_auth
from app.database import get_db
from app.memory.graph.postgres_store import PostgresGraphStore
from app.memory.graph.schemas import (
    CytoscapeEdge,
    CytoscapeGraph,
    CytoscapeNode,
    GapResult,
    GraphEntityResponse,
    GraphRelationshipResponse,
    OverlapResult,
    SubGraph,
)
from app.models.graph import MemoryEntityLink
from app.models.memory import Memory
from app.schemas import DataResponse

router = APIRouter(prefix="/memory/graph", tags=["graph"])


def _get_store(session: AsyncSession = Depends(get_db)) -> PostgresGraphStore:
    return PostgresGraphStore(session)


# --- Entities ---


@router.get("/entities")
async def list_entities(
    entity_type: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    auth: AuthContext = Depends(require_auth),
    store: PostgresGraphStore = Depends(_get_store),
) -> DataResponse[list[GraphEntityResponse]]:
    entities = await store.list_entities(org_id=auth.org_id, entity_type=entity_type, limit=limit)
    return DataResponse(data=entities)


@router.get("/entities/{entity_id}")
async def get_entity(
    entity_id: uuid.UUID,
    auth: AuthContext = Depends(require_auth),
    store: PostgresGraphStore = Depends(_get_store),
) -> DataResponse[GraphEntityResponse]:
    entity = await store.get_entity(entity_id)
    if entity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entity not found")
    return DataResponse(data=entity)


@router.get("/entities/{entity_id}/memories")
async def list_entity_memories(
    entity_id: uuid.UUID,
    limit: int = Query(default=50, ge=1, le=200),
    auth: AuthContext = Depends(require_auth),
    session: AsyncSession = Depends(get_db),
) -> DataResponse[list[dict]]:
    result = await session.execute(
        select(Memory)
        .join(MemoryEntityLink, MemoryEntityLink.memory_id == Memory.id)
        .where(MemoryEntityLink.entity_id == entity_id)
        .order_by(Memory.created_at.desc())
        .limit(limit)
    )
    memories = result.scalars().all()
    return DataResponse(
        data=[
            {
                "id": str(m.id),
                "content": m.content,
                "confidence": m.confidence,
                "source": m.source,
                "agent_id": str(m.agent_id),
                "created_at": m.created_at.isoformat(),
            }
            for m in memories
        ]
    )


@router.get("/entities/{entity_id}/agents")
async def list_entity_agents(
    entity_id: uuid.UUID,
    auth: AuthContext = Depends(require_auth),
    store: PostgresGraphStore = Depends(_get_store),
) -> DataResponse[list[uuid.UUID]]:
    agent_ids = await store.get_entity_agents(entity_id)
    return DataResponse(data=agent_ids)


@router.get("/entities/{entity_id}/neighbors")
async def get_neighbors(
    entity_id: uuid.UUID,
    hops: int = Query(default=1, ge=1, le=3),
    auth: AuthContext = Depends(require_auth),
    store: PostgresGraphStore = Depends(_get_store),
) -> DataResponse[SubGraph]:
    subgraph = await store.get_neighbors(entity_id, hops=hops)
    return DataResponse(data=subgraph)


# --- Relationships ---


@router.get("/relationships")
async def get_relationships(
    entity_id: uuid.UUID = Query(),
    direction: str = Query(default="both"),
    auth: AuthContext = Depends(require_auth),
    store: PostgresGraphStore = Depends(_get_store),
) -> DataResponse[list[GraphRelationshipResponse]]:
    rels = await store.get_relationships(entity_id, direction=direction)
    return DataResponse(data=rels)


# --- Overlap ---


@router.get("/overlap")
async def compute_overlap(
    agent_a: uuid.UUID = Query(),
    agent_b: uuid.UUID = Query(),
    auth: AuthContext = Depends(require_auth),
    store: PostgresGraphStore = Depends(_get_store),
) -> DataResponse[OverlapResult]:
    result = await store.compute_overlap(auth.org_id, agent_a, agent_b)
    return DataResponse(data=result)


@router.get("/overlap/matrix")
async def overlap_matrix(
    auth: AuthContext = Depends(require_auth),
    session: AsyncSession = Depends(get_db),
    store: PostgresGraphStore = Depends(_get_store),
) -> DataResponse[list[OverlapResult]]:
    result = await session.execute(select(MemoryEntityLink.agent_id).distinct())
    agent_ids = list(result.scalars().all())

    matrix: list[OverlapResult] = []
    for a, b in combinations(agent_ids, 2):
        overlap = await store.compute_overlap(auth.org_id, a, b)
        matrix.append(overlap)
    return DataResponse(data=matrix)


# --- Gaps ---


@router.get("/gaps")
async def find_gaps(
    auth: AuthContext = Depends(require_auth),
    store: PostgresGraphStore = Depends(_get_store),
) -> DataResponse[list[GapResult]]:
    gaps = await store.find_gaps(auth.org_id)
    return DataResponse(data=gaps)


# --- Cytoscape ---


@router.get("/cytoscape")
async def cytoscape_graph(
    entity_type: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    auth: AuthContext = Depends(require_auth),
    store: PostgresGraphStore = Depends(_get_store),
) -> DataResponse[CytoscapeGraph]:
    entities = await store.list_entities(org_id=auth.org_id, entity_type=entity_type, limit=limit)
    entity_ids = {e.id for e in entities}

    nodes = [
        CytoscapeNode(
            data={
                "id": str(e.id),
                "label": e.name,
                "type": e.entity_type,
                "mention_count": e.mention_count,
                "confidence": e.confidence,
            }
        )
        for e in entities
    ]

    edges: list[CytoscapeEdge] = []
    for entity in entities:
        rels = await store.get_relationships(entity.id, direction="outgoing")
        for rel in rels:
            if rel.target_entity_id in entity_ids:
                edges.append(
                    CytoscapeEdge(
                        data={
                            "id": str(rel.id),
                            "source": str(rel.source_entity_id),
                            "target": str(rel.target_entity_id),
                            "label": rel.relationship_type,
                            "weight": rel.weight,
                        }
                    )
                )

    return DataResponse(data=CytoscapeGraph(nodes=nodes, edges=edges))


# --- Agent File ---


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
