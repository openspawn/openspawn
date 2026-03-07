import { Injectable, UnprocessableEntityException } from "@nestjs/common";

import { TaskStatus } from "@openspawn/shared-types";

/**
 * Valid state transitions for tasks
 */
const TRANSITION_MAP: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.BACKLOG]: [TaskStatus.TODO, TaskStatus.CANCELLED],
  [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED, TaskStatus.CANCELLED],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.REVIEW, TaskStatus.BLOCKED, TaskStatus.CANCELLED],
  [TaskStatus.REVIEW]: [TaskStatus.DONE, TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
  [TaskStatus.BLOCKED]: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
  [TaskStatus.DONE]: [], // Terminal state
  [TaskStatus.CANCELLED]: [], // Terminal state
};

@Injectable()
export class TaskTransitionService {
  /**
   * Check if a transition is valid
   */
  isValidTransition(from: TaskStatus, to: TaskStatus): boolean {
    const validTargets = TRANSITION_MAP[from];
    return validTargets?.includes(to) ?? false;
  }

  /**
   * Validate transition, throw if invalid
   */
  validateTransition(from: TaskStatus, to: TaskStatus): void {
    if (!this.isValidTransition(from, to)) {
      throw new UnprocessableEntityException(`Invalid transition: ${from} → ${to}`);
    }
  }

  /**
   * Get valid transitions from a status
   */
  getValidTransitions(from: TaskStatus): TaskStatus[] {
    return TRANSITION_MAP[from] || [];
  }

  /**
   * Check if status is terminal
   */
  isTerminal(status: TaskStatus): boolean {
    return status === TaskStatus.DONE || status === TaskStatus.CANCELLED;
  }
}
