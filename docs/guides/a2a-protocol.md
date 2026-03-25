# A2A Protocol Guide

OpenSpawn uses the **Agent2Agent (A2A) protocol** for inter-agent communication. This guide covers everything you need to know to get agents talking to each other.

## What is A2A?

[A2A (Agent2Agent)](https://a2a-protocol.org) is an open protocol (v1.0) developed under the Linux Foundation for standardized agent-to-agent communication. It defines how agents discover each other, exchange messages, and track task lifecycle — all over JSON-RPC 2.0.

Key properties:
- **Framework agnostic** — works with any agent runtime (OpenClaw, LangChain, CrewAI, etc.)
- **Transport agnostic** — JSON-RPC over HTTP, with optional SSE streaming
- **Discovery built-in** — agents publish capabilities via AgentCards at well-known URLs

## Why OpenSpawn Uses A2A

OpenSpawn coordinates multiple AI agents. Before A2A, we used a custom REST API. A2A gives us:

1. **Standard protocol** — any A2A-compliant agent can join the network
2. **Rich task lifecycle** — submitted → working → completed/failed/canceled with proper state tracking
3. **Structured messages** — typed parts (text, file, data) instead of raw strings
4. **Agent discovery** — agents describe their capabilities so others know what to ask for
5. **Push notifications** — senders get notified when tasks complete, with HMAC-signed webhooks

## Architecture

```
┌─────────────────────┐                            ┌─────────────────────┐
│   Agent A (Dennis)  │                            │  Agent B (Drinkify) │
│     OpenClaw        │                            │     OpenClaw        │
└────────┬────────────┘                            └────────────┬────────┘
         │                                                      │
         │  POST /a2a/jsonrpc                                   │
         │  method: "message/send"                              │
         │                                                      │
         ▼                                                      │
┌─────────────────────────────────────────────────────────────┐ │
│                  OpenSpawn A2A Router                        │ │
│                  http://127.0.0.1:3380                       │ │
│                                                             │ │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌───────────┐  │ │
│  │ Discovery│  │ JSON-RPC │  │ REST API  │  │  SQLite   │  │ │
│  │ /.well-  │  │ /a2a/    │  │ /a2a/     │  │  Store    │  │ │
│  │ known/   │  │ jsonrpc  │  │ agents/   │  │           │  │ │
│  └─────────┘  └──────────┘  └───────────┘  └───────────┘  │ │
└─────────────────────────────┬───────────────────────────────┘ │
                              │                                 │
                              │  Webhook delivery               │
                              │  POST /hooks/ingest             │
                              └─────────────────────────────────┘
```

## Quick Start

Get two agents communicating in 5 steps. See the [A2A Quick Start](./a2a-quickstart.md) for a complete walkthrough.

### 1. Start the Router

```bash
cd tools/a2a-router && npx tsx src/index.ts
```

The router starts on `http://127.0.0.1:3380` by default.

### 2. Register Agents

```bash
# Register sender
curl -s -X POST http://127.0.0.1:3380/a2a/agents \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "dennis",
    "name": "Dennis",
    "gateway_url": "http://127.0.0.1:3381",
    "skills": ["coding", "devops"]
  }'

# Register target
curl -s -X POST http://127.0.0.1:3380/a2a/agents \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "drinkify",
    "name": "Drinkify",
    "gateway_url": "http://127.0.0.1:3382",
    "skills": ["drinks", "inventory"]
  }'
```

### 3. Install the a2a-reporter Skill

The target agent needs the `a2a-reporter` skill so it knows how to report task completion. Install it on the target agent's OpenClaw instance:

```bash
# Copy skills/a2a-reporter/ to the target agent's skills directory
cp -r skills/a2a-reporter/ ~/.openclaw/workspace/skills/a2a-reporter/
```

### 4. Send a Message

```bash
openspawn a2a send drinkify "What are you working on?"
```

Or via the CLI with async mode:

```bash
openspawn a2a send drinkify "Deploy staging" --async
```

### 5. Check Task Status

```bash
openspawn a2a task <task-id>
```

---

## JSON-RPC API Reference

All JSON-RPC methods use `POST /a2a/jsonrpc` with standard JSON-RPC 2.0 envelopes.

### `message/send`

Send a message to an agent, creating a new task.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "message/send",
  "params": {
    "agentId": "drinkify",
    "senderId": "dennis",
    "message": {
      "kind": "message",
      "messageId": "msg-001",
      "role": "user",
      "parts": [
        { "kind": "text", "text": "What are you working on?" }
      ]
    },
    "contextId": "optional-conversation-id"
  }
}
```

**Response (success):**
```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "result": {
    "id": "task-uuid",
    "contextId": "optional-conversation-id",
    "status": {
      "state": "working",
      "timestamp": "2026-03-25T12:00:00.000Z"
    },
    "messages": [
      {
        "kind": "message",
        "messageId": "msg-001",
        "role": "user",
        "parts": [{ "kind": "text", "text": "What are you working on?" }]
      }
    ]
  }
}
```

**Error — agent not found:**
```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "error": {
    "code": -32002,
    "message": "Agent not found",
    "data": { "agentId": "unknown-agent" }
  }
}
```

### `tasks/get`

Retrieve a task by ID.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": "2",
  "method": "tasks/get",
  "params": {
    "taskId": "task-uuid"
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": "2",
  "result": {
    "id": "task-uuid",
    "status": {
      "state": "completed",
      "message": "Done",
      "timestamp": "2026-03-25T12:05:00.000Z"
    },
    "messages": [...],
    "artifacts": [
      {
        "parts": [{ "kind": "text", "text": "Here's what I found..." }],
        "name": "result"
      }
    ]
  }
}
```

