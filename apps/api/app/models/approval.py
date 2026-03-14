from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, ForeignKey, Index, SmallInteger, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPrimaryKeyMixin
from app.models.compat import CompatJSONB, CompatUUID


class ApprovalRequest(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "approval_requests"
    __table_args__ = (
        CheckConstraint(
            "risk_level >= 0 AND risk_level <= 10", name="chk_approval_risk_level"
        ),
        CheckConstraint(
            "autonomy_level >= 0 AND autonomy_level <= 10",
            name="chk_approval_autonomy_level",
        ),
        Index("ix_approval_requests_org_id_status", "org_id", "status"),
        Index("ix_approval_requests_org_id_requested_by", "org_id", "requested_by"),
        Index("ix_approval_requests_org_id_entity_id", "org_id", "entity_id"),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("organizations.id"), nullable=False
    )
    requested_by: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("agents.id"), nullable=False
    )
    action_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(CompatUUID(), nullable=False)
    risk_level: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    autonomy_level: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    payload: Mapped[dict[str, object]] = mapped_column(CompatJSONB(), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="pending")
    resolved_by: Mapped[uuid.UUID | None] = mapped_column(CompatUUID(), nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now(), nullable=False
    )

    requester = relationship("Agent", foreign_keys=[requested_by], lazy="selectin")
