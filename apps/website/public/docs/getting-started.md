---
source: https://openspawn.ai/docs/getting-started
generated: 2026-03-03
---

# Getting Started with OpenSpawn

## What is OpenSpawn?

What you'll have in ~10 minutes: a local org of AI agents, coordinated by a markdown file, visible in a real-time dashboard — with tasks flowing through a hierarchy you define. OpenSpawn is a coordination layer for AI agents. It's not an agent framework — you keep using whatever you're using (OpenClaw, LangGraph, Claude Code, or just raw API calls). OpenSpawn adds the layer on top that most multi-agent systems are missing: structure. Here's the problem it solves: you have agents. They can each do things. But they don't know who's in charge, how to escalate a blocker, who should pick up what task, or how to divide work without stepping on each other. You end up hand-holding every interaction. OpenSpawn gives your agents an org chart. A COO. Department leads. Workers with defined domains. A communication protocol that mirrors how effective human teams operate — acknowledgments, progress updates, escalations. And a real-time dashboard so you can see all of it. The entire org is defined in a single markdown file:

## Before You Start

## Step 1 — Scaffold Your Org

```
├── ORG.md # Your org definition — this is the important one
```

```
## Identity
A small, fast-moving team. We ship things.
- **Industry:** Technology
- **Stage:** Early
## Culture
preset: startup
## Structure
### COO
The operational lead. Receives tasks, delegates to department leads,
ensures nothing falls through the cracks.
- **Model:** claude-sonnet
- **Domain:** operations
### Engineering
#### Engineering Lead
Triages technical work. Breaks projects into tasks. Delegates to workers.
- **Model:** claude-haiku
- **Domain:** engineering
#### Backend Workers
Write code, run tests, build APIs.
- **Model:** ollama/qwen2.5
- **Domain:** backend
- **Count:** 2
## Policies
### Budget
- **Per-agent limit:** 500 credits/period
- **Alert threshold:** 80%
```

ORG.md. Let's look at what ORG.md contains by default:

Take a moment to read this. A few things to notice:

Prose descriptions become system prompt context. "Triages technical work. Breaks projects into tasks." isn't just a comment — it's injected into the Engineering Lead's context every time it runs.

