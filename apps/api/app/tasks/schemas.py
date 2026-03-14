from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import (
    ConsensusStatus,
    ConsensusType,
    EscalationReason,
    TaskPriority,
    TaskStatus,
    VoteValue,
)

# --- Request schemas ---


class CreateTaskDto(BaseModel):
    title: str = Field(max_length=500)
    description: str | None = None
    priority: TaskPriority = TaskPriority.NORMAL
    assignee_id: uuid.UUID | None = None
    parent_task_id: uuid.UUID | None = None
    approval_required: bool = False
    autonomy_level: int | None = Field(default=None, ge=0, le=10)
    due_at: datetime | None = None
    tags: list[str] = Field(default_factory=list)
    metadata: dict = Field(default_factory=dict)
    required_capabilities: list[str] = Field(default_factory=list)


class TransitionTaskDto(BaseModel):
    status: TaskStatus
    reason: str | None = None


class AssignTaskDto(BaseModel):
    assignee_id: uuid.UUID


class AddDependencyDto(BaseModel):
    depends_on_id: uuid.UUID
    blocking: bool = True


class AddCommentDto(BaseModel):
    body: str
    parent_comment_id: uuid.UUID | None = None


class EscalateTaskDto(BaseModel):
    reason: EscalationReason
    notes: str | None = None


class ResolveEscalationDto(BaseModel):
    notes: str | None = None


class CreateConsensusDto(BaseModel):
    type: ConsensusType
    title: str = Field(max_length=255)
    description: str | None = None
    subject_id: uuid.UUID | None = None
    subject_type: str | None = None
    quorum_required: int = Field(default=2, ge=1)
    approval_threshold: int = Field(default=50, ge=1, le=100)
    expires_in_hours: int = Field(default=48, ge=1)


class CastVoteDto(BaseModel):
    vote: VoteValue
    reason: str | None = None


# --- Response schemas ---


class TaskResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    org_id: uuid.UUID
    identifier: str
    title: str
    description: str | None
    status: TaskStatus
    priority: TaskPriority
    assignee_id: uuid.UUID | None
    creator_id: uuid.UUID
    parent_task_id: uuid.UUID | None
    approval_required: bool
    autonomy_level: int | None
    approved_by: str | None
    approved_at: datetime | None
    due_date: datetime | None
    completed_at: datetime | None
    required_capabilities: list[str]
    needs_attention: bool
    sla_warning_sent_at: datetime | None
    metadata: dict = Field(alias="metadata_")
    created_at: datetime
    updated_at: datetime


class TaskDependencyResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    task_id: uuid.UUID
    depends_on_id: uuid.UUID
    blocking: bool
    created_at: datetime


class TaskTagResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    task_id: uuid.UUID
    tag: str
    created_at: datetime


class TaskCommentResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    task_id: uuid.UUID
    author_id: uuid.UUID
    body: str
    parent_comment_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime


class EscalationResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    org_id: uuid.UUID
    task_id: uuid.UUID
    from_agent_id: uuid.UUID
    to_agent_id: uuid.UUID
    reason: EscalationReason
    levels_escalated: int
    notes: str | None
    is_automatic: bool
    resolved_at: datetime | None
    created_at: datetime


class ConsensusRequestResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    org_id: uuid.UUID
    type: ConsensusType
    status: ConsensusStatus
    title: str
    description: str | None
    requester_id: uuid.UUID
    subject_id: uuid.UUID | None
    subject_type: str | None
    quorum_required: int
    approval_threshold: int
    votes_approve: int
    votes_reject: int
    votes_abstain: int
    expires_at: datetime
    decided_at: datetime | None
    created_at: datetime
    updated_at: datetime


class ConsensusVoteResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    request_id: uuid.UUID
    voter_id: uuid.UUID
    vote: VoteValue
    reason: str | None
    voter_level: int
    created_at: datetime
