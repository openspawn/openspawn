---
purpose: Complete reference for the ORG.md organization definition format
audience: AI agents, developers, org architects
related: [getting-started.md, templates-guide.md, mcp-reference.md, agent-quickstart.md]
---

# ORG.md Reference

**What you'll learn:** Every field, section, value, and example for `ORG.md` — the OpenSpawn organization definition format. By the end, you'll be able to write an ORG.md from scratch for any team structure.

> **TL;DR:** `ORG.md` defines your entire agent org — roles, hierarchy, culture, budgets — in one markdown file. It's human-readable, version-controlled, and machine-parseable.

```bash
# Deploy your org
npx openspawn deploy ORG.md

# Validate before deploying
openspawn validate ORG.md
```

---

## Why ORG.md?

The agent ecosystem already speaks markdown:
- `CLAUDE.md` defines one agent's behavior
- `AGENTS.md` defines workspace rules
- `ORG.md` defines an entire organization

Markdown lets you mix intent with structure. An org definition isn't just data — it's *philosophy*. Why is the team structured this way? What communication norms matter? That context is critical when humans review changes, when agents onboard, and when the system proposes optimizations.

**The markdown IS the documentation.** No separate wiki explaining what the config means.

> **Q: Why not YAML or JSON?**
> Markdown allows prose. "Triages technical work. Delegates to specialists. Reviews output." tells the LLM how to behave. YAML can't carry intent — markdown can. Write role descriptions like you're onboarding a real hire.

---

## File structure

An ORG.md file has five top-level sections. All are optional except `## Structure`.

```markdown
# Organization Name

## Identity
## Culture
## Structure
## Policies
## Playbooks
```

**Minimum valid ORG.md:**
```markdown
# My Org

## Structure

### Boss — Leader
- **Level:** 10
- **Reports to:** Human Principal
```

---

## Section 1: Identity

**Purpose:** Who is this organization? Name, mission, and context every agent inherits.

**Why it matters:** Agents use Identity as ambient context. When a marketing agent writes copy, it knows the company builds dev tools. When an engineering agent prioritizes, "customers first" influences the decision.

```markdown
# Acme Engineering

## Identity

We build developer tools that make infrastructure invisible.
Every agent in this org serves that mission.

- **Industry:** Developer tools / SaaS
- **Stage:** Series A, 18 months old
- **Values:** Ship fast, measure everything, customers first
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `**Industry:**` | string | Industry context for agent decisions |
| `**Stage:**` | string | Company stage (affects risk tolerance) |
| `**Values:**` | string | Core values — agents reference these in decisions |

Free prose above or below structured fields becomes system prompt context for all agents.

---

## Section 2: Culture

**Purpose:** How the organization communicates. Maps directly to ACP (Agent Communication Protocol) parameters.

**Why it matters:** Culture presets configure escalation speed, progress frequency, hierarchy depth, and ack requirements — without you needing to tune each parameter manually.

### Using a preset

```markdown
## Culture

preset: startup
```

**Available presets:**

| Preset | Escalation | Progress | Hierarchy | Best for |
|--------|-----------|----------|-----------|---------|
| `startup` | Immediate | Frequent | 2-3 levels | Small, fast-moving teams |
| `enterprise` | Batched (hourly) | On phase change | 5-8 levels | Large orgs, governance-heavy |
| `agency` | Immediate | Every tick | 3-4 levels | Client-facing, deadline-driven |
| `research` | Delayed | On request | 2-3 levels | Exploratory, long-running tasks |
| `military` | Immediate | Every tick | Strict chain | Zero-ambiguity, mandatory acks |
| `remote-async` | Delayed | On request | Flat | Distributed, async-first |

### Overriding preset values

```markdown
## Culture

preset: startup
- **Escalation:** delayed — we trust leads to figure things out
- **Ack required:** no
```

### Manual configuration (no preset)

```markdown
## Culture

We're a startup. Move fast, communicate openly, escalate immediately.

