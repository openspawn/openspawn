// Hooks
export { useACPMetrics, type ACPMetrics } from "./hooks/use-acp-metrics";
export { useAgentHealth, type AgentHealth } from "./hooks/use-agent-health";
export { useAgents, type Agent } from "./hooks/use-agents";
export { useContainerSize } from "./hooks/use-container-size";
export { useCredits, type CreditTransaction } from "./hooks/use-credits";
export { useEvents, type Event } from "./hooks/use-events";
export { useMcpTasks, type KanbanTask } from "./hooks/use-mcp-tasks";
export {
  TaskPriority as McpTaskPriority,
  TaskStatus as McpTaskStatus,
} from "./hooks/use-mcp-tasks";
export { useMcpOrgStatus, type McpOrgData } from "./hooks/use-mcp";
export {
  useMessages,
  useConversations,
  useConversationMessages,
  type Message,
  type Conversation,
} from "./hooks/use-messages";
export { usePresence, PresenceStatus, type AgentPresence } from "./hooks/use-presence";
export { useRepoTasks, RepoTaskStatus, type RepoTask } from "./hooks/use-repo-tasks";
export {
  useSandboxMetrics,
  useSparklines,
  type MetricsSnapshot,
} from "./hooks/use-sandbox-metrics";
export { useSandboxSSE, type SandboxSSEEvent } from "./hooks/use-sandbox-sse";
export { useSandboxTickInvalidation } from "./hooks/use-sandbox-tick";
export { useTasks, type Task, type TaskRejection } from "./hooks/use-tasks";
export { useTouchDevice } from "./hooks/use-touch-device";
export { useMemories, useMemorySearch, useContradictions } from "./hooks/use-memory";
export { useGraphEntities, useGraphRelationships, useGraphCytoscape } from "./hooks/use-graph";

// Services
export {
  orgStatus,
  taskList,
  taskCreate,
  taskClaim,
  taskComplete,
  agentList,
  agentRegister,
  agentUpdateStatus,
  agentFire,
  eventList,
  escalate,
  McpError,
} from "./services/mcp-client";

// Contexts
export { AuthProvider, useAuth, useOAuthCallback, type User } from "./contexts/auth-context";
export { SidePanelProvider, useSidePanel } from "./contexts/side-panel-context";

// Mode detection
export { isDemoMode, isSandboxMode } from "./lib/mode";

// Enums — canonical source is @openspawn/shared-types, re-exported for convenience
export {
  AgentMode,
  AgentRole,
  AgentStatus,
  ReputationLevel,
  TaskPriority,
  TaskStatus,
} from "@openspawn/shared-types";

// Agent type for components — mirrors the GraphQL AgentFieldsFragment shape
export interface AgentFields {
  id: string;
  agentId: string;
  name: string;
  role: string;
  mode: string;
  status: string;
  level: number;
  model: string;
  currentBalance: number;
  budgetPeriodLimit?: number | null;
  budgetPeriodSpent: number;
  managementFeePct: number;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
  trustScore: number;
  reputationLevel: string;
  tasksCompleted: number;
  tasksSuccessful: number;
  lastActivityAt?: string | null;
  lastPromotionAt?: string | null;
  lifetimeEarnings: number;
  defaultAutonomyLevel: number;
  domain?: string | null;
  teamId?: string | null;
  avatar?: string | null;
  avatarColor?: string | null;
  avatarUrl?: string | null;
}

/** @deprecated Use AgentFields instead */
export type AgentFieldsFragment = AgentFields;

// Lib utilities
export * from "./lib/avatar-utils";
export * from "./lib/avatar";
export { DEFAULT_ORG_ID } from "./lib/constants";
export * from "./lib/dashboard-theme";
export * from "./lib/date-format";
export * from "./lib/debug";
export * from "./lib/resolve-avatar-url";
export { getSandboxUrl, SANDBOX_URL } from "./lib/sandbox-url";
export * from "./lib/status-colors";
export * from "./lib/toast";

// REST hooks + client
export { api } from "./rest/client";
export * from "./rest/hooks";

export { useDashboardPanels, registerPanelComponents } from "./hooks/use-dashboard-panels";
