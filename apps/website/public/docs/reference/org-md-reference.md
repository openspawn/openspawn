---
source: https://openspawn.ai/docs/reference/org-md-reference
generated: 2026-03-03
---

# ORG.md Reference

## Overview

```
## Identity
## Culture
## Structure
## Policies
```

Complete reference for ORG.md — the OpenSpawn organization definition format. Every field, section, value, and example.

The file is parsed by OpenSpawn's org parser, which extracts:

Structured data from bullet lists:

- **Key:** Value

Context from free text (becomes system prompt context for agents)

## Section: Identity

```
We build developer tools that make infrastructure invisible.
Every agent in this org serves that mission.
- **Industry:** Developer tools / SaaS
- **Stage:** Series A, 18 months old
```

Hierarchy from heading levels (H3 = department, H4 = team member) Defines who the organization is. This context is inherited by every agent in the org — it's ambient background in their system prompt.

Default

Description

Industry

string

Business domain; gives agents market context

string

Company stage (Seed, Series A, etc.)

Values

string

## Section: Culture

### Using a Preset

Core values; influences agent decision-making Write the Identity section as if onboarding a new employee — that's exactly how agents use it. Controls how agents communicate — escalation speed, progress update frequency, acknowledgment requirements, and hierarchy depth. Maps directly to Agent Communication Protocol (ACP) parameters.

Preset

Escalation

Progress

Hierarchy

### Overriding Preset Values

```
preset: startup
- **Escalation:** delayed — our leads handle it themselves
```

### All Culture Fields

