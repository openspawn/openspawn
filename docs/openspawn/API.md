# OpenSpawn — API Specification

**Version:** 1.0  
**Date:** February 6, 2026  
**Base URL:** `http://api:3100` (internal) / `https://openspawn.{tailnet}:3100` (Tailscale)

---

## Transport Overview

| Consumer | Transport | Port | Auth |
|----------|-----------|------|------|
| AI Agents (via MCP) | MCP over stdio/SSE | 3102 | HMAC-signed requests |
| AI Agents (direct) | REST/JSON | 3100 | HMAC-signed requests |
| Dashboard | GraphQL + Subscriptions | 3100 | Phase 1: Tailscale implicit / Phase 2: OAuth2 |
| Webhooks (Phase 2) | Outbound POST | — | HMAC-signed payloads |

## Authentication Headers

Every agent request must include:

```
X-Agent-Id: {agent_id}
X-Timestamp: {ISO 8601 UTC}
X-Nonce: {random 8-32 char alphanumeric}
X-Idempotency-Key: {UUID v4}  (required on all mutations)
X-Signature: {HMAC-SHA256 hex digest}
```

**Signature computation:**
```
message = "{agent_id}|{timestamp}|{nonce}|{HTTP_METHOD}|{path}|{body_or_empty}"
signature = HMAC-SHA256(agent_secret, message).hexdigest()
```

**Validation rules:**
- Timestamp must be within ±300 seconds of server time
- Nonce must not have been used by this agent in the last 600 seconds
- Signature must match server-side computation
- Agent must have `status: active`

**Error responses:**
- 401 Unauthorized — signature invalid, agent not found, or agent revoked (no detail exposed)
- 409 Conflict — idempotency key already used (returns original cached response)

---

## REST API Endpoints

### Agents

#### `POST /agents/register`
**Auth:** Talent Agent only (role: 'hr')

```json
// Request
{
  "agent_id": "builder",
  "name": "Builder Agent",
  "level": 2,
  "model": "sonnet",
  "role": "worker",
  "capabilities": ["coding", "typescript", "react"]
}

// Response 201
{
  "id": "uuid",
  "agent_id": "builder",
  "signing_secret": "hex-encoded-secret-ONLY-RETURNED-ONCE",
  "created_at": "2026-02-06T00:00:00Z"
}
```

**Note:** `signing_secret` is returned exactly once. It must be stored by the Talent Agent in the new agent's credential directory. It cannot be retrieved again.

#### `GET /agents`
**Auth:** Any active agent

```
GET /agents?status=active&role=worker
```

```json
// Response 200
{
  "data": [
    {
      "id": "uuid",
      "agent_id": "builder",
      "name": "Builder Agent",
      "level": 2,
      "model": "sonnet",
      "status": "active",
      "role": "worker",
      "capabilities": ["coding", "typescript", "react"],
      "created_at": "2026-02-06T00:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 50
}
```

#### `GET /agents/:id`
#### `PATCH /agents/:id` — Talent Agent only
#### `POST /agents/:id/revoke` — Talent Agent only
#### `GET /agents/:id/credits/balance`

---

### Tasks

#### `POST /tasks`
**Auth:** Any active agent (level ≥ 2 or role in [founder, hr])

```json
// Request
{
  "title": "Build landing page",
  "description": "Create a responsive landing page for OpenSpawn...",
  "priority": "high",
  "assignee_agent_id": "builder",
  "tags": ["frontend", "react"],
  "approval_required": true,
  "parent_task_id": null
}

// Response 201
{
  "id": "uuid",
  "identifier": "TASK-1",
  "title": "Build landing page",
  "status": "backlog",
  "priority": "high",
  "assignee": { "agent_id": "builder", "name": "Builder Agent" },
  "creator": { "agent_id": "founder", "name": "Founder Agent" },
  "tags": ["frontend", "react"],
  "approval_required": true,
  "created_at": "2026-02-06T00:00:00Z"
}
```

#### `GET /tasks`

```
GET /tasks?status=todo,in_progress&assignee=builder&priority=high,urgent&tag=frontend&page=1&limit=20
```

#### `GET /tasks/:id`

Returns full task with dependencies, comments, and event history.

#### `POST /tasks/:id/transition`

```json
// Request
{
  "status": "in_progress"
}

// Response 200
{
  "id": "uuid",
  "identifier": "TASK-1",
  "status": "in_progress",
  "previous_status": "todo",
  "transitioned_at": "2026-02-06T01:00:00Z",
  "transitioned_by": "builder"
}

// Error 422 — invalid transition
{
  "error": "Invalid status transition",
  "code": "INVALID_TRANSITION",
  "details": {
    "current_status": "backlog",
    "requested_status": "done",
    "allowed_transitions": ["todo", "cancelled"]
  }
}

// Error 403 — approval required
{
  "error": "Approval required for this transition",
  "code": "APPROVAL_REQUIRED",
  "details": {
    "task_id": "uuid",
    "transition": "review → done",
    "approval_required": true
  }
}

// Error 409 — blocked by dependency
{
  "error": "Task is blocked by unresolved dependencies",
  "code": "BLOCKED_BY_DEPENDENCY",
  "details": {
    "blocking_tasks": [
      { "id": "uuid", "identifier": "TASK-2", "status": "in_progress" }
    ]
  }
}
```

