---
purpose: Answer the top questions agents and humans ask about OpenSpawn
audience: AI agents (primary), developers (secondary)
related: [agent-quickstart.md, getting-started.md, mcp-reference.md, troubleshooting.md]
---

# OpenSpawn FAQ

**What you'll learn:** Answers to the 20 most common questions about OpenSpawn — what it is, how to use it, how it compares to alternatives, and how agents interact with it.

> **TL;DR for agents:** OpenSpawn is a coordination layer. You define an org in `ORG.md`, run `openspawn start`, and agents communicate via MCP tools at `POST /mcp`. If you're blocked, escalate up the chain. If you're done, `task_complete`.

---

## General

### Q1: What is OpenSpawn?

OpenSpawn is an **open-source coordination layer for AI agent organizations**. You define your entire agent org — roles, hierarchy, culture, policies — in a single markdown file (`ORG.md`). OpenSpawn parses it, assigns agents, routes tasks through the hierarchy, and provides a real-time dashboard.

It is **infrastructure, not a framework**: it works with any agent stack (OpenClaw, LangGraph, CrewAI, AutoGen, raw API calls).

### Q2: How is OpenSpawn different from CrewAI or LangGraph?

```
CrewAI / LangGraph = agent frameworks (how you BUILD agents)
OpenSpawn = coordination layer (how you ORGANIZE agents)
```

- **CrewAI/LangGraph** define how agents execute tasks
- **OpenSpawn** defines who does what, who they report to, what they can spend, and who approves decisions

They're designed to work together, not replace each other.

### Q3: Do I need to rewrite my agents to use OpenSpawn?

**No.** OpenSpawn connects to your existing agents via standard protocols:
- **MCP** (Model Context Protocol) — for tool calls
- **A2A** (Agent-to-Agent) — for inter-org communication
- **REST** — for direct API calls

Your agents keep running as-is. OpenSpawn adds the coordination layer on top.

### Q4: Do I need API keys to try it?

**No.** Demo/simulation mode works out of the box:

```bash
npx openspawn init my-org --template=assistant-team --non-interactive
cd my-org
openspawn preview
# Open http://localhost:3333
```

You'll see the full coordination flow with simulated agents, no API keys needed.

### Q5: Is OpenSpawn free?

**Yes.** MIT open source. Self-hosted. No usage fees.

Optional: paid hosted tier (in development) for teams that don't want to self-host.

---

## Setup & Installation

### Q6: What are the prerequisites?

