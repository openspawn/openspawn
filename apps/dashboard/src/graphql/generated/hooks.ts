import { useQuery, UseQueryOptions } from '@tanstack/react-query';
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

export type AgentFieldsFragment = { id: string, agentId: string, name: string, role: AgentRole, status: AgentStatus, level: number, model: string, currentBalance: number, budgetPeriodLimit?: number | null, budgetPeriodSpent: number, managementFeePct: number, parentId?: string | null, createdAt: string, updatedAt: string, trustScore: number, reputationLevel: ReputationLevel, tasksCompleted: number, tasksSuccessful: number, lastActivityAt?: string | null, lastPromotionAt?: string | null, lifetimeEarnings: number, domain?: string | null };

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


export type AgentsQuery = { agents: Array<{ id: string, agentId: string, name: string, role: AgentRole, status: AgentStatus, level: number, model: string, currentBalance: number, budgetPeriodLimit?: number | null, budgetPeriodSpent: number, managementFeePct: number, parentId?: string | null, createdAt: string, updatedAt: string, trustScore: number, reputationLevel: ReputationLevel, tasksCompleted: number, tasksSuccessful: number, lastActivityAt?: string | null, lastPromotionAt?: string | null, lifetimeEarnings: number, domain?: string | null }> };

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


export const AgentFieldsFragmentDoc = `
    fragment AgentFields on AgentType {
  id
  agentId
  name
  role
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
