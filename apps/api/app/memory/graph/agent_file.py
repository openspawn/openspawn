"""Agent File export/import — portable agent knowledge format."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

import pendulum
import structlog
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select

from app.memory.graph.postgres_store import PostgresGraphStore
from app.models.memory import Memory

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger()

SUPPORTED_VERSIONS = {"1.0"}


class AgentFileMemory(BaseModel):
    content: str
    metadata: dict = Field(default_factory=dict)
    confidence: int = 50
    source: str = "unknown"
    visibility: str = "shared"
    created_at: str | None = None


class AgentFileEntity(BaseModel):
    name: str
    type: str
    description: str = ""


class AgentFileRelationship(BaseModel):
    source: str
    target: str
    type: str
    weight: float = 0.5


class AgentFileExport(BaseModel):
    version: str
    exported_at: str
    agent: dict
    memories: list[AgentFileMemory] = Field(default_factory=list)
    entities: list[AgentFileEntity] = Field(default_factory=list)
    relationships: list[AgentFileRelationship] = Field(default_factory=list)

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
    result = await session.execute(
        select(Memory)
        .where(
            Memory.org_id == org_id,
            Memory.agent_id == agent_id,
        )
        .order_by(Memory.created_at.desc())
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
            AgentFileEntity(name=e.name, type=e.entity_type, description=e.description)
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