Heading levels define the hierarchy. H3 (

###) is a department or top-level role. H4 (####) is a team member that reports to the H3 above it.

Count: 2 spawns multiple agents with the same role — auto-numbered as "Backend Worker 1", "Backend Worker 2".

## Step 2 — Start the Server

```
Parsing ORG.md...
✓ Found 5 agents (1 COO, 1 Lead, 2 Workers, 1 implicit observer)
✓ Applied culture: startup
✓ Loaded policies: budget limits, routing rules
Spawning agents...
✓ COO (claude-sonnet, L10, operations)
✓ Engineering Lead (claude-haiku, L7, engineering)
✓ Backend Worker 1 (ollama/qwen2.5, L4, backend)
✓ Backend Worker 2 (ollama/qwen2.5, L4, backend)
Server running at http://localhost:3333
```

preset: startup is shorthand for a set of communication defaults — immediate escalation, frequent progress updates, shallow hierarchy. Open http://localhost:3333/app/ — your dashboard is live.

What you're seeing:

Network graph: Your org hierarchy visualized. The COO is at the top.

Agent cards: Each agent with their level, domain, model, and current status.

## Step 3 — Send Your First Task

```
-H 'Content-Type: application/json' \\
-d '{
"message": {
"role": "user",
"parts": [{ "kind": "text", "text": "Build a REST API for user management with CRUD endpoints" }]
```

Task timeline: Empty for now — we'll fix that next.

You'll get back a response with a taskId. Watch what happens in the dashboard: This entire chain — delegation, acknowledgment, progress, completion — follows the

Agent Communication Protocol (ACP). ACP is what keeps agents from silently failing or stepping on each other.

```
-H 'Content-Type: application/json' \\
-d '{
"message": {
"role": "user",
"parts": [{ "kind": "text", "text": "Deploy the API to production with zero downtime and handle all edge cases" }]
```

## Step 4 — Understand What You're Looking At

To trigger a visible escalation intentionally: A sufficiently ambiguous task will trigger an escalation chain. Watch the task status change to "BLOCKED" in the dashboard.

The dashboard is where you diagnose your org:

Network graph

Task timeline

Trust scores

## Step 5 — Modify Your Org

```
Write code, run tests, build APIs.
- **Model:** ollama/qwen2.5
- **Domain:** backend
- **Count:** 2
+#### Docs Agent
+Keeps documentation in sync with code changes. Writes API docs,
+READMEs, and inline comments.
+- **Model:** ollama/qwen2.5
```

## Step 6 — See It at Scale (Optional)

```
-H 'Content-Type: application/json' \\
-d '{
"message": {
"role": "user",
"parts": [{ "kind": "text", "text": "Write a brief analysis of the tradeoffs between microservices and monoliths for a B2B SaaS product" }]
```

## Step 7 — Expose Your Org via A2A

```
"name": "My Org",
"url": "http://localhost:3333",
"protocolVersion": "0.3",
"capabilities": { "streaming": true },
"skills": [
{ "id": "task-delegation", "name": "Task Delegation" },
{ "id": "agent-coordination", "name": "Agent Coordination" }
]
```

## Step 8 — Use as an MCP Tool Server

```
"mcpServers": {
"my-org": {
"url": "http://localhost:3333/mcp",
"transport": "streamable-http"
```

Health score (top of dashboard) Open ORG.md and add a new agent: Now apply the change — without restarting: OpenSpawn automatically publishes an Agent Card at the standard A2A discovery endpoint: Any A2A-compatible agent — from any framework — can discover your org and send it tasks. Each individual agent also has their own Agent Card at If you're using Claude Desktop, Cursor, or any MCP-compatible client, add your org as a tool server: This exposes 7 tools:

delegate_task,

list_agents,

get_agent,

list_tasks,

get_task,

send_message,

## What's Actually Happening Under the Hood

get_org_stats.

Tick-based execution: The server runs a loop. On each "tick", every agent checks its inbox, decides what to do (work, delegate, escalate, complete, or idle), and acts. Cheap local models poll every tick because they're nearly free. Expensive models can be configured to wake only when they have actual work.

The model router: OpenSpawn automatically routes to the right model based on agent level. L9–L10 executives get top-tier models. L7–L8 leads get mid-tier. L1–L6 workers get local Ollama — free. A 25-agent org with naive polling on the best model could cost $36/hour. With tiered routing, it's closer to $8.

## Next Steps

## Quick Reference

ACP is the nervous system: Every meaningful agent action generates a structured message. Delegations, acknowledgments, progress updates, escalations, completions — all flow through the Agent Communication Protocol. The dashboard reads ACP message streams in real-time via SSE. title: "Your First ORG.md", desc: "Full tutorial — all five sections, from scratch", to: "/docs/tutorials/your-first-org-md", title: "Dashboard Walkthrough", desc: "Reading health scores, diagnosing escalation chains", to: "/docs/features/dashboard", title: "A2A Protocol", desc: "External agent discovery and task routing", to: "/docs/protocols/a2a", title: "MCP Tools", desc: "All 7 tools with examples", to: "/docs/protocols/mcp", ].map((item) => ( key={item.to} to={item.to}

Command

What it does ["npx openspawn init ", "Scaffold a new org"], ["npx openspawn start", "Start the server + dashboard"], ["npx openspawn apply ORG.md", "Apply changes without restart"], ["npx openspawn deploy ORG.md", "Deploy from scratch"], ["npx openspawn export > ORG.md", "Export current state to file"], ["npx openspawn snapshot", "Create a versioned config snapshot"], ["npx openspawn demo", "Run the demo org (no config needed)"], ].map(([cmd, desc]) => (

Endpoint

What it does ["GET /.well-known/agent.json", "Agent Card (A2A discovery)"], ["POST /a2a/message/send", "Send a task to the org"], ["POST /a2a/message/stream", "Send a task with SSE streaming"], ["POST /mcp", "MCP tool server"], ["GET /api/agents", "List all agents"], ["GET /api/tasks", "List all tasks"], ["GET /api/org/stats", "Org health stats"], ].map(([ep, desc]) => ( ORG.md is the thing. Everything else — the server, the dashboard, the protocols — is infrastructure that makes ORG.md useful. Start there, and the rest follows.
