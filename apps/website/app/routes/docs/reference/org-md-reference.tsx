import { Link } from "@tanstack/react-router";
import { DocsLayout, CodeBlock } from "../../../components/docs-layout";
import { Callout, CalloutBlock } from "../../../components/callout";
import { useTitle } from "../../../hooks/use-title";

export function OrgMdReference() {
  useTitle("ORG.md Reference");
  return (
    <DocsLayout>
      <h1 className="mb-2 text-4xl font-bold text-slate-100">ORG.md Reference</h1>
      <p className="mb-8 text-lg text-slate-400">
        Complete reference for <code className="inline-code">ORG.md</code> — the OpenSpawn
        organization definition format. Every field, section, value, and example.
      </p>

      <CodeBlock title="Deploy your org">{`npx openspawn deploy ORG.md`}</CodeBlock>

      <p className="mb-8 text-slate-400">
        If you want a quick introduction before diving in, see the{" "}
        <Link
          to="/docs/tutorials/your-first-org-md"
          className="text-cyan-400 hover:text-cyan-300 transition"
        >
          Your First ORG.md
        </Link>{" "}
        tutorial.
      </p>

      <hr className="my-8 border-white/10" />

      {/* ── Why Markdown? ──────────────────────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Why Markdown?</h2>
      <p className="mb-4 text-slate-400">
        ORG.md uses plain markdown instead of YAML, JSON, or a DSL. This is a deliberate design
        decision:
      </p>
      <ul className="mb-6 list-disc pl-6 text-slate-400 space-y-2">
        <li>
          <strong className="text-slate-200">Human-readable:</strong> Non-technical stakeholders can
          read and review org changes in a PR — no need to learn a schema
        </li>
        <li>
          <strong className="text-slate-200">AI-native:</strong> Every LLM can read and write
          markdown. Agents can parse their own org definition without a custom parser
        </li>
        <li>
          <strong className="text-slate-200">Prose is config:</strong> Free-text descriptions become
          system prompt context. There's no separate "config" vs "docs" — the documentation{" "}
          <em>is</em> the configuration
        </li>
        <li>
          <strong className="text-slate-200">Git-friendly:</strong> Diffs are meaningful, blame
          shows who changed what, PRs let teams discuss org changes the same way they discuss code
        </li>
        <li>
          <strong className="text-slate-200">Lenient:</strong> Missing sections use defaults.
          Unknown fields are ignored. A 3-line file is valid. No schema validation errors to fight
        </li>
      </ul>

      <hr className="my-8 border-white/10" />

      {/* ── Overview ──────────────────────────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Overview</h2>
      <p className="mb-4 text-slate-400">
        An <code className="inline-code">ORG.md</code> file has five top-level sections.{" "}
        <strong className="text-slate-200">All sections are optional</strong> — the system uses
        sensible defaults for anything omitted. A minimal 3-line file produces a functional
        single-agent org.
      </p>
      <CodeBlock title="ORG.md structure">{`# Organization Name

## Identity
## Culture
## Structure
## Policies
## Playbooks`}</CodeBlock>

      <p className="mb-4 text-slate-400">
        The file is parsed by OpenSpawn's org parser, which extracts:
      </p>
      <ul className="mb-6 list-disc pl-6 text-slate-400 space-y-1">
        <li>
          <strong className="text-slate-200">Structured data</strong> from bullet lists:{" "}
          <code className="inline-code">- **Key:** Value</code>
        </li>
        <li>
          <strong className="text-slate-200">Context</strong> from free text (becomes system prompt
          context for agents)
        </li>
        <li>
          <strong className="text-slate-200">Hierarchy</strong> from heading levels (H3 =
          department, H4 = team member)
        </li>
      </ul>

      <hr className="my-8 border-white/10" />

      {/* ── Section: Identity ─────────────────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Section: Identity</h2>
      <p className="mb-4 text-slate-400">
        Defines who the organization is. This context is inherited by every agent in the org — it's
        ambient background in their system prompt.
      </p>
      <CodeBlock title="ORG.md">{`## Identity

We build developer tools that make infrastructure invisible.
Every agent in this org serves that mission.

- **Industry:** Developer tools / SaaS
- **Stage:** Series A, 18 months old
- **Values:** Ship fast, measure everything, customers first`}</CodeBlock>

      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Field</th>
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Type</th>
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Default</th>
              <th className="py-2 text-left font-medium text-slate-400">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-400">
            <tr>
              <td className="py-2 pr-4">
                <code className="inline-code">Industry</code>
              </td>
              <td className="py-2 pr-4">string</td>
              <td className="py-2 pr-4">—</td>
              <td className="py-2">Business domain; gives agents market context</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">
                <code className="inline-code">Stage</code>
              </td>
              <td className="py-2 pr-4">string</td>
              <td className="py-2 pr-4">—</td>
              <td className="py-2">Company stage (Seed, Series A, etc.)</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">
                <code className="inline-code">Values</code>
              </td>
              <td className="py-2 pr-4">string</td>
              <td className="py-2 pr-4">—</td>
              <td className="py-2">Core values; influences agent decision-making</td>
            </tr>
          </tbody>
        </table>
      </div>
      <Callout variant="info" className="mb-6">
        Write the Identity section as if onboarding a new employee — that's exactly how agents use
        it.
      </Callout>

      <hr className="my-8 border-white/10" />

      {/* ── Section: Culture ──────────────────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Section: Culture</h2>
      <p className="mb-4 text-slate-400">
        Controls how agents communicate — escalation speed, progress update frequency,
        acknowledgment requirements, and hierarchy depth. Maps directly to{" "}
        <Link
          to="/docs/concepts/acp-vs-a2a"
          className="text-cyan-400 hover:text-cyan-300 transition"
        >
          Agent Communication Protocol (ACP)
        </Link>{" "}
        parameters.
      </p>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Using a Preset</h3>
      <CodeBlock title="ORG.md">{`## Culture

preset: startup`}</CodeBlock>

      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Preset</th>
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Escalation</th>
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Progress</th>
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Hierarchy</th>
              <th className="py-2 text-left font-medium text-slate-400">Vibe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-400">
            {[
              [
                "startup",
                "Immediate",
                "Frequent",
                "2–3 levels",
                "Fast, scrappy, everyone does everything",
              ],
              [
                "enterprise",
                "Batched (hourly)",
                "On phase change",
                "5–8 levels",
                "Process-driven, governance",
              ],
              ["agency", "Immediate", "Every tick", "3–4 levels", "Client-facing, deadline-driven"],
              ["research", "Delayed", "On request", "2–3 levels", "Exploratory, high autonomy"],
              [
                "military",
                "Immediate",
                "Every tick",
                "Strict chain",
                "Zero ambiguity, mandatory acks",
              ],
              ["remote-async", "Delayed", "On request", "Flat", "High trust, timezone-distributed"],
            ].map(([preset, esc, prog, hier, vibe]) => (
              <tr key={preset}>
                <td className="py-2 pr-4">
                  <code className="inline-code">{preset}</code>
                </td>
                <td className="py-2 pr-4">{esc}</td>
                <td className="py-2 pr-4">{prog}</td>
                <td className="py-2 pr-4">{hier}</td>
                <td className="py-2">{vibe}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Overriding Preset Values</h3>
      <CodeBlock title="ORG.md">{`## Culture

preset: startup
- **Escalation:** delayed — our leads handle it themselves
- **Progress updates:** every tick — we want full visibility`}</CodeBlock>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">All Culture Fields</h3>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Field</th>
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Valid Values</th>
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Default</th>
              <th className="py-2 text-left font-medium text-slate-400">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-400">
            {[
              [
                "preset",
                "startup, enterprise, agency, research, military, remote-async",
                "None",
                "Baseline communication profile",
              ],
              [
                "Communication",
                "async-first, sync-preferred, mixed",
                "async-first",
                "Default communication mode",
              ],
              [
                "Escalation",
                "immediate, batched, delayed",
                "immediate",
                "How quickly blockers propagate upward",
              ],
              [
                "Progress updates",
                "every tick, on phase change, on request",
                "on phase change",
                "How often agents report progress",
              ],
              [
                "Ack required",
                "yes, no",
                "yes",
                "Whether agents must acknowledge task assignments",
              ],
              [
                "Hierarchy depth",
                "Any descriptive string",
                "Inferred from Structure",
                "Maximum org depth hint",
              ],
            ].map(([field, vals, def_, desc]) => (
              <tr key={field}>
                <td className="py-2 pr-4">
                  <code className="inline-code">{field}</code>
                </td>
                <td className="py-2 pr-4 text-xs">{vals}</td>
                <td className="py-2 pr-4">{def_}</td>
                <td className="py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <hr className="my-8 border-white/10" />

      {/* ── Section: Structure ────────────────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Section: Structure</h2>
      <p className="mb-4 text-slate-400">
        The org chart. Defines departments, roles, agent counts, and hierarchy. This is the most
        important section for most use cases.
      </p>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">
        Heading Levels and Hierarchy
      </h3>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Heading Level</th>
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Meaning</th>
              <th className="py-2 text-left font-medium text-slate-400">Agent Level Range</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-400">
            {[
              ["## Structure", "Section marker", "—"],
              ["### Department or C-Level", "Top-level role or department head", "L9–10"],
              ["#### Team Member Role", "Department member", "L4–7"],
              ["##### Sub-role or Junior", "Junior agent", "L1–3"],
            ].map(([h, m, l]) => (
              <tr key={h}>
                <td className="py-2 pr-4">
                  <code className="inline-code text-xs">{h}</code>
                </td>
                <td className="py-2 pr-4">{m}</td>
                <td className="py-2">{l}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CodeBlock title="ORG.md">{`## Structure

### COO
The operational backbone. Receives orders from the human principal.
- **Model:** claude-sonnet
- **Domain:** operations

### Engineering

#### Engineering Lead
Triages technical work. Delegates to specialists. Reviews output.
- **Model:** claude-sonnet
- **Domain:** engineering

#### Backend Senior
Owns API, database, and server infrastructure.
- **Model:** claude-haiku
- **Domain:** backend
- **Count:** 2

#### Frontend Workers
- **Model:** claude-haiku
- **Domain:** frontend
- **Count:** 3`}</CodeBlock>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Role Fields</h3>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Field</th>
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Required</th>
              <th className="py-2 text-left font-medium text-slate-400">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-400">
            {[
              ["Model", "❌", "LLM to use for this role"],
              ["Domain", "❌", "Expertise domain for task routing"],
              ["Reports to", "❌", 'Override inferred parent (role name or "Human Principal")'],
              ["Count", "❌", "Spawn N identical agents with this role (auto-numbered)"],
              ["Level", "❌", "Explicit level override (1–10)"],
              ["Tools", "❌", "Comma-separated tool capabilities"],
            ].map(([field, req, desc]) => (
              <tr key={field}>
                <td className="py-2 pr-4">
                  <code className="inline-code">{field}</code>
                </td>
                <td className="py-2 pr-4">{req}</td>
                <td className="py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Model Values</h3>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-6 text-left font-medium text-slate-400">Value</th>
              <th className="py-2 text-left font-medium text-slate-400">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-400">
            {[
              ["claude-opus", "Anthropic Claude Opus — most capable, highest cost"],
              ["claude-sonnet", "Anthropic Claude Sonnet — balanced performance and cost"],
              ["claude-haiku", "Anthropic Claude Haiku — fast, efficient, lower cost"],
              ["gpt-4o", "OpenAI GPT-4o"],
              ["same-as-lead", "Inherit model from the department lead"],
              ["fastest", "Resolved to the fastest available model"],
              ["cheapest", "Resolved to the cheapest available model"],
              ["(omitted)", "Uses org-level default, or system default"],
            ].map(([val, desc]) => (
              <tr key={val}>
                <td className="py-2 pr-6">
                  <code className="inline-code">{val}</code>
                </td>
                <td className="py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Role Level Keywords</h3>
      <p className="mb-4 text-slate-400">Agent level is inferred from keywords in the role name:</p>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Keyword</th>
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Level</th>
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Can Delegate?</th>
              <th className="py-2 text-left font-medium text-slate-400">Can Spawn?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-400">
            {[
              ["COO, CTO, CEO", "L10", "✅", "✅"],
              ["VP, Director", "L9", "✅", "✅"],
              ["Lead, Manager", "L7", "✅", "✅"],
              ["Senior, Principal", "L6", "✅", "❌"],
              ["Worker, Engineer, Agent", "L4", "❌", "❌"],
              ["Junior, Intern, Assistant", "L1–2", "❌", "❌"],
            ].map(([kw, level, del_, spawn]) => (
              <tr key={kw}>
                <td className="py-2 pr-4">
                  <code className="inline-code text-xs">{kw}</code>
                </td>
                <td className="py-2 pr-4 text-cyan-400">{level}</td>
                <td className="py-2 pr-4">{del_}</td>
                <td className="py-2">{spawn}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">The Count Field</h3>
      <p className="mb-4 text-slate-400">
        <code className="inline-code">Count</code> creates multiple agents with the same role,
        auto-numbered: "Backend Senior 1", "Backend Senior 2", etc. Each is an independent agent
        with its own task queue and trust score.
      </p>
      <CodeBlock title="ORG.md">{`#### API Workers
Handle REST API requests and background jobs.
- **Model:** claude-haiku
- **Domain:** api
- **Count:** 4
# → Creates: API Worker 1, API Worker 2, API Worker 3, API Worker 4`}</CodeBlock>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Prose as System Prompt</h3>
      <p className="mb-4 text-slate-400">
        The text description above each role (before the first{" "}
        <code className="inline-code">- **Field:**</code>) becomes part of that agent's system
        prompt context:
      </p>
      <CodeBlock title="ORG.md">{`#### QA Engineer
Reviews PRs for correctness, coverage, and edge cases.
Focus on security implications and performance regressions.
Be conservative — a false positive is better than a miss.
- **Model:** claude-haiku
- **Domain:** testing`}</CodeBlock>
      <Callout variant="info" className="mb-6">
        The prose above the bullet list becomes the agent's behavioral context. Write it like you're
        onboarding a real employee.
      </Callout>

      <hr className="my-8 border-white/10" />

      {/* ── Section: Policies ─────────────────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Section: Policies</h2>
      <p className="mb-4 text-slate-400">
        Rules that the system enforces. Budget limits, routing logic, permissions, department caps,
        and working hours. These are not suggestions — OpenSpawn enforces them.
      </p>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Budget</h3>
      <CodeBlock title="ORG.md">{`## Policies

### Budget
- **Per-agent limit:** 1000 credits/period
- **Alert threshold:** 80%
- **Overage behavior:** pause and escalate
- **Period:** weekly`}</CodeBlock>

      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Field</th>
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Default</th>
              <th className="py-2 text-left font-medium text-slate-400">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-400">
            {[
              ["Per-agent limit", "Unlimited", "Credit limit per agent per period"],
              ["Alert threshold", "80%", "Trigger alert at this % of budget consumed"],
              [
                "Overage behavior",
                "pause and escalate",
                "pause and escalate | hard stop | allow with alert",
              ],
              ["Period", "weekly", "daily | weekly | monthly | per-task"],
            ].map(([field, def_, desc]) => (
              <tr key={field}>
                <td className="py-2 pr-4">
                  <code className="inline-code">{field}</code>
                </td>
                <td className="py-2 pr-4">{def_}</td>
                <td className="py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          {
            val: "pause and escalate",
            desc: "Agent pauses, manager is alerted and decides next action (recommended)",
          },
          { val: "hard stop", desc: "Agent immediately terminates the task" },
          {
            val: "allow with alert",
            desc: "Agent continues but an alert is sent — use with caution",
          },
        ].map(({ val, desc }) => (
          <div key={val} className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
            <code className="inline-code text-xs mb-2 block">{val}</code>
            <p className="text-xs text-slate-400">{desc}</p>
          </div>
        ))}
      </div>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Permissions</h3>
      <CodeBlock title="ORG.md">{`### Permissions
- **L7+ can create tasks** — leads and above can break work into subtasks
- **L7+ can spawn agents** — leads can grow their team (up to department cap)
- **L6+ can review** — seniors and above can approve/reject work
- **All agents can escalate** — nobody should be silently stuck`}</CodeBlock>

      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-6 text-left font-medium text-slate-400">Permission</th>
              <th className="py-2 text-left font-medium text-slate-400">Typical Threshold</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-400">
            {[
              ["Can create tasks", "L7 (Lead)"],
              ["Can spawn agents", "L7 (Lead)"],
              ["Can review / approve", "L6 (Senior)"],
              ["Can escalate", "All agents (L1+)"],
              ["Can cancel tasks", "L9 (Director)"],
              ["Can modify org structure", "L10 (C-level)"],
            ].map(([perm, thresh]) => (
              <tr key={perm}>
                <td className="py-2 pr-6">{perm}</td>
                <td className="py-2 text-cyan-400">{thresh}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Department Caps</h3>
      <CodeBlock title="ORG.md">{`### Department Caps
- Engineering: max 10 agents
- Security: max 4 agents
- Marketing: max 6 agents
- No department can exceed 15 agents without human approval`}</CodeBlock>
      <p className="mb-6 text-slate-400">
        Caps prevent runaway agent spawning. When a lead tries to spawn beyond the cap, the action
        is denied and escalated to the human principal.
      </p>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Working Hours</h3>
      <CodeBlock title="ORG.md">{`### Working Hours
- **Active hours:** 08:00-22:00 (org timezone)
- **Off-hours behavior:** queue tasks, don't process
- **Exceptions:** critical priority tasks process 24/7`}</CodeBlock>

      <hr className="my-8 border-white/10" />

      {/* ── Section: Playbooks ────────────────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Section: Playbooks</h2>
      <p className="mb-4 text-slate-400">
        Reusable procedures for common situations. Like runbooks, but for your agent org. Agents can
        reference playbooks when they encounter the named scenario.
      </p>
      <CodeBlock title="ORG.md">{`## Playbooks

### New Task Arrives
1. COO receives task from Human Principal
2. COO categorizes by domain and priority
3. COO delegates to appropriate department lead
4. Lead acks and breaks into subtasks if needed
5. Lead assigns to available workers by trust score
6. Workers ack and begin

### Escalation: BLOCKED
1. Agent creates escalation with blocker details
2. Escalation goes to direct manager (never skip levels)
3. Manager has 2 cycles to respond
4. If unresolved after 2 levels, alert Human Principal

### New Agent Onboarding
1. New agent spawned by a lead
2. First 3 tasks are LOW priority (warm-up period)
3. Trust score starts at 30 (PROBATION)
4. After 5 successful tasks: promoted to TRUSTED
5. After 20 successful tasks: eligible for VETERAN`}</CodeBlock>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Built-In Playbook Triggers</h3>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-6 text-left font-medium text-slate-400">Trigger</th>
              <th className="py-2 text-left font-medium text-slate-400">When It's Used</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-400">
            {[
              ["New Task Arrives", "A task is created and assigned"],
              ["Escalation: BLOCKED", "An agent escalates with reason BLOCKED"],
              ["Escalation: OUT_OF_DOMAIN", "An agent receives a task outside their domain"],
              ["New Agent Onboarding", "An agent is spawned for the first time"],
              ["Weekly Review", "Automated weekly org health check"],
              ["Agent Promoted", "An agent's trust score crosses a level threshold"],
            ].map(([trigger, when]) => (
              <tr key={trigger}>
                <td className="py-2 pr-6">
                  <code className="inline-code">{trigger}</code>
                </td>
                <td className="py-2">{when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <hr className="my-8 border-white/10" />

      {/* ── Parsing Rules ─────────────────────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Parsing Rules</h2>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Structured Data Extraction</h3>
      <p className="mb-4 text-slate-400">
        Any bullet in the format <code className="inline-code">- **Key:** Value</code> is extracted
        as a structured field:
      </p>
      <CodeBlock title="Parsed examples">{`- **Model:** claude-sonnet         → { model: "claude-sonnet" }
- **Count:** 3                     → { count: 3 }
- **Per-agent limit:** 1000        → { per_agent_limit: 1000 }
- **Alert threshold:** 80%         → { alert_threshold: 0.8 }`}</CodeBlock>

      <CalloutBlock variant="success" className="mb-6">
        <strong>Lenient parsing:</strong> ORG.md parsing is intentionally forgiving — missing
        sections use sensible defaults, unknown fields are ignored (future-proofing), malformed
        structured data falls back to prose, and a 3-line file is valid.
      </CalloutBlock>

      <hr className="my-8 border-white/10" />

      {/* ── CLI Commands ──────────────────────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">CLI Commands</h2>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Deploy</h3>
      <CodeBlock title="bash">{`# Deploy from a file — creates agents and starts the org
npx openspawn deploy ORG.md

# Dry run — shows what would be created without deploying
npx openspawn deploy ORG.md --dry-run

# Deploy with a culture override
npx openspawn deploy ORG.md --culture=enterprise`}</CodeBlock>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Apply (Live Update)</h3>
      <CodeBlock title="bash">{`# Apply changes from an updated ORG.md to a running org
npx openspawn apply ORG.md`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        <code className="inline-code">apply</code> diffs the current state against the new file:
      </p>
      <ul className="mb-6 list-disc pl-6 text-slate-400 space-y-1">
        <li>
          <strong className="text-slate-200">New roles</strong> → spawn agents
        </li>
        <li>
          <strong className="text-slate-200">Removed roles</strong> → gracefully wind down (finish
          current tasks, then deactivate)
        </li>
        <li>
          <strong className="text-slate-200">Changed policies</strong> → apply immediately
        </li>
        <li>
          <strong className="text-slate-200">Changed culture</strong> → update ACP parameters live
        </li>
        <li>
          <strong className="text-slate-200">Changed descriptions</strong> → update system prompts
          on next tick
        </li>
      </ul>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Export</h3>
      <CodeBlock title="bash">{`# Export the current running org state to ORG.md
npx openspawn export > ORG.md`}</CodeBlock>
      <p className="mb-6 text-slate-400">
        Export captures dynamically spawned agents (created at runtime by leads), making them
        permanent in the file. The exported file becomes the new source of truth.
      </p>

      <hr className="my-8 border-white/10" />

      {/* ── Version Control ───────────────────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Version Control Workflow</h2>
      <p className="mb-4 text-slate-400">
        <code className="inline-code">ORG.md</code> is a text file — it's designed to live in git.
      </p>
      <CodeBlock title="bash">{`# See what changed in your org
git diff ORG.md

# History of all org changes
git log ORG.md

# Who changed the escalation policy and why?
git blame ORG.md`}</CodeBlock>

      <Callout variant="info" className="mb-6">
        PR reviews for org changes let teams discuss: "Do we need a full team or just one analyst?"
        — the same way you'd review infrastructure-as-code.
      </Callout>

      <hr className="my-8 border-white/10" />

      {/* ── Complete Examples ─────────────────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Complete Examples</h2>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">
        Solo Developer + Agent Team
      </h3>
      <CodeBlock title="ORG.md">{`# My Dev Team

## Culture
preset: startup

## Structure

### Me (Human Principal)
I make the decisions. Agents do the work.

### Code Agent
Writes code, runs tests, submits PRs.
- **Model:** claude-sonnet
- **Domain:** fullstack

### Review Agent
Reviews PRs, checks for bugs and style issues.
- **Model:** claude-haiku
- **Domain:** code-review

### Docs Agent
Keeps documentation in sync with code changes.
- **Model:** claude-haiku
- **Domain:** documentation`}</CodeBlock>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">
        Engineering Organization (Startup)
      </h3>
      <CodeBlock title="ORG.md">{`# Acme Engineering

## Identity
We build developer tools that make infrastructure invisible.
- **Industry:** Developer tools / SaaS
- **Stage:** Series A
- **Values:** Ship fast, measure everything, customers first

## Culture
preset: startup
- **Escalation:** immediate — we're too small to batch problems
- **Progress updates:** on phase change

## Structure

### COO
- **Model:** claude-sonnet
- **Domain:** operations

### Engineering

#### Engineering Lead
- **Model:** claude-sonnet
- **Domain:** engineering

#### Backend Senior
- **Model:** claude-haiku
- **Domain:** backend
- **Count:** 2

#### Frontend Workers
- **Model:** claude-haiku
- **Domain:** frontend
- **Count:** 3

## Policies

### Budget
- **Per-agent limit:** 1000 credits/period
- **Alert threshold:** 80%
- **Overage behavior:** pause and escalate
- **Period:** weekly

### Department Caps
- Engineering: max 10 agents
- Security: max 4 agents`}</CodeBlock>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Research Lab</h3>
      <CodeBlock title="ORG.md">{`# AI Research Lab

## Culture
preset: research
- **Escalation:** delayed — let researchers explore before flagging blockers

## Structure

### Principal Investigator
Sets research direction. Reviews findings.
- **Model:** claude-opus
- **Domain:** ml-research

### Senior Researchers
- **Model:** claude-sonnet
- **Domain:** experimentation
- **Count:** 2

### Research Assistants
- **Model:** claude-haiku
- **Domain:** data-collection
- **Count:** 3

## Policies

### Budget
- **Per-agent limit:** 5000 credits/period
- **Overage behavior:** allow with alert
- **Period:** monthly`}</CodeBlock>

      <hr className="my-8 border-white/10" />

      {/* ── Org Health ────────────────────────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        Org Health &amp; Self-Healing
      </h2>
      <p className="mb-4 text-slate-400">
        Running orgs are monitored automatically. The health score (0–100) is computed from:
      </p>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Component</th>
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Weight</th>
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Healthy</th>
              <th className="py-2 text-left font-medium text-slate-400">Unhealthy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-400">
            {[
              ["Ack latency", "15%", "< 1 cycle", "> 3 cycles"],
              ["Escalation rate", "20%", "< 10% of tasks", "> 30%"],
              ["Completion rate", "25%", "> 90%", "< 70%"],
              ["Budget utilization", "15%", "40–80%", "< 20% or > 95%"],
              ["Agent idle rate", "10%", "< 30%", "> 60%"],
              ["Time-to-completion", "15%", "Trending down", "Trending up"],
            ].map(([component, weight, healthy, unhealthy]) => (
              <tr key={component}>
                <td className="py-2 pr-4">{component}</td>
                <td className="py-2 pr-4 text-cyan-400">{weight}</td>
                <td className="py-2 pr-4 text-emerald-400">{healthy}</td>
                <td className="py-2 text-rose-400">{unhealthy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        {[
          {
            score: "90–100",
            label: "Elite",
            desc: "Highly efficient, minimal waste",
            color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
          },
          {
            score: "70–89",
            label: "Healthy",
            desc: "Normal operations, minor inefficiencies",
            color: "border-cyan-500/20 bg-cyan-500/5 text-cyan-400",
          },
          {
            score: "50–69",
            label: "Needs attention",
            desc: "Bottlenecks or misrouting",
            color: "border-amber-500/20 bg-amber-500/5 text-amber-400",
          },
          {
            score: "< 50",
            label: "Restructure recommended",
            desc: "Systemic issues",
            color: "border-red-500/20 bg-red-500/5 text-red-400",
          },
        ].map(({ score, label, desc, color }) => (
          <div key={score} className={`rounded-lg border px-4 py-3 ${color}`}>
            <span className="font-bold">{score}</span>
            <span className="mx-2">—</span>
            <span className="font-semibold">{label}</span>
            <p className="mt-1 text-xs opacity-80">{desc}</p>
          </div>
        ))}
      </div>

      <CodeBlock title="Example recommendations">{`🔴 Critical: Engineering escalation rate is 35% (threshold: 10%)
   → Add 1 senior backend agent
   → Estimated 20% reduction in escalation rate

🟡 Warning: Marketing has 2 idle agents while Security is overloaded
   → Cross-train 1 marketing worker for security tasks

🟢 Optimization: Agent "Backend Senior 2" has 98% success rate over 50 tasks
   → Promote to Lead, create Backend sub-team`}</CodeBlock>

      <Callout variant="info" className="mb-6">
        Recommendations are suggestions. A human approves via the dashboard or by modifying{" "}
        <code className="inline-code">ORG.md</code>.
      </Callout>

      <hr className="my-8 border-white/10" />

      {/* ── Relationship to Other Standards ───────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        Relationship to Other Standards
      </h2>
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Standard</th>
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Scope</th>
              <th className="py-2 text-left font-medium text-slate-400">Relationship to ORG.md</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-400">
            {[
              [
                "CLAUDE.md",
                "One agent's behavior",
                "ORG.md wraps multiple agents; each role description is that agent's implicit CLAUDE.md",
              ],
              [
                "AGENTS.md",
                "Workspace rules",
                "ORG.md is the superset — workspace rules + org structure + policies",
              ],
              [
                "ACP",
                "Communication protocol",
                "ORG.md's Culture section configures ACP parameters",
              ],
              [
                "A2A",
                "Inter-org communication",
                "ORG.md defines one org; A2A connects multiple orgs",
              ],
              [
                "Terraform / Pulumi",
                "Infrastructure as code",
                "ORG.md is the same pattern applied to agent organizations",
              ],
            ].map(([std, scope, rel]) => (
              <tr key={std}>
                <td className="py-2 pr-4">
                  <code className="inline-code">{std}</code>
                </td>
                <td className="py-2 pr-4">{scope}</td>
                <td className="py-2">{rel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <hr className="my-8 border-white/10" />

      {/* ── SDLC Presets ──────────────────────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">SDLC Presets</h2>
      <p className="mb-4 text-slate-400">
        SDLC presets configure development lifecycle rules — review requirements, testing mandates,
        and deployment gates. Set via <code className="inline-code">sdlc: preset-name</code> in the
        Culture section.
      </p>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Preset</th>
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Review</th>
              <th className="py-2 pr-4 text-left font-medium text-slate-400">Tests</th>
              <th className="py-2 text-left font-medium text-slate-400">Deploy Gate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-400">
            {[
              ["standard", "L6+ required", "Required before merge", "CI pass + approval"],
              [
                "strict",
                "2 reviewers (L7+)",
                "Coverage threshold 80%",
                "CI + security scan + approval",
              ],
              ["solo", "Self-review OK", "Optional", "CI pass"],
              ["research", "No review", "None", "None — exploratory"],
            ].map(([preset, review, tests, deploy]) => (
              <tr key={preset}>
                <td className="py-2 pr-4">
                  <code className="inline-code">{preset}</code>
                </td>
                <td className="py-2 pr-4">{review}</td>
                <td className="py-2 pr-4">{tests}</td>
                <td className="py-2">{deploy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CodeBlock title="ORG.md">{`## Culture
preset: startup
sdlc: strict`}</CodeBlock>

      <hr className="my-8 border-white/10" />

      {/* ── Workspace Strategy ─────────────────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Workspace Strategy</h2>
      <p className="mb-4 text-slate-400">
        Each agent operates in an isolated workspace to prevent conflicts. The default strategy is{" "}
        <strong className="text-slate-200">worktree-per-agent</strong> — each agent gets a git
        worktree branched from main.
      </p>
      <CodeBlock title="Workspace isolation">{`Agent: Backend Senior 1
  Worktree: .worktrees/backend-senior-1/
  Branch:   agent/backend-senior-1
  Base:     main

Agent: Backend Senior 2
  Worktree: .worktrees/backend-senior-2/
  Branch:   agent/backend-senior-2
  Base:     main`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        When an agent completes a task, its changes are merged back to main via PR. Conflicts are
        escalated to the agent's lead.
      </p>

      <hr className="my-8 border-white/10" />

      {/* ── Lifecycle ──────────────────────────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Org Lifecycle</h2>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Deployment</h3>
      <CodeBlock title="bash">{`npx openspawn deploy ORG.md           # Create org from scratch
npx openspawn deploy ORG.md --dry-run  # Preview without creating`}</CodeBlock>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Upgrading</h3>
      <CodeBlock title="bash">{`npx openspawn apply ORG.md    # Diff current state → apply changes
# New roles → spawn | Removed roles → graceful wind-down
# Changed policies → immediate | Changed prose → next tick`}</CodeBlock>

      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-200">Teardown</h3>
      <CodeBlock title="bash">{`npx openspawn destroy          # Graceful shutdown
# 1. All agents finish in-flight tasks
# 2. Results written to RESULT.md
# 3. State exported to ORG.md.bak
# 4. Server stops`}</CodeBlock>

      <hr className="my-8 border-white/10" />

      {/* ── Relationship to CONTRIBUTING.md ─────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        Relationship to CONTRIBUTING.md
      </h2>
      <p className="mb-4 text-slate-400">
        ORG.md and CONTRIBUTING.md serve different but complementary purposes:
      </p>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-4 text-left font-medium text-slate-400"></th>
              <th className="py-2 pr-4 text-left font-medium text-slate-400">ORG.md</th>
              <th className="py-2 text-left font-medium text-slate-400">CONTRIBUTING.md</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-400">
            {[
              ["Audience", "AI agents", "Human contributors"],
              [
                "Scope",
                "Org structure, roles, policies, culture",
                "Dev setup, PR conventions, testing",
              ],
              ["Parsed by", "OpenSpawn org parser", "Read by humans"],
              ["Changes", "openspawn apply ORG.md", "Manual process"],
              [
                "Enforced",
                "Programmatically (budget, permissions, routing)",
                "By review (code review, CI)",
              ],
            ].map(([dim, org, contrib]) => (
              <tr key={dim}>
                <td className="py-2 pr-4 font-medium text-slate-300">{dim}</td>
                <td className="py-2 pr-4">{org}</td>
                <td className="py-2">{contrib}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mb-6 text-slate-400">
        In practice, ORG.md is the superset for agent teams. Human contributors still use
        CONTRIBUTING.md. When agents create PRs, they follow both: ORG.md for org-level policies
        (budget, escalation) and CONTRIBUTING.md for repo-level conventions (commit format, test
        requirements).
      </p>

      <hr className="my-8 border-white/10" />

      {/* ── Further Reading ───────────────────────────────────────────────── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Further Reading</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          to="/docs/tutorials/your-first-org-md"
          className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-4 transition hover:border-white/10 hover:bg-white/[0.04] no-underline"
        >
          <div className="text-sm font-semibold text-slate-200 mb-1">Your First ORG.md →</div>
          <div className="text-xs text-slate-500">Step-by-step tutorial</div>
        </Link>
        <Link
          to="/docs/protocols/mcp-reference"
          className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-4 transition hover:border-white/10 hover:bg-white/[0.04] no-underline"
        >
          <div className="text-sm font-semibold text-slate-200 mb-1">
            MCP Tools & Integrations →
          </div>
          <div className="text-xs text-slate-500">Connect agents to your org via MCP</div>
        </Link>
        <Link
          to="/docs/concepts/acp-vs-a2a"
          className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-4 transition hover:border-white/10 hover:bg-white/[0.04] no-underline"
        >
          <div className="text-sm font-semibold text-slate-200 mb-1">
            Agent Communication Protocol →
          </div>
          <div className="text-xs text-slate-500">How agents communicate within an org</div>
        </Link>
        <Link
          to="/docs/comparison"
          className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-4 transition hover:border-white/10 hover:bg-white/[0.04] no-underline"
        >
          <div className="text-sm font-semibold text-slate-200 mb-1">Framework Comparison →</div>
          <div className="text-xs text-slate-500">OpenSpawn vs CrewAI vs LangGraph</div>
        </Link>
        <Link
          to="/docs/getting-started"
          className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-4 transition hover:border-white/10 hover:bg-white/[0.04] no-underline"
        >
          <div className="text-sm font-semibold text-slate-200 mb-1">Getting Started →</div>
          <div className="text-xs text-slate-500">Full deployment walkthrough</div>
        </Link>
      </div>
    </DocsLayout>
  );
}
