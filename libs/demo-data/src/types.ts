// Re-export enums from shared-types (replaces local string union aliases)
export {
  AgentRole,
  AgentStatus,
  TaskStatus,
  TaskPriority,
  CreditType,
  EventSeverity,
  ReputationLevel,
  DemoMessageCategory,
  IdleReason,
  MemoryType,
  MemoryVisibility,
  MemorySource,
  SimulationEventType,
  WebhookHookType,
} from "@openspawn/shared-types";

import type {
  AgentRole,
  AgentStatus,
  TaskStatus,
  TaskPriority,
  CreditType,
  EventSeverity,
  ReputationLevel,
  DemoMessageCategory,
  MemoryType,
  MemoryVisibility,
  MemorySource,
  SimulationEventType,
  WebhookHookType,
} from "@openspawn/shared-types";

export interface DemoAgent {
  id: string;
  agentId: string;
  name: string;
  role: AgentRole;
  level: number;
  status: AgentStatus;
  model: string;
  currentBalance: number;
  lifetimeEarnings: number;
  createdAt: string;
  parentId?: string; // Who spawned this agent
  domain?: string; // e.g., "Engineering", "Finance"
  teamId?: string; // Team assignment for org chart
  maxChildren?: number; // Capacity for sub-agents
  budgetPeriodLimit?: number; // Per-period spending limit
  budgetPeriodSpent?: number; // Spent this period
  // Trust & Reputation fields
  trustScore?: number; // 0-100, default 50
  reputationLevel?: ReputationLevel;
  tasksCompleted?: number;
  tasksSuccessful?: number;
  lastActivityAt?: string;
  lastPromotionAt?: string;
}

export interface DemoReputationEvent {
  id: string;
  agentId: string;
  eventType: string;
  delta: number;
  previousScore: number;
  newScore: number;
  reason: string;
  taskId?: string;
  createdAt: string;
}

export interface TaskRejectionMetadata {
  rejectionFeedback?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionCount?: number;
}

export interface DemoTask {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  metadata?: TaskRejectionMetadata;
}

export interface DemoCreditTransaction {
  id: string;
  agentId: string;
  type: CreditType;
  amount: number;
  description: string;
  createdAt: string;
  taskId?: string;
}

export interface DemoEvent {
  id: string;
  type: string;
  severity: EventSeverity;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  agentId?: string;
  taskId?: string;
}

export interface DemoMessage {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  content: string;
  type: DemoMessageCategory;
  taskRef?: string;
  read: boolean;
  createdAt: string;
}

export interface DemoGitHubConnection {
  id: string;
  name: string;
  installationId: string;
  repoFilter: string[];
  enabled: boolean;
  syncConfig: {
    inbound: {
      createTaskOnIssue: boolean;
      createTaskOnPR: boolean;
      createTaskOnCheckFailure: boolean;
      requiredLabel?: string;
    };
    outbound: {
      closeIssueOnComplete: boolean;
      commentOnStatusChange: boolean;
      updateLabels: boolean;
    };
  };
  lastSyncAt?: string;
  lastError?: string;
  createdAt: string;
}

export interface DemoIntegrationLink {
  id: string;
  provider: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface DemoScenario {
  name: string;
  description: string;
  agents: DemoAgent[];
  tasks: DemoTask[];
  credits: DemoCreditTransaction[];
  events: DemoEvent[];
  messages: DemoMessage[];
  webhooks: DemoWebhook[];
  githubConnections?: DemoGitHubConnection[];
  integrationLinks?: DemoIntegrationLink[];
}

export interface SimulationState {
  currentTick: number;
  speed: number; // 1x, 2x, 5x, etc.
  isPlaying: boolean;
  scenario: DemoScenario;
  startTime: Date;
  simulatedTime: Date;
}

export interface SimulationEvent {
  type: SimulationEventType;
  payload: unknown;
  timestamp: Date;
}

export interface DemoWebhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
  hookType: WebhookHookType;
  canBlock: boolean;
  timeoutMs: number;
  failureCount: number;
  lastTriggeredAt?: string;
  lastError?: string;
  createdAt: string;
}

export interface DemoMemory {
  id: string;
  agentId: string;
  type: MemoryType;
  visibility: MemoryVisibility;
  source: MemorySource;
  content: string;
  tags: string[];
  confidence: number;
  accessCount: number;
  lastAccessedAt: string;
  createdAt: string;
  updatedAt: string;
}
