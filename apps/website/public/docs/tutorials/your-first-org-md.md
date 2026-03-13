---
source: https://openspawn.ai/docs/tutorials/your-first-org-md
generated: 2026-03-13
---

# Your First ORG.md

## The Big Idea

```
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
```

```
Parsing ORG.md...
✓ Found 3 agents
Spawning agents...
✓ COO (claude-sonnet, L10, operations)
✓ Developer (claude-haiku, L4, engineering)
✓ Writer (claude-haiku, L4, content)
```

```
-H 'Content-Type: application/json' \\
```

What you'll build: a working ORG.md from scratch — starting with three agents, ending with a production-ready org that has departments, culture settings, policies, and playbooks. ORG.md is a single markdown file that defines your entire agent organization. Not a YAML config, not a JSON blob — markdown. The kind you can read in GitHub, edit in any text editor, and check into version control alongside your code. It looks like documentation. It is documentation. But it's also the thing that runs your agents. That's it. Three agents. A COO who receives tasks and delegates, a Developer who handles engineering work, and a Writer who handles content. Watch the dashboard. The COO receives the task, decides it's content work, and delegates to the Writer. The Writer writes. The COO reports back.

### What's Happening Here

It works. Three agents, no configuration beyond what you just wrote, and you have a functioning delegation chain. Let's break down what OpenSpawn is reading from those three roles.

The COO role —

### COO is an H3 heading. OpenSpawn recognizes "COO" as a C-level keyword and assigns level L10 — this agent can delegate and has authority over the whole org. The prose "Routes work to the right person." becomes the COO's system prompt context — the LLM reads this and uses it to decide how to behave.

Hierarchy inference: When the COO delegates, it matches the task domain against available agents. "Write a README" matches

## Part 2 — Adding Departments

```
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
```

domain: content, so it goes to the Writer. "Fix the auth bug" would match domain: engineering and go to the Developer. No explicit routing rules needed. Three agents is fine for a personal project. But when you have more than ~5 agents, flat structures get messy. The COO ends up managing too many direct reports, and tasks take too long to route. The answer is departments. Apply this change to your running org —

```
New: Engineering Lead → spawning
New: Backend Developer 1 → spawning
New: Backend Developer 2 → spawning
New: Frontend Developer → spawning
New: Content Lead → spawning
New: Writer 1 → spawning
New: Writer 2 → spawning
Modified: Developer → removed (was replaced by Engineering structure)
Modified: Writer → removed (was replaced by Content structure)
```

### Reading the New Structure

no restart needed: Your org just grew from 3 to 8 agents, live, without restarting. The COO is still running. Any in-flight tasks continue uninterrupted.

Departments are H3 headings without role keywords — "Engineering" isn't a role keyword, so it's read as a container for the roles nested beneath it. The prose becomes context all agents in the department share.

Department leads are the first H4 role under the department. The "Lead" keyword assigns level L7. L7+ agents can delegate to agents below them and receive work from the COO.

Count: 2 spawns two agents: "Backend Developer 1" and "Backend Developer 2". They're independent — separate task queues, separate trust scores. The Engineering Lead picks the one with capacity (or higher trust for harder tasks).

## Part 3 — Adding Culture

Why ollama/qwen2.5 for workers? Economics. A backend developer agent runs every tick. At Claude Sonnet prices, that's expensive at scale. A free local model handles execution tasks just fine. Right now your org uses all defaults for communication. Add a

```
## Culture
We're a small team that moves fast. Communication should be transparent
but not noisy. Nobody should be blocked without their manager knowing.
- **Communication:** async-first
- **Escalation:** immediate — if you're blocked, say so right away
- **Progress updates:** on phase change — update when something meaningfully changes
- **Ack required:** yes — if you receive a task, confirm you have it
- **Hierarchy depth:** shallow — max 3 levels, keep the org lean
## Structure
```

Culture section:

Or, if you prefer shorthand:

Available presets:

Preset

```
preset: startup
```

