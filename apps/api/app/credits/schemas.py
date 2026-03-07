from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import CreditType

# --- Request schemas ---


class SpendCreditsDto(BaseModel):
    amount: int = Field(gt=0)
    reason: str = Field(max_length=500)
    trigger_type: str | None = None
    source_task_id: uuid.UUID | None = None
    source_agent_id: uuid.UUID | None = None


class AdjustCreditsDto(BaseModel):
    agent_id: uuid.UUID
    amount: int = Field(gt=0)
    type: CreditType
    reason: str = Field(max_length=500)


class LiteLLMCallbackDto(BaseModel):
    agent_id: str
    model: str
    input_tokens: int
    output_tokens: int
    call_id: str | None = None


# --- Response schemas ---


class CreditTransactionResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    org_id: uuid.UUID
    agent_id: uuid.UUID
    type: CreditType
    amount: int
    balance_after: int
    reason: str
    trigger_type: str | None
    source_task_id: uuid.UUID | None
    source_agent_id: uuid.UUID | None
    litellm_cost_usd: float | None
    created_at: datetime


class CreditStatsResponse(BaseModel):
    total_credits: int
    total_debits: int
    net: int
    transaction_count: int


class SpendingTrendPoint(BaseModel):
    date: str
    amount: int


class AgentSpendingResponse(BaseModel):
    agent_id: str
    name: str
    total_spent: int
    transaction_count: int
