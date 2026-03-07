import type { AgentMode, AgentRole, AgentStatus, ReputationLevel } from "../enums";

export interface AgentFields {
  id: string;
  agentId: string;
  name: string;
  role: AgentRole;
  mode: AgentMode;
  status: AgentStatus;
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
  reputationLevel: ReputationLevel;
  tasksCompleted: number;
  tasksSuccessful: number;
  lastActivityAt?: string | null;
  lastPromotionAt?: string | null;
  lifetimeEarnings: number;
  domain?: string | null;
  teamId?: string | null;
  avatar?: string | null;
  avatarColor?: string | null;
}
