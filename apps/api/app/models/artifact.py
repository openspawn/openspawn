from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.compat import CompatJSONB, CompatUUID


class Artifact(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "artifacts"
    __table_args__ = (
        Index("ix_artifacts_org_type", "org_id", "artifact_type"),
        Index("ix_artifacts_org_name", "org_id", "name"),
        UniqueConstraint("org_id", "name", "version", name="uq_artifact_name_version"),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("organizations.id"), nullable=False
    )
    task_id: Mapped[uuid.UUID] = mapped_column(CompatUUID(), ForeignKey("tasks.id"), nullable=False)
    producer_agent_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("agents.id"), nullable=False
    )
    artifact_type: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    version: Mapped[int] = mapped_column(nullable=False, default=1)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="published")
    content: Mapped[dict] = mapped_column(CompatJSONB(), nullable=False)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    metadata_: Mapped[dict] = mapped_column(
        "metadata", CompatJSONB(), nullable=False, server_default="{}"
    )
    source_artifact_ids: Mapped[list[object]] = mapped_column(
        CompatJSONB(), nullable=False, server_default="[]"
    )
    superseded_by_id: Mapped[uuid.UUID | None] = mapped_column(
        CompatUUID(), ForeignKey("artifacts.id"), nullable=True
    )
    approved_by: Mapped[str | None] = mapped_column(String(200), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(nullable=True)

    organization: Mapped[Organization] = relationship("Organization")
    task: Mapped[Task] = relationship("Task")
    producer: Mapped[Agent] = relationship("Agent")
    superseded_by: Mapped[Artifact | None] = relationship("Artifact", remote_side="Artifact.id")


class ArtifactSubscription(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "artifact_subscriptions"
    __table_args__ = (
        UniqueConstraint("org_id", "agent_id", "artifact_type", name="uq_sub_agent_type"),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("organizations.id"), nullable=False
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("agents.id"), nullable=False
    )
    artifact_type: Mapped[str] = mapped_column(String(50), nullable=False)
    task_id: Mapped[uuid.UUID | None] = mapped_column(
        CompatUUID(), ForeignKey("tasks.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(server_default="now()", nullable=False)

    agent: Mapped[Agent] = relationship("Agent")


from app.models.agent import Agent  # noqa: E402
from app.models.organization import Organization  # noqa: E402
from app.models.task import Task  # noqa: E402
