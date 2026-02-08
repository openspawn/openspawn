/**
 * Types of events that affect an agent's reputation/trust score
 */
export enum ReputationEventType {
  /** Task completed successfully */
  TASK_COMPLETED = "TASK_COMPLETED",
  /** Task failed or cancelled after assignment */
  TASK_FAILED = "TASK_FAILED",
  /** Task sent back for rework */
  TASK_REWORK = "TASK_REWORK",
  /** Task delivered on time */
  ON_TIME_DELIVERY = "ON_TIME_DELIVERY",
  /** Task delivered late */
  LATE_DELIVERY = "LATE_DELIVERY",
  /** Quality bonus awarded by supervisor */
  QUALITY_BONUS = "QUALITY_BONUS",
  /** Quality penalty from supervisor */
  QUALITY_PENALTY = "QUALITY_PENALTY",
  /** Agent promoted to higher level */
  LEVEL_UP = "LEVEL_UP",
  /** Agent demoted to lower level */
  LEVEL_DOWN = "LEVEL_DOWN",
  /** Trust score decay from inactivity */
  INACTIVITY_DECAY = "INACTIVITY_DECAY",
  /** Manual trust adjustment by admin */
  MANUAL_ADJUSTMENT = "MANUAL_ADJUSTMENT",
}

/**
 * Default trust score impact for each event type
 */
export const REPUTATION_IMPACT: Record<ReputationEventType, number> = {
  [ReputationEventType.TASK_COMPLETED]: 5,
  [ReputationEventType.TASK_FAILED]: -10,
  [ReputationEventType.TASK_REWORK]: -3,
  [ReputationEventType.ON_TIME_DELIVERY]: 2,
  [ReputationEventType.LATE_DELIVERY]: -5,
  [ReputationEventType.QUALITY_BONUS]: 10,
  [ReputationEventType.QUALITY_PENALTY]: -10,
  [ReputationEventType.LEVEL_UP]: 5,
  [ReputationEventType.LEVEL_DOWN]: -5,
  [ReputationEventType.INACTIVITY_DECAY]: -1,
  [ReputationEventType.MANUAL_ADJUSTMENT]: 0, // Variable
};
