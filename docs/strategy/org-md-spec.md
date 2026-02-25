---
title: "ORG.md Specification"
layout: default
parent: Strategy
nav_order: 5
---

# ORG.md — Organization as Code

> Define your agent organization in a single markdown file. Deploy it. Watch it work. Tune it over time.

## Why Markdown?

The agent ecosystem already speaks markdown. `CLAUDE.md` defines one agent's behavior. `AGENTS.md` defines workspace rules. `ORG.md` defines an entire organization.

Markdown has a unique advantage over YAML/JSON for this: **you can mix intent with structure.** An org definition isn't just data — it's *philosophy*. Why is the team structured this way? What communication norms matter? That context is critical when humans review changes, when agents onboard, and when the system proposes optimizations.

The markdown IS the documentation. No separate wiki explaining what the config means.

```
CLAUDE.md  → defines one agent's behavior
AGENTS.md  → defines workspace rules  
ORG.md     → defines an entire organization
```

---

## 1. Anatomy of an ORG.md

An ORG.md file has five sections, each defined by a top-level heading. All sections are optional — the system uses sensible defaults for anything omitted.

```markdown
# Organization Name

## Identity
## Culture  
## Structure
## Policies
## Playbooks
```

### 1.1 Identity

Who is this organization? The name, mission, and context that every agent in the org inherits.

```markdown
# Acme Engineering

## Identity

We build developer tools that make infrastructure invisible.
Every agent in this org serves that mission.

- **Industry:** Developer tools / SaaS
- **Stage:** Series A, 18 months old
- **Values:** Ship fast, measure everything, customers first
```

**Why this matters:** Agents use Identity as ambient context. When a marketing agent writes copy, it knows the company builds dev tools. When an engineering agent prioritizes work, "customers first" influences the decision. Identity is the system prompt for the entire org.

---

### 1.2 Culture

