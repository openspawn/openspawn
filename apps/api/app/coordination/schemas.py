from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel


class EmitEventDto(BaseModel):
    event_type: str
    payload: dict
    task_id: uuid.UUID
    entity_name: str | None = None


class SubscribeDto(BaseModel):
    event_pattern: str
    task_id: uuid.UUID | None = None


class ReplayDto(BaseModel):
    task_id: uuid.UUID
    since: datetime | None = None
    event_types: list[str] | None = None
    limit: int = 500


class EventSubscriptionResponse(BaseModel):
    id: uuid.UUID
    agent_id: uuid.UUID
    event_pattern: str
    task_id: uuid.UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}
