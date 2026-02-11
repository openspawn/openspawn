---
title: Event-Driven Agent Architecture
layout: default
parent: Strategy
nav_order: 6
---

# Event-Driven Agent Architecture

> Sleep until there's work. Wake, think, act, sleep again. Premium models become affordable when they only fire on real events.

## Design Philosophy

### The Problem with Polling

BikiniBottom's current execution model is tick-based: every N ticks, every agent wakes up, reads its context, and decides what to do. This works. It's simple. And for cheap models running locally, it's fine — a Haiku call costs fractions of a cent, an Ollama call costs nothing.

But it falls apart when you want premium models in the org.

Consider a COO agent running Claude Opus. Its job is strategic: receive escalations from leads, make high-level delegation decisions, handle complex cross-department coordination. In a 25-agent org, the COO might get 3-5 meaningful events per hour. But on a 30-second tick cycle, it wakes up 120 times per hour. That's 115+ wasted invocations — each one sending the full system prompt, org context, and inbox state to the most expensive model available.

**The math is brutal:**

| Scenario | Invocations/hr | Cost/hr (Opus) | Useful work |
|----------|---------------|----------------|-------------|
| 30s tick cycle | 120 | ~$14.40 | 3-5 actions |
| 1min tick cycle | 60 | ~$7.20 | 3-5 actions |
| Event-driven | 3-5 | ~$0.60 | 3-5 actions |

Same output. 12-24x cheaper. The COO doesn't need to wake up and think "nothing to do" a hundred times an hour — it needs to wake up when something *actually needs its attention*.

### Learning from Operating Systems

This isn't a new problem. Operating systems solved it decades ago with interrupt-driven I/O. Early systems polled devices in a loop: "Any data? No? Any data? No?" Modern systems use interrupts: the device *signals* the CPU when it has data, and the CPU sleeps until then.

The analogy is exact:
- **Polling** = busy-waiting. Simple, burns cycles.
- **Event-driven** = interrupt-driven. Efficient, only runs when needed.

The key insight: **event-driven doesn't mean less responsive.** The agent still reacts immediately when something arrives. It just doesn't waste resources checking an empty inbox.

### The Core Principle

**Match execution cost to decision value.** An Opus-class agent making a $0.12 decision about cross-department escalation is worth it. An Opus-class agent spending $0.12 to conclude "inbox empty, nothing to do" is waste.

---

## 1. Two Execution Modes

### 1.1 Polling Mode (Current)

The agent wakes on a fixed schedule, regardless of whether there's work.

```
tick 1: wake → check inbox → nothing → idle ($0.12)
tick 2: wake → check inbox → nothing → idle ($0.12)
tick 3: wake → check inbox → escalation! → handle it ($0.12)
tick 4: wake → check inbox → nothing → idle ($0.12)
tick 5: wake → check inbox → nothing → idle ($0.12)
...
```

**Characteristics:**
- Fixed cost per tick, regardless of activity
- Simple to implement — just loop
- Good for: cheap models (Haiku, Ollama), high-activity workers who almost always have work
- Bad for: expensive models, managers who mostly wait

**Cost model:** `cost = ticks_per_hour × cost_per_invocation`

### 1.2 Event-Driven Mode (New)

The agent sleeps until its inbox receives a message. No message, no invocation, no cost.

```
[sleeping...]
[sleeping...]
escalation arrives → wake → handle it ($0.12)
[sleeping...]
[sleeping...]
[sleeping...]
completion arrives → wake → process result ($0.12)
[sleeping...]
```

**Characteristics:**
- Variable cost — proportional to actual events
- Slightly more complex — needs inbox monitoring
- Good for: expensive models, managers, strategic roles, low-activity specialists
- Bad for: nothing, really — but polling is simpler for always-busy agents

**Cost model:** `cost = events_per_hour × cost_per_invocation`

### 1.3 Choosing a Mode

The decision is straightforward:

