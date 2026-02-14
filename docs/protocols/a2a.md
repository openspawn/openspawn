---
title: A2A Protocol
layout: default
parent: Protocols
nav_order: 1
permalink: /protocols/a2a/
---

# A2A Protocol
{: .no_toc }

BikiniBottom implements [Google's Agent-to-Agent (A2A) protocol](https://a2a-protocol.org) v0.3. Every agent org exposes discovery, task sending, streaming, and task management endpoints.

<details open markdown="block">
  <summary>Table of contents</summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

---

## What is A2A?

A2A is an open protocol for agent interoperability. It defines how agents:

- **Discover** each other via Agent Cards at well-known URLs
- **Send tasks** with structured messages containing text, files, or data
- **Stream updates** as tasks progress through states
- **Manage tasks** — query status, list active tasks, cancel

BikiniBottom implements A2A natively — every deployed org is an A2A-compatible agent.

Try it live: `curl https://bikinibottom.ai/.well-known/agent.json`
{: .note }

---

## Agent Discovery

### Control Plane Card

Every BikiniBottom instance publishes an Agent Card at `/.well-known/agent.json`:

```bash
curl https://bikinibottom.ai/.well-known/agent.json
```

```json
{
  "name": "BikiniBottom HQ",
  "description": "Multi-agent coordination control plane",
  "url": "https://bikinibottom.ai",
  "version": "1.0.0",
  "protocolVersion": "0.3",
  "capabilities": {
    "streaming": true,
    "pushNotifications": false,
    "extendedAgentCard": true
  },
  "skills": [
    {
      "id": "task-delegation",
      "name": "Task Delegation",
      "description": "Delegate tasks to specialized agent teams"
    },
    {
      "id": "agent-coordination",
      "name": "Agent Coordination",
      "description": "Coordinate multi-agent workflows with hierarchical delegation"
    }
  ],
  "defaultInputModes": ["text/plain"],
  "defaultOutputModes": ["text/plain"]
}
```

### Per-Agent Cards

Each agent in the org has its own Agent Card:

```bash
curl https://bikinibottom.ai/agents/tech-lead/.well-known/agent.json
```

```json
{
  "name": "Tech Lead",
  "description": "Engineering Lead (L7)",
  "url": "https://bikinibottom.ai/agents/tech-lead",
  "version": "1.0.0",
  "protocolVersion": "0.3",
  "capabilities": {
    "streaming": true,
    "pushNotifications": false,
    "extendedAgentCard": false
  },
  "skills": [
    {
      "id": "code-development",
      "name": "Code Development",
      "description": "Build software features, APIs, and systems"
    },
    {
      "id": "bug-fixing",
      "name": "Bug Fixing",
      "description": "Find and fix software bugs"
    },
    {
      "id": "code-review",
      "name": "Code Review",
      "description": "Review code for quality and security"
    }
  ],
  "defaultInputModes": ["text/plain"],
  "defaultOutputModes": ["text/plain"]
}
```

---

## Sending Tasks

### `POST /a2a/message/send`

Send a task to the org. BikiniBottom automatically routes it to the right agent based on domain keywords.

```bash
curl -X POST https://bikinibottom.ai/a2a/message/send \
  -H 'Content-Type: application/json' \
  -d '{
    "message": {
      "role": "user",
      "parts": [
        { "kind": "text", "text": "Build a REST API for user management" }
      ]
    }
  }'
```

**Response:**

```json
{
  "id": "a2a-1707900000000-x7k2m9",
  "contextId": "ctx-1707900000000-p3n8j4",
  "status": {
    "state": "submitted",
    "message": {
      "role": "agent",
      "parts": [{ "kind": "text", "text": "Task routed to engineering team" }]
    },
    "timestamp": "2026-02-14T15:00:00.000Z"
  },
  "artifacts": [],
  "history": []
}
```

### Request Structure

```typescript
interface SendMessageRequest {
  message: {
    role: "user";
    parts: Part[];           // text, file, or data parts
    messageId?: string;      // optional client-generated ID
    contextId?: string;      // continue an existing context
    taskId?: string;         // follow up on a specific task
  };
  configuration?: {
    acceptedOutputModes?: string[];  // e.g. ["text/plain", "application/json"]
    historyLength?: number;          // how much history to include
    blocking?: boolean;              // wait for completion
  };
}
```

### Message Parts

| Kind | Description | Example |
|------|-------------|---------|
| `text` | Plain text content | `{ "kind": "text", "text": "Build an API" }` |
| `file` | File with bytes or URI | `{ "kind": "file", "file": { "name": "spec.pdf", "uri": "..." } }` |
| `data` | Structured JSON data | `{ "kind": "data", "data": { "priority": "high" } }` |

---

## Streaming Updates

### `POST /a2a/message/stream`

Send a task and receive real-time SSE updates as it progresses:

```bash
curl -N -X POST https://bikinibottom.ai/a2a/message/stream \
  -H 'Content-Type: application/json' \
  -d '{
    "message": {
      "role": "user",
      "parts": [{ "kind": "text", "text": "Design a landing page" }]
    }
  }'
```

**SSE events:**

```
data: {"kind":"status-update","taskId":"a2a-1707900000000-x7k2m9","contextId":"ctx-1707900000000-p3n8j4","status":{"state":"submitted","timestamp":"2026-02-14T15:00:00.000Z"},"final":false}

data: {"kind":"status-update","taskId":"a2a-1707900000000-x7k2m9","contextId":"ctx-1707900000000-p3n8j4","status":{"state":"working","message":{"role":"agent","parts":[{"kind":"text","text":"Agent picked up the task"}]},"timestamp":"2026-02-14T15:00:03.000Z"},"final":false}

data: {"kind":"artifact-update","taskId":"a2a-1707900000000-x7k2m9","contextId":"ctx-1707900000000-p3n8j4","artifact":{"artifactId":"art-001","name":"Landing Page Design","parts":[{"kind":"text","text":"## Design Specs\n..."}]}}

data: {"kind":"status-update","taskId":"a2a-1707900000000-x7k2m9","contextId":"ctx-1707900000000-p3n8j4","status":{"state":"completed","message":{"role":"agent","parts":[{"kind":"text","text":"Landing page design complete"}]},"timestamp":"2026-02-14T15:00:15.000Z"},"final":true}
```

### Event Types

| Event | Description |
|-------|-------------|
| `status-update` | Task state changed (submitted → working → completed) |
| `artifact-update` | New artifact produced (code, designs, documents) |

When `final: true`, the stream is complete and the connection closes.

---

## Task Management

### Get a Task

```bash
curl https://bikinibottom.ai/a2a/tasks/a2a-1707900000000-x7k2m9
```

Query parameters:
- `historyLength` — Number of history messages to include (default: all)

### List Tasks

```bash
curl "https://bikinibottom.ai/a2a/tasks?limit=10&state=working"
```

Query parameters:
- `limit` — Max results (default: 50)
- `offset` — Pagination offset
- `state` — Filter by state: `submitted`, `working`, `input-required`, `completed`, `failed`, `canceled`

### Cancel a Task

```bash
curl -X POST https://bikinibottom.ai/a2a/tasks/a2a-1707900000000-x7k2m9/cancel
```

### Subscribe to Updates (SSE)

```bash
curl -N https://bikinibottom.ai/a2a/tasks/a2a-1707900000000-x7k2m9/subscribe
```

Receive SSE events for an existing task.

---

## Task Lifecycle

Tasks flow through these states:

```
submitted → working → completed
                   → failed
                   → input-required → working → completed
              → canceled
              → rejected
```

| State | Description |
|-------|-------------|
| `submitted` | Task received, pending assignment |
| `working` | Agent is actively working on it |
| `input-required` | Agent needs more information |
| `completed` | Task finished successfully |
| `failed` | Task failed |
| `canceled` | Task was canceled |
| `rejected` | Task was rejected by the org |

---

## Domain Routing

BikiniBottom automatically routes tasks to the right team based on keywords:

| Domain | Keywords |
|--------|----------|
| Engineering | api, backend, frontend, code, build, deploy, test, database, server, sdk |
| Marketing | landing, campaign, blog, seo, brand, content, social, press |
| Finance | pricing, projection, revenue, budget, invoice, cost, billing |
| Sales | demo, lead, outreach, pipeline, prospect, deal, contract |
| Support | ticket, support, customer, help, resolve, issue |
| HR | onboard, hire, recruit, team, culture, training |

---

## Code Examples

### Python with `httpx`

```python
import httpx
import json

BASE = "https://bikinibottom.ai"

# Discover
card = httpx.get(f"{BASE}/.well-known/agent.json").json()
print(f"Agent: {card['name']} — {len(card['skills'])} skills")

# Send task
response = httpx.post(f"{BASE}/a2a/message/send", json={
    "message": {
        "role": "user",
        "parts": [{"kind": "text", "text": "Build a REST API for user management"}]
    }
})
task = response.json()
print(f"Task {task['id']} — {task['status']['state']}")

# Stream updates
with httpx.stream("POST", f"{BASE}/a2a/message/stream", json={
    "message": {
        "role": "user",
        "parts": [{"kind": "text", "text": "Design a landing page"}]
    }
}) as stream:
    for line in stream.iter_lines():
        if line.startswith("data: "):
            event = json.loads(line[6:])
            print(f"[{event['kind']}] {event.get('status', {}).get('state', 'artifact')}")
            if event.get("final"):
                break
```

### TypeScript with `fetch`

```typescript
const BASE = "https://bikinibottom.ai";

// Discover
const card = await fetch(`${BASE}/.well-known/agent.json`).then(r => r.json());
console.log(`Agent: ${card.name} — ${card.skills.length} skills`);

// Send task
const task = await fetch(`${BASE}/a2a/message/send`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: {
      role: "user",
      parts: [{ kind: "text", text: "Build a REST API" }],
    },
  }),
}).then(r => r.json());

console.log(`Task ${task.id} — ${task.status.state}`);
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/.well-known/agent.json` | Control plane Agent Card |
| `GET` | `/agents/{id}/.well-known/agent.json` | Per-agent Agent Card |
| `POST` | `/a2a/message/send` | Send a task (synchronous) |
| `POST` | `/a2a/message/stream` | Send a task (SSE streaming) |
| `GET` | `/a2a/tasks` | List tasks |
| `GET` | `/a2a/tasks/{id}` | Get task details |
| `POST` | `/a2a/tasks/{id}/cancel` | Cancel a task |
| `GET` | `/a2a/tasks/{id}/subscribe` | Subscribe to task updates (SSE) |
