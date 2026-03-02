---
title: Scenario Engine
---

# BikiniBottom Scenario Engine

> Turn "11 decisions and done" into 2000+ decision epics that make people screenshot the dashboard and share it on Twitter.

**Status:** Design  
**Authors:** OpenSpawn Team  
**Last Updated:** 2026-02-11

---

## Table of Contents

1. [Overview & Philosophy](#1-overview--philosophy)
2. [Architecture](#2-architecture)
3. [SCENARIO.md File Format](#3-scenariomd-file-format)
4. [Core Concepts](#4-core-concepts)
5. [Decision Math](#5-decision-math)
6. [Industry Scenarios](#6-industry-scenarios)
7. [Integration with Deterministic Engine](#7-integration-with-deterministic-engine)
8. [Dashboard Visualization](#8-dashboard-visualization)
9. [Implementation Phases](#9-implementation-phases)

---

## 1. Overview & Philosophy

### The Problem

The current deterministic engine (`tools/sandbox/src/deterministic.ts`) processes a single order through ~11 decision steps:

```
COO receives order → parse 3 tasks → hire 3 leads (3 decisions) →
delegate 3 tasks (3 decisions) → workers progress → complete
```

It's a straight line. Real organizations are a tangle. We need to model that tangle.

### The Vision

BikiniBottom is SimCity for agent organizations. SimCity isn't fun because a single house gets built. It's fun because *a thousand things happen simultaneously* — traffic jams, power outages, budget crises, zoning disputes — and you watch the city respond. The Scenario Engine is what generates that emergent complexity.

A scenario should feel like watching a real organization work. Not every decision is dramatic — most are routine. But routines compound into patterns, patterns create bottlenecks, bottlenecks force hard choices, and hard choices are where the drama lives.

### Design Principles

1. **Scenarios are data, not code.** A SCENARIO.md file defines what happens. The engine interprets it. Non-programmers should be able to write scenarios.

2. **Deterministic core, stochastic texture.** The engine is a state machine. Random events use seeded PRNGs — same seed, same run. Replay is sacred.

3. **Friction is the feature.** Dependencies, contention, review loops, interrupts — these aren't bugs. They're what makes organizations interesting. The engine should generate *realistic* friction, not artificial delays.

4. **Visual density matters.** Every decision should produce visible activity on the dashboard: a node lights up, a message flies across the org chart, a task moves on the board, a metric ticks. Dead air is death.

5. **15–30 minutes, not 15 seconds.** Scenarios unfold at a pace that rewards watching. Like a timelapse of a city being built, you should be able to sit back and watch the organization work through a complex problem.

6. **Replayable with variation.** Same scenario, different seed = different path. Same structure, different emergent behavior. People should want to run it again to see what happens.

---

## 2. Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    SCENARIO.md                          │
│  (template: phases, epics, events, decision weights)    │
└────────────────────────┬────────────────────────────────┘
                         │ parse
                         ▼
┌─────────────────────────────────────────────────────────┐
│               Scenario Engine (NEW)                     │
│                                                         │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────┐     │
│  │ Phase    │  │ Task      │  │ Event            │     │
│  │ Manager  │  │ Generator │  │ Scheduler        │     │
│  └──────────┘  └───────────┘  └──────────────────┘     │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────┐     │
│  │ DAG      │  │ Resource  │  │ Decision         │     │
│  │ Resolver │  │ Allocator │  │ Evaluator        │     │
│  └──────────┘  └───────────┘  └──────────────────┘     │
│  ┌──────────────────────────────────────────────┐       │
│  │ Narrative Engine (branching + flavor text)   │       │
│  └──────────────────────────────────────────────┘       │
└────────────────────────┬────────────────────────────────┘
                         │ feeds
                         ▼
┌─────────────────────────────────────────────────────────┐
│          Deterministic Simulation (EXISTING)             │
│  DeterministicSimulation.runTick() — processes agents   │
│  per tick, emits SandboxEvents and ACPMessages          │
└────────────────────────┬────────────────────────────────┘
                         │ emits
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Dashboard (EXISTING)                        │
│  Org chart · Task board · Message stream · Metrics      │
└─────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Responsibility |
|-----------|---------------|
| **Phase Manager** | Tracks scenario phase, evaluates phase transitions, unlocks new work |
| **Task Generator** | Expands epic templates into concrete tasks/subtasks on-demand |
| **Event Scheduler** | Fires random and scripted events at appropriate times |
| **DAG Resolver** | Tracks dependencies between tasks, blocks/unblocks as predecessors complete |
| **Resource Allocator** | Models agent availability, handles contention, forces prioritization |
| **Decision Evaluator** | Applies weighted random outcomes to decision points (reviews, approvals, resource choices) |
| **Narrative Engine** | Generates flavor text, tracks branching story arcs, names events for dashboard display |

---

## 3. SCENARIO.md File Format

A SCENARIO.md defines a reusable scenario template. Combined with an ORG.md (which defines *who works here*), it defines *what work they do*.

### 3.1 Top-Level Structure

```markdown
# Scenario Name

## Meta
## Phases
## Epics
## Events  
## Resources
## Scoring
```

### 3.2 Meta

Scenario identity and configuration parameters.

```markdown
## Meta

- **Industry:** AI Dev Agency
- **Duration:** 20 minutes
- **Target decisions:** 1500
- **Tick interval:** 800ms
- **Seed:** random
- **Difficulty:** normal
- **Description:** A fast-growing AI agency takes on three client projects
  simultaneously while fighting fires, shipping features, and trying not
  to burn out the team.
```

| Field | Type | Description |
|-------|------|-------------|
| `Industry` | string | Category tag for filtering/grouping |
| `Duration` | duration | Target wall-clock runtime (engine adjusts tick pacing) |
| `Target decisions` | number | Approximate decision count (engine calibrates generation) |
| `Tick interval` | duration | Base time between ticks (can be overridden by phase) |
| `Seed` | number \| "random" | PRNG seed for reproducibility |
| `Difficulty` | easy \| normal \| hard \| chaos | Adjusts event frequency, review rejection rates, resource scarcity |
| `Description` | text | Shown on scenario select screen |

**Difficulty presets:**

| Difficulty | Event frequency | Review rejection % | Resource scarcity | Block chance |
|------------|----------------|-------------------|-------------------|-------------|
| easy | 1 per 30 ticks | 5% | none | 5% |
| normal | 1 per 15 ticks | 15% | light | 10% |
| hard | 1 per 8 ticks | 25% | heavy | 20% |
| chaos | 1 per 4 ticks | 35% | extreme | 30% |

### 3.3 Phases

Phases are the macro-structure of a scenario. Each phase unlocks new epics, changes event probabilities, and may alter the simulation's tick speed.

```markdown
## Phases

### Phase 1: Setup (ticks 1–50)
The team assembles. Leads are hired, initial tasks assigned.
Client kickoff meetings happen. Requirements are gathered.

- **Tick range:** 1–50
- **Unlocks epics:** Client Onboarding, Infrastructure Setup
- **Events enabled:** team-sick, requirement-change
- **Tick interval override:** 600ms (fast — setup should feel snappy)
- **Transition:** all "Setup" epics at 80%+ completion

### Phase 2: Sprint 1 (ticks 51–200)
First real work sprint. Multiple workstreams running in parallel.
Dependencies start to bite. First blockers emerge.

- **Tick range:** 51–200
- **Unlocks epics:** API Development, Frontend Build, Security Audit
- **Events enabled:** p0-bug, client-escalation, scope-creep, team-sick
- **Transition:** 3+ epics at "done" status

### Phase 3: Crunch (ticks 201–350)
Deadline approaching. Resource contention peaks. Hard trade-offs.

- **Tick range:** 201–350  
- **Unlocks epics:** Launch Prep, Performance Optimization, Documentation
- **Events enabled:** all
- **Difficulty modifier:** +1 (events fire 50% more often)
- **Transition:** "Launch Prep" epic at 100% OR tick 350

### Phase 4: Launch (ticks 351–400)
Ship it. Final reviews, deploy, monitor, celebrate (or patch).

- **Tick range:** 351–400
- **Unlocks epics:** Deployment, Post-Launch Monitoring
- **Events enabled:** deploy-failure, production-bug, client-feedback
- **Transition:** scenario complete
```

**Phase transitions** can be:
- **Tick-based:** phase starts at tick N regardless
- **Completion-based:** phase starts when conditions are met (e.g., "3 epics done")
- **Event-based:** phase starts when a specific event fires (e.g., "battle-begins" event triggers Phase 3)
- **Hybrid:** earliest of tick threshold OR completion condition

### 3.4 Epics

Epics are templates for large bodies of work. Each epic expands into tasks and subtasks at generation time.

```markdown
## Epics

### Client Onboarding
- **Phase:** Setup
- **Domain:** operations, engineering
- **Priority:** critical
- **Generates:** 3–5 tasks, 2–4 subtasks each
- **Dependencies:** none (entry point)
- **Description:** New client needs: contract review, environment provisioning,
  requirements doc, kickoff meeting, access setup.

#### Task Templates
1. **Contract Review** [finance]
   - Review terms → Negotiate changes → Final sign-off
   - Duration: 4–6 ticks per subtask
   - Review required: yes (L7+)
   
2. **Environment Provisioning** [engineering]
   - Create repos → Set up CI/CD → Configure staging
   - Duration: 3–5 ticks per subtask
   - Dependencies: Contract Review (approved)
   
3. **Requirements Document** [engineering]
   - Draft requirements → Client review → Revisions → Sign-off
   - Duration: 5–8 ticks per subtask
   - Review loop: 1–3 iterations (weighted: 60% pass first time, 30% one revision, 10% two revisions)
   
4. **Kickoff Meeting** [operations]
   - Prepare agenda → Schedule → Run meeting → Distribute notes
   - Duration: 2–3 ticks per subtask
   - Cross-dept trigger: on completion → unlock "API Development" epic

5. **Access Setup** [security]
   - Create accounts → Set permissions → Audit access → Sign-off
   - Duration: 2–4 ticks per subtask
   - Dependencies: Contract Review (approved)
```

**Epic template fields:**

| Field | Description |
|-------|-------------|
| `Phase` | Which phase unlocks this epic |
| `Domain` | Which department(s) own this work |
| `Priority` | Base priority (can be elevated by events) |
| `Generates` | Task/subtask count ranges (randomized within range) |
| `Dependencies` | Other epics or tasks that must complete first |
| `Description` | Context for flavor text generation |

**Task template fields:**

| Field | Description |
|-------|-------------|
| `[domain]` | Domain tag in brackets — routes to correct department |
| Subtask list | Named subtasks in order |
| `Duration` | Tick range per subtask (randomized) |
| `Review required` | Whether this task needs review before "done" |
| `Review loop` | How many iterations of review are expected (weighted distribution) |
| `Dependencies` | Tasks that must complete before this one starts |
| `Cross-dept trigger` | Events to fire on completion |

### 3.5 Events

Events inject chaos, drama, and realism. They interrupt normal flow and force the organization to respond.

```markdown
## Events

### p0-bug
- **Type:** interrupt
- **Probability:** 0.08 per tick (during enabled phases)
- **Cooldown:** 20 ticks (can't fire again within)
- **Priority elevation:** critical
- **Effect:**
  - Creates 1 critical task: "Fix [random system] outage"
  - Pulls senior engineer off current work (preempt)
  - Generates 4–6 subtasks: investigate, reproduce, fix, test, deploy, postmortem
  - Cross-dept: notify support ("we're aware, ETA incoming")
  - Cross-dept: notify client if client-facing
- **Dashboard flavor:** 🚨 flashing alert, org chart highlights affected agents in red
- **Narrative:** "[Agent] discovered a critical bug in [system]. All hands on deck."

### client-escalation
- **Type:** interrupt
- **Probability:** 0.05 per tick
- **Cooldown:** 30 ticks
- **Effect:**
  - Elevates 1 random in-progress task to critical
  - Creates task: "Client sync call" [operations, 3 ticks]
  - COO gets escalation message
  - If during Phase 3+: also creates "Scope negotiation" task
- **Narrative:** "Client [name] is unhappy with progress on [task]. Emergency meeting called."

### team-sick
- **Type:** disruption
- **Probability:** 0.03 per tick
- **Cooldown:** 40 ticks
- **Duration:** 15–25 ticks
- **Effect:**
  - 1 random non-lead agent becomes unavailable
  - Their in-progress tasks go to "blocked" (reason: "assignee unavailable")
  - Manager must reassign or wait
  - If the sick agent is a bottleneck (only person in domain), generates escalation chain
- **Narrative:** "[Agent] is out sick. [Manager] is redistributing their workload."

### scope-creep
- **Type:** expansion
- **Probability:** 0.04 per tick
- **Cooldown:** 25 ticks
- **Effect:**
  - Adds 2–4 new tasks to a random in-progress epic
  - New tasks have dependencies on existing work
  - If during Phase 3+: triggers deadline-pressure event
- **Narrative:** "New requirements just came in: [generated requirement]. Adding to the backlog."

### deadline-pressure
- **Type:** modifier
- **Probability:** 0.0 (triggered by other events or phase transitions)
- **Effect:**
  - Reduces tick duration per subtask by 30% (agents work faster but quality drops)
  - Review rejection rate increases by 10%
  - Morale metric decreases
  - After 30 ticks: either deadline met (celebrate) or missed (consequences)
- **Narrative:** "Two weeks until launch. [COO] is cutting scope."

### surprise-opportunity
- **Type:** expansion
- **Probability:** 0.02 per tick
- **Cooldown:** 60 ticks
- **Effect:**
  - New client appears with a small engagement
  - Creates 1 new epic with 3–4 tasks
  - Competes for resources with existing work
  - Successful completion awards bonus credits
- **Narrative:** "Inbound lead: [Company] wants a quick prototype. Big potential if we impress them."
```

**Event types:**

| Type | Description | Dashboard effect |
|------|-------------|-----------------|
| `interrupt` | Demands immediate attention, preempts current work | 🚨 Flash alert, red highlights |
| `disruption` | Removes or modifies resources | ⚠️ Agent goes grey, tasks redistribute |
| `expansion` | Adds new work to the scenario | 📋 New tasks appear on board |
| `modifier` | Changes simulation parameters | 🔧 Metric shifts visible |
| `narrative` | Pure story beat, no mechanical effect | 💬 Story event in timeline |
| `opportunity` | Optional beneficial event, but costs resources | ✨ Gold highlight, optional accept |

### 3.6 Resources

Resources model scarcity and contention — things agents need but can't always get.

```markdown
## Resources

### Senior Engineering Time
- **Type:** agent-hours
- **Pool:** 2 agents × 1 task-slot each = 2 concurrent
- **Contention rule:** FIFO with priority override (critical tasks preempt)
- **Starvation alert:** if any task waits > 10 ticks for this resource

### QA Capacity
- **Type:** agent-hours
- **Pool:** 1 agent × 2 task-slots = 2 concurrent reviews
- **Bottleneck effect:** when queue > 4, review duration increases 50%

### Client Meeting Slots
- **Type:** calendar
- **Pool:** 2 per phase (client only meets twice per phase)
- **Effect:** tasks requiring client sign-off must wait for a slot

### Budget
- **Type:** credits
- **Pool:** 5000 credits for scenario
- **Burn rate:** ~15 credits/tick during active work
- **Alert:** at 20% remaining, triggers "budget-crunch" event
- **Depleted:** non-critical tasks pause, critical only
```

### 3.7 Scoring

How well did the organization perform?

```markdown
## Scoring

### Dimensions (each 0–100)

- **Velocity:** tasks completed per tick, weighted by priority
- **Quality:** (1 - review rejection rate) × 100
- **Efficiency:** credits earned / credits spent ratio
- **Resilience:** how quickly org recovered from events (ticks-to-recover)
- **Morale:** f(overwork, idle-time, escalation-frequency, blocked-duration)
- **Deadline:** % of deadline-sensitive tasks completed on time

### Overall Score
weighted_average(velocity=20, quality=25, efficiency=15, resilience=20, morale=10, deadline=10)

### Grades
- **S:** 90–100 — "Legendary org. Screenshot this."
- **A:** 80–89 — "Well-oiled machine."
- **B:** 70–79 — "Solid. Room to optimize."
- **C:** 60–69 — "Growing pains. Needs restructuring."
- **D:** 50–59 — "Dysfunction junction."
- **F:** <50 — "Total organizational collapse."
```

---

## 4. Core Concepts

### 4.1 Epic → Task → Subtask Hierarchy

Three levels of work decomposition, each with different decision characteristics:

```
Epic: "Build Payment System"                    [1 decision: create + delegate to lead]
├── Task: "Design API Schema"                   [3 decisions: create + assign + ack]
│   ├── Subtask: "Research payment providers"    [7 decisions: assign, ack, progress×2, review, revise, complete]
│   ├── Subtask: "Draft OpenAPI spec"            [6 decisions: assign, ack, progress, review, complete, trigger]
│   └── Subtask: "Security review of spec"       [5 decisions: assign, ack, review, feedback, complete]
├── Task: "Implement Backend"                   [3 decisions: create + assign + ack]
│   ├── Subtask: "Stripe integration"            [7 decisions]
│   ├── Subtask: "Webhook handlers"              [6 decisions]
│   ├── Subtask: "Transaction ledger"            [7 decisions]
│   └── Subtask: "Unit tests"                    [5 decisions]
└── Task: "Frontend Integration"                [3 decisions: blocked until API done → unblock = 1 decision]
    ├── Subtask: "Payment form component"        [6 decisions]
    ├── Subtask: "Checkout flow"                 [7 decisions]
    └── Subtask: "E2E tests"                     [5 decisions]
```

**Decision accounting per subtask:**

| Step | Decisions | Messages Generated |
|------|-----------|-------------------|
| Lead creates subtask | 1 | — |
| Lead assigns to worker | 1 | delegation ACP |
| Worker acknowledges | 1 | ack ACP |
| Worker progresses (1–3 updates) | 1–3 | progress ACP(s) |
| Worker submits for review | 1 | progress ACP (pct=80) |
| Reviewer evaluates | 1 | — |
| If revision needed: feedback + rework + resubmit | 3 | escalation ACP + progress ACP |
| Reviewer approves | 1 | completion ACP |
| Worker marks complete | 1 | completion ACP |
| Cross-dept trigger fires (if applicable) | 1 | delegation ACP |
| **Total per subtask** | **8–12** | **5–8 messages** |

### 4.2 Dependencies (DAG)

Tasks form a directed acyclic graph. Dependencies create realistic workflow friction.

```
                    ┌──────────────┐
                    │ Requirements │
                    │   Document   │
                    └──────┬───────┘
                           │
                ┌──────────┼──────────┐
                ▼          ▼          ▼
         ┌──────────┐ ┌────────┐ ┌─────────┐
         │ API Spec │ │  UX    │ │ Infra   │
         │  Design  │ │ Mocks  │ │ Setup   │
         └────┬─────┘ └───┬────┘ └────┬────┘
              │            │           │
              ▼            │           │
         ┌─────────┐      │           │
         │ Backend │◄─────┘           │
         │  Build  │◄─────────────────┘
         └────┬────┘
              │
         ┌────┴────┐
         ▼         ▼
    ┌─────────┐ ┌──────────┐
    │Frontend │ │ Security │
    │  Build  │ │  Audit   │
    └────┬────┘ └────┬─────┘
         │           │
         ▼           ▼
    ┌──────────────────┐
    │   Integration    │
    │     Testing      │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │     Deploy       │
    └──────────────────┘
```

**DAG mechanics in the engine:**

```typescript
interface TaskDependency {
  taskId: string;           // the dependent task
  dependsOn: string[];      // predecessor task IDs
  type: 'finish-to-start'   // predecessor must be done
       | 'start-to-start'   // predecessor must have started
       | 'partial';         // predecessor at 50%+ triggers start
  blockedSince?: number;    // tick when this dependency started blocking
}
```

**Dashboard effect:** Dependencies show as connecting lines between task cards. Blocked tasks pulse softly. When a predecessor completes, the line turns green and the dependent task lights up — a visible "unlock" animation.

### 4.3 Decision Points with Weighted Outcomes

Not all reviews pass. Not all plans survive contact with reality.

```markdown
### Decision: Code Review
- **Approve (pass):** 70% — task advances to done
- **Request changes (minor):** 20% — task returns to in_progress, 2–3 tick rework
- **Reject (major issues):** 8% — task returns to in_progress, 5–8 tick rework
- **Escalate (out of scope):** 2% — task escalated to manager, possible reassignment

### Decision: Client Sign-Off
- **Approve:** 60%
- **Approve with conditions:** 25% — creates 1–2 new subtasks
- **Request major revisions:** 12% — epic adds 1 new task
- **Reject direction:** 3% — epic resets current phase, 30% work lost

### Decision: Resource Contention
- **First-come-first-served:** 50% — whoever asked first gets the resource
- **Priority override:** 30% — higher priority task preempts
- **Manager intervention:** 15% — manager manually assigns
- **Deadlock:** 5% — both tasks blocked, escalation to COO
```

**Difficulty scaling:**

| Decision | Easy | Normal | Hard | Chaos |
|----------|------|--------|------|-------|
| Review pass rate | 85% | 70% | 55% | 40% |
| Client approval | 80% | 60% | 40% | 25% |
| Block chance | 5% | 10% | 20% | 30% |
| Event frequency | low | medium | high | extreme |

### 4.4 Cross-Department Triggers

When work in one department creates work in another — the organizational multiplier.

```yaml
triggers:
  - when: "API Spec Design" completes
    then:
      - create_task: "Build Frontend Components" in frontend
      - create_task: "Write API Documentation" in marketing
      - create_task: "Security Review: API Surface" in security
    message: "API spec approved. Frontend, docs, and security work auto-created."

  - when: any task in "security" rejects review
    then:
      - block: the reviewed task
      - create_task: "Security Remediation" in engineering (critical)
      - notify: COO
    message: "Security found issues. Engineering must remediate before proceeding."

  - when: "Client Onboarding" epic completes
    then:
      - phase_transition: "Sprint 1"
      - create_epic: generate from "Sprint Work" template
      - event: "celebration" (narrative)
    message: "Client is onboarded! Sprint 1 begins."
```

**The multiplier effect:** A single task completion can cascade into 3–5 new tasks across departments. This is how scenarios naturally generate 1000+ decisions — not by having 1000 pre-defined tasks, but by having ~50 tasks that *generate* more tasks through triggers.

### 4.5 Resource Contention

Multiple workstreams competing for scarce resources creates organic drama.

```
Sprint 1                          Sprint 2
┌─────────────────┐               ┌─────────────────┐
│ Client A:       │               │ Client B:        │
│ Payment System  │               │ Analytics Dash   │
│                 │               │                  │
│ Needs: Sandy    │──── CONFLICT ────│ Needs: Sandy   │
│ (3 ticks)       │               │ (5 ticks)        │
└─────────────────┘               └─────────────────┘

Resolution options:
1. Sandy works Client A first (B waits 3 ticks)
2. Sandy works Client B first (A waits 5 ticks)
3. Sandy splits time (both take 60% longer)
4. Hire another senior engineer (costs credits, takes 5 ticks to onboard)
5. Escalate to COO for priority call
```

**Contention creates visible drama on the dashboard:** You see two task cards pulsing, both wanting the same agent. The agent's node on the org chart flashes between two colors. Eventually, a manager makes a call, and one task turns red (blocked) while the other turns green (proceeding). Real organizational drama, played out visually.

### 4.6 Random Events

Events are the heartbeat of scenario drama. Without events, work flows smoothly — and smoothly is boring.

**Event scheduling algorithm:**

```
for each tick:
  for each enabled event in current phase:
    if event.cooldown has elapsed:
      roll = prng.next()
      adjusted_probability = event.probability × difficulty_modifier × phase_modifier
      if roll < adjusted_probability:
        fire_event(event)
        set cooldown
```

**Event chaining:** Events can trigger other events. A `p0-bug` during `deadline-pressure` triggers `emergency-triage`. A `team-sick` event when only 1 engineer remains triggers `critical-understaffing`. This creates emergent narrative arcs that differ each run.

### 4.7 Deadlines with Consequences

Deadlines aren't just numbers — they create organizational pressure that changes behavior.

```markdown
### Deadline: Client Demo (Tick 250)

**Required completions:**
- API endpoints (all critical paths)
- Frontend demo flow (happy path)
- Sample data loaded

**As deadline approaches:**
- Tick 200 (50 remaining): status check, scope assessment
- Tick 220 (30 remaining): if behind, trigger "scope-cut" event
  - COO must choose which features to drop
  - Dropped features create "deferred" tasks (debt for later)
- Tick 240 (10 remaining): crunch mode
  - All non-critical tasks paused
  - Available agents reassigned to deadline work
  - Review standards relaxed (faster approvals, higher risk)
- Tick 250: evaluation
  - If met: celebration event, client satisfaction +20, unlock new epic
  - If missed: client-escalation event, reputation hit, recovery tasks created
```

### 4.8 Scenario Phases

Phases give scenarios a narrative arc — a beginning, middle, and climax.

**Phase mechanics:**

```typescript
interface ScenarioPhase {
  id: string;
  name: string;
  tickRange: [number, number];     // [start, end] — flexible boundaries
  tickInterval?: number;            // override base tick speed
  unlocksEpics: string[];          // epic IDs that become available
  enabledEvents: string[];          // event IDs active during this phase
  difficultyMod: number;           // multiplier on event probability (1.0 = normal)
  transition: PhaseTransition;     // when does this phase end?
  narrative: string;               // displayed on phase start
  ambientMessages: string[];       // random chatter during this phase
}

type PhaseTransition =
  | { type: 'tick'; tick: number }
  | { type: 'completion'; condition: string } // e.g., "3 epics done"
  | { type: 'event'; eventId: string }
  | { type: 'hybrid'; tick: number; condition: string }; // whichever comes first
```

### 4.9 Branching Narratives

Decisions compound. Each run tells a different story.

```
                        ┌──── Accept opportunity ────┐
                        │    (strain resources)       │
 Setup ──── Sprint ─────┤                             ├──── Resolution
                        │    (focus on core work)     │
                        └──── Decline opportunity ────┘

If accepted:
  ├── Success: bonus credits, reputation boost, unlocks "Partnership" epic
  └── Failure: missed deadline, client anger, recovery phase inserted

If declined:
  ├── Core work ships on time: solid but unspectacular finish
  └── Competitor takes the opportunity: "what if" narrative beat
```

**Branch tracking:** The engine maintains a `storyState` object — a key-value map that records which branches were taken. Events and phases can check story state to conditionally activate:

```markdown
### Event: Competitor Wins Client
- **Condition:** storyState["opportunity-declined"] == true
- **Probability:** 0.4 (fires once)
- **Effect:** narrative only — "Meanwhile, [Competitor] landed the [Opportunity] deal."
- **Dashboard:** news ticker shows the missed opportunity
```

### 4.10 Metrics & Scoring

Real-time metrics visible on the dashboard, final score on scenario completion.

**Per-tick metrics:**

| Metric | Computation | Dashboard widget |
|--------|-------------|-----------------|
| Active tasks | count(status ∈ {assigned, in_progress, review}) | Number badge |
| Throughput | completed tasks in last 20 ticks | Sparkline chart |
| Message rate | ACP messages in last 10 ticks | Pulse indicator |
| Block rate | blocked / total active | Color indicator (green → red) |
| Budget burn | credits spent / credits total | Progress bar |
| Agent utilization | busy agents / total agents | Percentage gauge |
| Escalation rate | escalations / total decisions in last 20 ticks | Warning indicator |

**Final score card:**

```
╔══════════════════════════════════════════════╗
║  SCENARIO COMPLETE: "AI Dev Agency Sprint"   ║
║                                              ║
║  Overall Grade: A (84/100)                   ║
║                                              ║
║  Velocity:    ████████░░  82                 ║
║  Quality:     █████████░  91                 ║
║  Efficiency:  ███████░░░  73                 ║
║  Resilience:  ████████░░  85                 ║
║  Morale:      ████████░░  78                 ║
║  Deadline:    █████████░  88                 ║
║                                              ║
║  Decisions: 1,847  |  Ticks: 412            ║
║  Agents: 24        |  Messages: 2,340       ║
║  Events survived: 14                         ║
║                                              ║
║  Story: You took on the extra client and     ║
║  barely made both deadlines. Sandy worked    ║
║  overtime for 40 ticks straight. Patrick     ║
║  surprisingly saved Sprint 2 by fixing the   ║
║  payment bug nobody else could figure out.   ║
║                                              ║
║  [Share on Twitter] [Run Again] [Try Hard]   ║
╚══════════════════════════════════════════════╝
```

---

## 5. Decision Math

How do we guarantee 1000+ decisions from a scenario template?

### 5.1 Base Work Decisions

```
Given:
  P = number of phases (typically 4)
  E = epics per phase (typically 3–5)
  T = tasks per epic (typically 3–5)
  S = subtasks per task (typically 2–4)
  D = decisions per subtask (typically 8–12)

Base decisions = P × E × T × S × D

Conservative: 4 × 3 × 3 × 2 × 8 = 576
Normal:       4 × 4 × 4 × 3 × 10 = 1,920
Rich:         4 × 5 × 5 × 4 × 12 = 4,800
```

### 5.2 Friction Multiplier

Additional decisions from organizational friction:

| Source | Decisions per occurrence | Occurrences per scenario | Total |
|--------|------------------------|-------------------------|-------|
| Dependency blocks/unblocks | 3 (block + reassess + unblock) | 20–40 | 60–120 |
| Review rejections + rework | 5 (reject + feedback + rework + resubmit + re-review) | 15–30 | 75–150 |
| Resource contention | 4 (conflict + escalation + resolution + reassign) | 10–20 | 40–80 |
| Cross-dept triggers | 6 (trigger + create + assign + ack + notify + log) | 15–25 | 90–150 |
| Hiring/onboarding | 4 (decide + hire + assign mentor + first task) | 5–15 | 20–60 |
| Escalation chains | 6 (escalate + manager review + resolution × levels) | 10–20 | 60–120 |
| **Friction total** | | | **345–680** |

### 5.3 Event Decisions

Each random event generates its own decision tree:

| Event type | Decisions generated | Frequency (normal) | Total |
|-----------|-------------------|-------------------|-------|
| P0 bug | 20–30 (investigate + fix + test + deploy + postmortem) | 2–4 per scenario | 40–120 |
| Client escalation | 10–15 (meeting + reprioritize + communicate) | 3–5 per scenario | 30–75 |
| Team sick | 8–12 (reassign + redistribute + backfill) | 2–4 per scenario | 16–48 |
| Scope creep | 15–20 (new tasks + replan + negotiate) | 2–3 per scenario | 30–60 |
| Opportunity | 25–35 (evaluate + accept/decline + execute) | 1–2 per scenario | 25–70 |
| **Event total** | | | **141–373** |

### 5.4 Total Decision Budget

```
Minimum scenario (easy, 15 min):
  Base:     576
  Friction: 345
  Events:   141
  ─────────────
  Total:    1,062 ✓ (exceeds 1000)

Standard scenario (normal, 20 min):
  Base:     1,920
  Friction: 500
  Events:   250
  ─────────────
  Total:    2,670

Rich scenario (hard, 30 min):
  Base:     4,800
  Friction: 680
  Events:   373
  ─────────────
  Total:    5,853
```

**The engine self-calibrates:** If a scenario is running ahead of its decision target, it reduces event frequency. If it's running behind, it increases event frequency and adds more review friction. The target is a smooth, consistent pace of ~2–3 decisions per tick.

---

## 6. Industry Scenarios

### 6.1 AI Dev Agency 🤖

*The meta-demo. OpenClaw showing off what OpenClaw can do.*

**ORG.md:** The existing BikiniBottom org (Mr. Krabs, Sandy, SpongeBob, etc.)

```markdown
# AI Dev Agency Sprint

## Meta
- **Industry:** AI Dev Agency
- **Duration:** 20 minutes
- **Target decisions:** 1800
- **Difficulty:** normal
- **Description:** BikiniBottom AI takes on two client projects and an internal
  platform upgrade simultaneously. Ship features, fight fires, bill hours.

## Phases

### Phase 1: Client Intake (ticks 1–40)
New quarter, new clients. Mr. Krabs smells money.
- **Unlocks epics:** Client Alpha Onboarding, Client Beta Onboarding, Internal: Platform Upgrade
- **Events enabled:** requirement-change
- **Tick interval:** 500ms
- **Transition:** both onboarding epics at 60%+

### Phase 2: Parallel Sprints (ticks 41–200)
Three workstreams, one engineering team. The fun begins.
- **Unlocks epics:** Alpha: Model Evaluation Pipeline, Beta: Prompt Engineering Suite,
  Internal: CI/CD Overhaul, Marketing: Case Study
- **Events enabled:** all
- **Transition:** 4+ epics done

### Phase 3: Demo Day Prep (ticks 201–320)
Client Alpha wants a demo. Client Beta wants a different demo. Both next week.
- **Unlocks epics:** Alpha: Demo Environment, Beta: Demo Environment, Cross-Client: Shared Infra
- **Events enabled:** all
- **Difficulty modifier:** 1.5
- **Transition:** both demo epics complete OR tick 320

### Phase 4: Ship & Celebrate (ticks 321–400)
Deploy to production, send invoices, write postmortem.
- **Unlocks epics:** Deployment, Billing, Retrospective
- **Events enabled:** deploy-failure, production-bug, client-feedback
- **Transition:** scenario complete

## Epics

### Client Alpha Onboarding
- **Phase:** Client Intake
- **Domain:** operations, engineering
- **Priority:** high

#### Task Templates
1. **Scope Definition** [operations]
   - Review RFP → Draft SOW → Client review → Revisions → Sign-off
   - Review loop: 1–2 iterations
   - Cross-dept: on sign-off → unlock "Model Evaluation Pipeline"

2. **Environment Setup** [engineering]
   - Provision GPU cluster → Configure model registry → Set up eval harness → Test pipeline
   - Dependencies: Scope Definition (signed)

3. **Data Pipeline** [engineering]
   - Audit client data → Build ingestion pipeline → Validate transforms → Load test
   - Duration: 4–7 ticks per subtask

### Alpha: Model Evaluation Pipeline
- **Phase:** Parallel Sprints
- **Domain:** engineering
- **Priority:** critical

#### Task Templates
1. **Eval Framework** [backend]
   - Design eval metrics → Implement scoring → Build comparison UI → Backtest
   - Cross-dept: on completion → create "Write Eval Methodology" in marketing

2. **Model Integration** [backend]
   - Integrate OpenAI API → Integrate Anthropic API → Integrate local models → A/B test harness
   - Duration: 3–5 ticks per subtask
   - Dependencies: Eval Framework (50%+)

3. **Client Dashboard** [frontend]
   - Model comparison view → Cost tracking → Latency charts → Export reports
   - Dependencies: Eval Framework (complete), Model Integration (started)
   - Cross-dept: on completion → Security Review

4. **Prompt Optimization** [engineering]
   - Baseline prompts → Systematic variation → Eval runs (×10) → Report best performers
   - This task generates 10 sub-subtasks (one per eval run), each a mini-decision
   - Duration: 2–3 ticks per eval run

### Internal: Platform Upgrade
- **Phase:** Parallel Sprints
- **Domain:** engineering, security
- **Priority:** normal (but competes for resources with client work)

#### Task Templates
1. **Dependency Audit** [security]
   - Scan packages → Flag CVEs → Prioritize fixes → Document exceptions
2. **Upgrade Core** [backend]
   - Upgrade runtime → Update dependencies → Migration scripts → Integration tests
3. **Performance Baseline** [backend]
   - Benchmark before → Optimize bottlenecks → Benchmark after → Report

## Events

### model-api-outage
- **Type:** interrupt
- **Probability:** 0.06 per tick
- **Cooldown:** 30 ticks
- **Effect:**
  - All model-related tasks blocked for 5–10 ticks
  - Sandy must build fallback to local models (creates 2 emergency subtasks)
  - Client Alpha notified (creates comms task)
- **Narrative:** "🔥 OpenAI API is down. Eval pipeline halted. Sandy is wiring up local fallbacks."

### billing-dispute
- **Type:** interrupt
- **Probability:** 0.03 per tick
- **Effect:**
  - Squilliam creates "Billing Reconciliation" task (finance)
  - Mr. Krabs personally involved (his tasks paused for 5 ticks)
  - If unresolved in 15 ticks: client-escalation trigger
- **Narrative:** "Client Beta is disputing last month's GPU charges. Mr. Krabs is NOT happy."

### intern-breaks-prod
- **Type:** interrupt
- **Probability:** 0.04 per tick (only once per scenario)
- **Effect:**
  - Plankton Jr. accidentally pushes to production
  - Creates critical "Rollback & Fix" task
  - Karen initiates security audit of deploy permissions
  - Generates 8 decisions: rollback, investigate, fix, review, redeploy, postmortem, update-perms, document
- **Narrative:** "🦠 Plankton Jr. pushed to prod. Again. Karen is adding deploy gates."

## Resources

### Senior Engineering Time
- **Pool:** SpongeBob + Patrick = 2 concurrent critical tasks
- **Contention:** Client Alpha vs Client Beta vs Internal
- **Starvation:** if any critical path waits > 8 ticks

### QA Capacity
- **Pool:** Gary = 1 agent, 2 task slots
- **Bottleneck:** Gary is the only QA. Everything funnels through Gary. 🐌

### GPU Budget
- **Pool:** 500 compute credits
- **Burn:** eval runs cost 5 credits each, training costs 20
- **Depleted:** eval work pauses, must negotiate with Mr. Krabs for more budget
```

---

### 6.2 Ocean Reef War 🐠⚔️

*THE viral scenario. Two rival reef civilizations in an all-out underwater war for territorial dominance. This is BikiniBottom's brand moment.*

**Why this scenario goes viral:**
- The org chart IS the military command structure — watching generals coordinate is inherently dramatic
- Messages between scouts and commanders feel like intercepted military communications
- The fog of war mechanic means decisions are made with incomplete information
- Two full org charts competing against each other — double the visual activity
- People will root for their reef. They'll tweet "CORAL REEF IS WINNING" with dashboard screenshots
- The phases (reconnaissance → skirmish → battle → resolution) create a natural story arc with escalating tension

**ORG.md: Coral Reef Alliance** 🪸

```markdown
# Coral Reef Alliance

## Identity
The Coral Reef Alliance — defenders of the Great Reef.
A militaristic organization fighting to protect their territory
from the Kelp Forest Dominion's expansion.

- **Industry:** Military
- **Stage:** Active conflict
- **Values:** Defend the reef, protect civilians, strategic superiority

## Culture
preset: military
- **Escalation:** immediate — lives are at stake
- **Progress updates:** every tick — full situational awareness
- **Ack required:** yes — no order goes unconfirmed

## Structure

### Admiral Nautilus — Commander-in-Chief 🐚
Supreme military commander of the Coral Reef Alliance.
Receives intelligence, makes strategic decisions, allocates forces.
Old, wise, cautious. Prefers siege warfare over direct assault.
- **Avatar:** 🐚
- **Domain:** Command
- **Reports to:** The Reef Council (Human Principal)

### Intelligence Division
Eyes and ears of the Alliance. Scouts, spies, signal interceptors.

#### Commander Eel — Intelligence Lead 🐍
Runs the spy network. Processes raw intel into actionable briefings.
- **Avatar:** 🐍
- **Domain:** Intelligence

#### Scout Fish Alpha — Field Scout 🐟
Fast, expendable, observant. Maps enemy positions.
- **Avatar:** 🐟
- **Domain:** Reconnaissance
- **Count:** 3

#### Octopus Agent — Spy 🐙
Deep cover agent in enemy territory. High-value, high-risk.
- **Avatar:** 🐙
- **Domain:** Espionage

### Battle Division
The fighting force. Organized in strike groups.

#### General Mantis Shrimp — Battle Commander 🦐
Hits harder than anything in the ocean. Commands all combat operations.
Aggressive, decisive, impatient with cautious strategies.
- **Avatar:** 🦐
- **Domain:** Combat

#### Captain Barracuda — Strike Group Alpha Lead 🐡
Fast assault specialist. Commands the primary attack force.
- **Avatar:** 🐡
- **Domain:** Assault

#### Warrior Crab — Heavy Infantry 🦀
Armored frontline fighters. Slow but nearly indestructible.
- **Avatar:** 🦀
- **Domain:** Infantry
- **Count:** 4

#### Jellyfish Swarm — Area Denial 🪼
Deploys stinging formations to control chokepoints.
- **Avatar:** 🪼
- **Domain:** Area Control
- **Count:** 2

### Engineering Corps
Builders and defenders. Coral fortifications, traps, supply routes.

#### Chief Engineer Turtle — Engineering Lead 🐢
Slow and steady. Builds the reef's defenses. Every wall is a masterpiece.
- **Avatar:** 🐢
- **Domain:** Fortification

#### Coral Builder — Construction Worker 🪸
Grows and shapes coral into defensive walls, watchtowers, and bunkers.
- **Avatar:** 🪸
- **Domain:** Construction
- **Count:** 3

#### Trap Specialist Pufferfish — Combat Engineer 🐡
Designs and deploys underwater mines, net traps, and ink clouds.
- **Avatar:** 🐡
- **Domain:** Traps

### Supply Corps
Keeps the army fed, armed, and moving.

#### Quartermaster Whale — Supply Lead 🐋
Manages logistics. Moves massive quantities of kelp rations
and shell ammunition across the reef.
- **Avatar:** 🐋
- **Domain:** Logistics

#### Supply Runner — Transport 🐠
Fast swimmers carrying supplies to front lines.
- **Avatar:** 🐠
- **Domain:** Transport
- **Count:** 3

### Diplomatic Corps
War isn't just fought with claws. Alliances, treaties, intelligence sharing.

#### Ambassador Dolphin — Diplomatic Lead 🐬
Charming, intelligent, and politically savvy. Negotiates alliances
with neutral reefs. Manages propaganda and morale.
- **Avatar:** 🐬
- **Domain:** Diplomacy

#### Messenger Seahorse — Diplomatic Courier 🐴
Carries sealed messages between allied reefs. Small, fast, discreet.
- **Avatar:** 🐴
- **Domain:** Communications
- **Count:** 2

### Medical Corps
Keeps fighters in the fight. Triage, recovery, morale.

#### Dr. Anemone — Chief Medical Officer 🌺
Field hospital commander. Pragmatic healer. "I can't fix stupid,
but I can fix the damage stupid causes."
- **Avatar:** 🌺
- **Domain:** Medical

#### Medic Cleaner Fish — Field Medic 🐟
Front-line medical support. Quick treatment under fire.
- **Avatar:** 🐟
- **Domain:** Field Medicine
- **Count:** 2
```

**SCENARIO.md:**

```markdown
# Ocean Reef War: The Battle for the Abyssal Trench

## Meta
- **Industry:** Ocean Reef War
- **Duration:** 30 minutes
- **Target decisions:** 2500
- **Difficulty:** hard
- **Seed:** random
- **Description:** The Kelp Forest Dominion is expanding toward the Great Reef.
  The Coral Reef Alliance must defend their territory through intelligence,
  fortification, combat, diplomacy, and supply chain management.
  Two full organizations clash in a 5-phase war that escalates from
  reconnaissance to full-scale battle.
- **Mode:** adversarial (two orgs, AI-vs-AI)

## World State

### Territory Map (6×6 grid)
```
  A  B  C  D  E  F
1 [🪸][🪸][🪸][ ? ][ ? ][ ? ]
2 [🪸][🪸][ ? ][ ? ][ ? ][ ? ]
3 [🪸][ ? ][ ? ][ ? ][ ? ][🌿]
4 [ ? ][ ? ][ ? ][ ? ][🌿][🌿]
5 [ ? ][ ? ][ ? ][🌿][🌿][🌿]
6 [ ? ][ ? ][🌿][🌿][🌿][🌿]
```

- 🪸 = Coral Reef Alliance territory (known)
- 🌿 = Kelp Forest Dominion territory (known)
- ? = Unexplored / Fog of War
- The Abyssal Trench runs diagonally C3→D4 (key strategic chokepoint)

### Resources
- **Kelp Rations:** 500 units (feeds army; -2/tick per active combat unit)
- **Shell Ammunition:** 300 units (-1/tick per combat unit in battle)
- **Coral Building Material:** 200 units (fortifications cost 10–30 each)
- **Intel Points:** 0 (gained by scouts, spent on strategic decisions)
- **Morale:** 80/100 (drops on losses, rises on victories and rations)
- **Alliance Points:** 0/100 (diplomatic progress toward neutral reef alliance)

## Phases

### Phase 1: Reconnaissance (ticks 1–60)
The fog of war is thick. Both sides send scouts to map enemy positions.
Intelligence flows in fragments. Every revealed tile changes the strategic picture.

- **Unlocks epics:** Scout Deployment, Early Fortification, Supply Chain Setup, Diplomatic Outreach
- **Events enabled:** scout-ambush, false-intel, neutral-reef-contact, resource-discovery
- **Tick interval:** 700ms
- **Ambient:** scouts reporting coordinates, engineers discussing where to build walls,
  supply runners inventorying rations
- **Transition:** 60%+ of map revealed OR tick 60
- **Music mood:** tense, quiet, anticipatory

#### Fog of War Mechanic
Each scout mission reveals 1–2 tiles. Some reveal:
- Empty water (safe to traverse)
- Enemy outpost (immediate escalation to intelligence)
- Resource cache (kelp field, shell deposit — creates "secure resource" task)
- Neutral reef (diplomatic opportunity — creates diplomacy task)
- Ambush! (scout captured or killed — intelligence loss)

Intel flows: Scout → Commander Eel (analysis, 2 ticks) → Admiral Nautilus (decision, 1 tick).
Raw intel is unreliable: 15% chance of false information. Commander Eel can cross-reference
multiple scout reports to verify (costs 3 ticks but eliminates false intel).

### Phase 2: Fortification & Positioning (ticks 61–140)
Both sides know the map. Now they're digging in and preparing.
Engineers build walls. Supply chains are established. Diplomatic missions intensify.

- **Unlocks epics:** Defensive Line Construction, Forward Base, Alliance Negotiations,
  Supply Route Optimization, Spy Infiltration
- **Events enabled:** all reconnaissance events + sabotage, supply-raid, desertion,
  diplomatic-incident, weather-current-shift
- **Tick interval:** 800ms
- **Transition:** either side initiates aggression OR tick 140

#### Fortification Tasks
Each fortification is a mini-project:
- Survey location (scout, 2 ticks)
- Design structure (engineer, 3 ticks)
- Gather materials (supply, 4 ticks, costs coral resources)
- Build fortification (3 builders, 6 ticks)
- Install traps (trap specialist, 3 ticks)
- Garrison troops (battle division, ongoing)

A defensive line of 3 fortifications = 90+ decisions just from building.

### Phase 3: First Blood — Skirmishes (ticks 141–220)
Contact. Small engagements at the borders. Probing attacks.
Each skirmish generates tactical decisions and cascading consequences.

- **Unlocks epics:** Border Skirmish Alpha, Border Skirmish Beta, Casualty Management,
  Propaganda Campaign, Emergency Resupply
- **Events enabled:** all + ambush, flanking-maneuver, morale-break, heroic-stand,
  enemy-surrender, war-crime-report
- **Difficulty modifier:** 1.3
- **Tick interval:** 900ms
- **Transition:** cumulative casualties > threshold OR major victory event

#### Skirmish Mechanics
Each skirmish is a mini-scenario within the scenario:

```
1. Detection (scout reports enemy movement)              [3 decisions]
2. Intel Assessment (Commander Eel evaluates threat)      [2 decisions]
3. Admiral Decision: engage / defend / retreat            [1 decision, branching]
4. Force Allocation (General assigns units)               [4 decisions]
5. Supply Check (Quartermaster confirms ammo/rations)     [2 decisions]
6. Engagement (3–8 ticks of combat, decisions per tick)   [15–40 decisions]
   - Each tick: advance/hold/retreat per unit
   - Flanking opportunities (spend reserves?)
   - Casualty reports → medical dispatch
   - Ammo depletion → resupply request
   - Morale checks (hold or break?)
7. Aftermath                                               [8 decisions]
   - Casualty triage (medics)
   - Territory assessment (gained/lost/held)
   - Intel from captured enemies
   - Report to Admiral
   - Propaganda (spin the story for morale)
   
Total per skirmish: 35–60 decisions
× 4–6 skirmishes in Phase 3 = 140–360 decisions
```

### Phase 4: The Battle of the Abyssal Trench (ticks 221–340)
Full-scale war. Both sides commit everything. The Abyssal Trench is the prize.
This is the visual climax — the dashboard should be on fire.

- **Unlocks epics:** Grand Assault Plan, Trench Defense, Naval Blockade,
  Alliance Reinforcements (if diplomatic success), Last Resort Weapons,
  Civilian Evacuation
- **Events enabled:** all + critical-supply-failure, betrayal, secret-weapon,
  natural-disaster (whirlpool), heroic-sacrifice, turning-point
- **Difficulty modifier:** 2.0
- **Tick interval:** 1000ms (slower ticks, more happens per tick)
- **Transition:** one side controls the Trench OR tick 340

#### The Grand Battle
Multiple simultaneous engagements:
- **Main assault** on the Trench (20+ agents involved)
- **Flanking maneuver** through the Deep Caves (risky, high reward)
- **Naval blockade** cutting enemy supply lines
- **Spy operation** to sabotage enemy command
- **Diplomatic emergency** — convince neutral reef to intervene

Each of these is a concurrent epic generating 50–100 decisions.
The dashboard shows ALL of them happening at once — org chart ablaze
with activity, messages flying in every direction, resources depleting,
morale fluctuating, territory map updating tile by tile.

### Phase 5: Resolution (ticks 341–400)
The battle is decided. Now comes the aftermath.
- **Unlocks epics:** Ceasefire Negotiation, Territory Settlement,
  Casualty Accounting, War Memorial, Post-War Reconstruction
- **Events enabled:** peace-offer, rebellion, refugee-crisis, war-hero-ceremony
- **Tick interval:** 600ms (denouement is faster)
- **Transition:** scenario complete

## Epics

### Scout Deployment
- **Phase:** Reconnaissance
- **Domain:** Intelligence
- **Priority:** critical

#### Task Templates
1. **Deploy Scout Team Alpha** [reconnaissance]
   - Brief scouts → Deploy to sectors B3,C3,D3 → Await reports → Analyze
   - Each sector reveal = 1 subtask with fog-of-war outcome
   - Duration: 3–5 ticks per sector

2. **Deploy Scout Team Beta** [reconnaissance]
   - Brief scouts → Deploy to sectors D2,E2,E3 → Await reports → Analyze
   - Duration: 3–5 ticks per sector

3. **Deep Reconnaissance** [espionage]
   - Brief Octopus Agent → Infiltrate enemy territory → Map command structure → Extract
   - Duration: 8–12 ticks total (high risk)
   - Decision: if detected, fight-or-flee (weighted: 30% escape clean, 40% escape with intel lost,
     20% captured, 10% heroic intelligence coup)
   - Cross-dept: on success → unlock "Spy Infiltration" epic in Phase 2

### Defensive Line Construction
- **Phase:** Fortification & Positioning
- **Domain:** Fortification, Construction
- **Priority:** high

#### Task Templates
1. **Trench Outer Wall** [construction]
   - Survey C2 → Design coral barrier → Gather 30 coral → Build wall (6 ticks) → Install spike traps
   - Resource cost: 30 coral, 10 shell (for trap spikes)
   - Cross-dept: on completion → unlock garrison assignment (battle division)

2. **Watchtower at B3** [construction]
   - Survey → Design → Gather 15 coral → Build tower (4 ticks) → Post lookout
   - Provides: +1 scout range (adjacent tiles auto-revealed)
   - Resource cost: 15 coral

3. **Minefield at D4** [traps]
   - Design mine pattern → Craft 20 sea mines → Deploy pattern → Map safe paths for allies
   - Resource cost: 20 shell
   - Risk: 10% chance of premature detonation during deployment (creates casualty event)

### Grand Assault Plan
- **Phase:** Battle of the Abyssal Trench
- **Domain:** Combat, Command
- **Priority:** critical

#### Task Templates
1. **Strategic Planning** [command]
   - Admiral reviews intel → War council (all division leads) → Choose strategy → Approve plan
   - Decision: 3 strategy options (weighted by intel quality + resource state):
     a) **Frontal Assault** (70% win if resources > 60%, 30% otherwise; high casualties)
     b) **Pincer Movement** (60% win; requires successful flanking epic; moderate casualties)
     c) **Siege & Starve** (80% win but takes 40+ more ticks; low casualties; risks enemy breakout)
   - Branch: chosen strategy changes which sub-epics unlock

2. **Force Deployment** [combat]
   - Assign units to positions → Distribute ammo → Final supply check → Confirm readiness
   - Creates 1 subtask per combat unit (8–12 subtasks)
   - Duration: 1–2 ticks each

3. **Execute Assault** [combat]
   - The big one. 20–40 ticks of active battle.
   - Each tick: 2–4 decisions (unit movements, engagement calls, resupply requests)
   - Special moments (randomly triggered):
     - "Heroic Stand" — one unit holds against overwhelming odds (+20 morale)
     - "Critical Failure" — key fortification falls (-15 morale, creates emergency)
     - "Turning Point" — enemy commander makes a mistake (exploit or not?)
     - "Betrayal" — if alliance was tenuous, ally might switch sides (devastating)

## Events

### scout-ambush
- **Type:** interrupt
- **Probability:** 0.10 per tick (Recon phase), 0.05 (other phases)
- **Cooldown:** 15 ticks
- **Effect:**
  - 1 scout captured or eliminated
  - Intel for that sector lost or corrupted
  - Commander Eel must decide: send rescue mission (risky, 3 tasks) or write off the scout
  - If rescued: morale +5, scout provides bonus intel
  - If lost: morale -5, that sector stays in fog
- **Narrative:** "Scout Fish Alpha-2 has gone silent in sector D3. Last transmission was garbled."

### supply-raid
- **Type:** interrupt
- **Probability:** 0.06 per tick (Phase 2+)
- **Cooldown:** 25 ticks
- **Effect:**
  - Enemy raids a supply route
  - Lose 20–50 rations OR 10–30 ammo (random)
  - Supply Runner may be captured
  - Quartermaster must reroute supplies (creates 3 tasks)
  - If this is the 3rd supply raid: triggers "supply-crisis" cascading event
- **Narrative:** "🚨 Supply convoy ambushed in sector C4! 40 kelp rations lost. Quartermaster Whale is rerouting."

### shifting-alliance
- **Type:** narrative
- **Probability:** 0.03 per tick (Phase 2+)
- **Cooldown:** 40 ticks
- **Condition:** Alliance Points > 30
- **Effect:**
  - Neutral reef makes a demand: "Send 100 rations as tribute or we ally with the enemy"
  - Admiral must decide: pay (lose rations), negotiate (Ambassador task, 50% success), or refuse
  - Accept: Alliance Points +30
  - Negotiate success: Alliance Points +20, tribute reduced to 50
  - Negotiate fail: Alliance Points -10
  - Refuse: Alliance Points -20, risk neutral reef joining enemy
- **Narrative:** "🐬 The Deep Reef Confederation demands tribute. Ambassador Dolphin is drafting a counter-offer."

### natural-disaster-whirlpool
- **Type:** disruption
- **Probability:** 0.02 per tick (Phase 3+)
- **Cooldown:** 100 ticks (once per scenario essentially)
- **Effect:**
  - Whirlpool forms at random map tile
  - Any units/fortifications in adjacent tiles: 30% damaged, 10% destroyed
  - Both sides affected — temporary ceasefire (5 ticks)
  - Creates emergency tasks: rescue trapped units, repair fortifications
  - Territory may shift (tiles revert to unexplored)
- **Narrative:** "🌊 WHIRLPOOL at D3! Both sides scrambling. Ceasefire declared while the ocean rearranges itself."
- **Dashboard:** map tiles swirl, affected units flash, then new layout revealed

### heroic-sacrifice
- **Type:** narrative
- **Probability:** 0.0 (triggered only during Phase 4 battle when morale < 40)
- **Effect:**
  - One warrior unit volunteers for a suicide mission
  - If accepted: that unit is lost, but deals massive damage to enemy position
  - Morale +25 (the sacrifice inspires the troops)
  - Creates "Memorial" task in Resolution phase
  - Unlocks special ending: "Victory through sacrifice"
- **Narrative:** "Warrior Crab-3 volunteers for the impossible mission. 'For the Reef.' 🦀💀"
- **Dashboard:** The sacrificing agent's node pulses gold before fading to grey. A star icon appears on the territory map where they fell.

### secret-weapon
- **Type:** opportunity
- **Probability:** 0.0 (triggered at tick 250 if Engineering Corps has completed 80%+ of construction tasks)
- **Effect:**
  - Chief Engineer Turtle reveals a prototype: the "Sonic Coral Cannon"
  - Building it: 3 tasks, 15 ticks, costs 50 coral + 30 shell
  - If built: can be deployed once — clears an entire map tile of enemy forces
  - Game-changing but expensive. Admiral must weigh resource cost vs. tactical advantage.
- **Narrative:** "🐢 Chief Engineer Turtle has been working on something in secret.
  'It's not pretty,' he says, 'but it'll change the war.' The Sonic Coral Cannon prototype is ready for review."

## Resources

### Kelp Rations
- **Starting:** 500
- **Burn rate:** 2/tick per active combat unit, 0.5/tick per non-combat agent
- **Resupply:** Supply Corps can create "Kelp Farming" task (generates 50 rations, takes 10 ticks)
- **Depleted:** Morale drops 5/tick, combat effectiveness halved
- **Dashboard:** Green bar, turns yellow at 30%, red at 15%

### Shell Ammunition
- **Starting:** 300
- **Burn rate:** 1/tick per unit in active combat
- **Resupply:** Supply Corps "Shell Gathering" task (generates 30 ammo, 8 ticks)
- **Depleted:** Combat units can only defend (no attacks)
- **Dashboard:** Orange bar with shell icons

### Coral Building Material
- **Starting:** 200
- **Burn rate:** only consumed by construction tasks
- **Resupply:** Engineering Corps "Coral Cultivation" task (generates 25 coral, 12 ticks)
- **Depleted:** No new fortifications
- **Dashboard:** Pink bar with coral icons

### Morale
- **Starting:** 80/100
- **Modifiers:**
  - Victory in skirmish: +10
  - Loss in skirmish: -15
  - Scout lost: -5
  - Heroic moment: +10–25
  - Rations depleted: -5/tick
  - Alliance secured: +15
  - Betrayal: -30
- **Below 30:** units may desert (random check each tick)
- **Below 15:** organizational collapse — scenario ends in defeat
- **Dashboard:** Animated morale meter with soldier icons. At high morale, soldiers cheer. At low morale, they look defeated.

## Scoring

### Dimensions
- **Territory Control:** % of map tiles held at resolution
- **Force Preservation:** % of starting forces still active
- **Resource Efficiency:** resources remaining / resources consumed ratio
- **Intel Accuracy:** correct intel / total intel received
- **Diplomatic Success:** alliance points achieved
- **Speed:** ticks to reach resolution (fewer = better)
- **Morale:** final morale score

### Special Achievements
- 🏆 **Flawless Victory:** Won with 0 units lost
- 🕵️ **Spymaster:** Every intel report was verified correct
- 🤝 **Diplomat:** Secured alliance without paying tribute
- ⚡ **Blitzkrieg:** Won in under 300 ticks
- 🐢 **Fortress:** Won without losing a single fortification
- 💀 **Pyrrhic Victory:** Won but with < 20% forces remaining
- 🌊 **Survived the Whirlpool:** Recovered from natural disaster with no losses
- 🦀 **Remember Warrior Crab-3:** Won after triggering heroic sacrifice

### Twitter Card
On completion, generate a shareable summary card:
```
🐠⚔️ OCEAN REEF WAR — BATTLE COMPLETE

🪸 Coral Reef Alliance: VICTORY

Territory: ████████░░ 82%
Forces:    ██████░░░░ 64%
Morale:    █████████░ 87%

Grade: A (86/100)
Achievements: 🕵️🤝

"The Sonic Coral Cannon fired once.
 That was enough."

Decisions: 2,847 | Agents: 42
#BikiniBottom #OceanReefWar
```
```

**The second ORG (enemy) — Kelp Forest Dominion** is auto-generated by mirroring the Coral Reef org with different names, flavors, and slight tactical biases (more aggressive, fewer diplomats, more combat units). The engine runs both orgs simultaneously, with decisions from one affecting the other through the shared territory map.

---

### 6.3 Legal Tech Firm ⚖️

*Every case is a branching tree. Perfect for the dependency engine.*

```markdown
# Legal Tech Firm: Quarterly Docket

## Meta
- **Industry:** Legal Tech
- **Duration:** 25 minutes
- **Target decisions:** 2000
- **Difficulty:** normal
- **Description:** A 20-person legal tech firm managing 4 active cases
  simultaneously. Discovery, filings, compliance reviews, client comms.
  Every case branches based on rulings, evidence discovered, and
  opposing counsel's moves.

## Phases

### Phase 1: Case Intake (ticks 1–50)
New cases arrive. Conflict checks, engagement letters, initial research.
- **Unlocks epics:** Case Alpha: Patent Infringement, Case Beta: Data Breach Class Action,
  Case Gamma: Regulatory Compliance Audit, Case Delta: Contract Dispute
- **Events enabled:** conflict-of-interest, rush-filing, new-evidence
- **Transition:** all intake tasks complete

### Phase 2: Discovery & Research (ticks 51–180)
The deep work. Document review, depositions, expert analysis.
Discovery is where the decisions multiply — every document reviewed is a decision.
- **Unlocks epics:** Alpha Discovery, Beta Discovery, Gamma Compliance Matrix, Delta Mediation Prep
- **Events enabled:** all
- **Transition:** 60%+ discovery complete across all cases

### Phase 3: Filing & Motions (ticks 181–300)
Court deadlines. Motions to file. Opposing counsel's responses.
Every filing can be contested, amended, or rejected.
- **Unlocks epics:** Alpha Motion for Summary Judgment, Beta Class Certification,
  Gamma Regulatory Submission, Delta Settlement Negotiation
- **Events enabled:** all + court-ruling, judge-order, opposing-motion
- **Difficulty modifier:** 1.5
- **Transition:** all cases resolved or at trial stage

### Phase 4: Resolution (ticks 301–400)
Cases settle, go to trial, or get dismissed.
- **Unlocks epics:** case-specific resolution epics based on branching
- **Transition:** scenario complete

## Epics

### Case Alpha: Patent Infringement — Discovery
- **Phase:** Discovery & Research
- **Domain:** litigation, research
- **Priority:** high

#### Task Templates
1. **Document Collection** [research]
   - Identify custodians → Issue hold notices → Collect documents → Process for review
   - Generates: 200+ document-review subtasks (batch of 10 per task)
   - Each batch: 3 ticks, decision: relevant / privileged / responsive / junk
   - Cross-dept: privileged docs → trigger privilege log task

2. **Prior Art Search** [research]
   - Define search terms → Patent database search → Academic search → Analyze results
   - Decision point: prior art found (40%) → changes case strategy
   - Cross-dept: if found → create "Amend Complaint" task in litigation

3. **Expert Witness Engagement** [operations]
   - Identify experts → Conflict check → Engagement letter → Initial briefing
   - Resource contention: only 2 expert budget slots for 4 cases
   - Duration: 5–8 ticks per subtask

4. **Deposition Preparation** [litigation]
   - Review witness list → Prepare questions → Mock deposition → Final prep
   - Dependencies: Document Collection (70%+)
   - Decision: opposing counsel moves to quash (20%) → creates motion task

## Events

### court-ruling
- **Type:** narrative + interrupt
- **Probability:** 0.04 per tick (Phase 3+)
- **Effect:**
  - Judge rules on a pending motion
  - Outcomes (weighted): granted (40%), granted in part (30%),
    denied (20%), denied with sanctions (10%)
  - Each outcome creates different follow-up tasks
  - "Denied with sanctions": critical — creates emergency compliance tasks + billing writedown
- **Narrative:** "⚖️ Judge Morrison ruled on the motion to compel: GRANTED IN PART.
  Production deadline moved up 2 weeks."

### new-evidence
- **Type:** expansion
- **Probability:** 0.05 per tick
- **Effect:**
  - Surprise evidence surfaces (whistleblower, opposing production, public records)
  - Creates 5–10 new document review tasks
  - May change case strategy: decision point for lead attorney
  - 20% chance: evidence is so significant it triggers settlement discussion
- **Narrative:** "📁 New evidence just dropped in Case Beta. 4,000 pages of internal emails.
  Compliance team is scrambling."

### billing-audit
- **Type:** disruption
- **Probability:** 0.03 per tick
- **Effect:**
  - Client questions billing on a case
  - Creates "Billing Reconciliation" task
  - Finance lead must review and justify hours
  - If hours excessive: client demands write-down (budget impact)
- **Narrative:** "Client for Case Gamma is questioning the $45,000 in research hours. Finance is reviewing."
```

---

### 6.4 Fintech Startup 💳

*Compliance creates review loops. KYC is a dependency nightmare.*

```markdown
# Fintech Startup: Series B Quarter

## Meta
- **Industry:** Fintech
- **Duration:** 20 minutes
- **Target decisions:** 1600
- **Description:** A fintech startup post-Series B. Launching new products while
  navigating regulatory mazes, audit prep, and the ever-present fraud pipeline.

## Key Mechanics
- **KYC Pipeline:** Every new customer triggers: identity verify → document check →
  risk scoring → compliance review → approve/deny/escalate.
  At scale, 50+ KYC applications per scenario phase.
- **Regulatory Review Loops:** Any product change requires: legal review → compliance check →
  regulatory filing → approval (avg 2.3 iterations before approval)
- **Fraud Alerts:** ML model flags transactions. Each flag: investigate → classify →
  action (block/allow/escalate). ~30 alerts per phase.
- **Audit Trail:** Everything generates audit events. Auditor arrives in Phase 3
  and requests documentation for everything.
```

### 6.5 Game Studio 🎮

```markdown
# Game Studio: Ship the RPG

## Meta
- **Industry:** Game Studio
- **Duration:** 25 minutes
- **Target decisions:** 1800
- **Description:** An indie studio shipping a mid-size RPG. Art pipeline,
  sprint cycles, QA hell, and the dreaded launch day.

## Key Mechanics
- **Art Pipeline:** Concept → Model → Texture → Rig → Animate → Review.
  Each asset is 6 subtasks × 50+ assets = 300+ art subtasks.
- **Sprint Cycles:** 2-week sprints within the scenario. Sprint planning,
  daily standups (automated check-ins), sprint review, retro.
- **QA Gauntlet:** Every feature goes through: smoke test → regression →
  performance → compatibility → certification. Bugs found loop back to dev.
- **Platform Certification:** Console cert is a gatekeeper. Fail → 30+ ticks
  of fix-and-resubmit.
```

### 6.6 Open Source Project 🌐

```markdown
# Open Source Project: v2.0 Release

## Meta
- **Industry:** Open Source
- **Duration:** 15 minutes
- **Target decisions:** 1200
- **Description:** A popular open source project preparing a major version release.
  Community PRs, breaking changes, documentation, governance.

## Key Mechanics
- **PR Triage:** Community PRs arrive as events. Each: review → test →
  merge/reject/request-changes. 40+ PRs per scenario.
- **Breaking Change Process:** RFC → Discussion → Vote → Implementation → Migration guide.
  Each breaking change is a 20-decision epic.
- **Community Management:** Angry issue authors, feature requests, security reports,
  CoC violations. Each is an interrupt event.
- **Release Engineering:** Branch → Freeze → RC1 → Bug reports → RC2 → Final → Tag → Publish → Announce.
```

---

## 7. Integration with Deterministic Engine

### 7.1 Current Engine Touchpoints

The Scenario Engine wraps the existing `DeterministicSimulation` class. No rewrites — only extensions.

```typescript
// New file: tools/sandbox/src/scenario-engine.ts

import { DeterministicSimulation } from './deterministic.js';
import type { SandboxAgent, SandboxTask, SandboxEvent, ACPMessage } from './types.js';

interface ScenarioDefinition {
  meta: ScenarioMeta;
  phases: ScenarioPhase[];
  epics: EpicTemplate[];
  events: EventTemplate[];
  resources: ResourcePool[];
  scoring: ScoringConfig;
}

class ScenarioEngine {
  private sim: DeterministicSimulation;
  private scenario: ScenarioDefinition;
  private currentPhase: number = 0;
  private activeEpics: Map<string, EpicInstance> = new Map();
  private dag: DependencyGraph = new DependencyGraph();
  private eventScheduler: EventScheduler;
  private resources: ResourceManager;
  private storyState: Map<string, any> = new Map();
  private prng: SeededRandom;
  private decisionCount: number = 0;

  constructor(sim: DeterministicSimulation, scenario: ScenarioDefinition) {
    this.sim = sim;
    this.scenario = scenario;
    this.prng = new SeededRandom(scenario.meta.seed);
    this.eventScheduler = new EventScheduler(scenario.events, this.prng);
    this.resources = new ResourceManager(scenario.resources);
  }

  /** Called BEFORE each sim tick — injects scenario-driven work */
  preTick(): void {
    // 1. Check phase transitions
    this.evaluatePhaseTransition();

    // 2. Expand any newly unlocked epics into tasks
    this.expandUnlockedEpics();

    // 3. Resolve DAG — unblock tasks whose dependencies are met
    this.dag.resolve(this.sim.tasks);

    // 4. Fire scheduled/random events
    const events = this.eventScheduler.tick(
      this.sim.tick,
      this.currentPhase,
      this.scenario.phases[this.currentPhase],
      this.storyState
    );
    for (const event of events) {
      this.fireEvent(event);
    }

    // 5. Update resource pools
    this.resources.tick(this.sim.agents, this.sim.tasks);

    // 6. Feed work into simulation via processOrder or direct task injection
    this.injectPendingWork();
  }

  /** Called AFTER each sim tick — collects metrics, counts decisions */
  postTick(): void {
    this.decisionCount += this.countNewDecisions();
    this.calibratePacing();
  }

  /** Adjusts event frequency to hit target decision rate */
  private calibratePacing(): void {
    const targetRate = this.scenario.meta.targetDecisions / this.estimateTotalTicks();
    const actualRate = this.decisionCount / this.sim.tick;

    if (actualRate < targetRate * 0.8) {
      this.eventScheduler.increaseFrequency(1.2);
    } else if (actualRate > targetRate * 1.2) {
      this.eventScheduler.decreaseFrequency(0.8);
    }
  }
}
```

### 7.2 Extending Existing Types

New types that complement (not replace) existing ones:

```typescript
// Additions to types.ts

// Epic: a large body of work that decomposes into tasks
interface SandboxEpic {
  id: string;
  title: string;
  phase: string;
  domain: string[];
  priority: SandboxTask['priority'];
  status: 'locked' | 'active' | 'done';
  taskIds: string[];
  completionPct: number;
  unlockedAt?: number;    // tick when epic became active
  completedAt?: number;   // tick when epic finished
}

// Extended task with dependency info
interface SandboxTaskV2 extends SandboxTask {
  epicId?: string;           // parent epic
  parentTaskId?: string;     // parent task (for subtasks)
  dependsOn?: string[];      // task IDs that must complete first
  triggers?: TaskTrigger[];  // what happens when this task completes
  resourceCost?: Record<string, number>; // resources consumed
  reviewLoop?: {             // review iteration tracking
    maxIterations: number;
    currentIteration: number;
    weights: number[];       // probability distribution for pass/revise/reject
  };
}

// New ACP message types
type ACPMessageTypeV2 = ACPMessage['type']
  | 'intel_report'    // reef war: scout reports
  | 'resource_alert'  // resource pool running low
  | 'event_alert'     // random event notification
  | 'phase_change'    // scenario phase transition
  | 'decision_request' // requires manager decision
  | 'battle_report';  // reef war: combat results

// Extended event with scenario metadata
interface SandboxEventV2 extends SandboxEvent {
  scenarioEvent?: string;  // which scenario event template triggered this
  phaseId?: string;        // which phase we're in
  epicId?: string;         // which epic this relates to
  visualEffect?: string;   // hint to dashboard for special rendering
}
```

### 7.3 Hooking into the Tick Loop

The key integration point — the Scenario Engine hooks into the existing tick loop:

```typescript
// Modified DeterministicSimulation.runTick()

async runTick(): Promise<void> {
  this.tick++;

  // ═══ NEW: Scenario pre-tick ═══
  if (this.scenarioEngine) {
    this.scenarioEngine.preTick();
  }

  // ═══ EXISTING: Process agents by level (top-down) ═══
  const sortedAgents = [...this.agents].sort((a, b) => b.level - a.level);
  for (const agent of sortedAgents) {
    if (agent.role === 'coo' || agent.level >= 9) {
      this.tickCOO(agent);
      this.tickUnblock(agent);
    } else if (agent.role === 'lead') {
      this.tickLead(agent);
      this.tickUnblock(agent);
    } else {
      this.tickWorker(agent);
    }
  }

  // ═══ NEW: Scenario post-tick ═══
  if (this.scenarioEngine) {
    this.scenarioEngine.postTick();
  }

  // ═══ EXISTING: Metrics ═══
  this.metricsHistory.push({ ... });
}
```

### 7.4 The DAG Resolver

Resolves task dependencies each tick:

```typescript
class DependencyGraph {
  private edges: Map<string, string[]> = new Map(); // taskId → [dependsOn...]

  addDependency(taskId: string, dependsOn: string): void {
    const deps = this.edges.get(taskId) || [];
    deps.push(dependsOn);
    this.edges.set(taskId, deps);
  }

  /** Check all blocked tasks. Unblock any whose dependencies are met. */
  resolve(tasks: SandboxTask[]): string[] {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const unblocked: string[] = [];

    for (const [taskId, deps] of this.edges) {
      const task = taskMap.get(taskId);
      if (!task || task.status !== 'blocked') continue;
      if (task.blockedReason !== 'Dependency not ready') continue;

      const allMet = deps.every(depId => {
        const dep = taskMap.get(depId);
        return dep && dep.status === 'done';
      });

      if (allMet) {
        task.status = 'assigned';
        task.blockedReason = undefined;
        unblocked.push(taskId);
      }
    }

    return unblocked;
  }

  /** Topological sort for visualization (shows critical path) */
  criticalPath(tasks: SandboxTask[]): string[] {
    // ... standard topological sort with longest-path calculation
  }
}
```

### 7.5 Adversarial Mode (Reef War)

For the Reef War scenario, two `DeterministicSimulation` instances run in parallel:

```typescript
class AdversarialScenarioEngine {
  private allianceSim: DeterministicSimulation;
  private dominionSim: DeterministicSimulation;
  private allianceScenario: ScenarioEngine;
  private dominionScenario: ScenarioEngine;
  private sharedWorld: WorldState; // territory map, shared events

  async runTick(): Promise<void> {
    // Both sides pre-tick (generate work based on shared world state)
    this.allianceScenario.preTick();
    this.dominionScenario.preTick();

    // Both sides process (agents work, make decisions)
    await this.allianceSim.runTick();
    await this.dominionSim.runTick();

    // Resolve conflicts (both sides claiming same territory, combat outcomes)
    this.resolveConflicts();

    // Update shared world state
    this.sharedWorld.update();

    // Both sides post-tick (react to new world state)
    this.allianceScenario.postTick();
    this.dominionScenario.postTick();
  }

  private resolveConflicts(): void {
    // Combat resolution: compare force strength, terrain, morale
    // Territory changes: update map based on combat outcomes
    // Resource effects: supply raids, blockades
    // Intel: what each side learns about the other
  }
}
```

---

## 8. Dashboard Visualization

### 8.1 Scenario Selector Screen

Before a scenario starts, users see a selection screen:

```
┌─────────────────────────────────────────────────────────────────┐
│  🌊 BikiniBottom Scenarios                                      │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ 🤖 AI Dev    │  │ 🐠⚔️ Reef War │  │ ⚖️ Legal Tech │          │
│  │   Agency     │  │              │  │    Firm      │          │
│  │              │  │ MOST POPULAR │  │              │          │
│  │  20 min      │  │  30 min      │  │  25 min      │          │
│  │  ~1800 dec   │  │  ~2500 dec   │  │  ~2000 dec   │          │
│  │  ★★★☆☆       │  │  ★★★★★       │  │  ★★★★☆       │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ 💳 Fintech   │  │ 🎮 Game      │  │ 🌐 Open      │          │
│  │   Startup    │  │   Studio     │  │   Source     │          │
│  │  20 min      │  │  25 min      │  │  15 min      │          │
│  │  ~1600 dec   │  │  ~1800 dec   │  │  ~1200 dec   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  Difficulty: [Easy] [Normal] [■ Hard] [Chaos]     Seed: [auto]  │
│                                                                  │
│  [▶ Start Scenario]                                              │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Phase Banner

When a phase transitions, a cinematic banner sweeps across the dashboard:

```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   ⚔️ PHASE 3: FIRST BLOOD                             ║
║                                                       ║
║   Scout reports confirmed: enemy positions at D4, E3  ║
║   General Mantis Shrimp is mobilizing strike teams    ║
║                                                       ║
║   New objectives unlocked:                            ║
║   • Border Skirmish Alpha                             ║
║   • Emergency Resupply                                ║
║   • Propaganda Campaign                               ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

### 8.3 Enhanced Org Chart

The org chart becomes the primary visual for scenarios:

**Normal state:** Agents are nodes, connections show reporting lines. Idle agents are dim, busy agents glow.

**During active work:**
- Messages fly along connection lines as animated particles
- Agents pulse when making decisions (brighter = more critical)
- Blocked agents show a red border with a pulsing lock icon
- Cross-department messages arc across the chart in distinct colors

**During Reef War:**
- Split screen: two org charts side by side
- Territory map in the center
- Attack messages show as red arrows between the two orgs
- Intel messages show as yellow dashed lines
- When a unit is lost, its node fades and cracks
- When a battle is won, victor's section glows gold

**Ambient animations:**
- Scouts have a radar-sweep animation on their nodes
- Supply runners have tiny package icons traveling along their connections
- Engineers have a building animation (tiny coral growing)
- Medics have a pulse/heartbeat animation
- Diplomats have a handshake animation when negotiating

### 8.4 Territory Map (Reef War)

A real-time updating hex grid:

```
State: Phase 3 — Skirmish Active

     🪸  🪸  🪸  ⚔️  🌫️  🌫️
   🪸  🪸  ⚔️  🔍  🌫️  🌿
     🪸  🏰  🌊  🌊  🌿  🌿
   🌊  🌊  💥  🌊  🌿  🌿
     🌫️  🌊  🌿  🌿  🏰  🌿
   🌫️  🌫️  🌿  🌿  🌿  🌿

Legend:
🪸 Coral territory    🌿 Kelp territory    🌫️ Fog of war
🏰 Fortification      ⚔️ Skirmish active   💥 Battle!
🔍 Scout present      🌊 Neutral water
```

Tiles animate on state change:
- Fog clears with a dissolve effect when scouted
- Battles show explosion particles
- Fortifications build up brick-by-brick
- Territory captures sweep the new color across the tile

### 8.5 Event Timeline

A scrolling timeline at the bottom of the dashboard showing narrative events:

```
TICK 156  🐍 Commander Eel: "Intel confirmed — enemy forward base at D4."
TICK 158  🐚 Admiral Nautilus: "Prepare Strike Group Alpha. Defensive posture."
TICK 161  ⚔️ SKIRMISH at C4 — 3 Warrior Crabs vs 2 Kelp Sentinels
TICK 163  🦐 General Mantis Shrimp: "Push forward! They're retreating!"
TICK 165  🚨 Supply raid! 40 kelp rations lost at B4.
TICK 167  🐋 Quartermaster Whale: "Rerouting supplies through A3. ETA 8 ticks."
TICK 170  ✅ SKIRMISH RESOLVED — Coral Reef VICTORY at C4 (+1 territory)
TICK 172  🐬 Ambassador Dolphin: "Deep Reef Confederation is open to talks."
```

### 8.6 Resource Dashboard (Scenario-Specific)

```
┌──────────────────────────────────────┐
│  🪸 Coral Reef Alliance Resources   │
│                                      │
│  Kelp Rations   ████████░░░  73%    │
│  Shell Ammo      █████░░░░░  48%    │
│  Coral Material  ███████░░░  68%    │
│  Morale          █████████░  87%    │
│  Intel Points    ███░░░░░░░  31     │
│  Alliance        ██████░░░░  56%    │
│                                      │
│  Burn Rate: -4.5 rations/tick       │
│  Resupply ETA: 6 ticks              │
└──────────────────────────────────────┘
```

### 8.7 Decision Feed

A high-density view of every decision as it happens:

```
#1847  🐡 Captain Barracuda → ATTACK sector D4 (priority override)
#1848  🦀 Warrior Crab-2 → ACKNOWLEDGE attack order
#1849  🐋 Quartermaster → APPROVE ammo requisition (30 shells)
#1850  🐙 Octopus Agent → REPORT enemy reserves low (confidence: 72%)
#1851  🐍 Commander Eel → VERIFY intel (cross-reference with Scout Alpha-1)
#1852  🐚 Admiral Nautilus → DECISION: proceed with flanking maneuver
#1853  🦐 General Mantis → DEPLOY reserve unit to C3
#1854  🌺 Dr. Anemone → TRIAGE: 2 wounded, 1 critical
```

Each decision is a row with: number, agent avatar, action verb, and details. Color-coded by type: green = progress, red = block/escalate, blue = command, yellow = intel.

---

## 9. Implementation Phases

### Phase 1: Foundation (2 weeks)

**Goal:** Scenario Engine can load SCENARIO.md and feed work into the existing simulation.

**Deliverables:**
- [ ] SCENARIO.md parser (markdown → ScenarioDefinition)
- [ ] ScenarioEngine class with preTick/postTick hooks
- [ ] Phase Manager (tick-based transitions only)
- [ ] Task Generator (expand epic templates into tasks/subtasks)
- [ ] Integration with DeterministicSimulation (hook into runTick)
- [ ] One working scenario: "AI Dev Agency — Simple Sprint" (500+ decisions)

**Key files:**
- `tools/sandbox/src/scenario-engine.ts` — core engine
- `tools/sandbox/src/scenario-parser.ts` — SCENARIO.md parser
- `tools/sandbox/scenarios/ai-dev-agency-simple.md` — first scenario

### Phase 2: Friction Systems (2 weeks)

**Goal:** Dependencies, events, and resource contention working.

**Deliverables:**
- [ ] DependencyGraph (DAG resolver with topological sort)
- [ ] EventScheduler (seeded PRNG, cooldowns, chaining)
- [ ] ResourceManager (pools, burn rates, alerts)
- [ ] Decision Evaluator (weighted outcomes for reviews, approvals)
- [ ] Review loops (reject → rework → resubmit cycle)
- [ ] Cross-department triggers
- [ ] Resource contention resolution
- [ ] Upgraded scenario: "AI Dev Agency — Full Sprint" (1500+ decisions)

**Key files:**
- `tools/sandbox/src/dag.ts` — dependency graph
- `tools/sandbox/src/events.ts` — event scheduler
- `tools/sandbox/src/resources.ts` — resource management
- `tools/sandbox/src/decisions.ts` — weighted decision evaluation

### Phase 3: Dashboard Integration (2 weeks)

**Goal:** Scenarios are visually compelling on the dashboard.

**Deliverables:**
- [ ] Phase banner component
- [ ] Enhanced org chart animations (message particles, glow states)
- [ ] Event timeline component
- [ ] Resource dashboard component
- [ ] Scenario selector screen
- [ ] Score card (end-of-scenario summary with shareable card)
- [ ] Decision feed component

### Phase 4: Adversarial Mode & Reef War (3 weeks)

**Goal:** The Ocean Reef War scenario runs with two competing orgs.

**Deliverables:**
- [ ] AdversarialScenarioEngine (dual simulation runner)
- [ ] WorldState (shared territory map)
- [ ] Combat resolution system
- [ ] Fog of war mechanic
- [ ] Territory map visualization
- [ ] Split-screen org charts
- [ ] Full Reef War scenario: "Battle for the Abyssal Trench" (2500+ decisions)
- [ ] Kelp Forest Dominion ORG.md (auto-generated mirror)

### Phase 5: Scenario Library & Polish (2 weeks)

**Goal:** All six scenarios playable. Polish and sharing.

**Deliverables:**
- [ ] Legal Tech scenario
- [ ] Fintech Startup scenario
- [ ] Game Studio scenario
- [ ] Open Source Project scenario
- [ ] Difficulty system (easy/normal/hard/chaos)
- [ ] Seed sharing ("try seed #42069")
- [ ] Twitter card generation
- [ ] Achievement system
- [ ] Scenario completion statistics (leaderboard?)

### Phase 6: Community & UGC (ongoing)

**Goal:** Users create and share their own scenarios.

**Deliverables:**
- [ ] Scenario editor (web UI for building SCENARIO.md)
- [ ] Scenario gallery (community-shared scenarios)
- [ ] Scenario validation (lint + dry-run to catch errors)
- [ ] Custom ORG.md + SCENARIO.md pairing
- [ ] Scenario remix (fork + modify)

---

## Appendix A: Glossary

| Term | Definition |
|------|-----------|
| **Epic** | Large body of work containing multiple tasks. Tied to a phase. |
| **Phase** | Major stage of a scenario with its own pacing, events, and epics. |
| **DAG** | Directed Acyclic Graph — the dependency structure between tasks. |
| **Decision** | Any action taken by an agent: assign, ack, progress, review, complete, escalate, etc. |
| **Tick** | One simulation cycle. ~600–1000ms of wall-clock time. |
| **Seed** | PRNG seed for reproducible runs. Same seed + same scenario = same outcome. |
| **Friction** | Organizational overhead: dependencies, reviews, contention, events. |
| **Fog of War** | Information asymmetry — agents make decisions with incomplete information. |
| **Story State** | Key-value map tracking narrative branch decisions for conditional content. |
| **Adversarial Mode** | Two simulations running against each other with a shared world state. |

## Appendix B: SCENARIO.md Complete Grammar

```
scenario      := meta phases epics events? resources? scoring?

meta          := "## Meta" newline (meta-field newline)*
meta-field    := "- **" key ":** " value

phases        := "## Phases" newline (phase newline)*
phase         := "### " phase-name " (" tick-range ")" newline
                 prose newline
                 (phase-field newline)*
                 ("#### " sub-section newline prose newline)*
phase-field   := "- **" key ":** " value

epics         := "## Epics" newline (epic newline)*
epic          := "### " epic-name newline
                 (epic-field newline)*
                 ("#### Task Templates" newline (task-template newline)*)?
epic-field    := "- **" key ":** " value

task-template := number ". **" task-name "** [" domain "]" newline
                 ("   - " subtask-or-field newline)*

events        := "## Events" newline (event newline)*
event         := "### " event-id newline
                 (event-field newline)*
event-field   := "- **" key ":** " value

resources     := "## Resources" newline (resource newline)*
resource      := "### " resource-name newline
                 (resource-field newline)*

scoring       := "## Scoring" newline prose
```

## Appendix C: Decision Type Taxonomy

Every decision in the simulation falls into one of these categories:

| Category | Examples | Avg per occurrence | Visual signal |
|----------|----------|-------------------|---------------|
| **Command** | Delegate task, approve plan, allocate resources | 1 | Blue pulse |
| **Execution** | Start work, make progress, submit deliverable | 1–3 | Green pulse |
| **Review** | Approve, reject, request changes | 1 | Yellow pulse |
| **Communication** | Ack, progress report, escalation | 1 | Message particle |
| **Hiring** | Spawn agent, assign mentor, first task | 3–4 | New node animation |
| **Contention** | Resource conflict, priority override, deadlock | 2–4 | Red/orange pulse |
| **Event Response** | Triage interrupt, reassign, emergency task | 5–15 | Alert animation |
| **Strategic** | Phase transition, scope cut, strategy choice | 1–3 | Phase banner |
| **Diplomatic** | Negotiate, offer tribute, form alliance | 3–6 | Handshake animation |
| **Combat** | Engage, retreat, flank, resupply (Reef War only) | 2–4 | Sword animation |

---

*The Scenario Engine transforms BikiniBottom from a toy demo into something people actually want to watch. It's the difference between a sandbox with three blocks and SimCity. Build the engine, and the scenarios write themselves.*