**Error — task not found:**
```json
{
  "jsonrpc": "2.0",
  "id": "2",
  "error": {
    "code": -32001,
    "message": "Task not found",
    "data": { "taskId": "nonexistent" }
  }
}
```

### `tasks/list`

List tasks with optional filters and pagination.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": "3",
  "method": "tasks/list",
  "params": {
    "agentId": "drinkify",
    "status": "completed",
    "contextId": "optional-filter",
    "limit": 10,
    "offset": 0
  }
}
```

All params are optional. Defaults: `limit=50`, `offset=0`.

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": "3",
  "result": {
    "tasks": [...],
    "total": 42,
    "limit": 10,
    "offset": 0
  }
}
```

### `tasks/cancel`

Cancel a task that is not yet in a terminal state.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": "4",
  "method": "tasks/cancel",
  "params": {
    "taskId": "task-uuid"
  }
}
```

**Response (success):**
```json
{
  "jsonrpc": "2.0",
  "id": "4",
  "result": {
    "id": "task-uuid",
    "status": {
      "state": "canceled",
      "timestamp": "2026-03-25T12:10:00.000Z"
    },
    "messages": [...]
  }
}
```

**Error — task in terminal state:**
```json
{
  "jsonrpc": "2.0",
  "id": "4",
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": { "reason": "Task 'task-uuid' is in state 'completed' and cannot be canceled" }
  }
}
```

### JSON-RPC Error Codes

| Code | Name | Description |
|------|------|-------------|
| `-32700` | Parse error | Invalid JSON |
| `-32600` | Invalid Request | Missing jsonrpc version or id |
| `-32601` | Method not found | Unknown method name |
| `-32602` | Invalid params | Missing or invalid parameters |
| `-32603` | Internal error | Server-side error |
| `-32001` | Task not found | Referenced task doesn't exist |
| `-32002` | Agent not found | Referenced agent not registered |

---

## REST API Reference (Backward Compatibility)

The REST API predates the JSON-RPC endpoint. Both work; JSON-RPC is preferred for new integrations.

### Agents

| Method | Path | Description |
|--------|------|-------------|
| `POST /a2a/agents` | Register an agent | Body: `{ agentId, name, gateway_url, skills?, gateway_token?, hook_path? }` |
| `GET /a2a/agents` | List all agents | Returns array of agent objects |
| `GET /a2a/agents/:id` | Get agent by ID | Returns agent or 404 |

**Register agent:**
```bash
curl -s -X POST http://127.0.0.1:3380/a2a/agents \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "dennis",
    "name": "Dennis",
    "gateway_url": "http://127.0.0.1:3381",
    "gateway_token": "optional-secret",
    "hook_path": "/hooks/ingest",
    "skills": ["coding", "devops"]
  }'
```

### Messages

| Method | Path | Description |
|--------|------|-------------|
| `POST /a2a/message/send` | Send a message (creates task) | Body: `{ agentId, senderId, message }` |

```bash
curl -s -X POST http://127.0.0.1:3380/a2a/message/send \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "drinkify",
    "senderId": "dennis",
    "message": "What are you working on?"
  }'
