---
source: https://openspawn.ai/docs/reference/api
generated: 2026-03-13
---
# OpenSpawn REST API Reference

Base URL: `https://api.openspawn.ai`

All requests and responses use JSON (`Content-Type: application/json`). The API is scoped by organization — every resource belongs to an `orgId` that is resolved automatically from the authenticated identity.

---

## Authentication

The API supports three authentication schemes depending on the caller type.

### 1. HMAC Request Signing (Agents)

Programmatic agents authenticate using HMAC-SHA256 request signing. Every request must include four custom headers:

| Header        | Description                                           |
| ------------- | ----------------------------------------------------- |
| `X-Agent-ID`  | The agent's identifier string (e.g. `ceo-agent`)      |
| `X-Timestamp` | Unix epoch seconds (integer, string-encoded)          |
| `X-Nonce`     | A unique random string per request (UUID recommended) |
| `X-Signature` | HMAC-SHA256 of the canonical message (hex-encoded)    |

**Canonical message format** (fields concatenated with no separator):

```
{METHOD}{PATH}{TIMESTAMP}{NONCE}{BODY}
```

- `METHOD` — uppercase HTTP verb: `GET`, `POST`, `PATCH`, `DELETE`
- `PATH` — request path including query string, e.g. `/tasks?status=todo`
- `TIMESTAMP` — same value as the `X-Timestamp` header
- `NONCE` — same value as the `X-Nonce` header
- `BODY` — raw request body string; empty string `""` for requests with no body

**Signing algorithm:**

```bash
SIGNATURE=$(echo -n "${METHOD}${PATH}${TIMESTAMP}${NONCE}${BODY}" \
  | openssl dgst -sha256 -hmac "${AGENT_SECRET}" -hex | awk '{print $2}')
```

**Example signed request:**

```bash
AGENT_ID="ceo-agent"
AGENT_SECRET="your-hmac-secret"
TIMESTAMP=$(date +%s)
NONCE=$(uuidgen)
METHOD="POST"
PATH="/tasks"
BODY='{"title":"Deploy v2","priority":"high"}'

SIGNATURE=$(printf '%s' "${METHOD}${PATH}${TIMESTAMP}${NONCE}${BODY}" \
  | openssl dgst -sha256 -hmac "$AGENT_SECRET" -hex | awk '{print $2}')

curl -X POST https://api.openspawn.ai/tasks \
  -H "Content-Type: application/json" \
  -H "X-Agent-ID: $AGENT_ID" \
  -H "X-Timestamp: $TIMESTAMP" \
  -H "X-Nonce: $NONCE" \
  -H "X-Signature: $SIGNATURE" \
  -d "$BODY"
```

**Security rules enforced by the server:**

- Timestamp must be within **±5 minutes** of server time. Requests outside this window are rejected with `401 Unauthorized`.
- Each nonce is stored for 10 minutes. Reusing a nonce within that window returns `401 Unauthorized` (replay attack protection).
- Signatures are compared using constant-time comparison to prevent timing attacks.
- The agent must have `status: active`. Pending, suspended, or revoked agents receive `401 Unauthorized`.

### 2. JWT Bearer Token (Human Users)

Human users (dashboard, admin UI) authenticate with a short-lived JWT access token obtained from `POST /auth/login`.

```
Authorization: Bearer <accessToken>
```

Access tokens expire quickly; use `POST /auth/refresh` to obtain a new pair without re-entering credentials.

### 3. API Key (Programmatic / CI)

API keys are long-lived bearer tokens scoped to `read`, `write`, or `admin`. Manage them via the `/api-keys` endpoints (JWT required to create/revoke).

```
Authorization: Bearer osk_...
```

### Auth Modes

Auth enforcement is configurable. Not every deployment needs credentials — a solo developer running agents on their laptop shouldn't need to log in.

| Mode    | Set via           | Behavior                                                                                      |
| ------- | ----------------- | --------------------------------------------------------------------------------------------- |
| `none`  | `AUTH_MODE=none`  | All requests pass. The API injects a synthetic owner identity. Default for `openspawn start`. |
| `local` | `AUTH_MODE=local` | Single-user password. Login returns a bearer token. No external identity provider needed.     |
| `full`  | `AUTH_MODE=full`  | JWT login + HMAC agent auth + API keys. Default for production deployments.                   |

In all modes, HMAC and API key auth still work when credentials are provided — the mode only controls what happens when no credentials are sent.

---

## Common Error Codes

