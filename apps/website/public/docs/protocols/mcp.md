---
source: https://openspawn.ai/docs/protocols/mcp
generated: 2026-03-14
---

# MCP Tools

OpenSpawn exposes 7 tools via the Model Context Protocol using Streamable HTTP transport at

## Quick Start

```
-H 'Content-Type: application/json' \\
```

```
-H 'Content-Type: application/json' \\
```

## Available Tools

POST /mcp.

Description

## Claude Desktop / Cursor

Required Params ["delegate_task", "Send a task to the agent org", "task"], ["list_agents", "List all agents in the org", "—"], ["get_agent", "Get details about a specific agent", "agentId"], ["list_tasks", "List current tasks", "—"], ["get_task", "Get task details", "taskId"], ["send_message", "Send an ACP message to an agent", "agentId, message"], ["get_org_stats", "Get organization-wide statistics", "—"], ].map(([tool, desc, params]) => (

```
"mcpServers": {
"openspawn": {
"url": "https://bikinibottom.ai/mcp",
"transport": "streamable-http"
```

Add to your MCP client config:
