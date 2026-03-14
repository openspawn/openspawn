from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import ActionType, ApprovalStatus


class CreateApprovalDto(BaseModel):
    action_type: ActionType
    entity_type: str
    entity_id: uuid.UUID
    risk_level: int = Field(ge=0, le=10)
    payload: dict[str, object]


class RespondApprovalDto(BaseModel):
    notes: str | None = None


class ApprovalResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    org_id: uuid.UUID
    requested_by: uuid.UUID
    action_type: str
    entity_type: str
    entity_id: uuid.UUID
    risk_level: int
    autonomy_level: int
    payload: dict[str, object]
    status: ApprovalStatus
    resolved_by: uuid.UUID | None
    resolved_at: datetime | None
    notes: str | None
    expires_at: datetime | None
    created_at: datetime


class GatedResponse(BaseModel):
    """Returned when an action is gated by the autonomy dial."""

    approval_id: uuid.UUID
    status: str = "pending"
    risk_level: int
    autonomy_level: int
    message: str
