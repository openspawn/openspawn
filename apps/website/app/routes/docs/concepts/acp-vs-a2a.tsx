import { Link } from "@tanstack/react-router";
import { DocsLayout, CodeBlock } from "../../../components/docs-layout";
import { useTitle } from "../../../hooks/use-title";

export function AcpVsA2A() {
  useTitle("ACP vs A2A");
  return (
    <DocsLayout>
      <h1 className="mb-2 text-4xl font-bold text-slate-100">ACP vs A2A</h1>
      <p className="mb-8 text-lg text-slate-400">
        When to use OpenSpawn's Agent Communication Protocol versus Google's Agent-to-Agent protocol
        — and how they work together.
      </p>

      <div className="mb-8 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        Two protocols, two jobs. One for inside your org, one for talking to the outside world.
      </div>

      <p className="mb-8 text-slate-400">
        If you've read about multi-agent systems, you've probably encountered Google's A2A
        (Agent-to-Agent) protocol. OpenSpawn uses a different protocol internally — ACP (Agent
        Communication Protocol). They're not competitors. They're designed for different problems
        and work together.
      </p>

      <hr className="my-8 border-white/10" />

      {/* The Short Version */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">The Short Version</h2>
      <div className="mb-8 overflow-x-auto">
        <table className="w-full text-sm text-slate-400 border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-6 text-left font-semibold text-slate-300"></th>
              <th className="py-2 pr-6 text-left font-semibold text-cyan-400">ACP</th>
              <th className="py-2 text-left font-semibold text-purple-400">A2A</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[
              ["Stands for", "Agent Communication Protocol", "Agent-to-Agent Protocol"],
              ["Created by", "OpenSpawn", "Google (open standard)"],
              ["Scope", "Inside your org", "Between orgs / external agents"],
              ["Trust model", "Known agents, shared state", "Zero-trust, opaque agents"],
              ["Analogy", "Slack (team chat)", "Email (cross-company)"],
              ["Best for", "Manager ↔ worker communication", "Your org ↔ external AI service"],
            ].map(([label, acp, a2a]) => (
              <tr key={label}>
                <td className="py-2 pr-6 font-semibold text-slate-300">{label}</td>
                <td className="py-2 pr-6">{acp}</td>
                <td className="py-2">{a2a}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <hr className="my-8 border-white/10" />

      {/* ACP */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        ACP: Communication Inside Your Org
      </h2>
      <p className="mb-4 text-slate-400">
        ACP governs how agents within a single OpenSpawn org communicate with each other. It's built
        around a core insight:{" "}
        <strong className="text-slate-200">agents in the same org already know each other</strong>,
        share context, and exist in a trust hierarchy. You shouldn't need to treat your own backend
        worker like an opaque third-party service.
      </p>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">What ACP Defines</h3>
      <p className="mb-4 text-slate-400">
        ACP specifies four message types, each with a specific purpose:
      </p>

      <p className="mb-2 text-slate-300 font-semibold">1. Acknowledgment (ACK)</p>
      <CodeBlock title="typescript">{`{ type: "ack", from: "agent-backend-1", to: "agent-lead-eng", taskId: "task-42", timestamp }`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        Immediate reaction (no LLM required) when an agent receives a task. Tells the delegator "I
        got it."
      </p>

      <p className="mb-2 text-slate-300 font-semibold">2. Progress</p>
      <CodeBlock title="typescript">{`{ type: "progress", from: "agent-backend-1", taskId: "task-42", 
  body: "Bug reproduced. Root cause: UTC vs server time. Fixing.", pct: 60, timestamp }`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        Pull-based log entry written to the task as work progresses. The manager checks when they
        want to.
      </p>

      <p className="mb-2 text-slate-300 font-semibold">3. Escalation</p>
      <CodeBlock title="typescript">{`{ type: "escalation", from: "agent-backend-1", to: "agent-lead-eng", taskId: "task-42",
  reason: "BLOCKED", body: "Need JWT secret to test the fix — not in .env", timestamp }`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        Push notification when an agent is blocked. Goes directly to the manager. Actionable.
      </p>

      <p className="mb-2 text-slate-300 font-semibold">4. Completion</p>
      <CodeBlock title="typescript">{`{ type: "completion", from: "agent-backend-1", to: "agent-lead-eng", taskId: "task-42",
  summary: "Fixed JWT expiry check. Tests pass. No security review needed.", timestamp }`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        Task done signal with a brief summary. Manager can proceed with dependent work.
      </p>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Why This Matters</h3>
      <p className="mb-4 text-slate-400">
        Most multi-agent frameworks have no communication model at all — tasks go in, results come
        out, and the delegator just waits. ACP gives you:
      </p>
      <ul className="mb-4 list-disc pl-6 text-slate-400 space-y-1">
        <li>
          <strong className="text-slate-200">Visibility without noise</strong> — progress is
          pull-based; completions and escalations are push
        </li>
        <li>
          <strong className="text-slate-200">Automatic accountability</strong> — the 👍 ack confirms
          delivery instantly
        </li>
        <li>
          <strong className="text-slate-200">Organizational metrics</strong> — escalation rates, ack
          latency, completion rates emerge from the protocol
        </li>
        <li>
          <strong className="text-slate-200">Debugging information</strong> — every decision an
          agent makes is logged with context
        </li>
      </ul>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">What ACP Doesn't Do</h3>
      <p className="mb-4 text-slate-400">ACP is not for talking to external systems. It assumes:</p>
      <ul className="mb-4 list-disc pl-6 text-slate-400 space-y-1">
        <li>Both agents are in your org</li>
        <li>You have trust information about each agent (level, history, trust score)</li>
        <li>Communication happens over OpenSpawn's internal event system</li>
        <li>Agents share context (task details, org policies, playbooks)</li>
      </ul>
      <p className="mb-4 text-slate-400">
        When you need to communicate <em>outside</em> your org — to another company's agent, a
        third-party AI service, or an external agent built on a different framework — you need A2A.
      </p>

      <hr className="my-8 border-white/10" />

      {/* A2A */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        A2A: Communication Between Orgs
      </h2>
      <p className="mb-4 text-slate-400">
        Google's A2A protocol is an open standard for inter-agent communication across
        organizational and vendor boundaries. It answers the question: "How does my LangGraph agent
        talk to your CrewAI agent, when we can't assume shared infrastructure?"
      </p>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">What A2A Defines</h3>

      <p className="mb-2 text-slate-300 font-semibold">Agent Cards</p>
      <p className="mb-2 text-slate-400">Discovery metadata that describes what an agent can do:</p>
      <CodeBlock title="agent-card.json">{`{
  "name": "data-analyst-agent",
  "description": "Analyzes datasets and produces reports",
  "url": "https://agents.example.com/analyst",
  "capabilities": {
    "streaming": true,
    "pushNotifications": false
  },
  "skills": [
    { "id": "data-analysis", "name": "Data Analysis", "tags": ["csv", "sql", "charts"] },
    { "id": "report-gen", "name": "Report Generation" }
  ]
}`}</CodeBlock>

      <p className="mb-2 text-slate-300 font-semibold">
        Tasks — stateful work units with a lifecycle:
      </p>
      <CodeBlock title="">{`submitted → working → completed | canceled | failed
                     ↓
               (streaming updates via SSE)`}</CodeBlock>

      <p className="mb-2 text-slate-400">
        <strong className="text-slate-300">Transport</strong> — JSON-RPC 2.0 over HTTPS, with
        optional gRPC and SSE for streaming.
      </p>

      <p className="mb-2 text-slate-300 font-semibold">Message format</p>
      <p className="mb-2 text-slate-400">
        Generic <code className="inline-code">Message</code> objects containing typed{" "}
        <code className="inline-code">Parts</code>:
      </p>
      <CodeBlock title="message.json">{`{
  "role": "agent",
  "parts": [
    { "kind": "text", "text": "Analysis complete. Found 3 anomalies in the dataset." },
    { "kind": "file", "file": { "name": "report.pdf", "mimeType": "application/pdf", "uri": "..." } }
  ]
}`}</CodeBlock>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">What A2A Doesn't Do</h3>
      <p className="mb-4 text-slate-400">
        A2A is deliberately <strong className="text-slate-200">opaque</strong> — it doesn't assume
        you know anything about the internal structure of the agent you're talking to. There's no
        concept of trust scores, hierarchy, delegation depth, or escalation chains. Two agents can
        exchange tasks over A2A without either knowing whether the other is a single model, a
        multi-agent team, or a human pretending to be a bot.
      </p>
      <p className="mb-4 text-slate-400">
        This opacity is a feature, not a limitation. You don't want to expose your internal org
        structure to a third-party service.
      </p>

      <hr className="my-8 border-white/10" />

      {/* Side-by-Side */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Side-by-Side Comparison</h2>
      <div className="mb-6 overflow-x-auto">
        <table className="w-full text-sm text-slate-400 border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-4 text-left font-semibold text-slate-300">Dimension</th>
              <th className="py-2 pr-4 text-left font-semibold text-cyan-400">ACP</th>
              <th className="py-2 text-left font-semibold text-purple-400">A2A</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[
              ["Scope", "Intra-org", "Inter-org"],
              ["Trust model", "Known agents, trust scores", "Zero-trust"],
              ["Agent discovery", "Org chart / hierarchy", "Agent Cards (JSON metadata)"],
              ["Transport", "Internal events, SSE", "JSON-RPC 2.0, gRPC, REST"],
              ["Task lifecycle", "Stateful (same as A2A)", "Stateful"],
              ["Streaming", "SSE", "SSE (similar)"],
              [
                "Message types",
                "Typed: ack, progress, escalation, completion",
                "Generic: Message with Parts",
              ],
              ["Hierarchy", "First-class (parent, level, chain of command)", "Flat (peer-to-peer)"],
              [
                "Organizational metrics",
                "Built-in (escalation rate, ack latency, etc.)",
                "Not defined",
              ],
              ["Delegation chain", "Tracked and surfaced", "Not defined"],
            ].map(([dim, acp, a2a]) => (
              <tr key={dim}>
                <td className="py-2 pr-4 font-semibold text-slate-300">{dim}</td>
                <td className="py-2 pr-4">{acp}</td>
                <td className="py-2">{a2a}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">
        The Key Philosophical Difference
      </h3>
      <div className="mb-6 space-y-4">
        <div className="rounded-lg border border-cyan-500/10 bg-cyan-500/5 px-5 py-4">
          <p className="mb-1 text-sm font-semibold text-cyan-400">ACP assumes transparency.</p>
          <p className="text-sm text-slate-400">
            Within your org, shared context improves outcomes. Your backend worker should know the
            org is a startup that moves fast. Your engineering lead should know which workers have
            the highest trust scores for hard tasks. Opacity <em>within</em> your own org creates
            the same dysfunctions as opacity in human organizations.
          </p>
        </div>
        <div className="rounded-lg border border-purple-500/10 bg-purple-500/5 px-5 py-4">
          <p className="mb-1 text-sm font-semibold text-purple-400">A2A assumes opacity.</p>
          <p className="text-sm text-slate-400">
            Across org boundaries, you don't want to expose your internal state, and you can't trust
            the other party's trust model. Two agents that have never met need a common protocol
            that doesn't require shared infrastructure.
          </p>
        </div>
      </div>
      <p className="mb-4 text-slate-400">
        <strong className="text-slate-200">Together they cover the full spectrum:</strong>{" "}
        transparent internally (ACP), opaque externally (A2A).
      </p>

      <hr className="my-8 border-white/10" />

      {/* When to Use Which */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">When to Use Which</h2>
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-5 py-4">
          <p className="mb-3 text-sm font-semibold text-cyan-400">Use ACP when:</p>
          <ul className="space-y-1 text-sm text-slate-400">
            <li>• An agent in your org is delegating to another agent in your org</li>
            <li>• You want to track escalation chains, completion rates, or ack latency</li>
            <li>• You're building the communication structure for your own multi-agent team</li>
            <li>• You want managers to have visibility into worker progress</li>
          </ul>
        </div>
        <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 px-5 py-4">
          <p className="mb-3 text-sm font-semibold text-purple-400">Use A2A when:</p>
          <ul className="space-y-1 text-sm text-slate-400">
            <li>• Your org needs to call an external AI service or third-party agent</li>
            <li>• An external system needs to call into your org as a service</li>
            <li>• You're building an agent interoperable with LangGraph, CrewAI, etc.</li>
            <li>• You're connecting two separate OpenSpawn orgs</li>
          </ul>
        </div>
      </div>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">In Practice: Both at Once</h3>
      <p className="mb-4 text-slate-400">Most real OpenSpawn deployments use both:</p>
      <CodeBlock title="architecture">{`┌──────────────────────────────────────────────┐
│              Your OpenSpawn Org              │
│                                              │
│  COO ──ACP──► Eng Lead ──ACP──► Worker       │
│   │                                          │
│   │  Internal communication: ACP             │
│   │  (typed messages, shared context,        │
│   │   trust scores, escalation chains)       │
│                                              │
│   ▼                                          │
│  A2A Gateway                                 │
│   │                                          │
└───┼──────────────────────────────────────────┘
    │
    │  External communication: A2A
    │  (Agent Cards, JSON-RPC, zero-trust)
    ▼
┌──────────────┐    ┌──────────────────────────┐
│ External     │    │ External Agent B          │
│ Agent A      │    │ (LangGraph / CrewAI /     │
│ (vendor API) │    │  another OpenSpawn org)   │
└──────────────┘    └──────────────────────────┘`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        The A2A Gateway sits at the org boundary and translates between the two protocols:
      </p>
      <ul className="mb-8 list-disc pl-6 text-slate-400 space-y-2">
        <li>
          <strong className="text-slate-200">Inbound (A2A → ACP):</strong> External agent sends an
          A2A task → Gateway creates an internal ACP delegation to the right agent based on
          skill/domain matching.
        </li>
        <li>
          <strong className="text-slate-200">Outbound (ACP → A2A):</strong> Internal agent escalates
          with <code className="inline-code">OUT_OF_DOMAIN</code> → Gateway discovers external
          agents via Agent Cards and sends an A2A request.
        </li>
        <li>
          <strong className="text-slate-200">Status mapping:</strong> ACP completion/escalation →
          A2A task status updates.
        </li>
      </ul>

      <hr className="my-8 border-white/10" />

      {/* Code Examples */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Code Examples</h2>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">
        ACP: Handling an Escalation
      </h3>
      <p className="mb-4 text-slate-400">
        When an agent in your org escalates, you see this in the ACP message stream:
      </p>
      <CodeBlock title="typescript">{`// ACP escalation message
const escalation: AgentMessage = {
  id: "msg-789",
  type: "escalation",
  from: "agent-backend-1",
  to: "agent-lead-eng",
  taskId: "task-42",
  reason: "BLOCKED",
  body: "Need JWT secret to test the fix — not in .env",
  timestamp: "2024-01-15T10:30:00Z"
};

// The manager agent receives this and decides:
// - Provide the resource (unblock)
// - Reassign to a different agent
// - Escalate further up the chain
// - Cancel the task`}</CodeBlock>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">
        A2A: Sending a Task to an External Agent
      </h3>
      <p className="mb-4 text-slate-400">
        When your org delegates to an external service, it goes via A2A:
      </p>
      <CodeBlock title="typescript">{`// A2A task submission (JSON-RPC 2.0)
const request = {
  jsonrpc: "2.0",
  method: "tasks/send",
  id: "req-001",
  params: {
    id: "task-ext-42",
    message: {
      role: "user",
      parts: [
        {
          kind: "text",
          text: "Analyze this sales dataset and produce a trend report. " +
                "Focus on Q4 performance and identify top 3 growth segments."
        },
        {
          kind: "file",
          file: {
            name: "sales-q4.csv",
            mimeType: "text/csv",
            uri: "https://data.yourorg.com/exports/sales-q4.csv"
          }
        }
      ]
    }
  }
};

// Stream the response
const response = await fetch("https://analyst-agent.example.com/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(request)
});

// Response is a Task object:
// { id, status: "working", ... }
// Updates come via SSE streaming`}</CodeBlock>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">
        A2A + ACP: A Task That Crosses the Boundary
      </h3>
      <CodeBlock title="typescript">{`// Step 1: Internal agent (COO) creates a task that needs external analysis
// ACP delegation: COO → Data Lead → Data Worker (internal, via ACP)

// Step 2: Data Worker determines this needs external specialist
// ACP escalation: { reason: "OUT_OF_DOMAIN", body: "Need specialized ML model for time-series" }

// Step 3: A2A Gateway receives escalation
// Discovers external ML agent via Agent Card matching skill: "time-series-analysis"

// Step 4: A2A task sent to external agent
// External agent processes, streams updates back

// Step 5: A2A completion received by Gateway
// Gateway creates ACP completion message back to Data Lead
// ACP completion: { summary: "Time-series analysis complete. Report attached." }

// Step 6: ACP completion flows up to COO
// Full chain: COO → Lead → Worker → A2A → External → back up the chain`}</CodeBlock>

      <hr className="my-8 border-white/10" />

      {/* How They Complement */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        How They Complement Each Other
      </h2>
      <p className="mb-4 text-slate-400">
        ACP and A2A are designed to be used together, and they share some structural similarities
        that make integration natural:
      </p>
      <div className="mb-6 overflow-x-auto">
        <table className="w-full text-sm text-slate-400 border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-6 text-left font-semibold text-slate-300">Similarity</th>
              <th className="py-2 pr-6 text-left font-semibold text-cyan-400">ACP</th>
              <th className="py-2 text-left font-semibold text-purple-400">A2A</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[
              ["Stateful tasks", "✅ Full lifecycle", "✅ Full lifecycle"],
              ["Streaming updates", "✅ SSE-based", "✅ SSE-based"],
              ["Task history", "✅ Activity log", "✅ Task messages list"],
            ].map(([sim, acp, a2a]) => (
              <tr key={sim}>
                <td className="py-2 pr-6">{sim}</td>
                <td className="py-2 pr-6 text-green-400">{acp}</td>
                <td className="py-2 text-green-400">{a2a}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mb-4 text-slate-400">
        The main difference is in the communication model: ACP is typed and hierarchical; A2A is
        generic and flat.
      </p>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">
        Future: ACP as an A2A Extension
      </h3>
      <p className="mb-4 text-slate-400">
        A2A supports an extension mechanism for additional capabilities. ACP message semantics —
        typed acks, escalations, and completions — could be formalized as an A2A extension, allowing
        A2A-compatible agents to opt into richer intra-org communication:
      </p>
      <CodeBlock title="agent-card.json (with ACP extension)">{`{
  "name": "openspawn-org-agent",
  "extensions": [
    {
      "uri": "urn:openspawn:acp:v1",
      "required": false,
      "config": {
        "supportsAck": true,
        "supportsProgress": true,
        "supportsEscalation": true,
        "escalationReasons": ["BLOCKED", "OUT_OF_DOMAIN", "LOW_CONFIDENCE"]
      }
    }
  ]
}`}</CodeBlock>
      <p className="mb-8 text-slate-400">
        This would let any A2A-compatible framework gradually adopt ACP semantics — getting richer
        organizational communication without abandoning A2A compatibility.
      </p>

      <hr className="my-8 border-white/10" />

      {/* Summary */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Summary</h2>
      <p className="mb-4 text-slate-400">
        You don't have to choose between ACP and A2A. They solve different problems:
      </p>
      <ul className="mb-4 list-disc pl-6 text-slate-400 space-y-2">
        <li>
          <strong className="text-slate-200">ACP</strong> makes your org's internal communication
          structured, visible, and debuggable. It's the reason you can look at an escalation rate
          dashboard and know your engineering team is struggling.
        </li>
        <li>
          <strong className="text-slate-200">A2A</strong> makes your org interoperable with the
          broader agent ecosystem. It's the reason your OpenSpawn org can call a LangGraph agent or
          accept tasks from a CrewAI pipeline without either side knowing the other's internals.
        </li>
      </ul>
      <div className="mb-8 rounded-lg border border-white/5 bg-white/[0.02] px-5 py-4 text-sm text-slate-300">
        Think of it this way:{" "}
        <strong>ACP is how your team works. A2A is how your team works with everyone else.</strong>
      </div>

      <hr className="my-8 border-white/10" />

      {/* Further Reading */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Further Reading</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          to="/docs/guides/connecting-agents"
          className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-4 transition hover:border-white/10 hover:bg-white/[0.04] no-underline"
        >
          <div className="text-sm font-semibold text-slate-200 mb-1">Connecting Real Agents →</div>
          <div className="text-xs text-slate-500">How to configure ACP behavior in your ORG.md</div>
        </Link>
        <a
          href="https://a2a-protocol.org"
          target="_blank"
          rel="noopener"
          className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-4 transition hover:border-white/10 hover:bg-white/[0.04] no-underline"
        >
          <div className="text-sm font-semibold text-slate-200 mb-1">A2A Protocol Docs →</div>
          <div className="text-xs text-slate-500">Google's official A2A specification</div>
        </a>
        <Link
          to="/docs/guides/dashboard-guide"
          className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-4 transition hover:border-white/10 hover:bg-white/[0.04] no-underline"
        >
          <div className="text-sm font-semibold text-slate-200 mb-1">Dashboard Guide →</div>
          <div className="text-xs text-slate-500">See ACP metrics live in the dashboard</div>
        </Link>
        <Link
          to="/docs/protocols/a2a"
          className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-4 transition hover:border-white/10 hover:bg-white/[0.04] no-underline"
        >
          <div className="text-sm font-semibold text-slate-200 mb-1">A2A Protocol Reference →</div>
          <div className="text-xs text-slate-500">OpenSpawn's A2A implementation details</div>
        </Link>
      </div>
    </DocsLayout>
  );
}
