// Hooks
export { useACPMetrics, type ACPMetrics } from "./hooks/use-acp-metrics";
export { useAgentHealth, type AgentHealth } from "./hooks/use-agent-health";
export { useAgents, type Agent } from "./hooks/use-agents";
export { useContainerSize } from "./hooks/use-container-size";
export { useCredits, type CreditTransaction } from "./hooks/use-credits";
export { useEvents, type Event } from "./hooks/use-events";
export { useMcpTasks, type KanbanTask } from "./hooks/use-mcp-tasks";
export type {
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
export { usePresence, type AgentPresence, type PresenceStatus } from "./hooks/use-presence";
export { useRepoTasks, type RepoTask, type RepoTaskStatus } from "./hooks/use-repo-tasks";
export {
  useSandboxMetrics,
  useSparklines,
  type MetricsSnapshot,
} from "./hooks/use-sandbox-metrics";
export { useSandboxSSE, type SandboxSSEEvent } from "./hooks/use-sandbox-sse";
export { useSandboxTickInvalidation } from "./hooks/use-sandbox-tick";
export { useTasks, type Task } from "./hooks/use-tasks";
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

// GraphQL fetcher (legacy — kept for demo/sandbox mock compatibility)
export { fetcher, graphqlClient, setDemoFetcher, setSandboxFetcher } from "./graphql/fetcher";

// GraphQL-generated enums + types (legacy — still used by demo data layer)
export {
  AgentMode,
  AgentRole,
  AgentStatus,
  TaskPriority,
  TaskStatus,
  type AgentFieldsFragment,
} from "./graphql/generated/hooks";

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