| Factor | Use Polling | Use Event-Driven |
|--------|------------|-------------------|
| Model cost | Cheap (<$0.01/call) | Expensive (>$0.05/call) |
| Activity level | Busy (>50% of ticks have work) | Sparse (<20% of ticks have work) |
| Role type | Worker (always has tasks) | Manager (waits for reports) |
| Latency tolerance | Needs sub-second response | Can wait for next tick check |
| Budget priority | Predictable spend | Minimized spend |

Most orgs will use both. That's the point.

---

## 2. Trigger Types

Event-driven agents don't wake on *every* inbox event. They specify which event types are worth waking for. This is the `triggerOn` filter.

### 2.1 Event Catalog

| Trigger | Source | Description | Typical Consumer |
|---------|--------|-------------|-----------------|
| `task_assigned` | ACP delegation | New task delegated to this agent | Leads, workers |
| `escalation_received` | ACP escalation | A report escalated a problem | Managers, COO |
| `completion_received` | ACP completion | A report finished a task | Managers, COO |
| `message_received` | ACP message | Direct message from another agent | Any |
| `order_received` | Human principal | Human gave a direct order | COO, leads |
| `timer` | Scheduler | Scheduled wake-up (cron-style) | Any (daily reviews, weekly reports) |
| `threshold` | Metrics engine | A metric crossed a configured boundary | COO, leads |

### 2.2 Trigger Configuration

```typescript
interface AgentTriggerConfig {
  mode: 'polling' | 'event-driven';
  
  // Polling mode
  tickInterval?: number;        // Wake every N ticks (default: 1)
  
  // Event-driven mode
  triggerOn?: TriggerType[];    // Which events wake the agent
  batchWindow?: number;         // Ticks to wait before processing (batch events)
  maxSleepTicks?: number;       // Maximum ticks to sleep (safety wake-up)
  
  // Timer triggers
  timers?: TimerConfig[];       // Scheduled wake-ups
  
  // Threshold triggers  
  thresholds?: ThresholdConfig[]; // Metric-based wake-ups
}

interface TimerConfig {
  name: string;                 // e.g., "daily-review"
  cron: string;                 // e.g., "0 9 * * *" (9 AM daily)
  context?: string;             // Injected into agent prompt on wake
}

interface ThresholdConfig {
  metric: string;               // e.g., "team.escalation_rate"
  operator: '>' | '<' | '>=' | '<=' | '==';
  value: number;                // e.g., 0.30
  cooldownTicks: number;        // Don't re-trigger for N ticks after firing
  context?: string;             // Injected into agent prompt on wake
}
```

### 2.3 Examples

**COO (strategic, expensive model):**
```typescript
{
  mode: 'event-driven',
  triggerOn: ['escalation_received', 'completion_received', 'order_received'],
  timers: [{ name: 'daily-review', cron: '0 9 * * *', context: 'Review org health and pending escalations' }],
  thresholds: [{ metric: 'org.escalation_rate', operator: '>', value: 0.30, cooldownTicks: 100 }],
  maxSleepTicks: 200  // Safety: wake at least every ~3 hours
}
```

**Engineering Lead (tactical, mid-tier model):**
```typescript
{
  mode: 'event-driven',
  triggerOn: ['task_assigned', 'escalation_received', 'completion_received'],
  batchWindow: 3  // Wait 3 ticks to batch multiple completions into one invocation
}
```

**Backend Worker (execution, cheap model):**
```typescript
{
  mode: 'polling',
  tickInterval: 1  // Every tick, always working
}
```

---

## 3. Batch Windows

A subtle but important optimization: **batch windows** let event-driven agents accumulate multiple events before waking.

### The Problem with Naive Event-Driven

If a lead delegates 5 tasks to 5 workers simultaneously, and 3 workers finish within 2 ticks of each other, the lead gets woken 3 times in rapid succession. Each invocation includes the full context. The lead might make a suboptimal decision on invocation 1 that it would change if it saw all 3 completions together.

### The Solution: Batch Window

