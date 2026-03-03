import { DocsLayout, CodeBlock } from "../../../components/docs-layout";
import { useTitle } from "../../../hooks/use-title";

export function MCPTools() {
  useTitle("MCP Tools");
  return (
    <DocsLayout>
      <h1 className="mb-2 text-4xl font-bold text-slate-100">MCP Tools</h1>
      <p className="mb-8 text-lg text-slate-400">
        OpenSpawn exposes 7 tools via the Model Context Protocol using Streamable HTTP transport at <code className="inline-code">POST /mcp</code>.
      </p>

      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Quick Start</h2>
      <CodeBlock title="Initialize">{`curl -X POST https://bikinibottom.ai/mcp \\
  -H 'Content-Type: application/json' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'`}</CodeBlock>
      <CodeBlock title="List tools">{`curl -X POST https://bikinibottom.ai/mcp \\
  -H 'Content-Type: application/json' \\
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'`}</CodeBlock>

      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Available Tools</h2>
      <div className="overflow-x-auto">
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
              ["task_create", "Create a task and optionally assign it", "title"],
              ["agent_list", "List all agents in the org", "—"],
              ["agent_whoami", "Get current agent's own info", "—"],
              ["task_list", "List current tasks with optional filters", "—"],
              ["task_get", "Get task details + activity log", "id"],
              ["message_send", "Send a structured message to an agent or channel", "body"],
              ["org_status", "Get organization-wide statistics", "—"],
            ].map(([tool, desc, params]) => (
              <tr key={tool} className="border-b border-white/5">
                <td className="py-2 pr-4"><code className="inline-code">{tool}</code></td>
                <td className="py-2 pr-4 text-slate-400">{desc}</td>
                <td className="py-2 text-slate-500">{params}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Claude Desktop / Cursor</h2>
      <p className="mb-4 text-slate-400">Add to your MCP client config:</p>
      <CodeBlock title="mcp_config.json">{`{
  "mcpServers": {
    "openspawn": {
      "url": "https://bikinibottom.ai/mcp",
      "transport": "streamable-http"
    }
  }
}`}</CodeBlock>
    </DocsLayout>
  );
}