- **Communication:** async-first
- **Escalation:** immediate
- **Progress updates:** on phase change
- **Ack required:** yes
- **Hierarchy depth:** shallow (3 levels max)
```

---

## Section 3: Structure

**Purpose:** The org chart — departments, roles, and hierarchy as nested markdown headings.

**Why it matters:** Structure is the core of ORG.md. It defines who exists, what they do, who they report to, and what level of authority they have.

### Heading hierarchy

```
## Structure          → section marker
### Department/Role   → L9-10 (department head or C-level)
#### Role Name        → L4-7 (team member, inherits department)
##### Sub-role        → L1-3 (junior / intern)
```

### Agent definition

```markdown
### Oscar — Chief of Staff
The coordinator. Manages priorities, delegates to specialists.
- **Level:** 10
- **Domain:** Operations
- **Reports to:** Human Principal
- **Model:** claude-sonnet
```

**Required fields:**

| Field | Required? | Description |
|-------|-----------|-------------|
| `**Level:**` | Recommended | L1-L10 (inferred from role keywords if omitted) |
| `**Reports to:**` | ✅ | Manager's name or "Human Principal" |
| `**Domain:**` | No | Specialization area (used for task routing) |
| `**Model:**` | No | LLM identifier (defaults to org default) |
| `**Count:**` | No | Spawn N identical agents (auto-numbered) |

**Prose above the fields** becomes that agent's system prompt context. Write it like you're describing the role to a new hire.

### Level reference

| Keyword in role name | Inferred level | Can delegate? | Can spawn agents? |
|---------------------|----------------|---------------|-------------------|
| COO, CTO, CEO | L10 | ✅ | ✅ |
| VP, Director | L9 | ✅ | ✅ |
| Lead, Manager | L7 | ✅ | ✅ |
| Senior, Principal | L6 | ✅ (review only) | ❌ |
| Engineer, Worker, Agent | L4 | ❌ | ❌ |
| Junior, Intern, Assistant | L1-2 | ❌ | ❌ |

> **Q: Do I have to specify Level explicitly?**
> No — it's inferred from role name keywords. But explicit is clearer and overrides inference.

### The Count field

Creates N agents with the same role:

```markdown
#### Backend Workers
- **Count:** 3
- **Model:** claude-haiku
- **Domain:** backend
```

Creates "Backend Worker 1", "Backend Worker 2", "Backend Worker 3" — each independent with its own task queue and trust score.

### Full example structure

```markdown
## Structure

### COO
The operational backbone. Receives orders, breaks into department work.
- **Level:** 10
- **Domain:** operations
- **Reports to:** Human Principal
- **Model:** claude-sonnet

### Engineering

#### Engineering Lead
Triages technical work. Delegates to specialists. Reviews output.
- **Level:** 7
- **Domain:** engineering
- **Model:** claude-sonnet

#### Backend Senior
Owns API, database, and server infrastructure.
- **Level:** 6
- **Domain:** backend
- **Model:** claude-haiku

#### Frontend Workers
Build and maintain the dashboard.
- **Level:** 4
- **Domain:** frontend
- **Count:** 3
- **Model:** claude-haiku

### Security

#### Security Lead
Every deploy needs their sign-off.
- **Level:** 7
- **Domain:** appsec
- **Model:** claude-sonnet
```

> **Q: How does hierarchy get inferred from headings?**
> H3 (`###`) roles are top-level. H4 (`####`) roles under an H3 department inherit that department. The first H4 role in a department with no explicit `Reports to` is treated as the department lead.

---

## Section 4: Policies

**Purpose:** Rules that govern how the org operates — budget, routing, permissions, constraints.

**Why it matters:** Policies are enforced by the system, not suggestions. An agent that exceeds budget gets paused. An agent that tries to spawn when at department cap gets denied.

```markdown
## Policies

### Budget
- **Per-agent limit:** 1000 credits/period
- **Alert threshold:** 80%
- **Overage behavior:** pause and escalate
- **Period:** weekly

### Task Routing
Tasks are auto-routed by matching domain keywords, agent expertise,
current workload, and trust score.
If no match: task goes to COO for manual delegation.

### Permissions
- **L7+ can create tasks**
- **L7+ can spawn agents** (up to department cap)
- **L6+ can review**
- **All agents can escalate**

### Department Caps
- Engineering: max 10 agents
- Security: max 4 agents
- No department can exceed 15 agents without human approval

### Working Hours
- **Active hours:** 08:00-22:00 (org timezone)
- **Off-hours behavior:** queue tasks, don't process
- **Exceptions:** critical priority tasks process 24/7
```

**Policy fields:**

| Field | Description |
|-------|-------------|
| `**Per-agent limit:**` | Credits per agent per period |
| `**Alert threshold:**` | % of budget that triggers alert (default: 80%) |
| `**Overage behavior:**` | `pause and escalate` or `hard-stop` |
| `**Period:**` | `daily` \| `weekly` \| `monthly` |

---

## Section 5: Playbooks

**Purpose:** Reusable step-by-step procedures for common scenarios.

**Why it matters:** When an agent encounters a situation (e.g., "BLOCKED"), it looks up the matching playbook and follows the procedure. Playbooks are simultaneously documentation and machine instructions.

```markdown
## Playbooks

### New Task Arrives
1. COO receives task from Human Principal
2. COO categorizes by domain and priority
3. COO delegates to appropriate department lead
4. Lead breaks into subtasks if needed
5. Lead assigns to available workers by trust score
6. Workers begin — progress logged to task activity

### Escalation: BLOCKED
1. Agent creates escalation with blocker details
2. Escalation goes to direct manager (never skip levels)
3. Manager has 2 cycles to respond:
   - Provide missing resource/context
   - Reassign to different agent
   - Escalate further up
4. If unresolved after 2 levels → alert Human Principal

### New Agent Onboarding
1. Agent spawned by a lead
2. First 3 tasks are LOW priority (warm-up period)
3. Trust score starts at 30 (PROBATION)
4. Mentor assigned: closest senior in same domain
5. After 5 successful tasks → TRUSTED
6. After 20 successful tasks → eligible for VETERAN
```

---

