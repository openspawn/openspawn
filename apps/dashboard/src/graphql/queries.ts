import { gql } from "@urql/core";

export const TASKS_QUERY = gql`
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

export const TASK_QUERY = gql`
  query Task($orgId: ID!, $id: ID!) {
    task(orgId: $orgId, id: $id) {
      id
      identifier
      title
      description
      status
      priority
      assigneeId
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

export const AGENTS_QUERY = gql`
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
      createdAt
    }
  }
`;

export const CREDIT_HISTORY_QUERY = gql`
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

export const EVENTS_QUERY = gql`
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

export const CHANNELS_QUERY = gql`
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

export const MESSAGES_QUERY = gql`
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
