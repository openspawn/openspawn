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
