import { gql } from "@urql/core";

export const TASK_UPDATED_SUBSCRIPTION = gql`
  subscription TaskUpdated($orgId: ID!) {
    taskUpdated(orgId: $orgId) {
      id
      identifier
      title
      status
      priority
      assigneeId
      completedAt
      updatedAt
    }
  }
`;

export const CREDIT_TRANSACTION_SUBSCRIPTION = gql`
  subscription CreditTransactionCreated($orgId: ID!) {
    creditTransactionCreated(orgId: $orgId) {
      id
      agentId
      type
      amount
      balanceAfter
      reason
      createdAt
    }
  }
`;

export const EVENT_SUBSCRIPTION = gql`
  subscription EventCreated($orgId: ID!) {
    eventCreated(orgId: $orgId) {
      id
      type
      actorId
      entityType
      entityId
      severity
      createdAt
    }
  }
`;

export const MESSAGE_SUBSCRIPTION = gql`
  subscription MessageCreated($orgId: ID!, $channelId: ID) {
    messageCreated(orgId: $orgId, channelId: $channelId) {
      id
      channelId
      senderId
      type
      body
      createdAt
    }
  }
`;
