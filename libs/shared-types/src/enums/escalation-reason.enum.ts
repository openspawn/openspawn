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

/**
 * Default escalation thresholds (in hours)
 */
export const ESCALATION_THRESHOLDS: Record<string, number> = {
  URGENT: 2,    // Escalate urgent tasks after 2 hours blocked
  HIGH: 8,      // High priority after 8 hours
  NORMAL: 24,   // Normal after 24 hours
  LOW: 72,      // Low priority after 72 hours
};
