---
source: https://openspawn.ai/docs/how-it-works
generated: 2026-03-14
---

# How It Works

## The One-Paragraph Version

The 30-second mental model for OpenSpawn — what it is, how it's structured, and how work actually flows through an agent organization. Before you run a single command, this page gives you the mental model. Five minutes here will save you an hour of confusion later. OpenSpawn is a platform for building and running

organizations made of AI agents. You describe your org in a single markdown file (called ORG.md) — who the agents are, how they're structured, what they're allowed to do, and how they communicate. OpenSpawn reads that file, spins up a live simulation, and your agents start working: delegating tasks, reporting progress, escalating blockers, and completing work — just like a real team. The unique part: OpenSpawn agents can also reach into the physical world, controlling phones, cameras, screens, and IoT devices through paired

nodes. No other multi-agent platform does this. The Big Idea: ORG.md as Source of Truth Most agent frameworks treat agents as isolated function calls. You wire them together in code, run them once, and start over. There's no memory of the team, no persistent structure, no org. OpenSpawn takes a different approach:

your organization lives in a file.

ORG.md is plain markdown. It defines everything:

Who your agents are — names, roles, the model they run (GPT-4o, Claude Sonnet, Ollama/Llama3)

How they're structured — a hierarchy with a COO at the top, leads in the middle, workers at the bottom

What they care about — their domains, responsibilities, and decision-making authority

How they communicate — polling vs event-driven, escalation rules, cultural defaults

```
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
```

What they're allowed to spend — model cost caps per agent This file is your org chart, your configuration, and your documentation — all in one. Check it into git. Review changes with git diff. Roll back bad configurations like bad code. The documentation is the system.

The mental model:

ORG.md = the org chart + employee handbook

Agents = employees with clear roles and reporting lines

Nodes = company devices (phones, laptops, cameras, sensors)

Tasks = the actual work flowing through the How Agents Communicate: The Agent Communication Protocol (ACP) When an agent receives a task, completes work, or hits a blocker, it doesn't just silently update a database. It communicates — through a structured protocol called

ACP. The design philosophy comes from how effective human organizations actually work:

Push what's urgent. Pull what's optional. Minimize interrupts.

### 👍 Acknowledgment (ACK)

### 📋 Progress Updates

ACP defines four types of messages: When an agent receives a task, it immediately reacts with a thumbs-up. No LLM call needed — this is a systems-level signal. The delegator knows the task landed and can move on. As an agent works, it writes updates to the task's activity log. These are

pull-based — the manager checks when

### 🚨 Escalation

they want to, not when the agent decides to interrupt. Think of it like checking a project board instead of tapping someone's shoulder. When an agent can't proceed — blocked on a resource, out of its domain, over budget, low confidence — it escalates

immediately and loudly to its direct manager. Escalations are push-based because blockers need attention now. The escalation carries a reason (BLOCKED,

OUT_OF_DOMAIN,

### ✅ Completion

OVER_BUDGET, etc.) so the manager can act quickly. The manager decides what to do: provide the missing resource, reassign the task, handle it themselves, or escalate further up the chain. When work is done, the agent sends a completion signal (a ✅ reaction) plus a short summary message. The delegator gets the signal to proceed with dependent work.

Why this matters: Most multi-agent systems either have no communication (fire-and-forget) or too much (every agent broadcasts everything). ACP gives you graduated communication — the right signal at the right noise level. Blockers propagate upward instantly. Progress sits quietly in a log until someone looks. Completions trigger the next stage of work. How Work Flows: Ticks, Decisions, and Delegation OpenSpawn runs a continuous simulation loop called a

### The agent decision cycle

```
1. Agent reads its inbox and task queue
2. LLM decides: work on a task / delegate to a report / escalate / complete / idle
3. Action generates ACP messages (delegation, progress, completion, escalation)
```

### Task delegation flows downward

