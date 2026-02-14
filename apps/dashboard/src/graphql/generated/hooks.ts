import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { fetcher } from '../fetcher';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: string; output: string; }
};

/** Operational mode that restricts what actions an agent can perform */
export enum AgentMode {
  Observer = 'OBSERVER',
  Orchestrator = 'ORCHESTRATOR',
  Worker = 'WORKER'
}

export type AgentReputationType = {
  lastActivityAt?: Maybe<Scalars['DateTime']['output']>;
  promotionProgress?: Maybe<PromotionProgressType>;
  reputationLevel: ReputationLevel;
  successRate: Scalars['Float']['output'];
  tasksCompleted: Scalars['Int']['output'];
  tasksSuccessful: Scalars['Int']['output'];
  trustScore: Scalars['Int']['output'];
};

export enum AgentRole {
  Admin = 'ADMIN',
  Founder = 'FOUNDER',
  Hr = 'HR',
  Worker = 'WORKER'
}

export enum AgentStatus {
  Active = 'ACTIVE',
  Pending = 'PENDING',
  Revoked = 'REVOKED',
  Suspended = 'SUSPENDED'
}

export type AgentType = {
  agentId: Scalars['String']['output'];
  avatar?: Maybe<Scalars['String']['output']>;
  avatarColor?: Maybe<Scalars['String']['output']>;
  avatarUrl?: Maybe<Scalars['String']['output']>;
  budgetPeriodLimit?: Maybe<Scalars['Int']['output']>;
  budgetPeriodSpent: Scalars['Int']['output'];
  createdAt: Scalars['DateTime']['output'];
  currentBalance: Scalars['Int']['output'];
  domain?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  lastActivityAt?: Maybe<Scalars['DateTime']['output']>;
  lastPromotionAt?: Maybe<Scalars['DateTime']['output']>;
  level: Scalars['Int']['output'];
  lifetimeEarnings: Scalars['Int']['output'];
  managementFeePct: Scalars['Int']['output'];
  mode: AgentMode;
  model: Scalars['String']['output'];
  name: Scalars['String']['output'];
  parentId?: Maybe<Scalars['ID']['output']>;
  reputationLevel: ReputationLevel;
  role: AgentRole;
  status: AgentStatus;
  tasksCompleted: Scalars['Int']['output'];
  tasksSuccessful: Scalars['Int']['output'];
  teamId?: Maybe<Scalars['String']['output']>;
  trustScore: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type ChannelGqlType = {
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  taskId?: Maybe<Scalars['ID']['output']>;
  type: ChannelType;
  updatedAt: Scalars['DateTime']['output'];
};

export enum ChannelType {
  Agent = 'AGENT',
  Broadcast = 'BROADCAST',
  General = 'GENERAL',
  Task = 'TASK'
}

/** Result of a claimNextTask mutation */
export type ClaimTaskResultType = {
  /** Message describing the result */
  message: Scalars['String']['output'];
  /** Whether the claim was successful */
  success: Scalars['Boolean']['output'];
  /** The claimed task, if successful */
  task?: Maybe<TaskType>;
};

export type ConversationType = {
  channelId: Scalars['ID']['output'];
  lastMessage: Scalars['String']['output'];
  lastMessageAt: Scalars['DateTime']['output'];
  otherAgentId: Scalars['ID']['output'];
  otherAgentLevel: Scalars['Int']['output'];
  otherAgentName: Scalars['String']['output'];
  unreadCount: Scalars['Int']['output'];
};

export type CreateInboundWebhookKeyInput = {
  defaultAgentId?: InputMaybe<Scalars['ID']['input']>;
  defaultPriority?: InputMaybe<TaskPriority>;
  defaultTags?: InputMaybe<Array<Scalars['String']['input']>>;
  name: Scalars['String']['input'];
};

export type CreateWebhookInput = {
  canBlock?: InputMaybe<Scalars['Boolean']['input']>;
  events: Array<Scalars['String']['input']>;
  hookType?: InputMaybe<WebhookHookType>;
  name: Scalars['String']['input'];
  secret?: InputMaybe<Scalars['String']['input']>;
  timeoutMs?: InputMaybe<Scalars['Int']['input']>;
  url: Scalars['String']['input'];
};

export type CreditTransactionType = {
  agentId: Scalars['ID']['output'];
  amount: Scalars['Int']['output'];
  balanceAfter: Scalars['Int']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  reason: Scalars['String']['output'];
  sourceTaskId?: Maybe<Scalars['ID']['output']>;
  triggerType?: Maybe<Scalars['String']['output']>;
  type: CreditType;
};

export enum CreditType {
  Credit = 'CREDIT',
  Debit = 'DEBIT'
}

export type DirectMessageAgentType = {
  id: Scalars['ID']['output'];
  level: Scalars['Int']['output'];
  name: Scalars['String']['output'];
};

export type DirectMessageType = {
  body: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  fromAgent?: Maybe<DirectMessageAgentType>;
  fromAgentId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  read: Scalars['Boolean']['output'];
  toAgent?: Maybe<DirectMessageAgentType>;
  toAgentId: Scalars['ID']['output'];
  type: Scalars['String']['output'];
};

export enum EventSeverity {
  Error = 'ERROR',
  Info = 'INFO',
  Warning = 'WARNING'
}

export type EventType = {
  actor?: Maybe<AgentType>;
  actorId: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  entityId: Scalars['ID']['output'];
  entityType: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  reasoning?: Maybe<Scalars['String']['output']>;
  severity: EventSeverity;
  type: Scalars['String']['output'];
};

export type InboundWebhookKeyType = {
  createdAt: Scalars['DateTime']['output'];
  defaultAgentId?: Maybe<Scalars['ID']['output']>;
  defaultPriority?: Maybe<TaskPriority>;
  defaultTags: Array<Scalars['String']['output']>;
  enabled: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  key: Scalars['String']['output'];
  lastUsedAt?: Maybe<Scalars['DateTime']['output']>;
  name: Scalars['String']['output'];
  secret: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type LeaderboardEntryType = {
  agentId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  level: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  reputationLevel: ReputationLevel;
  tasksCompleted: Scalars['Int']['output'];
  trustScore: Scalars['Int']['output'];
};

export type MessageGqlType = {
  body: Scalars['String']['output'];
  channelId: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  parentMessageId?: Maybe<Scalars['ID']['output']>;
  senderId: Scalars['ID']['output'];
  type: MessageType;
};

export enum MessageType {
  Handoff = 'HANDOFF',
  Request = 'REQUEST',
  StatusUpdate = 'STATUS_UPDATE',
  Text = 'TEXT'
}

export type Mutation = {
  /** Claim the next available task */
  claimNextTask: ClaimTaskResultType;
  createInboundWebhookKey: InboundWebhookKeyType;
  createWebhook: WebhookType;
  deleteInboundWebhookKey: Scalars['Boolean']['output'];
  deleteWebhook: Scalars['Boolean']['output'];
  markMessagesAsRead: Scalars['Int']['output'];
  rotateInboundWebhookKey: InboundWebhookKeyType;
  sendDirectMessage: DirectMessageType;
  testWebhook: Scalars['Boolean']['output'];
  updateInboundWebhookKey: InboundWebhookKeyType;
  updateWebhook: WebhookType;
};


export type MutationClaimNextTaskArgs = {
  agentId: Scalars['ID']['input'];
  orgId: Scalars['ID']['input'];
};


export type MutationCreateInboundWebhookKeyArgs = {
  input: CreateInboundWebhookKeyInput;
  orgId: Scalars['ID']['input'];
};


export type MutationCreateWebhookArgs = {
  input: CreateWebhookInput;
  orgId: Scalars['ID']['input'];
};


export type MutationDeleteInboundWebhookKeyArgs = {
  id: Scalars['ID']['input'];
  orgId: Scalars['ID']['input'];
};


export type MutationDeleteWebhookArgs = {
  id: Scalars['ID']['input'];
  orgId: Scalars['ID']['input'];
};


export type MutationMarkMessagesAsReadArgs = {
  agentId: Scalars['ID']['input'];
  orgId: Scalars['ID']['input'];
  otherAgentId: Scalars['ID']['input'];
};


export type MutationRotateInboundWebhookKeyArgs = {
  id: Scalars['ID']['input'];
  orgId: Scalars['ID']['input'];
};


export type MutationSendDirectMessageArgs = {
  input: SendDirectMessageInput;
  orgId: Scalars['ID']['input'];
};


export type MutationTestWebhookArgs = {
  id: Scalars['ID']['input'];
  orgId: Scalars['ID']['input'];
};


export type MutationUpdateInboundWebhookKeyArgs = {
  id: Scalars['ID']['input'];
  input: UpdateInboundWebhookKeyInput;
  orgId: Scalars['ID']['input'];
};


export type MutationUpdateWebhookArgs = {
  id: Scalars['ID']['input'];
  input: UpdateWebhookInput;
  orgId: Scalars['ID']['input'];
};

export type PromotionProgressType = {
  currentLevel: Scalars['Int']['output'];
  nextLevel: Scalars['Int']['output'];
  tasksProgress: Scalars['Int']['output'];
  tasksRequired: Scalars['Int']['output'];
  trustScoreProgress: Scalars['Int']['output'];
  trustScoreRequired: Scalars['Int']['output'];
};

export type Query = {
  agent?: Maybe<AgentType>;
  agentReputation?: Maybe<AgentReputationType>;
  agents: Array<AgentType>;
  channels: Array<ChannelGqlType>;
  /** Get count of tasks available to claim */
  claimableTaskCount: Scalars['Int']['output'];
  conversations: Array<ConversationType>;
  creditHistory: Array<CreditTransactionType>;
  directMessages: Array<DirectMessageType>;
  events: Array<EventType>;
  inboundWebhookKey?: Maybe<InboundWebhookKeyType>;
  inboundWebhookKeys: Array<InboundWebhookKeyType>;
  messages: Array<MessageGqlType>;
  reputationHistory: Array<ReputationHistoryEntryType>;
  task?: Maybe<TaskType>;
  tasks: Array<TaskType>;
  trustLeaderboard: Array<LeaderboardEntryType>;
  unreadMessageCount: Scalars['Int']['output'];
  webhook?: Maybe<WebhookType>;
  webhooks: Array<WebhookType>;
};


export type QueryAgentArgs = {
  id: Scalars['ID']['input'];
  orgId: Scalars['ID']['input'];
};


export type QueryAgentReputationArgs = {
  agentId: Scalars['ID']['input'];
  orgId: Scalars['ID']['input'];
};


export type QueryAgentsArgs = {
  orgId: Scalars['ID']['input'];
};


export type QueryChannelsArgs = {
  orgId: Scalars['ID']['input'];
};


export type QueryClaimableTaskCountArgs = {
  orgId: Scalars['ID']['input'];
};


export type QueryConversationsArgs = {
  agentId: Scalars['ID']['input'];
  orgId: Scalars['ID']['input'];
};


export type QueryCreditHistoryArgs = {
  agentId?: InputMaybe<Scalars['ID']['input']>;
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  orgId: Scalars['ID']['input'];
};


export type QueryDirectMessagesArgs = {
  agent1Id: Scalars['ID']['input'];
  agent2Id: Scalars['ID']['input'];
  before?: InputMaybe<Scalars['ID']['input']>;
  limit?: Scalars['Int']['input'];
  orgId: Scalars['ID']['input'];
};


export type QueryEventsArgs = {
  limit?: Scalars['Int']['input'];
  orgId: Scalars['ID']['input'];
  page?: Scalars['Int']['input'];
};


export type QueryInboundWebhookKeyArgs = {
  id: Scalars['ID']['input'];
  orgId: Scalars['ID']['input'];
};


export type QueryInboundWebhookKeysArgs = {
  orgId: Scalars['ID']['input'];
};


export type QueryMessagesArgs = {
  before?: InputMaybe<Scalars['ID']['input']>;
  channelId: Scalars['ID']['input'];
  limit?: Scalars['Int']['input'];
  orgId: Scalars['ID']['input'];
};


export type QueryReputationHistoryArgs = {
  agentId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  orgId: Scalars['ID']['input'];
};


export type QueryTaskArgs = {
  id: Scalars['ID']['input'];
  orgId: Scalars['ID']['input'];
};


export type QueryTasksArgs = {
  assigneeId?: InputMaybe<Scalars['ID']['input']>;
  orgId: Scalars['ID']['input'];
  status?: InputMaybe<TaskStatus>;
};


export type QueryTrustLeaderboardArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  orgId: Scalars['ID']['input'];
};


export type QueryUnreadMessageCountArgs = {
  agentId: Scalars['ID']['input'];
  orgId: Scalars['ID']['input'];
};


export type QueryWebhookArgs = {
  id: Scalars['ID']['input'];
  orgId: Scalars['ID']['input'];
};


export type QueryWebhooksArgs = {
  orgId: Scalars['ID']['input'];
};

export type ReputationHistoryEntryType = {
  createdAt: Scalars['DateTime']['output'];
  delta: Scalars['Int']['output'];
  eventType: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  newScore: Scalars['Int']['output'];
  previousScore: Scalars['Int']['output'];
  reason: Scalars['String']['output'];
};

export enum ReputationLevel {
  Elite = 'ELITE',
  New = 'NEW',
  Probation = 'PROBATION',
  Trusted = 'TRUSTED',
  Veteran = 'VETERAN'
}

export type SendDirectMessageInput = {
  body: Scalars['String']['input'];
  fromAgentId: Scalars['ID']['input'];
  toAgentId: Scalars['ID']['input'];
  type?: InputMaybe<Scalars['String']['input']>;
};

export type Subscription = {
  creditTransactionCreated: CreditTransactionType;
  directMessageCreated: DirectMessageType;
  eventCreated: EventType;
  messageCreated: MessageGqlType;
  taskUpdated: TaskType;
};


export type SubscriptionCreditTransactionCreatedArgs = {
  orgId: Scalars['ID']['input'];
};


export type SubscriptionDirectMessageCreatedArgs = {
  agentId: Scalars['ID']['input'];
  orgId: Scalars['ID']['input'];
};


export type SubscriptionEventCreatedArgs = {
  orgId: Scalars['ID']['input'];
};


export type SubscriptionMessageCreatedArgs = {
  channelId?: InputMaybe<Scalars['ID']['input']>;
  orgId: Scalars['ID']['input'];
};


export type SubscriptionTaskUpdatedArgs = {
  orgId: Scalars['ID']['input'];
};

/** Task priority level */
export enum TaskPriority {
  High = 'HIGH',
  Low = 'LOW',
  Normal = 'NORMAL',
  Urgent = 'URGENT'
}

/** Rejection metadata when a task completion is rejected by a pre-hook */
export type TaskRejectionType = {
  /** Feedback explaining why completion was rejected */
  feedback: Scalars['String']['output'];
  /** When the rejection occurred */
  rejectedAt: Scalars['DateTime']['output'];
  /** Who/what rejected the completion (webhook names) */
  rejectedBy: Scalars['String']['output'];
  /** How many times this task has been rejected */
  rejectionCount: Scalars['Int']['output'];
};

export enum TaskStatus {
  Backlog = 'BACKLOG',
  Blocked = 'BLOCKED',
  Cancelled = 'CANCELLED',
  Done = 'DONE',
  InProgress = 'IN_PROGRESS',
  Review = 'REVIEW',
  Todo = 'TODO'
}

export type TaskType = {
  approvalRequired: Scalars['Boolean']['output'];
  approvedAt?: Maybe<Scalars['DateTime']['output']>;
  assignee?: Maybe<AgentType>;
  assigneeId?: Maybe<Scalars['ID']['output']>;
  completedAt?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  creatorId: Scalars['ID']['output'];
  description?: Maybe<Scalars['String']['output']>;
  dueDate?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  identifier: Scalars['String']['output'];
  parentTaskId?: Maybe<Scalars['ID']['output']>;
  priority: TaskPriority;
  /** Present when task completion was rejected */
  rejection?: Maybe<TaskRejectionType>;
  status: TaskStatus;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type UpdateInboundWebhookKeyInput = {
  defaultAgentId?: InputMaybe<Scalars['ID']['input']>;
  defaultPriority?: InputMaybe<TaskPriority>;
  defaultTags?: InputMaybe<Array<Scalars['String']['input']>>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateWebhookInput = {
  canBlock?: InputMaybe<Scalars['Boolean']['input']>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  events?: InputMaybe<Array<Scalars['String']['input']>>;
  hookType?: InputMaybe<WebhookHookType>;
  name?: InputMaybe<Scalars['String']['input']>;
  secret?: InputMaybe<Scalars['String']['input']>;
  timeoutMs?: InputMaybe<Scalars['Int']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
};

export enum WebhookHookType {
  Post = 'POST',
  Pre = 'PRE'
}

export type WebhookType = {
  canBlock: Scalars['Boolean']['output'];
  createdAt: Scalars['DateTime']['output'];
  enabled: Scalars['Boolean']['output'];
  events: Array<Scalars['String']['output']>;
  failureCount: Scalars['Float']['output'];
  hookType: WebhookHookType;
  id: Scalars['ID']['output'];
  lastError?: Maybe<Scalars['String']['output']>;
  lastTriggeredAt?: Maybe<Scalars['DateTime']['output']>;
  name: Scalars['String']['output'];
  orgId: Scalars['ID']['output'];
  secret?: Maybe<Scalars['String']['output']>;
  timeoutMs: Scalars['Float']['output'];
  updatedAt: Scalars['DateTime']['output'];
  url: Scalars['String']['output'];
};

export type AgentFieldsFragment = { id: string, agentId: string, name: string, role: AgentRole, mode: AgentMode, status: AgentStatus, level: number, model: string, currentBalance: number, budgetPeriodLimit?: number | null, budgetPeriodSpent: number, managementFeePct: number, parentId?: string | null, createdAt: string, updatedAt: string, trustScore: number, reputationLevel: ReputationLevel, tasksCompleted: number, tasksSuccessful: number, lastActivityAt?: string | null, lastPromotionAt?: string | null, lifetimeEarnings: number, domain?: string | null, teamId?: string | null, avatar?: string | null, avatarColor?: string | null, avatarUrl?: string | null };

export type TasksQueryVariables = Exact<{
  orgId: Scalars['ID']['input'];
  status?: InputMaybe<TaskStatus>;
}>;


export type TasksQuery = { tasks: Array<{ id: string, identifier: string, title: string, description?: string | null, status: TaskStatus, priority: TaskPriority, assigneeId?: string | null, creatorId: string, approvalRequired: boolean, dueDate?: string | null, completedAt?: string | null, createdAt: string, updatedAt: string, approvedAt?: string | null, assignee?: { id: string, name: string } | null, rejection?: { feedback: string, rejectedAt: string, rejectedBy: string, rejectionCount: number } | null }> };

export type TaskQueryVariables = Exact<{
  orgId: Scalars['ID']['input'];
  id: Scalars['ID']['input'];
}>;


export type TaskQuery = { task?: { id: string, identifier: string, title: string, description?: string | null, status: TaskStatus, priority: TaskPriority, assigneeId?: string | null, creatorId: string, parentTaskId?: string | null, approvalRequired: boolean, approvedAt?: string | null, dueDate?: string | null, completedAt?: string | null, createdAt: string, updatedAt: string, assignee?: { id: string, name: string } | null, rejection?: { feedback: string, rejectedAt: string, rejectedBy: string, rejectionCount: number } | null } | null };

export type AgentsQueryVariables = Exact<{
  orgId: Scalars['ID']['input'];
}>;


export type AgentsQuery = { agents: Array<{ id: string, agentId: string, name: string, role: AgentRole, mode: AgentMode, status: AgentStatus, level: number, model: string, currentBalance: number, budgetPeriodLimit?: number | null, budgetPeriodSpent: number, managementFeePct: number, parentId?: string | null, createdAt: string, updatedAt: string, trustScore: number, reputationLevel: ReputationLevel, tasksCompleted: number, tasksSuccessful: number, lastActivityAt?: string | null, lastPromotionAt?: string | null, lifetimeEarnings: number, domain?: string | null, teamId?: string | null, avatar?: string | null, avatarColor?: string | null, avatarUrl?: string | null }> };

export type CreditHistoryQueryVariables = Exact<{
  orgId: Scalars['ID']['input'];
  agentId?: InputMaybe<Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type CreditHistoryQuery = { creditHistory: Array<{ id: string, agentId: string, type: CreditType, amount: number, balanceAfter: number, reason: string, triggerType?: string | null, sourceTaskId?: string | null, createdAt: string }> };

export type EventsQueryVariables = Exact<{
  orgId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
}>;


export type EventsQuery = { events: Array<{ id: string, type: string, actorId: string, entityType: string, entityId: string, severity: EventSeverity, reasoning?: string | null, createdAt: string, actor?: { id: string, name: string } | null }> };

export type ChannelsQueryVariables = Exact<{
  orgId: Scalars['ID']['input'];
}>;


export type ChannelsQuery = { channels: Array<{ id: string, name: string, type: ChannelType, taskId?: string | null, createdAt: string }> };

export type MessagesQueryVariables = Exact<{
  orgId: Scalars['ID']['input'];
  channelId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type MessagesQuery = { messages: Array<{ id: string, channelId: string, senderId: string, type: MessageType, body: string, parentMessageId?: string | null, createdAt: string }> };

export type WebhooksQueryVariables = Exact<{
  orgId: Scalars['ID']['input'];
}>;


export type WebhooksQuery = { webhooks: Array<{ id: string, orgId: string, name: string, url: string, secret?: string | null, events: Array<string>, enabled: boolean, hookType: WebhookHookType, canBlock: boolean, timeoutMs: number, failureCount: number, lastTriggeredAt?: string | null, lastError?: string | null, createdAt: string, updatedAt: string }> };

export type WebhookQueryVariables = Exact<{
  orgId: Scalars['ID']['input'];
  id: Scalars['ID']['input'];
}>;


export type WebhookQuery = { webhook?: { id: string, orgId: string, name: string, url: string, secret?: string | null, events: Array<string>, enabled: boolean, hookType: WebhookHookType, canBlock: boolean, timeoutMs: number, failureCount: number, lastTriggeredAt?: string | null, lastError?: string | null, createdAt: string, updatedAt: string } | null };

export type CreateWebhookMutationVariables = Exact<{
  orgId: Scalars['ID']['input'];
  input: CreateWebhookInput;
}>;


export type CreateWebhookMutation = { createWebhook: { id: string, orgId: string, name: string, url: string, secret?: string | null, events: Array<string>, enabled: boolean, hookType: WebhookHookType, canBlock: boolean, timeoutMs: number, failureCount: number, lastTriggeredAt?: string | null, lastError?: string | null, createdAt: string, updatedAt: string } };

export type UpdateWebhookMutationVariables = Exact<{
  orgId: Scalars['ID']['input'];
  id: Scalars['ID']['input'];
  input: UpdateWebhookInput;
}>;


export type UpdateWebhookMutation = { updateWebhook: { id: string, orgId: string, name: string, url: string, secret?: string | null, events: Array<string>, enabled: boolean, hookType: WebhookHookType, canBlock: boolean, timeoutMs: number, failureCount: number, lastTriggeredAt?: string | null, lastError?: string | null, createdAt: string, updatedAt: string } };

export type DeleteWebhookMutationVariables = Exact<{
  orgId: Scalars['ID']['input'];
  id: Scalars['ID']['input'];
}>;


export type DeleteWebhookMutation = { deleteWebhook: boolean };

export type TestWebhookMutationVariables = Exact<{
  orgId: Scalars['ID']['input'];
  id: Scalars['ID']['input'];
}>;


export type TestWebhookMutation = { testWebhook: boolean };


export const AgentFieldsFragmentDoc = `
    fragment AgentFields on AgentType {
  id
  agentId
  name
  role
  mode
  status
  level
  model
  currentBalance
  budgetPeriodLimit
  budgetPeriodSpent
  managementFeePct
  parentId
  createdAt
  updatedAt
  trustScore
  reputationLevel
  tasksCompleted
  tasksSuccessful
  lastActivityAt
  lastPromotionAt
  lifetimeEarnings
  domain
  teamId
  avatar
  avatarColor
  avatarUrl
}
    `;
export const TasksDocument = `
    query Tasks($orgId: ID!, $status: TaskStatus) {
  tasks(orgId: $orgId, status: $status) {
    id
    identifier
    title
    description
    status
    priority
    assigneeId
    assignee {
      id
      name
    }
    creatorId
    approvalRequired
    dueDate
    completedAt
    createdAt
    updatedAt
    approvedAt
    rejection {
      feedback
      rejectedAt
      rejectedBy
      rejectionCount
    }
  }
}
    `;

export const useTasksQuery = <
      TData = TasksQuery,
      TError = unknown
    >(
      variables: TasksQueryVariables,
      options?: Omit<UseQueryOptions<TasksQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<TasksQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<TasksQuery, TError, TData>(
      {
    queryKey: ['Tasks', variables],
    queryFn: fetcher<TasksQuery, TasksQueryVariables>(TasksDocument, variables),
    ...options
  }
    )};

useTasksQuery.getKey = (variables: TasksQueryVariables) => ['Tasks', variables];


useTasksQuery.fetcher = (variables: TasksQueryVariables, options?: RequestInit['headers']) => fetcher<TasksQuery, TasksQueryVariables>(TasksDocument, variables, options);

export const TaskDocument = `
    query Task($orgId: ID!, $id: ID!) {
  task(orgId: $orgId, id: $id) {
    id
    identifier
    title
    description
    status
    priority
    assigneeId
    assignee {
      id
      name
    }
    creatorId
    parentTaskId
    approvalRequired
    approvedAt
    dueDate
    completedAt
    createdAt
    updatedAt
    rejection {
      feedback
      rejectedAt
      rejectedBy
      rejectionCount
    }
  }
}
    `;

export const useTaskQuery = <
      TData = TaskQuery,
      TError = unknown
    >(
      variables: TaskQueryVariables,
      options?: Omit<UseQueryOptions<TaskQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<TaskQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<TaskQuery, TError, TData>(
      {
    queryKey: ['Task', variables],
    queryFn: fetcher<TaskQuery, TaskQueryVariables>(TaskDocument, variables),
    ...options
  }
    )};

useTaskQuery.getKey = (variables: TaskQueryVariables) => ['Task', variables];


useTaskQuery.fetcher = (variables: TaskQueryVariables, options?: RequestInit['headers']) => fetcher<TaskQuery, TaskQueryVariables>(TaskDocument, variables, options);

export const AgentsDocument = `
    query Agents($orgId: ID!) {
  agents(orgId: $orgId) {
    ...AgentFields
  }
}
    ${AgentFieldsFragmentDoc}`;

export const useAgentsQuery = <
      TData = AgentsQuery,
      TError = unknown
    >(
      variables: AgentsQueryVariables,
      options?: Omit<UseQueryOptions<AgentsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<AgentsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<AgentsQuery, TError, TData>(
      {
    queryKey: ['Agents', variables],
    queryFn: fetcher<AgentsQuery, AgentsQueryVariables>(AgentsDocument, variables),
    ...options
  }
    )};

useAgentsQuery.getKey = (variables: AgentsQueryVariables) => ['Agents', variables];


useAgentsQuery.fetcher = (variables: AgentsQueryVariables, options?: RequestInit['headers']) => fetcher<AgentsQuery, AgentsQueryVariables>(AgentsDocument, variables, options);

export const CreditHistoryDocument = `
    query CreditHistory($orgId: ID!, $agentId: ID, $limit: Int, $offset: Int) {
  creditHistory(orgId: $orgId, agentId: $agentId, limit: $limit, offset: $offset) {
    id
    agentId
    type
    amount
    balanceAfter
    reason
    triggerType
    sourceTaskId
    createdAt
  }
}
    `;

export const useCreditHistoryQuery = <
      TData = CreditHistoryQuery,
      TError = unknown
    >(
      variables: CreditHistoryQueryVariables,
      options?: Omit<UseQueryOptions<CreditHistoryQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<CreditHistoryQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<CreditHistoryQuery, TError, TData>(
      {
    queryKey: ['CreditHistory', variables],
    queryFn: fetcher<CreditHistoryQuery, CreditHistoryQueryVariables>(CreditHistoryDocument, variables),
    ...options
  }
    )};

useCreditHistoryQuery.getKey = (variables: CreditHistoryQueryVariables) => ['CreditHistory', variables];


useCreditHistoryQuery.fetcher = (variables: CreditHistoryQueryVariables, options?: RequestInit['headers']) => fetcher<CreditHistoryQuery, CreditHistoryQueryVariables>(CreditHistoryDocument, variables, options);

export const EventsDocument = `
    query Events($orgId: ID!, $limit: Int, $page: Int) {
  events(orgId: $orgId, limit: $limit, page: $page) {
    id
    type
    actorId
    actor {
      id
      name
    }
    entityType
    entityId
    severity
    reasoning
    createdAt
  }
}
    `;

export const useEventsQuery = <
      TData = EventsQuery,
      TError = unknown
    >(
      variables: EventsQueryVariables,
      options?: Omit<UseQueryOptions<EventsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<EventsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<EventsQuery, TError, TData>(
      {
    queryKey: ['Events', variables],
    queryFn: fetcher<EventsQuery, EventsQueryVariables>(EventsDocument, variables),
    ...options
  }
    )};

useEventsQuery.getKey = (variables: EventsQueryVariables) => ['Events', variables];


useEventsQuery.fetcher = (variables: EventsQueryVariables, options?: RequestInit['headers']) => fetcher<EventsQuery, EventsQueryVariables>(EventsDocument, variables, options);

export const ChannelsDocument = `
    query Channels($orgId: ID!) {
  channels(orgId: $orgId) {
    id
    name
    type
    taskId
    createdAt
  }
}
    `;

export const useChannelsQuery = <
      TData = ChannelsQuery,
      TError = unknown
    >(
      variables: ChannelsQueryVariables,
      options?: Omit<UseQueryOptions<ChannelsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<ChannelsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<ChannelsQuery, TError, TData>(
      {
    queryKey: ['Channels', variables],
    queryFn: fetcher<ChannelsQuery, ChannelsQueryVariables>(ChannelsDocument, variables),
    ...options
  }
    )};

useChannelsQuery.getKey = (variables: ChannelsQueryVariables) => ['Channels', variables];


useChannelsQuery.fetcher = (variables: ChannelsQueryVariables, options?: RequestInit['headers']) => fetcher<ChannelsQuery, ChannelsQueryVariables>(ChannelsDocument, variables, options);

export const MessagesDocument = `
    query Messages($orgId: ID!, $channelId: ID!, $limit: Int) {
  messages(orgId: $orgId, channelId: $channelId, limit: $limit) {
    id
    channelId
    senderId
    type
    body
    parentMessageId
    createdAt
  }
}
    `;

export const useMessagesQuery = <
      TData = MessagesQuery,
      TError = unknown
    >(
      variables: MessagesQueryVariables,
      options?: Omit<UseQueryOptions<MessagesQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<MessagesQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<MessagesQuery, TError, TData>(
      {
    queryKey: ['Messages', variables],
    queryFn: fetcher<MessagesQuery, MessagesQueryVariables>(MessagesDocument, variables),
    ...options
  }
    )};

useMessagesQuery.getKey = (variables: MessagesQueryVariables) => ['Messages', variables];


useMessagesQuery.fetcher = (variables: MessagesQueryVariables, options?: RequestInit['headers']) => fetcher<MessagesQuery, MessagesQueryVariables>(MessagesDocument, variables, options);

export const WebhooksDocument = `
    query Webhooks($orgId: ID!) {
  webhooks(orgId: $orgId) {
    id
    orgId
    name
    url
    secret
    events
    enabled
    hookType
    canBlock
    timeoutMs
    failureCount
    lastTriggeredAt
    lastError
    createdAt
    updatedAt
  }
}
    `;

export const useWebhooksQuery = <
      TData = WebhooksQuery,
      TError = unknown
    >(
      variables: WebhooksQueryVariables,
      options?: Omit<UseQueryOptions<WebhooksQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<WebhooksQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<WebhooksQuery, TError, TData>(
      {
    queryKey: ['Webhooks', variables],
    queryFn: fetcher<WebhooksQuery, WebhooksQueryVariables>(WebhooksDocument, variables),
    ...options
  }
    )};

useWebhooksQuery.getKey = (variables: WebhooksQueryVariables) => ['Webhooks', variables];


useWebhooksQuery.fetcher = (variables: WebhooksQueryVariables, options?: RequestInit['headers']) => fetcher<WebhooksQuery, WebhooksQueryVariables>(WebhooksDocument, variables, options);

export const WebhookDocument = `
    query Webhook($orgId: ID!, $id: ID!) {
  webhook(orgId: $orgId, id: $id) {
    id
    orgId
    name
    url
    secret
    events
    enabled
    hookType
    canBlock
    timeoutMs
    failureCount
    lastTriggeredAt
    lastError
    createdAt
    updatedAt
  }
}
    `;

export const useWebhookQuery = <
      TData = WebhookQuery,
      TError = unknown
    >(
      variables: WebhookQueryVariables,
      options?: Omit<UseQueryOptions<WebhookQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<WebhookQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<WebhookQuery, TError, TData>(
      {
    queryKey: ['Webhook', variables],
    queryFn: fetcher<WebhookQuery, WebhookQueryVariables>(WebhookDocument, variables),
    ...options
  }
    )};

useWebhookQuery.getKey = (variables: WebhookQueryVariables) => ['Webhook', variables];


useWebhookQuery.fetcher = (variables: WebhookQueryVariables, options?: RequestInit['headers']) => fetcher<WebhookQuery, WebhookQueryVariables>(WebhookDocument, variables, options);

export const CreateWebhookDocument = `
    mutation CreateWebhook($orgId: ID!, $input: CreateWebhookInput!) {
  createWebhook(orgId: $orgId, input: $input) {
    id
    orgId
    name
    url
    secret
    events
    enabled
    hookType
    canBlock
    timeoutMs
    failureCount
    lastTriggeredAt
    lastError
    createdAt
    updatedAt
  }
}
    `;

export const useCreateWebhookMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<CreateWebhookMutation, TError, CreateWebhookMutationVariables, TContext>) => {
    
    return useMutation<CreateWebhookMutation, TError, CreateWebhookMutationVariables, TContext>(
      {
    mutationKey: ['CreateWebhook'],
    mutationFn: (variables?: CreateWebhookMutationVariables) => fetcher<CreateWebhookMutation, CreateWebhookMutationVariables>(CreateWebhookDocument, variables)(),
    ...options
  }
    )};


useCreateWebhookMutation.fetcher = (variables: CreateWebhookMutationVariables, options?: RequestInit['headers']) => fetcher<CreateWebhookMutation, CreateWebhookMutationVariables>(CreateWebhookDocument, variables, options);

export const UpdateWebhookDocument = `
    mutation UpdateWebhook($orgId: ID!, $id: ID!, $input: UpdateWebhookInput!) {
  updateWebhook(orgId: $orgId, id: $id, input: $input) {
    id
    orgId
    name
    url
    secret
    events
    enabled
    hookType
    canBlock
    timeoutMs
    failureCount
    lastTriggeredAt
    lastError
    createdAt
    updatedAt
  }
}
    `;

export const useUpdateWebhookMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<UpdateWebhookMutation, TError, UpdateWebhookMutationVariables, TContext>) => {
    
    return useMutation<UpdateWebhookMutation, TError, UpdateWebhookMutationVariables, TContext>(
      {
    mutationKey: ['UpdateWebhook'],
    mutationFn: (variables?: UpdateWebhookMutationVariables) => fetcher<UpdateWebhookMutation, UpdateWebhookMutationVariables>(UpdateWebhookDocument, variables)(),
    ...options
  }
    )};


useUpdateWebhookMutation.fetcher = (variables: UpdateWebhookMutationVariables, options?: RequestInit['headers']) => fetcher<UpdateWebhookMutation, UpdateWebhookMutationVariables>(UpdateWebhookDocument, variables, options);

export const DeleteWebhookDocument = `
    mutation DeleteWebhook($orgId: ID!, $id: ID!) {
  deleteWebhook(orgId: $orgId, id: $id)
}
    `;

export const useDeleteWebhookMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<DeleteWebhookMutation, TError, DeleteWebhookMutationVariables, TContext>) => {
    
    return useMutation<DeleteWebhookMutation, TError, DeleteWebhookMutationVariables, TContext>(
      {
    mutationKey: ['DeleteWebhook'],
    mutationFn: (variables?: DeleteWebhookMutationVariables) => fetcher<DeleteWebhookMutation, DeleteWebhookMutationVariables>(DeleteWebhookDocument, variables)(),
    ...options
  }
    )};


useDeleteWebhookMutation.fetcher = (variables: DeleteWebhookMutationVariables, options?: RequestInit['headers']) => fetcher<DeleteWebhookMutation, DeleteWebhookMutationVariables>(DeleteWebhookDocument, variables, options);

export const TestWebhookDocument = `
    mutation TestWebhook($orgId: ID!, $id: ID!) {
  testWebhook(orgId: $orgId, id: $id)
}
    `;

export const useTestWebhookMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<TestWebhookMutation, TError, TestWebhookMutationVariables, TContext>) => {
    
    return useMutation<TestWebhookMutation, TError, TestWebhookMutationVariables, TContext>(
      {
    mutationKey: ['TestWebhook'],
    mutationFn: (variables?: TestWebhookMutationVariables) => fetcher<TestWebhookMutation, TestWebhookMutationVariables>(TestWebhookDocument, variables)(),
    ...options
  }
    )};


useTestWebhookMutation.fetcher = (variables: TestWebhookMutationVariables, options?: RequestInit['headers']) => fetcher<TestWebhookMutation, TestWebhookMutationVariables>(TestWebhookDocument, variables, options);
