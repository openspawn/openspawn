/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  fragment AgentFields on AgentType {\n    id\n    agentId\n    name\n    role\n    mode\n    status\n    level\n    model\n    currentBalance\n    budgetPeriodLimit\n    budgetPeriodSpent\n    managementFeePct\n    parentId\n    createdAt\n    updatedAt\n    # Trust & Reputation\n    trustScore\n    reputationLevel\n    tasksCompleted\n    tasksSuccessful\n    lastActivityAt\n    lastPromotionAt\n    lifetimeEarnings\n    domain\n  }\n": typeof types.AgentFieldsFragmentDoc,
    "\n  query Tasks($orgId: ID!, $status: TaskStatus) {\n    tasks(orgId: $orgId, status: $status) {\n      id\n      identifier\n      title\n      description\n      status\n      priority\n      assigneeId\n      assignee {\n        id\n        name\n      }\n      creatorId\n      approvalRequired\n      dueDate\n      completedAt\n      createdAt\n      rejection {\n        feedback\n        rejectedAt\n        rejectedBy\n        rejectionCount\n      }\n    }\n  }\n": typeof types.TasksDocument,
    "\n  query Task($orgId: ID!, $id: ID!) {\n    task(orgId: $orgId, id: $id) {\n      id\n      identifier\n      title\n      description\n      status\n      priority\n      assigneeId\n      assignee {\n        id\n        name\n      }\n      creatorId\n      parentTaskId\n      approvalRequired\n      approvedAt\n      dueDate\n      completedAt\n      createdAt\n      updatedAt\n      rejection {\n        feedback\n        rejectedAt\n        rejectedBy\n        rejectionCount\n      }\n    }\n  }\n": typeof types.TaskDocument,
    "\n  query Agents($orgId: ID!) {\n    agents(orgId: $orgId) {\n      ...AgentFields\n    }\n  }\n": typeof types.AgentsDocument,
    "\n  query CreditHistory($orgId: ID!, $agentId: ID, $limit: Int, $offset: Int) {\n    creditHistory(orgId: $orgId, agentId: $agentId, limit: $limit, offset: $offset) {\n      id\n      agentId\n      type\n      amount\n      balanceAfter\n      reason\n      triggerType\n      sourceTaskId\n      createdAt\n    }\n  }\n": typeof types.CreditHistoryDocument,
    "\n  query Events($orgId: ID!, $limit: Int, $page: Int) {\n    events(orgId: $orgId, limit: $limit, page: $page) {\n      id\n      type\n      actorId\n      actor {\n        id\n        name\n      }\n      entityType\n      entityId\n      severity\n      reasoning\n      createdAt\n    }\n  }\n": typeof types.EventsDocument,
    "\n  query Channels($orgId: ID!) {\n    channels(orgId: $orgId) {\n      id\n      name\n      type\n      taskId\n      createdAt\n    }\n  }\n": typeof types.ChannelsDocument,
    "\n  query Messages($orgId: ID!, $channelId: ID!, $limit: Int) {\n    messages(orgId: $orgId, channelId: $channelId, limit: $limit) {\n      id\n      channelId\n      senderId\n      type\n      body\n      parentMessageId\n      createdAt\n    }\n  }\n": typeof types.MessagesDocument,
    "\n  query Webhooks($orgId: ID!) {\n    webhooks(orgId: $orgId) {\n      id\n      orgId\n      name\n      url\n      secret\n      events\n      enabled\n      hookType\n      canBlock\n      timeoutMs\n      failureCount\n      lastTriggeredAt\n      lastError\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.WebhooksDocument,
    "\n  query Webhook($orgId: ID!, $id: ID!) {\n    webhook(orgId: $orgId, id: $id) {\n      id\n      orgId\n      name\n      url\n      secret\n      events\n      enabled\n      hookType\n      canBlock\n      timeoutMs\n      failureCount\n      lastTriggeredAt\n      lastError\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.WebhookDocument,
    "\n  mutation CreateWebhook($orgId: ID!, $input: CreateWebhookInput!) {\n    createWebhook(orgId: $orgId, input: $input) {\n      id\n      orgId\n      name\n      url\n      secret\n      events\n      enabled\n      hookType\n      canBlock\n      timeoutMs\n      failureCount\n      lastTriggeredAt\n      lastError\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.CreateWebhookDocument,
    "\n  mutation UpdateWebhook($orgId: ID!, $id: ID!, $input: UpdateWebhookInput!) {\n    updateWebhook(orgId: $orgId, id: $id, input: $input) {\n      id\n      orgId\n      name\n      url\n      secret\n      events\n      enabled\n      hookType\n      canBlock\n      timeoutMs\n      failureCount\n      lastTriggeredAt\n      lastError\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.UpdateWebhookDocument,
    "\n  mutation DeleteWebhook($orgId: ID!, $id: ID!) {\n    deleteWebhook(orgId: $orgId, id: $id)\n  }\n": typeof types.DeleteWebhookDocument,
    "\n  mutation TestWebhook($orgId: ID!, $id: ID!) {\n    testWebhook(orgId: $orgId, id: $id)\n  }\n": typeof types.TestWebhookDocument,
};
const documents: Documents = {
    "\n  fragment AgentFields on AgentType {\n    id\n    agentId\n    name\n    role\n    mode\n    status\n    level\n    model\n    currentBalance\n    budgetPeriodLimit\n    budgetPeriodSpent\n    managementFeePct\n    parentId\n    createdAt\n    updatedAt\n    # Trust & Reputation\n    trustScore\n    reputationLevel\n    tasksCompleted\n    tasksSuccessful\n    lastActivityAt\n    lastPromotionAt\n    lifetimeEarnings\n    domain\n  }\n": types.AgentFieldsFragmentDoc,
    "\n  query Tasks($orgId: ID!, $status: TaskStatus) {\n    tasks(orgId: $orgId, status: $status) {\n      id\n      identifier\n      title\n      description\n      status\n      priority\n      assigneeId\n      assignee {\n        id\n        name\n      }\n      creatorId\n      approvalRequired\n      dueDate\n      completedAt\n      createdAt\n      rejection {\n        feedback\n        rejectedAt\n        rejectedBy\n        rejectionCount\n      }\n    }\n  }\n": types.TasksDocument,
    "\n  query Task($orgId: ID!, $id: ID!) {\n    task(orgId: $orgId, id: $id) {\n      id\n      identifier\n      title\n      description\n      status\n      priority\n      assigneeId\n      assignee {\n        id\n        name\n      }\n      creatorId\n      parentTaskId\n      approvalRequired\n      approvedAt\n      dueDate\n      completedAt\n      createdAt\n      updatedAt\n      rejection {\n        feedback\n        rejectedAt\n        rejectedBy\n        rejectionCount\n      }\n    }\n  }\n": types.TaskDocument,
    "\n  query Agents($orgId: ID!) {\n    agents(orgId: $orgId) {\n      ...AgentFields\n    }\n  }\n": types.AgentsDocument,
    "\n  query CreditHistory($orgId: ID!, $agentId: ID, $limit: Int, $offset: Int) {\n    creditHistory(orgId: $orgId, agentId: $agentId, limit: $limit, offset: $offset) {\n      id\n      agentId\n      type\n      amount\n      balanceAfter\n      reason\n      triggerType\n      sourceTaskId\n      createdAt\n    }\n  }\n": types.CreditHistoryDocument,
    "\n  query Events($orgId: ID!, $limit: Int, $page: Int) {\n    events(orgId: $orgId, limit: $limit, page: $page) {\n      id\n      type\n      actorId\n      actor {\n        id\n        name\n      }\n      entityType\n      entityId\n      severity\n      reasoning\n      createdAt\n    }\n  }\n": types.EventsDocument,
    "\n  query Channels($orgId: ID!) {\n    channels(orgId: $orgId) {\n      id\n      name\n      type\n      taskId\n      createdAt\n    }\n  }\n": types.ChannelsDocument,
    "\n  query Messages($orgId: ID!, $channelId: ID!, $limit: Int) {\n    messages(orgId: $orgId, channelId: $channelId, limit: $limit) {\n      id\n      channelId\n      senderId\n      type\n      body\n      parentMessageId\n      createdAt\n    }\n  }\n": types.MessagesDocument,
    "\n  query Webhooks($orgId: ID!) {\n    webhooks(orgId: $orgId) {\n      id\n      orgId\n      name\n      url\n      secret\n      events\n      enabled\n      hookType\n      canBlock\n      timeoutMs\n      failureCount\n      lastTriggeredAt\n      lastError\n      createdAt\n      updatedAt\n    }\n  }\n": types.WebhooksDocument,
    "\n  query Webhook($orgId: ID!, $id: ID!) {\n    webhook(orgId: $orgId, id: $id) {\n      id\n      orgId\n      name\n      url\n      secret\n      events\n      enabled\n      hookType\n      canBlock\n      timeoutMs\n      failureCount\n      lastTriggeredAt\n      lastError\n      createdAt\n      updatedAt\n    }\n  }\n": types.WebhookDocument,
    "\n  mutation CreateWebhook($orgId: ID!, $input: CreateWebhookInput!) {\n    createWebhook(orgId: $orgId, input: $input) {\n      id\n      orgId\n      name\n      url\n      secret\n      events\n      enabled\n      hookType\n      canBlock\n      timeoutMs\n      failureCount\n      lastTriggeredAt\n      lastError\n      createdAt\n      updatedAt\n    }\n  }\n": types.CreateWebhookDocument,
    "\n  mutation UpdateWebhook($orgId: ID!, $id: ID!, $input: UpdateWebhookInput!) {\n    updateWebhook(orgId: $orgId, id: $id, input: $input) {\n      id\n      orgId\n      name\n      url\n      secret\n      events\n      enabled\n      hookType\n      canBlock\n      timeoutMs\n      failureCount\n      lastTriggeredAt\n      lastError\n      createdAt\n      updatedAt\n    }\n  }\n": types.UpdateWebhookDocument,
    "\n  mutation DeleteWebhook($orgId: ID!, $id: ID!) {\n    deleteWebhook(orgId: $orgId, id: $id)\n  }\n": types.DeleteWebhookDocument,
    "\n  mutation TestWebhook($orgId: ID!, $id: ID!) {\n    testWebhook(orgId: $orgId, id: $id)\n  }\n": types.TestWebhookDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment AgentFields on AgentType {\n    id\n    agentId\n    name\n    role\n    mode\n    status\n    level\n    model\n    currentBalance\n    budgetPeriodLimit\n    budgetPeriodSpent\n    managementFeePct\n    parentId\n    createdAt\n    updatedAt\n    # Trust & Reputation\n    trustScore\n    reputationLevel\n    tasksCompleted\n    tasksSuccessful\n    lastActivityAt\n    lastPromotionAt\n    lifetimeEarnings\n    domain\n  }\n"): (typeof documents)["\n  fragment AgentFields on AgentType {\n    id\n    agentId\n    name\n    role\n    mode\n    status\n    level\n    model\n    currentBalance\n    budgetPeriodLimit\n    budgetPeriodSpent\n    managementFeePct\n    parentId\n    createdAt\n    updatedAt\n    # Trust & Reputation\n    trustScore\n    reputationLevel\n    tasksCompleted\n    tasksSuccessful\n    lastActivityAt\n    lastPromotionAt\n    lifetimeEarnings\n    domain\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Tasks($orgId: ID!, $status: TaskStatus) {\n    tasks(orgId: $orgId, status: $status) {\n      id\n      identifier\n      title\n      description\n      status\n      priority\n      assigneeId\n      assignee {\n        id\n        name\n      }\n      creatorId\n      approvalRequired\n      dueDate\n      completedAt\n      createdAt\n      rejection {\n        feedback\n        rejectedAt\n        rejectedBy\n        rejectionCount\n      }\n    }\n  }\n"): (typeof documents)["\n  query Tasks($orgId: ID!, $status: TaskStatus) {\n    tasks(orgId: $orgId, status: $status) {\n      id\n      identifier\n      title\n      description\n      status\n      priority\n      assigneeId\n      assignee {\n        id\n        name\n      }\n      creatorId\n      approvalRequired\n      dueDate\n      completedAt\n      createdAt\n      rejection {\n        feedback\n        rejectedAt\n        rejectedBy\n        rejectionCount\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Task($orgId: ID!, $id: ID!) {\n    task(orgId: $orgId, id: $id) {\n      id\n      identifier\n      title\n      description\n      status\n      priority\n      assigneeId\n      assignee {\n        id\n        name\n      }\n      creatorId\n      parentTaskId\n      approvalRequired\n      approvedAt\n      dueDate\n      completedAt\n      createdAt\n      updatedAt\n      rejection {\n        feedback\n        rejectedAt\n        rejectedBy\n        rejectionCount\n      }\n    }\n  }\n"): (typeof documents)["\n  query Task($orgId: ID!, $id: ID!) {\n    task(orgId: $orgId, id: $id) {\n      id\n      identifier\n      title\n      description\n      status\n      priority\n      assigneeId\n      assignee {\n        id\n        name\n      }\n      creatorId\n      parentTaskId\n      approvalRequired\n      approvedAt\n      dueDate\n      completedAt\n      createdAt\n      updatedAt\n      rejection {\n        feedback\n        rejectedAt\n        rejectedBy\n        rejectionCount\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Agents($orgId: ID!) {\n    agents(orgId: $orgId) {\n      ...AgentFields\n    }\n  }\n"): (typeof documents)["\n  query Agents($orgId: ID!) {\n    agents(orgId: $orgId) {\n      ...AgentFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CreditHistory($orgId: ID!, $agentId: ID, $limit: Int, $offset: Int) {\n    creditHistory(orgId: $orgId, agentId: $agentId, limit: $limit, offset: $offset) {\n      id\n      agentId\n      type\n      amount\n      balanceAfter\n      reason\n      triggerType\n      sourceTaskId\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  query CreditHistory($orgId: ID!, $agentId: ID, $limit: Int, $offset: Int) {\n    creditHistory(orgId: $orgId, agentId: $agentId, limit: $limit, offset: $offset) {\n      id\n      agentId\n      type\n      amount\n      balanceAfter\n      reason\n      triggerType\n      sourceTaskId\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Events($orgId: ID!, $limit: Int, $page: Int) {\n    events(orgId: $orgId, limit: $limit, page: $page) {\n      id\n      type\n      actorId\n      actor {\n        id\n        name\n      }\n      entityType\n      entityId\n      severity\n      reasoning\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  query Events($orgId: ID!, $limit: Int, $page: Int) {\n    events(orgId: $orgId, limit: $limit, page: $page) {\n      id\n      type\n      actorId\n      actor {\n        id\n        name\n      }\n      entityType\n      entityId\n      severity\n      reasoning\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Channels($orgId: ID!) {\n    channels(orgId: $orgId) {\n      id\n      name\n      type\n      taskId\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  query Channels($orgId: ID!) {\n    channels(orgId: $orgId) {\n      id\n      name\n      type\n      taskId\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Messages($orgId: ID!, $channelId: ID!, $limit: Int) {\n    messages(orgId: $orgId, channelId: $channelId, limit: $limit) {\n      id\n      channelId\n      senderId\n      type\n      body\n      parentMessageId\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  query Messages($orgId: ID!, $channelId: ID!, $limit: Int) {\n    messages(orgId: $orgId, channelId: $channelId, limit: $limit) {\n      id\n      channelId\n      senderId\n      type\n      body\n      parentMessageId\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Webhooks($orgId: ID!) {\n    webhooks(orgId: $orgId) {\n      id\n      orgId\n      name\n      url\n      secret\n      events\n      enabled\n      hookType\n      canBlock\n      timeoutMs\n      failureCount\n      lastTriggeredAt\n      lastError\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query Webhooks($orgId: ID!) {\n    webhooks(orgId: $orgId) {\n      id\n      orgId\n      name\n      url\n      secret\n      events\n      enabled\n      hookType\n      canBlock\n      timeoutMs\n      failureCount\n      lastTriggeredAt\n      lastError\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Webhook($orgId: ID!, $id: ID!) {\n    webhook(orgId: $orgId, id: $id) {\n      id\n      orgId\n      name\n      url\n      secret\n      events\n      enabled\n      hookType\n      canBlock\n      timeoutMs\n      failureCount\n      lastTriggeredAt\n      lastError\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query Webhook($orgId: ID!, $id: ID!) {\n    webhook(orgId: $orgId, id: $id) {\n      id\n      orgId\n      name\n      url\n      secret\n      events\n      enabled\n      hookType\n      canBlock\n      timeoutMs\n      failureCount\n      lastTriggeredAt\n      lastError\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateWebhook($orgId: ID!, $input: CreateWebhookInput!) {\n    createWebhook(orgId: $orgId, input: $input) {\n      id\n      orgId\n      name\n      url\n      secret\n      events\n      enabled\n      hookType\n      canBlock\n      timeoutMs\n      failureCount\n      lastTriggeredAt\n      lastError\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation CreateWebhook($orgId: ID!, $input: CreateWebhookInput!) {\n    createWebhook(orgId: $orgId, input: $input) {\n      id\n      orgId\n      name\n      url\n      secret\n      events\n      enabled\n      hookType\n      canBlock\n      timeoutMs\n      failureCount\n      lastTriggeredAt\n      lastError\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateWebhook($orgId: ID!, $id: ID!, $input: UpdateWebhookInput!) {\n    updateWebhook(orgId: $orgId, id: $id, input: $input) {\n      id\n      orgId\n      name\n      url\n      secret\n      events\n      enabled\n      hookType\n      canBlock\n      timeoutMs\n      failureCount\n      lastTriggeredAt\n      lastError\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateWebhook($orgId: ID!, $id: ID!, $input: UpdateWebhookInput!) {\n    updateWebhook(orgId: $orgId, id: $id, input: $input) {\n      id\n      orgId\n      name\n      url\n      secret\n      events\n      enabled\n      hookType\n      canBlock\n      timeoutMs\n      failureCount\n      lastTriggeredAt\n      lastError\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteWebhook($orgId: ID!, $id: ID!) {\n    deleteWebhook(orgId: $orgId, id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteWebhook($orgId: ID!, $id: ID!) {\n    deleteWebhook(orgId: $orgId, id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TestWebhook($orgId: ID!, $id: ID!) {\n    testWebhook(orgId: $orgId, id: $id)\n  }\n"): (typeof documents)["\n  mutation TestWebhook($orgId: ID!, $id: ID!) {\n    testWebhook(orgId: $orgId, id: $id)\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;