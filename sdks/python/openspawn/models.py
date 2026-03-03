"""Data models for the OpenSpawn API."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Optional


class TaskStatus(str, Enum):
    PENDING = "pending"
    CLAIMED = "claimed"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    REVIEW = "review"
    DONE = "done"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskPriority(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


@dataclass
class Agent:
    id: str
    name: str
    role: str
    level: int = 5
    domain: str = "general"
    status: str = "active"
    trust_score: float = 1.0
    org_id: Optional[str] = None
    created_at: Optional[datetime] = None
    metadata: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Agent:
        return cls(
            id=data["id"],
            name=data.get("name", data["id"]),
            role=data.get("role", ""),
            level=data.get("level", 5),
            domain=data.get("domain", "general"),
            status=data.get("status", "active"),
            trust_score=data.get("trustScore", data.get("trust_score", 1.0)),
            org_id=data.get("orgId", data.get("org_id")),
            created_at=_parse_dt(data.get("createdAt", data.get("created_at"))),
            metadata=data.get("metadata", {}),
        )


@dataclass
class Task:
    id: str
    title: str
    status: TaskStatus = TaskStatus.PENDING
    priority: TaskPriority = TaskPriority.MEDIUM
    description: str = ""
    assignee_agent_id: Optional[str] = None
    creator_agent_id: Optional[str] = None
    org_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    metadata: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Task:
        return cls(
            id=data["id"],
            title=data.get("title", ""),
            status=TaskStatus(data.get("status", "pending")),
            priority=TaskPriority(data.get("priority", "medium")),
            description=data.get("description", ""),
            assignee_agent_id=data.get("assigneeAgentId", data.get("assignee_agent_id")),
            creator_agent_id=data.get("creatorAgentId", data.get("creator_agent_id")),
            org_id=data.get("orgId", data.get("org_id")),
            created_at=_parse_dt(data.get("createdAt", data.get("created_at"))),
            updated_at=_parse_dt(data.get("updatedAt", data.get("updated_at"))),
            metadata=data.get("metadata", {}),
        )


@dataclass
class Channel:
    id: str
    name: str
    org_id: Optional[str] = None
    created_at: Optional[datetime] = None

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Channel:
        return cls(
            id=data["id"],
            name=data.get("name", ""),
            org_id=data.get("orgId", data.get("org_id")),
            created_at=_parse_dt(data.get("createdAt", data.get("created_at"))),
        )


@dataclass
class Message:
    id: str
    content: str
    sender_agent_id: str
    channel_id: Optional[str] = None
    thread_id: Optional[str] = None
    created_at: Optional[datetime] = None

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Message:
        return cls(
            id=data["id"],
            content=data.get("content", ""),
            sender_agent_id=data.get("senderAgentId", data.get("sender_agent_id", "")),
            channel_id=data.get("channelId", data.get("channel_id")),
            thread_id=data.get("threadId", data.get("thread_id")),
            created_at=_parse_dt(data.get("createdAt", data.get("created_at"))),
        )


@dataclass
class CreditBalance:
    agent_id: str
    balance: float
    budget: float = 0.0
    spent: float = 0.0

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> CreditBalance:
        return cls(
            agent_id=data.get("agentId", data.get("agent_id", "")),
            balance=data.get("balance", 0.0),
            budget=data.get("budget", 0.0),
            spent=data.get("spent", 0.0),
        )


@dataclass
class Escalation:
    id: str
    task_id: str
    from_agent_id: str
    to_agent_id: str
    reason: str = ""
    status: str = "open"
    created_at: Optional[datetime] = None

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Escalation:
        return cls(
            id=data["id"],
            task_id=data.get("taskId", data.get("task_id", "")),
            from_agent_id=data.get("fromAgentId", data.get("from_agent_id", "")),
            to_agent_id=data.get("toAgentId", data.get("to_agent_id", "")),
            reason=data.get("reason", ""),
            status=data.get("status", "open"),
            created_at=_parse_dt(data.get("createdAt", data.get("created_at"))),
        )


def _parse_dt(val: Any) -> Optional[datetime]:
    if val is None:
        return None
    if isinstance(val, datetime):
        return val
    try:
        return datetime.fromisoformat(str(val).replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None
