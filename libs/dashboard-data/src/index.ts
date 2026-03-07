// Hooks
export { useACPMetrics, type ACPMetrics } from "./hooks/use-acp-metrics";
export { useAgentHealth, type AgentHealth } from "./hooks/use-agent-health";
export { useAgents, type Agent } from "./hooks/use-agents";
export { useContainerSize } from "./hooks/use-container-size";
export { useCredits, type CreditTransaction } from "./hooks/use-credits";
export { useEvents, type Event } from "./hooks/use-events";
export { useMcpTasks, type KanbanTask } from "./hooks/use-mcp-tasks";
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

// GraphQL
export {
  fetcher,
  isDemoMode,
  isSandboxMode,
  graphqlClient,
  setDemoFetcher,
  setSandboxFetcher,
} from "./graphql/fetcher";
export * from "./graphql/operations";
// Re-export generated GraphQL types and hooks
// Note: hooks.ts re-exports types from graphql.ts, so we only export hooks.ts to avoid conflicts
export * from "./graphql/generated/hooks";
export * from "./graphql/generated/gql";

// Lib utilities
export * from "./lib/avatar-utils";
export * from "./lib/avatar";
export { DEFAULT_ORG_ID } from "./lib/constants";
export * from "./lib/dashboard-theme";
export * from "./lib/date-format";
export * from "./lib/debug";
export * from "./lib/resolve-avatar-url";
export { SANDBOX_URL } from "./lib/sandbox-url";
export * from "./lib/status-colors";
export * from "./lib/toast";

// Document node exports (used by demo mock-fetcher)
export {
  TasksDocument,
  TaskDocument,
  AgentsDocument,
  CreditHistoryDocument,
  EventsDocument,
  MessagesDocument,
} from "./graphql/generated/graphql";
export { useDashboardPanels, registerPanelComponents } from "./hooks/use-dashboard-panels";
