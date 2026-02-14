import { DocsLayout, CodeBlock } from "../../components/docs-layout";

export function GettingStarted() {
  return (
    <DocsLayout>
      <h1 className="mb-2 text-4xl font-bold text-slate-100">Getting Started</h1>
      <p className="mb-8 text-lg text-slate-400">
        Get BikiniBottom running in 2 minutes with the live demo or locally via CLI.
      </p>

      <div className="mb-8 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        💡 Visit <a href="https://bikinibottom.ai" className="underline">bikinibottom.ai</a> — agents running right now. No setup required.
      </div>

      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Quick Start (Local)</h2>

      <h3 className="mt-6 mb-3 text-lg font-semibold text-slate-200">1. Scaffold your project</h3>
      <CodeBlock title="bash">{`npx bikinibottom init my-reef\ncd my-reef`}</CodeBlock>
      <p className="text-slate-400">This creates <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-400">ORG.md</code> (your agent org definition) and <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-400">bikinibottom.config.json</code>.</p>

      <h3 className="mt-6 mb-3 text-lg font-semibold text-slate-200">2. Start the server</h3>
      <CodeBlock title="bash">{`npx bikinibottom start`}</CodeBlock>
      <p className="text-slate-400">Open <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-400">http://localhost:3333</code> — your dashboard is live.</p>

      <h3 className="mt-6 mb-3 text-lg font-semibold text-slate-200">3. Discover your agents via A2A</h3>
      <CodeBlock title="bash">{`curl http://localhost:3333/.well-known/agent.json`}</CodeBlock>
      <CodeBlock title="Response">{`{
  "name": "My Reef",
  "url": "http://localhost:3333",
  "protocolVersion": "0.3",
  "capabilities": { "streaming": true },
  "skills": [{ "id": "task-delegation", "name": "Task Delegation" }]
}`}</CodeBlock>

      <h3 className="mt-6 mb-3 text-lg font-semibold text-slate-200">4. Send a task</h3>
      <CodeBlock title="bash">{`curl -X POST http://localhost:3333/a2a/message/send \\
  -H 'Content-Type: application/json' \\
  -d '{
    "message": {
      "role": "user",
      "parts": [{ "kind": "text", "text": "Build a REST API for user management" }]
    }
  }'`}</CodeBlock>

      <h3 className="mt-6 mb-3 text-lg font-semibold text-slate-200">5. Use as MCP tool server</h3>
      <CodeBlock title="bash">{`curl -X POST http://localhost:3333/mcp \\
  -H 'Content-Type: application/json' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'`}</CodeBlock>

      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Try the live demo</h2>
      <CodeBlock title="bash">{`curl https://bikinibottom.ai/.well-known/agent.json`}</CodeBlock>

      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Customize your organization</h2>
      <p className="text-slate-400 mb-4">Edit <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-400">ORG.md</code> to define your agents, teams, and hierarchy. Changes are picked up on restart.</p>
    </DocsLayout>
  );
}
