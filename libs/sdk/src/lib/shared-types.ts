/**
 * Shared types imported from @openspawn/shared-types
 * These are inlined here to make the SDK self-contained and publishable
 */

export enum AgentRole {
  WORKER = 'worker',
  HR = 'hr',
  FOUNDER = 'founder',
  ADMIN = 'admin',
}

export enum AgentStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  REVOKED = 'revoked',
}

export enum AgentMode {
  WORKER = 'worker',
  ORCHESTRATOR = 'orchestrator',
  OBSERVER = 'observer',
}

export enum TaskStatus {
  BACKLOG = 'backlog',
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
  BLOCKED = 'blocked',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  URGENT = 'urgent',
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low',
}

export enum CreditType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export enum MessageType {
  TEXT = 'text',
  HANDOFF = 'handoff',
  STATUS_UPDATE = 'status_update',
  REQUEST = 'request',
}

export enum ChannelType {
  TASK = 'task',
  AGENT = 'agent',
  BROADCAST = 'broadcast',
  GENERAL = 'general',
}

export enum Proficiency {
  BASIC = 'basic',
  STANDARD = 'standard',
  EXPERT = 'expert',
}

export enum EscalationReason {
  BLOCKED_TIMEOUT = 'BLOCKED_TIMEOUT',
  STALE_TASK = 'STALE_TASK',
  SLA_BREACH = 'SLA_BREACH',
  ASSIGNEE_INACTIVE = 'ASSIGNEE_INACTIVE',
  QUALITY_ISSUES = 'QUALITY_ISSUES',
  MANUAL = 'MANUAL',
  CAPACITY_OVERFLOW = 'CAPACITY_OVERFLOW',
}

export enum ReputationLevel {
  NEW = 'NEW',
  PROBATION = 'PROBATION',
  TRUSTED = 'TRUSTED',
  VETERAN = 'VETERAN',
  ELITE = 'ELITE',
}

export enum ConsensusStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}
