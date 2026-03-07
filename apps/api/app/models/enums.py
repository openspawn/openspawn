import enum


class AgentMode(enum.StrEnum):
    WORKER = "worker"
    ORCHESTRATOR = "orchestrator"
    OBSERVER = "observer"


class AgentRole(enum.StrEnum):
    WORKER = "worker"
    HR = "hr"
    FOUNDER = "founder"
    ADMIN = "admin"


class AgentStatus(enum.StrEnum):
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    REVOKED = "revoked"


class AmountMode(enum.StrEnum):
    FIXED = "fixed"
    DYNAMIC = "dynamic"


class ChannelType(enum.StrEnum):
    TASK = "task"
    AGENT = "agent"
    BROADCAST = "broadcast"
    GENERAL = "general"


class ConsensusStatus(enum.StrEnum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


class ConsensusType(enum.StrEnum):
    AGENT_PROMOTION = "AGENT_PROMOTION"
    AGENT_DEMOTION = "AGENT_DEMOTION"
    AGENT_REVOCATION = "AGENT_REVOCATION"
    CREDIT_TRANSFER = "CREDIT_TRANSFER"
    TASK_APPROVAL = "TASK_APPROVAL"
    POLICY_CHANGE = "POLICY_CHANGE"
    CUSTOM = "CUSTOM"


class CreditType(enum.StrEnum):
    CREDIT = "credit"
    DEBIT = "debit"


class EscalationReason(enum.StrEnum):
    BLOCKED_TIMEOUT = "BLOCKED_TIMEOUT"
    STALE_TASK = "STALE_TASK"
    SLA_BREACH = "SLA_BREACH"
    ASSIGNEE_INACTIVE = "ASSIGNEE_INACTIVE"
    QUALITY_ISSUES = "QUALITY_ISSUES"
    MANUAL = "MANUAL"
    CAPACITY_OVERFLOW = "CAPACITY_OVERFLOW"


class EventSeverity(enum.StrEnum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"


class IdleReason(enum.StrEnum):
    TASK_COMPLETE = "task_complete"
    BLOCKED = "blocked"
    AWAITING_INPUT = "awaiting_input"
    UNASSIGNED = "unassigned"
    NEWLY_ACTIVATED = "newly_activated"


class MessageType(enum.StrEnum):
    TEXT = "text"
    HANDOFF = "handoff"
    STATUS_UPDATE = "status_update"
    REQUEST = "request"


class Proficiency(enum.StrEnum):
    BASIC = "basic"
    STANDARD = "standard"
    EXPERT = "expert"


class ReputationEventType(enum.StrEnum):
    TASK_COMPLETED = "TASK_COMPLETED"
    TASK_FAILED = "TASK_FAILED"
    TASK_REWORK = "TASK_REWORK"
    ON_TIME_DELIVERY = "ON_TIME_DELIVERY"
    LATE_DELIVERY = "LATE_DELIVERY"
    QUALITY_BONUS = "QUALITY_BONUS"
    QUALITY_PENALTY = "QUALITY_PENALTY"
    LEVEL_UP = "LEVEL_UP"
    LEVEL_DOWN = "LEVEL_DOWN"
    INACTIVITY_DECAY = "INACTIVITY_DECAY"
    MANUAL_ADJUSTMENT = "MANUAL_ADJUSTMENT"


class ReputationLevel(enum.StrEnum):
    NEW = "NEW"
    PROBATION = "PROBATION"
    TRUSTED = "TRUSTED"
    VETERAN = "VETERAN"
    ELITE = "ELITE"


class TaskPriority(enum.StrEnum):
    URGENT = "urgent"
    HIGH = "high"
    NORMAL = "normal"
    LOW = "low"


class TaskStatus(enum.StrEnum):
    BACKLOG = "backlog"
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"
    BLOCKED = "blocked"
    CANCELLED = "cancelled"


class VoteValue(enum.StrEnum):
    APPROVE = "APPROVE"
    REJECT = "REJECT"
    ABSTAIN = "ABSTAIN"


class UserRole(enum.StrEnum):
    ADMIN = "admin"
    OPERATOR = "operator"
    VIEWER = "viewer"


class ApiKeyScope(enum.StrEnum):
    READ = "read"
    WRITE = "write"
    ADMIN = "admin"
