import { Link } from "@tanstack/react-router";
import { DocsLayout, CodeBlock } from "../../components/docs-layout";
import { Callout } from "../../components/callout";
import { useTitle } from "../../hooks/use-title";

export function ComparisonPage() {
  useTitle("OpenSpawn vs CrewAI vs LangGraph");
  return (
    <DocsLayout>
      <h1 className="mb-2 text-4xl font-bold text-slate-100">OpenSpawn vs CrewAI vs LangGraph</h1>
      <p className="mb-8 text-lg text-slate-400">
        A detailed, honest comparison of the three most popular multi-agent frameworks in 2026 —
        feature tables, tradeoffs, and migration guides.
      </p>

      <Callout variant="info" className="mb-8">
        <strong>Bottom line up front:</strong> CrewAI and LangGraph are excellent <em>execution</em>{" "}
        frameworks. OpenSpawn is <em>coordination infrastructure</em>. They solve different problems
        — and they're designed to work together.
      </Callout>

      <hr className="my-8 border-white/10" />

      {/* ── Feature Comparison Table ──────────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Feature Comparison</h2>
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-4 text-left font-semibold text-slate-300">Feature</th>
              <th className="py-2 pr-4 text-left font-semibold text-cyan-400">OpenSpawn</th>
              <th className="py-2 pr-4 text-left font-semibold text-violet-400">CrewAI</th>
              <th className="py-2 text-left font-semibold text-emerald-400">LangGraph</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-400">
            {[
              [
                "Primary Model",
                "Coordination / control plane",
                "Agent execution framework",
                "Graph-based orchestration",
              ],
              ["Languages", "TypeScript + Python SDKs", "Python", "Python"],
              [
                "Agent Hierarchy",
                "10-level hierarchy, roles, trust scores",
                "Flat crews",
                "Flat nodes",
              ],
              ["Org Definition", "ORG.md (markdown)", "Python code", "Python code"],
              [
                "Protocol Support",
                "MCP (native), A2A, REST, GraphQL",
                "Plugins",
                "LangChain tools",
              ],
              ["Real Device Support", "✅ Via OpenClaw", "❌", "❌"],
              [
                "Real-time Dashboard",
                "✅ React, network graph, live SSE",
                "❌ (CLI/LangSmith)",
                "❌ (LangSmith)",
              ],
              ["Self-hosted", "✅ MIT open source", "✅ Open source", "✅ Open source"],
              ["Budget / Credits", "✅ Built-in economic layer", "❌", "❌"],
              [
                "Approval Gates",
                "✅ Pre-hooks before irreversible actions",
                "❌",
                "Conditional edges",
              ],
              ["Trust / Reputation", "✅ Per-agent trust scores", "❌", "❌"],
              ["Escalation System", "✅ Typed escalation with chain of command", "❌", "❌"],
              ["Framework Agnostic", "✅ Works with any A2A/MCP agent", "❌", "❌"],
              [
                "Pricing",
                "Free, self-hosted",
                "Free + Enterprise (paid)",
                "Free + LangSmith (paid)",
              ],
              [
                "Production Maturity",
                "Early-stage, actively developed",
                "Production-ready",
                "Production-ready",
              ],
            ].map(([feature, os, crewai, langgraph]) => (
              <tr key={feature}>
                <td className="py-2 pr-4 font-medium text-slate-300">{feature}</td>
                <td className="py-2 pr-4">{os}</td>
                <td className="py-2 pr-4">{crewai}</td>
                <td className="py-2">{langgraph}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <hr className="my-8 border-white/10" />

      {/* ── Where Each Shines ─────────────────────────────────────────────── */}
      <h2 className="mt-10 mb-6 text-2xl font-bold text-slate-100">Where Each Framework Shines</h2>

      {/* CrewAI */}
      <h3 className="mt-8 mb-3 text-xl font-semibold text-violet-400">
        CrewAI: Role-Based Task Crews
      </h3>
      <p className="mb-4 text-slate-400">
        CrewAI excels at defining small, focused agent teams ("crews") that work together on a
        shared task. Its Python-first API is clean, the role system is intuitive, and the LangChain
        ecosystem means you can connect to almost anything out of the box.
      </p>
      <div className="mb-4 rounded-lg border border-violet-500/20 bg-violet-500/5 px-5 py-4">
        <p className="mb-2 text-sm font-semibold text-violet-400">
          CrewAI is the right choice when:
        </p>
        <ul className="space-y-1 text-sm text-slate-400">
          <li>• You want to ship a multi-agent pipeline in Python, fast</li>
          <li>• Your use case is a single workflow with a clear beginning and end</li>
          <li>• You're already in the LangChain ecosystem</li>
          <li>• You want the largest framework community and most tutorials</li>
        </ul>
      </div>
      <Callout variant="warning" className="mb-6">
        <strong>The gap:</strong> CrewAI doesn't provide organizational structure. Multiple crews,
        running simultaneously, across a real product, have no shared governance. There's no budget
        system, no trust scores, no approval gates before irreversible actions.
      </Callout>

      {/* LangGraph */}
      <h3 className="mt-8 mb-3 text-xl font-semibold text-emerald-400">
        LangGraph: Stateful Agent Graphs
      </h3>
      <p className="mb-4 text-slate-400">
        LangGraph gives you precise, explicit control over agent flow as a directed graph. Each node
        is an agent or function. Edges define transitions. State is typed and checkpointed. For
        complex, multi-step reasoning workflows — especially ones that need to branch, loop, or
        resume — LangGraph is the most expressive option available.
      </p>
      <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
        <p className="mb-2 text-sm font-semibold text-emerald-400">
          LangGraph is the right choice when:
        </p>
        <ul className="space-y-1 text-sm text-slate-400">
          <li>• You need fine-grained control over agent execution flow</li>
          <li>• Your workflow has complex branching logic or cycles</li>
          <li>• You're building production pipelines where every state transition matters</li>
          <li>• You want excellent observability via LangSmith</li>
        </ul>
      </div>
      <Callout variant="warning" className="mb-6">
        <strong>The gap:</strong> LangGraph models agents as graph nodes — it's a powerful execution
        primitive. It doesn't model your <em>organization</em>. Who owns a node? Who approves its
        output? What happens when it goes over budget? LangGraph has no answer for these questions.
      </Callout>

      {/* OpenSpawn */}
      <h3 className="mt-8 mb-3 text-xl font-semibold text-cyan-400">
        OpenSpawn: Agent Coordination Infrastructure
      </h3>
      <p className="mb-4 text-slate-400">
        OpenSpawn is not a framework you write agents in. It's the <em>company infrastructure</em>{" "}
        that your agents (built in CrewAI, LangGraph, or anything else) operate within.
      </p>
      <p className="mb-4 text-slate-400">
        The mental model: agent frameworks are your employees' skills. OpenSpawn is the company —
        org chart, task management, budget, governance, communications.
      </p>
      <div className="mb-6 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-5 py-4">
        <p className="mb-2 text-sm font-semibold text-cyan-400">
          OpenSpawn is the right choice when:
        </p>
        <ul className="space-y-1 text-sm text-slate-400">
          <li>• You're running multiple agents across multiple workflows simultaneously</li>
          <li>• You need governance: budget limits, approval gates, trust scores</li>
          <li>
            • You want your org structure defined as code (
            <code className="inline-code">ORG.md</code>) and reviewable in git
          </li>
          <li>• Your agents need to work on real devices (via OpenClaw)</li>
          <li>
            • You need framework-agnostic coordination — mix CrewAI + LangGraph + custom agents in
            one org
          </li>
        </ul>
      </div>

      <hr className="my-8 border-white/10" />

      {/* ── Where OpenSpawn Wins ──────────────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Where OpenSpawn Wins</h2>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">
        1. Real-World Device Support
      </h3>
      <p className="mb-6 text-slate-400">
        Via deep integration with{" "}
        <a
          href="https://openclaw.ai"
          target="_blank"
          rel="noopener"
          className="text-cyan-400 hover:text-cyan-300 transition"
        >
          OpenClaw
        </a>
        , OpenSpawn agents can operate on real computers — browsing the web, running code,
        interacting with applications, managing files. No other coordination platform offers this.
      </p>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">
        2. ORG.md — Organizations as Code
      </h3>
      <CodeBlock title="ORG.md — SaaS Onboarding">{`# customer-onboarding
> Mission: Onboard new enterprise customers end-to-end

## Culture
- Preset: professional
- Escalation: 30 min — customers can't wait

## Structure

### Onboarding Lead
Owns the full customer journey from contract-signed to go-live.
- **Level:** 7
- **Model:** claude-sonnet

#### Data Migration Specialist
Moves and validates customer data from legacy systems safely.
- **Level:** 5
- **Model:** claude-haiku

#### Integration Engineer
Configures API connectors, runs integration tests, documents endpoints.
- **Level:** 5
- **Model:** claude-haiku

#### Success Agent
Schedules check-ins, collects health scores, flags churn risk early.
- **Level:** 4
- **Model:** ollama/qwen2.5`}</CodeBlock>
      <p className="mb-6 text-slate-400">
        Human-readable, version-controllable, and deployable:{" "}
        <code className="inline-code">npx openspawn deploy ORG.md</code>. The prose <em>is</em> the
        system prompt. See all{" "}
        <a href="/templates" className="text-cyan-400 hover:text-cyan-300 transition">
          industry templates →
        </a>
      </p>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">
        3. Protocol-Native from Day One
      </h3>
      <p className="mb-4 text-slate-400">OpenSpawn is built on open protocols:</p>
      <ul className="mb-6 list-disc pl-6 text-slate-400 space-y-2">
        <li>
          <strong className="text-slate-200">MCP (Model Context Protocol):</strong> Your org is
          exposed as 7 MCP tools, consumable by Claude Desktop, Cursor, or any MCP client — today
        </li>
        <li>
          <strong className="text-slate-200">A2A (Agent-to-Agent):</strong> Every agent has a{" "}
          <code className="inline-code">/.well-known/agent.json</code> discovery card for inter-org
          communication
        </li>
        <li>
          <strong className="text-slate-200">Streamable HTTP:</strong> Real-time SSE, no polling
        </li>
      </ul>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">4. Economic Layer</h3>
      <p className="mb-4 text-slate-400">
        OpenSpawn has a built-in credit system — not just rate limits, but a full economic model:
        per-agent credit budgets, automatic cost tracking against real LLM spend, and{" "}
        <code className="inline-code">overage behavior: pause and escalate</code>.
      </p>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">5. Governance Built-In</h3>
      <p className="mb-4 text-slate-400">
        Pre-hooks let you require human approval before any irreversible action — agent wants to
        deploy to production, agent about to exceed budget, agent submits output for review.
        LangGraph has conditional edges. CrewAI has human-in-the-loop options. Neither has a
        system-level governance layer that applies across all agents, all tasks, regardless of
        framework.
      </p>

      <hr className="my-8 border-white/10" />

      {/* ── Honest Assessment ─────────────────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        Honest Assessment: Where Competitors Are Ahead
      </h2>
      <Callout variant="info" className="mb-6">
        We believe in honest comparisons. Here's where CrewAI and LangGraph have real advantages
        today.
      </Callout>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] px-5 py-4">
          <p className="mb-2 text-sm font-semibold text-slate-200">Community & Ecosystem</p>
          <p className="text-xs text-slate-400">
            CrewAI has tens of thousands of stars. LangGraph has the full LangChain ecosystem.
            OpenSpawn is early-stage — community is small but growing.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.02] px-5 py-4">
          <p className="mb-2 text-sm font-semibold text-slate-200">Production Maturity</p>
          <p className="text-xs text-slate-400">
            CrewAI and LangGraph are running in production at scale. OpenSpawn is in rapid
            development — the core is solid, but some enterprise features are on the roadmap.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.02] px-5 py-4">
          <p className="mb-2 text-sm font-semibold text-slate-200">Python Ecosystem</p>
          <p className="text-xs text-slate-400">
            Both CrewAI and LangGraph are Python-first. OpenSpawn is TypeScript-first with a Python
            SDK on the roadmap. In the meantime, any language can integrate via REST API or MCP
            tools. If your team is all-Python, CrewAI/LangGraph will feel more native today.
          </p>
        </div>
      </div>

      <hr className="my-8 border-white/10" />

      {/* ── Migration Guides ──────────────────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        Switching From CrewAI to OpenSpawn
      </h2>
      <p className="mb-4 text-slate-400">
        OpenSpawn doesn't replace your CrewAI agents — it governs them. The migration is additive.
      </p>

      <p className="mb-2 text-slate-300 font-semibold">
        Step 1: Deploy OpenSpawn alongside your existing setup
      </p>
      <CodeBlock title="bash">{`git clone https://github.com/openspawn/openspawn.git
cd openspawn && pnpm install
pnpm exec nx serve sandbox`}</CodeBlock>

      <p className="mb-2 text-slate-300 font-semibold">Step 2: Map your crew structure to ORG.md</p>
      <CodeBlock title="ORG.md — Incident Response">{`# incident-response
> Mission: Detect, diagnose, and remediate production incidents

## Structure

### Incident Commander
Coordinates all agents, owns runbook execution, drives MTTR down.
- **Level:** 8
- **Model:** claude-opus

### Diagnostics
#### Diagnostics Agent
Reads logs, traces, metrics. Runs your existing CrewAI pipeline via MCP.
- **Level:** 6
- **Model:** claude-sonnet
- **Domain:** observability`}</CodeBlock>

      <p className="mb-2 text-slate-300 font-semibold">
        Step 3: Connect your CrewAI agents via MCP
      </p>
      <CodeBlock title="python">{`from crewai_tools import MCPServerAdapter

openspawn_tools = MCPServerAdapter(
    server_url="http://localhost:3333/mcp"
)

# Your agents can now delegate_task, list_agents, get_org_stats`}</CodeBlock>

      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        Switching From LangGraph to OpenSpawn
      </h2>

      <p className="mb-2 text-slate-300 font-semibold">
        Step 1: Expose your LangGraph workflow as an MCP tool
      </p>
      <CodeBlock title="python">{`from openspawn import OpenSpawn  # Python SDK: pip install openspawn
from langgraph.graph import StateGraph

app = workflow.compile()

client = OpenSpawnClient(url="http://localhost:3333")
client.register_agent(
    name="Research Pipeline",
    domain="research",
    capabilities=["web-search", "summarization"]
)`}</CodeBlock>

      <p className="mb-2 text-slate-300 font-semibold">Step 2: Delegate tasks through OpenSpawn</p>
      <CodeBlock title="python">{`# Before: call your graph directly
result = app.invoke({"task": "Research quantum computing trends"})

# After: delegate through OpenSpawn (governance, budget, audit trail included)
task = client.delegate_task(
    "Research quantum computing trends",
    priority="medium"
)`}</CodeBlock>

      <hr className="my-8 border-white/10" />

      {/* ── The Right Architecture ────────────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">The Right Architecture</h2>
      <p className="mb-4 text-slate-400">
        For most production agent teams, the answer isn't <em>either/or</em>:
      </p>
      <CodeBlock title="architecture">{`┌──────────────────────────────────────┐
│            OpenSpawn Org             │
│  (governance, budget, coordination)  │
│                                      │
│  ┌──────────┐    ┌────────────────┐  │
│  │ CrewAI   │    │   LangGraph    │  │
│  │ Agents   │    │   Pipelines    │  │
│  └──────────┘    └────────────────┘  │
│                                      │
│  ┌──────────┐    ┌────────────────┐  │
│  │ OpenClaw │    │  Custom Agent  │  │
│  │ (devices)│    │  (any A2A)     │  │
│  └──────────┘    └────────────────┘  │
└──────────────────────────────────────┘`}</CodeBlock>

      <hr className="my-8 border-white/10" />

      {/* ── Quick Decision Guide ──────────────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Quick Decision Guide</h2>
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-6 text-left font-semibold text-slate-300">You should use…</th>
              <th className="py-2 text-left font-semibold text-slate-300">When…</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-400">
            {[
              [
                "CrewAI",
                "You want the easiest Python framework, the largest community, and a clean role-based API for small-to-medium crews",
              ],
              [
                "LangGraph",
                "You need precise control over complex, stateful, multi-step agent flows with excellent observability",
              ],
              [
                "OpenSpawn",
                "You're coordinating multiple agent teams, need governance / budget / approval gates, or want your org in version control",
              ],
              [
                "OpenSpawn + CrewAI",
                "You want CrewAI's execution simplicity with organizational governance on top",
              ],
              [
                "OpenSpawn + LangGraph",
                "You want LangGraph's graph power with budget enforcement, trust scores, and a real-time dashboard",
              ],
            ].map(([use, when]) => (
              <tr key={use}>
                <td className="py-2 pr-6 font-medium text-slate-300 whitespace-nowrap">{use}</td>
                <td className="py-2">{when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <hr className="my-8 border-white/10" />

      {/* ── Further Reading ───────────────────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Further Reading</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          to="/docs/reference/org-md-reference"
          className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-4 transition hover:border-white/10 hover:bg-white/[0.04] no-underline"
        >
          <div className="text-sm font-semibold text-slate-200 mb-1">ORG.md Reference →</div>
          <div className="text-xs text-slate-500">Define your agent organization in markdown</div>
        </Link>
        <Link
          to="/docs/protocols/mcp-reference"
          className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-4 transition hover:border-white/10 hover:bg-white/[0.04] no-underline"
        >
          <div className="text-sm font-semibold text-slate-200 mb-1">
            MCP Tools & Integrations →
          </div>
          <div className="text-xs text-slate-500">Connect any MCP-capable agent to OpenSpawn</div>
        </Link>
        <Link
          to="/docs/concepts/acp-vs-a2a"
          className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-4 transition hover:border-white/10 hover:bg-white/[0.04] no-underline"
        >
          <div className="text-sm font-semibold text-slate-200 mb-1">
            Agent Communication Protocol →
          </div>
          <div className="text-xs text-slate-500">How agents coordinate inside an org</div>
        </Link>
        <Link
          to="/docs/getting-started"
          className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-4 transition hover:border-white/10 hover:bg-white/[0.04] no-underline"
        >
          <div className="text-sm font-semibold text-slate-200 mb-1">Getting Started →</div>
          <div className="text-xs text-slate-500">Deploy your first org in minutes</div>
        </Link>
      </div>

      <p className="mt-8 text-xs text-slate-600">
        Last updated: February 2026. OpenSpawn is in rapid development — features and integrations
        ship frequently. See the{" "}
        <a
          href="https://github.com/openspawn/openspawn"
          target="_blank"
          rel="noopener"
          className="text-slate-500 hover:text-slate-400 transition"
        >
          GitHub repo
        </a>{" "}
        for the latest.
      </p>
    </DocsLayout>
  );
}