Best for ["startup", "Small teams, fast iteration, direct communication"], ["enterprise", "Large orgs, batched escalations, formal process"], ["agency", "Client-facing work, high visibility, deadline-driven"], ["research", "Long-running exploratory tasks, high autonomy"], ["remote-async", "Distributed teams, high trust, async-first"], ].map(([preset, desc]) => ( You can use a preset and override individual settings: What Culture Actually Changes Culture maps directly to the Agent Communication Protocol (ACP) — the message-passing system that governs how agents talk to each other. When you set

Ack required: yes, every delegation automatically triggers an acknowledgment. When you set

## Part 4 — Adding Identity

Escalation: immediate, a blocked agent escalates in the same tick it gets stuck. These aren't suggestions — they're ACP configuration. The protocol enforces them. Identity is ambient context for the entire org. Every agent has access to it. It answers:

```
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
```

## Part 5 — Adding Policies

```
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
```

why do we exist, what are we building, what do we value? Identity influences agent behavior in subtle but meaningful ways. A marketing agent writing copy knows they're writing for a developer tools audience. An engineering agent prioritizing work knows that "document everything" is a value, not a suggestion. Write Identity like you'd write the first page of a company handbook — terse, clear, honest about who you are. Policies are guardrails. They're not suggestions — OpenSpawn enforces them.

Budget limits are per-agent, not per-org. If Backend Developer 1 hits 500 credits, it pauses. Backend Developer 2 keeps running. Override per-agent by adding

**Budget:** 1000 credits/period to any role.

Department caps prevent runaway spawning. Leads with L7+ can spawn new agents when overloaded. Without a cap, an Engineering Lead could decide it needs 20 backend developers and blow your budget.

## Part 6 — Adding Playbooks

```
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
```

## The Complete ORG.md

Working hours are optional but powerful. If you're running agents that cost real money, off-hours queuing means tasks pile up overnight and get processed in the morning — nothing is lost, nothing is wasted. Playbooks are reusable procedures. When a standard situation occurs — a new task arrives, an agent gets blocked, a new agent joins — the relevant playbook kicks in. Playbooks aren't just documentation — they're instructions the system follows. When an agent status changes to BLOCKED, OpenSpawn looks up the "Agent Blocked" playbook and executes the steps.

```
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
```

```
npx openspawn deploy ORG.md
# Or apply to a running org
```

```
-H 'Content-Type: application/json' \\
```

Here's everything together: What Happens When You Run This Open the dashboard at href="http://localhost:3333/app/" target="_blank" rel="noopener" http://localhost:3333/app/ . You'll see a COO at the top, Engineering and Content departments branching down, with leads and workers beneath each. Send a task:

## Iterating on Your Org

Watch it flow: The entire chain is logged. Click the task in the timeline to see every delegation message, every ack, every status change.

The file is alive. Change it as you learn.

High escalation rate? Check your Structure descriptions. Are roles clear about what they own? An agent that receives an out-of-domain task will escalate because it doesn't know how to handle it.

An agent is always idle? Its domain might be too narrow. Broaden the description or merge the role into a related one.

```
Builds and maintains APIs, databases, and server infrastructure.
- **Model:** ollama/qwen2.5
- **Domain:** backend
```

```
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
```

Engineering is always at capacity? Add a backend developer: This org runs 11 agents across 3 departments. Every brief that comes in gets strategy, creative, and analytics work done in sequence. The SLA policy ensures nothing sits idle. Tips for Writing Good ORG.md Files

Be specific in role descriptions. "Does engineering work" is a bad description. "Builds and maintains the REST API, database schemas, and authentication layer" is a good one. Specific descriptions lead to accurate task routing.

Start smaller than you think you need. Three agents is enough to see the whole system work. Add complexity only when you hit a real limit.

Use ollama/qwen2.5 for workers. Your leads need judgment (use claude-haiku at minimum). Your workers need execution. Local models are fast and free for execution tasks.

Write Culture before you need it. The default communication settings are fine for testing. Set

ack required: yes and

escalation: immediate from the start.

Commit your ORG.md to git. Every change to your org is a git commit. git log ORG.md becomes your org history. git revert undoes a structural decision that didn't work out.

Export regularly. When leads spawn new agents dynamically, the running org diverges from your file. Run

## What to Read Next

npx openspawn export > ORG.md to sync them. title: "ORG.md Tutorial", desc: "Revisit any section: departments, culture, policies, playbooks", to: "/docs/tutorials/your-first-org-md", title: "Dashboard Walkthrough", desc: "Health scores, trust scores, escalation chains", to: "/docs/features/dashboard", title: "A2A Protocol", desc: "External agent discovery and task routing", to: "/docs/protocols/a2a", title: "OpenClaw Integration", desc: "Already running OpenClaw agents? Add org structure", to: "/docs/openclaw", ].map((item) => ( key={item.to} to={item.to} Your ORG.md is a living document. The best ones aren't designed upfront — they're evolved over dozens of npx openspawn apply calls, each one a lesson learned about how your agents actually work.
