/**
 * @openspawn/sdk - TypeScript SDK for OpenSpawn API
 * 
 * A clean, typed client library for interacting with the OpenSpawn REST API.
 * Supports both API key and HMAC-based authentication with built-in retry logic.
 */

// Main client
export { OpenSpawnClient } from './lib/client';

// Types
export type {
  OpenSpawnClientConfig,
  HmacCredentials,
  RetryConfig,
  RequestOptions,
  ApiResponse,
  ApiErrorResponse,
} from './lib/types';

// Errors
export {
  OpenSpawnError,
  ApiError,
  AuthenticationError,
  ValidationError,
  RateLimitError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from './lib/errors';

// Resource types
export type {
  Agent,
  AgentCapability,
  CreateAgentDto,
  UpdateAgentDto,
  SpawnAgentDto,
  ReputationSummary,
  BudgetStatus,
} from './lib/resources/agents';

export type {
  Task,
  CreateTaskDto,
  UpdateTaskDto,
  TransitionTaskDto,
  TaskComment,
  TaskFilters,
} from './lib/resources/tasks';

export type {
  CreditBalance,
  CreditTransaction,
  SpendCreditsDto,
  TransferCreditsDto,
  CreditHistoryResponse,
} from './lib/resources/credits';

export type {
  Message,
  Channel,
  SendMessageDto,
} from './lib/resources/messages';

export type {
  Event,
  EventFilters,
} from './lib/resources/events';

// Re-export shared types from the shared-types library
export type {
  AgentRole,
  AgentStatus,
  AgentMode,
  TaskStatus,
  TaskPriority,
  CreditType,
  MessageType,
  ChannelType,
  Proficiency,
  EscalationReason,
  ReputationLevel,
  ConsensusStatus,
} from './lib/shared-types';
