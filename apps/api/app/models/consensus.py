from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Index, SmallInteger, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.compat import CompatJSONB
from app.models.enums import ConsensusStatus


class ConsensusRequest(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "consensus_requests"
    __table_args__ = (
        Index("ix_consensus_requests_org_id_status", "org_id", "status"),
        Index("ix_consensus_requests_org_id_type", "org_id", "type"),
        Index("ix_consensus_requests_org_id_requester_id", "org_id", "requester_id"),
        Index("ix_consensus_requests_org_id_expires_at", "org_id", "expires_at"),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, server_default=ConsensusStatus.PENDING.value
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    requester_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False
    )
    subject_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    subject_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    quorum_required: Mapped[int] = mapped_column(SmallInteger, nullable=False, server_default="2")
    approval_threshold: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, server_default="50"
    )
    votes_approve: Mapped[int] = mapped_column(SmallInteger, nullable=False, server_default="0")
    votes_reject: Mapped[int] = mapped_column(SmallInteger, nullable=False, server_default="0")
    votes_abstain: Mapped[int] = mapped_column(SmallInteger, nullable=False, server_default="0")
    expires_at: Mapped[datetime] = mapped_column(nullable=False)
    decided_at: Mapped[datetime | None] = mapped_column(nullable=True)
    metadata_: Mapped[dict] = mapped_column(
        "metadata", CompatJSONB(), nullable=False, server_default="{}"
    )

    organization: Mapped[Organization] = relationship("Organization")
    requester: Mapped[Agent] = relationship("Agent")
    votes: Mapped[list[ConsensusVote]] = relationship("ConsensusVote", back_populates="request")


class ConsensusVote(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "consensus_votes"
    __table_args__ = (
        Index("ix_consensus_votes_request_id_voter_id", "request_id", "voter_id", unique=True),
        Index("ix_consensus_votes_org_id_request_id", "org_id", "request_id"),
        Index("ix_consensus_votes_voter_id", "voter_id"),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("consensus_requests.id"), nullable=False
    )
    voter_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False
    )
    vote: Mapped[str] = mapped_column(String(20), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    voter_level: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default="now()", nullable=False)

    organization: Mapped[Organization] = relationship("Organization")
    request: Mapped[ConsensusRequest] = relationship("ConsensusRequest", back_populates="votes")
    voter: Mapped[Agent] = relationship("Agent")


from app.models.agent import Agent  # noqa: E402
from app.models.organization import Organization  # noqa: E402