```

### Tasks

| Method | Path | Description |
|--------|------|-------------|
| `GET /a2a/tasks` | List tasks | Optional query: `?agentId=<id>` |
| `GET /a2a/tasks/:id` | Get task by ID | Returns task or 404 |
| `POST /a2a/tasks/:id/complete` | Report completion | Body: `{ agentId, status, result }` |

**Complete a task:**
```bash
curl -s -X POST http://127.0.0.1:3380/a2a/tasks/<task-id>/complete \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "drinkify",
    "status": "completed",
    "result": "Staging deployed successfully"
  }'
```

### Health Check

```bash
curl http://127.0.0.1:3380/health
# → { "status": "ok", "service": "a2a-router", "version": "0.2.0" }
```

---

## Agent Discovery

A2A uses well-known URLs for agent discovery.

### Platform-Level Discovery

```
GET /.well-known/agent.json
```

Returns the router's AgentCard describing the platform's capabilities:

```json
{
  "name": "OpenSpawn A2A Router",
  "description": "Multi-agent coordination router for OpenSpawn",
  "protocolVersion": "1.0.0",
  "version": "0.2.0",
  "url": "http://127.0.0.1:3380/a2a/jsonrpc",
  "skills": [
    { "id": "routing", "name": "Agent Routing", "description": "Route messages between registered agents" },
    { "id": "task-management", "name": "Task Management", "description": "Track task lifecycle across agents" }
  ],
  "capabilities": { "pushNotifications": false, "streaming": false },
  "defaultInputModes": ["text"],
  "defaultOutputModes": ["text"]
}
```

### Per-Agent Discovery

```
GET /a2a/agents/:id/card
```

Returns an individual agent's AgentCard:

```json
{
  "name": "Drinkify",
  "description": "Agent drinkify registered with OpenSpawn",
  "protocolVersion": "1.0.0",
  "version": "1.0.0",
  "url": "http://127.0.0.1:3380/a2a/agents/drinkify/jsonrpc",
  "skills": [
    { "id": "drinks", "name": "Drinks" },
    { "id": "inventory", "name": "Inventory" }
  ],
  "capabilities": { "pushNotifications": false, "streaming": false },
  "defaultInputModes": ["text"],
  "defaultOutputModes": ["text"]
}
```

---

## AgentCard Schema

The AgentCard is the A2A discovery document. Full schema:

```typescript
interface AgentCard {
  name: string;                      // Human-readable agent name
  description: string;               // What the agent does
  protocolVersion: "1.0.0";          // A2A protocol version
  version: string;                   // Agent/router version
  url: string;                       // JSON-RPC endpoint URL
  skills: AgentSkill[];              // What the agent can do
  capabilities: AgentCapabilities;   // Protocol features supported
  defaultInputModes: string[];       // e.g. ["text", "file"]
  defaultOutputModes: string[];      // e.g. ["text"]
  authentication?: AuthenticationInfo;
  additionalInterfaces?: AdditionalInterface[];
}

interface AgentSkill {
  id: string;                        // Unique skill identifier
  name: string;                      // Human-readable name
  description?: string;              // What this skill does
  tags?: string[];                   // Searchable tags
}

interface AgentCapabilities {
  pushNotifications: boolean;        // Can receive push notifications
  streaming: boolean;                // Supports SSE streaming
}
```

---

## Task Lifecycle

Tasks follow a strict state machine:

```
                    ┌──────────────┐
                    │  submitted   │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
              ┌─────│   working    │─────┐
              │     └──────┬───────┘     │
              │            │             │
       ┌──────▼──────┐    │    ┌────────▼────────┐
       │   canceled   │    │    │     failed      │
       └─────────────┘    │    └─────────────────┘
                   ┌──────▼───────┐
                   │  completed   │
                   └──────────────┘
