from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.compat import CompatUUID


class EventSubscription(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "event_subscriptions"
    __table_args__ = (
        UniqueConstraint("org_id", "agent_id", "event_pattern", name="uq_event_sub_agent_pattern"),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("organizations.id"), nullable=False
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("agents.id"), nullable=False
    )
    event_pattern: Mapped[str] = mapped_column(String(100), nullable=False)
    task_id: Mapped[uuid.UUID | None] = mapped_column(
        CompatUUID(), ForeignKey("tasks.id"), nullable=True
    )

    agent = relationship("Agent", lazy="selectin")
