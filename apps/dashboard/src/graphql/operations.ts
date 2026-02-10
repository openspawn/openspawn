import { graphql } from "./generated";

// Fragments
export const AgentFieldsFragmentDocument = graphql(`
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
    # Trust & Reputation
    trustScore
    reputationLevel
    tasksCompleted
    tasksSuccessful
    lastActivityAt
    lastPromotionAt
    lifetimeEarnings
    domain
    teamId
  }
`);

// Queries
export const TasksQueryDocument = graphql(`
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
      rejection {
        feedback
        rejectedAt
        rejectedBy
        rejectionCount
      }
    }
  }
`);

export const TaskQueryDocument = graphql(`
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
`);

export const AgentsQueryDocument = graphql(`
  query Agents($orgId: ID!) {
    agents(orgId: $orgId) {
      ...AgentFields
    }
  }
`);

export const CreditHistoryQueryDocument = graphql(`
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
`);

export const EventsQueryDocument = graphql(`
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
`);

export const ChannelsQueryDocument = graphql(`
  query Channels($orgId: ID!) {
    channels(orgId: $orgId) {
      id
      name
      type
      taskId
      createdAt
    }
  }
`);

export const MessagesQueryDocument = graphql(`
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
`);

export const WebhooksQueryDocument = graphql(`
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
`);

export const WebhookQueryDocument = graphql(`
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
`);

// Mutations
export const CreateWebhookMutationDocument = graphql(`
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
`);

export const UpdateWebhookMutationDocument = graphql(`
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
`);

export const DeleteWebhookMutationDocument = graphql(`
  mutation DeleteWebhook($orgId: ID!, $id: ID!) {
    deleteWebhook(orgId: $orgId, id: $id)
  }
`);

export const TestWebhookMutationDocument = graphql(`
  mutation TestWebhook($orgId: ID!, $id: ID!) {
    testWebhook(orgId: $orgId, id: $id)
  }
`);