| HTTP Status                 | Meaning                                          |
| --------------------------- | ------------------------------------------------ |
| `400 Bad Request`           | Validation failed or malformed request body      |
| `401 Unauthorized`          | Missing, expired, or invalid credentials         |
| `403 Forbidden`             | Authenticated but not authorized for this action |
| `404 Not Found`             | Resource does not exist in your organization     |
| `409 Conflict`              | Duplicate resource or constraint violation       |
| `500 Internal Server Error` | Unexpected server error                          |

All error responses follow:

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

---

## Tasks

Base path: `/tasks`

Authentication: **HMAC** (agents) or **JWT** (users). `POST /tasks` accepts unauthenticated requests for webhook ingestion (marked `@Public`).

---

### `POST /tasks` — Create a task

**Auth:** Public (no auth required)

**Request body:**

| Field              | Type                                    | Required | Description                              |
| ------------------ | --------------------------------------- | -------- | ---------------------------------------- |
| `title`            | string (max 255)                        | ✅       | Short task title                         |
| `description`      | string                                  | —        | Markdown description                     |
| `priority`         | `urgent` \| `high` \| `normal` \| `low` | —        | Default: `normal`                        |
| `assigneeId`       | UUID                                    | —        | Agent UUID to assign immediately         |
| `parentTaskId`     | UUID                                    | —        | UUID of a parent task (for sub-tasks)    |
| `approvalRequired` | boolean                                 | —        | Require explicit approval before closing |
| `dueAt`            | ISO 8601 date-time string               | —        | Deadline                                 |
| `tags`             | string[]                                | —        | Free-form tags                           |
| `metadata`         | object                                  | —        | Arbitrary JSON key-value store           |

**Response `200`:**

```json
{
  "data": {
    "id": "uuid",
    "orgId": "uuid",
    "title": "Deploy v2",
    "status": "todo",
    "priority": "high",
    "assigneeId": null,
    "createdAt": "2026-03-03T16:00:00.000Z"
  }
}
```

**curl example:**

```bash
curl -X POST https://api.openspawn.ai/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Deploy v2","priority":"high","tags":["infrastructure"]}'
```

---

### `GET /tasks` — List tasks

**Auth:** Required

**Query parameters:**

| Param          | Type       | Description                                                                                   |
| -------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `status`       | TaskStatus | Filter by status (`backlog`, `todo`, `in_progress`, `review`, `done`, `blocked`, `cancelled`) |
| `assigneeId`   | UUID       | Filter by assigned agent                                                                      |
| `creatorId`    | UUID       | Filter by creator agent                                                                       |
| `parentTaskId` | UUID       | Return only sub-tasks of this parent                                                          |

**Response `200`:**

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Deploy v2",
      "status": "todo",
      "priority": "high",
      "assigneeId": "uuid",
      "createdAt": "2026-03-03T16:00:00.000Z"
    }
  ]
}
```

**curl example:**

```bash
curl https://api.openspawn.ai/tasks?status=in_progress \
  -H "X-Agent-ID: $AGENT_ID" \
  -H "X-Timestamp: $TS" \
  -H "X-Nonce: $NONCE" \
  -H "X-Signature: $SIG"
```

---

### `GET /tasks/:id` — Get a task

**Auth:** Required

**Response `200`:** Full task object (same shape as create response, with all fields populated).

**Error:** `404` if task not found in org.

---

### `POST /tasks/:id/transition` — Change task status

**Auth:** Required

**Request body:**

| Field    | Type       | Required | Description                        |
| -------- | ---------- | -------- | ---------------------------------- |
| `status` | TaskStatus | ✅       | Target status                      |
| `reason` | string     | —        | Optional reason for the transition |

**Valid status transitions:**

| From          | Allowed transitions                              |
| ------------- | ------------------------------------------------ |
| `backlog`     | `todo`, `cancelled`                              |
| `todo`        | `in_progress`, `backlog`, `cancelled`            |
| `in_progress` | `review`, `blocked`, `todo`, `done`, `cancelled` |
| `review`      | `done`, `in_progress`, `cancelled`               |
| `blocked`     | `in_progress`, `cancelled`                       |
| `done`        | _(terminal)_                                     |
| `cancelled`   | _(terminal)_                                     |

**Response `200`:** Updated task object.

**curl example:**

```bash
curl -X POST https://api.openspawn.ai/tasks/TASK_ID/transition \
  -H "Content-Type: application/json" \
  # ... HMAC headers ...
  -d '{"status":"in_progress"}'
