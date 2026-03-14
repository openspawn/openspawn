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
    COO = "coo"
    TALENT = "talent"
    LEAD = "lead"
    SENIOR = "senior"
    MANAGER = "manager"
    INTERN = "intern"


class AgentStatus(enum.StrEnum):
    PENDING = "pending"
    ACTIVE = "active"
    IDLE = "idle"
    BUSY = "busy"
    PAUSED = "paused"
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


class EntityType(enum.StrEnum):
    PERSON = "person"
    TOOL = "tool"
    CONCEPT = "concept"
    PROCESS = "process"
    SYSTEM = "system"
    LOCATION = "location"
    EVENT = "event"


class EscalationReason(enum.StrEnum):
    BLOCKED_TIMEOUT = "BLOCKED_TIMEOUT"
    STALE_TASK = "STALE_TASK"
    SLA_BREACH = "SLA_BREACH"
    ASSIGNEE_INACTIVE = "ASSIGNEE_INACTIVE"
    QUALITY_ISSUES = "QUALITY_ISSUES"
    MANUAL = "MANUAL"
    CAPACITY_OVERFLOW = "CAPACITY_OVERFLOW"


class EventSeverity(enum.StrEnum):
    DEBUG = "debug"
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


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
    CRITICAL = "critical"
    URGENT = "urgent"
    HIGH = "high"
    NORMAL = "normal"
    LOW = "low"


class TaskStatus(enum.StrEnum):
    BACKLOG = "backlog"
    TODO = "todo"
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"
    BLOCKED = "blocked"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


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


class MemoryType(enum.StrEnum):
    EPISODIC = "episodic"
    SEMANTIC = "semantic"
    GRAPH = "graph"


class MemoryVisibility(enum.StrEnum):
    SHARED = "shared"
    PRIVATE = "private"
    TARGETED = "targeted"


class MemorySource(enum.StrEnum):
    TASK_COMPLETION = "task_completion"
    CODE_CHANGE = "code_change"
    OBSERVATION = "observation"
    INFERENCE = "inference"
    UNKNOWN = "unknown"


class SimulationEventType(enum.StrEnum):
    AGENT_CREATED = "AGENT_CREATED"
    AGENT_ACTIVATED = "AGENT_ACTIVATED"
    AGENT_PROMOTED = "AGENT_PROMOTED"
    AGENT_TERMINATED = "AGENT_TERMINATED"
    AGENT_STATUS_CHANGED = "AGENT_STATUS_CHANGED"
    AGENT_DESPAWNED = "AGENT_DESPAWNED"
    AGENT_IDLE = "AGENT_IDLE"
    TASK_CREATED = "TASK_CREATED"
    TASK_ASSIGNED = "TASK_ASSIGNED"
    TASK_COMPLETED = "TASK_COMPLETED"
    TASK_COMPLETION_REJECTED = "TASK_COMPLETION_REJECTED"
    CREDIT_EARNED = "CREDIT_EARNED"
    CREDIT_SPENT = "CREDIT_SPENT"
    PREHOOK_BLOCKED = "PREHOOK_BLOCKED"
    PREHOOK_ALLOWED = "PREHOOK_ALLOWED"
    SYSTEM_EVENT = "SYSTEM_EVENT"


class DemoMessageCategory(enum.StrEnum):
    TASK = "task"
    STATUS = "status"
    REPORT = "report"
    QUESTION = "question"
    ESCALATION = "escalation"
    GENERAL = "general"


class ACPMessageType(enum.StrEnum):
    ACK = "ack"
    PROGRESS = "progress"
    ESCALATION = "escalation"
    COMPLETION = "completion"
    DELEGATION = "delegation"
    STATUS_REQUEST = "status_request"


class SandboxEscalationReason(enum.StrEnum):
    BLOCKED = "BLOCKED"
    OUT_OF_DOMAIN = "OUT_OF_DOMAIN"
    OVER_BUDGET = "OVER_BUDGET"
    LOW_CONFIDENCE = "LOW_CONFIDENCE"
    TIMEOUT = "TIMEOUT"
    DEPENDENCY = "DEPENDENCY"


class TriggerMode(enum.StrEnum):
    POLLING = "polling"
    EVENT_DRIVEN = "event-driven"


class WebhookHookType(enum.StrEnum):
    PRE = "pre"
    POST = "post"


class SSEEventType(enum.StrEnum):
    """Event types pushed via Server-Sent Events."""

    # Task lifecycle
    TASK_CREATED = "task.created"
    TASK_TRANSITIONED = "task.transitioned"
    TASK_ASSIGNED = "task.assigned"
    TASK_COMPLETED = "task.completed"

    # Messages
    MESSAGE_SENT = "message.sent"

    # Escalations
    ESCALATION_CREATED = "escalation.created"
    ESCALATION_RESOLVED = "escalation.resolved"

    # Agent status
    AGENT_STATUS_CHANGED = "agent.status_changed"

    # Future: Artifact Bus (#665)
    ARTIFACT_PUBLISHED = "artifact.published"
    ARTIFACT_UPDATED = "artifact.updated"

    # Future: Autonomy Dial (#668)
    APPROVAL_REQUESTED = "approval.requested"
    APPROVAL_RESOLVED = "approval.resolved"