```
↓
COO decomposes it → delegates subtasks to Engineering Lead
↓
Engineering Lead assigns → Backend Worker (API), Frontend Worker (UI)
↓
Workers execute, report progress, complete
↓
Lead collects completions, rolls up to COO
↓
```

tick. Every tick, each agent in the org wakes up, reads its context (inbox, assigned tasks, org state), and decides what to do next. Work enters the org at the top (a human sends an order, a scheduled trigger fires, or an external event arrives) and cascades down through the hierarchy: Each step generates ACP messages. Each message is a decision. A single human request can produce hundreds of decisions — delegation, acknowledgment, progress, escalation, unblocking, re-delegation, completion — all tracked, all visible on the dashboard. Polling vs event-driven execution Not all agents need to wake up every tick. OpenSpawn supports two execution modes:

Polling mode (default for workers): Agent wakes on every tick. Best for workers who almost always have tasks. Cheap models (Haiku, Ollama) can afford to poll — even at 120 calls/hour, the cost is cents.

```
- **Trigger:** event-driven
```

Event-driven mode (best for managers): Agent sleeps until its inbox receives a message. A COO running Claude Opus might only get 5 meaningful events per hour — polling would waste $14/hr checking an empty inbox. Event-driven brings that to $0.60/hr for the same work. You configure this in ORG.md: The org adapts: cheap workers poll constantly, expensive managers sleep until needed. How It Connects to the Real World: Nodes This is what sets OpenSpawn apart from every other agent platform.

Nodes are real-world devices — phones, laptops, desktop screens, cameras, IoT sensors — paired to your OpenSpawn org. When an agent needs to interact with the physical world, it reaches through a node.

What agents can do through nodes: 📸 Camera — take photos or video clips from paired phones or webcams 🖥️ Screen — capture or interact with a connected desktop screen 📍 Location — get GPS coordinates from a paired mobile device 🔔 Notifications — push alerts to phones or smart displays 🤖 Run commands — execute shell commands on a paired machine 📺 Canvas — present live content (charts, dashboards, prompts) to a connected display A surveillance agent can check a camera feed, summarize what it sees, and escalate to the COO if something needs attention. A monitoring agent can run health-check commands on a server, then push a notification to an on-call engineer's phone. An event coordinator agent can display a live countdown on a lobby screen. No custom APIs. No glue code. You give your agent access to a node in

## Architecture at a Glance

ORG.md, and it has eyes and hands in the physical world.

Here's how the pieces fit together:

The request lifecycle in one sentence: A task enters the org at the top → cascades down through delegation → each agent wakes (by tick or event), decides an action, and generates ACP messages → completions bubble back up → the dashboard shows every step in real time → agents with node access can reach into the physical world at any point. What Makes OpenSpawn Different Most multi-agent frameworks give you:

OpenSpawn gives you: A living org defined in version-controlled markdown A communication protocol modeled on how real organizations work

Cost-efficient execution that matches model costs to decision value

## Where to Go Next

Physical-world reach through paired devices — the capability no competitor has The BikiniBottom demo ( href="https://bikinibottom.ai/app" target="_blank" rel="noopener" bikinibottom.ai/app ) shows this concretely: 22 SpongeBob-themed agents across 5 departments running a real company, live, right now. It's the same infrastructure you'd use for your own org — just with better character names.

You have the mental model. Now put it to work: title: "Getting Started →", desc: "Scaffold your first org and send it a task in under 5 minutes", to: "/docs/getting-started", title: "Your First ORG.md", desc: "Build a real org from scratch, step by step", to: "/docs/tutorials/your-first-org-md", title: "A2A Protocol →", desc: "How OpenSpawn connects to other agents and services", to: "/docs/protocols/a2a", title: "MCP Tools →", desc: "Use your org as a tool server in Claude Desktop, Cursor, or any MCP client", to: "/docs/protocols/mcp", ].map((item) => ( key={item.to} to={item.to} href="https://bikinibottom.ai/app" target="_blank" rel="noopener"

Live Demo → Watch 22 agents run a company right now, no setup required
