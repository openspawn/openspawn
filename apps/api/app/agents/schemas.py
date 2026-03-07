from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import AgentMode, AgentRole, AgentStatus, Proficiency

# --- Request schemas ---


class CreateAgentDto(BaseModel):
    agent_id: str = Field(max_length=100)
    name: str = Field(max_length=255)
    level: int = Field(default=1, ge=1, le=10)
    model: str = Field(default="sonnet", max_length=100)
    role: AgentRole = AgentRole.WORKER
    mode: AgentMode = AgentMode.WORKER
    management_fee_pct: int = Field(default=0, ge=0, le=50)
    budget_period_limit: int | None = None
    capabilities: list[AddCapabilityDto] | None = None
    metadata: dict = Field(default_factory=dict)


class UpdateAgentDto(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    level: int | None = Field(default=None, ge=1, le=10)
    model: str | None = Field(default=None, max_length=100)
    mode: AgentMode | None = None
    management_fee_pct: int | None = Field(default=None, ge=0, le=50)
    budget_period_limit: int | None = None
    metadata: dict | None = None


class SpawnAgentDto(BaseModel):
    agent_id: str = Field(max_length=100)
    name: str = Field(max_length=255)
    level: int = Field(default=1, ge=1, le=10)
    model: str = Field(default="sonnet", max_length=100)
    budget_period_limit: int | None = None
    capabilities: list[AddCapabilityDto] | None = None


class SetBudgetDto(BaseModel):
    budget_period_limit: int | None = None
    reset_current_period: bool = False


class TransferCreditsDto(BaseModel):
    to_agent_id: uuid.UUID
    amount: int = Field(gt=0)
    reason: str = Field(max_length=500)


class AddCapabilityDto(BaseModel):
    capability: str = Field(max_length=100)
    proficiency: Proficiency = Proficiency.STANDARD


class UpdateCapabilityDto(BaseModel):
    proficiency: Proficiency


class ReputationBonusPenaltyDto(BaseModel):
    reason: str = Field(max_length=500)
    impact: int = Field(ge=1, le=20)


# --- Response schemas ---


class AgentResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    org_id: uuid.UUID
    agent_id: str
    name: str
    level: int
    model: str
    status: AgentStatus
    role: AgentRole
    mode: AgentMode
    management_fee_pct: int
    current_balance: int
    budget_period_limit: int | None
    budget_period_spent: int
    budget_period_start: datetime | None
    parent_id: uuid.UUID | None
    max_children: int
    metadata: dict = Field(alias="metadata_")
    trust_score: int
    tasks_completed: int
    tasks_successful: int
    last_activity_at: datetime | None
    last_promotion_at: datetime | None
    lifetime_earnings: int
    domain: str | None
    avatar: str | None
    avatar_color: str | None
    created_at: datetime
    updated_at: datetime


class AgentRegistrationResponse(BaseModel):
    agent: AgentResponse
    hmac_secret: str


class CapabilityResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    org_id: uuid.UUID
    agent_id: uuid.UUID
    capability: str
    proficiency: Proficiency
    created_at: datetime


class BalanceResponse(BaseModel):
    balance: int


class BudgetResponse(BaseModel):
    budget_period_limit: int | None
    budget_period_spent: int
    budget_period_start: datetime | None
    can_spend: bool
    remaining: int | None


class HierarchyNode(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    agent_id: str
    name: str
    level: int
    status: AgentStatus
    role: AgentRole
    children: list[HierarchyNode] = []


class ReputationSummary(BaseModel):
    trust_score: int
    tasks_completed: int
    tasks_successful: int
    success_rate: float
    level: str


class ReputationEventResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    type: str
    impact: int
    previous_score: int
    new_score: int
    task_id: uuid.UUID | None
    triggered_by: uuid.UUID | None
    reason: str | None
    created_at: datetime


class LeaderboardEntry(BaseModel):
    agent_id: str
    name: str
    trust_score: int
    tasks_completed: int
    success_rate: float


# Forward ref resolution
CreateAgentDto.model_rebuild()
SpawnAgentDto.model_rebuild()
HierarchyNode.model_rebuild()