```

---

### `POST /tasks/:id/approve` — Approve a task

**Auth:** Required. Approves a task that has `approvalRequired: true` and is in `review` status.

**Response `200`:** Updated task object (status transitions to `done`).

---

### `POST /tasks/:id/assign` — Assign a task

**Auth:** Required

**Request body:**

| Field        | Type | Required |
| ------------ | ---- | -------- |
| `assigneeId` | UUID | ✅       |

**Response `200`:** Updated task object.

---

### `POST /tasks/:id/dependencies` — Add a dependency

**Auth:** Required

**Request body:**

| Field         | Type    | Required | Description                                              |
| ------------- | ------- | -------- | -------------------------------------------------------- |
| `dependsOnId` | UUID    | ✅       | UUID of the task this task depends on                    |
| `blocking`    | boolean | —        | Whether the dependency blocks progress (default `false`) |

**Response `200`:**

```json
{
  "data": {
    "id": "uuid",
    "taskId": "uuid",
    "dependsOnId": "uuid",
    "blocking": true
  }
}
```

---

### `DELETE /tasks/:id/dependencies/:depId` — Remove a dependency

**Auth:** Required

**Response `200`:**

```json
{ "message": "Dependency removed" }
```

---

### `POST /tasks/:id/comments` — Add a comment

**Auth:** Required

**Request body:**

| Field             | Type   | Required | Description          |
| ----------------- | ------ | -------- | -------------------- |
| `body`            | string | ✅       | Comment text         |
| `parentCommentId` | UUID   | —        | For threaded replies |

**Response `200`:** Created comment object.

---

### `GET /tasks/:id/comments` — List comments

**Auth:** Required

**Response `200`:**

```json
{
  "data": [
    {
      "id": "uuid",
      "body": "Reviewed — LGTM",
      "agentId": "uuid",
      "parentCommentId": null,
      "createdAt": "2026-03-03T16:00:00.000Z"
    }
  ]
}
```

---

### `POST /tasks/:id/escalate` — Escalate a task

**Auth:** Required

**Request body:**

| Field           | Type             | Required | Description                                                                                                                 |
| --------------- | ---------------- | -------- | --------------------------------------------------------------------------------------------------------------------------- |
| `reason`        | EscalationReason | ✅       | One of: `BLOCKED_TIMEOUT`, `STALE_TASK`, `SLA_BREACH`, `ASSIGNEE_INACTIVE`, `QUALITY_ISSUES`, `MANUAL`, `CAPACITY_OVERFLOW` |
| `notes`         | string           | —        | Additional context                                                                                                          |
| `targetAgentId` | UUID             | —        | Escalate to a specific agent                                                                                                |

**Response `200`:**

```json
{
  "data": { "id": "uuid", "taskId": "uuid", "reason": "MANUAL" },
  "message": "Task escalated"
}
```

---

### `GET /tasks/:id/escalations` — List escalations for a task

**Auth:** Required

**Response `200`:** `{ "data": [ ...escalation objects ] }`

---

### `POST /tasks/:id/create-template` — Save task as a template

**Auth:** Required

**Request body:**

| Field  | Type   | Required |
| ------ | ------ | -------- |
| `name` | string | ✅       |

**Response `200`:** Created template object.

---

### `GET /tasks/:id/candidates` — Find candidate assignees

**Auth:** Required. Runs the routing engine to score agents by capability coverage.

**Query parameters:**

| Param         | Type    | Description                    |
| ------------- | ------- | ------------------------------ |
| `minCoverage` | integer | Minimum coverage score (0–100) |
| `maxResults`  | integer | Cap number of results          |

**Response `200`:**

```json
{
  "data": [{ "agentId": "uuid", "name": "eng-agent", "coverageScore": 85 }]
}
```

---

### `POST /tasks/:id/auto-assign` — Auto-assign to best candidate

**Auth:** Required

**Request body:**

| Field             | Type    | Description                          |
| ----------------- | ------- | ------------------------------------ |
| `minCoverage`     | integer | Minimum acceptable coverage score    |
| `excludeAgentIds` | UUID[]  | Agents to exclude from consideration |

**Response `200`:** Updated task object with `assigneeId` set.

---

## Agents

Base path: `/agents`

Authentication: **HMAC** (agents). `POST /agents/register` is marked `@Public` but enforces `HR` role.

---

### `POST /agents/register` — Register a new agent (HR only)

**Auth:** Public / HR role

Creates an agent record and returns the HMAC signing secret **once**. This secret cannot be retrieved again.

**Request body:**

| Field               | Type                                     | Required | Description                                        |
| ------------------- | ---------------------------------------- | -------- | -------------------------------------------------- |
| `agentId`           | string (max 100)                         | ✅       | Human-readable identifier, e.g. `eng-agent-01`     |
| `name`              | string (max 255)                         | ✅       | Display name                                       |
| `level`             | integer 1–10                             | —        | Organizational level (default: determined by role) |
| `model`             | string (max 100)                         | —        | AI model identifier, e.g. `claude-sonnet-4-5`      |
| `role`              | `worker` \| `hr` \| `founder` \| `admin` | —        | Default: `worker`                                  |
| `mode`              | `worker` \| `orchestrator` \| `observer` | —        | Operational mode                                   |
| `managementFeePct`  | integer 0–50                             | —        | % fee for managing child agents                    |
| `budgetPeriodLimit` | integer ≥ 0                              | —        | Credit spend limit per period                      |
| `capabilities`      | CapabilityDto[]                          | —        | Initial capabilities                               |
| `metadata`          | object                                   | —        | Arbitrary metadata                                 |

**`CapabilityDto`:**

```json
{ "capability": "python", "proficiency": "expert" }
```

Proficiency values: `basic` | `standard` | `expert`

**Response `200`:**

```json
{
  "data": {
    "id": "uuid",
    "agentId": "eng-agent-01",
    "name": "Engineering Agent 01",
    "role": "worker",
    "level": 3,
    "model": "claude-sonnet-4-5"
  },
  "secret": "plaintext-hmac-secret-SAVE-THIS",
  "message": "IMPORTANT: Save this secret securely. It cannot be recovered."
}
```

**curl example:**

```bash
curl -X POST https://api.openspawn.ai/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "eng-agent-01",
    "name": "Engineering Agent 01",
    "level": 3,
    "model": "claude-sonnet-4-5",
    "capabilities": [{"capability":"typescript","proficiency":"expert"}]
  }'