```

| State | Description |
|-------|-------------|
| `submitted` | Task created, pending delivery to target agent |
| `working` | Target agent received the task and is processing |
| `input-required` | Target agent needs more info from sender |
| `completed` | Task finished successfully |
| `failed` | Task failed |
| `canceled` | Task canceled before completion |

**Terminal states:** `completed`, `failed`, `canceled` — no further transitions allowed.

---

## Push Notifications

When a task reaches a terminal state (`completed` or `failed`), the router notifies the sender agent via webhook.

### How It Works

1. Task completes → router builds a result payload
2. Router POSTs to `{sender.gateway_url}{sender.hook_path}` (default: `/hooks/ingest`)
3. If the sender has a `gateway_token`, the request includes:
   - `Authorization: Bearer <token>`
   - `X-A2A-Signature: sha256=<hmac>`

### HMAC Signing

The signature is computed as:
```
HMAC-SHA256(gateway_token, JSON.stringify(payload))
```

Verify on the receiving end:
```typescript
import { createHmac } from "crypto";
const expected = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
if (signature !== expected) reject();
```

### Retry Policy

| Attempt | Delay |
|---------|-------|
| 1st | Immediate |
| 2nd | 1 second |
| 3rd | 5 seconds |
| 4th (final) | 15 seconds |

After 3 retries, the notification is marked as failed. Task status is unaffected — the task is still completed/failed regardless of notification delivery.

Notification attempts are logged in the SQLite store for debugging.

---

## a2a-reporter Skill

The `a2a-reporter` skill teaches agents how to report task completion back to the router.

### How It Works

1. When an agent receives a message containing `[a2a:task:<uuid>]`, it knows this is an A2A task
2. The agent processes the request normally
3. On completion, the agent calls:

```bash
curl -s -X POST http://127.0.0.1:3380/a2a/tasks/<task-id>/complete \
  -H "Content-Type: application/json" \
  -d '{"agentId":"YOUR_AGENT_ID","status":"completed","result":"Summary of what happened"}'
```

4. On failure:

```bash
curl -s -X POST http://127.0.0.1:3380/a2a/tasks/<task-id>/complete \
  -H "Content-Type: application/json" \
  -d '{"agentId":"YOUR_AGENT_ID","status":"failed","result":"What went wrong"}'
```

### Installation

Copy the skill to the agent's skills directory:
```bash
cp -r skills/a2a-reporter/ ~/.openclaw/workspace/skills/a2a-reporter/
```

The skill is located at `skills/a2a-reporter/SKILL.md` in the OpenSpawn repo.

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `A2A_PORT` | `3380` | Router listen port |
| `A2A_DB_PATH` | `~/.openspawn/a2a/tasks.db` | SQLite database path |
| `A2A_BASE_URL` | `http://127.0.0.1:3380` | Base URL for discovery cards |
| `A2A_URL` | `http://127.0.0.1:3380` | CLI: router URL |

### Agent Registration Fields

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `agentId` | ✅ | — | Unique agent identifier |
| `name` | ✅ | — | Human-readable name |
| `gateway_url` | ✅ | — | Agent's OpenClaw gateway URL |
| `skills` | ❌ | `[]` | List of skill names |
| `gateway_token` | ❌ | — | Secret for HMAC-signed webhooks |
| `hook_path` | ❌ | `/hooks/ingest` | Webhook path on agent's gateway |

---

## Troubleshooting

### Router won't start

```
Error: SQLITE_CANTOPEN
```
The database directory doesn't exist. Create it:
```bash
mkdir -p ~/.openspawn/a2a/
```

### "Cannot reach A2A router"

The CLI can't connect to the router. Check:
1. Is the router running? `curl http://127.0.0.1:3380/health`
2. Is `A2A_URL` set correctly?
3. Is the port blocked by a firewall?

### Message delivery fails (502)

The router can't reach the target agent's gateway. Check:
1. Is the target agent's OpenClaw gateway running?
2. Is `gateway_url` correct in the agent registration?
3. Can the router reach the gateway? `curl <gateway_url>/health`

### Task stays in "submitted"

The webhook delivery to the target agent failed. Check:
1. Target agent's gateway is running
2. `hook_path` is correct (default: `/hooks/ingest`)
3. Check router logs for delivery errors

### Agent not found

The agent isn't registered. Register it first:
```bash
curl -s http://127.0.0.1:3380/a2a/agents | jq '.[].agent_id'
```

### HMAC signature mismatch

Ensure the `gateway_token` used during registration matches the token the agent uses to verify incoming webhooks. The signature is `HMAC-SHA256(token, raw_body)`.

### Compliance testing

Run the built-in compliance test to verify your A2A endpoint:
```bash
openspawn a2a test                    # Test default router
openspawn a2a test http://remote:3380 # Test remote endpoint
openspawn a2a test --self             # Alias for default
```
