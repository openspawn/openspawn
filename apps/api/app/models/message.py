from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.compat import CompatJSONB, CompatUUID
from app.models.enums import MessageType


class Channel(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "channels"
    __table_args__ = (
        Index("ix_channels_org_id_name", "org_id", "name", unique=True),
        Index("ix_channels_org_id_type", "org_id", "type"),
        Index("ix_channels_task_id", "task_id"),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("organizations.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    task_id: Mapped[uuid.UUID | None] = mapped_column(
        CompatUUID(), ForeignKey("tasks.id"), nullable=True
    )
    metadata_: Mapped[dict] = mapped_column(
        "metadata", CompatJSONB(), nullable=False, server_default="{}"
    )

    organization: Mapped[Organization] = relationship("Organization")
    task: Mapped[Task | None] = relationship("Task")
    messages: Mapped[list[Message]] = relationship("Message", back_populates="channel")


class Message(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "messages"
    __table_args__ = (
        Index("ix_messages_channel_id_created_at", "channel_id", "created_at"),
        Index("ix_messages_org_id_sender_id", "org_id", "sender_id"),
        Index("ix_messages_org_id_recipient_id", "org_id", "recipient_id"),
        Index("ix_messages_parent_message_id", "parent_message_id"),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("organizations.id"), nullable=False
    )
    channel_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("channels.id"), nullable=False
    )
    sender_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("agents.id"), nullable=False
    )
    recipient_id: Mapped[uuid.UUID | None] = mapped_column(
        CompatUUID(), ForeignKey("agents.id"), nullable=True
    )
    type: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default=MessageType.TEXT.value
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    parent_message_id: Mapped[uuid.UUID | None] = mapped_column(
        CompatUUID(), ForeignKey("messages.id"), nullable=True
    )
    metadata_: Mapped[dict] = mapped_column(
        "metadata", CompatJSONB(), nullable=False, server_default="{}"
    )
    created_at: Mapped[datetime] = mapped_column(server_default="now()", nullable=False)

    organization: Mapped[Organization] = relationship("Organization")
    channel: Mapped[Channel] = relationship("Channel", back_populates="messages")
    sender: Mapped[Agent] = relationship("Agent", foreign_keys=[sender_id])
    recipient: Mapped[Agent | None] = relationship("Agent", foreign_keys=[recipient_id])
    parent_message: Mapped[Message | None] = relationship(
        "Message", remote_side="Message.id", back_populates="replies"
    )
    replies: Mapped[list[Message]] = relationship("Message", back_populates="parent_message")


from app.models.agent import Agent  # noqa: E402
from app.models.organization import Organization  # noqa: E402
from app.models.task import Task  # noqa: E402