#### `POST /tasks/:id/approve`
**Auth:** Level ≥ 5 or role in [founder, admin]

#### `POST /tasks/:id/assign`

```json
{ "assignee_agent_id": "marketing" }
```

#### `POST /tasks/:id/dependencies`

```json
{ "blocking_task_id": "uuid-of-task-that-must-complete-first" }
```

#### `DELETE /tasks/:id/dependencies/:dependency_id`

#### `POST /tasks/:id/comments`

```json
{
  "body": "Landing page draft is ready for review. See PR #42.",
  "parent_comment_id": null
}
```

#### `GET /tasks/:id/comments`

---

### Credits

#### `GET /credits/balance`

Returns balance for the authenticated agent's org (or specific agent). Reads from materialized `current_balance` on agent record (not computed from ledger).

```
GET /credits/balance?agent_id=builder
```

```json
{
  "org_id": "uuid",
  "agent_id": "builder",
  "balance": 150,
  "budget": {
    "period_limit": 500,
    "period_spent": 87,
    "period_remaining": 413,
    "period_start": "2026-02-01T00:00:00Z"
  },
  "as_of": "2026-02-06T01:00:00Z"
}
```

**Note:** `budget` is `null` if the agent has no `budget_period_limit` set.

#### `POST /credits/spend`

For manual agent-initiated spends. LiteLLM-driven model costs are auto-debited via the spend callback (agents don't call this for LLM usage).

```json
// Request
{
  "amount": 5,
  "reason": "External API call to GitHub for repository analysis",
  "metadata": {
    "service": "github",
    "task_id": "uuid"
  }
}

// Response 200
{
  "transaction_id": "uuid",
  "type": "debit",
  "amount": 5,
  "balance_after": 145,
  "budget_period_remaining": 408,
  "created_at": "2026-02-06T01:00:00Z"
}

// Error 402
{
  "error": "Insufficient credit balance",
  "code": "INSUFFICIENT_BALANCE",
  "details": { "current_balance": 2, "requested_amount": 5 }
}

// Error 429 (budget exceeded)
{
  "error": "Budget period limit exceeded",
  "code": "BUDGET_EXCEEDED",
  "details": { "period_limit": 500, "period_spent": 498, "requested_amount": 5 }
}
```

#### `GET /credits/history`

```
GET /credits/history?agent_id=builder&type=debit&from=2026-02-01&to=2026-02-06&page=1&limit=50&trigger_type=mgmt_fee
```

Filter by `trigger_type` to see management fees, model costs, task earnings, etc.

---

### Messages

#### `POST /messages`

```json
{
  "channel_id": "uuid",
  "type": "handoff",
  "body": "Landing page copy is ready. @marketing please review and add SEO metadata.",
  "metadata": {
    "handoff_to": "marketing",
    "task_id": "uuid"
  }
}
```

#### `GET /messages`

```
GET /messages?channel_id=uuid&since=2026-02-06T00:00:00Z&limit=50
```

#### `GET /channels`

```
GET /channels?type=general,task
```

#### `POST /channels`

---

### Events

#### `GET /events`

```
GET /events?type=task.transitioned&actor_id=builder&entity_type=task&from=2026-02-06T00:00:00Z&limit=100
```

Read-only. Events are created internally by the API on state changes.

---

## MCP Server Tools

The MCP server at port 3102 exposes these tools. Each tool description is optimized for LLM consumption.

### task_list

```json
{
  "name": "task_list",
  "description": "Query tasks in OpenSpawn. Returns tasks filtered by status, assignee, priority, and tags. Use this to find work to pick up or check on task progress.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "status": { "type": "string", "description": "Comma-separated status filter: backlog,todo,in_progress,review,done,blocked,cancelled" },
      "assignee": { "type": "string", "description": "Filter by assignee agent_id" },
      "priority": { "type": "string", "description": "Comma-separated: urgent,high,normal,low" },
      "tag": { "type": "string", "description": "Filter by tag" },
      "limit": { "type": "number", "description": "Max results (default 20)" }
    }
  }
}
```

### task_create

```json
{
  "name": "task_create",
  "description": "Create a new task in OpenSpawn. The task starts in 'backlog' status. Assign it to an agent and set priority and tags for routing.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "title": { "type": "string", "description": "Task title (required)" },
      "description": { "type": "string", "description": "Detailed description in markdown" },
      "priority": { "type": "string", "enum": ["urgent", "high", "normal", "low"] },
      "assignee": { "type": "string", "description": "agent_id to assign to" },
      "tags": { "type": "array", "items": { "type": "string" } },
      "approval_required": { "type": "boolean", "description": "Require human approval before completion" },
      "blocked_by": { "type": "array", "items": { "type": "string" }, "description": "Task IDs this is blocked by" }
    },
    "required": ["title"]
  }
}
```

### task_transition

```json
{
  "name": "task_transition",
  "description": "Move a task to a new status. Valid transitions: backlog→todo, todo→in_progress, in_progress→review, review→done (may need approval). Returns error if transition is invalid or blocked by dependencies.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "task_id": { "type": "string", "description": "Task UUID or identifier (e.g., TASK-42)" },
      "status": { "type": "string", "enum": ["backlog", "todo", "in_progress", "review", "done", "blocked", "cancelled"] }
    },
    "required": ["task_id", "status"]
  }
}
```

### credits_balance

```json
{
  "name": "credits_balance",
  "description": "Check your credit balance. Use before making expensive LLM calls to ensure sufficient budget.",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

### credits_spend

```json
{
  "name": "credits_spend",
  "description": "Deduct credits from your balance. Include a reason and idempotency_key to prevent double-charges on retry.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "amount": { "type": "number", "description": "Credits to deduct (positive integer)" },
      "reason": { "type": "string", "description": "Why credits are being spent" },
      "idempotency_key": { "type": "string", "description": "UUID to prevent duplicate charges" }
    },
    "required": ["amount", "reason", "idempotency_key"]
  }
}
```

### message_send

```json
{
  "name": "message_send",
  "description": "Send a message to a channel. Use type 'handoff' when passing work to another agent, 'request' when asking for help, 'status_update' for progress reports.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "channel": { "type": "string", "description": "Channel name or ID" },
      "body": { "type": "string", "description": "Message content (markdown supported)" },
      "type": { "type": "string", "enum": ["text", "handoff", "status_update", "request"] }
    },
    "required": ["channel", "body"]
  }
}
```

### message_read, agent_whoami, agent_list

Similar patterns — see MCP server source code for full tool definitions.

---

## GraphQL Schema (Dashboard)

Code-first schema generated from NestJS resolvers. Key types:

```graphql
type Query {
  tasks(filter: TaskFilterInput, pagination: PaginationInput): TaskConnection!
  task(id: ID!): Task!
  agents(filter: AgentFilterInput): [Agent!]!
  agent(id: ID!): Agent!
  creditBalance(agentId: ID): CreditBalance!
  creditHistory(filter: CreditFilterInput, pagination: PaginationInput): CreditTransactionConnection!
  events(filter: EventFilterInput, pagination: PaginationInput): EventConnection!
  channels: [Channel!]!
  messages(channelId: ID!, pagination: PaginationInput): MessageConnection!
}

