/**
 * Reasons for task escalation
 */
export enum EscalationReason {
  /** Task blocked for too long */
  BLOCKED_TIMEOUT = "BLOCKED_TIMEOUT",
  /** Task in progress but no updates */
  STALE_TASK = "STALE_TASK",
  /** Approaching or past due date */
  SLA_BREACH = "SLA_BREACH",
  /** Assignee unresponsive */
  ASSIGNEE_INACTIVE = "ASSIGNEE_INACTIVE",
  /** Multiple rework cycles */
  QUALITY_ISSUES = "QUALITY_ISSUES",
  /** Manual escalation by agent */
  MANUAL = "MANUAL",
  /** Reassigned due to capacity */
  CAPACITY_OVERFLOW = "CAPACITY_OVERFLOW",
}

import { TaskPriority } from "./task-priority.enum";

/**
 * Default escalation thresholds (in hours)
 */
export const ESCALATION_THRESHOLDS: Record<TaskPriority, number> = {
  [TaskPriority.CRITICAL]: 1,
  [TaskPriority.URGENT]: 2,
  [TaskPriority.HIGH]: 8,
  [TaskPriority.NORMAL]: 24,
  [TaskPriority.LOW]: 72,
};