## Parsing rules

> **Q: How does OpenSpawn parse ORG.md?**

### Metadata extraction

Structured data extracted from bullet lists:
```
- **Key:** Value
```
Keys are case-insensitive, normalized (spaces → underscores).

### Free text = context

Any text that isn't structured metadata becomes system prompt context:
- Department descriptions → department-level context
- Role descriptions → agent-level context
- Policy explanations → enforcement rules
- Playbook steps → procedural instructions

### Model references

```markdown
- **Model:** anthropic/claude-sonnet-4-5    # Full provider/model
- **Model:** claude-sonnet                  # Alias
- **Model:** fastest                        # Relative (system picks)
- **Model:** cheapest                       # Relative
```

---

## Lifecycle commands

### Deploy
```bash
npx openspawn deploy ORG.md
```
Parses → creates agents → applies culture → enforces policies → loads playbooks.

### Validate (before deploy)
```bash
openspawn validate ORG.md
```

### Preview (no deploy)
```bash
openspawn preview
```

### Apply changes to running org
```bash
openspawn apply ORG.md
```
Diffs current state: new roles → spawn agents, removed roles → graceful wind-down, policy changes → apply immediately.

### Export current state
```bash
openspawn export > ORG.md
```
Captures the actual org including dynamically spawned agents. Becomes the new source of truth.

---

## Git workflow

ORG.md lives in git. Treat org changes like code changes:

```bash
git diff ORG.md      # See what changed in the org
git log ORG.md       # History of org changes
git blame ORG.md     # Who changed the escalation policy?
```

**Example PR for org change:**
```
PR #42: Add data team (2 agents)

+ ### Data & Analytics
+ Owns data pipelines, reporting, and business intelligence.
+
+ #### Data Lead
+ - **Model:** claude-sonnet
+ - **Domain:** data-engineering
+
+ #### Data Worker
+ - **Model:** claude-haiku
+ - **Domain:** analytics
```

---

## Full examples

### Solo developer + agents

```markdown
# My Dev Team

## Culture
preset: startup

## Structure

### Code Agent
Writes code, runs tests, submits PRs.
- **Level:** 7
- **Domain:** fullstack
- **Reports to:** Human Principal
- **Model:** claude-sonnet

### Review Agent
Reviews PRs, checks for bugs and style.
- **Level:** 4
- **Domain:** code-review
- **Reports to:** Code Agent
- **Model:** claude-haiku

### Docs Agent
Keeps documentation in sync with code.
- **Level:** 4
- **Domain:** documentation
- **Reports to:** Code Agent
- **Model:** claude-haiku
```

### Agency with client teams

```markdown
# Creative Agency

## Culture
preset: agency
- **Progress updates:** every tick — clients expect visibility

## Structure

### Account Director
Manages client relationships. Routes work to the right team.
- **Level:** 10
- **Domain:** account-management
- **Reports to:** Human Principal
- **Model:** claude-sonnet

### Design Team

#### Design Lead
- **Level:** 7
- **Domain:** visual-design
- **Model:** claude-sonnet

#### Designers
- **Level:** 4
- **Domain:** ui-ux
- **Count:** 3
- **Model:** claude-haiku

## Policies

### Client SLA
- Critical tasks: response within 1 cycle
- Normal tasks: completion within 10 cycles
```

### Research lab

```markdown
# AI Research Lab

## Culture
preset: research
- **Escalation:** delayed — let researchers explore before flagging blockers

## Structure

### Principal Investigator
Sets research direction. Reviews findings. Publishes papers.
- **Level:** 10
- **Domain:** ml-research
- **Reports to:** Human Principal
- **Model:** claude-opus

### Senior Researchers
- **Level:** 6
- **Domain:** experimentation
- **Count:** 2
- **Model:** claude-sonnet

### Research Assistants
Run experiments, collect data, write up results.
- **Level:** 4
- **Domain:** data-collection
- **Count:** 3
- **Model:** claude-haiku

## Policies

### Exploration Budget
- **Per-agent limit:** 5000 credits/period
- No hard stops — flag at 90% but don't interrupt an experiment
```

---

## Relationship to other formats

| Format | Scope | Relationship to ORG.md |
|--------|-------|----------------------|
| `CLAUDE.md` | One agent's behavior | ORG.md wraps multiple agents, each with implicit CLAUDE.md (their role description) |
| `AGENTS.md` | Workspace rules | ORG.md is the superset — workspace rules + org structure + policies |
| Terraform/Pulumi | Infrastructure as code | Same pattern applied to agent organizations |

---

## Next steps

- **Try it now:** [`docs/getting-started.md`](./getting-started.md) — deploy your first ORG.md in 10 minutes
- **Pick a template:** [`docs/templates-guide.md`](./templates-guide.md) — start from a working example
- **MCP tools:** [`docs/mcp-reference.md`](./mcp-reference.md) — how agents interact with the org
- **Communication rules:** [`docs/communication-protocol.md`](./communication-protocol.md) — how agents talk to each other
- **Live demo:** https://bikinibottom.ai/app/
