/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
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
  creditHistory: Array<CreditTransactionType>;
  events: Array<EventType>;
  messages: Array<MessageGqlType>;
  reputationHistory: Array<ReputationHistoryEntryType>;
  task?: Maybe<TaskType>;
  tasks: Array<TaskType>;
  trustLeaderboard: Array<LeaderboardEntryType>;
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


export type QueryCreditHistoryArgs = {
  agentId?: InputMaybe<Scalars['ID']['input']>;
  limit?: Scalars['Int']['input'];
  offset?: Scalars['Int']['input'];
  orgId: Scalars['ID']['input'];
};


export type QueryEventsArgs = {
  limit?: Scalars['Int']['input'];
  orgId: Scalars['ID']['input'];
  page?: Scalars['Int']['input'];
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

export type Subscription = {
  creditTransactionCreated: CreditTransactionType;
  eventCreated: EventType;
  messageCreated: MessageGqlType;
  taskUpdated: TaskType;
};


export type SubscriptionCreditTransactionCreatedArgs = {
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

export enum TaskPriority {
  High = 'HIGH',
  Low = 'LOW',
  Normal = 'NORMAL',
  Urgent = 'URGENT'
}

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
  status: TaskStatus;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type AgentFieldsFragment = { id: string, agentId: string, name: string, role: AgentRole, mode: AgentMode, status: AgentStatus, level: number, model: string, currentBalance: number, budgetPeriodLimit?: number | null, budgetPeriodSpent: number, managementFeePct: number, parentId?: string | null, createdAt: string, updatedAt: string, trustScore: number, reputationLevel: ReputationLevel, tasksCompleted: number, tasksSuccessful: number, lastActivityAt?: string | null, lastPromotionAt?: string | null, lifetimeEarnings: number, domain?: string | null };

export type TasksQueryVariables = Exact<{
  orgId: Scalars['ID']['input'];
  status?: InputMaybe<TaskStatus>;
}>;


export type TasksQuery = { tasks: Array<{ id: string, identifier: string, title: string, description?: string | null, status: TaskStatus, priority: TaskPriority, assigneeId?: string | null, creatorId: string, approvalRequired: boolean, dueDate?: string | null, completedAt?: string | null, createdAt: string, assignee?: { id: string, name: string } | null }> };

export type TaskQueryVariables = Exact<{
  orgId: Scalars['ID']['input'];
  id: Scalars['ID']['input'];
}>;


export type TaskQuery = { task?: { id: string, identifier: string, title: string, description?: string | null, status: TaskStatus, priority: TaskPriority, assigneeId?: string | null, creatorId: string, parentTaskId?: string | null, approvalRequired: boolean, approvedAt?: string | null, dueDate?: string | null, completedAt?: string | null, createdAt: string, updatedAt: string, assignee?: { id: string, name: string } | null } | null };

export type AgentsQueryVariables = Exact<{
  orgId: Scalars['ID']['input'];
}>;


export type AgentsQuery = { agents: Array<{ id: string, agentId: string, name: string, role: AgentRole, mode: AgentMode, status: AgentStatus, level: number, model: string, currentBalance: number, budgetPeriodLimit?: number | null, budgetPeriodSpent: number, managementFeePct: number, parentId?: string | null, createdAt: string, updatedAt: string, trustScore: number, reputationLevel: ReputationLevel, tasksCompleted: number, tasksSuccessful: number, lastActivityAt?: string | null, lastPromotionAt?: string | null, lifetimeEarnings: number, domain?: string | null }> };

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

export const AgentFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentType"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"agentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"currentBalance"}},{"kind":"Field","name":{"kind":"Name","value":"budgetPeriodLimit"}},{"kind":"Field","name":{"kind":"Name","value":"budgetPeriodSpent"}},{"kind":"Field","name":{"kind":"Name","value":"managementFeePct"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"trustScore"}},{"kind":"Field","name":{"kind":"Name","value":"reputationLevel"}},{"kind":"Field","name":{"kind":"Name","value":"tasksCompleted"}},{"kind":"Field","name":{"kind":"Name","value":"tasksSuccessful"}},{"kind":"Field","name":{"kind":"Name","value":"lastActivityAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastPromotionAt"}},{"kind":"Field","name":{"kind":"Name","value":"lifetimeEarnings"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}}]}}]} as unknown as DocumentNode<AgentFieldsFragment, unknown>;
export const TasksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Tasks"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orgId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TaskStatus"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tasks"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orgId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orgId"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"assigneeId"}},{"kind":"Field","name":{"kind":"Name","value":"assignee"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"creatorId"}},{"kind":"Field","name":{"kind":"Name","value":"approvalRequired"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<TasksQuery, TasksQueryVariables>;
export const TaskDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Task"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orgId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"task"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orgId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orgId"}}},{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"assigneeId"}},{"kind":"Field","name":{"kind":"Name","value":"assignee"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"creatorId"}},{"kind":"Field","name":{"kind":"Name","value":"parentTaskId"}},{"kind":"Field","name":{"kind":"Name","value":"approvalRequired"}},{"kind":"Field","name":{"kind":"Name","value":"approvedAt"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<TaskQuery, TaskQueryVariables>;
export const AgentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Agents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orgId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agents"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orgId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orgId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AgentFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AgentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentType"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"agentId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"currentBalance"}},{"kind":"Field","name":{"kind":"Name","value":"budgetPeriodLimit"}},{"kind":"Field","name":{"kind":"Name","value":"budgetPeriodSpent"}},{"kind":"Field","name":{"kind":"Name","value":"managementFeePct"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"trustScore"}},{"kind":"Field","name":{"kind":"Name","value":"reputationLevel"}},{"kind":"Field","name":{"kind":"Name","value":"tasksCompleted"}},{"kind":"Field","name":{"kind":"Name","value":"tasksSuccessful"}},{"kind":"Field","name":{"kind":"Name","value":"lastActivityAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastPromotionAt"}},{"kind":"Field","name":{"kind":"Name","value":"lifetimeEarnings"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}}]}}]} as unknown as DocumentNode<AgentsQuery, AgentsQueryVariables>;
export const CreditHistoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CreditHistory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orgId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"creditHistory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orgId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orgId"}}},{"kind":"Argument","name":{"kind":"Name","value":"agentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"agentId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"balanceAfter"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"triggerType"}},{"kind":"Field","name":{"kind":"Name","value":"sourceTaskId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<CreditHistoryQuery, CreditHistoryQueryVariables>;
export const EventsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Events"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orgId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"events"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orgId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orgId"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"actorId"}},{"kind":"Field","name":{"kind":"Name","value":"actor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"entityType"}},{"kind":"Field","name":{"kind":"Name","value":"entityId"}},{"kind":"Field","name":{"kind":"Name","value":"severity"}},{"kind":"Field","name":{"kind":"Name","value":"reasoning"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<EventsQuery, EventsQueryVariables>;
export const ChannelsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Channels"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orgId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"channels"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orgId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orgId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"taskId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<ChannelsQuery, ChannelsQueryVariables>;
export const MessagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Messages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orgId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"channelId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"messages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orgId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orgId"}}},{"kind":"Argument","name":{"kind":"Name","value":"channelId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"channelId"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"channelId"}},{"kind":"Field","name":{"kind":"Name","value":"senderId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"parentMessageId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<MessagesQuery, MessagesQueryVariables>;