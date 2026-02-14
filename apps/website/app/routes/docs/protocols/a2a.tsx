import { DocsLayout, CodeBlock } from "../../../components/docs-layout";

export function A2AProtocol() {
  return (
    <DocsLayout>
      <h1 className="mb-2 text-4xl font-bold text-slate-100">A2A Protocol</h1>
      <p className="mb-8 text-lg text-slate-400">
        BikiniBottom implements Google's Agent-to-Agent protocol v0.3 for agent discovery, task sending, and streaming.
      </p>

      <div className="mb-8 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        💡 Try it live: <code className="rounded bg-white/10 px-1.5 py-0.5">curl https://bikinibottom.ai/.well-known/agent.json</code>
      </div>

      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Agent Discovery</h2>
      <p className="mb-4 text-slate-400">Every BikiniBottom instance publishes an Agent Card at <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-400">/.well-known/agent.json</code>:</p>
      <CodeBlock title="bash">{`curl https://bikinibottom.ai/.well-known/agent.json`}</CodeBlock>
      <CodeBlock title="Response">{`{
  "name": "BikiniBottom HQ",
  "description": "Multi-agent coordination control plane",
  "url": "https://bikinibottom.ai",
  "version": "1.0.0",
  "protocolVersion": "0.3",
  "capabilities": { "streaming": true, "pushNotifications": false },
  "skills": [
    { "id": "task-delegation", "name": "Task Delegation" },
    { "id": "agent-coordination", "name": "Agent Coordination" }
  ]
}`}</CodeBlock>

      <h3 className="mt-6 mb-3 text-lg font-semibold text-slate-200">Per-agent cards</h3>
      <p className="mb-4 text-slate-400">Each agent has its own card at <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-400">/a2a/agents/:id/agent.json</code>.</p>

      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Sending Tasks</h2>
      <CodeBlock title="bash">{`curl -X POST https://bikinibottom.ai/a2a/message/send \\
  -H 'Content-Type: application/json' \\
  -d '{
    "message": {
      "role": "user",
      "parts": [{ "kind": "text", "text": "Build a REST API" }]
    }
  }'`}</CodeBlock>

      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Streaming</h2>
      <p className="mb-4 text-slate-400">Use <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-400">/a2a/message/stream</code> for SSE streaming of task progress and results.</p>
      <CodeBlock title="bash">{`curl -N -X POST https://bikinibottom.ai/a2a/message/stream \\
  -H 'Content-Type: application/json' \\
  -d '{"message":{"role":"user","parts":[{"kind":"text","text":"Design a landing page"}]}}'`}</CodeBlock>

      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Task Management</h2>
      <p className="text-slate-400">
        Query task status, cancel running tasks, and retrieve artifacts via the A2A task endpoints.
        See the <a href="https://a2a-protocol.org" target="_blank" rel="noopener" className="text-cyan-400 underline">A2A protocol specification</a> for full details.
      </p>
    </DocsLayout>
  );
}
