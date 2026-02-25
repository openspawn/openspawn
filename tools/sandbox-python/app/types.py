"""Core domain types for the BikiniBottom sandbox simulation."""

from __future__ import annotations

import time
import uuid
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ── Enums ────────────────────────────────────────────────────────────────────


class EscalationReason(str, Enum):
    BLOCKED = "BLOCKED"
    OUT_OF_DOMAIN = "OUT_OF_DOMAIN"
    OVER_BUDGET = "OVER_BUDGET"
    LOW_CONFIDENCE = "LOW_CONFIDENCE"
    TIMEOUT = "TIMEOUT"
    DEPENDENCY = "DEPENDENCY"


class ACPType(str, Enum):
    ACK = "ack"
    PROGRESS = "progress"
    ESCALATION = "escalation"
    COMPLETION = "completion"
    DELEGATION = "delegation"
    STATUS_REQUEST = "status_request"


class AgentRole(str, Enum):
    COO = "coo"
    TALENT = "talent"
    LEAD = "lead"
    SENIOR = "senior"
    WORKER = "worker"
    INTERN = "intern"


class AgentStatus(str, Enum):
    ACTIVE = "active"
    IDLE = "idle"
    BUSY = "busy"
    PENDING = "pending"


class TaskPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"


class TaskStatus(str, Enum):
    BACKLOG = "backlog"
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"
    REJECTED = "rejected"
    BLOCKED = "blocked"


class TriggerMode(str, Enum):
    POLLING = "polling"
    EVENT_DRIVEN = "event-driven"


# ── Models ───────────────────────────────────────────────────────────────────


def _acp_id() -> str:
    return f"acp-{int(time.time() * 1000)}-{uuid.uuid4().hex[:6]}"


def _now_ms() -> int:
    return int(time.time() * 1000)


class ACPMessage(BaseModel):
    id: str = Field(default_factory=_acp_id)
    type: ACPType
    from_agent: str = Field(alias="from")
    to: str
    task_id: str = Field(default="", alias="taskId")
    body: Optional[str] = None
    reason: Optional[str] = None
    summary: Optional[str] = None
    pct: Optional[int] = None
    timestamp: int = Field(default_factory=_now_ms)

    model_config = {"populate_by_name": True}


class AgentStats(BaseModel):
    tasks_completed: int = 0
    tasks_failed: int = 0
    messages_sent: int = 0
    credits_earned: float = 0
    credits_spent: float = 0


class SandboxAgent(BaseModel):
    id: str
    name: str
    role: AgentRole
    level: int
    domain: str
    avatar: Optional[str] = None
    avatar_color: Optional[str] = None
    avatar_url: Optional[str] = None
    parent_id: Optional[str] = None
    status: AgentStatus = AgentStatus.ACTIVE
    system_prompt: str = ""
    task_ids: list[str] = Field(default_factory=list)
    recent_messages: list[ACPMessage] = Field(default_factory=list)
    trigger: TriggerMode = TriggerMode.POLLING
    trigger_on: Optional[list[ACPType]] = None
    inbox: list[ACPMessage] = Field(default_factory=list)
    last_acted_tick: Optional[int] = None
    stats: AgentStats = Field(default_factory=AgentStats)


class SandboxTask(BaseModel):
    id: str
    title: str
    description: str = ""
    priority: TaskPriority = TaskPriority.NORMAL
    status: TaskStatus = TaskStatus.BACKLOG
    assignee_id: Optional[str] = None
    creator_id: str = ""
    created_at: int = Field(default_factory=_now_ms)
    updated_at: int = Field(default_factory=_now_ms)
    activity_log: list[ACPMessage] = Field(default_factory=list)
    acked: bool = False
    blocked_reason: Optional[str] = None
    epic_id: Optional[str] = None
    parent_task_id: Optional[str] = None
    depends_on: Optional[list[str]] = None
    subtask_ids: Optional[list[str]] = None

    # Internal tick counters (not serialized to API)
    _stage_tick_count: int = 0
    _blocked_ticks: int = 0


class SandboxEvent(BaseModel):
    type: str
    agent_id: Optional[str] = None
    task_id: Optional[str] = None
    message: str
    data: Optional[dict] = None
    timestamp: int = Field(default_factory=_now_ms)


class MetricsSnapshot(BaseModel):
    tick: int
    timestamp: int
    active_agents: int
    total_tasks: int
    tasks_done: int
    tasks_in_progress: int
    tasks_in_review: int
    total_credits_earned: float
    total_credits_spent: float
    message_count: int