```
completion arrives (tick 10) → start batch window (3 ticks)
completion arrives (tick 11) → add to batch
completion arrives (tick 12) → add to batch
batch window expires (tick 13) → wake with all 3 completions
```

The agent sees all pending events at once and makes one informed decision instead of three reactive ones.

**When to use batch windows:**
- Managers receiving many completions from a team
- Any role where seeing multiple events together produces better decisions

**When NOT to use:**
- Critical escalations (you want immediate response)
- Human orders (humans expect fast acknowledgment)

**Selective batching:** Batch windows can apply per-trigger-type:
```typescript
{
  mode: 'event-driven',
  triggerOn: ['escalation_received', 'completion_received'],
  batchWindow: 0,  // Default: no batching
  batchOverrides: {
    'completion_received': 3  // But batch completions
  }
}
```

---

## 4. Hybrid Architecture

The real power emerges when you mix both modes in a single org. This creates a natural cost hierarchy that mirrors the value hierarchy.

### 4.1 The Model-Cost Pyramid

```
        ┌─────────┐
        │  Opus   │  COO: event-driven
        │ $0.12/  │  ~5 events/hr = $0.60/hr
        │  call   │
        ├─────────┤
        │ Sonnet  │  Leads: event-driven  
        │ $0.03/  │  ~15 events/hr = $0.45/hr each
        │  call   │
        ├─────────┤
        │  Haiku  │  Workers: polling
        │ $0.003/ │  120 ticks/hr = $0.36/hr each
        │  call   │
        └─────────┘
```

Cheap models poll because even at 120 calls/hour, they cost less than one Opus call. Expensive models sleep because their per-call cost demands that every invocation count.

### 4.2 Event Propagation = ACP Message Flow

The event-driven architecture doesn't need a separate event bus — **ACP messages ARE the events.** When a worker completes a task, it sends an ACP completion message to its lead. That message landing in the lead's inbox IS the event that wakes the lead.

```
Worker (polling) completes task
  → ACP completion message → Lead's inbox
    → Lead (event-driven) wakes
      → Lead processes, delegates new work
        → ACP delegation message → Worker's inbox
          → Worker (polling) picks up on next tick

Worker (polling) hits blocker
  → ACP escalation message → Lead's inbox
    → Lead (event-driven) wakes
      → Lead can't resolve
        → ACP escalation message → COO's inbox
          → COO (event-driven) wakes
            → COO resolves, sends response
```

No separate event system. No message broker. No pub/sub infrastructure. The communication protocol IS the event system. This is what makes the architecture clean: adding event-driven mode is a scheduling change, not an architectural one.

### 4.3 Full Org Example

```markdown
## Structure

### COO
Strategic oversight. Handles cross-department coordination and escalations.
- **Model:** claude-opus
- **Trigger:** event-driven
- **Wake on:** escalations, completions, orders
- **Timer:** daily review at 09:00
- **Threshold:** org escalation rate > 30%

### Engineering

#### Engineering Lead
Triages technical work. Delegates to specialists.
- **Model:** claude-sonnet
- **Trigger:** event-driven
- **Wake on:** tasks, escalations, completions
- **Batch window:** 3 ticks (for completions)

#### Backend Workers
- **Model:** claude-haiku
- **Trigger:** polling
- **Count:** 3

#### Frontend Workers
- **Model:** claude-haiku
- **Trigger:** polling
- **Count:** 2

### Marketing

#### Marketing Lead
- **Model:** claude-sonnet
- **Trigger:** event-driven
- **Wake on:** tasks, escalations, completions

#### Content Workers
- **Model:** ollama/llama3
- **Trigger:** polling
- **Count:** 2
```

---

## 5. Implementation Design

### 5.1 Engine Changes

The simulation engine's per-tick loop changes minimally:

