from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Index, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.compat import CompatVector
from app.models.memory import EMBEDDING_DIMENSIONS


class GraphEntity(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "graph_entities"
    __table_args__ = (
        UniqueConstraint("org_id", "name", "entity_type", name="uq_graph_entity_org_name_type"),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    embedding: Mapped[list[float] | None] = mapped_column(
        CompatVector(EMBEDDING_DIMENSIONS), nullable=True
    )
    mention_count: Mapped[int] = mapped_column(nullable=False, server_default="0")
    confidence: Mapped[float] = mapped_column(nullable=False, server_default="50.0")
    last_seen_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, server_default="{}")


class GraphRelationship(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "graph_relationships"

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    source_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("graph_entities.id"),
        nullable=False,
        index=True,
    )
    target_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("graph_entities.id"),
        nullable=False,
        index=True,
    )
    relationship_type: Mapped[str] = mapped_column(String(100), nullable=False)
    weight: Mapped[float] = mapped_column(nullable=False, server_default="0.5")
    last_seen_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    evidence_count: Mapped[int] = mapped_column(nullable=False, server_default="1")
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, server_default="{}")


class MemoryEntityLink(Base):
    __tablename__ = "memory_entity_links"
    __table_args__ = (
        Index("ix_memory_entity_links_entity_id", "entity_id"),
        Index("ix_memory_entity_links_agent_id", "agent_id"),
    )

    memory_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("memories.id"), primary_key=True
    )
    entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("graph_entities.id"), primary_key=True
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
