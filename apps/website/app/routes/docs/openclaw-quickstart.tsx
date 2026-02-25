import { DocsLayout, CodeBlock } from "../../components/docs-layout";
import { Link } from "@tanstack/react-router";
import { useTitle } from "../../hooks/use-title";

export function OpenClawQuickstart() {
  useTitle("OpenClaw Integration");
  return (
    <DocsLayout>
      <h1 className="mb-2 text-4xl font-bold text-slate-100">OpenSpawn for OpenClaw Agents</h1>
      <p className="mb-8 text-lg text-slate-400">
        You have agents. Give them an organization. 5-minute guide.
      </p>

      <div className="mb-8 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        🦞 Already running OpenClaw with multiple agents? This guide shows you how to add organizational structure without changing your existing setup.
      </div>

      {/* Section 1 */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">What you have</h2>
      <p className="mb-4 text-slate-400">
        A typical OpenClaw multi-agent setup — isolated agents that can message each other:
      </p>
      <CodeBlock title="openclaw.json">{`{
  "agents": {
    "list": [
      { "id": "sandy", "workspace": "~/.openclaw/workspace-sandy", "model": "anthropic/claude-opus-4-6" },
      { "id": "spongebob", "workspace": "~/.openclaw/workspace-spongebob" },
      { "id": "squidward", "workspace": "~/.openclaw/workspace-squidward" }
    ]
  },
  "bindings": [
    { "agentId": "sandy", "match": { "channel": "telegram" } },
    { "agentId": "spongebob", "match": { "channel": "whatsapp" } }
  ],
  "tools": {
    "agentToAgent": { "enabled": true, "allow": ["sandy", "spongebob", "squidward"] }
  }
}`}</CodeBlock>
      <p className="text-slate-400">
        This gives you isolated agents that can message each other. But they don't know who's in charge, what team they're on, or how to coordinate.
      </p>

      {/* Section 2 */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">What OpenSpawn adds</h2>
      <p className="mb-4 text-slate-400">
        <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-400">ORG.md</code> defines the structure that sits on top of your OpenClaw agents. Same agents, now with context about their role, team, hierarchy, and policies.
      </p>
      <CodeBlock title="ORG.md">{`# 🍍 BikiniBottom Inc.
> Mission: Ship fast, stay weird, protect the reef.

## Culture: startup

## Structure
### 🔬 Science Division
- **Sandy Cheeks** (L9, lead) — Research & architecture
  - Patrick Star (L5) — Testing & QA
  - Gary (L3) — Data collection

### 🍔 Operations
- **SpongeBob** (L7, lead) — Day-to-day ops
  - Squidward (L5) — Code quality & reviews
  - Larry (L4) — DevOps & infrastructure

## Policies
- L7+ agents use event-driven communication (wake on escalation)
- L1-6 agents poll for tasks (cost-efficient)
- All code changes require peer review before merge
- Escalate blockers to team lead within 1 hour`}</CodeBlock>

      {/* Section 3 */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Step by step</h2>

      <h3 className="mt-6 mb-3 text-lg font-semibold text-slate-200">1. Add ORG.md to each agent's workspace</h3>
      <CodeBlock title="bash">{`# Copy ORG.md to each agent workspace
cp ORG.md ~/.openclaw/workspace-sandy/
cp ORG.md ~/.openclaw/workspace-spongebob/
cp ORG.md ~/.openclaw/workspace-squidward/`}</CodeBlock>

      <h3 className="mt-6 mb-3 text-lg font-semibold text-slate-200">2. Tell agents to read ORG.md</h3>
      <p className="mb-4 text-slate-400">Add to each agent's <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-400">AGENTS.md</code>:</p>
      <CodeBlock title="AGENTS.md">{`## Organization
Read \`ORG.md\` at the start of every session. It defines:
- Your role and level in the org
- Your team and who you report to
- Org-wide policies that apply to your work
- Communication protocols (escalation, delegation)

Treat ORG.md as authoritative for organizational decisions.`}</CodeBlock>

      <h3 className="mt-6 mb-3 text-lg font-semibold text-slate-200">3. Launch the OpenSpawn dashboard (optional)</h3>
      <CodeBlock title="bash">{`npx openspawn start
# Opens dashboard at http://localhost:3333/app/`}</CodeBlock>
      <p className="text-slate-400">
        The dashboard gives you real-time visibility into your agent org — network graph, task flow, credit usage, escalation chains.
      </p>

      {/* Section 4 */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">What changes for your agents</h2>
      <ul className="space-y-3 text-slate-400">
        <li><strong className="text-slate-200">Sandy</strong> now knows she's L9 Science lead — she delegates research to Patrick, not SpongeBob</li>
        <li><strong className="text-slate-200">SpongeBob</strong> knows to escalate architecture questions to Sandy, not try to solve them himself</li>
        <li><strong className="text-slate-200">Squidward</strong> knows his role is code quality — he reviews, not builds</li>
        <li><strong className="text-slate-200">All agents</strong> follow the same policies — peer review, escalation timelines, communication protocols</li>
        <li><strong className="text-slate-200">Credits</strong> are tracked per-department, so you know which team is burning through budget</li>
      </ul>

      {/* Section 5 */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Going further</h2>
      <ul className="space-y-2 text-slate-400">
        <li><Link to="/org-md" className="text-cyan-400 hover:underline">Organization as Code</Link> — Deep dive into ORG.md</li>
        <li><Link to="/docs/features/dashboard" className="text-cyan-400 hover:underline">Dashboard</Link> — Real-time agent visualization</li>
        <li><Link to="/docs/protocols/a2a" className="text-cyan-400 hover:underline">A2A Protocol</Link> — External agent discovery</li>
        <li><Link to="/docs/protocols/mcp" className="text-cyan-400 hover:underline">MCP Tools</Link> — Connect to other platforms</li>
        <li><a href="https://openclaw.ai" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">OpenClaw Documentation</a> — OpenClaw docs & guides</li>
      </ul>

      {/* Callout */}
      <div className="mt-10 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        OpenSpawn doesn't replace OpenClaw — it extends it. OpenClaw handles routing, isolation, and communication. OpenSpawn adds the organizational layer that makes multi-agent coordination actually work.
      </div>
    </DocsLayout>
  );
}
