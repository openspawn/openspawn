import { Link } from "@tanstack/react-router";
import { DocsLayout, CodeBlock } from "../../../components/docs-layout";
import { Callout, CalloutBlock } from "../../../components/callout";
import { useTitle } from "../../../hooks/use-title";

export function MCPReference() {
  useTitle("MCP Tools & Integrations");
  return (
    <DocsLayout>
      <h1 className="mb-2 text-4xl font-bold text-slate-100">MCP Tools &amp; Integrations</h1>
      <p className="mb-8 text-lg text-slate-400">
        Complete reference for OpenSpawn's MCP server. Connect Claude Desktop, Cursor, CrewAI,
        LangGraph, or any MCP client to your agent org via 7 tools over Streamable HTTP.
      </p>

      <div className="mb-8 grid gap-3 sm:grid-cols-3 text-sm">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
          <div className="text-xs text-slate-500 mb-1">Endpoint</div>
          <code className="inline-code">POST /mcp</code>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
          <div className="text-xs text-slate-500 mb-1">Transport</div>
          <span className="text-slate-300">Streamable HTTP (2025-03-26)</span>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
          <div className="text-xs text-slate-500 mb-1">Protocol</div>
          <span className="text-slate-300">JSON-RPC 2.0</span>
        </div>
      </div>

      <hr className="my-8 border-white/10" />

      {/* ── What Is MCP ───────────────────────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">What Is MCP?</h2>
      <p className="mb-4 text-slate-400">
        The Model Context Protocol is an open standard (published by Anthropic, adopted broadly)
        that defines how AI agents and LLM clients communicate with external tools and data sources.
        Think of it as USB-C for AI: a single connector spec that works across models, frameworks,
        and platforms.
      </p>
      <p className="mb-4 text-slate-400">
        MCP replaces a fragmented landscape of proprietary plugin systems with one standard:
      </p>
      <ul className="mb-4 list-disc pl-6 text-slate-400 space-y-1">
        <li>
          <strong className="text-slate-200">Tools</strong> — functions the agent can call
        </li>
        <li>
          <strong className="text-slate-200">Resources</strong> — data sources the agent can read
        </li>
        <li>
          <strong className="text-slate-200">Prompts</strong> — reusable prompt templates
        </li>
      </ul>
      <p className="mb-6 text-slate-400">
        OpenSpawn implements the <strong className="text-slate-200">Tools</strong> capability. Your
        entire org — its agents, tasks, messages, and statistics — is accessible as structured tool
        calls over a single HTTP endpoint.
      </p>

      <CalloutBlock variant="info" className="mb-8">
        MCP is OpenSpawn's native protocol. It's not an afterthought — the MCP server ships with
        every OpenSpawn instance.
      </CalloutBlock>

      <hr className="my-8 border-white/10" />

      {/* ── Quick Start ───────────────────────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Quick Start</h2>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">
        1. Start Your OpenSpawn Instance
      </h3>
      <CodeBlock title="bash">{`git clone https://github.com/openspawn/openspawn.git
cd openspawn && pnpm install
pnpm exec nx serve sandbox
# → Server running at http://localhost:3333
# → MCP available at http://localhost:3333/mcp`}</CodeBlock>
      <p className="mb-6 text-slate-400">
        Or use the live demo instance at{" "}
        <code className="inline-code">https://bikinibottom.ai/mcp</code>.
      </p>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">2. Verify the MCP Server</h3>
      <CodeBlock title="bash">{`# Step 1: Initialize
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
    }
  }'

# Step 2: List tools
curl -X POST https://bikinibottom.ai/mcp \\
  -H 'Content-Type: application/json' \\
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }'`}</CodeBlock>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">
        3. Connect Claude Desktop or Cursor
      </h3>
      <CodeBlock title="mcp_config.json">{`{
  "mcpServers": {
    "openspawn": {
      "url": "https://bikinibottom.ai/mcp",
      "transport": "streamable-http"
    }
  }
}`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        <strong className="text-slate-200">Claude Desktop:</strong>{" "}
        <code className="inline-code">~/.config/claude/claude_desktop_config.json</code>
        <br />
        <strong className="text-slate-200">Cursor:</strong> Settings → MCP → Add Server
      </p>

      <hr className="my-8 border-white/10" />

      {/* ── Available Tools ───────────────────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Available Tools</h2>
      <p className="mb-6 text-slate-400">
        OpenSpawn exposes 7 tools via MCP. All tools return JSON-encoded text content.
      </p>

      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-white/10 text-slate-400">
              <th className="py-2 pr-4 font-medium">Tool</th>
              <th className="py-2 pr-4 font-medium">Description</th>
              <th className="py-2 font-medium">Required Params</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {[
              ["delegate_task", "Send a task to the agent org", "task"],
              ["list_agents", "List all agents in the org", "—"],
              ["get_agent", "Get details about a specific agent", "agentId"],
              ["list_tasks", "List current tasks", "—"],
              ["get_task", "Get task details + activity log", "taskId"],
              ["send_message", "Send an ACP message to an agent", "agentId, message"],
              ["get_org_stats", "Get organization-wide statistics", "—"],
            ].map(([tool, desc, params]) => (
              <tr key={tool} className="border-b border-white/5">
                <td className="py-2 pr-4">
                  <code className="inline-code">{tool}</code>
                </td>
                <td className="py-2 pr-4 text-slate-400">{desc}</td>
                <td className="py-2 text-slate-500">{params}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* delegate_task */}
      <h3 className="mt-8 mb-2 text-xl font-semibold text-slate-200">
        <code className="inline-code text-xl">delegate_task</code>
      </h3>
      <p className="mb-4 text-slate-400">
        Send a task to the agent organization for processing. The task is routed by domain,
        priority, and agent availability. This is the primary entry point for most workflows.
      </p>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Parameter</th>
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Type</th>
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Required</th>
              <th className="py-2 text-left font-medium text-slate-400">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-400">
            <tr>
              <td className="py-2 pr-4">
                <code className="inline-code">task</code>
              </td>
              <td className="py-2 pr-4">string</td>
              <td className="py-2 pr-4 text-emerald-400">✅</td>
              <td className="py-2">Task description in natural language</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">
                <code className="inline-code">priority</code>
              </td>
              <td className="py-2 pr-4 text-xs">
                <code className="inline-code">"low" | "medium" | "high" | "critical"</code>
              </td>
              <td className="py-2 pr-4 text-slate-500">❌</td>
              <td className="py-2">
                Task priority (default: <code className="inline-code">"medium"</code>)
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <CodeBlock title="Request">{`{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "delegate_task",
    "arguments": {
      "task": "Research the top 5 open-source vector databases and write a comparison doc",
      "priority": "high"
    }
  }
}`}</CodeBlock>
      <CodeBlock title="Response">{`{
  "content": [{
    "type": "text",
    "text": "{\\"taskId\\":\\"task-abc123\\",\\"title\\":\\"Research the top 5...\\",\\"status\\":\\"todo\\",\\"assigneeId\\":\\"agent-research-lead\\"}"
  }],
  "isError": false
}`}</CodeBlock>

      {/* list_agents */}
      <h3 className="mt-8 mb-2 text-xl font-semibold text-slate-200">
        <code className="inline-code text-xl">list_agents</code>
      </h3>
      <p className="mb-4 text-slate-400">
        List all agents in the organization, with optional filtering by status or domain.
      </p>
      <CodeBlock title="Example — find all idle engineering agents">{`{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "list_agents",
    "arguments": {
      "status": "idle",
      "domain": "engineering"
    }
  }
}`}</CodeBlock>
      <p className="mb-6 text-slate-400">
        <strong className="text-slate-200">Response fields:</strong>{" "}
        <code className="inline-code">id</code>, <code className="inline-code">name</code>,{" "}
        <code className="inline-code">role</code>, <code className="inline-code">domain</code>,{" "}
        <code className="inline-code">level</code>, <code className="inline-code">status</code>
      </p>

      {/* get_agent */}
      <h3 className="mt-8 mb-2 text-xl font-semibold text-slate-200">
        <code className="inline-code text-xl">get_agent</code>
      </h3>
      <p className="mb-4 text-slate-400">
        Get detailed information about a specific agent, including their stats, inbox size, and
        recent messages.
      </p>
      <CodeBlock title="Example">{`{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "get_agent",
    "arguments": { "agentId": "agent-backend-senior-1" }
  }
}`}</CodeBlock>
      <p className="mb-6 text-slate-400">
        <strong className="text-slate-200">Response includes:</strong>{" "}
        <code className="inline-code">id</code>, <code className="inline-code">name</code>,{" "}
        <code className="inline-code">role</code>, <code className="inline-code">domain</code>,{" "}
        <code className="inline-code">level</code>, <code className="inline-code">status</code>,{" "}
        <code className="inline-code">parentId</code>, <code className="inline-code">stats</code>,{" "}
        <code className="inline-code">inboxSize</code>,{" "}
        <code className="inline-code">recentMessages</code> (last 5)
      </p>

      {/* list_tasks */}
      <h3 className="mt-8 mb-2 text-xl font-semibold text-slate-200">
        <code className="inline-code text-xl">list_tasks</code>
      </h3>
      <p className="mb-4 text-slate-400">
        List tasks in the org, with filtering by status, assignee, and result limit.
      </p>
      <CodeBlock title="Example — find all blocked tasks">{`{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "list_tasks",
    "arguments": {
      "status": "blocked",
      "limit": 10
    }
  }
}`}</CodeBlock>
      <p className="mb-6 text-slate-400">
        Valid status values: <code className="inline-code">todo</code>,{" "}
        <code className="inline-code">in_progress</code>,{" "}
        <code className="inline-code">review</code>, <code className="inline-code">done</code>,{" "}
        <code className="inline-code">blocked</code>
      </p>

      {/* get_task */}
      <h3 className="mt-8 mb-2 text-xl font-semibold text-slate-200">
        <code className="inline-code text-xl">get_task</code>
      </h3>
      <p className="mb-4 text-slate-400">
        Get full details for a specific task, including its activity log and any block reasons.
      </p>
      <CodeBlock title="Example">{`{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "get_task",
    "arguments": { "taskId": "task-abc123" }
  }
}`}</CodeBlock>
      <Callout variant="info" className="mb-6">
        The <code className="inline-code">activityLog</code> gives you the full ACP message thread —
        every acknowledgment, progress update, escalation, and completion in order. This is your
        audit trail.
      </Callout>

      {/* send_message */}
      <h3 className="mt-8 mb-2 text-xl font-semibold text-slate-200">
        <code className="inline-code text-xl">send_message</code>
      </h3>
      <p className="mb-4 text-slate-400">
        Send an ACP (Agent Communication Protocol) message directly to a specific agent. The message
        appears in the agent's inbox on the next tick.
      </p>
      <CodeBlock title="Example — send a priority update">{`{
  "jsonrpc": "2.0",
  "id": 6,
  "method": "tools/call",
  "params": {
    "name": "send_message",
    "arguments": {
      "agentId": "agent-engineering-lead",
      "message": "The database migration has been approved. Proceed with the production deployment."
    }
  }
}`}</CodeBlock>
      <p className="mb-6 text-slate-400">
        <strong className="text-slate-200">Response:</strong>{" "}
        <code className="inline-code">
          {'{ "sent": true, "to": "Engineering Lead", "messageId": "acp-..." }'}
        </code>
      </p>

      {/* get_org_stats */}
      <h3 className="mt-8 mb-2 text-xl font-semibold text-slate-200">
        <code className="inline-code text-xl">get_org_stats</code>
      </h3>
      <p className="mb-4 text-slate-400">
        Get a summary of organization-wide statistics: total agents, active agents, total tasks, and
        completion rates. No parameters required.
      </p>
      <CodeBlock title="Response">{`{
  "content": [{
    "type": "text",
    "text": "{\\"totalAgents\\":22,\\"activeAgents\\":14,\\"totalTasks\\":87,\\"completedTasks\\":63,\\"pendingTasks\\":24}"
  }],
  "isError": false
}`}</CodeBlock>

      <hr className="my-8 border-white/10" />

      {/* ── Connecting Agent Frameworks ───────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Connecting Agent Frameworks</h2>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">
        Claude Desktop &amp; Cursor
      </h3>
      <p className="mb-6 text-slate-400">
        After adding OpenSpawn to your config and restarting, you'll see OpenSpawn tools in the
        tools panel. Claude can now delegate tasks, check blocked tasks, get task status, and send
        messages directly from conversation.
      </p>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">CrewAI</h3>
      <CodeBlock title="python">{`from crewai_tools import MCPServerAdapter
from crewai import Agent, Task, Crew

openspawn_tools = MCPServerAdapter(
    server_url="http://localhost:3333/mcp"
)

orchestrator = Agent(
    role="Orchestrator",
    goal="Coordinate work across the agent organization",
    backstory="You manage task delegation and monitor org health.",
    tools=openspawn_tools.tools  # All 7 OpenSpawn tools available
)

task = Task(
    description="Delegate the following to the org: {user_request}. Monitor progress and report back when done.",
    agent=orchestrator
)

crew = Crew(agents=[orchestrator], tasks=[task])
crew.kickoff(inputs={"user_request": "Write a competitive analysis of vector databases"})`}</CodeBlock>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">LangGraph</h3>
      <CodeBlock title="python">{`from langchain_core.tools import tool
import httpx, json

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

tools = [delegate_to_org, get_org_stats]`}</CodeBlock>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Python (Direct)</h3>
      <CodeBlock title="python">{`import httpx, json

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
print(f"Task created: {task['taskId']} — status: {task['status']}")`}</CodeBlock>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">TypeScript / Node.js</h3>
      <CodeBlock title="typescript">{`const OPENSPAWN_URL = "http://localhost:3333/mcp";

async function mcpCall(method: string, params: Record<string, unknown> = {}) {
  const res = await fetch(OPENSPAWN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
  });
  const data = await res.json();
  if (data.error) throw new Error(\`MCP error: \${data.error.message}\`);
  return data.result;
}

async function toolCall(name: string, args: Record<string, unknown> = {}) {
  const result = await mcpCall("tools/call", { name, arguments: args });
  return JSON.parse(result.content[0].text);
}

// Initialize
await mcpCall("initialize", {
  protocolVersion: "2025-03-26",
  capabilities: {},
  clientInfo: { name: "ts-client", version: "1.0" },
});

// Delegate a task
const task = await toolCall("delegate_task", {
  task: "Audit the API for security vulnerabilities",
  priority: "critical",
});
console.log(\`Task \${task.taskId} created, assigned to \${task.assigneeId}\`);`}</CodeBlock>

      <hr className="my-8 border-white/10" />

      {/* ── Error Handling ────────────────────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Error Handling</h2>
      <p className="mb-4 text-slate-400">
        OpenSpawn MCP follows the JSON-RPC 2.0 error spec. All tool responses include an{" "}
        <code className="inline-code">isError</code> boolean. Always check{" "}
        <code className="inline-code">isError</code> before parsing the content as structured data.
      </p>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Code</th>
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Message</th>
              <th className="py-2 text-left font-medium text-slate-400">Cause</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-400">
            {[
              ["-32600", "Invalid Request", 'jsonrpc field is not "2.0"'],
              ["-32601", "Method not found", "Unknown method"],
              ["-32602", "Invalid params", "Missing required parameter, or wrong type"],
              [
                "Tool error",
                "Returned in content with isError: true",
                "Agent not found, task not found, etc.",
              ],
            ].map(([code, msg, cause]) => (
              <tr key={code}>
                <td className="py-2 pr-4">
                  <code className="inline-code">{code}</code>
                </td>
                <td className="py-2 pr-4">{msg}</td>
                <td className="py-2">{cause}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CodeBlock title="Error response example">{`{
  "jsonrpc": "2.0",
  "id": 5,
  "result": {
    "content": [{ "type": "text", "text": "Error: Agent \\"agent-xyz\\" not found" }],
    "isError": true
  }
}`}</CodeBlock>

      <hr className="my-8 border-white/10" />

      {/* ── Protocol Details ──────────────────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Protocol Details</h2>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Transport: Streamable HTTP</h3>
      <p className="mb-4 text-slate-400">
        OpenSpawn uses MCP's <strong className="text-slate-200">Streamable HTTP</strong> transport
        (spec version <code className="inline-code">2025-03-26</code>). This transport:
      </p>
      <ul className="mb-6 list-disc pl-6 text-slate-400 space-y-1">
        <li>Uses a single HTTP endpoint for all requests</li>
        <li>Supports streaming responses via SSE (Server-Sent Events)</li>
        <li>Is stateless — no persistent WebSocket connection required</li>
        <li>Works through standard HTTP proxies and load balancers</li>
      </ul>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Server Capabilities</h3>
      <CodeBlock title="Initialize response">{`{
  "capabilities": {
    "tools": { "listChanged": false }
  },
  "serverInfo": {
    "name": "openspawn",
    "version": "1.0.0"
  },
  "protocolVersion": "2025-03-26"
}`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        <code className="inline-code">listChanged: false</code> means the tool list is static — no
        need to re-fetch tools after initialization.
      </p>

      <hr className="my-8 border-white/10" />

      {/* ── What's Coming ─────────────────────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">What's Coming</h2>
      <p className="mb-4 text-slate-400">
        OpenSpawn's MCP server is actively expanding. Planned additions:
      </p>
      <ul className="mb-6 list-disc pl-6 text-slate-400 space-y-1">
        <li>
          <code className="inline-code">approve_task</code> — Approve a task through a pre-hook gate
        </li>
        <li>
          <code className="inline-code">get_org_health</code> — Retrieve the org health score and
          recommendations
        </li>
        <li>
          <code className="inline-code">list_escalations</code> — See all active escalations and
          their chains
        </li>
        <li>
          <code className="inline-code">spawn_agent</code> — Dynamically create a new agent in the
          org
        </li>
        <li>
          <strong className="text-slate-200">Resource support</strong> — Expose org state as MCP
          Resources
        </li>
        <li>
          <strong className="text-slate-200">Authentication</strong> — API key support for
          multi-tenant deployments
        </li>
      </ul>

      <hr className="my-8 border-white/10" />

      {/* ── Further Reading ───────────────────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Further Reading</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          to="/docs/reference/org-md-reference"
          className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-4 transition hover:border-white/10 hover:bg-white/[0.04] no-underline"
        >
          <div className="text-sm font-semibold text-slate-200 mb-1">ORG.md Reference →</div>
          <div className="text-xs text-slate-500">Configure your agent organization</div>
        </Link>
        <Link
          to="/docs/protocols/a2a"
          className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-4 transition hover:border-white/10 hover:bg-white/[0.04] no-underline"
        >
          <div className="text-sm font-semibold text-slate-200 mb-1">A2A Protocol →</div>
          <div className="text-xs text-slate-500">Inter-org agent communication</div>
        </Link>
        <Link
          to="/docs/concepts/acp-vs-a2a"
          className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-4 transition hover:border-white/10 hover:bg-white/[0.04] no-underline"
        >
          <div className="text-sm font-semibold text-slate-200 mb-1">ACP vs A2A →</div>
          <div className="text-xs text-slate-500">How ACP and A2A work together</div>
        </Link>
        <Link
          to="/docs/comparison"
          className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-4 transition hover:border-white/10 hover:bg-white/[0.04] no-underline"
        >
          <div className="text-sm font-semibold text-slate-200 mb-1">Framework Comparison →</div>
          <div className="text-xs text-slate-500">OpenSpawn vs CrewAI vs LangGraph</div>
        </Link>
        <a
          href="https://spec.modelcontextprotocol.io"
          target="_blank"
          rel="noopener"
          className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-4 transition hover:border-white/10 hover:bg-white/[0.04] no-underline"
        >
          <div className="text-sm font-semibold text-slate-200 mb-1">MCP Specification →</div>
          <div className="text-xs text-slate-500">Official MCP spec (external)</div>
        </a>
      </div>
    </DocsLayout>
  );
}
