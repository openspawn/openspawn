from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Computed,
    ForeignKey,
    Index,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.compat import CompatArray, CompatJSONB, CompatTSVector, CompatUUID, CompatVector
from app.models.enums import MemorySource, MemoryType, MemoryVisibility

EMBEDDING_DIMENSIONS = 1024

SOURCE_CONFIDENCE: dict[MemorySource, int] = {
    MemorySource.TASK_COMPLETION: 90,
    MemorySource.CODE_CHANGE: 85,
    MemorySource.OBSERVATION: 60,
    MemorySource.INFERENCE: 40,
    MemorySource.UNKNOWN: 50,
}


class Memory(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "memories"
    __table_args__ = (
        UniqueConstraint("org_id", "agent_id", "content_hash", name="uq_memories_org_agent_hash"),
        Index("ix_memories_org_id_created_at", "org_id", "created_at"),
        Index("ix_memories_org_id_agent_id_created_at", "org_id", "agent_id", "created_at"),
        Index("ix_memories_org_id_type", "org_id", "type"),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("organizations.id"), nullable=False
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("agents.id"), nullable=False
    )
    type: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default=MemoryType.EPISODIC.value
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    raw_content: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    embedding: Mapped[list[float] | None] = mapped_column(
        CompatVector(EMBEDDING_DIMENSIONS), nullable=True
    )
    content_tsv: Mapped[str | None] = mapped_column(
        CompatTSVector(),
        Computed("to_tsvector('english', content)", persisted=True),
        nullable=True,
    )
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    visibility: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default=MemoryVisibility.SHARED.value
    )
    target_agent_ids: Mapped[list[uuid.UUID] | None] = mapped_column(
        CompatArray(CompatUUID()), nullable=True
    )
    confidence: Mapped[int] = mapped_column(SmallInteger, nullable=False, server_default="50")
    strength: Mapped[int] = mapped_column(SmallInteger, nullable=False, server_default="50")
    source: Mapped[str] = mapped_column(
        String(50), nullable=False, server_default=MemorySource.UNKNOWN.value
    )
    access_count: Mapped[int] = mapped_column(nullable=False, server_default="0")
    helpful_count: Mapped[int] = mapped_column(nullable=False, server_default="0")
    unhelpful_count: Mapped[int] = mapped_column(nullable=False, server_default="0")
    occurred_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(nullable=True)
    last_accessed_at: Mapped[datetime | None] = mapped_column(nullable=True)
    retrieval_context: Mapped[dict | None] = mapped_column(CompatJSONB(), nullable=True)
    metadata_: Mapped[dict] = mapped_column(
        "metadata", CompatJSONB(), nullable=False, server_default="{}"
    )
