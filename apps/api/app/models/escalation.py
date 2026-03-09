from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Index, SmallInteger, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPrimaryKeyMixin
from app.models.compat import CompatJSONB


class Escalation(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "escalations"
    __table_args__ = (
        Index("ix_escalations_org_id_task_id", "org_id", "task_id"),
        Index("ix_escalations_org_id_from_agent_id", "org_id", "from_agent_id"),
        Index("ix_escalations_org_id_to_agent_id", "org_id", "to_agent_id"),
        Index("ix_escalations_org_id_created_at", "org_id", "created_at"),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False
    )
    from_agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False
    )
    to_agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False
    )
    reason: Mapped[str] = mapped_column(String(50), nullable=False)
    levels_escalated: Mapped[int] = mapped_column(SmallInteger, nullable=False, server_default="1")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_automatic: Mapped[bool] = mapped_column(nullable=False, server_default="true")
    resolved_at: Mapped[datetime | None] = mapped_column(nullable=True)
    metadata_: Mapped[dict] = mapped_column(
        "metadata", CompatJSONB(), nullable=False, server_default="{}"
    )
    created_at: Mapped[datetime] = mapped_column(server_default="now()", nullable=False)

    organization: Mapped[Organization] = relationship("Organization")
    task: Mapped[Task] = relationship("Task")
    from_agent: Mapped[Agent] = relationship("Agent", foreign_keys=[from_agent_id])
    to_agent: Mapped[Agent] = relationship("Agent", foreign_keys=[to_agent_id])


from app.models.agent import Agent  # noqa: E402
from app.models.organization import Organization  # noqa: E402
from app.models.task import Task  # noqa: E402
