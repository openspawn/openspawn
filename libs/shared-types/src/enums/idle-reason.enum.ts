/**
 * Reasons an agent became idle (available for work)
 */
export enum IdleReason {
  TASK_COMPLETE = "task_complete",
  BLOCKED = "blocked",
  AWAITING_INPUT = "awaiting_input",
  UNASSIGNED = "unassigned",
  NEWLY_ACTIVATED = "newly_activated",
}
