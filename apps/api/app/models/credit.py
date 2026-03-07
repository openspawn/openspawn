from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, ForeignKey, Index, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import AmountMode


class CreditTransaction(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "credit_transactions"
    __table_args__ = (
        CheckConstraint("amount > 0", name="chk_credit_transactions_amount"),
        Index(
            "ix_credit_transactions_org_id_agent_id_created_at", "org_id", "agent_id", "created_at"
        ),
        Index("ix_credit_transactions_org_id_created_at", "org_id", "created_at"),
        Index("ix_credit_transactions_trigger_event_id", "trigger_event_id"),
        Index("ix_credit_transactions_source_task_id", "source_task_id"),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False
    )
    type: Mapped[str] = mapped_column(String(10), nullable=False)
    amount: Mapped[int] = mapped_column(nullable=False)
    balance_after: Mapped[int] = mapped_column(nullable=False)
    reason: Mapped[str] = mapped_column(String(500), nullable=False)
    trigger_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    trigger_event_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("events.id"), nullable=True
    )
    source_task_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=True
    )
    source_agent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id"), nullable=True
    )
    litellm_cost_usd: Mapped[float | None] = mapped_column(Numeric(10, 6), nullable=True)
    idempotency_key: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True, unique=True
    )
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, server_default="{}")
    created_at: Mapped[datetime] = mapped_column(server_default="now()", nullable=False)

    organization: Mapped[Organization] = relationship("Organization")
    agent: Mapped[Agent] = relationship("Agent", foreign_keys=[agent_id])
    trigger_event: Mapped[Event | None] = relationship("Event")
    source_task: Mapped[Task | None] = relationship("Task")
    source_agent: Mapped[Agent | None] = relationship("Agent", foreign_keys=[source_agent_id])


class CreditRateConfig(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "credit_rate_configs"
    __table_args__ = (
        Index(
            "ix_credit_rate_configs_org_id_trigger_type_direction",
            "org_id",
            "trigger_type",
            "direction",
            unique=True,
        ),
        Index("ix_credit_rate_configs_org_id_active", "org_id", "active"),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    trigger_type: Mapped[str] = mapped_column(String(100), nullable=False)
    direction: Mapped[str] = mapped_column(String(10), nullable=False)
    amount: Mapped[int | None] = mapped_column(nullable=True)
    amount_mode: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default=AmountMode.FIXED.value
    )
    usd_to_credits_rate: Mapped[float | None] = mapped_column(Numeric(10, 4), nullable=True)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    active: Mapped[bool] = mapped_column(nullable=False, server_default="true")

    organization: Mapped[Organization] = relationship("Organization")


from app.models.agent import Agent  # noqa: E402
from app.models.event import Event  # noqa: E402
from app.models.organization import Organization  # noqa: E402
from app.models.task import Task  # noqa: E402
