// Types matching our GraphQL schema

export type AgentRole = 'hr' | 'manager' | 'senior' | 'worker';
export type AgentStatus = 'pending' | 'active' | 'paused' | 'suspended' | 'revoked';
export type TaskStatus = 'backlog' | 'pending' | 'assigned' | 'in_progress' | 'review' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'normal' | 'high' | 'critical';
export type CreditType = 'CREDIT' | 'DEBIT';
export type EventSeverity = 'debug' | 'info' | 'success' | 'warning' | 'error' | 'critical';

export type ReputationLevel = 'NEW' | 'PROBATION' | 'TRUSTED' | 'VETERAN' | 'ELITE';

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
  parentId?: string;          // Who spawned this agent
  domain?: string;            // e.g., "Engineering", "Finance"
  maxChildren?: number;       // Capacity for sub-agents
  budgetPeriodLimit?: number; // Per-period spending limit
  budgetPeriodSpent?: number; // Spent this period
  // Trust & Reputation fields
  trustScore?: number;        // 0-100, default 50
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

export type MessageType = 'task' | 'status' | 'report' | 'question' | 'escalation' | 'general';

export interface DemoMessage {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  content: string;
  type: MessageType;
  taskRef?: string;
  read: boolean;
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
  type: 'agent_created' | 'agent_activated' | 'agent_promoted' | 'agent_terminated' |
        'agent_status_changed' | 'agent_despawned' |
        'task_created' | 'task_assigned' | 'task_completed' |
        'credit_earned' | 'credit_spent' |
        'system_event';
  payload: unknown;
  timestamp: Date;
}
