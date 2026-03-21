from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class DecisionAlternative(BaseModel):
    """An alternative that was considered during a decision."""

    option: str
    rejected_because: str


class StoreMemoryDto(BaseModel):
    content: str = Field(max_length=8000)
    source: str = Field(default="unknown", max_length=50)
    type: str = Field(default="episodic", max_length=20)
    visibility: str = Field(default="shared", max_length=20)
    target_agent_ids: list[uuid.UUID] | None = None
    occurred_at: datetime | None = None
    expires_at: datetime | None = None
    ttl_seconds: int | None = Field(
        default=None, ge=1, description="Optional TTL in seconds, sets expires_at"
    )
    metadata: dict = Field(default_factory=dict)

    # Decision-specific fields (optional, used when type=decision)
    alternatives: list[DecisionAlternative] | None = Field(
        default=None,
        description="Alternatives considered and why they were rejected",
    )
    constraints: list[str] | None = Field(
        default=None,
        description="Constraints that shaped the decision",
    )
    decided_by: str | None = Field(
        default=None,
        description="Who made the decision",
    )
    what_outsider_would_miss: str | None = Field(
        default=None,
        description="Context an outsider would miss about this decision",
    )
    review_by: datetime | None = Field(
        default=None,
        description="When this decision should be revisited",
    )


class MemoryFeedbackDto(BaseModel):
    helpful: bool


class MemoryResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    org_id: uuid.UUID
    agent_id: uuid.UUID
    type: str
    content: str
    raw_content: str
    summary: str | None = None
    content_hash: str
    visibility: str
    target_agent_ids: list[uuid.UUID] | None = None
    confidence: int
    strength: int
    source: str
    access_count: int
    helpful_count: int
    unhelpful_count: int
    occurred_at: datetime
    expires_at: datetime | None = None
    last_accessed_at: datetime | None = None
    metadata: dict = Field(default_factory=dict, alias="metadata_")
    created_at: datetime
    updated_at: datetime


class SearchMemoryDto(BaseModel):
    query: str = Field(max_length=2000)
    type: str | None = None
    limit: int = Field(default=10, ge=1, le=100)
    similarity_threshold: float = Field(default=0.7, ge=0.0, le=1.0)


class ContradictionPairResponse(BaseModel):
    older_memory: MemoryResponse
    newer_memory: MemoryResponse


class ResolveContradictionDto(BaseModel):
    strategy: str = Field(description="Resolution strategy: keep_newer, keep_older, merge, flag")


class DecisionResponse(BaseModel):
    """Structured view of a decision record."""

    model_config = {"from_attributes": True}

    id: uuid.UUID
    org_id: uuid.UUID
    agent_id: uuid.UUID
    content: str
    source: str
    confidence: int
    strength: int
    created_at: datetime
    occurred_at: datetime
    # Decision-specific fields from metadata
    alternatives: list[DecisionAlternative] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    decided_by: str | None = None
    what_outsider_would_miss: str | None = None
    review_by: datetime | None = None
    metadata: dict = Field(default_factory=dict)


class SearchResultResponse(BaseModel):
    memory_id: uuid.UUID
    content: str
    raw_content: str
    summary: str | None = None
    memory_type: str
    source: str
    confidence: int
    strength: int
    visibility: str
    agent_id: uuid.UUID
    score: float
    vector_score: float
    text_score: float
    recency_score: float
    access_score: float
    created_at: datetime
    occurred_at: datetime
    access_count: int
    metadata: dict = Field(default_factory=dict)
