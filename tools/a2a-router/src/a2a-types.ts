// ── A2A v1.0 Canonical Types ─────────────────────────────────────────────────
// Reference: https://a2a-protocol.org/latest/specification/

// ── Agent Discovery ──────────────────────────────────────────────────────────

export interface AgentCard {
  name: string;
  description: string;
  protocolVersion: "1.0.0";
  version: string;
  url: string;
  skills: AgentSkill[];
  capabilities: AgentCapabilities;
  defaultInputModes: string[];
  defaultOutputModes: string[];
  authentication?: AuthenticationInfo;
  additionalInterfaces?: AdditionalInterface[];
}

export interface AgentSkill {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
}

export interface AgentCapabilities {
  pushNotifications: boolean;
  streaming: boolean;
}

export interface AuthenticationInfo {
  schemes: string[];
}

export interface AdditionalInterface {
  url: string;
  transport: "JSONRPC" | "HTTP+JSON" | "GRPC";
}

// ── Task Lifecycle ───────────────────────────────────────────────────────────

export type TaskState =
  | "submitted"
  | "working"
  | "input-required"
  | "completed"
  | "failed"
  | "canceled";

export interface Task {
  id: string;
  contextId?: string;
  status: TaskStatus;
  messages: Message[];
  artifacts?: Artifact[];
  metadata?: Record<string, unknown>;
}

export interface TaskStatus {
  state: TaskState;
  message?: string;
  timestamp: string;
}

// ── Messages & Parts ─────────────────────────────────────────────────────────

export interface Message {
  kind: "message";
  messageId: string;
  role: "user" | "agent";
  parts: Part[];
  contextId?: string;
}

export type Part = TextPart | FilePart | DataPart;

export interface TextPart {
  kind: "text";
  text: string;
}

export interface FilePart {
  kind: "file";
  name?: string;
  mimeType?: string;
  uri?: string;
  bytes?: string; // base64
}

export interface DataPart {
  kind: "data";
  data: Record<string, unknown>;
}

export interface Artifact {
  parts: Part[];
  name?: string;
  description?: string;
}

// ── JSON-RPC 2.0 ────────────────────────────────────────────────────────────

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: unknown;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

// Standard JSON-RPC error codes
export const JSON_RPC_ERRORS = {
  PARSE_ERROR: { code: -32700, message: "Parse error" },
  INVALID_REQUEST: { code: -32600, message: "Invalid Request" },
  METHOD_NOT_FOUND: { code: -32601, message: "Method not found" },
  INVALID_PARAMS: { code: -32602, message: "Invalid params" },
  INTERNAL_ERROR: { code: -32603, message: "Internal error" },
  TASK_NOT_FOUND: { code: -32001, message: "Task not found" },
  AGENT_NOT_FOUND: { code: -32002, message: "Agent not found" },
} as const;

// ── Method Params & Results ──────────────────────────────────────────────────

export interface MessageSendParams {
  agentId: string;
  senderId: string;
  message: Message;
  contextId?: string;
}

export interface TasksGetParams {
  taskId: string;
}

export interface TasksListParams {
  agentId?: string;
  status?: TaskState;
  contextId?: string;
  limit?: number;
  offset?: number;
}

export interface TasksCancelParams {
  taskId: string;
}

export interface TasksListResult {
  tasks: Task[];
  total: number;
  limit: number;
  offset: number;
}
