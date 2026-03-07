/**
 * Shared types, constants, and context for the AgentNetwork visualization.
 * Extracted from agent-network.tsx to reduce file size.
 */
import { createContext } from "react";

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface TaskDelegation {
  id: string;
  fromId: string;
  toId: string;
  taskTitle: string;
  startTime: number;
}

export interface AgentActivity {
  taskCount: number;
  messageCount: number;
  activityLevel: "hot" | "warm" | "cool" | "idle";
}

export interface EdgeMessageData {
  count: number;
  lastMessage?: string;
  lastMessageTime?: string;
}

export interface AgentHealthData {
  completionRate: number;
  creditUsage: number;
  ringStatus: "active" | "idle" | "busy" | "error";
}

export interface NetworkContextValue {
  delegations: TaskDelegation[];
  speed: number;
  agentActivity: Map<string, AgentActivity>;
  edgeMessages: Map<string, EdgeMessageData>;
  agentHealth: Map<string, AgentHealthData>;
  isMobileOrTouch: boolean;
  dimIdle: boolean;
}

export interface AgentNodeData extends Record<string, unknown> {
  label: string;
  agentId: string;
  role: string;
  level: number;
  status: "active" | "pending" | "paused" | "suspended";
  credits: number;
  isHuman?: boolean;
  domain?: string;
  tasksCompleted?: number;
  avatar?: string;
  avatarColor?: string;
  avatarUrl?: string;
  isSpawning?: boolean;
  isDespawning?: boolean;
  compact?: boolean;
  activityLevel?: "hot" | "warm" | "cool" | "idle";
  taskCount?: number;
}

// ─── Shared constants ─────────────────────────────────────────────────────────

/** Heat map colors based on agent activity level. */
export const heatColors = {
  hot: "#ef4444", // red   – very busy
  warm: "#f59e0b", // amber – busy
  moderate: "#fbbf24", // yellow – moderate
  cool: "#06b6d4", // cyan  – light activity
  idle: "#64748b", // slate – idle
} as const;

export const roleLabels: Record<string, string> = {
  coo: "COO",
  hr: "HR",
  manager: "Manager",
  senior: "Senior",
  worker: "Worker",
};

// ─── React context ─────────────────────────────────────────────────────────────

export const NetworkContext = createContext<NetworkContextValue>({
  delegations: [],
  speed: 1,
  agentActivity: new Map(),
  edgeMessages: new Map(),
  agentHealth: new Map(),
  isMobileOrTouch: false,
  dimIdle: false,
});
