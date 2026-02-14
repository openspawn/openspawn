---
title: MCP Tools
layout: default
parent: Protocols
nav_order: 2
permalink: /protocols/mcp/
---

# MCP Tool Server
{: .no_toc }

BikiniBottom exposes 7 tools via the [Model Context Protocol (MCP)](https://modelcontextprotocol.io). Connect from Claude Desktop, Cursor, or any MCP-compatible client to orchestrate your agent org.

<details open markdown="block">
  <summary>Table of contents</summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

---

## What is MCP?

MCP (Model Context Protocol) is Anthropic's open standard for connecting LLMs to external tools and data. It uses JSON-RPC 2.0 over HTTP — the same protocol Claude Desktop and Cursor use to call tools.

BikiniBottom implements MCP's **Streamable HTTP** transport at `POST /mcp`.

---

## Quick Start

```bash
# Initialize the connection
curl -X POST https://bikinibottom.ai/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

# List available tools
curl -X POST https://bikinibottom.ai/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'

# Delegate a task
curl -X POST https://bikinibottom.ai/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"delegate_task","arguments":{"task":"Design a landing page"}}}'
```

Try these against bikinibottom.ai right now — they work!
{: .note }

---

## Available Tools

| Tool | Description | Required Params |
|------|-------------|----------------|
| `delegate_task` | Send a task to the agent org for processing | `task` |
| `list_agents` | List all agents in the organization | — |
| `get_agent` | Get details about a specific agent | `agentId` |
| `list_tasks` | List current tasks | — |
| `get_task` | Get task details | `taskId` |
| `send_message` | Send an ACP message to a specific agent | `agentId`, `message` |
| `get_org_stats` | Get organization-wide statistics | — |

---

## Tool Details

### `delegate_task`

Send a task to the org. It gets routed to the right agent based on domain keywords.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "task": { "type": "string", "description": "Task description" },
    "priority": {
      "type": "string",
      "enum": ["low", "medium", "high", "critical"],
      "description": "Task priority"
    }
  },
  "required": ["task"]
}
```

**Example:**

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "delegate_task",
    "arguments": {
      "task": "Build a REST API for user management",
      "priority": "high"
    }
  }
}
```

### `list_agents`

List all agents, optionally filtered by status or domain.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "status": { "type": "string", "enum": ["idle", "busy", "offline"], "description": "Filter by status" },
    "domain": { "type": "string", "description": "Filter by domain" }
  }
}
```

### `get_agent`

Get detailed information about a specific agent.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "agentId": { "type": "string", "description": "Agent ID" }
  },
  "required": ["agentId"]
}
```

### `list_tasks`

List current tasks, optionally filtered.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "status": { "type": "string", "description": "Filter by status" },
    "assigneeId": { "type": "string", "description": "Filter by assignee" },
    "limit": { "type": "number", "description": "Max results to return" }
  }
}
```

### `get_task`

Get full details for a specific task.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "taskId": { "type": "string", "description": "Task ID" }
  },
  "required": ["taskId"]
}
```

### `send_message`

Send an ACP (Agent Communication Protocol) message directly to an agent.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "agentId": { "type": "string", "description": "Target agent ID" },
    "message": { "type": "string", "description": "Message content" }
  },
  "required": ["agentId", "message"]
}
```

### `get_org_stats`

Get organization-wide statistics including agent counts, task metrics, and credit usage.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {}
}
```

---

## JSON-RPC Protocol

All MCP communication uses JSON-RPC 2.0 over a single HTTP endpoint.

### Initialize

```bash
curl -X POST https://bikinibottom.ai/mcp \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-03-26",
      "capabilities": {},
      "clientInfo": {
        "name": "my-client",
        "version": "1.0"
      }
    }
  }'
```

**Response:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2025-03-26",
    "capabilities": {
      "tools": { "listChanged": false }
    },
    "serverInfo": {
      "name": "bikinibottom",
      "version": "1.0.0"
    }
  }
}
```

### List Tools

```bash
curl -X POST https://bikinibottom.ai/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
```

### Call a Tool

```bash
curl -X POST https://bikinibottom.ai/mcp \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "delegate_task",
      "arguments": {
        "task": "Write unit tests for the auth module",
        "priority": "high"
      }
    }
  }'
```

**Response:**

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Task created: TSK-042 — 'Write unit tests for the auth module' assigned to Bug Hunter (testing)"
      }
    ],
    "isError": false
  }
}
```

### Error Handling

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "error": {
    "code": -32602,
    "message": "Invalid params: \"name\" is required"
  }
}
```

| Error Code | Meaning |
|-----------|---------|
| `-32600` | Invalid Request (jsonrpc must be "2.0") |
| `-32601` | Method not found |
| `-32602` | Invalid params |

---

## Client Integration

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "bikinibottom": {
      "url": "http://localhost:3333/mcp"
    }
  }
}
```

For the live demo:

```json
{
  "mcpServers": {
    "bikinibottom": {
      "url": "https://bikinibottom.ai/mcp"
    }
  }
}
```

### Cursor

In Cursor settings → MCP, add a new server:

- **Name:** bikinibottom
- **URL:** `http://localhost:3333/mcp`
- **Transport:** Streamable HTTP

### Custom Client (Python)

```python
import httpx

MCP_URL = "http://localhost:3333/mcp"

def mcp_call(method: str, params: dict = {}, id: int = 1):
    response = httpx.post(MCP_URL, json={
        "jsonrpc": "2.0",
        "id": id,
        "method": method,
        "params": params,
    })
    return response.json()

# Initialize
init = mcp_call("initialize", {
    "protocolVersion": "2025-03-26",
    "capabilities": {},
    "clientInfo": {"name": "my-app", "version": "1.0"},
})

# List tools
tools = mcp_call("tools/list", id=2)
for tool in tools["result"]["tools"]:
    print(f"  {tool['name']}: {tool['description']}")

# Delegate a task
result = mcp_call("tools/call", {
    "name": "delegate_task",
    "arguments": {"task": "Build a dashboard widget"},
}, id=3)
print(result["result"]["content"][0]["text"])
```

### Custom Client (TypeScript)

```typescript
const MCP_URL = "http://localhost:3333/mcp";

async function mcpCall(method: string, params: Record<string, unknown> = {}, id = 1) {
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });
  return res.json();
}

const tools = await mcpCall("tools/list", {}, 2);
console.log(tools.result.tools.map((t: any) => t.name));

const result = await mcpCall("tools/call", {
  name: "get_org_stats",
  arguments: {},
}, 3);
console.log(result.result.content[0].text);
```
