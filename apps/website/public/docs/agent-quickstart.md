---
source: https://openspawn.ai/docs/agent-quickstart
generated: 2026-03-14
---

# Agent Quickstart

```
openspawn init my-org --template=assistant-team --yes
cd my-org
openspawn preview
openspawn start
```

You are an AI agent that needs to coordinate other agents. OpenSpawn gives you an org chart, task routing, escalation protocols, and a credit system — defined in a single markdown file. Three commands to a running org That's it. You now have a running org with a chief of staff, research analyst, content team, engineer, security auditor, and quality mentor — with OpenClaw gateway configs ready to apply.

Q: Do I need API keys? A: No. Demo/simulation mode works out of the box with zero configuration.

Q: What just happened? A: init created

ORG.md (your org definition) and

openclaw-agents.json.

start read the agents config and generated

openclaw-patch.json with OpenClaw gateway entries.

status displayed a table of all agents with their name, level, model, workspace, and reports-to.

Q: What is openclaw-patch.json? A: A ready-to-apply patch for your OpenClaw gateway's

agents.list. Each entry has:

id, model (opus for L7+, sonnet for L6-), workspace,

tools.profile: "full". Manager agents (L7+ with direct reports) also get subagents.allowAgents. The highest-level agent gets default: true.

## Boot sequence protocol

```
1. Read ORG.md → understand org structure, your role, who you report to
2. Read SOUL.md → internalize shared values and behavioral norms
3. Read AGENTS.md → understand workspace rules and tool access
4. Write PLAN.md → plan your approach before touching any code
5. Begin execution → follow plan, write RESULT.md when done
```

Q: How do I apply the patch to my gateway? A: Copy the entries from openclaw-patch.json into your OpenClaw agents.list configuration, then restart the gateway. Every agent follows a planning-first startup protocol before executing work:

## Task lifecycle via MCP

Q: Why planning-first? A: Agents that plan before executing produce higher-quality output and escalate blockers earlier. The plan is also reviewable by leads before work begins.

```
# Create a task (leads only, L7+)
mcp.call("openspawn/task_create", {
title: "Implement rate limiting",
assignee: "backend-senior",
priority: "high"
})
# Claim an available task (workers)
mcp.call("openspawn/task_claim", { agent_id: "backend-senior-1" })
# List tasks for an agent
mcp.call("openspawn/task_list", {
agent_id: "backend-senior-1",
status: "in_progress"
})
# Complete a task with results
mcp.call("openspawn/task_complete", {
task_id: "task-123",
result: "Rate limiting implemented — 100 req/min per API key"
})
```

## Init + deploy in one step

## Pick a template

```
openspawn init my-org --template=assistant-team # Personal AI team
openspawn init my-org --template=content-agency # Content production pipeline
openspawn init my-org --template=dev-shop # Software development team
openspawn init my-org --template=research-lab # Research & analysis team
```

```
openspawn init my-org --template=saas-onboarding # Customer onboarding pipeline
openspawn init my-org --template=incident-response # Production incident management
openspawn init my-org --template=contract-review # Legal contract analysis
openspawn init my-org --template=compliance-monitoring # Regulatory compliance
openspawn init my-org --template=game-live-ops # Game operations (events, patches)
openspawn init my-org --template=catalog-management # Product catalog maintenance
openspawn init my-org --template=clinical-trials # Clinical trial coordination
```

Agents manage their task queue through MCP tools:

```
What's your primary output?
├── Code/software → dev-shop
├── Content (blogs, docs) → content-agency
├── Research/analysis → research-lab
└── Mix of everything → assistant-team
```

Q: Which template should I use?

Q: Can I combine templates? A: Yes. Pick one as a starting point, then add agents from other templates into the Structure section of your ORG.md.

Q: Can I create agents not in any template? A: Absolutely. Templates are starting points. Add any agent to the

## Understanding ORG.md

```
# My Organization
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
- Escalate security issues immediately
```

## Structure section with a name, level, domain, and reporting line. Your entire org lives in one file. Five sections, all optional except Structure.

```
# My Org
## Structure
### Assistant — L7 — General
- Reports to: none
- Domain: all tasks
```

Q: What's the minimum viable ORG.md?

Q: What do levels mean? A: L1–L5: Workers. L6: Can review. L7–L9: Can create tasks/spawn agents. L10: Executive.

## Validate your org

```
✔ Structure: 6 agents found
✔ Hierarchy: all agents have valid report chains
✔ Levels: no conflicts detected
✔ Credits: pool and budgets are consistent
✔ Policies: 2 policies parsed
Result: ORG.md is valid ✅
```

Q: What's "Reports to"? A: Defines the escalation chain. When an agent is blocked, it escalates to whoever it reports to.

Q: If I see "validation failed", what do I do? A: Common fixes:

"Agent X reports to unknown agent" — check the spelling of the Reports-to name

"Circular hierarchy" — make sure no agent chain loops back on itself

"Missing Structure section" — add a

## Structure heading

## Culture presets

"Budget exceeds pool" — increase the pool or reduce agent budgets Culture presets configure escalation speed, update frequency, and autonomy defaults.

Preset

Best for

Escalation

Progress updates

startup

Fast-moving small teams

Aggressive (escalate fast)

Frequent

enterprise

Compliance-heavy orgs

Formal (chain of command)

Scheduled

agency

Client-facing work

Moderate

Per-deliverable

research

Deep exploration

Relaxed (high autonomy)

On completion

military

Critical ops, strict chains

Immediate

Continuous

remote-async

Distributed async teams

Patient (batch escalations)

Daily digest

```
## Culture
preset: startup
escalation: relaxed # override just this one
values: [speed, autonomy]
```

## Interacting via MCP

```
# Delegate a task
mcp.call("openspawn/delegate", {
to: "engineer",
task: "Implement the login endpoint",
priority: "high"
})
# Check agent status
mcp.call("openspawn/status", { agent: "engineer" })
# Escalate an issue
mcp.call("openspawn/escalate", {
from: "engineer",
reason: "Blocked on database credentials",
to: "ceo"
})
# Request consensus
mcp.call("openspawn/consensus", {
question: "Should we use PostgreSQL or SQLite?",
voters: ["engineer", "security-auditor", "ceo"]
})
```

Q: Can I override specific settings in a preset? A: Yes. Set the preset, then override individual values: OpenSpawn exposes an MCP (Model Context Protocol) server for programmatic interaction.

Q: How do I authenticate? A: HMAC authentication with AGENT_ID and

AGENT_SECRET environment variables.

## Common workflows

### Delegate a task

```
# 1. Choose the right agent based on domain
openspawn status # see who's available
# 2. Delegate
openspawn delegate --to engineer \\
--task "Add rate limiting to /api/auth" \\
--priority high
# 3. Monitor
openspawn status --agent engineer # check progress
openspawn logs --agent engineer --tail # stream logs
```

### Handle an escalation

```
# 1. An agent escalates to you
# → You receive: "engineer is blocked: needs DB credentials"
# 2. Resolve or re-delegate
openspawn delegate --to security-auditor \\
--task "Provision DB credentials for engineer" \\
--priority urgent
# 3. Notify the blocked agent
openspawn notify --agent engineer \\
--message "Security auditor is provisioning your credentials"
```

### Request consensus

```
# 1. Pose a question to multiple agents
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
# → Decision: unanimous yes
```

## Error recovery

Q: What's the full tool list? A: See docs/llms.txt

You see

Run this

ERR_NO_ORG

openspawn init my-org

ERR_INVALID_STRUCTURE

openspawn validate ORG.md — fix the reported issues

ERR_CIRCULAR_HIERARCHY

Check "Reports to" chains for loops

ERR_BUDGET_EXCEEDED

openspawn credits --refill or increase pool in ORG.md

ERR_AGENT_NOT_FOUND

openspawn status — verify agent name spelling

ERR_GATEWAY_UNREACHABLE

openclaw gateway status — ensure gateway is running

ERR_HMAC_INVALID Check AGENT_SECRET env var matches the value in

openspawn.json. Regenerate with

## Next steps

openspawn secrets rotate to="/docs/templates" Customize ORG.md → Full reference for every section, field, and option in your org definition. to="/docs/comparison" Connect real models → Configure API keys and model providers for production deployments. to="/getting-started" Full CLI reference → Every command, flag, and option for the OpenSpawn CLI. to="/app/live" See live demo → Watch a multi-agent org handle tasks, escalations, and consensus in real time.