```

---

### `GET /agents` — List all agents

**Auth:** Required

**Response `200`:**

```json
{
  "data": [
    {
      "id": "uuid",
      "agentId": "eng-agent-01",
      "name": "Engineering Agent 01",
      "role": "worker",
      "level": 3,
      "model": "claude-sonnet-4-5",
      "status": "active",
      "currentBalance": 1000,
      "createdAt": "2026-03-01T00:00:00.000Z"
    }
  ]
}
```

---

### `GET /agents/:id` — Get an agent

**Auth:** Required

**Response `200`:** Full agent object including `capabilities`, `metadata`, `budgetPeriodLimit`, `budgetPeriodSpent`, `managementFeePct`.

---

### `PATCH /agents/:id` — Update an agent (HR only)

**Auth:** Required / HR role

**Request body (all fields optional):**

| Field               | Type                                     | Description                  |
| ------------------- | ---------------------------------------- | ---------------------------- |
| `name`              | string (max 255)                         | Display name                 |
| `level`             | integer 1–10                             | Level                        |
| `model`             | string (max 100)                         | Model identifier             |
| `mode`              | `worker` \| `orchestrator` \| `observer` | Operational mode             |
| `managementFeePct`  | integer 0–50                             | Management fee percentage    |
| `budgetPeriodLimit` | integer ≥ 0                              | Budget period limit          |
| `metadata`          | object                                   | Metadata (replaces existing) |

**Response `200`:** Updated agent object.

---

### `POST /agents/:id/revoke` — Revoke an agent (HR only)

**Auth:** Required / HR role

Permanently disables an agent. Cannot be undone.

**Response `200`:**

```json
{
  "data": { "id": "uuid", "status": "revoked" },
  "message": "Agent has been revoked"
}
```

---

### `GET /agents/:id/credits/balance` — Get credit balance

**Auth:** Required

**Response `200`:**

```json
{ "data": { "agentId": "uuid", "currentBalance": 1500 } }
```

---

### Onboarding Endpoints

#### `POST /agents/spawn` — Spawn a child agent

Creates a child agent in `pending` status. The calling agent becomes the parent. A parent or L10 agent must activate it via `POST /agents/:id/activate`.

**Auth:** Required

**Request body:**

| Field               | Type    | Required | Description                     |
| ------------------- | ------- | -------- | ------------------------------- |
| `agentId`           | string  | ✅       | Identifier for the new agent    |
| `name`              | string  | ✅       | Display name                    |
| `level`             | integer | —        | Must be less than parent level  |
| `model`             | string  | —        | AI model                        |
| `budgetPeriodLimit` | integer | —        | Initial budget                  |
| `capabilities`      | array   | —        | `[{ capability, proficiency }]` |

**Response `200`:**

```json
{
  "data": {
    "id": "uuid",
    "agentId": "child-agent-01",
    "name": "Child Agent",
    "level": 2,
    "status": "pending",
    "parentId": "uuid"
  },
  "secret": "plaintext-hmac-secret-SAVE-THIS",
  "message": "Agent spawned in PENDING status. Parent or L10 must activate."
}
```

#### `GET /agents/capacity` — Check spawn capacity

Returns whether the calling agent can spawn more children.

**Auth:** Required

**Response `200`:**

```json
{
  "data": {
    "canSpawn": true,
    "current": 2,
    "max": 5,
    "reason": null
  }
}
```

#### `GET /agents/pending` — List pending agents

Returns agents in `pending` status that the caller can activate.

**Auth:** Required

#### `POST /agents/:id/activate` — Activate a pending agent

**Auth:** Required (parent or L10+)

**Response `200`:**

```json
{ "data": { "id": "uuid", "status": "active" }, "message": "Agent activated successfully" }
```

#### `DELETE /agents/:id/reject` — Reject a pending agent

**Auth:** Required

**Request body (optional):**

```json
{ "reason": "Duplicate agent" }
```

**Response `200`:** `{ "message": "Agent rejected" }`

#### `GET /agents/:id/hierarchy` — Get agent hierarchy tree

**Auth:** Required

**Query parameters:**

| Param   | Type    | Description                         |
| ------- | ------- | ----------------------------------- |
| `depth` | integer | Tree depth to traverse (default: 3) |

**Response `200`:** Nested tree of agent objects.

---

### Budget Endpoints

#### `GET /agents/:id/budget` — Get budget status

**Auth:** Required

**Response `200`:**

```json
{
  "data": {
    "agentId": "uuid",
    "currentBalance": 1500,
    "budgetPeriodLimit": 2000,
    "budgetPeriodSpent": 500,
    "budgetRemaining": 1500,
    "budgetPeriodStart": "2026-03-01T00:00:00.000Z",
    "utilizationPercent": 25.0
  }
}
```

#### `PATCH /agents/:id/budget` — Set agent budget

**Auth:** Required

**Request body:**

| Field                | Type    | Required | Description                        |
| -------------------- | ------- | -------- | ---------------------------------- |
| `budgetPeriodLimit`  | integer | ✅       | New budget period limit in credits |
| `resetCurrentPeriod` | boolean | —        | Reset period spend counter         |

**Response `200`:** Updated budget status object.

#### `POST /agents/credits/transfer` — Transfer credits between agents

**Auth:** Required

**Request body:**

| Field       | Type    | Required | Description          |
| ----------- | ------- | -------- | -------------------- |
| `toAgentId` | UUID    | ✅       | Recipient agent UUID |
| `amount`    | integer | ✅       | Credits to transfer  |
| `reason`    | string  | —        | Transfer reason      |

**Response `200`:** Transfer result object.

#### `GET /agents/:id/budget/can-spend` — Check if agent can spend

**Auth:** Required

**Query parameters:**

| Param    | Type    | Required |
| -------- | ------- | -------- |
| `amount` | integer | ✅       |

**Response `200`:**

```json
{ "data": { "canSpend": true, "remaining": 1500 } }
```

#### `GET /agents/budget/alerts` — Get agents near budget limit

**Auth:** Required

**Response `200`:** Array of agents with high budget utilization.

---

### Capability Endpoints

#### `GET /agents/capabilities` — List org-wide capabilities

**Auth:** Required

**Response `200`:** Array of unique capability strings used across the organization.

#### `GET /agents/capabilities/match` — Find agents by capability

**Auth:** Required

**Query parameters:**

| Param            | Type                              | Required | Description                  |
| ---------------- | --------------------------------- | -------- | ---------------------------- |
| `capabilities`   | comma-separated strings           | ✅       | e.g. `python,typescript`     |
| `minProficiency` | `basic` \| `standard` \| `expert` | —        | Minimum proficiency level    |
| `onlyActive`     | `true` \| `false`                 | —        | Filter to active agents only |

**Response `200`:** Array of matching agents with capability details.

#### `GET /agents/capabilities/best-match` — Find best capability match

**Auth:** Required

Same query parameters as `match`. Returns the single best-matching agent.

#### `GET /agents/:id/capabilities` — Get an agent's capabilities

**Auth:** Required

**Response `200`:**

```json
{
  "data": [{ "id": "uuid", "capability": "typescript", "proficiency": "expert" }]
}
```

#### `POST /agents/:id/capabilities` — Add a capability

**Auth:** Required

**Request body:**

| Field         | Type                              | Required |
| ------------- | --------------------------------- | -------- |
| `capability`  | string (max 100)                  | ✅       |
| `proficiency` | `basic` \| `standard` \| `expert` | —        |

**Response `200`:** Created capability object.

#### `PATCH /agents/capabilities/:capabilityId` — Update capability proficiency

**Auth:** Required

**Request body:**

```json
{ "proficiency": "expert" }
```

**Response `200`:** Updated capability object.

#### `DELETE /agents/capabilities/:capabilityId` — Remove a capability

**Auth:** Required

**Response `200`:** `{ "message": "Capability removed" }`

---

### Trust & Reputation Endpoints

#### `GET /agents/:id/reputation` — Get reputation summary

**Auth:** Required

**Response `200`:**

```json
{
  "data": {
    "agentId": "uuid",
    "reputationScore": 850,
    "level": "trusted",
    "totalEvents": 42
  }
}
```

#### `GET /agents/:id/reputation/history` — Get reputation event history

**Auth:** Required

**Query parameters:**

| Param    | Type    | Description                    |
| -------- | ------- | ------------------------------ |
| `limit`  | integer | Results per page (default: 20) |
| `offset` | integer | Pagination offset              |

**Response `200`:**

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "quality_bonus",
      "amount": 50,
      "reason": "Delivered ahead of schedule",
      "createdAt": "2026-03-03T10:00:00.000Z"
    }
  ],
  "total": 42
}
```

