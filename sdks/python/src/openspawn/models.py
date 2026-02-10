"""Pydantic models for OpenSpawn API."""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field

from openspawn.enums import (
    AgentRole,
    AgentStatus,
    CreditType,
    EscalationReason,
    EventSeverity,
    MessageType,
    Proficiency,
    TaskPriority,
    TaskStatus,
)


class Agent(BaseModel):
    """Agent model."""

    id: str
    agent_id: str = Field(alias="agentId")
    name: str
    role: AgentRole
    level: int
    model: Optional[str] = None
    status: AgentStatus
    current_balance: int = Field(alias="currentBalance")
    management_fee_pct: Optional[float] = Field(None, alias="managementFeePct")
    budget_period_limit: Optional[int] = Field(None, alias="budgetPeriodLimit")
    budget_period_spent: Optional[int] = Field(None, alias="budgetPeriodSpent")
    parent_id: Optional[str] = Field(None, alias="parentId")
    capabilities: Optional[list[dict[str, Any]]] = None
    metadata: Optional[dict[str, Any]] = None
    created_at: datetime = Field(alias="createdAt")
    updated_at: Optional[datetime] = Field(None, alias="updatedAt")

    model_config = ConfigDict(populate_by_name=True)


class Task(BaseModel):
    """Task model."""

    id: str
    title: str
    description: Optional[str] = None
    status: TaskStatus
    priority: TaskPriority
    creator_id: str = Field(alias="creatorId")
    assignee_id: Optional[str] = Field(None, alias="assigneeId")
    parent_task_id: Optional[str] = Field(None, alias="parentTaskId")
    estimated_credits: Optional[int] = Field(None, alias="estimatedCredits")
    actual_credits: Optional[int] = Field(None, alias="actualCredits")
    capabilities: Optional[list[str]] = None
    metadata: Optional[dict[str, Any]] = None
    created_at: datetime = Field(alias="createdAt")
    updated_at: Optional[datetime] = Field(None, alias="updatedAt")
    completed_at: Optional[datetime] = Field(None, alias="completedAt")

    model_config = ConfigDict(populate_by_name=True)


class Message(BaseModel):
    """Message model."""

    id: str
    channel_id: str = Field(alias="channelId")
    sender_id: str = Field(alias="senderId")
    type: MessageType
    body: str
    parent_message_id: Optional[str] = Field(None, alias="parentMessageId")
    metadata: Optional[dict[str, Any]] = None
    created_at: datetime = Field(alias="createdAt")

    model_config = ConfigDict(populate_by_name=True)


class CreditTransaction(BaseModel):
    """Credit transaction model."""

    id: str
    agent_id: str = Field(alias="agentId")
    type: CreditType
    amount: int
    balance_after: int = Field(alias="balanceAfter")
    reason: Optional[str] = None
    trigger_type: Optional[str] = Field(None, alias="triggerType")
    source_task_id: Optional[str] = Field(None, alias="sourceTaskId")
    source_agent_id: Optional[str] = Field(None, alias="sourceAgentId")
    metadata: Optional[dict[str, Any]] = None
    created_at: datetime = Field(alias="createdAt")

    model_config = ConfigDict(populate_by_name=True)


class Event(BaseModel):
    """Event model."""

    id: str
    org_id: str = Field(alias="orgId")
    type: str
    severity: EventSeverity
    actor_id: Optional[str] = Field(None, alias="actorId")
    entity_type: Optional[str] = Field(None, alias="entityType")
    entity_id: Optional[str] = Field(None, alias="entityId")
    message: str
    metadata: Optional[dict[str, Any]] = None
    created_at: datetime = Field(alias="createdAt")

    model_config = ConfigDict(populate_by_name=True)


class Capability(BaseModel):
    """Agent capability model."""

    id: str
    agent_id: str = Field(alias="agentId")
    name: str
    proficiency: Proficiency
    created_at: datetime = Field(alias="createdAt")
    updated_at: Optional[datetime] = Field(None, alias="updatedAt")

    model_config = ConfigDict(populate_by_name=True)


class Channel(BaseModel):
    """Channel model."""

    id: str
    org_id: str = Field(alias="orgId")
    name: str
    type: str
    task_id: Optional[str] = Field(None, alias="taskId")
    metadata: Optional[dict[str, Any]] = None
    created_at: datetime = Field(alias="createdAt")

    model_config = ConfigDict(populate_by_name=True)


# Request DTOs
class CreateAgentRequest(BaseModel):
    """Request to create a new agent."""

    name: str
    role: AgentRole
    level: int
    model: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None


class UpdateAgentRequest(BaseModel):
    """Request to update an agent."""

    name: Optional[str] = None
    model: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None


class CreateTaskRequest(BaseModel):
    """Request to create a new task."""

    title: str
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.NORMAL
    assignee_id: Optional[str] = Field(None, alias="assigneeId")
    parent_task_id: Optional[str] = Field(None, alias="parentTaskId")
    estimated_credits: Optional[int] = Field(None, alias="estimatedCredits")
    capabilities: Optional[list[str]] = None
    metadata: Optional[dict[str, Any]] = None

    model_config = ConfigDict(populate_by_name=True)


class TransitionTaskRequest(BaseModel):
    """Request to transition a task status."""

    status: TaskStatus
    notes: Optional[str] = None


class SendMessageRequest(BaseModel):
    """Request to send a message."""

    channel_id: str = Field(alias="channelId")
    type: MessageType = MessageType.TEXT
    body: str
    parent_message_id: Optional[str] = Field(None, alias="parentMessageId")
    metadata: Optional[dict[str, Any]] = None

    model_config = ConfigDict(populate_by_name=True)


class TransferCreditsRequest(BaseModel):
    """Request to transfer credits."""

    to_agent_id: str = Field(alias="toAgentId")
    amount: int
    reason: str

    model_config = ConfigDict(populate_by_name=True)
