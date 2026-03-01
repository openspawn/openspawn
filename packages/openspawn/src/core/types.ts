// ── Core Types for OpenSpawn ─────────────────────────────────────────────────

export interface Agent {
  id: string;
  name: string;
  role: string;
  level: number;
  domain: string;
  parentId?: string;
  model?: string;
  status: 'active' | 'inactive';
}

export interface ParsedOrg {
  name: string;
  agents: Agent[];
  culture: {
    preset?: string;
    escalationVelocity?: string;
    progressFrequency?: string;
    ackRequired?: boolean;
    maxEscalationDepth?: number;
  };
  policies: {
    perAgentBudget?: number;
    alertThreshold?: number;
    departmentCaps?: Record<string, number>;
  };
}

export type TaskStatus = 'open' | 'claimed' | 'in-progress' | 'done' | 'blocked';

export interface Task {
  id: string;
  description: string;
  assignee?: string;
  delegatedBy?: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  pr?: number;
  budget?: { spent: number; currency: string };
}

export interface BudgetEntry {
  limit: number;
  spent: number;
  currency: string;
}

export interface TaskStore {
  version: number;
  tasks: Task[];
  budgets: Record<string, BudgetEntry>;
}
