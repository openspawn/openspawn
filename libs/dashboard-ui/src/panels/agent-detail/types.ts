import type { ReactNode } from "react";
import type { AgentFields, TaskFields, CreditTransactionFields } from "@openspawn/shared-types";

export type AgentDetailAgent = Pick<
  AgentFields,
  | "id"
  | "agentId"
  | "name"
  | "role"
  | "mode"
  | "status"
  | "level"
  | "model"
  | "currentBalance"
  | "trustScore"
  | "tasksCompleted"
  | "tasksSuccessful"
  | "lifetimeEarnings"
  | "defaultAutonomyLevel"
  | "domain"
  | "teamId"
  | "parentId"
  | "avatar"
  | "avatarColor"
  | "avatarUrl"
  | "createdAt"
  | "lastActivityAt"
>;

export type AgentDetailTask = Pick<
  TaskFields,
  "id" | "identifier" | "title" | "description" | "status" | "priority" | "completedAt"
>;

export type AgentDetailTransaction = CreditTransactionFields;

export interface AgentDetailMessage {
  id: string;
  type: string;
  body: string;
  fromName?: string;
  toName?: string;
  acpType?: string | null;
  pct?: number | null;
  createdAt: string;
}

export interface AgentDetailTimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  agentId: string;
  taskId?: string;
}

export enum AgentDetailTab {
  Overview = "overview",
  Prompt = "prompt",
  Tasks = "tasks",
  Credits = "credits",
  Messages = "messages",
  Timeline = "timeline",
  Settings = "settings",
}

export interface AgentDetailPanelProps {
  agent: AgentDetailAgent;
  onClose: () => void;
  parentAgentName?: string;
  teamName?: string;
  tasks?: AgentDetailTask[];
  tasksLoading?: boolean;
  transactions?: AgentDetailTransaction[];
  transactionsLoading?: boolean;
  messages?: AgentDetailMessage[];
  systemPrompt?: string | null;
  timelineEvents?: AgentDetailTimelineEvent[];
  onSaveSettings?: (payload: { default_autonomy_level: number }) => void;
  onTaskClick?: (taskId: string) => void;
  visibleTabs?: AgentDetailTab[];
  renderAvatar?: (agent: AgentDetailAgent) => ReactNode;
}
