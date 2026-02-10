"""Enums for OpenSpawn models."""

from enum import Enum


class AgentStatus(str, Enum):
    """Agent status."""

    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    REVOKED = "revoked"


class AgentRole(str, Enum):
    """Agent role."""

    WORKER = "worker"
    HR = "hr"
    FOUNDER = "founder"
    ADMIN = "admin"


class TaskStatus(str, Enum):
    """Task status."""

    BACKLOG = "backlog"
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"
    BLOCKED = "blocked"
    CANCELLED = "cancelled"


class TaskPriority(str, Enum):
    """Task priority."""

    URGENT = "urgent"
    HIGH = "high"
    NORMAL = "normal"
    LOW = "low"


class MessageType(str, Enum):
    """Message type."""

    TEXT = "text"
    HANDOFF = "handoff"
    STATUS_UPDATE = "status_update"
    REQUEST = "request"


class CreditType(str, Enum):
    """Credit transaction type."""

    CREDIT = "credit"
    DEBIT = "debit"


class Proficiency(str, Enum):
    """Capability proficiency level."""

    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class EscalationReason(str, Enum):
    """Task escalation reason."""

    BLOCKED = "blocked"
    REQUIRES_APPROVAL = "requires_approval"
    COMPLEXITY = "complexity"
    BUDGET_EXCEEDED = "budget_exceeded"
    QUALITY_ISSUE = "quality_issue"
    OTHER = "other"


class EventSeverity(str, Enum):
    """Event severity level."""

    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"
