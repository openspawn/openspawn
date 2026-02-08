import { graphql } from "./generated";

// Subscriptions for real-time updates

export const EventCreatedSubscription = graphql(`
  subscription EventCreated($orgId: ID!) {
    eventCreated(orgId: $orgId) {
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

export const TaskUpdatedSubscription = graphql(`
  subscription TaskUpdated($orgId: ID!) {
    taskUpdated(orgId: $orgId) {
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

export const CreditUpdatedSubscription = graphql(`
  subscription CreditUpdated($orgId: ID!) {
    creditUpdated(orgId: $orgId) {
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

export const MessageCreatedSubscription = graphql(`
  subscription MessageCreated($orgId: ID!, $channelId: ID!) {
    messageCreated(orgId: $orgId, channelId: $channelId) {
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
