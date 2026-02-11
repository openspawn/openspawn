// ── Sandbox Agent Types ──────────────────────────────────────────────────────

export type EscalationReason = 'BLOCKED' | 'OUT_OF_DOMAIN' | 'OVER_BUDGET' | 'LOW_CONFIDENCE' | 'TIMEOUT' | 'DEPENDENCY';

export interface ACPMessage {
  id: string;
  type: 'ack' | 'progress' | 'escalation' | 'completion' | 'delegation' | 'status_request';
  from: string;
  to: string;
  taskId: string;
  body?: string;
  reason?: EscalationReason;
  summary?: string;
  pct?: number;
  timestamp: number;
}

export interface SandboxAgent {
  id: string;
  name: string;
  role: 'coo' | 'talent' | 'lead' | 'senior' | 'worker' | 'intern';
  level: number;
  domain: string;
  avatar?: string;
  avatarColor?: string;
  parentId?: string;
  status: 'active' | 'idle' | 'busy';
  systemPrompt: string;
  /** Current tasks assigned to this agent */
  taskIds: string[];
  /** Message history (kept short for context window) */
  recentMessages: ACPMessage[];
  /** Execution mode — polling agents wake every N ticks, event-driven agents wake on inbox messages */
  trigger: 'polling' | 'event-driven';
  /** Which ACP message types wake this agent (only for event-driven) */
  triggerOn?: ACPMessage['type'][];
  /** Inbox queue — pending ACP messages that haven't been processed */
  inbox: ACPMessage[];
  /** Tick number when this agent last took an LLM action */
  lastActedTick?: number;
  /** Stats */
  stats: {
    tasksCompleted: number;
    tasksFailed: number;
    messagessSent: number;
    creditsEarned: number;
    creditsSpent: number;
  };
}

export interface SandboxTask {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  status: 'backlog' | 'pending' | 'assigned' | 'in_progress' | 'review' | 'done' | 'rejected' | 'blocked';
  assigneeId?: string;
  creatorId: string;
  createdAt: number;
  updatedAt: number;
  activityLog: ACPMessage[];
  acked: boolean;
  blockedReason?: string;
}

export interface SandboxEvent {
  type: string;
  agentId?: string;
  taskId?: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

// ── Tool definitions for Ollama ──────────────────────────────────────────────

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

// Actions an agent can take
export type AgentAction =
  | { action: 'delegate'; taskId: string; targetAgentId: string; reason: string }
  | { action: 'work'; taskId: string; result: string }
  | { action: 'message'; to: string; content: string }
  | { action: 'escalate'; taskId: string; reason: EscalationReason; body: string }
  | { action: 'create_task'; title: string; description: string; priority: string }
  | { action: 'review'; taskId: string; verdict: 'approve' | 'reject'; feedback: string }
  | { action: 'spawn_agent'; name: string; domain: string; role: string; reason: string }
  | { action: 'idle' };

// ── Simulation config ────────────────────────────────────────────────────────

export interface SandboxConfig {
  model: string;
  tickIntervalMs: number;
  maxTicks: number;
  maxConcurrentInferences: number;
  contextWindowTokens: number;
  verbose: boolean;
  /** Default trigger mode for agents */
  defaultTrigger: 'polling' | 'event-driven';
}
