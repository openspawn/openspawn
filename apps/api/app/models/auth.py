from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Index, LargeBinary, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.compat import CompatJSONB, CompatUUID
from app.models.enums import UserRole


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"
    __table_args__ = (Index("ix_users_org_id_email", "org_id", "email", unique=True),)

    org_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("organizations.id"), nullable=False
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default=UserRole.VIEWER.value
    )
    google_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    totp_secret_enc: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    totp_enabled: Mapped[bool] = mapped_column(nullable=False, server_default="false")
    recovery_codes_enc: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    last_login_at: Mapped[datetime | None] = mapped_column(nullable=True)
    email_verified: Mapped[bool] = mapped_column(nullable=False, server_default="false")

    organization: Mapped[Organization] = relationship("Organization")
    refresh_tokens: Mapped[list[RefreshToken]] = relationship("RefreshToken", back_populates="user")


class RefreshToken(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "refresh_tokens"
    __table_args__ = (
        Index("ix_refresh_tokens_user_id", "user_id"),
        Index("ix_refresh_tokens_expires_at", "expires_at"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    expires_at: Mapped[datetime] = mapped_column(nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)

    user: Mapped[User] = relationship("User", back_populates="refresh_tokens")


class ApiKey(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "api_keys"
    __table_args__ = (
        Index("ix_api_keys_org_id", "org_id"),
        Index("ix_api_keys_key_prefix", "key_prefix"),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("organizations.id"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(CompatUUID(), ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    key_prefix: Mapped[str] = mapped_column(String(12), nullable=False)
    key_hash: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    scopes: Mapped[list] = mapped_column(CompatJSONB(), nullable=False, server_default='["read"]')
    last_used_at: Mapped[datetime | None] = mapped_column(nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)

    organization: Mapped[Organization] = relationship("Organization")
    created_by: Mapped[User] = relationship("User")


class Nonce(Base):
    __tablename__ = "nonces"
    __table_args__ = (Index("ix_nonces_expires_at", "expires_at"),)

    nonce: Mapped[str] = mapped_column(String(64), primary_key=True)
    agent_id: Mapped[uuid.UUID] = mapped_column(CompatUUID(), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)


class IdempotencyKey(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "idempotency_keys"
    __table_args__ = (Index("ix_idempotency_keys_expires_at", "expires_at"),)

    key: Mapped[uuid.UUID] = mapped_column(CompatUUID(), nullable=False, unique=True)
    org_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("organizations.id"), nullable=False
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("agents.id"), nullable=False
    )
    method: Mapped[str] = mapped_column(String(10), nullable=False)
    path: Mapped[str] = mapped_column(String(500), nullable=False)
    status_code: Mapped[int] = mapped_column(nullable=False)
    response_body: Mapped[dict] = mapped_column(CompatJSONB(), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)

    organization: Mapped[Organization] = relationship("Organization")
    agent: Mapped[Agent] = relationship("Agent")


from app.models.agent import Agent  # noqa: E402
from app.models.organization import Organization  # noqa: E402
