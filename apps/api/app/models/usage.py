"""Usage tracking model for hosted mode."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDPrimaryKeyMixin
from app.models.compat import CompatUUID


class UsageCounter(UUIDPrimaryKeyMixin, Base):
    """Simple per-user API call counter."""

    __tablename__ = "usage_counters"
    __table_args__ = (Index("ix_usage_counters_user_id", "user_id", unique=True),)

    user_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    call_count: Mapped[int] = mapped_column(nullable=False, server_default="0")
    last_call_at: Mapped[datetime | None] = mapped_column(nullable=True)
