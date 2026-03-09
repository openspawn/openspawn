from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Index, SmallInteger, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPrimaryKeyMixin
from app.models.compat import CompatJSONB


class ReputationEvent(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "reputation_events"
    __table_args__ = (
        Index("ix_reputation_events_org_id_agent_id", "org_id", "agent_id"),
        Index("ix_reputation_events_org_id_created_at", "org_id", "created_at"),
        Index("ix_reputation_events_agent_id_type", "agent_id", "type"),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False
    )
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    impact: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    previous_score: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    new_score: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    task_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=True
    )
    triggered_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id"), nullable=True
    )
    reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    metadata_: Mapped[dict] = mapped_column(
        "metadata", CompatJSONB(), nullable=False, server_default="{}"
    )
    created_at: Mapped[datetime] = mapped_column(server_default="now()", nullable=False)

    organization: Mapped[Organization] = relationship("Organization")
    agent: Mapped[Agent] = relationship("Agent", foreign_keys=[agent_id])
    task: Mapped[Task | None] = relationship("Task")
    triggered_by_agent: Mapped[Agent | None] = relationship("Agent", foreign_keys=[triggered_by])


from app.models.agent import Agent  # noqa: E402
from app.models.organization import Organization  # noqa: E402
from app.models.task import Task  # noqa: E402
