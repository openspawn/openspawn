from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Index, LargeBinary, SmallInteger, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.compat import CompatJSONB, CompatUUID
from app.models.enums import AgentMode, AgentRole, AgentStatus, Proficiency

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.task import Task


class Agent(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "agents"
    __table_args__ = (
        CheckConstraint("level >= 1 AND level <= 10", name="chk_agents_level"),
        CheckConstraint(
            "management_fee_pct >= 0 AND management_fee_pct <= 50",
            name="chk_agents_management_fee_pct",
        ),
        Index("ix_agents_org_id_agent_id", "org_id", "agent_id", unique=True),
        Index("ix_agents_org_id_status", "org_id", "status"),
        Index("ix_agents_org_id_role", "org_id", "role"),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("organizations.id"), nullable=False
    )
    agent_id: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    level: Mapped[int] = mapped_column(SmallInteger, nullable=False, server_default="1")
    model: Mapped[str] = mapped_column(String(100), nullable=False, server_default="sonnet")
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default=AgentStatus.ACTIVE.value
    )
    role: Mapped[str] = mapped_column(
        String(50), nullable=False, server_default=AgentRole.WORKER.value
    )
    mode: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default=AgentMode.WORKER.value
    )
    management_fee_pct: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, server_default="0"
    )
    current_balance: Mapped[int] = mapped_column(nullable=False, server_default="0")
    budget_period_limit: Mapped[int | None] = mapped_column(nullable=True)
    budget_period_spent: Mapped[int] = mapped_column(nullable=False, server_default="0")
    budget_period_start: Mapped[datetime | None] = mapped_column(nullable=True)
    hmac_secret_enc: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        CompatUUID(), ForeignKey("agents.id"), nullable=True
    )
    max_children: Mapped[int] = mapped_column(SmallInteger, nullable=False, server_default="0")
    metadata_: Mapped[dict] = mapped_column(
        "metadata", CompatJSONB(), nullable=False, server_default="{}"
    )
    trust_score: Mapped[int] = mapped_column(SmallInteger, nullable=False, server_default="50")
    tasks_completed: Mapped[int] = mapped_column(nullable=False, server_default="0")
    tasks_successful: Mapped[int] = mapped_column(nullable=False, server_default="0")
    last_activity_at: Mapped[datetime | None] = mapped_column(nullable=True)
    last_promotion_at: Mapped[datetime | None] = mapped_column(nullable=True)
    lifetime_earnings: Mapped[int] = mapped_column(nullable=False, server_default="0")
    domain: Mapped[str | None] = mapped_column(String(100), nullable=True)
    avatar: Mapped[str | None] = mapped_column(String(500), nullable=True)
    avatar_color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(nullable=True)

    organization: Mapped[Organization] = relationship("Organization", back_populates="agents")
    parent: Mapped[Agent | None] = relationship(
        "Agent", remote_side="Agent.id", back_populates="children"
    )
    children: Mapped[list[Agent]] = relationship("Agent", back_populates="parent")
    capabilities: Mapped[list[AgentCapability]] = relationship(
        "AgentCapability", back_populates="agent"
    )
    assigned_tasks: Mapped[list[Task]] = relationship(
        "Task", foreign_keys="Task.assignee_id", back_populates="assignee"
    )
    created_tasks: Mapped[list[Task]] = relationship(
        "Task", foreign_keys="Task.creator_id", back_populates="creator"
    )


class AgentCapability(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "agent_capabilities"
    __table_args__ = (
        Index("ix_agent_capabilities_agent_id_capability", "agent_id", "capability", unique=True),
        Index("ix_agent_capabilities_org_id_capability", "org_id", "capability"),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("organizations.id"), nullable=False
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("agents.id"), nullable=False
    )
    capability: Mapped[str] = mapped_column(String(100), nullable=False)
    proficiency: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default=Proficiency.STANDARD.value
    )
    created_at: Mapped[datetime] = mapped_column(
        server_default="now()",
        nullable=False,
    )

    organization: Mapped[Organization] = relationship("Organization")
    agent: Mapped[Agent] = relationship("Agent", back_populates="capabilities")
