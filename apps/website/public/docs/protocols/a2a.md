---
source: https://openspawn.ai/docs/protocols/a2a
generated: 2026-03-03
---

# A2A Protocol

## Agent Discovery

OpenSpawn implements Google's Agent-to-Agent protocol v0.3 for agent discovery, task sending, and streaming. 💡 Try it live: curl https://bikinibottom.ai/.well-known/agent.json

```
"name": "OpenSpawn HQ",
"description": "Multi-agent coordination control plane",
"url": "https://bikinibottom.ai",
"version": "1.0.0",
"protocolVersion": "0.3",
"capabilities": { "streaming": true, "pushNotifications": false },
"skills": [
{ "id": "task-delegation", "name": "Task Delegation" },
{ "id": "agent-coordination", "name": "Agent Coordination" }
]
```

### Per-agent cards

Every OpenSpawn instance publishes an Agent Card at /.well-known/agent.json:

## Sending Tasks

```
-H 'Content-Type: application/json' \\
-d '{
"message": {
"role": "user",
"parts": [{ "kind": "text", "text": "Build a REST API" }]
```

## Streaming

Each agent has its own card at /a2a/agents/:id/agent.json.

```
-H 'Content-Type: application/json' \\
```

## Task Management

Use /a2a/message/stream for SSE streaming of task progress and results. Query task status, cancel running tasks, and retrieve artifacts via the A2A task endpoints. See the A2A protocol specification for full details.
