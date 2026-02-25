import { Link } from "@tanstack/react-router";
import { DocsLayout, CodeBlock } from "../../../components/docs-layout";
import { useTitle } from "../../../hooks/use-title";

export function YourFirstOrgMd() {
  useTitle("Your First ORG.md");
  return (
    <DocsLayout>
      <h1 className="mb-2 text-4xl font-bold text-slate-100">Your First ORG.md</h1>
      <p className="mb-8 text-lg text-slate-400">
        What you'll build: a working ORG.md from scratch — starting with three agents, ending with a
        production-ready org that has departments, culture settings, policies, and playbooks.
      </p>

      {/* Big Idea */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">The Big Idea</h2>
      <p className="mb-4 text-slate-400">
        ORG.md is a single markdown file that defines your entire agent organization. Not a YAML config, not a JSON
        blob — markdown. The kind you can read in GitHub, edit in any text editor, and check into version control
        alongside your code.
      </p>
      <p className="mb-4 text-slate-400">
        It looks like documentation. It <em>is</em> documentation. But it's also the thing that runs your agents.
      </p>
      <CodeBlock title="flow">{`ORG.md  →  OpenSpawn reads it  →  agents spawn  →  tasks flow  →  org works`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        You write it once. You edit it as you learn. Your org evolves with the file.
      </p>
      <p className="mb-4 text-slate-400">
        Let's build one together, from the simplest possible version to something real.
      </p>

      {/* Part 1 */}
      <h2 className="mt-12 mb-4 text-2xl font-bold text-slate-100">Part 1 — The Minimal Org (3 Agents)</h2>
      <p className="mb-4 text-slate-400">
        Before we add any structure, let's ask: what's the <em>least</em> you need in an ORG.md to get a working
        org? The answer is a name and a Structure section with at least one role.
      </p>
      <p className="mb-4 text-slate-400">
        Create a file called <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-400">ORG.md</code>:
      </p>
      <CodeBlock title="ORG.md">{`# Tandem

## Structure

### COO
Routes work to the right person. Keeps things moving.
- **Model:** claude-sonnet
- **Domain:** operations

### Developer
Writes code, fixes bugs, ships features.
- **Model:** claude-haiku
- **Domain:** engineering

### Writer
Writes docs, blog posts, and marketing copy.
- **Model:** claude-haiku
- **Domain:** content`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        That's it. Three agents. A COO who receives tasks and delegates, a Developer who handles engineering work, and
        a Writer who handles content.
      </p>
      <CodeBlock title="bash">{`npx openspawn start`}</CodeBlock>
      <CodeBlock title="output">{`🚀 OpenSpawn starting...
   Parsing ORG.md...
   ✓ Found 3 agents
   Spawning agents...
   ✓ COO (claude-sonnet, L10, operations)
   ✓ Developer (claude-haiku, L4, engineering)
   ✓ Writer (claude-haiku, L4, content)
   Server running at http://localhost:3333`}</CodeBlock>
      <CodeBlock title="bash">{`curl -X POST http://localhost:3333/a2a/message/send \\
  -H 'Content-Type: application/json' \\
  -d '{"message": {"role": "user", "parts": [{"kind": "text", "text": "Write a README for our project"}]}}'`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        Watch the dashboard. The COO receives the task, decides it's content work, and delegates to the Writer. The
        Writer writes. The COO reports back.
      </p>
      <div className="mb-8 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        <strong>It works.</strong> Three agents, no configuration beyond what you just wrote, and you have a
        functioning delegation chain.
      </div>

      <h3 className="mt-8 mb-3 text-lg font-semibold text-slate-200">What's Happening Here</h3>
      <p className="mb-3 text-slate-400">Let's break down what OpenSpawn is reading from those three roles.</p>
      <p className="mb-2 text-slate-400">
        <strong className="text-slate-200">The COO role — </strong>
        <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-400">### COO</code> is an H3 heading. OpenSpawn
        recognizes "COO" as a C-level keyword and assigns level L10 — this agent can delegate and has authority over
        the whole org. The prose "Routes work to the right person." becomes the COO's system prompt context — the LLM
        reads this and uses it to decide how to behave.
      </p>
      <p className="mb-2 text-slate-400">
        <strong className="text-slate-200">Hierarchy inference: </strong>When the COO delegates, it matches the task
        domain against available agents. "Write a README" matches{" "}
        <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-400">domain: content</code>, so it goes to the
        Writer. "Fix the auth bug" would match{" "}
        <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-400">domain: engineering</code> and go to the
        Developer. No explicit routing rules needed.
      </p>

      {/* Part 2 */}
      <h2 className="mt-12 mb-4 text-2xl font-bold text-slate-100">Part 2 — Adding Departments</h2>
      <p className="mb-4 text-slate-400">
        Three agents is fine for a personal project. But when you have more than ~5 agents, flat structures get messy.
        The COO ends up managing too many direct reports, and tasks take too long to route. The answer is departments.
      </p>
      <CodeBlock title="ORG.md">{`# Tandem

## Structure

### COO
The operational backbone. Receives tasks from the human, breaks them
into departmental work, ensures every task has a clear owner.
- **Model:** claude-sonnet
- **Domain:** operations

### Engineering
Owns all code: product, infrastructure, and integrations.

#### Engineering Lead
Triages technical work. Breaks big tasks into subtasks. Reviews
output before marking things complete.
- **Model:** claude-haiku
- **Domain:** engineering

#### Backend Developer
Builds and maintains APIs, databases, and server infrastructure.
- **Model:** ollama/qwen2.5
- **Domain:** backend
- **Count:** 2

#### Frontend Developer
Builds UI components and manages the web app.
- **Model:** ollama/qwen2.5
- **Domain:** frontend

### Content
Owns everything the world reads: docs, marketing, blog.

#### Content Lead
Shapes the content strategy. Reviews everything before it ships.
- **Model:** claude-haiku
- **Domain:** content-strategy

#### Writer
Writes docs, blog posts, landing pages, and release notes.
- **Model:** ollama/qwen2.5
- **Domain:** copywriting
- **Count:** 2`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        Apply this change to your running org — <strong className="text-slate-200">no restart needed</strong>:
      </p>
      <CodeBlock title="bash">{`npx openspawn apply ORG.md`}</CodeBlock>
      <CodeBlock title="output">{`Applying changes...
   New: Engineering Lead → spawning
   New: Backend Developer 1 → spawning
   New: Backend Developer 2 → spawning
   New: Frontend Developer → spawning
   New: Content Lead → spawning
   New: Writer 1 → spawning
   New: Writer 2 → spawning
   Modified: Developer → removed (was replaced by Engineering structure)
   Modified: Writer → removed (was replaced by Content structure)
   Existing: COO → unchanged`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        Your org just grew from 3 to 8 agents, live, without restarting. The COO is still running. Any in-flight tasks
        continue uninterrupted.
      </p>

      <h3 className="mt-8 mb-3 text-lg font-semibold text-slate-200">Reading the New Structure</h3>
      <div className="mb-4 space-y-3 text-slate-400">
        <p>
          <strong className="text-slate-200">Departments</strong> are H3 headings without role keywords —
          "Engineering" isn't a role keyword, so it's read as a container for the roles nested beneath it. The prose
          becomes context all agents in the department share.
        </p>
        <p>
          <strong className="text-slate-200">Department leads</strong> are the first H4 role under the department. The
          "Lead" keyword assigns level L7. L7+ agents can delegate to agents below them and receive work from the COO.
        </p>
        <p>
          <strong className="text-slate-200">
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-400">Count: 2</code>
          </strong>{" "}
          spawns two agents: "Backend Developer 1" and "Backend Developer 2". They're independent — separate task
          queues, separate trust scores. The Engineering Lead picks the one with capacity (or higher trust for harder
          tasks).
        </p>
        <p>
          <strong className="text-slate-200">Why ollama/qwen2.5 for workers?</strong> Economics. A backend developer
          agent runs every tick. At Claude Sonnet prices, that's expensive at scale. A free local model handles
          execution tasks just fine.
        </p>
      </div>

      {/* Part 3 */}
      <h2 className="mt-12 mb-4 text-2xl font-bold text-slate-100">Part 3 — Adding Culture</h2>
      <p className="mb-4 text-slate-400">
        Right now your org uses all defaults for communication. Add a{" "}
        <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-400">Culture</code> section:
      </p>
      <CodeBlock title="ORG.md">{`# Tandem

## Culture

We're a small team that moves fast. Communication should be transparent
but not noisy. Nobody should be blocked without their manager knowing.

- **Communication:** async-first
- **Escalation:** immediate — if you're blocked, say so right away
- **Progress updates:** on phase change — update when something meaningfully changes
- **Ack required:** yes — if you receive a task, confirm you have it
- **Hierarchy depth:** shallow — max 3 levels, keep the org lean

## Structure
...`}</CodeBlock>
      <p className="mb-3 text-slate-400">Or, if you prefer shorthand:</p>
      <CodeBlock title="ORG.md">{`## Culture

preset: startup`}</CodeBlock>
      <p className="mb-4 text-slate-400">Available presets:</p>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 pr-6 text-slate-400 font-medium">Preset</th>
              <th className="py-2 text-slate-400 font-medium">Best for</th>
            </tr>
          </thead>
          <tbody className="text-slate-400">
            {[
              ["startup", "Small teams, fast iteration, direct communication"],
              ["enterprise", "Large orgs, batched escalations, formal process"],
              ["agency", "Client-facing work, high visibility, deadline-driven"],
              ["research", "Long-running exploratory tasks, high autonomy"],
              ["remote-async", "Distributed teams, high trust, async-first"],
            ].map(([preset, desc]) => (
              <tr key={preset} className="border-b border-white/5">
                <td className="py-2 pr-6">
                  <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-400">{preset}</code>
                </td>
                <td className="py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mb-3 text-slate-400">
        You can use a preset <em>and</em> override individual settings:
      </p>
      <CodeBlock title="ORG.md">{`## Culture

preset: startup
- **Escalation:** delayed — we trust our leads, no need to escalate immediately`}</CodeBlock>

      <h3 className="mt-8 mb-3 text-lg font-semibold text-slate-200">What Culture Actually Changes</h3>
      <p className="mb-4 text-slate-400">
        Culture maps directly to the Agent Communication Protocol (ACP) — the message-passing system that governs how
        agents talk to each other. When you set{" "}
        <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-400">Ack required: yes</code>, every delegation
        automatically triggers an acknowledgment. When you set{" "}
        <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-400">Escalation: immediate</code>, a blocked
        agent escalates in the same tick it gets stuck. These aren't suggestions — they're ACP configuration. The
        protocol enforces them.
      </p>

      {/* Part 4 */}
      <h2 className="mt-12 mb-4 text-2xl font-bold text-slate-100">Part 4 — Adding Identity</h2>
      <p className="mb-4 text-slate-400">
        Identity is ambient context for the entire org. Every agent has access to it. It answers: <em>why do we
        exist, what are we building, what do we value?</em>
      </p>
      <CodeBlock title="ORG.md">{`# Tandem

## Identity

We build tools that help small teams move at startup speed without burning out.
Every agent in this org serves that mission — whether you're writing code,
writing docs, or managing the pipeline.

- **Industry:** Developer tools / SaaS
- **Stage:** Seed, 8 months old
- **Values:** Ship fast, document everything, default to async

## Culture

preset: startup

## Structure
...`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        Identity influences agent behavior in subtle but meaningful ways. A marketing agent writing copy knows they're
        writing for a developer tools audience. An engineering agent prioritizing work knows that "document
        everything" is a value, not a suggestion.
      </p>
      <p className="mb-4 text-slate-400">
        Write Identity like you'd write the first page of a company handbook — terse, clear, honest about who you are.
      </p>

      {/* Part 5 */}
      <h2 className="mt-12 mb-4 text-2xl font-bold text-slate-100">Part 5 — Adding Policies</h2>
      <p className="mb-4 text-slate-400">
        Policies are guardrails. They're not suggestions — OpenSpawn enforces them.
      </p>
      <CodeBlock title="ORG.md">{`## Policies

### Budget
Agents spend credits every time they call a model. We set limits to avoid surprises.

- **Per-agent limit:** 500 credits/period
- **Alert threshold:** 80% — flag it before we hit the wall
- **Overage behavior:** pause and escalate — don't hard-stop, but don't run wild
- **Period:** daily

### Task Routing
When a task arrives, OpenSpawn routes it by:
1. Matching domain keywords in the task to agent domains
2. Preferring idle agents over busy ones
3. Preferring higher-trust agents for complex tasks

If no domain match is found, the task goes to the COO for manual delegation.

### Permissions
- **L7+ can create subtasks** — leads can break work into smaller pieces
- **L7+ can spawn agents** — leads can grow their team, up to the department cap
- **All agents can escalate** — nobody gets silently stuck

### Department Caps
- Engineering: max 6 agents
- Content: max 4 agents
- No department exceeds its cap without human approval via dashboard

### Working Hours
- **Active hours:** 09:00–20:00 UTC
- **Off-hours:** queue tasks, don't process
- **Exceptions:** tasks marked \`priority: critical\` run 24/7`}</CodeBlock>
      <div className="mb-4 space-y-3 text-slate-400">
        <p>
          <strong className="text-slate-200">Budget limits are per-agent, not per-org.</strong> If Backend Developer 1
          hits 500 credits, it pauses. Backend Developer 2 keeps running. Override per-agent by adding{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-400">**Budget:** 1000 credits/period</code> to
          any role.
        </p>
        <p>
          <strong className="text-slate-200">Department caps prevent runaway spawning.</strong> Leads with L7+ can
          spawn new agents when overloaded. Without a cap, an Engineering Lead could decide it needs 20 backend
          developers and blow your budget.
        </p>
        <p>
          <strong className="text-slate-200">Working hours are optional but powerful.</strong> If you're running agents
          that cost real money, off-hours queuing means tasks pile up overnight and get processed in the morning —
          nothing is lost, nothing is wasted.
        </p>
      </div>

      {/* Part 6 */}
      <h2 className="mt-12 mb-4 text-2xl font-bold text-slate-100">Part 6 — Adding Playbooks</h2>
      <p className="mb-4 text-slate-400">
        Playbooks are reusable procedures. When a standard situation occurs — a new task arrives, an agent gets
        blocked, a new agent joins — the relevant playbook kicks in.
      </p>
      <CodeBlock title="ORG.md">{`## Playbooks

### New Task Arrives
1. COO receives task, categorizes by domain and priority
2. COO delegates to the right department lead
3. Lead acks and breaks into subtasks if needed
4. Lead assigns to available workers (prefer idle, prefer higher trust)
5. Workers ack and begin — progress logged automatically

### Agent Blocked (BLOCKED escalation)
1. Blocked agent creates an escalation with the specific blocker described
2. Escalation goes to direct manager — no skipping levels
3. Manager has 2 cycles to respond:
   - Provide missing context or resources
   - Reassign to a different agent
   - Escalate further up the chain
4. If unresolved after escalating twice, alert the human principal

### New Agent Onboarding
1. New agent spawned (by a lead or via ORG.md apply)
2. First 3 tasks are LOW priority — warm-up period
3. Trust score starts at 30 (PROBATION status)
4. After 5 successful tasks → TRUSTED status
5. After 20 successful tasks → eligible for VETERAN and harder work

### Weekly Digest (automated)
1. System compiles: tasks completed, escalation rate, budget burn
2. Generates health score and flags anomalies
3. Delivers digest to human principal
4. Proposes structural changes if patterns warrant it`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        Playbooks aren't just documentation — they're instructions the system follows. When an agent status changes to
        BLOCKED, OpenSpawn looks up the "Agent Blocked" playbook and executes the steps.
      </p>

      {/* Complete ORG.md */}
      <h2 className="mt-12 mb-4 text-2xl font-bold text-slate-100">The Complete ORG.md</h2>
      <p className="mb-4 text-slate-400">Here's everything together:</p>
      <CodeBlock title="ORG.md">{`# Tandem

## Identity

We build tools that help small teams move at startup speed without burning out.
Every agent in this org serves that mission — whether you're writing code,
writing docs, or managing the pipeline.

- **Industry:** Developer tools / SaaS
- **Stage:** Seed, 8 months old
- **Values:** Ship fast, document everything, default to async

## Culture

preset: startup
- **Escalation:** immediate
- **Ack required:** yes

## Structure

### COO
The operational backbone. Receives tasks from the human, routes them
to the right department, ensures nothing falls through the cracks.
- **Model:** claude-sonnet
- **Domain:** operations

### Engineering
Owns all code: product, infrastructure, and integrations.

#### Engineering Lead
Triages technical work. Breaks big tasks into subtasks. Reviews
output before marking things complete.
- **Model:** claude-haiku
- **Domain:** engineering

#### Backend Developer
Builds and maintains APIs, databases, and server infrastructure.
- **Model:** ollama/qwen2.5
- **Domain:** backend
- **Count:** 2

#### Frontend Developer
Builds UI components and manages the web app.
- **Model:** ollama/qwen2.5
- **Domain:** frontend

### Content
Owns everything the world reads: docs, marketing, blog.

#### Content Lead
Shapes the content strategy. Reviews everything before it ships.
- **Model:** claude-haiku
- **Domain:** content-strategy

#### Writer
Writes docs, blog posts, landing pages, and release notes.
- **Model:** ollama/qwen2.5
- **Domain:** copywriting
- **Count:** 2

## Policies

### Budget
- **Per-agent limit:** 500 credits/period
- **Alert threshold:** 80%
- **Overage behavior:** pause and escalate
- **Period:** daily

### Permissions
- **L7+ can create subtasks**
- **L7+ can spawn agents**
- **All agents can escalate**

### Department Caps
- Engineering: max 6 agents
- Content: max 4 agents

### Working Hours
- **Active hours:** 09:00–20:00 UTC
- **Off-hours:** queue tasks, don't process
- **Exceptions:** critical priority tasks run 24/7

## Playbooks

### New Task Arrives
1. COO receives and categorizes by domain and priority
2. COO delegates to the right department lead
3. Lead acks, breaks into subtasks if needed
4. Lead assigns to available workers
5. Workers ack and begin

### Agent Blocked
1. Blocked agent escalates with blocker described specifically
2. Escalation goes to direct manager
3. Manager has 2 cycles to respond or escalate
4. If unresolved after 2 levels, alert human principal

### New Agent Onboarding
1. New agent spawned
2. First 3 tasks: LOW priority (warm-up)
3. Trust starts at 30 (PROBATION)
4. 5 successful tasks → TRUSTED
5. 20 successful tasks → VETERAN eligible`}</CodeBlock>
      <CodeBlock title="bash">{`# Deploy fresh
npx openspawn deploy ORG.md

# Or apply to a running org
npx openspawn apply ORG.md`}</CodeBlock>

      {/* What Happens */}
      <h2 className="mt-12 mb-4 text-2xl font-bold text-slate-100">What Happens When You Run This</h2>
      <p className="mb-4 text-slate-400">
        Open the dashboard at{" "}
        <a href="http://localhost:3333/app/" target="_blank" rel="noopener" className="text-cyan-400 underline">
          http://localhost:3333/app/
        </a>
        . You'll see a COO at the top, Engineering and Content departments branching down, with leads and workers
        beneath each. Send a task:
      </p>
      <CodeBlock title="bash">{`curl -X POST http://localhost:3333/a2a/message/send \\
  -H 'Content-Type: application/json' \\
  -d '{"message": {"role": "user", "parts": [{"kind": "text", "text": "Write API documentation for our authentication endpoints"}]}}'`}</CodeBlock>
      <p className="mb-3 text-slate-400">Watch it flow:</p>
      <ol className="mb-6 list-decimal pl-6 text-slate-400 space-y-1">
        <li>COO receives → acknowledges (ack required: yes)</li>
        <li>COO routes to Content Lead (domain: documentation → content-strategy match)</li>
        <li>Content Lead acknowledges → assigns to Writer 1</li>
        <li>Writer 1 acknowledges → starts working (status: working)</li>
        <li>Writer 1 completes → sends summary to Content Lead</li>
        <li>Content Lead reviews → marks complete → reports to COO</li>
        <li>COO closes task → reports to human</li>
      </ol>
      <p className="mb-4 text-slate-400">
        The entire chain is logged. Click the task in the timeline to see every delegation message, every ack, every
        status change.
      </p>

      {/* Iterating */}
      <h2 className="mt-12 mb-4 text-2xl font-bold text-slate-100">Iterating on Your Org</h2>
      <p className="mb-3 text-slate-400">The file is alive. Change it as you learn.</p>
      <div className="mb-6 space-y-3 text-slate-400">
        <p>
          <strong className="text-slate-200">High escalation rate?</strong> Check your Structure descriptions. Are
          roles clear about what they own? An agent that receives an out-of-domain task will escalate because it
          doesn't know how to handle it.
        </p>
        <p>
          <strong className="text-slate-200">An agent is always idle?</strong> Its domain might be too narrow. Broaden
          the description or merge the role into a related one.
        </p>
        <p>
          <strong className="text-slate-200">Engineering is always at capacity?</strong> Add a backend developer:
        </p>
      </div>
      <CodeBlock title="ORG.md">{`#### Backend Developer
Builds and maintains APIs, databases, and server infrastructure.
- **Model:** ollama/qwen2.5
- **Domain:** backend
- **Count:** 3   ← was 2`}</CodeBlock>
      <CodeBlock title="bash">{`npx openspawn apply ORG.md`}</CodeBlock>
      <p className="mb-6 text-slate-400">
        One new agent spawns. Existing agents keep running. No restart needed.
      </p>

      {/* Real-world example */}
      <h2 className="mt-12 mb-4 text-2xl font-bold text-slate-100">A Real-World Example — Marketing Agency</h2>
      <p className="mb-4 text-slate-400">
        Here's a complete ORG.md for a different context: a small marketing agency with client delivery teams.
      </p>
      <CodeBlock title="ORG.md">{`# Fieldwork Agency

## Identity

We run performance marketing for B2B SaaS companies.
Fast execution, data-driven decisions, client visibility at every step.

- **Industry:** Marketing services
- **Stage:** Established, 12-person team equivalent
- **Values:** Deadlines are non-negotiable. Show your work. Clients first.

## Culture

preset: agency
- **Progress updates:** every cycle — clients want visibility
- **Ack required:** yes
- **Escalation:** immediate — a delayed escalation is a missed deadline

## Structure

### Account Director
Manages client relationships and final delivery sign-off.
Routes incoming briefs to the right team.
- **Model:** claude-sonnet
- **Domain:** account-management

### Strategy
Defines what we're doing and why before anyone writes a word or buys a click.

#### Strategy Lead
Owns briefs, positioning, messaging frameworks, and audience analysis.
- **Model:** claude-sonnet
- **Domain:** content-strategy

#### Market Researcher
Gathers competitive intelligence, industry trends, and audience data.
- **Model:** claude-haiku
- **Domain:** research

### Creative
Everything that ships to the client or goes live.

#### Creative Lead
Reviews all output before it leaves the team.
- **Model:** claude-sonnet
- **Domain:** creative-direction

#### Copywriter
Writes ad copy, email sequences, landing pages, and social content.
- **Model:** claude-haiku
- **Domain:** copywriting
- **Count:** 3

#### Designer Brief Writer
Translates creative direction into detailed design briefs.
- **Model:** claude-haiku
- **Domain:** design-direction

### Analytics
Measures what happened. Tells us what to do next.

#### Analytics Lead
Owns reporting, attribution, and optimization recommendations.
- **Model:** claude-sonnet
- **Domain:** analytics

#### Data Analyst
Pulls performance data, builds dashboards, flags anomalies.
- **Model:** claude-haiku
- **Domain:** data
- **Count:** 2

## Policies

### Budget
- **Per-agent limit:** 800 credits/period
- **Alert threshold:** 75%
- **Overage behavior:** pause and escalate immediately
- **Period:** daily

### Client SLA
All client-deliverable tasks must complete within:
- **Urgent:** 1 cycle
- **Standard:** 8 cycles
- **Background:** 48 cycles

### Permissions
- **L7+ can create subtasks**
- **Creative Lead has final review authority on all content output**
- **All agents can escalate**

### Department Caps
- Strategy: max 4 agents
- Creative: max 8 agents
- Analytics: max 4 agents

## Playbooks

### New Client Brief Arrives
1. Account Director receives brief, confirms deadline and deliverables
2. Account Director creates tasks for Strategy Lead and Creative Lead
3. Strategy Lead runs research and produces messaging framework
4. Creative Lead assigns production tasks to Copywriters
5. All output reviewed by Creative Lead before delivery
6. Account Director packages and delivers to client

### Missed Deadline Risk
1. Any agent who sees a task at risk flags it immediately
2. Creative Lead receives flag and reassesses priorities
3. If reassignment needed, Account Director is looped in
4. Client is proactively updated (Account Director drafts message)`}</CodeBlock>
      <p className="mb-4 text-slate-400">
        This org runs 11 agents across 3 departments. Every brief that comes in gets strategy, creative, and analytics
        work done in sequence. The SLA policy ensures nothing sits idle.
      </p>

      {/* Tips */}
      <h2 className="mt-12 mb-4 text-2xl font-bold text-slate-100">Tips for Writing Good ORG.md Files</h2>
      <div className="mb-6 space-y-3 text-slate-400">
        <p>
          <strong className="text-slate-200">Be specific in role descriptions.</strong> "Does engineering work" is a
          bad description. "Builds and maintains the REST API, database schemas, and authentication layer" is a good
          one. Specific descriptions lead to accurate task routing.
        </p>
        <p>
          <strong className="text-slate-200">Start smaller than you think you need.</strong> Three agents is enough to
          see the whole system work. Add complexity only when you hit a real limit.
        </p>
        <p>
          <strong className="text-slate-200">Use ollama/qwen2.5 for workers.</strong> Your leads need judgment (use
          claude-haiku at minimum). Your workers need execution. Local models are fast and free for execution tasks.
        </p>
        <p>
          <strong className="text-slate-200">Write Culture before you need it.</strong> The default communication
          settings are fine for testing. Set{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-400">ack required: yes</code> and{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-400">escalation: immediate</code> from the
          start.
        </p>
        <p>
          <strong className="text-slate-200">Commit your ORG.md to git.</strong> Every change to your org is a git
          commit. <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-400">git log ORG.md</code> becomes your
          org history.{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-400">git revert</code> undoes a structural
          decision that didn't work out.
        </p>
        <p>
          <strong className="text-slate-200">Export regularly.</strong> When leads spawn new agents dynamically, the
          running org diverges from your file. Run{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-400">
            npx openspawn export &gt; ORG.md
          </code>{" "}
          to sync them.
        </p>
      </div>

      {/* What to Read Next */}
      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">What to Read Next</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          {
            title: "ORG.md Reference",
            desc: "Every field, every option, every default",
            to: "/docs/reference/org-md",
          },
          {
            title: "Dashboard Walkthrough",
            desc: "Health scores, trust scores, escalation chains",
            to: "/docs/features/dashboard",
          },
          {
            title: "A2A Protocol",
            desc: "External agent discovery and task routing",
            to: "/docs/protocols/a2a",
          },
          {
            title: "OpenClaw Integration",
            desc: "Already running OpenClaw agents? Add org structure",
            to: "/docs/openclaw",
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

      <p className="mt-10 text-sm text-slate-500 italic">
        Your ORG.md is a living document. The best ones aren't designed upfront — they're evolved over dozens of{" "}
        <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs">npx openspawn apply</code> calls, each
        one a lesson learned about how your agents actually work.
      </p>
    </DocsLayout>
  );
}