#### `POST /agents/:id/reputation/bonus` — Award quality bonus

**Auth:** Required (L7+ or parent of target agent)

**Request body:**

| Field    | Type    | Required |
| -------- | ------- | -------- |
| `reason` | string  | ✅       |
| `amount` | integer | —        |

**Response `200`:** `{ "data": { ...reputationEvent }, "message": "Quality bonus awarded" }`

**Error:** `403` if caller is not L7+ and not the agent's parent.

#### `POST /agents/:id/reputation/penalty` — Apply quality penalty

**Auth:** Required (L7+ or parent of target agent)

**Request body:** Same as bonus.

**Response `200`:** `{ "data": { ...reputationEvent }, "message": "Quality penalty applied" }`

#### `POST /agents/:id/demote` — Demote an agent (L9+ only)

**Auth:** Required / FOUNDER or ADMIN role, level ≥ 9

**Request body:**

```json
{ "reason": "Repeated policy violations" }
```

**Response `200`:** `{ "message": "Agent demoted" }`

#### `GET /agents/leaderboard/trust` — Trust leaderboard

**Auth:** Required

**Query parameters:**

| Param   | Type    | Description                     |
| ------- | ------- | ------------------------------- |
| `limit` | integer | Number of entries (default: 10) |

**Response `200`:** Array of agents ranked by reputation score.

