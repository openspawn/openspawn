"""Ideation session and brief models for cooperative ideation flow (#669)."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Index, SmallInteger, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPrimaryKeyMixin
from app.models.compat import CompatJSONB, CompatUUID


class IdeationSession(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "ideation_sessions"
    __table_args__ = (
        Index("ix_ideation_sessions_org_id_status", "org_id", "status"),
        Index("ix_ideation_sessions_task_id", "task_id"),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("organizations.id"), nullable=False
    )
    task_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("tasks.id"), nullable=False
    )
    participants: Mapped[list[str]] = mapped_column(CompatJSONB(), nullable=False, default=list)
    current_round: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=1)
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, server_default="pending"
    )
    autonomy_level: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, server_default="5"
    )
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now(), nullable=False
    )

    briefs: Mapped[list[IdeationBrief]] = relationship(
        "IdeationBrief", back_populates="session", lazy="selectin"
    )


class IdeationBrief(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "ideation_briefs"
    __table_args__ = (
        UniqueConstraint("session_id", "agent_id", "round", name="uq_brief_session_agent_round"),
        Index("ix_ideation_briefs_session_round", "session_id", "round"),
        Index("ix_ideation_briefs_agent_id", "agent_id"),
    )

    session_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("ideation_sessions.id"), nullable=False
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("agents.id"), nullable=False
    )
    round: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[dict[str, object]] = mapped_column(CompatJSONB(), nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)

    session: Mapped[IdeationSession] = relationship(
        "IdeationSession", back_populates="briefs", lazy="selectin"
    )
