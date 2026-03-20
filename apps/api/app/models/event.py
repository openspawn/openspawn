from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPrimaryKeyMixin
from app.models.compat import CompatJSONB, CompatUUID
from app.models.enums import EventSeverity


class Event(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "events"
    __table_args__ = (
        Index("ix_events_org_id_created_at", "org_id", "created_at"),
        Index("ix_events_agent_id", "agent_id"),
        Index("ix_events_event_type", "event_type"),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("organizations.id"), nullable=False
    )
    agent_id: Mapped[uuid.UUID | None] = mapped_column(
        CompatUUID(), ForeignKey("agents.id"), nullable=True
    )
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    severity: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default=EventSeverity.INFO.value
    )
    payload: Mapped[dict] = mapped_column(CompatJSONB(), nullable=False, server_default="{}")
    tags: Mapped[list] = mapped_column(CompatJSONB(), nullable=False, server_default="[]")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)

    # Relationships (for ORM convenience)
    agent: Mapped["Agent"] = relationship("Agent", back_populates="events")
