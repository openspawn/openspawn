from __future__ import annotations

import hashlib
import json
import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import ArtifactStatus, ArtifactType


class PublishArtifactDto(BaseModel):
    artifact_type: ArtifactType
    name: str = Field(max_length=200)
    content: dict
    task_id: uuid.UUID
    source_artifact_ids: list[uuid.UUID] = Field(default_factory=list)
    metadata: dict = Field(default_factory=dict)


class UpdateStatusDto(BaseModel):
    status: ArtifactStatus


class SubscribeDto(BaseModel):
    artifact_type: str = Field(description="ArtifactType value or '*' for all")
    task_id: uuid.UUID | None = None


class ArtifactResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    org_id: uuid.UUID
    task_id: uuid.UUID
    producer_agent_id: uuid.UUID
    artifact_type: ArtifactType
    name: str
    version: int
    status: ArtifactStatus
    content: dict
    content_hash: str
    metadata_: dict = Field(alias="metadata")
    source_artifact_ids: list[uuid.UUID]
    superseded_by_id: uuid.UUID | None
    approved_by: str | None
    approved_at: datetime | None
    created_at: datetime
    updated_at: datetime


class SubscriptionResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    org_id: uuid.UUID
    agent_id: uuid.UUID
    artifact_type: str
    task_id: uuid.UUID | None
    created_at: datetime


def compute_content_hash(content: dict) -> str:
    canonical = json.dumps(content, sort_keys=True, default=str)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()
