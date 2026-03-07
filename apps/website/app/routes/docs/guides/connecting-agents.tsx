import { Link } from "@tanstack/react-router";
import { DocsLayout, CodeBlock } from "../../../components/docs-layout";
import { Callout } from "../../../components/callout";
import { useTitle } from "../../../hooks/use-title";

export function ConnectingAgents() {
  useTitle("Connecting Real Agents");
  return (
    <DocsLayout>
      <h1 className="mb-2 text-4xl font-bold text-slate-100">Connecting Real Agents</h1>
      <p className="mb-8 text-lg text-slate-400">
        How to add real LLM-powered agents to your OpenSpawn org and watch them work.
      </p>

      <Callout className="mb-8">
        Your ORG.md describes the org. Real agents are what make it come alive.
      </Callout>

      <p className="mb-4 text-slate-400">
        So far you've written an ORG.md and seen how OpenSpawn parses it into a structure. Now it's
        time to connect actual LLM-powered agents — the workers that receive tasks, think, delegate,
        and complete real work.
      </p>
      <p className="mb-4 text-slate-400">This guide covers:</p>
      <ul className="mb-8 list-disc pl-6 text-slate-400 space-y-1">
        <li>What agents actually are in OpenSpawn</li>
        <li>How to configure models, tools, and capabilities in your ORG.md</li>
        <li>How the Agent Communication Protocol (ACP) works in practice</li>
        <li>A full walkthrough: adding a real agent and watching it work</li>
        <li>Troubleshooting common issues</li>
      </ul>

      {/* What Agents Are */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">What Agents Are in OpenSpawn</h2>
      <p className="mb-4 text-slate-400">
        An OpenSpawn agent is an{" "}
        <strong className="text-slate-200">LLM-powered worker with a role</strong>. Each agent:
      </p>
      <ol className="mb-4 list-decimal pl-6 text-slate-400 space-y-1">
        <li>
          <strong className="text-slate-200">Has a position in the org chart</strong> — defined by
          its level, parent, and domain
        </li>
        <li>
          <strong className="text-slate-200">Runs on a language model</strong> — configurable
          per-agent (GPT-4o, Claude, Gemini, etc.)
        </li>
        <li>
          <strong className="text-slate-200">Receives tasks</strong> — assigned by its manager or
          delegated from above
        </li>
        <li>
          <strong className="text-slate-200">Communicates via ACP</strong> — acknowledges, reports
          progress, escalates blockers, signals completion
        </li>
        <li>
          <strong className="text-slate-200">Earns a trust score</strong> — based on task success
          over time
        </li>
      </ol>
      <p className="mb-4 text-slate-400">
        Agents are not scripts. They're not hardcoded workflows. Each agent makes LLM-powered
        decisions on every tick: what to work on, when to delegate, when to escalate, when to call
        it done.
      </p>
      <CodeBlock title="agent profile">{`┌────────────────────────────────────────┐
│            An OpenSpawn Agent          │
│                                        │
│  Role: "Backend Engineer"              │
│  Level: L4 (Worker)                    │
│  Model: claude-haiku                   │
│  Domain: backend                       │
│  Trust score: 72 (TRUSTED)             │
│  Current task: "Fix auth bug #42"      │
│  Status: Working                       │
└────────────────────────────────────────┘`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        The agent doesn't know it's a software agent — it just knows it's a backend engineer with a
        task to complete. That's the power of the role-description approach.
      </p>

      {/* Configuring Agents */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Configuring Agents in ORG.md</h2>

      <h3 className="mt-6 mb-3 text-lg font-semibold text-slate-200">Choosing a Model</h3>
      <p className="mb-4 text-slate-400">
        Every agent in your org can run on a different model. You configure this in the{" "}
        <code className="inline-code">Structure</code> section of your ORG.md:
      </p>
      <CodeBlock title="ORG.md">{`## Structure

### Engineering Lead
Triages technical work. Delegates to specialists. Reviews output.
- **Model:** claude-sonnet
- **Domain:** engineering

#### Backend Worker
Owns API and database work.
- **Model:** claude-haiku
- **Domain:** backend`}</CodeBlock>
      <p className="mb-3 text-slate-400">
        <strong className="text-slate-200">Model aliases OpenSpawn understands:</strong>
      </p>
      <div className="mb-6 overflow-x-auto">
        <table className="w-full text-sm text-slate-400 border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-6 text-left font-semibold text-slate-300">Alias</th>
              <th className="py-2 text-left font-semibold text-slate-300">Resolves to</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[
              ["claude-opus", "anthropic/claude-opus-4"],
              ["claude-sonnet", "anthropic/claude-sonnet-4-5"],
              ["claude-haiku", "anthropic/claude-haiku-3-5"],
              ["gpt-4o", "openai/gpt-4o"],
              ["gpt-4o-mini", "openai/gpt-4o-mini"],
              ["gemini-pro", "google/gemini-1.5-pro"],
            ].map(([alias, resolves]) => (
              <tr key={alias}>
                <td className="py-2 pr-6">
                  <code className="inline-code">{alias}</code>
                </td>
                <td className="py-2">
                  <code className="inline-code">{resolves}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mb-3 text-slate-400">
        You can also use full provider/model paths:{" "}
        <code className="inline-code">anthropic/claude-sonnet-4-5</code>,{" "}
        <code className="inline-code">openai/gpt-4o-mini</code>, etc.
      </p>
      <p className="mb-3 text-slate-400">
        <strong className="text-slate-200">Practical guidance on model selection:</strong>
      </p>
      <div className="mb-6 overflow-x-auto">
        <table className="w-full text-sm text-slate-400 border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-6 text-left font-semibold text-slate-300">Role type</th>
              <th className="py-2 pr-6 text-left font-semibold text-slate-300">
                Recommended model
              </th>
              <th className="py-2 text-left font-semibold text-slate-300">Why</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[
              [
                "C-suite / Director",
                "claude-sonnet or gpt-4o",
                "High-stakes decisions, complex reasoning",
              ],
              ["Lead / Manager", "claude-sonnet or gpt-4o-mini", "Balance of capability and cost"],
              [
                "Worker / Engineer",
                "claude-haiku or gpt-4o-mini",
                "Fast, cheap, handles scoped tasks well",
              ],
              ["Research / Creative", "claude-sonnet or claude-opus", "Needs depth and nuance"],
            ].map(([role, model, why]) => (
              <tr key={role}>
                <td className="py-2 pr-6">{role}</td>
                <td className="py-2 pr-6">
                  <code className="inline-code">{model}</code>
                </td>
                <td className="py-2">{why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mt-6 mb-3 text-lg font-semibold text-slate-200">Giving Agents Capabilities</h3>
      <p className="mb-4 text-slate-400">
        Capabilities are the <strong className="text-slate-200">tools</strong> an agent can use.
        Configure them in the role description or as a structured field:
      </p>
      <CodeBlock title="ORG.md">{`#### Content Writer
Writes blog posts, social copy, and documentation.
Researches topics using web search before writing.
- **Model:** claude-haiku
- **Domain:** copywriting
- **Capabilities:** web-search, file-write`}</CodeBlock>
      <p className="mb-3 text-slate-400">Available built-in capabilities:</p>
      <div className="mb-6 overflow-x-auto">
        <table className="w-full text-sm text-slate-400 border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-6 text-left font-semibold text-slate-300">Capability</th>
              <th className="py-2 text-left font-semibold text-slate-300">What it does</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[
              ["web-search", "Agent can search the web for information"],
              ["file-read", "Agent can read files in the workspace"],
              ["file-write", "Agent can create and edit files"],
              ["code-exec", "Agent can run code in a sandbox"],
              ["api-call", "Agent can call external APIs (requires endpoint config)"],
              ["spawn-agent", "Agent can spawn sub-agents (L6+ only)"],
            ].map(([cap, desc]) => (
              <tr key={cap}>
                <td className="py-2 pr-6">
                  <code className="inline-code">{cap}</code>
                </td>
                <td className="py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mt-6 mb-3 text-lg font-semibold text-slate-200">
        Writing Effective Role Descriptions
      </h3>
      <p className="mb-4 text-slate-400">
        The prose you write above each role becomes the agent's{" "}
        <strong className="text-slate-200">system prompt context</strong>. This is the most powerful
        configuration you can provide — more than any structured field.
      </p>
      <p className="mb-2 text-slate-500 text-sm font-semibold uppercase tracking-wider">
        Weak description
      </p>
      <CodeBlock title="ORG.md">{`#### Backend Worker
- **Model:** claude-haiku
- **Domain:** backend`}</CodeBlock>
      <p className="mb-2 text-slate-500 text-sm font-semibold uppercase tracking-wider">
        Strong description
      </p>
      <CodeBlock title="ORG.md">{`#### Backend Worker
You own the API layer: REST endpoints, GraphQL schema, authentication, and database queries.
When you receive a task, break it down into the smallest safe change. Write tests first.
If a task touches security (auth, permissions, data access), tag it for Security Lead review before marking done.
- **Model:** claude-haiku
- **Domain:** backend`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        The second version gives the agent real behavioral guidance. It knows to write tests first.
        It knows which tasks need review. It knows what "owns the API layer" means. That guidance
        comes from your description, not from any configuration field.
      </p>

      {/* How ACP Works */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">How ACP Works in Practice</h2>
      <p className="mb-4 text-slate-400">
        When you deploy a real agent, it doesn't just receive tasks in silence. It communicates
        through <strong className="text-slate-200">ACP (Agent Communication Protocol)</strong> — a
        structured set of message types that model how effective human organizations actually
        communicate.
      </p>

      <h3 className="mt-6 mb-3 text-lg font-semibold text-slate-200">The Four Message Types</h3>

      <p className="mb-2 text-slate-300 font-semibold">1. Acknowledgment (ACK) — 👍</p>
      <p className="mb-4 text-slate-400">
        When your agent receives a task, it immediately sends a 👍 reaction to its delegator. This
        happens automatically — no LLM call required. It's the system saying "I got it."
      </p>
      <CodeBlock title="ACK flow">{`Engineering Lead assigns "Fix auth bug #42" to Backend Worker
Backend Worker → 👍 (immediate, auto-generated)
Engineering Lead sees: task was received`}</CodeBlock>

      <p className="mb-2 text-slate-300 font-semibold">2. Progress Updates</p>
      <p className="mb-4 text-slate-400">
        As the agent works, it writes progress entries to the task's activity log. These are{" "}
        <strong className="text-slate-200">pull-based</strong> — the manager checks when they want
        to, not on every update.
      </p>
      <CodeBlock title="progress log">{`Backend Worker → task log:
  "Reproducing the bug locally. Auth middleware is rejecting valid JWTs."
  
  [30 minutes later]
  
  "Root cause: token expiry check uses server time, not UTC. Fixing."`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        Progress updates happen on meaningful phase changes — not on every micro-action. The agent
        decides when something is worth logging.
      </p>

      <p className="mb-2 text-slate-300 font-semibold">3. Escalation — ⚠️</p>
      <p className="mb-4 text-slate-400">
        If the agent hits a blocker it can't resolve, it escalates to its direct manager:
      </p>
      <CodeBlock title="escalation">{`Backend Worker → Engineering Lead:
  ⚠️ BLOCKED on "Fix auth bug #42"
  
  Reason: BLOCKED
  "Need the JWT secret key to test the fix. It's not in the .env file 
   and I can't find it in the codebase. Can you provide it?"`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        The task status changes to <code className="inline-code">BLOCKED</code>. The manager sees it
        immediately — this is push-based, because blockers need attention now.
      </p>

      <p className="mb-2 text-slate-300 font-semibold">4. Completion — ✅</p>
      <p className="mb-4 text-slate-400">When the task is done:</p>
      <CodeBlock title="completion">{`Backend Worker → Engineering Lead:
  ✅ Completed: Fix auth bug #42
  
  Result: Fixed JWT expiry check to use UTC timestamps. Added unit tests 
  for token validation. No security review needed — this is a bug fix, 
  not a permissions change.
  → View details: #task-42`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        The ✅ reaction goes on the task (scannable), the summary message goes to the manager
        (readable), and the full details live on the task itself (available when needed).
      </p>

      <h3 className="mt-6 mb-3 text-lg font-semibold text-slate-200">
        What This Looks Like in Your Dashboard
      </h3>
      <p className="mb-2 text-slate-400">When real agents are working, you'll see:</p>
      <ul className="mb-8 list-disc pl-6 text-slate-400 space-y-1">
        <li>👍 reactions appearing on tasks as they're assigned</li>
        <li>The activity feed showing progress updates in real time</li>
        <li>Orange ⚠️ escalation alerts when agents are blocked</li>
        <li>✅ completions rolling in with summaries</li>
        <li>The network graph animating with task flow between agents</li>
      </ul>

      {/* Walkthrough */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        Walkthrough: Adding a Real Agent to Your Org
      </h2>
      <p className="mb-4 text-slate-400">
        Let's add a content writer agent to a simple org and watch it complete a real task.
      </p>

      <h3 className="mt-6 mb-3 text-lg font-semibold text-slate-200">Step 1: Write the ORG.md</h3>
      <CodeBlock title="ORG.md">{`# My Writing Team

## Culture
preset: startup

## Structure

### Editor
You manage the content pipeline. You receive article requests,
brief the writers, review drafts, and approve publication.
- **Model:** claude-sonnet
- **Domain:** editorial

#### Content Writer
You write articles, blog posts, and documentation.
When assigned an article, research the topic first using web search,
then write a complete draft. Aim for clear, engaging prose.
- **Model:** claude-haiku
- **Domain:** copywriting
- **Capabilities:** web-search, file-write`}</CodeBlock>

      <h3 className="mt-6 mb-3 text-lg font-semibold text-slate-200">Step 2: Deploy the Org</h3>
      <CodeBlock title="bash">{`openspawn deploy ORG.md`}</CodeBlock>
      <CodeBlock title="output">{`✓ Parsed ORG.md
✓ Created: Editor (L9, claude-sonnet)
✓ Created: Content Writer (L4, claude-haiku, web-search + file-write)
✓ Applied culture: startup
✓ Org deployed. 2 agents ready.`}</CodeBlock>

      <h3 className="mt-6 mb-3 text-lg font-semibold text-slate-200">Step 3: Give It a Task</h3>
      <CodeBlock title="bash">{`openspawn task "Write a 500-word article about the benefits of async-first remote work"`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        This task goes to the Editor (L9), who is the top of your hierarchy.
      </p>

      <h3 className="mt-6 mb-3 text-lg font-semibold text-slate-200">
        Step 4: Watch ACP in Action
      </h3>
      <p className="mb-4 text-slate-400">Open the dashboard (or watch CLI output):</p>
      <CodeBlock title="ACP trace">{`[T+0s]   Human → Editor: "Write article about async-first remote work"
[T+1s]   Editor 👍 ack

[T+3s]   Editor → Content Writer: "Write 500-word article: 
          benefits of async-first remote work. Research first."
[T+4s]   Content Writer 👍 ack

[T+10s]  Content Writer (progress): "Researching async-first companies: 
          Basecamp, GitLab, Doist. Found 4 good sources."

[T+40s]  Content Writer (progress): "Draft complete. 523 words."

[T+42s]  Content Writer ✅ → Editor:
          "Completed: async-first article (523 words). 
           Covers benefits, 3 company examples, actionable tips.
           File saved: articles/async-work.md"

[T+45s]  Editor (reviewing draft)...

[T+60s]  Editor ✅ → Human:
          "Article approved and published. 
           Good research, clear structure. Minor edits for tone."`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        The whole pipeline — delegation, research, writing, review, completion — runs autonomously.
        You gave one task; the org handled the rest.
      </p>

      <h3 className="mt-6 mb-3 text-lg font-semibold text-slate-200">Step 5: Review the Output</h3>
      <CodeBlock title="bash">{`openspawn task-log <task-id>   # Full activity history
openspawn messages             # All ACP messages
cat articles/async-work.md     # The article itself`}</CodeBlock>

      {/* API Keys */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        API Keys and Model Configuration
      </h2>
      <p className="mb-4 text-slate-400">
        Real agents need real API keys. Configure them before deploying:
      </p>
      <CodeBlock title="bash">{`# Set provider keys
openspawn config set ANTHROPIC_API_KEY=sk-ant-...
openspawn config set OPENAI_API_KEY=sk-...

# Set a default model for agents that don't specify one
openspawn config set DEFAULT_MODEL=claude-haiku`}</CodeBlock>
      <CodeBlock title="ORG.md (per-org overrides)">{`## Policies

### Model Defaults
- **Default model:** claude-haiku
- **Lead model:** claude-sonnet
- **Director model:** claude-opus`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        The system respects a model hierarchy: explicit role config → policy defaults → system
        default.
      </p>

      {/* Troubleshooting */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        Troubleshooting Common Issues
      </h2>

      <h3 className="mt-6 mb-3 text-lg font-semibold text-slate-200">
        Agent Gets Stuck (No Progress)
      </h3>
      <p className="mb-3 text-slate-400">
        <strong className="text-slate-200">Symptom:</strong> Agent acknowledges a task but never
        sends progress updates or completes.
      </p>
      <p className="mb-2 text-slate-400">Causes and fixes:</p>
      <ol className="mb-4 list-decimal pl-6 text-slate-400 space-y-3">
        <li>
          <strong className="text-slate-200">Model API key missing or invalid</strong>
          <CodeBlock title="bash">{`openspawn status --agents   # Check agent health
openspawn logs --agent=<id> # See raw error output`}</CodeBlock>
          Fix: Check your API key config with{" "}
          <code className="inline-code">openspawn config show</code>.
        </li>
        <li>
          <strong className="text-slate-200">Task too vague</strong> — Agent doesn't know what
          "done" looks like.
          <CodeBlock title="better task">{`# Before
"Write an article about remote work"

# After
"Write a 500-word article about async-first remote work. 
 Done when: file is saved to articles/, has a clear intro/body/conclusion."`}</CodeBlock>
        </li>
        <li>
          <strong className="text-slate-200">Agent lacks required capability</strong> — If the task
          requires web search and your agent doesn't have{" "}
          <code className="inline-code">web-search</code>, it can't proceed. Add the capability to
          the role in ORG.md and redeploy.
        </li>
      </ol>

      <h3 className="mt-6 mb-3 text-lg font-semibold text-slate-200">Agent Escalates Everything</h3>
      <p className="mb-3 text-slate-400">
        <strong className="text-slate-200">Symptom:</strong> Agent keeps escalating with{" "}
        <code className="inline-code">LOW_CONFIDENCE</code> or{" "}
        <code className="inline-code">BLOCKED</code>.
      </p>
      <ol className="mb-4 list-decimal pl-6 text-slate-400 space-y-3">
        <li>
          <strong className="text-slate-200">Role description too narrow</strong> — Agent sees every
          task as out of domain.
          <CodeBlock title="ORG.md">{`# Before
You write blog posts.

# After
You write blog posts, documentation, social copy, and email drafts.
When in doubt about format, write something and note your assumptions.`}</CodeBlock>
        </li>
        <li>
          <strong className="text-slate-200">Task genuinely requires missing resources</strong>
          <CodeBlock title="bash">{`openspawn escalations   # List all current escalations with reasons`}</CodeBlock>
          Each escalation tells you exactly what the agent needs.
        </li>
        <li>
          <strong className="text-slate-200">Culture set too conservatively</strong>
          <CodeBlock title="ORG.md">{`## Culture
preset: startup
- **Escalation:** delayed — give agents 3 cycles to figure it out before escalating`}</CodeBlock>
        </li>
      </ol>

      <h3 className="mt-6 mb-3 text-lg font-semibold text-slate-200">
        Tasks Completing Too Fast (Without Real Work)
      </h3>
      <p className="mb-3 text-slate-400">
        <strong className="text-slate-200">Symptom:</strong> Agents complete tasks instantly with
        shallow output.
      </p>
      <p className="mb-3 text-slate-400">
        <strong className="text-slate-200">Cause:</strong> Model is pattern-matching "task
        completion" without doing real work.
      </p>
      <p className="mb-2 text-slate-400">
        <strong className="text-slate-200">Fix:</strong> Add specificity about what "done" means:
      </p>
      <CodeBlock title="ORG.md">{`#### Backend Worker
...
A task is complete ONLY when:
1. The code change has been made
2. Tests have been written and pass
3. The PR description explains what changed and why
4. You've confirmed the change doesn't break existing tests`}</CodeBlock>

      <h3 className="mt-6 mb-3 text-lg font-semibold text-slate-200">
        Agents Not Talking to Each Other
      </h3>
      <p className="mb-3 text-slate-400">
        <strong className="text-slate-200">Symptom:</strong> Tasks don't flow down the hierarchy —
        everything sits with the top-level agent.
      </p>
      <p className="mb-3 text-slate-400">
        <strong className="text-slate-200">Cause:</strong> Top-level agent isn't delegating.
      </p>
      <p className="mb-2 text-slate-400">
        <strong className="text-slate-200">Fix:</strong> Make delegation explicit in the role
        description:
      </p>
      <CodeBlock title="ORG.md">{`### Engineering Lead
You are a delegator, not a doer. When you receive a task:
1. Break it into subtasks if needed
2. Assign each subtask to the right worker based on their domain
3. You only do work yourself if no worker has the right domain

Never do work that a worker could do.`}</CodeBlock>

      {/* Next Steps */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Next Steps</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          to="/docs/guides/dashboard-guide"
          className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-4 transition hover:border-white/10 hover:bg-white/[0.04] no-underline"
        >
          <div className="text-sm font-semibold text-slate-200 mb-1">Dashboard Guide →</div>
          <div className="text-xs text-slate-500">
            Read the live feed, network graph, and ACP metrics
          </div>
        </Link>
        <Link
          to="/docs/tutorials/your-first-org-md"
          className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-4 transition hover:border-white/10 hover:bg-white/[0.04] no-underline"
        >
          <div className="text-sm font-semibold text-slate-200 mb-1">ORG.md Reference →</div>
          <div className="text-xs text-slate-500">Full syntax for the org file</div>
        </Link>
        <Link
          to="/docs/concepts/acp-vs-a2a"
          className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-4 transition hover:border-white/10 hover:bg-white/[0.04] no-underline"
        >
          <div className="text-sm font-semibold text-slate-200 mb-1">ACP vs A2A →</div>
          <div className="text-xs text-slate-500">Internal protocol vs cross-org communication</div>
        </Link>
      </div>
    </DocsLayout>
  );
}
