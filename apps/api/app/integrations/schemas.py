from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

# --- GitHub ---


class CreateGitHubConnectionDto(BaseModel):
    installation_id: int
    name: str = Field(max_length=255)
    webhook_secret: str = Field(max_length=255)
    repo_filter: list[str] = Field(default_factory=list)
    sync_config: dict = Field(default_factory=dict)


class UpdateGitHubConnectionDto(BaseModel):
    enabled: bool | None = None
    webhook_secret: str | None = Field(default=None, max_length=255)
    repo_filter: list[str] | None = None
    sync_config: dict | None = None


class GitHubConnectionResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    org_id: uuid.UUID
    installation_id: int
    name: str
    webhook_secret: str
    repo_filter: list
    sync_config: dict
    enabled: bool
    last_sync_at: str | None
    last_error: str | None
    created_at: datetime
    updated_at: datetime


# --- Linear ---


class CreateLinearConnectionDto(BaseModel):
    team_id: str = Field(max_length=255)
    name: str = Field(max_length=255)
    webhook_secret: str = Field(max_length=255)
    api_key: str | None = Field(default=None, max_length=500)
    team_filter: list[str] = Field(default_factory=list)
    sync_config: dict = Field(default_factory=dict)


class UpdateLinearConnectionDto(BaseModel):
    enabled: bool | None = None
    webhook_secret: str | None = Field(default=None, max_length=255)
    api_key: str | None = Field(default=None, max_length=500)
    team_filter: list[str] | None = None
    sync_config: dict | None = None


class LinearConnectionResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    org_id: uuid.UUID
    team_id: str
    name: str
    webhook_secret: str
    team_filter: list
    sync_config: dict
    enabled: bool
    last_sync_at: str | None
    last_error: str | None
    created_at: datetime
    updated_at: datetime


# --- Integration Links ---


class IntegrationLinkResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    org_id: uuid.UUID
    provider: str
    source_type: str
    source_id: str
    target_type: str
    target_id: uuid.UUID
    metadata: dict = Field(alias="metadata_")
    created_at: datetime
    updated_at: datetime