```typescript
// Current (polling only)
for (const agent of agents) {
  if (tick % agent.tickInterval === 0) {
    await invokeAgent(agent);
  }
}

// New (hybrid)
for (const agent of agents) {
  if (agent.trigger.mode === 'polling') {
    if (tick % agent.trigger.tickInterval === 0) {
      await invokeAgent(agent);
    }
  } else {
    // Event-driven: check inbox
    const pending = agent.inbox.getPending();
    if (pending.length > 0 && !agent.inBatchWindow()) {
      await invokeAgent(agent, { events: pending });
      agent.inbox.markProcessed(pending);
    }
    // Safety wake-up
    if (agent.ticksSinceLastWake >= agent.trigger.maxSleepTicks) {
      await invokeAgent(agent, { reason: 'safety_wakeup' });
    }
    // Timer check
    for (const timer of agent.trigger.timers ?? []) {
      if (timer.shouldFire(tick)) {
        await invokeAgent(agent, { reason: 'timer', timer: timer.name, context: timer.context });
      }
    }
    // Threshold check
    for (const threshold of agent.trigger.thresholds ?? []) {
      if (threshold.evaluate() && !threshold.inCooldown()) {
        await invokeAgent(agent, { reason: 'threshold', metric: threshold.metric });
        threshold.startCooldown();
      }
    }
  }
}
```

### 5.2 Agent Invocation Context

When an event-driven agent wakes, its prompt includes why it woke:

```
You are being invoked because:
- 2 completion messages received (from Backend Worker 1, Backend Worker 3)
- 1 escalation received (from Frontend Worker 2: BLOCKED — missing design assets)

Your inbox:
[... ACP messages ...]
```

This is critical — the agent needs to know *why* it's awake. A polling agent can infer "check what's new." An event-driven agent should be told "here's what triggered you."

### 5.3 Inbox Data Model

```typescript
interface AgentInbox {
  messages: ACPMessage[];     // All pending messages
  
  getPending(): ACPMessage[]; // Unprocessed messages
  markProcessed(msgs: ACPMessage[]): void;
  
  // For batch windows
  oldestPendingTick(): number | null;
  
  // Stats
  totalReceived: number;
  totalProcessed: number;
}
```

### 5.4 Mode Switching

Agents can switch modes at runtime (with appropriate permissions):

```typescript
// Lead decides workers should switch to event-driven during low-activity period
{
  type: 'config_request',
  from: 'engineering-lead',
  to: 'coo',
  change: { agent: 'backend-worker-1', trigger: { mode: 'event-driven', triggerOn: ['task_assigned'] } },
  reason: 'Low task volume this week — switching to event-driven to save budget'
}
```

This enables dynamic cost optimization: the org adapts its execution mode based on workload.

---

## 6. Cost Analysis

### 6.1 Reference Pricing

Approximate costs per invocation (including typical context window):

| Model | Cost/invocation | Notes |
|-------|----------------|-------|
| Claude Opus | $0.12 | ~4K input tokens + ~1K output |
| Claude Sonnet | $0.03 | Same context |
| Claude Haiku | $0.003 | Same context |
| GPT-4o | $0.04 | Same context |
| Ollama (local) | $0.00 | Electricity only |

### 6.2 Scenario: 25-Agent Org, 30-Second Ticks

**Org composition:**
- 1 COO (strategic)
- 4 Leads (tactical)
- 20 Workers (execution)