Vibe ["startup", "Immediate", "Frequent", "2–3 levels", "Fast, scrappy, everyone does everything"], ["enterprise", "Batched (hourly)", "On phase change", "5–8 levels", "Process-driven, governance"], ["agency", "Immediate", "Every tick", "3–4 levels", "Client-facing, deadline-driven"], ["research", "Delayed", "On request", "2–3 levels", "Exploratory, high autonomy"], ["military", "Immediate", "Every tick", "Strict chain", "Zero ambiguity, mandatory acks"], ["remote-async", "Delayed", "On request", "Flat", "High trust, timezone-distributed"], ].map(([preset, esc, prog, hier, vibe]) => (

Valid Values

Default

## Section: Structure

### Heading Levels and Hierarchy

Description ["preset", "startup, enterprise, agency, research, military, remote-async", "None", "Baseline communication profile"], ["Communication", "async-first, sync-preferred, mixed", "async-first", "Default communication mode"], ["Escalation", "immediate, batched, delayed", "immediate", "How quickly blockers propagate upward"], ["Progress updates", "every tick, on phase change, on request", "on phase change", "How often agents report progress"], ["Ack required", "yes, no", "yes", "Whether agents must acknowledge task assignments"], ["Hierarchy depth", "Any descriptive string", "Inferred from Structure", "Maximum org depth hint"], ].map(([field, vals, def_, desc]) => ( The org chart. Defines departments, roles, agent counts, and hierarchy. This is the most important section for most use cases.

Heading Level

Meaning

```
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
```

### Role Fields

Agent Level Range ["## Structure", "Section marker", "—"], ["### Department or C-Level", "Top-level role or department head", "L9–10"], ["#### Team Member Role", "Department member", "L4–7"], ["##### Sub-role or Junior", "Junior agent", "L1–3"], ].map(([h, m, l]) => (

Required

### Model Values

Description ["Model", "❌", "LLM to use for this role"], ["Domain", "❌", "Expertise domain for task routing"], ["Reports to", "❌", "Override inferred parent (role name or \"Human Principal\")"], ["Count", "❌", "Spawn N identical agents with this role (auto-numbered)"], ["Level", "❌", "Explicit level override (1–10)"], ["Tools", "❌", "Comma-separated tool capabilities"], ].map(([field, req, desc]) => (

### Role Level Keywords

Description ["claude-opus", "Anthropic Claude Opus — most capable, highest cost"], ["claude-sonnet", "Anthropic Claude Sonnet — balanced performance and cost"], ["claude-haiku", "Anthropic Claude Haiku — fast, efficient, lower cost"], ["gpt-4o", "OpenAI GPT-4o"], ["same-as-lead", "Inherit model from the department lead"], ["fastest", "Resolved to the fastest available model"], ["cheapest", "Resolved to the cheapest available model"], ["(omitted)", "Uses org-level default, or system default"], ].map(([val, desc]) => (

Agent level is inferred from keywords in the role name:

Keyword

Can Delegate?

### The Count Field

Can Spawn? ["COO, CTO, CEO", "L10", "✅", "✅"], ["VP, Director", "L9", "✅", "✅"], ["Lead, Manager", "L7", "✅", "✅"], ["Senior, Principal", "L6", "✅", "❌"], ["Worker, Engineer, Agent", "L4", "❌", "❌"], ["Junior, Intern, Assistant", "L1–2", "❌", "❌"], ].map(([kw, level, del_, spawn]) => (

```
Handle REST API requests and background jobs.
- **Model:** claude-haiku
- **Domain:** api
- **Count:** 4
```

### Prose as System Prompt

Count creates multiple agents with the same role, auto-numbered: "Backend Senior 1", "Backend Senior 2", etc. Each is an independent agent with its own task queue and trust score. The text description above each role (before the first

```
Reviews PRs for correctness, coverage, and edge cases.
Focus on security implications and performance regressions.
Be conservative — a false positive is better than a miss.
- **Model:** claude-haiku
```

## Section: Policies

### Budget

```
### Budget
- **Per-agent limit:** 1000 credits/period
- **Alert threshold:** 80%
- **Overage behavior:** pause and escalate
```

- **Field:**) becomes part of that agent's system prompt context: The prose above the bullet list becomes the agent's behavioral context. Write it like you're onboarding a real employee. Rules that the system enforces. Budget limits, routing logic, permissions, department caps, and working hours. These are not suggestions — OpenSpawn enforces them.

Default

### Permissions

```
- **L7+ can create tasks** — leads and above can break work into subtasks
- **L7+ can spawn agents** — leads can grow their team (up to department cap)
- **L6+ can review** — seniors and above can approve/reject work
```

Description ["Per-agent limit", "Unlimited", "Credit limit per agent per period"], ["Alert threshold", "80%", "Trigger alert at this % of budget consumed"], ["Overage behavior", "pause and escalate", "pause and escalate | hard stop | allow with alert"], ["Period", "weekly", "daily | weekly | monthly | per-task"], ].map(([field, def_, desc]) => ( ].map(({ val, desc }) => (

Permission

### Department Caps

```
- Engineering: max 10 agents
- Security: max 4 agents
- Marketing: max 6 agents
```

### Working Hours

```
- **Active hours:** 08:00-22:00 (org timezone)
- **Off-hours behavior:** queue tasks, don't process
```

## Section: Playbooks

```
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
```

### Built-In Playbook Triggers

Typical Threshold ["Can create tasks", "L7 (Lead)"], ["Can spawn agents", "L7 (Lead)"], ["Can review / approve", "L6 (Senior)"], ["Can escalate", "All agents (L1+)"], ["Can cancel tasks", "L9 (Director)"], ["Can modify org structure", "L10 (C-level)"], ].map(([perm, thresh]) => ( Caps prevent runaway agent spawning. When a lead tries to spawn beyond the cap, the action is denied and escalated to the human principal. Reusable procedures for common situations. Like runbooks, but for your agent org. Agents can reference playbooks when they encounter the named scenario.

Trigger

## Parsing Rules

### Structured Data Extraction

When It's Used ["New Task Arrives", "A task is created and assigned"], ["Escalation: BLOCKED", "An agent escalates with reason BLOCKED"], ["Escalation: OUT_OF_DOMAIN", "An agent receives a task outside their domain"], ["New Agent Onboarding", "An agent is spawned for the first time"], ["Weekly Review", "Automated weekly org health check"], ["Agent Promoted", "An agent's trust score crosses a level threshold"], ].map(([trigger, when]) => ( Any bullet in the format

```
- **Count:** 3 → { count: 3 }
- **Per-agent limit:** 1000 → { per_agent_limit: 1000 }
```

- **Key:** Value is extracted as a structured field:

## CLI Commands

### Deploy

```
npx openspawn deploy ORG.md
# Dry run — shows what would be created without deploying
npx openspawn deploy ORG.md --dry-run
# Deploy with a culture override
```

### Apply (Live Update)

Lenient parsing: ORG.md parsing is intentionally forgiving — missing sections use sensible defaults, unknown fields are ignored (future-proofing), malformed structured data falls back to prose, and a 3-line file is valid.

### Export

## Version Control Workflow

apply diffs the current state against the new file: Export captures dynamically spawned agents (created at runtime by leads), making them permanent in the file. The exported file becomes the new source of truth.

```
git diff ORG.md
# History of all org changes
git log ORG.md
# Who changed the escalation policy and why?
```

## Complete Examples

### Solo Developer + Agent Team

```
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
```

### Engineering Organization (Startup)

```
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
```

### Research Lab

```
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
```

## Org Health & Self-Healing

ORG.md is a text file — it's designed to live in git. PR reviews for org changes let teams discuss: "Do we need a full team or just one analyst?" — the same way you'd review infrastructure-as-code. Running orgs are monitored automatically. The health score (0–100) is computed from:

Component

Weight

Healthy

```
→ Add 1 senior backend agent
→ Estimated 20% reduction in escalation rate
🟡 Warning: Marketing has 2 idle agents while Security is overloaded
→ Cross-train 1 marketing worker for security tasks
🟢 Optimization: Agent "Backend Senior 2" has 98% success rate over 50 tasks
```

Unhealthy ["Ack latency", "15%", " 3 cycles"], ["Escalation rate", "20%", " 30%"], ["Completion rate", "25%", "> 90%", "< 70%"], ["Budget utilization", "15%", "40–80%", " 95%"], ["Agent idle rate", "10%", " 60%"], ["Time-to-completion", "15%", "Trending down", "Trending up"], ].map(([component, weight, healthy, unhealthy]) => ( ].map(({ score, label, desc, color }) => ( Recommendations are suggestions. A human approves via the dashboard or by modifying

## Relationship to Other Standards

ORG.md.

Standard

## Further Reading

Relationship to ORG.md ["CLAUDE.md", "One agent's behavior", "ORG.md wraps multiple agents; each role description is that agent's implicit CLAUDE.md"], ["AGENTS.md", "Workspace rules", "ORG.md is the superset — workspace rules + org structure + policies"], ["ACP", "Communication protocol", "ORG.md's Culture section configures ACP parameters"], ["A2A", "Inter-org communication", "ORG.md defines one org; A2A connects multiple orgs"], ["Terraform / Pulumi", "Infrastructure as code", "ORG.md is the same pattern applied to agent organizations"], ].map(([std, scope, rel]) => ( to="/docs/tutorials/your-first-org-md"

Your First ORG.md →

Step-by-step tutorial to="/docs/protocols/mcp-reference"

MCP Tools & Integrations →

Connect agents to your org via MCP to="/docs/concepts/acp-vs-a2a"

Agent Communication Protocol →

How agents communicate within an org to="/docs/comparison"

Framework Comparison →

OpenSpawn vs CrewAI vs LangGraph to="/docs/getting-started"

Getting Started →

Full deployment walkthrough
