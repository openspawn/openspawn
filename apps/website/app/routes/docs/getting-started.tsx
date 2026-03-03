import { Link } from "@tanstack/react-router";
import { DocsLayout, CodeBlock } from "../../components/docs-layout";
import { useTitle } from "../../hooks/use-title";

export function GettingStarted() {
  useTitle("Getting Started");
  return (
    <DocsLayout>
      <h1 className="mb-2 text-4xl font-bold text-slate-100">Getting Started with OpenSpawn</h1>
      <p className="mb-8 text-lg text-slate-400">
        What you'll have in ~10 minutes: a local org of AI agents, coordinated by a markdown file, visible
        in a real-time dashboard — with tasks flowing through a hierarchy you define.
      </p>

      {/* What is OpenSpawn */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">What is OpenSpawn?</h2>
      <p className="mb-4 text-slate-400">
        OpenSpawn is a <strong className="text-slate-200">coordination layer for AI agents</strong>. It's not an agent
        framework — you keep using whatever you're using (OpenClaw, LangGraph, Claude Code, or just raw API calls).
        OpenSpawn adds the layer on top that most multi-agent systems are missing: <em>structure</em>.
      </p>
      <p className="mb-4 text-slate-400">
        Here's the problem it solves: you have agents. They can each do things. But they don't know who's in charge,
        how to escalate a blocker, who should pick up what task, or how to divide work without stepping on each other.
        You end up hand-holding every interaction.
      </p>
      <p className="mb-4 text-slate-400">
        OpenSpawn gives your agents an org chart. A COO. Department leads. Workers with defined domains. A
        communication protocol that mirrors how effective human teams operate — acknowledgments, progress updates,
        escalations. And a real-time dashboard so you can see all of it.
      </p>
      <p className="mb-4 text-slate-400">
        The entire org is defined in a single markdown file:{" "}
        <code className="inline-code">ORG.md</code>.
      </p>
      <CodeBlock title="flow">{`ORG.md  →  OpenSpawn parses it  →  agents spawn  →  tasks flow through hierarchy  →  dashboard shows everything`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        If you're familiar with infrastructure-as-code (Terraform, Pulumi) — this is the same idea applied to agent
        organizations. Define the org in version-controlled text, deploy it, watch it run, iterate.
      </p>

      {/* Before You Start */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Before You Start</h2>
      <p className="mb-3 text-slate-400">
        <strong className="text-slate-200">Required:</strong>
      </p>
      <ul className="mb-4 list-disc pl-6 text-slate-400 space-y-1">
        <li>
          Node.js 18 or newer (
          <code className="inline-code">node --version</code> to check)
        </li>
      </ul>
      <p className="mb-3 text-slate-400">
        <strong className="text-slate-200">Optional but recommended:</strong>
      </p>
      <ul className="mb-4 list-disc pl-6 text-slate-400 space-y-1">
        <li>
          <a href="https://ollama.ai" target="_blank" rel="noopener" className="text-cyan-400 underline">
            Ollama
          </a>{" "}
          for free local model inference — workers in your org can use{" "}
          <code className="inline-code">qwen2.5</code> at zero cost
        </li>
        <li>
          A{" "}
          <a href="https://groq.com" target="_blank" rel="noopener" className="text-cyan-400 underline">
            Groq
          </a>{" "}
          API key for fast inference on mid-tier agents
        </li>
        <li>
          An{" "}
          <a href="https://openrouter.ai" target="_blank" rel="noopener" className="text-cyan-400 underline">
            OpenRouter
          </a>{" "}
          API key for top-tier models (Claude, GPT-4o) on your executive-level agents
        </li>
      </ul>
      <div className="mb-8 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        Don't have any of these? No problem — the default scaffold uses a demo/simulation mode that works without any
        API keys. You'll still see the full coordination flow.
      </div>

      {/* Step 1 */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Step 1 — Scaffold Your Org</h2>
      <CodeBlock title="bash">{`npx openspawn init my-org\ncd my-org`}</CodeBlock>
      <p className="mb-4 text-slate-400">This creates two files:</p>
      <CodeBlock title="structure">{`my-org/
├── ORG.md                  # Your org definition — this is the important one
└── openspawn.config.json   # Server config (port, model providers, etc.)`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        Let's look at what <code className="inline-code">ORG.md</code> contains by
        default:
      </p>
      <CodeBlock title="ORG.md">{`# My Org

## Identity

A small, fast-moving team. We ship things.

- **Industry:** Technology
- **Stage:** Early

## Culture

preset: startup

## Structure

### COO
The operational lead. Receives tasks, delegates to department leads,
ensures nothing falls through the cracks.
- **Model:** claude-sonnet
- **Domain:** operations

### Engineering

#### Engineering Lead
Triages technical work. Breaks projects into tasks. Delegates to workers.
- **Model:** claude-haiku
- **Domain:** engineering

#### Backend Workers
Write code, run tests, build APIs.
- **Model:** ollama/qwen2.5
- **Domain:** backend
- **Count:** 2

## Policies

### Budget
- **Per-agent limit:** 500 credits/period
- **Alert threshold:** 80%
- **Period:** daily`}</CodeBlock>
      <p className="mb-3 text-slate-400">Take a moment to read this. A few things to notice:</p>
      <ul className="mb-4 list-disc pl-6 text-slate-400 space-y-2">
        <li>
          <strong className="text-slate-200">Prose descriptions become system prompt context.</strong> "Triages
          technical work. Breaks projects into tasks." isn't just a comment — it's injected into the Engineering Lead's
          context every time it runs.
        </li>
        <li>
          <strong className="text-slate-200">Heading levels define the hierarchy.</strong> H3 (
          <code className="inline-code">###</code>) is a department or top-level
          role. H4 (<code className="inline-code">####</code>) is a team member
          that reports to the H3 above it.
        </li>
        <li>
          <strong className="text-slate-200">
            <code className="inline-code">Count: 2</code> spawns multiple
            agents
          </strong>{" "}
          with the same role — auto-numbered as "Backend Worker 1", "Backend Worker 2".
        </li>
        <li>
          <strong className="text-slate-200">
            <code className="inline-code">preset: startup</code>
          </strong>{" "}
          is shorthand for a set of communication defaults — immediate escalation, frequent progress updates, shallow
          hierarchy.
        </li>
      </ul>

      {/* Step 2 */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Step 2 — Start the Server</h2>
      <CodeBlock title="bash">{`npx openspawn start`}</CodeBlock>
      <p className="mb-4 text-slate-400">You'll see output like:</p>
      <CodeBlock title="output">{`🚀 OpenSpawn starting...
   Parsing ORG.md...
   ✓ Found 5 agents (1 COO, 1 Lead, 2 Workers, 1 implicit observer)
   ✓ Applied culture: startup
   ✓ Loaded policies: budget limits, routing rules
   Spawning agents...
   ✓ COO (claude-sonnet, L10, operations)
   ✓ Engineering Lead (claude-haiku, L7, engineering)
   ✓ Backend Worker 1 (ollama/qwen2.5, L4, backend)
   ✓ Backend Worker 2 (ollama/qwen2.5, L4, backend)
   Server running at http://localhost:3333
   Dashboard at  http://localhost:3333/app/`}</CodeBlock>
      <p className="mb-3 text-slate-400">
        Open{" "}
        <a href="http://localhost:3333/app/" target="_blank" rel="noopener" className="text-cyan-400 underline">
          http://localhost:3333/app/
        </a>{" "}
        — your dashboard is live.
      </p>
      <p className="mb-2 text-slate-400">
        <strong className="text-slate-200">What you're seeing:</strong>
      </p>
      <ul className="mb-4 list-disc pl-6 text-slate-400 space-y-1">
        <li>
          <strong className="text-slate-200">Network graph:</strong> Your org hierarchy visualized. The COO is at the
          top.
        </li>
        <li>
          <strong className="text-slate-200">Agent cards:</strong> Each agent with their level, domain, model, and
          current status.
        </li>
        <li>
          <strong className="text-slate-200">Task timeline:</strong> Empty for now — we'll fix that next.
        </li>
      </ul>

      {/* Step 3 */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Step 3 — Send Your First Task</h2>
      <CodeBlock title="bash">{`curl -X POST http://localhost:3333/a2a/message/send \\
  -H 'Content-Type: application/json' \\
  -d '{
    "message": {
      "role": "user",
      "parts": [{ "kind": "text", "text": "Build a REST API for user management with CRUD endpoints" }]
    }
  }'`}</CodeBlock>
      <p className="mb-3 text-slate-400">You'll get back a response with a <code className="inline-code">taskId</code>. Watch what happens in the dashboard:</p>
      <ol className="mb-4 list-decimal pl-6 text-slate-400 space-y-1">
        <li><strong className="text-slate-200">Task created</strong> — appears in the task timeline as "submitted"</li>
        <li><strong className="text-slate-200">COO wakes</strong> — acknowledges the task (👍 appears on the task card)</li>
        <li><strong className="text-slate-200">COO delegates</strong> — routes to the Engineering Lead</li>
        <li><strong className="text-slate-200">Engineering Lead</strong> — receives delegation, breaks it down, assigns sub-tasks to workers</li>
        <li><strong className="text-slate-200">Workers start</strong> — status changes to "working", progress updates appear</li>
        <li><strong className="text-slate-200">Workers complete</strong> — ✅ + summary flows back up the chain</li>
        <li><strong className="text-slate-200">COO marks done</strong> — final ✅ and summary back to you</li>
      </ol>
      <p className="mb-4 text-slate-400">
        This entire chain — delegation, acknowledgment, progress, completion — follows the{" "}
        <strong className="text-slate-200">Agent Communication Protocol (ACP)</strong>. ACP is what keeps agents from
        silently failing or stepping on each other.
      </p>
      <p className="mb-2 text-slate-400">To trigger a visible escalation intentionally:</p>
      <CodeBlock title="bash">{`curl -X POST http://localhost:3333/a2a/message/send \\
  -H 'Content-Type: application/json' \\
  -d '{
    "message": {
      "role": "user",
      "parts": [{ "kind": "text", "text": "Deploy the API to production with zero downtime and handle all edge cases" }]
    }
  }'`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        A sufficiently ambiguous task will trigger an escalation chain. Watch the task status change to "BLOCKED" in
        the dashboard.
      </p>

      {/* Step 4 */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Step 4 — Understand What You're Looking At</h2>
      <p className="mb-3 text-slate-400">The dashboard is where you diagnose your org:</p>
      <div className="mb-4 space-y-4">
        <div>
          <p className="mb-1 font-semibold text-slate-200">Network graph</p>
          <ul className="list-disc pl-6 text-slate-400 space-y-1 text-sm">
            <li>Pulsing/lit nodes = actively working; dim = idle</li>
            <li>Click any node to see: current task, trust score, model, credit usage</li>
            <li>Edge thickness = communication frequency between agents</li>
          </ul>
        </div>
        <div>
          <p className="mb-1 font-semibold text-slate-200">Task timeline</p>
          <ul className="list-disc pl-6 text-slate-400 space-y-1 text-sm">
            <li>Filter by state: submitted → working → completed or blocked</li>
            <li>Click any task to expand the full delegation chain</li>
            <li>Escalation chain: task → BLOCKED → escalation → manager response → unblocked</li>
          </ul>
        </div>
        <div>
          <p className="mb-1 font-semibold text-slate-200">Trust scores</p>
          <ul className="list-disc pl-6 text-slate-400 space-y-1 text-sm">
            <li>Agents start at ~30 (PROBATION). Completions raise it; escalations lower it.</li>
            <li>Higher trust = gets harder tasks</li>
          </ul>
        </div>
        <div>
          <p className="mb-1 font-semibold text-slate-200">Health score (top of dashboard)</p>
          <ul className="list-disc pl-6 text-slate-400 space-y-1 text-sm">
            <li>0–100 composite: ack latency, escalation rate, completion rate, budget, idle rate</li>
            <li>Below 70 = needs attention. Below 50 = systemic issue.</li>
          </ul>
        </div>
      </div>

      {/* Step 5 */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Step 5 — Modify Your Org</h2>
      <p className="mb-4 text-slate-400">
        Open <code className="inline-code">ORG.md</code> and add a new agent:
      </p>
      <CodeBlock title="ORG.md diff">{` #### Backend Workers
 Write code, run tests, build APIs.
 - **Model:** ollama/qwen2.5
 - **Domain:** backend
 - **Count:** 2

+#### Docs Agent
+Keeps documentation in sync with code changes. Writes API docs,
+READMEs, and inline comments.
+- **Model:** ollama/qwen2.5
+- **Domain:** documentation`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        Now apply the change — <strong className="text-slate-200">without restarting</strong>:
      </p>
      <CodeBlock title="bash">{`npx openspawn apply ORG.md`}</CodeBlock>
      <p className="mb-3 text-slate-400">The system diffs your change against the running org:</p>
      <ul className="mb-4 list-disc pl-6 text-slate-400 space-y-1 text-sm">
        <li>New agent (Docs Agent) → spawned immediately</li>
        <li>Existing agents → unchanged, no interruption</li>
        <li>In-flight tasks → not affected</li>
      </ul>
      <p className="mb-4 text-slate-400">
        Watch the new Docs Agent appear in the network graph. It starts with trust score 30 (PROBATION).
      </p>
      <div className="mb-8 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong>To remove an agent:</strong> delete their section from ORG.md and run{" "}
        <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono">apply</code>. The agent gracefully winds down:
        finishes in-flight tasks, then deactivates.
      </div>

      {/* Step 6 */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Step 6 — See It at Scale (Optional)</h2>
      <p className="mb-4 text-slate-400">
        Check out the live <strong className="text-slate-200">BikiniBottom demo</strong> — 22 SpongeBob-character
        agents running a fully staffed company, 24/7:
      </p>
      <CodeBlock title="bash">{`curl https://bikinibottom.ai/.well-known/agent.json`}</CodeBlock>
      <p className="mb-3 text-slate-400">
        Or visit{" "}
        <a href="https://bikinibottom.ai/app/" target="_blank" rel="noopener" className="text-cyan-400 underline">
          bikinibottom.ai/app/
        </a>{" "}
        — five departments, a full executive layer, real tasks in real time. Send it a task:
      </p>
      <CodeBlock title="bash">{`curl -X POST https://bikinibottom.ai/a2a/message/send \\
  -H 'Content-Type: application/json' \\
  -d '{
    "message": {
      "role": "user",
      "parts": [{ "kind": "text", "text": "Write a brief analysis of the tradeoffs between microservices and monoliths for a B2B SaaS product" }]
    }
  }'`}</CodeBlock>

      {/* Step 7 */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Step 7 — Expose Your Org via A2A</h2>
      <p className="mb-4 text-slate-400">
        OpenSpawn automatically publishes an <strong className="text-slate-200">Agent Card</strong> at the standard A2A
        discovery endpoint:
      </p>
      <CodeBlock title="bash">{`curl http://localhost:3333/.well-known/agent.json`}</CodeBlock>
      <CodeBlock title="Response">{`{
  "name": "My Org",
  "url": "http://localhost:3333",
  "protocolVersion": "0.3",
  "capabilities": { "streaming": true },
  "skills": [
    { "id": "task-delegation", "name": "Task Delegation" },
    { "id": "agent-coordination", "name": "Agent Coordination" }
  ]
}`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        Any A2A-compatible agent — from any framework — can discover your org and send it tasks. Each individual agent
        also has their own Agent Card at{" "}
        <code className="inline-code">/a2a/agents/:id/agent.json</code>.
      </p>

      {/* Step 8 */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Step 8 — Use as an MCP Tool Server</h2>
      <p className="mb-4 text-slate-400">
        If you're using Claude Desktop, Cursor, or any MCP-compatible client, add your org as a tool server:
      </p>
      <CodeBlock title="mcp config">{`{
  "mcpServers": {
    "my-org": {
      "url": "http://localhost:3333/mcp",
      "transport": "streamable-http"
    }
  }
}`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        This exposes tools across 7 categories:{" "}
        <code className="inline-code">task_create</code>,{" "}
        <code className="inline-code">agent_list</code>,{" "}
        <code className="inline-code">agent_whoami</code>,{" "}
        <code className="inline-code">task_list</code>,{" "}
        <code className="inline-code">task_get</code>,{" "}
        <code className="inline-code">message_send</code>,{" "}
        <code className="inline-code">org_status</code>, and more.
      </p>

      {/* Under the Hood */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">What's Actually Happening Under the Hood</h2>
      <div className="mb-4 space-y-4 text-slate-400">
        <p>
          <strong className="text-slate-200">Tick-based execution:</strong> The server runs a loop. On each "tick",
          every agent checks its inbox, decides what to do (work, delegate, escalate, complete, or idle), and acts.
          Cheap local models poll every tick because they're nearly free. Expensive models can be configured to wake
          only when they have actual work.
        </p>
        <p>
          <strong className="text-slate-200">The model router:</strong> OpenSpawn automatically routes to the right
          model based on agent level. L9–L10 executives get top-tier models. L7–L8 leads get mid-tier. L1–L6 workers
          get local Ollama — free. A 25-agent org with naive polling on the best model could cost $36/hour. With tiered
          routing, it's closer to $8.
        </p>
        <p>
          <strong className="text-slate-200">ACP is the nervous system:</strong> Every meaningful agent action
          generates a structured message. Delegations, acknowledgments, progress updates, escalations, completions —
          all flow through the Agent Communication Protocol. The dashboard reads ACP message streams in real-time via
          SSE.
        </p>
      </div>

      {/* Next Steps */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Next Steps</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          {
            title: "Your First ORG.md",
            desc: "Full tutorial — all five sections, from scratch",
            to: "/docs/tutorials/your-first-org-md",
          },
          {
            title: "Dashboard Walkthrough",
            desc: "Reading health scores, diagnosing escalation chains",
            to: "/docs/features/dashboard",
          },
          {
            title: "A2A Protocol",
            desc: "External agent discovery and task routing",
            to: "/docs/protocols/a2a",
          },
          {
            title: "MCP Tools",
            desc: "All 7 tools with examples",
            to: "/docs/protocols/mcp",
          },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4 text-sm transition hover:border-white/10 hover:bg-white/[0.04] no-underline"
          >
            <div className="font-medium text-slate-200 group-hover:text-cyan-400">{item.title}</div>
            <div className="mt-0.5 text-slate-500">{item.desc}</div>
          </Link>
        ))}
      </div>

      {/* Quick Reference */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Quick Reference</h2>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-6 text-slate-400 font-medium">Command</th>
              <th className="py-2 text-slate-400 font-medium">What it does</th>
            </tr>
          </thead>
          <tbody className="text-slate-400">
            {[
              ["npx openspawn init <name>", "Scaffold a new org"],
              ["npx openspawn start", "Start the server + dashboard"],
              ["npx openspawn apply ORG.md", "Apply changes without restart"],
              ["npx openspawn deploy ORG.md", "Deploy from scratch"],
              ["npx openspawn export > ORG.md", "Export current state to file"],
              ["npx openspawn snapshot", "Create a versioned config snapshot"],
              ["npx openspawn demo", "Run the demo org (no config needed)"],
            ].map(([cmd, desc]) => (
              <tr key={cmd} className="border-b border-white/5">
                <td className="py-2 pr-6">
                  <code className="inline-code text-xs">{cmd}</code>
                </td>
                <td className="py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-6 text-slate-400 font-medium">Endpoint</th>
              <th className="py-2 text-slate-400 font-medium">What it does</th>
            </tr>
          </thead>
          <tbody className="text-slate-400">
            {[
              ["GET /.well-known/agent.json", "Agent Card (A2A discovery)"],
              ["POST /a2a/message/send", "Send a task to the org"],
              ["POST /a2a/message/stream", "Send a task with SSE streaming"],
              ["POST /mcp", "MCP tool server"],
              ["GET /api/agents", "List all agents"],
              ["GET /api/tasks", "List all tasks"],
              ["GET /api/org/stats", "Org health stats"],
            ].map(([ep, desc]) => (
              <tr key={ep} className="border-b border-white/5">
                <td className="py-2 pr-6">
                  <code className="inline-code text-xs">{ep}</code>
                </td>
                <td className="py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-10 text-sm text-slate-500 italic">
        ORG.md is the thing. Everything else — the server, the dashboard, the protocols — is infrastructure that makes
        ORG.md useful. Start there, and the rest follows.
      </p>
    </DocsLayout>
  );
}
