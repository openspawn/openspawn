---
source: https://openspawn.ai/docs/protocols/mcp-reference
generated: 2026-03-13
---

# MCP Tools & Integrations

Complete reference for OpenSpawn's MCP server. Connect Claude Desktop, Cursor, CrewAI, LangGraph, or any MCP client to your agent org via 7 tools over Streamable HTTP.

Endpoint

POST /mcp

Transport

Streamable HTTP (2025-03-26)

Protocol

## What Is MCP?

JSON-RPC 2.0 The Model Context Protocol is an open standard (published by Anthropic, adopted broadly) that defines how AI agents and LLM clients communicate with external tools and data sources. Think of it as USB-C for AI: a single connector spec that works across models, frameworks, and platforms. MCP replaces a fragmented landscape of proprietary plugin systems with one standard:

Tools — functions the agent can call

Resources — data sources the agent can read

## Quick Start

```
cd openspawn && pnpm install
pnpm exec nx serve sandbox
# → Server running at http://localhost:3333
```

Prompts — reusable prompt templates OpenSpawn implements the Tools capability. Your entire org — its agents, tasks, messages, and statistics — is accessible as structured tool calls over a single HTTP endpoint. MCP is OpenSpawn's native protocol. It's not an afterthought — the MCP server ships with every OpenSpawn instance. 1. Start Your OpenSpawn Instance Or use the live demo instance at

### 2. Verify the MCP Server

```
curl -X POST https://bikinibottom.ai/mcp \\
-H 'Content-Type: application/json' \\
-d '{
"jsonrpc": "2.0",
"id": 1,
"method": "initialize",
"params": {
"protocolVersion": "2025-03-26",
"capabilities": {},
"clientInfo": { "name": "my-client", "version": "1.0" }
}'
# Step 2: List tools
curl -X POST https://bikinibottom.ai/mcp \\
-H 'Content-Type: application/json' \\
-d '{
"jsonrpc": "2.0",
"id": 2,
"method": "tools/list",
"params": {}
```

```
"mcpServers": {
"openspawn": {
"url": "https://bikinibottom.ai/mcp",
"transport": "streamable-http"
```

https://bikinibottom.ai/mcp. 3. Connect Claude Desktop or Cursor

Claude Desktop:

~/.config/claude/claude_desktop_config.json

## Available Tools

Cursor: Settings → MCP → Add Server OpenSpawn exposes 7 tools via MCP. All tools return JSON-encoded text content.

Description