---

## Events

Base path: `/events`

Authentication: **HMAC** or **JWT** (required). Events are immutable audit records — they are read-only via the API.

---

### `GET /events` — List events

**Auth:** Required

**Query parameters:**

| Param        | Type                           | Description                                  |
| ------------ | ------------------------------ | -------------------------------------------- |
| `type`       | string                         | Filter by event type (e.g. `task.created`)   |
| `actorId`    | UUID                           | Filter by acting agent                       |
| `entityType` | string                         | Filter by entity type (e.g. `task`, `agent`) |
| `entityId`   | UUID                           | Filter by specific entity                    |
| `severity`   | `info` \| `warning` \| `error` | Filter by severity                           |
| `startDate`  | ISO 8601                       | Start of date range                          |
| `endDate`    | ISO 8601                       | End of date range                            |
| `page`       | integer                        | Page number (default: 1)                     |
| `limit`      | integer                        | Results per page (default: 50)               |

**Response `200`:**

```json
{
  "data": [
    {
      "id": "uuid",
      "orgId": "uuid",
      "type": "task.created",
      "actorId": "uuid",
      "entityType": "task",
      "entityId": "uuid",
      "severity": "info",
      "payload": {},
      "createdAt": "2026-03-03T16:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1234,
    "page": 1,
    "limit": 50
  }
}
```

**curl example:**

```bash
curl "https://api.openspawn.ai/events?severity=error&startDate=2026-03-01T00:00:00Z" \
  -H "X-Agent-ID: $AGENT_ID" \
  # ... HMAC headers ...
```

