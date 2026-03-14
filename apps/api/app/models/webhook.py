from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.compat import CompatUUID


class Webhook(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "webhooks"
    __table_args__ = (
        Index("ix_webhooks_org_id_hook_type_enabled", "org_id", "hook_type", "enabled"),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("organizations.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str] = mapped_column(String(2048), nullable=False)
    secret: Mapped[str | None] = mapped_column(String(255), nullable=True)
    events: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    enabled: Mapped[bool] = mapped_column(nullable=False, server_default="true")
    hook_type: Mapped[str] = mapped_column(String(10), nullable=False, server_default="post")
    can_block: Mapped[bool] = mapped_column(nullable=False, server_default="false")
    timeout_ms: Mapped[int] = mapped_column(nullable=False, server_default="5000")
    failure_count: Mapped[int] = mapped_column(nullable=False, server_default="0")
    last_triggered_at: Mapped[datetime | None] = mapped_column(nullable=True)
    last_error: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    organization: Mapped[Organization] = relationship("Organization")


class InboundWebhookKey(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "inbound_webhook_keys"
    __table_args__ = (Index("ix_inbound_webhook_keys_org_id_enabled", "org_id", "enabled"),)

    org_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("organizations.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    key: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    secret: Mapped[str] = mapped_column(String(64), nullable=False)
    default_agent_id: Mapped[uuid.UUID | None] = mapped_column(
        CompatUUID(), ForeignKey("agents.id"), nullable=True
    )
    default_priority: Mapped[str | None] = mapped_column(String(10), nullable=True)
    default_tags: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    enabled: Mapped[bool] = mapped_column(nullable=False, server_default="true")
    last_used_at: Mapped[datetime | None] = mapped_column(nullable=True)

    organization: Mapped[Organization] = relationship("Organization")
    default_agent: Mapped[Agent | None] = relationship("Agent")


from app.models.agent import Agent  # noqa: E402
from app.models.organization import Organization  # noqa: E402