Required Params ["delegate_task", "Send a task to the agent org", "task"], ["list_agents", "List all agents in the org", "—"], ["get_agent", "Get details about a specific agent", "agentId"], ["list_tasks", "List current tasks", "—"], ["get_task", "Get task details + activity log", "taskId"], ["send_message", "Send an ACP message to an agent", "agentId, message"], ["get_org_stats", "Get organization-wide statistics", "—"], ].map(([tool, desc, params]) => (

delegate_task Send a task to the agent organization for processing. The task is routed by domain, priority, and agent availability. This is the primary entry point for most workflows.

Parameter

Required

Description

string

Task description in natural language

priority

```
"jsonrpc": "2.0",
"id": 1,
"method": "tools/call",
"params": {
"name": "delegate_task",
"arguments": {
"task": "Research the top 5 open-source vector databases and write a comparison doc",
"priority": "high"
```

```
"content": [{
"type": "text",
"text": "{\\"taskId\\":\\"task-abc123\\",\\"title\\":\\"Research the top 5...\\",\\"status\\":\\"todo\\",\\"assigneeId\\":\\"agent-research-lead\\"}"
}],
"isError": false
```

"low" | "medium" | "high" | "critical" Task priority (default: "medium")

```
"jsonrpc": "2.0",
"id": 2,
"method": "tools/call",
"params": {
"name": "list_agents",
"arguments": {
"status": "idle",
"domain": "engineering"
```

list_agents List all agents in the organization, with optional filtering by status or domain.

Response fields:

id, name,

role, domain,

level, status

```
"jsonrpc": "2.0",
"id": 3,
"method": "tools/call",
"params": {
"name": "get_agent",
"arguments": { "agentId": "agent-backend-senior-1" }
```

get_agent Get detailed information about a specific agent, including their stats, inbox size, and recent messages.

Response includes:

id, name,

role, domain,

level, status,

parentId, stats,

inboxSize,

recentMessages (last 5)

```
"jsonrpc": "2.0",
"id": 4,
"method": "tools/call",
"params": {
"name": "list_tasks",
"arguments": {
"status": "blocked",
"limit": 10
```

list_tasks List tasks in the org, with filtering by status, assignee, and result limit. Valid status values: todo,

in_progress,

review, done,

blocked

```
"jsonrpc": "2.0",
"id": 5,
"method": "tools/call",
"params": {
"name": "get_task",
"arguments": { "taskId": "task-abc123" }
```

get_task Get full details for a specific task, including its activity log and any block reasons. The activityLog gives you the full ACP message thread — every acknowledgment, progress update, escalation, and completion in order. This is your audit trail.

```
"jsonrpc": "2.0",
"id": 6,
"method": "tools/call",
"params": {
"name": "send_message",
"arguments": {
"agentId": "agent-engineering-lead",
"message": "The database migration has been approved. Proceed with the production deployment."
```

send_message Send an ACP (Agent Communication Protocol) message directly to a specific agent. The message appears in the agent's inbox on the next tick.

Response:

```
"content": [{
"type": "text",
"text": "{\\"totalAgents\\":22,\\"activeAgents\\":14,\\"totalTasks\\":87,\\"completedTasks\\":63,\\"pendingTasks\\":24}"
}],
"isError": false
```

## Connecting Agent Frameworks

### CrewAI

```
from crewai import Agent, Task, Crew
openspawn_tools = MCPServerAdapter(
server_url="http://localhost:3333/mcp"
)
orchestrator = Agent(
role="Orchestrator",
goal="Coordinate work across the agent organization",
backstory="You manage task delegation and monitor org health.",
tools=openspawn_tools.tools # All 7 OpenSpawn tools available
)
task = Task(
description="Delegate the following to the org: {user_request}. Monitor progress and report back when done.",
agent=orchestrator
)
crew = Crew(agents=[orchestrator], tasks=[task])
```

### LangGraph

```
def call_openspawn(method: str, params: dict) -> dict:
response = httpx.post(
"http://localhost:3333/mcp",
json={"jsonrpc": "2.0", "id": 1, "method": method, "params": params}
)
return response.json()["result"]
@tool
def delegate_to_org(task: str, priority: str = "medium") -> str:
"""Delegate a task to the OpenSpawn agent organization."""
result = call_openspawn("tools/call", {
"name": "delegate_task",
"arguments": {"task": task, "priority": priority}
})
return json.dumps(result["content"][0]["text"])
@tool
def get_org_stats() -> str:
"""Get current organization statistics."""
result = call_openspawn("tools/call", {
"name": "get_org_stats",
"arguments": {}
})
return result["content"][0]["text"]
```

### Python (Direct)

```
class OpenSpawnMCP:
def __init__(self, url: str = "http://localhost:3333/mcp"):
self.url = url
self._id = 0
def _call(self, method: str, params: dict = None) -> dict:
self._id += 1
resp = httpx.post(self.url, json={
"jsonrpc": "2.0",
"id": self._id,
"method": method,
"params": params or {}
})
resp.raise_for_status()
data = resp.json()
if "error" in data:
raise ValueError(f"MCP error: {data['error']}")
return data["result"]
def initialize(self):
return self._call("initialize", {
"protocolVersion": "2025-03-26",
"capabilities": {},
"clientInfo": {"name": "python-client", "version": "1.0"}
})
def delegate_task(self, task: str, priority: str = "medium") -> dict:
result = self._call("tools/call", {
"name": "delegate_task",
"arguments": {"task": task, "priority": priority}
})
return json.loads(result["content"][0]["text"])
def get_org_stats(self) -> dict:
result = self._call("tools/call", {
"name": "get_org_stats", "arguments": {}
})
return json.loads(result["content"][0]["text"])
# Usage
client = OpenSpawnMCP()
client.initialize()
task = client.delegate_task("Generate a weekly report on agent performance", "high")
```

### TypeScript / Node.js

```
async function mcpCall(method: string, params: Record = {}) {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
});
if (data.error) throw new Error(\`MCP error: \${data.error.message}\`);
return data.result;
async function toolCall(name: string, args: Record = {}) {
return JSON.parse(result.content[0].text);
// Initialize
await mcpCall("initialize", {
protocolVersion: "2025-03-26",
capabilities: {},
clientInfo: { name: "ts-client", version: "1.0" },
});
// Delegate a task
task: "Audit the API for security vulnerabilities",
priority: "critical",
});
```

## Error Handling

get_org_stats Get a summary of organization-wide statistics: total agents, active agents, total tasks, and completion rates. No parameters required. Claude Desktop & Cursor After adding OpenSpawn to your config and restarting, you'll see OpenSpawn tools in the tools panel. Claude can now delegate tasks, check blocked tasks, get task status, and send messages directly from conversation. OpenSpawn MCP follows the JSON-RPC 2.0 error spec. All tool responses include an

isError boolean. Always check

isError before parsing the content as structured data.

Message

```
"jsonrpc": "2.0",
"id": 5,
"result": {
"content": [{ "type": "text", "text": "Error: Agent \\"agent-xyz\\" not found" }],
"isError": true
```

## Protocol Details

### Transport: Streamable HTTP

### Server Capabilities

```
"capabilities": {
"tools": { "listChanged": false }
},
"serverInfo": {
"name": "openspawn",
"version": "1.0.0"
},
"protocolVersion": "2025-03-26"
```

Cause ["-32600", "Invalid Request", 'jsonrpc field is not "2.0"'], ["-32601", "Method not found", "Unknown method"], ["-32602", "Invalid params", "Missing required parameter, or wrong type"], "Tool error", "Returned in content with isError: true", "Agent not found, task not found, etc.", ].map(([code, msg, cause]) => ( OpenSpawn uses MCP's Streamable HTTP transport (spec version 2025-03-26). This transport:

## What's Coming

listChanged: false means the tool list is static — no need to re-fetch tools after initialization. OpenSpawn's MCP server is actively expanding. Planned additions:

approve_task — Approve a task through a pre-hook gate

get_org_health — Retrieve the org health score and recommendations

list_escalations — See all active escalations and their chains

spawn_agent — Dynamically create a new agent in the

Resource support — Expose org state as MCP Resources

## Further Reading

Authentication — API key support for multi-tenant deployments to="/docs/reference/org-md-reference"

ORG.md Reference →

Configure your agent organization to="/docs/protocols/a2a"

A2A Protocol →

Inter-org agent communication to="/docs/concepts/acp-vs-a2a"

ACP vs A2A →

How ACP and A2A work together to="/docs/comparison"

Framework Comparison →

OpenSpawn vs CrewAI vs LangGraph href="https://spec.modelcontextprotocol.io" target="_blank" rel="noopener"

MCP Specification →

Official MCP spec (external)
