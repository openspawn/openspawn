from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.enums import EventSeverity


class EventResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    org_id: uuid.UUID
    type: str
    actor_id: uuid.UUID
    entity_type: str
    entity_id: uuid.UUID
    data: dict
    severity: EventSeverity
    reasoning: str | None
    created_at: datetime


class SSEEvent(BaseModel):
    """Payload published to the EventBus and yielded as SSE.

    type is str (not SSEEventType) to support replay of legacy/unknown event types
    from the DB. The emit() helper accepts SSEEventType for type safety on new events.
    """

    sequence: int
    type: str
    org_id: uuid.UUID
    actor_id: uuid.UUID
    entity_type: str
    entity_id: uuid.UUID
    data: dict
    created_at: datetime


class SSETokenResponse(BaseModel):
    token: str
    expires_in: int
