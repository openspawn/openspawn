from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.compat import CompatJSONB, CompatUUID


class GitHubConnection(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "github_connections"
    __table_args__ = (Index("ix_github_connections_org_id_enabled", "org_id", "enabled"),)

    org_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("organizations.id"), nullable=False
    )
    installation_id: Mapped[int] = mapped_column(nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    webhook_secret: Mapped[str] = mapped_column(String(255), nullable=False)
    access_token: Mapped[str | None] = mapped_column(String(500), nullable=True)
    repo_filter: Mapped[list] = mapped_column(CompatJSONB(), nullable=False, server_default="[]")
    sync_config: Mapped[dict] = mapped_column(CompatJSONB(), nullable=False)
    enabled: Mapped[bool] = mapped_column(nullable=False, server_default="true")
    last_sync_at: Mapped[str | None] = mapped_column(nullable=True)
    last_error: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    organization: Mapped[Organization] = relationship("Organization")


class LinearConnection(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "linear_connections"
    __table_args__ = (Index("ix_linear_connections_org_id_enabled", "org_id", "enabled"),)

    org_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("organizations.id"), nullable=False
    )
    team_id: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    webhook_secret: Mapped[str] = mapped_column(String(255), nullable=False)
    api_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    team_filter: Mapped[list] = mapped_column(CompatJSONB(), nullable=False, server_default="[]")
    sync_config: Mapped[dict] = mapped_column(CompatJSONB(), nullable=False)
    enabled: Mapped[bool] = mapped_column(nullable=False, server_default="true")
    last_sync_at: Mapped[str | None] = mapped_column(nullable=True)
    last_error: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    organization: Mapped[Organization] = relationship("Organization")


class IntegrationLink(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "integration_links"
    __table_args__ = (
        Index(
            "ix_integration_links_org_id_source_type_source_id",
            "org_id",
            "source_type",
            "source_id",
            unique=True,
        ),
        Index(
            "ix_integration_links_org_id_target_type_target_id",
            "org_id",
            "target_type",
            "target_id",
        ),
        Index("ix_integration_links_org_id_provider", "org_id", "provider"),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("organizations.id"), nullable=False
    )
    provider: Mapped[str] = mapped_column(String(50), nullable=False, server_default="github")
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)
    source_id: Mapped[str] = mapped_column(String(255), nullable=False)
    target_type: Mapped[str] = mapped_column(String(50), nullable=False)
    target_id: Mapped[uuid.UUID] = mapped_column(CompatUUID(), nullable=False)
    metadata_: Mapped[dict] = mapped_column(
        "metadata", CompatJSONB(), nullable=False, server_default="{}"
    )

    organization: Mapped[Organization] = relationship("Organization")


from app.models.organization import Organization  # noqa: E402