**Activity profile (realistic):**
- COO: 5 meaningful events/hour
- Leads: 15 meaningful events/hour each
- Workers: 80% of ticks have work (they're busy)

#### All Polling with Opus (Worst Case)

Every agent wakes every 30 seconds = 120 invocations/hour/agent.

```
25 agents × 120 inv/hr × $0.12/inv = $360/hour
                                     = $8,640/day
                                     = $259,200/month
```

Nobody would do this. But it illustrates why "just use the best model" doesn't work with polling.

#### All Polling with Model Tiers

```
COO:     1 × 120 inv/hr × $0.12  = $14.40/hr
Leads:   4 × 120 inv/hr × $0.03  = $14.40/hr
Workers: 20 × 120 inv/hr × $0.003 = $7.20/hr
                            Total = $36.00/hr
                                  = $864/day
```

Better. But the COO and leads are still wasting 80-95% of their invocations on empty inboxes.

#### Event-Driven with Model Tiers (Optimal)

```
COO:     1 × 5 events/hr × $0.12   = $0.60/hr
Leads:   4 × 15 events/hr × $0.03  = $1.80/hr
Workers: 20 × 96 inv/hr × $0.003   = $5.76/hr  (80% of 120 ticks)
                              Total = $8.16/hr
                                    = $195.84/day
```

**Savings vs all-polling with tiers: 77%**
**Savings vs all-polling with Opus: 97.7%**

The COO goes from $14.40/hr to $0.60/hr — a **24x reduction** — while handling exactly the same workload.

### 6.3 Break-Even Analysis

When does event-driven save money? When the event rate is lower than the polling rate:

```
break_even = events_per_hour < ticks_per_hour
```

For a 30-second tick cycle (120 ticks/hr), event-driven is cheaper whenever the agent receives fewer than 120 events per hour. For managers, this is essentially always.

For workers, the break-even is tighter. A worker that has tasks 95% of ticks gains almost nothing from event-driven — and the added complexity isn't worth it. Stick with polling.

**Rule of thumb:** If an agent is idle more than 20% of ticks, event-driven saves money. If idle more than 50%, it's a no-brainer.

---

## 7. ORG.md Integration

Event-driven configuration integrates naturally into the ORG.md structure section.

### 7.1 Syntax

```markdown
### COO
Strategic oversight. Handles escalations and cross-department coordination.
- **Model:** claude-opus
- **Trigger:** event-driven
- **Wake on:** escalations, completions, orders
- **Timer:** daily review at 09:00
- **Threshold:** escalation rate > 30%
- **Max sleep:** 200 ticks
```

### 7.2 Parsing Rules

| Field | Format | Default |
|-------|--------|---------|
| `Trigger` | `polling` or `event-driven` | `polling` |
| `Wake on` | Comma-separated trigger types | All types |
| `Batch window` | Number (ticks) | `0` (no batching) |
| `Timer` | Name + cron-like description | None |
| `Threshold` | Metric + operator + value | None |
| `Max sleep` | Number (ticks) | `500` |
| `Tick interval` | Number (polling only) | `1` |

**Wake on shorthand:**

| Shorthand | Expands to |
|-----------|-----------|
| `escalations` | `escalation_received` |
| `completions` | `completion_received` |
| `tasks` | `task_assigned` |
| `messages` | `message_received` |
| `orders` | `order_received` |

### 7.3 Culture-Level Defaults

The Culture section can set org-wide defaults:

```markdown
## Culture

preset: startup
- **Default trigger:** event-driven for L7+, polling for L6 and below
- **Default max sleep:** 300 ticks
```

This creates sensible tiered execution without specifying trigger config for every role.

---

## 8. Metrics & Observability

Event-driven agents create new observability needs. You need to know if an agent is sleeping because there's no work, or sleeping because events aren't being routed correctly.

### 8.1 New Metrics

| Metric | Description | Healthy Range |
|--------|-------------|---------------|
| `wake_rate` | Invocations per hour (event-driven agents) | Depends on role |
| `sleep_duration_avg` | Average ticks between wakes | Role-dependent |
| `event_queue_depth` | Pending events in inbox | < 5 |
| `batch_efficiency` | Events per invocation (batched agents) | 2-5 |
| `safety_wake_rate` | How often maxSleepTicks triggers | Should be rare |
| `cost_per_decision` | Total cost / meaningful actions taken | Trending down |
| `idle_waste` | Polling invocations with no action taken | < 20% |

### 8.2 Dashboard

```
┌─────────────────────────────────────────────────────────┐
│ Agent Execution Overview                                │
├───────────┬──────────┬──────────┬──────────┬───────────┤
│ Agent     │ Mode     │ Wake/hr  │ Cost/hr  │ Util %    │
├───────────┼──────────┼──────────┼──────────┼───────────┤
│ COO       │ event    │ 4        │ $0.48    │ 100%      │
│ Eng Lead  │ event    │ 18       │ $0.54    │ 100%      │
│ Mkt Lead  │ event    │ 8        │ $0.24    │ 100%      │
│ Worker 1  │ polling  │ 120      │ $0.36    │ 82%       │
│ Worker 2  │ polling  │ 120      │ $0.36    │ 91%       │
│ Worker 3  │ polling  │ 120      │ $0.36    │ 45% ⚠️    │
└───────────┴──────────┴──────────┴──────────┴───────────┘
                                    Total: $8.16/hr

⚠️ Worker 3 utilization at 45% — consider switching to event-driven
```

Utilization for polling agents = ticks with work / total ticks. For event-driven agents, utilization is always 100% by definition (they only wake when there's work).

### 8.3 Auto-Optimization

The system can recommend mode switches based on observed patterns:

```markdown
## Recommendations

### 💰 Cost Optimization
- Worker 3 is idle 55% of ticks
  → Recommendation: Switch to event-driven mode
  → Estimated savings: $0.20/hr ($4.80/day)

- Marketing Lead averages 25 events/hr (higher than expected)  
  → Current mode is optimal (event-driven)
  → Note: If event rate exceeds 60/hr, consider switching to polling
```

---

## 9. Edge Cases & Safety

### 9.1 Event Storms

If an agent suddenly receives 50 events in one tick (e.g., a batch of tasks completes simultaneously), the agent shouldn't be invoked 50 times. The batch window handles this — but even without explicit batching, the engine processes all pending inbox messages in a single invocation.

### 9.2 Stale Agents

An event-driven agent with misconfigured triggers might never wake up. The `maxSleepTicks` parameter is the safety net — it forces a periodic wake-up regardless of inbox state. The safety wake-up includes context: "You haven't been invoked in 200 ticks. Review your inbox and current state."

### 9.3 Cascading Wakes

A COO making a decision might trigger 4 delegations, waking 4 leads, who each delegate to 3 workers — a cascade of 16 wakes from one event. This is correct behavior (it IS how the org should respond to work), but the engine should process cascades breadth-first within a tick to avoid deep recursion.

### 9.4 Mode Transition

When switching from polling to event-driven mid-run:
1. Agent finishes current tick normally
2. Mode switches on next tick
3. Any work-in-progress continues — the agent just won't be polled again
4. Pending inbox messages trigger immediate wake on next engine pass

When switching from event-driven to polling:
1. Any pending inbox messages are processed on the first polling tick
2. Normal tick schedule resumes

---

## 10. Design Principles

1. **Cost should follow value.** Expensive models should only fire when they're producing expensive decisions. Checking an empty inbox is never an expensive decision.

2. **No new infrastructure.** Event-driven mode uses the existing ACP message flow as its event source. No message brokers, no pub/sub, no event buses. Messages are events.

3. **Opt-in complexity.** Polling is the default because it's simpler. Event-driven is available for agents that benefit from it. The system works fine with all-polling — event-driven is a cost optimization, not a requirement.

4. **Observable by default.** Every mode switch, every wake, every sleep duration is logged and visible. You should never wonder "why isn't this agent doing anything?"

5. **Safe to misconfigure.** Wrong trigger filters? `maxSleepTicks` catches it. Event storm? Batch processing handles it. The system degrades gracefully, never silently.

6. **The org decides, not the agent.** Execution mode is an organizational decision (set in ORG.md), not an agent's choice. The COO doesn't decide to be event-driven — the org designer decides the COO should be event-driven.

---

*Event-driven execution makes premium models economically viable in agent organizations. It's not about doing less work — it's about not paying to check if there's work. The best agents, like the best employees, should be available when needed and not burning budget when they're not.*
