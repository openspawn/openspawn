import { graphql } from "./generated";

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
    }
  }
`);

export const AgentsQueryDocument = graphql(`
  query Agents($orgId: ID!) {
    agents(orgId: $orgId) {
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