- **Required:** Node.js 18+ (`node --version`)
- **Optional for real inference:**
  - [Ollama](https://ollama.ai) — free local models
  - [Groq](https://groq.com) API key — fast mid-tier models
  - [OpenRouter](https://openrouter.ai) API key — Claude/GPT-4o for executives

### Q7: What are the three commands to get a running org?

```bash
openspawn init my-org --template=assistant-team --yes
cd my-org
openspawn start
openspawn status
```

- `init` — creates `ORG.md` and `openclaw-agents.json`
- `start` — reads agents config, generates `openclaw-patch.json`
- `status` — displays agent table (name, level, model, workspace, reports-to)

### Q8: Which template should I use?

```
What's your primary output?
├── Code/software      → dev-shop
├── Content            → content-agency
├── Research/analysis  → research-lab
└── Mix / solo op      → assistant-team
```

All templates are starting points — edit the generated `ORG.md` freely.

### Q9: What is `openclaw-patch.json` and what do I do with it?

`openclaw-patch.json` is a ready-to-apply patch for your OpenClaw gateway's `agents.list`. It contains entries with:
- `id` — agent identifier (lowercase hyphenated name)
- `model` — `opus` for L7+ agents, `sonnet` for L6 and below
- `workspace` — agent workspace path
- `tools.profile: "full"` — full tool access
- `subagents.allowAgents` — for manager agents (L7+ with direct reports)
- `default: true` — on the highest-level agent

**To apply:** copy the entries from `openclaw-patch.json` into your OpenClaw `agents.list` config, then restart the gateway.

### Q10: How do I validate my ORG.md?

```bash
openspawn validate
# or
openspawn validate path/to/ORG.md
```

Checks: valid markdown structure, required sections, agent role definitions, hierarchy consistency, policy completeness.

**Common errors and fixes:**

| Error | Fix |
|-------|-----|
| `Missing Structure section` | Add `## Structure` with at least one agent |
| `Agent reports to unknown agent` | Check `Reports to` matches an agent name exactly |
| `No top-level agent` | One agent must have `Reports to: Human Principal` |
| `Circular reporting chain` | No agent can report to itself or create a loop |

---

## ORG.md

### Q11: What's the minimum viable ORG.md?

```markdown
# My Org

## Structure

### Boss — Leader
- **Level:** 10
- **Reports to:** Human Principal
```

That's it. One heading, one agent, one level, one reporting line.

### Q12: What do agent levels mean?

| Level | Role type | Permissions |
|-------|-----------|-------------|
| L1-L5 | Workers | Execute tasks |
| L6 | Seniors | Review and approve work |
| L7-L9 | Leads | Create tasks, spawn agents, manage teams |
| L10 | Executives | Top of hierarchy |

### Q13: What are the five ORG.md sections?

| Section | Purpose | Required? |
|---------|---------|-----------|
| `## Identity` | Name, mission, values — ambient context for all agents | No |
| `## Culture` | Communication norms, escalation speed, preset | No |
| `## Structure` | Agent roles and hierarchy | **Yes** |
| `## Policies` | Budget limits, caps, permissions | No |
| `## Playbooks` | Step-by-step procedures for common scenarios | No |

### Q14: What are culture presets?

Presets are shorthand for configuring communication norms. Use one line:

```markdown
## Culture
preset: startup
```

| Preset | Escalation | Progress | Best for |
|--------|-----------|----------|---------|
| `startup` | Immediate | Frequent | Small fast teams |
| `enterprise` | Batched (hourly) | On phase change | Large orgs with process |
| `agency` | Immediate | Every tick | Client work with deadlines |
| `research` | Delayed | On request | Exploration, long tasks |
| `military` | Immediate | Every tick | Zero-ambiguity operations |
| `remote-async` | Delayed | On request | Distributed async teams |

---

## MCP & Agent Interaction

### Q15: How do agents interact with OpenSpawn?

Via **MCP tools** at `POST /mcp`. Authentication is HMAC — set `AGENT_ID` and `AGENT_SECRET` env vars.

Core workflow:

```
agent_list           → see who's in the org
task_create          → assign work to another agent
task_claim           → atomically claim an open task
task_complete        → mark work done with results
escalation_create    → flag a blocker to your manager
message_send         → send TASK/RESULT/ESCALATION/DECISION
credits_balance      → check your budget
org_status           → full org overview
```

Full tool reference: [`docs/mcp-reference.md`](./mcp-reference.md)

### Q16: Can two agents claim the same task?

**No.** `task_claim` is **atomic** — only one agent wins the claim, the other gets an error. This prevents duplicate work by design.

```
tool: task_claim { task_id: "abc123", agent_id: "engineer-1" }
```

### Q17: What happens when an agent is blocked?

1. Agent sends `escalation_create` to its direct manager (never skips the chain)
2. Manager has 2 cycles to respond: unblock, reassign, or escalate further
3. If unresolved after 2 levels, alert goes to the Human Principal

---

## Communication Protocol

### Q18: How do agents communicate efficiently?

The [Agent Communication Protocol](./communication-protocol.md) defines 4 message types — **no ACKs, no courtesy messages**:

| Type | Direction | When |
|------|-----------|------|
| `TASK` | Lead → Worker | Work assignment |
| `RESULT` | Worker → Lead | Deliverable notification |
| `ESCALATION` | Worker → Lead | Blocker requiring help |
| `DECISION` | Lead → Worker | Resolves an escalation |

**Core rule:** Silence = success. If an agent is working, it stays silent. Only message when blocked, assigning, delivering, or resolving.

### Q19: What files do agents use to share state?

Instead of sending messages, agents write to shared workspace files:

| File | Owner | Purpose |
|------|-------|---------|
| `PLAN.md` | Lead agent | Current sprint plan with task assignments |
| `RESULT.md` | Workers | Completed deliverables |
| `HANDOFF.md` | Any agent | Work ready for next stage |
| `REVIEW.md` | Reviewers | Feedback and approvals |
| `ESCALATION.md` | Any agent | Complex issues needing >3 turns |

---

## Troubleshooting

### Q20: Where do I go when something's broken?

1. Run `openspawn validate` — catches most config issues
2. Check [`docs/troubleshooting.md`](./troubleshooting.md) — common errors and fixes
3. Check port conflicts: `lsof -i :3333`
4. Review auth: verify `AGENT_ID` and `AGENT_SECRET` match API config
5. GitHub issues: https://github.com/openspawn/openspawn/issues

---

## Next steps

- **Start building:** [`docs/agent-quickstart.md`](./agent-quickstart.md)
- **Full setup walkthrough:** [`docs/getting-started.md`](./getting-started.md)
- **All MCP tools:** [`docs/mcp-reference.md`](./mcp-reference.md)
- **Fix a specific error:** [`docs/troubleshooting.md`](./troubleshooting.md)
- **Live demo:** https://bikinibottom.ai/app/
