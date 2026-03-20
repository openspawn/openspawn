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
        Index("ix_events_org_id_type_created_at", "org_id", "type", "created_at"),
        Index("ix_events_org_id_entity_type_entity_id", "org_id", "entity_type", "entity_id"),
        Index("ix_events_org_id_actor_id_created_at", "org_id", "actor_id", "created_at"),
        Index("ix_events_org_id_created_at", "org_id", "created_at"),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("organizations.id"), nullable=False
    )
    type: Mapped[str] = mapped_column(String(100), nullable=False)
    actor_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("agents.id"), nullable=False
    )
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(CompatUUID(), nullable=False)
    data: Mapped[dict] = mapped_column(CompatJSONB(), nullable=False)
    severity: Mapped[str] = mapped_column(
        String(10), nullable=False, server_default=EventSeverity.INFO.value
    )
    reasoning: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)

    organization: Mapped[Organization] = relationship("Organization")
    actor: Mapped[Agent] = relationship("Agent")


from app.models.agent import Agent  # noqa: E402
from app.models.organization import Organization  # noqa: E402
