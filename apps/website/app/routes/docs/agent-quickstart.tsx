import { Link } from "@tanstack/react-router";
import { DocsLayout, CodeBlock } from "../../components/docs-layout";
import { useTitle } from "../../hooks/use-title";

export function AgentQuickstart() {
  useTitle("Agent Quickstart");

  return (
    <DocsLayout>
      <h1 className="mb-2 text-4xl font-bold text-slate-100">
        Agent Quickstart
      </h1>
      <p className="mb-4 text-slate-400">
        You are an AI agent that needs to coordinate other agents. OpenSpawn
        gives you an org chart, task routing, escalation protocols, and a credit
        system — defined in a single markdown file.
      </p>

      {/* ── Three commands to a running org ── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        Three commands to a running org
      </h2>

      <CodeBlock title="Terminal">
        {`openspawn init my-org --template=assistant-team --yes
cd my-org
openspawn start
openspawn status`}
      </CodeBlock>

      <p className="mb-4 text-slate-400">
        That's it. You now have a running org with a chief of staff, research
        analyst, content team, engineer, security auditor, and quality mentor —
        with OpenClaw gateway configs ready to apply.
      </p>

      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">Q: Do I need API keys?</strong>
        <br />
        A: No. Demo/simulation mode works out of the box with zero
        configuration.
      </div>

      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">Q: What just happened?</strong>
        <br />
        A: <code className="inline-code">init</code> created{" "}
        <code className="inline-code">ORG.md</code> (your org definition) and{" "}
        <code className="inline-code">openclaw-agents.json</code>.{" "}
        <code className="inline-code">start</code> read the agents config and
        generated <code className="inline-code">openclaw-patch.json</code> with
        OpenClaw gateway entries.{" "}
        <code className="inline-code">status</code> displayed a table of all
        agents with their name, level, model, workspace, and reports-to.
      </div>

      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">
          Q: What is openclaw-patch.json?
        </strong>
        <br />
        A: A ready-to-apply patch for your OpenClaw gateway's{" "}
        <code className="inline-code">agents.list</code>. Each entry has:{" "}
        <code className="inline-code">id</code>,{" "}
        <code className="inline-code">model</code> (opus for L7+, sonnet for
        L6-), <code className="inline-code">workspace</code>,{" "}
        <code className="inline-code">tools.profile: "full"</code>. Manager
        agents (L7+ with direct reports) also get{" "}
        <code className="inline-code">subagents.allowAgents</code>. The
        highest-level agent gets{" "}
        <code className="inline-code">default: true</code>.
      </div>

      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">
          Q: How do I apply the patch to my gateway?
        </strong>
        <br />
        A: Copy the entries from{" "}
        <code className="inline-code">openclaw-patch.json</code> into your
        OpenClaw <code className="inline-code">agents.list</code> configuration,
        then restart the gateway.
      </div>

      {/* ── Pick a template ── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        Pick a template
      </h2>

      <p className="mb-4 text-slate-400">
        Four templates ship with OpenSpawn. Each produces a complete ORG.md you
        can use immediately or customize.
      </p>

      <CodeBlock title="Templates">
        {`# Personal AI team (chief of staff + specialists)
openspawn init my-org --template=assistant-team

# Content production pipeline
openspawn init my-org --template=content-agency

# Software development team
openspawn init my-org --template=dev-shop

# Research & analysis team
openspawn init my-org --template=research-lab`}
      </CodeBlock>

      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">
          Q: Which template should I use?
        </strong>
        <br />
        <CodeBlock title="Decision tree">
          {`What's your primary output?
├── Code/software         → dev-shop
├── Content (blogs, docs) → content-agency
├── Research/analysis     → research-lab
└── Mix of everything     → assistant-team`}
        </CodeBlock>
      </div>

      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">
          Q: Can I combine templates?
        </strong>
        <br />
        A: Yes. Pick one as a starting point, then add agents from other
        templates into the Structure section of your ORG.md.
      </div>

      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">
          Q: Can I create agents not in any template?
        </strong>
        <br />
        A: Absolutely. Templates are starting points. Add any agent to the{" "}
        <code className="inline-code">## Structure</code> section with a name,
        level, domain, and reporting line.
      </div>

      {/* ── Understanding ORG.md ── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        Understanding ORG.md
      </h2>

      <p className="mb-4 text-slate-400">
        Your entire org lives in one file. Five sections, all optional except
        Structure.
      </p>

      <CodeBlock title="ORG.md structure">
        {`# My Organization

## Mission
What the org exists to do.

## Culture
preset: startup
values: [speed, autonomy, transparency]

## Credits
pool: 1000
refill: daily

## Structure
### CEO — L10 — Executive
- Reports to: none
- Domain: everything
- Budget: unlimited

### Engineer — L6 — Software
- Reports to: CEO
- Domain: code, infrastructure
- Budget: 100/day

## Policies
- All code changes require review from L6+
- Escalate security issues immediately`}
      </CodeBlock>

      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">
          Q: What's the minimum viable ORG.md?
        </strong>
        <br />
        <CodeBlock title="Minimal ORG.md">
          {`# My Org

## Structure
### Assistant — L7 — General
- Reports to: none
- Domain: all tasks`}
        </CodeBlock>
      </div>

      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">Q: What do levels mean?</strong>
        <br />
        A: L1–L5: Workers. L6: Can review. L7–L9: Can create tasks/spawn
        agents. L10: Executive.
      </div>

      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">Q: What's "Reports to"?</strong>
        <br />
        A: Defines the escalation chain. When an agent is blocked, it escalates
        to whoever it reports to.
      </div>

      {/* ── Validate your org ── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        Validate your org
      </h2>

      <CodeBlock title="Terminal">
        {`openspawn validate ORG.md`}
      </CodeBlock>

      <CodeBlock title="Example output">
        {`✔ Structure: 6 agents found
✔ Hierarchy: all agents have valid report chains
✔ Levels: no conflicts detected
✔ Credits: pool and budgets are consistent
✔ Policies: 2 policies parsed

Result: ORG.md is valid ✅`}
      </CodeBlock>

      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">
          Q: If I see "validation failed", what do I do?
        </strong>
        <br />
        A: Common fixes:
        <ul className="mt-2 ml-4 list-disc">
          <li>
            <strong className="text-slate-200">
              "Agent X reports to unknown agent"
            </strong>{" "}
            — check the spelling of the Reports-to name
          </li>
          <li>
            <strong className="text-slate-200">"Circular hierarchy"</strong> —
            make sure no agent chain loops back on itself
          </li>
          <li>
            <strong className="text-slate-200">"Missing Structure section"</strong>{" "}
            — add a <code className="inline-code">## Structure</code> heading
          </li>
          <li>
            <strong className="text-slate-200">"Budget exceeds pool"</strong> —
            increase the pool or reduce agent budgets
          </li>
        </ul>
      </div>

      {/* ── Culture presets ── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        Culture presets
      </h2>

      <p className="mb-4 text-slate-400">
        Culture presets configure escalation speed, update frequency, and
        autonomy defaults.
      </p>

      <div className="mb-6 overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-700 text-slate-300">
              <th className="px-3 py-2">Preset</th>
              <th className="px-3 py-2">Best for</th>
              <th className="px-3 py-2">Escalation</th>
              <th className="px-3 py-2">Progress updates</th>
            </tr>
          </thead>
          <tbody className="text-slate-400">
            <tr className="border-b border-slate-800">
              <td className="px-3 py-2 text-slate-200">startup</td>
              <td className="px-3 py-2">Fast-moving small teams</td>
              <td className="px-3 py-2">Aggressive (escalate fast)</td>
              <td className="px-3 py-2">Frequent</td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="px-3 py-2 text-slate-200">enterprise</td>
              <td className="px-3 py-2">Compliance-heavy orgs</td>
              <td className="px-3 py-2">Formal (chain of command)</td>
              <td className="px-3 py-2">Scheduled</td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="px-3 py-2 text-slate-200">agency</td>
              <td className="px-3 py-2">Client-facing work</td>
              <td className="px-3 py-2">Moderate</td>
              <td className="px-3 py-2">Per-deliverable</td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="px-3 py-2 text-slate-200">research</td>
              <td className="px-3 py-2">Deep exploration</td>
              <td className="px-3 py-2">Relaxed (high autonomy)</td>
              <td className="px-3 py-2">On completion</td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="px-3 py-2 text-slate-200">military</td>
              <td className="px-3 py-2">Critical ops, strict chains</td>
              <td className="px-3 py-2">Immediate</td>
              <td className="px-3 py-2">Continuous</td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="px-3 py-2 text-slate-200">remote-async</td>
              <td className="px-3 py-2">Distributed async teams</td>
              <td className="px-3 py-2">Patient (batch escalations)</td>
              <td className="px-3 py-2">Daily digest</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">
          Q: Can I override specific settings in a preset?
        </strong>
        <br />
        A: Yes. Set the preset, then override individual values:
        <CodeBlock title="ORG.md — Culture section">
          {`## Culture
preset: startup
escalation: relaxed    # override just this one
values: [speed, autonomy]`}
        </CodeBlock>
      </div>

      {/* ── Interacting via MCP ── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        Interacting via MCP
      </h2>

      <p className="mb-4 text-slate-400">
        OpenSpawn exposes an MCP (Model Context Protocol) server for
        programmatic interaction.
      </p>

      <CodeBlock title="MCP tool examples">
        {`# Create and assign a task
task_create {
  title: "Implement the login endpoint",
  assigneeId: "engineer",
  priority: "high"
}

# Check agent status
agent_whoami

# Escalate an issue
escalation_create {
  taskId: "task-abc123",
  reason: "Blocked on database credentials",
  targetAgentId: "ceo"
}

# Request consensus
consensus_request {
  taskId: "task-abc123",
  question: "Should we use PostgreSQL or SQLite?",
  voterIds: ["engineer", "security-auditor", "ceo"]
}`}
      </CodeBlock>

      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">Q: How do I authenticate?</strong>
        <br />
        A: HMAC authentication with{" "}
        <code className="inline-code">AGENT_ID</code> and{" "}
        <code className="inline-code">AGENT_SECRET</code> environment variables.
      </div>

      <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong className="text-slate-200">
          Q: What's the full tool list?
        </strong>
        <br />
        A: See{" "}
        <Link to="/docs/llms-txt" className="text-cyan-400 underline">
          docs/llms.txt
        </Link>
        .
      </div>

      {/* ── Common workflows ── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        Common workflows
      </h2>

      <h3 className="mt-6 mb-3 text-lg font-semibold text-slate-200">
        Delegate a task
      </h3>
      <CodeBlock title="Delegate workflow">
        {`# 1. Choose the right agent based on domain
openspawn status                        # see who's available

# 2. Delegate
openspawn delegate --to engineer \\
  --task "Add rate limiting to /api/auth" \\
  --priority high

# 3. Monitor
openspawn status --agent engineer       # check progress
openspawn logs --agent engineer --tail   # stream logs`}
      </CodeBlock>

      <h3 className="mt-6 mb-3 text-lg font-semibold text-slate-200">
        Handle an escalation
      </h3>
      <CodeBlock title="Escalation workflow">
        {`# 1. An agent escalates to you
# → You receive: "engineer is blocked: needs DB credentials"

# 2. Resolve or re-delegate
openspawn delegate --to security-auditor \\
  --task "Provision DB credentials for engineer" \\
  --priority urgent

# 3. Notify the blocked agent
openspawn notify --agent engineer \\
  --message "Security auditor is provisioning your credentials"`}
      </CodeBlock>

      <h3 className="mt-6 mb-3 text-lg font-semibold text-slate-200">
        Request consensus
      </h3>
      <CodeBlock title="Consensus workflow">
        {`# 1. Pose a question to multiple agents
openspawn consensus \\
  --question "Should we migrate to PostgreSQL?" \\
  --voters engineer,security-auditor,research-analyst

# 2. Wait for votes (async)
openspawn consensus --status

# 3. Review results
openspawn consensus --results
# → engineer: yes (performance benefits)
# → security-auditor: yes (better audit logging)
# → research-analyst: yes (industry standard)
# → Decision: unanimous yes`}
      </CodeBlock>

      {/* ── Error recovery ── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        Error recovery
      </h2>

      <div className="mb-6 overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-700 text-slate-300">
              <th className="px-3 py-2">You see</th>
              <th className="px-3 py-2">Run this</th>
            </tr>
          </thead>
          <tbody className="text-slate-400">
            <tr className="border-b border-slate-800">
              <td className="px-3 py-2">
                <code className="inline-code">ERR_NO_ORG</code>
              </td>
              <td className="px-3 py-2">
                <code className="inline-code">openspawn init my-org</code>
              </td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="px-3 py-2">
                <code className="inline-code">ERR_INVALID_STRUCTURE</code>
              </td>
              <td className="px-3 py-2">
                <code className="inline-code">openspawn validate ORG.md</code>{" "}
                — fix the reported issues
              </td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="px-3 py-2">
                <code className="inline-code">ERR_CIRCULAR_HIERARCHY</code>
              </td>
              <td className="px-3 py-2">
                Check "Reports to" chains for loops
              </td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="px-3 py-2">
                <code className="inline-code">ERR_BUDGET_EXCEEDED</code>
              </td>
              <td className="px-3 py-2">
                <code className="inline-code">openspawn credits --refill</code>{" "}
                or increase pool in ORG.md
              </td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="px-3 py-2">
                <code className="inline-code">ERR_AGENT_NOT_FOUND</code>
              </td>
              <td className="px-3 py-2">
                <code className="inline-code">openspawn status</code> — verify
                agent name spelling
              </td>
            </tr>
            <tr className="border-b border-slate-800">
              <td className="px-3 py-2">
                <code className="inline-code">ERR_GATEWAY_UNREACHABLE</code>
              </td>
              <td className="px-3 py-2">
                <code className="inline-code">openclaw gateway status</code> —
                ensure gateway is running
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Next steps ── */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        Next steps
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/docs/reference/org-md-reference"
          className="group rounded-lg border border-slate-700 bg-slate-800/50 p-4 transition hover:border-cyan-500/50"
        >
          <h3 className="mb-1 font-semibold text-slate-100 group-hover:text-cyan-400">
            Customize ORG.md →
          </h3>
          <p className="text-sm text-slate-400">
            Full reference for every section, field, and option in your org
            definition.
          </p>
        </Link>

        <Link
          to="/docs/getting-started"
          className="group rounded-lg border border-slate-700 bg-slate-800/50 p-4 transition hover:border-cyan-500/50"
        >
          <h3 className="mb-1 font-semibold text-slate-100 group-hover:text-cyan-400">
            Getting Started →
          </h3>
          <p className="text-sm text-slate-400">
            Step-by-step guide to deploying your first OpenSpawn org.
          </p>
        </Link>

        <Link
          to="/docs/protocols/mcp-reference"
          className="group rounded-lg border border-slate-700 bg-slate-800/50 p-4 transition hover:border-cyan-500/50"
        >
          <h3 className="mb-1 font-semibold text-slate-100 group-hover:text-cyan-400">
            MCP Tools Reference →
          </h3>
          <p className="text-sm text-slate-400">
            Every MCP tool, parameter, and return value for programmatic access.
          </p>
        </Link>

        <Link
          to="/templates"
          className="group rounded-lg border border-slate-700 bg-slate-800/50 p-4 transition hover:border-cyan-500/50"
        >
          <h3 className="mb-1 font-semibold text-slate-100 group-hover:text-cyan-400">
            Explore Templates →
          </h3>
          <p className="text-sm text-slate-400">
            Ready-to-deploy ORG.md templates for common agent team structures.
          </p>
        </Link>
      </div>
    </DocsLayout>
  );
}