How the organization communicates and operates. Maps directly to [ACP tunable parameters](./agent-communication-protocol.md#5-tunable-parameters).

```markdown
## Culture

We're a startup. Move fast, communicate openly, escalate immediately.
Nobody should be blocked for more than one cycle.

- **Communication:** async-first
- **Escalation:** immediate — we're too small to batch problems
- **Progress updates:** on phase change — not every tick, but don't go silent
- **Ack required:** yes — if you get a task, confirm it
- **Hierarchy depth:** shallow (3 levels max)
```

**Preset cultures** — shorthand for common patterns:

```markdown
## Culture

preset: startup
```

Available presets:

| Preset | Escalation | Progress | Hierarchy | Vibe |
|--------|-----------|----------|-----------|------|
| `startup` | Immediate | Frequent | 2-3 levels | Fast, scrappy, everyone does everything |
| `enterprise` | Batched (hourly) | On phase change | 5-8 levels | Process-driven, governance, separation of concerns |
| `agency` | Immediate | Every tick | 3-4 levels | Client-facing, deadline-driven, high visibility |
| `research` | Delayed | On request | 2-3 levels | Exploratory, high autonomy, long-running tasks |
| `military` | Immediate | Every tick | Strict chain | Zero ambiguity, mandatory acks, full situational awareness |
| `remote-async` | Delayed | On request | Flat | High trust, timezone-distributed, async-first |

Presets are starting points. Override any parameter inline:

```markdown
## Culture

preset: startup
- **Escalation:** delayed — we trust our leads to figure it out
```

---

### 1.3 Structure

The org chart. Departments, roles, and hierarchy — defined as nested markdown.

```markdown
## Structure

### COO
The operational backbone. Receives orders from the human principal,
breaks them into departmental work, ensures nothing falls through cracks.

- **Model:** claude-sonnet
- **Domain:** operations
- **Reports to:** Human Principal

### Engineering
Our largest team. Owns code, infrastructure, testing, and deployment.

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
Build and maintain the dashboard and marketing site.
- **Model:** claude-haiku
- **Domain:** frontend
- **Count:** 3

#### QA Worker
Writes and runs tests. Reviews PRs for quality.
- **Model:** claude-haiku
- **Domain:** testing

### Security
Small but critical. Every deploy needs their sign-off.

#### Security Lead
- **Model:** claude-sonnet
- **Domain:** appsec

#### Security Worker
- **Model:** claude-haiku  
- **Domain:** infrastructure-security

### Marketing
Owns content, campaigns, and public presence.

#### Marketing Lead
- **Model:** claude-sonnet
- **Domain:** content

#### Content Workers
- **Model:** claude-haiku
- **Domain:** copywriting
- **Count:** 2
```

**How hierarchy is inferred:**
- H2 (`##`) = top-level section (Structure itself)
- H3 (`###`) = department or C-level role (L9-10)
- H4 (`####`) = department member roles
- Nesting under a department heading = reports to that department's lead
- The first role under a department heading with no explicit `Reports to` = the department lead

**Role keywords and levels:**

| Keyword in role name | Inferred level | Can delegate? | Can spawn? |
|---------------------|----------------|---------------|------------|
| COO, CTO, CEO | L10 | ✅ | ✅ |
| VP, Director, Talent | L9 | ✅ | ✅ |
| Lead, Manager | L7 | ✅ | ✅ |
| Senior, Principal | L6 | ✅ | ❌ |
| Worker, Engineer, Agent | L4 | ❌ | ❌ |
| Junior, Intern, Assistant | L1-2 | ❌ | ❌ |

**The `Count` field:** Creates multiple agents with the same role. They get auto-numbered names: "Frontend Worker 1", "Frontend Worker 2", etc. Each is an independent agent with its own task queue and trust score.

**Prose matters:** The text description above each role becomes part of that agent's system prompt context. "Triages technical work. Delegates to specialists." tells the LLM how to behave. Write the description like you're explaining the role to a new hire.

---

### 1.4 Policies

Rules that govern how the organization operates. Budget, routing, permissions, and constraints.

```markdown
## Policies

### Budget
- **Per-agent limit:** 1000 credits/period
- **Alert threshold:** 80%
- **Overage behavior:** pause and escalate — don't hard-stop
- **Period:** weekly

### Task Routing
Tasks are auto-routed to the right department by matching:
1. Domain keywords in the task title/description
2. Agent domain expertise
3. Current workload (prefer idle agents)
4. Trust score (higher trust gets harder tasks)

If no match is found, task goes to the COO for manual delegation.

### Permissions
- **L7+ can create tasks** — leads and above can break work into subtasks
- **L7+ can spawn agents** — leads can grow their team (up to department cap)
- **L6+ can review** — seniors and above can approve/reject work
- **All agents can escalate** — nobody should be silently stuck

### Department Caps
- Engineering: max 10 agents
- Security: max 4 agents  
- Marketing: max 6 agents
- No department can exceed 15 agents without human approval

### Working Hours
- **Active hours:** 08:00-22:00 (org timezone)
- **Off-hours behavior:** queue tasks, don't process
- **Exceptions:** critical priority tasks process 24/7
```

**Policies as guardrails:** These aren't suggestions — the system enforces them. An agent that tries to spawn when at department cap gets denied. An agent that exceeds budget gets paused. This is how you maintain control over autonomous agents.

---

### 1.5 Playbooks

Reusable procedures for common situations. Like runbooks in ops, but for your agent org.

```markdown
## Playbooks

### New Task Arrives
1. COO receives task from Human Principal
2. COO categorizes by domain and priority
3. COO delegates to appropriate department lead
4. Lead acks (auto) and breaks into subtasks if needed
5. Lead assigns to available workers by trust score
6. Workers ack and begin — progress logged to task activity

### Escalation: BLOCKED
1. Agent creates escalation message with blocker details
2. Escalation goes to direct manager (never skip levels)
3. Manager has 2 cycles to respond:
   - Provide the missing resource/context
   - Reassign to a different agent
   - Escalate further up
4. If unresolved after 2 levels, alert Human Principal

### Escalation: OUT_OF_DOMAIN
1. Agent flags task as wrong domain
2. Manager receives escalation
3. Manager re-delegates to correct department lead
4. Original agent is freed for other work
5. No penalty to original agent's trust score

### New Agent Onboarding
1. New agent spawned by a lead
2. First 3 tasks are LOW priority (warm-up period)
3. Trust score starts at 30 (PROBATION)
4. Mentor assigned: closest senior in same domain
5. After 5 successful tasks, promoted to TRUSTED
6. After 20 successful tasks, eligible for VETERAN

### Weekly Review (automated)
1. System compiles: tasks completed, escalation rate, budget burn
2. Generates org health score
3. Flags anomalies: sudden escalation spikes, idle agents, budget overruns
4. Sends digest to Human Principal
5. Proposes optimizations: "Engineering is bottlenecked, consider +1 senior"
```

**Why playbooks in the org file:** They're not just documentation — they're instructions. When an agent encounters "BLOCKED", it can look up the playbook and follow the procedure. When the system onboards a new agent, it follows the onboarding playbook. The org file is simultaneously human documentation and machine instructions.

---

## 2. Parsing Rules

ORG.md is designed to be readable by humans and parseable by machines. The parsing rules are intentionally lenient:

### 2.1 Metadata Extraction

Structured data is extracted from markdown bullet lists:
```
- **Key:** Value
```

The pattern `- **Key:** Value` extracts `{ key: "value" }`. Keys are case-insensitive and normalized (spaces → underscores).

### 2.2 Free Text = Context

Any text that isn't structured metadata becomes context:
- Department descriptions → department-level system prompt context
- Role descriptions → agent-level system prompt context
- Policy explanations → system enforcement rules
- Playbook steps → procedural instructions

### 2.3 Numbers and Counts

- `**Count:** 3` → spawn 3 agents with this role
- `**Per-agent limit:** 1000` → numeric extraction
- `**Max depth:** 3` → numeric extraction

### 2.4 Model References

Models can be specified as:
- Full provider/model: `anthropic/claude-sonnet-4-5`
- Alias: `claude-sonnet`, `claude-haiku`, `gpt-4o`
- Relative: `same-as-lead`, `fastest`, `cheapest`
- Omitted: defaults to org-level default or system default

### 2.5 Hierarchy from Headings

```
## Structure          → section marker
### Department Name   → L9-10 department / C-level
#### Role Name        → L4-7 team member (inherits department)
##### Sub-role        → L1-3 junior / intern
```

---

## 3. Lifecycle

### 3.1 Deployment

```bash
# Deploy an org from a file
bikinibottom deploy ORG.md

# Deploy with a specific culture override
bikinibottom deploy ORG.md --culture=enterprise

# Dry run — show what would be created
bikinibottom deploy ORG.md --dry-run
```

On deploy:
1. Parse ORG.md
2. Create agents according to Structure
3. Apply Culture parameters to ACP config
4. Enforce Policies as system constraints
5. Load Playbooks as procedural knowledge
6. Start the simulation / connect to live system

### 3.2 Live Editing

ORG.md can be modified while the org is running:

```bash
# Apply changes from updated file
bikinibottom apply ORG.md
```

The system diffs the current state against the new file:
- **New roles** → spawn agents
- **Removed roles** → gracefully wind down (finish current tasks, then deactivate)
- **Changed policies** → apply immediately
- **Changed culture** → update ACP parameters live
- **Changed descriptions** → update system prompts on next tick

### 3.3 Versioning

ORG.md lives in git. Standard version control applies:

```bash
git diff ORG.md  # See what changed in the org
git log ORG.md   # History of org changes
git blame ORG.md # Who changed the escalation policy?
```

**PR reviews for org changes:**
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

Reviewers can discuss: "Do we need a full team or just one analyst?" — the same way you'd review infrastructure-as-code changes.

### 3.4 Export

Running orgs can export their current state back to ORG.md:

```bash
# Export current org state (including dynamically spawned agents)
bikinibottom export > ORG.md
```

This captures the *actual* org — including agents that were spawned dynamically by leads. The exported file becomes the new source of truth.

---

## 4. Org Health & Intelligence

### 4.1 Health Score

A single composite score (0-100) computed from ACP metrics:

| Component | Weight | Healthy | Unhealthy |
|-----------|--------|---------|-----------|
| Ack latency | 15% | < 1 cycle | > 3 cycles |
| Escalation rate | 20% | < 10% of tasks | > 30% of tasks |
| Completion rate | 25% | > 90% | < 70% |
| Budget utilization | 15% | 40-80% | < 20% or > 95% |
| Agent idle rate | 10% | < 30% | > 60% |
| Time-to-completion | 15% | Trending down | Trending up |

Score interpretation:
- **90-100:** Elite org — highly efficient, minimal waste
- **70-89:** Healthy — normal operations, minor inefficiencies
- **50-69:** Needs attention — bottlenecks or misrouting
- **< 50:** Restructure recommended — systemic issues

### 4.2 Self-Healing Recommendations

The system observes patterns and proposes changes:

```markdown
## Recommendations (auto-generated)

### 🔴 Critical
- Engineering escalation rate is 35% (threshold: 10%)
  → Recommendation: Add 1 senior backend agent
  → Impact: Estimated 20% reduction in escalation rate

### 🟡 Warning  
- Marketing has 2 idle agents while Security is overloaded
  → Recommendation: Cross-train 1 marketing worker for security tasks
  → Impact: Reduce security task queue by ~30%

### 🟢 Optimization
- Agent "Backend Senior 2" has 98% success rate over 50 tasks
  → Recommendation: Promote to Lead, create Backend sub-team
  → Impact: Free up Engineering Lead for higher-level planning
```

Recommendations are suggestions, not actions. A human reviews and approves via the dashboard or by modifying ORG.md.

### 4.3 A/B Testing

Run two org structures simultaneously and compare:

```bash
bikinibottom ab-test ORG-v1.md ORG-v2.md --tasks=100
```

Both orgs process the same task set. The system reports:
- Completion rate, time-to-completion, escalation rate, cost
- Statistical significance of differences
- Recommendation: which org structure performed better

This is how you data-drive organizational design.

---

## 5. Examples

### 5.1 Solo Developer + Agents

```markdown
# My Dev Team

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
- **Domain:** documentation
```

### 5.2 Agency with Client Teams

```markdown
# Creative Agency

## Culture
preset: agency
- **Progress updates:** every tick — clients expect visibility

## Structure

### Account Director
Manages client relationships. Routes work to the right team.
- **Model:** claude-sonnet
- **Domain:** account-management

### Design Team

#### Design Lead
- **Model:** claude-sonnet
- **Domain:** visual-design

#### Designers
- **Model:** claude-haiku
- **Domain:** ui-ux
- **Count:** 3

### Content Team

#### Content Lead
- **Model:** claude-sonnet
- **Domain:** content-strategy

#### Writers
- **Model:** claude-haiku
- **Domain:** copywriting
- **Count:** 4

## Policies

### Client SLA
- Critical tasks: response within 1 cycle
- Normal tasks: completion within 10 cycles
- All tasks: progress update every 2 cycles
```

### 5.3 Research Lab

```markdown
# AI Research Lab

## Culture
preset: research
- **Escalation:** delayed — let researchers explore before flagging blockers

## Structure

### Principal Investigator
Sets research direction. Reviews findings. Publishes papers.
- **Model:** claude-opus
- **Domain:** ml-research

### Senior Researchers
- **Model:** claude-sonnet
- **Domain:** experimentation
- **Count:** 2

### Research Assistants
Run experiments, collect data, write up results.
- **Model:** claude-haiku
- **Domain:** data-collection
- **Count:** 3

## Policies

### Exploration Budget
- **Per-agent limit:** 5000 credits/period — research needs room to explore
- **No hard stops** — flag at 90%, but don't interrupt an experiment
```

---

## 6. Relationship to Existing Standards

| Standard | Scope | Relationship |
|----------|-------|-------------|
| `CLAUDE.md` | One agent's behavior | ORG.md wraps multiple agents, each with their own implicit "CLAUDE.md" (their role description) |
| `AGENTS.md` | Workspace rules | ORG.md is the superset — workspace rules + org structure + policies |
| ACP | Communication protocol | ORG.md's Culture section configures ACP parameters |
| A2A | Inter-org communication | ORG.md defines one org; A2A connects multiple orgs |
| Terraform/Pulumi | Infrastructure as code | ORG.md is the same pattern applied to agent organizations |

---

## 7. Design Principles

1. **Readable first.** If a human can't understand the org from reading the file, the file has failed. Structure and intent should be obvious without documentation.

2. **Prose is configuration.** Role descriptions aren't comments — they become system prompt context. Write them like you're onboarding a real employee.

3. **Defaults over verbosity.** Omit what you don't care about. The system picks sensible defaults. A 10-line ORG.md should produce a functional org.

4. **Git-native.** ORG.md is a text file in version control. Diff, blame, review, rollback — all the tools you already have.

5. **Living document.** The file evolves with the org. Dynamic changes (spawned agents, promotions) can be exported back. The file is always the source of truth.

6. **Human in the loop.** The system recommends. Humans decide. ORG.md changes require a human commit (or explicit auto-approve for specific recommendations).

---

*ORG.md turns organizational design from tribal knowledge into version-controlled, reviewable, deployable code. It's the missing layer between "I have agents" and "I have an organization."*
