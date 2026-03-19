"""Schemas for cooperative ideation flow (#669)."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class StartIdeationDto(BaseModel):
    task_id: uuid.UUID
    participant_agent_ids: list[uuid.UUID] | None = None
    autonomy_level: int = Field(default=5, ge=0, le=10)


class SubmitBriefDto(BaseModel):
    content: dict[str, object]


class IdeationBriefResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    session_id: uuid.UUID
    agent_id: uuid.UUID
    round: int
    role: str
    content: dict[str, object]
    created_at: datetime


class IdeationSessionResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    org_id: uuid.UUID
    task_id: uuid.UUID
    participants: list[str]
    current_round: int
    status: str
    autonomy_level: int
    created_at: datetime
    updated_at: datetime
    briefs: list[IdeationBriefResponse] = []
