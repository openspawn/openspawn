"""Type definitions mirroring OpenSpawn API enums and schemas."""

from __future__ import annotations

import enum
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


# ── Enums ─────────────────────────────────────────────────────────────────────


class AgentMode(str, enum.Enum):
    WORKER = "worker"
    ORCHESTRATOR = "orchestrator"
    OBSERVER = "observer"


class AgentRole(str, enum.Enum):
    WORKER = "worker"
    HR = "hr"
    FOUNDER = "founder"
    ADMIN = "admin"
    COO = "coo"
    TALENT = "talent"
    LEAD = "lead"
    SENIOR = "senior"
    MANAGER = "manager"
    INTERN = "intern"


class AgentStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    IDLE = "idle"
    BUSY = "busy"
    PAUSED = "paused"
    SUSPENDED = "suspended"
    REVOKED = "revoked"


class TaskStatus(str, enum.Enum):
    BACKLOG = "backlog"
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    DONE = "done"
    CANCELLED = "cancelled"
    BLOCKED = "blocked"


class TaskPriority(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    NORMAL = "normal"
    LOW = "low"


class MemoryType(str, enum.Enum):
    FACT = "fact"
    LESSON = "lesson"
    DECISION = "decision"
    PREFERENCE = "preference"
    OBSERVATION = "observation"


class MemoryVisibility(str, enum.Enum):
    PRIVATE = "private"
    TEAM = "team"
    ORG = "org"
    PUBLIC = "public"


class EventType(str, enum.Enum):
    TASK_CREATED = "task.created"
    TASK_COMPLETED = "task.completed"
    TASK_FAILED = "task.failed"
    AGENT_REGISTERED = "agent.registered"
    AGENT_STATUS_CHANGED = "agent.status_changed"
    MEMORY_STORED = "memory.stored"
    CUSTOM = "custom"


# ── Data Classes ──────────────────────────────────────────────────────────────


@dataclass
class AgentInfo:
    """Agent registration response data."""

    id: str
    org_id: str
    agent_id: str
    name: str
    level: int
    model: str
    status: AgentStatus
    role: AgentRole
    mode: AgentMode
    trust_score: int = 50
    hmac_secret: str | None = None


@dataclass
class TaskInfo:
    """Task response data."""

    id: str
    title: str
    status: TaskStatus
    priority: TaskPriority
    assignee_id: str | None = None
    description: str | None = None
    created_at: str | None = None
    updated_at: str | None = None
    tags: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class MemoryInfo:
    """Memory response data."""

    id: str
    content: str
    memory_type: MemoryType
    visibility: MemoryVisibility
    source: str
    created_at: str | None = None


@dataclass
class TokenResponse:
    """Agent JWT token response."""

    access_token: str
    token_type: str
    expires_in: int
    scopes: list[str]