type Mutation {
  approveTask(taskId: ID!): Task!
  updateTaskPriority(taskId: ID!, priority: Priority!): Task!
  adjustCredits(agentId: ID!, amount: Int!, reason: String!): CreditTransaction!
}

type Subscription {
  taskUpdated(orgId: ID!): Task!
  creditTransactionCreated(orgId: ID!): CreditTransaction!
  eventCreated(orgId: ID!, types: [String!]): Event!
  messageCreated(channelId: ID!): Message!
}

type Task {
  id: ID!
  identifier: String!
  title: String!
  description: String
  status: TaskStatus!
  priority: Priority!
  assignee: Agent
  creator: Agent!
  tags: [String!]!
  dependencies: [TaskDependency!]!
  comments: [TaskComment!]!
  approvalRequired: Boolean!
  approvedBy: String
  approvedAt: DateTime
  completedAt: DateTime
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum TaskStatus {
  BACKLOG
  TODO
  IN_PROGRESS
  REVIEW
  DONE
  BLOCKED
  CANCELLED
}

enum Priority {
  URGENT
  HIGH
  NORMAL
  LOW
}

type Agent {
  id: ID!
  agentId: String!
  name: String!
  level: Int!
  model: String!
  status: AgentStatus!
  role: AgentRole!
  capabilities: [String!]!
  creditBalance: Int!
  createdAt: DateTime!
}

type CreditTransaction {
  id: ID!
  agent: Agent!
  type: CreditType!
  amount: Int!
  balanceAfter: Int!
  reason: String!
  triggerEvent: Event
  createdAt: DateTime!
}

type Event {
  id: ID!
  type: String!
  actor: Agent!
  entityType: String!
  entityId: ID!
  data: JSON!
  severity: String!
  reasoning: String
  createdAt: DateTime!
}
```

---

## Rate Limiting (Phase 2)

Per-agent rate limits enforced at the API level:

| Agent Level | Requests/min | Mutations/min |
|-------------|-------------|---------------|
| 1–2 | 60 | 20 |
| 3–4 | 120 | 40 |
| 5–6 | 300 | 100 |
| 7+ | 600 | 200 |

Rate limit headers returned on all responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1707184860
```
