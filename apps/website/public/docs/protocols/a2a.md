---
source: https://openspawn.ai/docs/protocols/a2a
generated: 2026-03-14
---

# A2A Protocol

## Agent Discovery

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

## Sending Tasks

```
-H 'Content-Type: application/json' \\
-d '{
"message": {
"role": "user",
"parts": [{ "kind": "text", "text": "Build a REST API" }]
```

## Streaming

```
-H 'Content-Type: application/json' \\
```

## Task Management

OpenSpawn implements Google's Agent-to-Agent protocol v0.3 for agent discovery, task sending, and streaming. 💡 Try it live: curl https://bikinibottom.ai/.well-known/agent.json Every OpenSpawn instance publishes an Agent Card at Each agent has its own card at Use /a2a/message/stream for SSE streaming of task progress and results. Query task status, cancel running tasks, and retrieve artifacts via the A2A task endpoints. See the href="https://a2a-protocol.org" target="\_blank" rel="noopener" A2A protocol specification for full details.
