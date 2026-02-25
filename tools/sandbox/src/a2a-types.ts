// ── A2A Protocol Types (v0.3) ────────────────────────────────────────────────
// Agent-to-Agent protocol data model for BikiniBottom sandbox server
// Spec: https://a2a-protocol.org/latest/specification/

export interface AgentCard {
  name: string;
  description: string;
  url: string;
  version: string;
  capabilities: AgentCapabilities;
  skills: AgentSkill[];
  defaultInputModes: string[];
  defaultOutputModes: string[];
  protocolVersion: string;
}

export interface AgentCapabilities {
  streaming: boolean;
  pushNotifications: boolean;
  extendedAgentCard: boolean;
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  tags?: string[];
  examples?: string[];
}

// ── Task lifecycle ───────────────────────────────────────────────────────────

export type TaskState = 'submitted' | 'working' | 'input-required' | 'completed' | 'failed' | 'canceled' | 'rejected';

export interface TaskStatus {
  state: TaskState;
  message?: Message;
  timestamp: string;
}

export interface Task {
  id: string;
  contextId: string;
  status: TaskStatus;
  artifacts?: Artifact[];
  history?: Message[];
  metadata?: Record<string, unknown>;
}

// ── Messages & Parts ─────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'agent';

export interface Message {
  role: MessageRole;
  parts: Part[];
  messageId?: string;
  contextId?: string;
  taskId?: string;
  referenceTaskIds?: string[];
  metadata?: Record<string, unknown>;
}

export type Part = TextPart | FilePart | DataPart;

export interface TextPart {
  kind: 'text';
  text: string;
}

export interface FilePart {
  kind: 'file';
  file: FileContent;
}

export interface FileContent {
  name?: string;
  mimeType?: string;
  bytes?: string;
  uri?: string;
}

export interface DataPart {
  kind: 'data';
  data: Record<string, unknown>;
}

// ── Artifacts ────────────────────────────────────────────────────────────────

export interface Artifact {
  artifactId: string;
  name?: string;
  description?: string;
  parts: Part[];
  metadata?: Record<string, unknown>;
}

// ── Streaming Events ─────────────────────────────────────────────────────────

export interface TaskStatusUpdateEvent {
  kind: 'status-update';
  taskId: string;
  contextId: string;
  status: TaskStatus;
  final: boolean;
}

export interface TaskArtifactUpdateEvent {
  kind: 'artifact-update';
  taskId: string;
  contextId: string;
  artifact: Artifact;
}

export type StreamEvent = TaskStatusUpdateEvent | TaskArtifactUpdateEvent;

// ── Request types ────────────────────────────────────────────────────────────

export interface SendMessageRequest {
  message: Message;
  configuration?: SendMessageConfiguration;
  metadata?: Record<string, unknown>;
}

export interface SendMessageConfiguration {
  acceptedOutputModes?: string[];
  historyLength?: number;
  blocking?: boolean;
}

// ── Error types ──────────────────────────────────────────────────────────────

export interface A2AError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
