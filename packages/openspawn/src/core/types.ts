// ── Core Types for OpenSpawn ─────────────────────────────────────────────────

export interface Agent {
  id: string;
  name: string;
  role: string;
  level: number;
  domain: string;
  parentId?: string;
  model?: string;
  status: "active" | "inactive";
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

export type TaskStatus = "open" | "claimed" | "in-progress" | "done" | "blocked";

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

// ── Config Enums & Types ────────────────────────────────────────────────────

export enum LlmProvider {
  Anthropic = "anthropic",
  OpenAI = "openai",
  Ollama = "ollama",
  Groq = "groq",
  OpenRouter = "openrouter",
}

export enum OverageBehavior {
  PauseAndEscalate = "pause-and-escalate",
  WarnAndContinue = "warn-and-continue",
  HardStop = "hard-stop",
}

export enum EscalationBehavior {
  Immediate = "immediate",
  Delayed = "delayed",
  Batched = "batched",
}

export enum CulturePreset {
  Agency = "agency",
  Startup = "startup",
  Professional = "professional",
  Ops = "ops",
  Enterprise = "enterprise",
  Research = "research",
  Compliance = "compliance",
}

export enum OrgValue {
  Ownership = "ownership",
  Transparency = "transparency",
  Measurement = "measurement",
  Subsidiarity = "subsidiarity",
  ContinuousImprovement = "continuous-improvement",
  Speed = "speed",
  Rigor = "rigor",
  Frugality = "frugality",
}

export interface OpenSpawnConfig {
  orgFile: string;
  coordinator: { port: number };
  llm: {
    provider: LlmProvider;
    models: { default: string; senior: string };
    seniorThreshold: number;
  };
  budget: {
    perAgentLimit: number;
    period: string;
    alertThreshold: number;
    overageBehavior: OverageBehavior;
  };
  escalation: { behavior: EscalationBehavior };
  alignment: {
    mission: string;
    vision: string;
    values: OrgValue[];
  };
  culture: { preset: CulturePreset };
}
