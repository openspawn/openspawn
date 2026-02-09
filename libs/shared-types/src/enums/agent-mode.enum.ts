/**
 * Agent operational modes that restrict what actions an agent can perform.
 *
 * Similar to Claude Code's delegate mode - allows coordination-only agents
 * that can spawn/manage other agents but cannot execute work themselves.
 */
export enum AgentMode {
  /** Full access - can do everything */
  WORKER = "worker",
  /** Coordination only - can spawn, message, assign, delegate but NOT execute tasks */
  ORCHESTRATOR = "orchestrator",
  /** Read-only access - can only observe and read data */
  OBSERVER = "observer",
}

/**
 * Actions allowed per agent mode.
 * WORKER has wildcard access, others are restricted.
 */
export const MODE_ALLOWED_ACTIONS: Record<AgentMode, readonly string[]> = {
  [AgentMode.WORKER]: ["*"],
  [AgentMode.ORCHESTRATOR]: [
    "spawn",
    "message",
    "assign",
    "delegate",
    "approve",
    "reject",
    "read",
    "create_task",
  ],
  [AgentMode.OBSERVER]: ["read"],
} as const;

/**
 * Check if an agent mode allows a specific action
 */
export function isModeAllowed(mode: AgentMode, action: string): boolean {
  const allowed = MODE_ALLOWED_ACTIONS[mode];
  return allowed.includes("*") || allowed.includes(action);
}

/**
 * Human-readable labels for agent modes
 */
export const MODE_LABELS: Record<AgentMode, string> = {
  [AgentMode.WORKER]: "Worker",
  [AgentMode.ORCHESTRATOR]: "Orchestrator",
  [AgentMode.OBSERVER]: "Observer",
} as const;

/**
 * Descriptions for each agent mode
 */
export const MODE_DESCRIPTIONS: Record<AgentMode, string> = {
  [AgentMode.WORKER]:
    "Full operational access. Can execute tasks, spawn agents, and perform all actions.",
  [AgentMode.ORCHESTRATOR]:
    "Coordination only. Can spawn agents, assign tasks, and message, but cannot execute work directly.",
  [AgentMode.OBSERVER]:
    "Read-only access. Can observe the system but cannot make any changes.",
} as const;
