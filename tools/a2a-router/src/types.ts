// ── A2A Types ────────────────────────────────────────────────────────────────

export type TaskStatus = "submitted" | "working" | "completed" | "failed" | "canceled";

export interface AgentCard {
  agent_id: string;
  name: string;
  skills: string[];
  gateway_url: string;
  gateway_token?: string;
  hook_path: string;
  registered_at?: string;
}

export interface AgentRow {
  agent_id: string;
  name: string;
  skills: string; // JSON string
  gateway_url: string;
  gateway_token: string | null;
  hook_path: string;
  registered_at: string;
}

export interface Task {
  id: string;
  sender_id: string;
  target_id: string;
  message: string;
  status: TaskStatus;
  result: string | null;
  created_at: string;
  updated_at: string;
}

export interface SendMessageRequest {
  agentId: string;      // target agent
  senderId: string;     // sender agent
  message: string;      // task content
}

export interface CompleteTaskRequest {
  agentId: string;      // agent completing the task
  status: "completed" | "failed";
  result: string;
}

export interface PushConfig {
  id: string;
  task_id: string;
  agent_id: string;
  webhook_url: string;
  auth_token: string | null;
  created_at: string;
}

export interface NotificationLogEntry {
  id?: number;
  task_id: string;
  target_agent_id: string;
  status: "delivered" | "failed" | "retrying";
  attempt: number;
  response_status?: number | null;
  error?: string | null;
  created_at?: string;
}

export interface RegisterAgentRequest {
  agentId: string;
  name: string;
  skills?: string[];
  gateway_url: string;
  gateway_token?: string;
  hook_path?: string;
}