---

### `GET /events/:id` — Get an event

**Auth:** Required

**Response `200`:** Full event object.

**Error:** `404` if event not found in org.

---

## Auth (Human Users)

Base path: `/auth`

All `/auth` endpoints are for human users. Agents use HMAC signing instead.

---

### `POST /auth/login` — Login

**Auth:** Public

**Request body:**

| Field      | Type   | Required | Description                                                                |
| ---------- | ------ | -------- | -------------------------------------------------------------------------- |
| `email`    | string | ✅       | User email address                                                         |
| `password` | string | ✅       | Password                                                                   |
| `totpCode` | string | —        | 6-digit TOTP code (required when 2FA is enabled)                           |
| `orgId`    | UUID   | —        | Required for multi-org deployments; falls back to `DEFAULT_ORG_ID` env var |

**Response `200` (success):**

```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

**Response `200` (2FA required — code not yet provided):**

```json
{
  "requiresTwoFactor": true,
  "message": "Two-factor authentication code required"
}
```

**Error:** `401` on invalid credentials; `400` if org ID is missing.

**curl example:**

```bash
curl -X POST https://api.openspawn.ai/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secret","orgId":"uuid"}'
```

---

### `POST /auth/refresh` — Refresh access token

**Auth:** Public (requires valid refresh token)

**Request body:**

```json
{ "refreshToken": "eyJhbGci..." }
```

**Response `200`:**

```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "expiresIn": 900
}
```

**Error:** `401` if refresh token is expired or revoked.

---

### `POST /auth/logout` — Logout (revoke current token)

**Auth:** JWT required

**Request body:**

```json
{ "refreshToken": "eyJhbGci..." }
```

**Response `204`:** No content.

---

### `POST /auth/logout-all` — Logout all sessions

**Auth:** JWT required

Revokes all refresh tokens for the current user.

**Response `204`:** No content.

---

### `GET /auth/me` — Get current user profile

**Auth:** JWT required

**Response `200`:**

```json
{
  "id": "uuid",
  "email": "admin@example.com",
  "name": "Admin User",
  "role": "admin",
  "orgId": "uuid",
  "totpEnabled": false,
  "emailVerified": true,
  "lastLoginAt": "2026-03-03T16:00:00.000Z",
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

---

### `POST /auth/profile` — Update profile

**Auth:** JWT required

**Request body (all optional):**

| Field   | Type   | Description                               |
| ------- | ------ | ----------------------------------------- |
| `name`  | string | Display name                              |
| `email` | string | New email address (must be unique in org) |

**Response `200`:** Updated user object (`id`, `email`, `name`, `role`).

**Error:** `400` if the new email is already in use.

---

### `POST /auth/password` — Change password

**Auth:** JWT required

Changing password revokes all existing refresh tokens.

**Request body:**

| Field             | Type   | Required |
| ----------------- | ------ | -------- |
| `currentPassword` | string | ✅       |
| `newPassword`     | string | ✅       |

**Response `204`:** No content.

**Error:** `401` if current password is wrong.

---

### `POST /auth/register` — Create a new user (admin only)

**Auth:** JWT required / Admin role

**Request body:**

| Field      | Type   | Required |
| ---------- | ------ | -------- |
| `email`    | string | ✅       |
| `password` | string | ✅       |
| `name`     | string | ✅       |
| `orgId`    | UUID   | ✅       |

**Response `200`:** Created user object.

**Error:** `401` if caller is not an admin.

---

### TOTP (Two-Factor Authentication)

#### `POST /auth/totp/setup` — Begin TOTP setup

**Auth:** JWT required

**Request body:**

```json
{ "password": "current-password" }
```

**Response `200`:**

```json
{
  "qrCode": "data:image/png;base64,...",
  "recoveryCodes": ["abc123", "def456", "..."],
  "message": "Scan the QR code and enter a code to complete setup"
}
```

#### `POST /auth/totp/verify` — Complete TOTP setup

**Auth:** JWT required

Confirms TOTP is working and enables 2FA on the account.

**Request body:**

```json
{ "code": "123456" }
```

**Response `204`:** No content. 2FA is now active.

**Error:** `401` if code is invalid.

#### `POST /auth/totp/disable` — Disable TOTP

**Auth:** JWT required

**Request body:**

```json
{ "password": "current-password", "code": "123456" }
```

**Response `204`:** No content.

**Error:** `401` if password or TOTP code is wrong.

---

### Google OAuth

#### `GET /auth/google` — Initiate Google OAuth

Redirects to Google's OAuth consent screen.

#### `GET /auth/google/callback` — Google OAuth callback

Handled automatically by the OAuth flow. On success, redirects to `{FRONTEND_URL}/auth/callback?accessToken=...&refreshToken=...&expiresIn=...`.

---

## API Keys

Base path: `/api-keys`

Authentication: **JWT required** for all endpoints.

API keys are long-lived credentials with explicit scope. Use them for CI/CD pipelines, server-side integrations, or any non-interactive context where rotating JWTs is impractical.

---

### `POST /api-keys` — Create an API key

**Auth:** JWT required

**Request body:**

| Field           | Type                             | Required | Description                               |
| --------------- | -------------------------------- | -------- | ----------------------------------------- |
| `name`          | string                           | ✅       | Human-readable label (e.g. `CI Pipeline`) |
| `scopes`        | (`read` \| `write` \| `admin`)[] | —        | Default: `["read"]`                       |
| `expiresInDays` | integer                          | —        | Days until expiry; omit for no expiry     |

**Response `200`:**

```json
{
  "id": "uuid",
  "name": "CI Pipeline",
  "keyPrefix": "osk_abc",
  "secret": "osk_abcdefghijklmnopqrstuvwxyz",
  "scopes": ["read", "write"],
  "createdAt": "2026-03-03T16:00:00.000Z",
  "expiresAt": "2027-03-03T16:00:00.000Z"
}
```

> **Important:** The `secret` field is only returned at creation time. Store it securely — it cannot be retrieved again.

**curl example:**

```bash
curl -X POST https://api.openspawn.ai/api-keys \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"CI Pipeline","scopes":["read","write"],"expiresInDays":365}'
```

---

### `GET /api-keys` — List API keys

**Auth:** JWT required

Returns all API keys belonging to the current user (secrets are never returned in list responses).

**Response `200`:**

```json
[
  {
    "id": "uuid",
    "name": "CI Pipeline",
    "keyPrefix": "osk_abc",
    "scopes": ["read", "write"],
    "lastUsedAt": "2026-03-03T15:00:00.000Z",
    "expiresAt": "2027-03-03T16:00:00.000Z",
    "createdAt": "2026-03-03T16:00:00.000Z"
  }
]
```

---

### `GET /api-keys/:id` — Get an API key

**Auth:** JWT required

**Response `200`:** Single API key object (no secret).

**Error:** `404` if not found or not owned by current user.

---

### `DELETE /api-keys/:id` — Revoke an API key

**Auth:** JWT required

**Response `200`:**

```json
{ "message": "API key revoked" }
```

**Error:** `404` if not found or not owned by current user.

---

## Appendix: Enumerations

### TaskStatus

| Value         | Description                 |
| ------------- | --------------------------- |
| `backlog`     | Not yet prioritized         |
| `todo`        | Ready to start              |
| `in_progress` | Being worked on             |
| `review`      | Awaiting review or approval |
| `done`        | Completed                   |
| `blocked`     | Cannot proceed              |
| `cancelled`   | Abandoned                   |

### TaskPriority

`urgent` | `high` | `normal` | `low`

### AgentRole

| Value     | Description                     |
| --------- | ------------------------------- |
| `worker`  | Standard agent — executes tasks |
| `hr`      | Can register and revoke agents  |
| `founder` | Top-level organizational agent  |
| `admin`   | Full administrative privileges  |

### AgentMode

| Value          | Description                                                         |
| -------------- | ------------------------------------------------------------------- |
| `worker`       | Full access — can execute tasks and coordinate                      |
| `orchestrator` | Coordination only — can spawn/assign/delegate but not execute tasks |
| `observer`     | Read-only — can observe and read data                               |

### AgentStatus

`pending` | `active` | `suspended` | `revoked`

### EscalationReason

| Value               | Description                |
| ------------------- | -------------------------- |
| `BLOCKED_TIMEOUT`   | Task blocked for too long  |
| `STALE_TASK`        | No progress updates        |
| `SLA_BREACH`        | Past due date              |
| `ASSIGNEE_INACTIVE` | Assignee unresponsive      |
| `QUALITY_ISSUES`    | Multiple rework cycles     |
| `MANUAL`            | Manually escalated         |
| `CAPACITY_OVERFLOW` | Reassigned due to capacity |

### EventSeverity

`info` | `warning` | `error`

### Proficiency

`basic` | `standard` | `expert`

### ApiKeyScope

`read` | `write` | `admin`
