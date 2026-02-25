import { Link } from "@tanstack/react-router";
import { DocsLayout, CodeBlock } from "../../components/docs-layout";
import { ArchDiagram } from "../../components/arch-diagram";
import { Callout } from "../../components/callout";
import { useTitle } from "../../hooks/use-title";

export function HowItWorks() {
  useTitle("How It Works");
  return (
    <DocsLayout>
      <h1 className="mb-2 text-4xl font-bold text-slate-100">How It Works</h1>
      <p className="mb-8 text-lg text-slate-400">
        The 30-second mental model for OpenSpawn — what it is, how it's structured, and how work actually flows
        through an agent organization.
      </p>

      <Callout className="mb-8">
        Before you run a single command, this page gives you the mental model. Five minutes here will save you an hour
        of confusion later.
      </Callout>

      {/* One-Paragraph Version */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">The One-Paragraph Version</h2>
      <p className="mb-4 text-slate-400">
        OpenSpawn is a platform for building and running <strong className="text-slate-200">organizations made of AI agents</strong>. You describe your org in a single markdown file (called{" "}
        <code className="inline-code">ORG.md</code>) — who the agents are, how
        they're structured, what they're allowed to do, and how they communicate. OpenSpawn reads that file, spins up a
        live simulation, and your agents start working: delegating tasks, reporting progress, escalating blockers, and
        completing work — just like a real team. The unique part: OpenSpawn agents can also reach into the physical
        world, controlling phones, cameras, screens, and IoT devices through paired{" "}
        <strong className="text-slate-200">nodes</strong>. No other multi-agent platform does this.
      </p>

      <hr className="my-8 border-white/10" />

      {/* The Big Idea */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">The Big Idea: ORG.md as Source of Truth</h2>
      <p className="mb-4 text-slate-400">
        Most agent frameworks treat agents as isolated function calls. You wire them together in code, run them once,
        and start over. There's no memory of the team, no persistent structure, no org.
      </p>
      <p className="mb-4 text-slate-400">
        OpenSpawn takes a different approach: <strong className="text-slate-200">your organization lives in a file.</strong>
      </p>
      <p className="mb-4 text-slate-400">
        <code className="inline-code">ORG.md</code> is plain markdown. It defines
        everything:
      </p>
      <ul className="mb-6 list-disc pl-6 text-slate-400 space-y-1">
        <li>
          <strong className="text-slate-200">Who your agents are</strong> — names, roles, the model they run
          (GPT-4o, Claude Sonnet, Ollama/Llama3)
        </li>
        <li>
          <strong className="text-slate-200">How they're structured</strong> — a hierarchy with a COO at the top,
          leads in the middle, workers at the bottom
        </li>
        <li>
          <strong className="text-slate-200">What they care about</strong> — their domains, responsibilities, and
          decision-making authority
        </li>
        <li>
          <strong className="text-slate-200">How they communicate</strong> — polling vs event-driven, escalation
          rules, cultural defaults
        </li>
        <li>
          <strong className="text-slate-200">What they're allowed to spend</strong> — model cost caps per agent
        </li>
      </ul>
      <CodeBlock title="ORG.md example">{`# 🪸 Acme Corp

> Mission: Ship great software faster

## Structure

### COO — Alex
Strategic oversight. Handles escalations. Final call on priorities.
- **Model:** claude-opus
- **Trigger:** event-driven

### Engineering

#### Lead — Jordan
Triages technical work. Delegates to the team.
- **Model:** claude-sonnet
- **Trigger:** event-driven

#### Workers
- Sam (backend) — claude-haiku
- Riley (frontend) — claude-haiku
- Morgan (QA) — claude-haiku`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        This file is your org chart, your configuration, and your documentation — all in one. Check it into git.
        Review changes with <code className="inline-code">git diff</code>. Roll
        back bad configurations like bad code. The documentation <em>is</em> the system.
      </p>
      <div className="mb-6 rounded-lg border border-white/5 bg-white/[0.02] px-5 py-4 text-sm">
        <p className="mb-2 font-semibold text-slate-200">The mental model:</p>
        <ul className="space-y-1 text-slate-400">
          <li>
            <code className="inline-code">ORG.md</code>{" "}
            = the org chart + employee handbook
          </li>
          <li>
            <strong className="text-slate-200">Agents</strong> = employees with clear roles and reporting lines
          </li>
          <li>
            <strong className="text-slate-200">Nodes</strong> = company devices (phones, laptops, cameras, sensors)
          </li>
          <li>
            <strong className="text-slate-200">Tasks</strong> = the actual work flowing through the org
          </li>
        </ul>
      </div>

      <hr className="my-8 border-white/10" />

      {/* ACP */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        How Agents Communicate: The Agent Communication Protocol (ACP)
      </h2>
      <p className="mb-4 text-slate-400">
        When an agent receives a task, completes work, or hits a blocker, it doesn't just silently update a database.
        It <em>communicates</em> — through a structured protocol called <strong className="text-slate-200">ACP</strong>.
      </p>
      <p className="mb-4 text-slate-400">
        The design philosophy comes from how effective human organizations actually work:
      </p>
      <Callout className="mb-6">
        <strong>Push what's urgent. Pull what's optional. Minimize interrupts.</strong>
      </Callout>
      <p className="mb-6 text-slate-400">ACP defines four types of messages:</p>

      <div className="mb-8 space-y-6">
        <div>
          <h3 className="mb-2 text-lg font-bold text-slate-100">👍 Acknowledgment (ACK)</h3>
          <p className="text-slate-400">
            When an agent receives a task, it immediately reacts with a thumbs-up. No LLM call needed — this is a
            systems-level signal. The delegator knows the task landed and can move on.
          </p>
        </div>
        <div>
          <h3 className="mb-2 text-lg font-bold text-slate-100">📋 Progress Updates</h3>
          <p className="text-slate-400">
            As an agent works, it writes updates to the task's activity log. These are{" "}
            <strong className="text-slate-200">pull-based</strong> — the manager checks when <em>they</em> want to,
            not when the agent decides to interrupt. Think of it like checking a project board instead of tapping
            someone's shoulder.
          </p>
        </div>
        <div>
          <h3 className="mb-2 text-lg font-bold text-slate-100">🚨 Escalation</h3>
          <p className="mb-2 text-slate-400">
            When an agent can't proceed — blocked on a resource, out of its domain, over budget, low confidence — it
            escalates <strong className="text-slate-200">immediately and loudly</strong> to its direct manager.
            Escalations are push-based because blockers need attention <em>now</em>. The escalation carries a reason (
            <code className="inline-code">BLOCKED</code>,{" "}
            <code className="inline-code">OUT_OF_DOMAIN</code>,{" "}
            <code className="inline-code">OVER_BUDGET</code>, etc.) so the
            manager can act quickly.
          </p>
          <p className="text-slate-400">
            The manager decides what to do: provide the missing resource, reassign the task, handle it themselves, or
            escalate further up the chain.
          </p>
        </div>
        <div>
          <h3 className="mb-2 text-lg font-bold text-slate-100">✅ Completion</h3>
          <p className="text-slate-400">
            When work is done, the agent sends a completion signal (a ✅ reaction) plus a short summary message. The
            delegator gets the signal to proceed with dependent work.
          </p>
        </div>
      </div>

      <div className="mb-8 rounded-lg border border-white/5 bg-white/[0.02] px-5 py-4 text-sm text-slate-400">
        <strong className="text-slate-200">Why this matters:</strong> Most multi-agent systems either have no
        communication (fire-and-forget) or too much (every agent broadcasts everything). ACP gives you{" "}
        <em>graduated communication</em> — the right signal at the right noise level. Blockers propagate upward
        instantly. Progress sits quietly in a log until someone looks. Completions trigger the next stage of work.
      </div>

      <hr className="my-8 border-white/10" />

      {/* How Work Flows */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        How Work Flows: Ticks, Decisions, and Delegation
      </h2>
      <p className="mb-4 text-slate-400">
        OpenSpawn runs a continuous simulation loop called a <strong className="text-slate-200">tick</strong>. Every
        tick, each agent in the org wakes up, reads its context (inbox, assigned tasks, org state), and decides what
        to do next.
      </p>

      <h3 className="mb-3 mt-6 text-lg font-bold text-slate-100">The agent decision cycle</h3>
      <CodeBlock title="">{`Each tick:
  1. Agent reads its inbox and task queue
  2. LLM decides: work on a task / delegate to a report / escalate / complete / idle
  3. Action generates ACP messages (delegation, progress, completion, escalation)
  4. Messages land in recipients' inboxes, triggering their next decision`}</CodeBlock>

      <h3 className="mb-3 mt-8 text-lg font-bold text-slate-100">Task delegation flows downward</h3>
      <p className="mb-4 text-slate-400">
        Work enters the org at the top (a human sends an order, a scheduled trigger fires, or an external event
        arrives) and cascades down through the hierarchy:
      </p>
      <CodeBlock title="">{`Human sends task: "Build a user auth system"
  ↓
COO decomposes it → delegates subtasks to Engineering Lead
  ↓
Engineering Lead assigns → Backend Worker (API), Frontend Worker (UI)
  ↓
Workers execute, report progress, complete
  ↓
Lead collects completions, rolls up to COO
  ↓
COO sends final completion to Human`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        Each step generates ACP messages. Each message is a decision. A single human request can produce hundreds of
        decisions — delegation, acknowledgment, progress, escalation, unblocking, re-delegation, completion — all
        tracked, all visible on the dashboard.
      </p>

      <h3 className="mb-3 mt-8 text-lg font-bold text-slate-100">Polling vs event-driven execution</h3>
      <p className="mb-4 text-slate-400">
        Not all agents need to wake up every tick. OpenSpawn supports two execution modes:
      </p>
      <div className="mb-4 space-y-4 text-slate-400">
        <p>
          <strong className="text-slate-200">Polling mode</strong> (default for workers): Agent wakes on every tick.
          Best for workers who almost always have tasks. Cheap models (Haiku, Ollama) can afford to poll — even at 120
          calls/hour, the cost is cents.
        </p>
        <p>
          <strong className="text-slate-200">Event-driven mode</strong> (best for managers): Agent sleeps until its
          inbox receives a message. A COO running Claude Opus might only get 5 meaningful events per hour — polling
          would waste $14/hr checking an empty inbox. Event-driven brings that to $0.60/hr for the same work.
        </p>
      </div>
      <p className="mb-3 text-slate-400">
        You configure this in <code className="inline-code">ORG.md</code>:
      </p>
      <CodeBlock title="ORG.md">{`### COO
- **Trigger:** event-driven
- **Wake on:** escalations, completions, orders`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        The org adapts: cheap workers poll constantly, expensive managers sleep until needed.
      </p>

      <hr className="my-8 border-white/10" />

      {/* Nodes */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">
        How It Connects to the Real World: Nodes
      </h2>
      <p className="mb-4 text-slate-400">
        This is what sets OpenSpawn apart from every other agent platform.
      </p>
      <p className="mb-4 text-slate-400">
        <strong className="text-slate-200">Nodes</strong> are real-world devices — phones, laptops, desktop screens,
        cameras, IoT sensors — paired to your OpenSpawn org. When an agent needs to interact with the physical world,
        it reaches through a node.
      </p>
      <p className="mb-3 text-slate-400">What agents can do through nodes:</p>
      <ul className="mb-6 list-disc pl-6 text-slate-400 space-y-1">
        <li>📸 <strong className="text-slate-200">Camera</strong> — take photos or video clips from paired phones or webcams</li>
        <li>🖥️ <strong className="text-slate-200">Screen</strong> — capture or interact with a connected desktop screen</li>
        <li>📍 <strong className="text-slate-200">Location</strong> — get GPS coordinates from a paired mobile device</li>
        <li>🔔 <strong className="text-slate-200">Notifications</strong> — push alerts to phones or smart displays</li>
        <li>🤖 <strong className="text-slate-200">Run commands</strong> — execute shell commands on a paired machine</li>
        <li>📺 <strong className="text-slate-200">Canvas</strong> — present live content (charts, dashboards, prompts) to a connected display</li>
      </ul>
      <p className="mb-4 text-slate-400">
        A surveillance agent can check a camera feed, summarize what it sees, and escalate to the COO if something
        needs attention. A monitoring agent can run health-check commands on a server, then push a notification to an
        on-call engineer's phone. An event coordinator agent can display a live countdown on a lobby screen.
      </p>
      <p className="mb-4 text-slate-400">
        No custom APIs. No glue code. You give your agent access to a node in{" "}
        <code className="inline-code">ORG.md</code>, and it has eyes and hands
        in the physical world.
      </p>

      <hr className="my-8 border-white/10" />

      {/* Architecture Diagram */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Architecture at a Glance</h2>
      <p className="mb-4 text-slate-400">Here's how the pieces fit together:</p>
      <ArchDiagram className="my-6" />
      <p className="mb-4 text-slate-400">
        <strong className="text-slate-200">The request lifecycle in one sentence:</strong> A task enters the org at
        the top → cascades down through delegation → each agent wakes (by tick or event), decides an action, and
        generates ACP messages → completions bubble back up → the dashboard shows every step in real time → agents
        with node access can reach into the physical world at any point.
      </p>

      <hr className="my-8 border-white/10" />

      {/* What Makes OpenSpawn Different */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">What Makes OpenSpawn Different</h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-5 py-4">
          <p className="mb-2 text-sm font-semibold text-red-400">Most multi-agent frameworks give you:</p>
          <ul className="space-y-1 text-sm text-slate-400">
            <li>A graph of function calls</li>
            <li>No persistent org structure</li>
            <li>No inter-agent communication norms</li>
            <li>No connection to physical devices</li>
          </ul>
        </div>
        <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-5 py-4">
          <p className="mb-2 text-sm font-semibold text-cyan-400">OpenSpawn gives you:</p>
          <ul className="space-y-1 text-sm text-slate-400">
            <li>A <strong className="text-slate-200">living org</strong> defined in version-controlled markdown</li>
            <li>A <strong className="text-slate-200">communication protocol</strong> modeled on how real organizations work</li>
            <li><strong className="text-slate-200">Cost-efficient execution</strong> that matches model costs to decision value</li>
            <li><strong className="text-slate-200">Physical-world reach</strong> through paired devices — the capability no competitor has</li>
          </ul>
        </div>
      </div>
      <p className="mb-4 text-slate-400">
        The BikiniBottom demo (
        <a href="https://bikinibottom.ai/app" target="_blank" rel="noopener" className="text-cyan-400 underline">
          bikinibottom.ai/app
        </a>
        ) shows this concretely: 22 SpongeBob-themed agents across 5 departments running a real company, live, right
        now. It's the same infrastructure you'd use for your own org — just with better character names.
      </p>

      <hr className="my-8 border-white/10" />

      {/* Where to Go Next */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Where to Go Next</h2>
      <p className="mb-4 text-slate-400">You have the mental model. Now put it to work:</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          {
            title: "Getting Started →",
            desc: "Scaffold your first org and send it a task in under 5 minutes",
            to: "/docs/getting-started",
          },
          {
            title: "Your First ORG.md",
            desc: "Build a real org from scratch, step by step",
            to: "/docs/tutorials/your-first-org-md",
          },
          {
            title: "A2A Protocol →",
            desc: "How OpenSpawn connects to other agents and services",
            to: "/docs/protocols/a2a",
          },
          {
            title: "MCP Tools →",
            desc: "Use your org as a tool server in Claude Desktop, Cursor, or any MCP client",
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
        <a
          href="https://bikinibottom.ai/app"
          target="_blank"
          rel="noopener"
          className="group rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4 text-sm transition hover:border-white/10 hover:bg-white/[0.04] no-underline"
        >
          <div className="font-medium text-slate-200 group-hover:text-cyan-400">Live Demo →</div>
          <div className="mt-0.5 text-slate-500">Watch 22 agents run a company right now, no setup required</div>
        </a>
      </div>
    </DocsLayout>
  );
}
