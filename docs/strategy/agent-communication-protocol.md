---
title: Agent Communication Protocol (ACP)
layout: default
parent: Strategy
nav_order: 4
---

# Agent Communication Protocol (ACP)

> How agents in a hierarchy communicate — modeled after how effective human organizations actually work.

## Design Philosophy

### The Problem with Agent Communication Today

Most agent frameworks treat agents as isolated function calls: task in, result out. There's no acknowledgment, no progress visibility, no structured way to say "I'm stuck." It's the equivalent of emailing someone a task and hoping they reply eventually. This works for simple, single-agent workflows — but it doesn't scale to coordinating teams of agents on complex work.

Consider what happens when an agent silently fails: the delegator doesn't know. Tokens are wasted. Time is lost. The parent agent might spawn a duplicate. There's no feedback loop — and feedback loops are what make organizations functional.

### Learning from Human Organizations

Effective human organizations have solved this problem over centuries. They developed communication norms that balance two competing needs:

1. **Managers need visibility** — they need to know work is progressing
2. **Workers need autonomy** — constant interruptions kill productivity

The solution: **different communication channels for different urgency levels.** Slack for quick acks, project boards for async status, tapping someone's shoulder for blockers. Each channel has an implicit noise level, and everyone understands which to use when.

ACP formalizes this into a protocol. It models agents as **employees with communication norms** — they acknowledge, report, escalate, and complete through well-defined channels.

### The Core Principle

**Push what's urgent, pull what's optional, minimize interrupts.**

| What happened | How it's communicated | Why |
|---|---|---|
| Task received | 👍 ACK (auto, no LLM) | Delegator confirms it landed — zero noise |
| Making progress | Task activity log (pull-based) | Manager checks when *they* want to — respects agent autonomy |
| Something's wrong | Escalation message (push) | Blockers need attention NOW — this *should* be noisy |
| Task finished | ✅ Completion + summary (push) | Delegator needs the signal to proceed with dependent work |

This maps directly to how good managers operate: they don't tap shoulders to check progress (they check the board), but they absolutely want to be interrupted for blockers and completions.

### Why This Is Different

Most multi-agent frameworks either have:
- **No communication** — fire and forget, hope for the best
- **Too much communication** — every agent broadcasts everything, creating noise that makes the system harder to reason about

ACP introduces **graduated communication** — the right amount of signal at the right noise level for each situation. This is what makes the difference between a dysfunctional org (where nothing flows) and a high-performing one (where information flows efficiently).

---

## 1. Message Types

### 1.1 Acknowledgment (ACK)

**Direction:** Upward (assignee → delegator)  
**Trigger:** Agent receives a task assignment  
**Mechanism:** Reaction on the task (👍)  
**Latency:** Immediate (systems-level, no LLM required)

```
{ type: "ack", from: assigneeId, to: delegatorId, taskId, timestamp }
```

**Why a reaction, not a message:** Acks are confirmation signals, not conversation. A thumbs-up says "I got it, I'm on it" without creating noise. The delegator sees it landed and moves on.

**Platform representation:**
- Dashboard: 👍 indicator on task card
- API: Reaction event on task

---

### 1.2 Progress Updates

**Direction:** Written to task (agent → task activity log)  
**Trigger:** Meaningful state change during work  
**Mechanism:** Task activity log entry (pull-based)  
**Latency:** As work progresses

```
{ type: "progress", from: agentId, taskId, body: "Analysis complete, writing report...", pct: 60, timestamp }
```

**Why pull-based, not push:** Progress updates are informational, not actionable. The delegator checks when *they* want to — respecting the agent's autonomy to focus. This mirrors good management: check the board, don't tap shoulders.

**Platform representation:**
- Dashboard: Activity log in task detail panel
- API: Task activity entries (queryable)

**What counts as progress:**
- Phase transitions ("research done, starting implementation")
- Partial results ("found 3 of 5 required data sources")
- Estimated completion updates

**What does NOT go here:**
- Blockers (→ escalation)
- Questions (→ escalation)
- Completion (→ completion event)

---

### 1.3 Escalation

**Direction:** Upward (agent → delegator)  
**Trigger:** Agent cannot proceed autonomously  
**Mechanism:** Direct message + task status change to `BLOCKED`  
**Latency:** Immediate (this SHOULD be noisy)

```
{ type: "escalation", from: agentId, to: delegatorId, taskId, reason: EscalationReason, body: "...", timestamp }
```

**Escalation reasons:**

| Reason | Description | Example |
|--------|-------------|---------|
| `BLOCKED` | Needs resource/permission/input | "Need API key for external service" |
| `OUT_OF_DOMAIN` | Wrong expertise for this task | "This is a security task, not engineering" |
| `OVER_BUDGET` | Would exceed credit limit | "Estimated cost 500 credits, my limit is 200" |
| `LOW_CONFIDENCE` | Agent doesn't trust its own output | "My analysis might be wrong, needs expert review" |
| `TIMEOUT` | Task taking too long | "Exceeded expected completion time by 2x" |
| `DEPENDENCY` | Waiting on another task/agent | "Blocked by task #45 (assigned to Agent X)" |

**Escalation rules:**
1. **Always go to your delegator** — never skip levels
2. **Delegator decides next action:** reassign, handle themselves, or escalate further
3. **Escalation chains preserve context** — each level adds their assessment

**Delegator response options:**
- Reassign to different report
- Provide the missing resource/context and unblock
- Handle it themselves
- Escalate further up the chain
- Cancel the task

**Organizational intelligence emerges from escalation patterns:**

Escalations aren't failures — they're *information*. A team that never escalates might be silently failing. A team that escalates frequently might be understaffed, misassigned, or missing a key capability. The escalation rate per team becomes one of the most revealing health metrics in the system.

This creates a natural **pressure system**: problems don't silently disappear — they propagate upward with context until someone with the authority and capability resolves them. The speed at which this happens (escalation velocity) directly measures organizational responsiveness.

---

### 1.4 Completion

**Direction:** Upward (assignee → delegator)  
**Trigger:** Task finished  
**Mechanism:** Reaction (✅) + summary message  
**Latency:** Immediate

```
{ type: "completion", from: agentId, to: delegatorId, taskId, summary: "...", timestamp }
```

**Two-part signal:**
1. **✅ reaction on task** — instant visual confirmation
2. **Summary message** — brief description of what was done + link to task details

**Summary format:**
```
✅ Completed: [Task Title]
Result: [1-2 sentence summary]
→ View details: #task-123
```

**Why both:** The reaction is the signal (scannable in a list). The summary is the context (readable when you care). The full details live on the task itself (available when you need depth).

---

## 2. Lateral Communication

### 2.1 Handoff Requests

**Direction:** Lateral (agent → agent, via shared manager)  
**Trigger:** Task belongs to a different domain  

Agents don't message peers directly for task reassignment. Instead:
1. Agent escalates with reason `OUT_OF_DOMAIN`
2. Manager receives escalation
3. Manager re-delegates to the correct team/agent
4. Original agent is freed

**Why not direct:** Preserves chain of command. The manager has the context to make the best reassignment. Direct lateral handoffs create accountability gaps.

### 2.2 Peer Coordination (Future)

For cases where agents need to collaborate (not hand off):
- Shared task threads
- @mention in task activity
- Co-assignment

*This builds on the existing peer messaging feature (#107) but adds task-context awareness.*

---

## 3. Communication Flow Diagram

```
Human (L10+)
  │
  ├─ Creates task ──────────────► COO (L10)
  │                                 │
  │  ◄── ack (👍) ─────────────────┤
  │                                 │
  │                                 ├─ Delegates ────────► Lead (L7)
  │                                 │                        │
  │                                 │  ◄── ack (👍) ────────┤
  │                                 │                        │
  │                                 │                        ├─ Assigns ──► Worker (L4)
  │                                 │                        │                │
  │                                 │                        │  ◄── ack (👍)─┤
  │                                 │                        │                │
  │                                 │                        │    [progress → task log]
  │                                 │                        │                │
  │                                 │                        │  ◄── ✅ done ─┤
  │                                 │                        │                
  │                                 │  ◄── ✅ done ─────────┤
  │                                 │
  │  ◄── ✅ done ──────────────────┤
```

**Escalation flow:**
```
Worker: "I'm blocked — need API credentials"
  → BLOCKED escalation to Lead
    → Lead can't resolve
      → BLOCKED escalation to COO  
        → COO provides credentials
          → Unblock cascades back down
```

---

## 4. Implementation

### 4.1 Data Model

```typescript
interface AgentMessage {
  id: string;
  type: 'ack' | 'progress' | 'escalation' | 'completion' | 'delegation';
  from: string;        // agentId
  to: string;          // agentId (or taskId for progress)
  taskId: string;
  body?: string;       // Human-readable content
  reason?: EscalationReason;  // For escalations
  summary?: string;    // For completions
  pct?: number;        // For progress (0-100)
  timestamp: string;
}

type EscalationReason = 
  | 'BLOCKED' 
  | 'OUT_OF_DOMAIN' 
  | 'OVER_BUDGET' 
  | 'LOW_CONFIDENCE' 
  | 'TIMEOUT' 
  | 'DEPENDENCY';
```

### 4.2 Agent Decision Model

Each tick, the LLM decides an action. ACP extends the action space:

```typescript
type AgentAction =
  | { type: 'delegate', to: string, taskId: string }      // + generates delegation message
  | { type: 'work', taskId: string }                       // + may generate progress
  | { type: 'complete', taskId: string, summary: string }  // + generates completion message
  | { type: 'escalate', taskId: string, reason: string, body: string }  // + generates escalation
  | { type: 'idle' }                                       // no message
```

### 4.3 Message Generation

- **ACK:** Auto-generated (no LLM call) when task is assigned
- **Progress:** LLM writes a short update when working on a task
- **Escalation:** LLM decides to escalate + writes reason
- **Completion:** LLM writes summary of what was done
- **Delegation:** Auto-generated when agent delegates

### 4.4 Dashboard Integration

**Messages Tab (per agent):**
- Shows all messages where agent is `from` or `to`
- Grouped by conversation partner (parent + each direct report)
- Real-time via SSE from sandbox, or polling from API

**Task Detail Panel:**
- Activity log shows progress entries
- Reactions (👍, ✅) shown on task header
- Escalation history with full chain

---

## 5. Tunable Parameters

| Parameter | Description | Default | Effect |
|-----------|-------------|---------|--------|
| `escalationVelocity` | How quickly blockers propagate up | `immediate` | `immediate` / `batched` / `delayed` |
| `progressFrequency` | How often progress updates are written | `on_phase_change` | `every_tick` / `on_phase_change` / `on_request` |
| `ackRequired` | Whether ack is mandatory | `true` | Unacked tasks could trigger reminders |
| `maxEscalationDepth` | How many levels up before auto-cancel | `3` | Prevents infinite escalation chains |

### Modeling Organizational Culture

These parameters aren't just configuration — they define the *personality* of an organization. Different cultures communicate differently, and ACP can model all of them:

**Startup (move fast, break things):**
- Immediate escalation — blockers are existential threats when you're small
- Frequent progress updates — everyone's in the loop
- Flat hierarchy — 2-3 levels max
- *Feels like:* a 10-person team in a room, everyone overhears everything

**Enterprise (process and governance):**
- Batched escalation — problems get collected and reviewed in cycles
- Phase-change progress only — no one wants minute-by-minute updates across 500 agents
- Deep hierarchy — 5-8 levels, clear chain of command
- *Feels like:* a Fortune 500 with weekly status meetings

**Military (precision and accountability):**
- Mandatory ack with timeout — unacknowledged orders trigger alerts
- Every-tick progress — full situational awareness at all times
- Strict chain of command — never skip levels, ever
- *Feels like:* mission-critical operations where silence = danger

**Remote/Async (trust and autonomy):**
- Delayed escalation — give agents time to figure it out themselves
- On-request progress — manager pulls when curious, doesn't push for updates
- Loose hierarchy — agents can laterally coordinate
- *Feels like:* a distributed team across timezones, high trust, async-first

The ability to tune these parameters means BikiniBottom can simulate and optimize for any organizational style — or let users discover which communication culture produces the best outcomes for their specific workload.

---

## 6. Metrics & Organizational Intelligence

ACP generates data that reveals org health:

| Metric | What it shows |
|--------|--------------|
| **Ack latency** | How responsive agents are |
| **Escalation rate per team** | Which teams are struggling |
| **Escalation depth** | How far up problems travel (deeper = systemic) |
| **Completion-to-delegation ratio** | Which managers do vs delegate |
| **Progress update frequency** | Agent engagement level |
| **Lateral handoff rate** | Task routing accuracy |
| **Time-to-unblock** | How fast the org resolves blockers |

### Why This Matters

In human organizations, these metrics are collected through surveys, 1-on-1s, and retrospectives — subjective, infrequent, and expensive. In an ACP-powered agent org, they're generated automatically from every interaction. You get a real-time organizational health dashboard for free.

More importantly, these metrics enable **automated org optimization**: the system can detect that Engineering's escalation rate spiked, correlate it with a recent task routing change, and suggest (or automatically execute) a rebalancing — reassigning agents, adjusting delegation strategies, or spawning additional capacity. This is organizational intelligence that emerges from the protocol itself, not from manual oversight.

---

## 7. Future Extensions

- **Communication styles per agent** — verbose reporters vs terse ack-ers
- **Message priority levels** — urgent escalations get push notifications
- **Summarization** — managers get daily digests instead of individual messages
- **Cross-org messaging** — agents in different OpenSpawn orgs coordinating
- **Human-in-the-loop** — escalations can route to actual humans via webhooks

---

## 8. Relationship to A2A (Agent-to-Agent Protocol)

Google's [A2A protocol](https://a2a-protocol.org) is an open standard for inter-agent communication. ACP and A2A solve different problems and are designed to be complementary.

### Comparison

| Dimension | ACP | A2A |
|-----------|-----|-----|
| **Scope** | Intra-org (agents within one system) | Inter-org (agents across vendors/companies) |
| **Trust model** | Known agents, shared state, trust scores | Zero-trust, opaque agents |
| **Discovery** | Org chart / hierarchy (`parentId`) | Agent Cards (JSON metadata with capabilities) |
| **Transport** | Internal events, SSE | JSON-RPC 2.0, gRPC, REST |
| **Task model** | Stateful with lifecycle | Stateful with lifecycle (similar) |
| **Streaming** | SSE | SSE (similar) |
| **Message types** | Typed (ack, progress, escalation, completion) | Generic messages with Parts (text, files, data) |
| **Hierarchy** | First-class (parent/child, levels, chain of command) | Flat (peer-to-peer) |

### Analogy

- **ACP = Slack** — internal team communication. You know everyone, context is shared, messages are typed and structured for your workflow.
- **A2A = Email** — cross-company communication. Agents discover each other via cards, communicate formally, and don't share internal state.

### Integration Architecture

```
┌─────────────────────────────────────────┐
│           BikiniBottom Org              │
│                                         │
│  COO ──ACP──► Lead ──ACP──► Worker     │
│   │                                     │
│   │  (internal: ACP messages,           │
│   │   shared state, trust scores)       │
│                                         │
│   ▼                                     │
│  A2A Gateway                            │
│   │  (translates ACP ↔ A2A at          │
│   │   org boundaries)                   │
└───┼─────────────────────────────────────┘
    │
    │ A2A (JSON-RPC, Agent Cards)
    ▼
┌───────────────────┐  ┌──────────────────┐
│ External Agent A  │  │ External Agent B  │
│ (LangGraph)       │  │ (CrewAI)         │
└───────────────────┘  └──────────────────┘
```

### Bridging ACP ↔ A2A

An A2A Gateway at the org boundary would:

1. **Inbound (A2A → ACP):** External agent sends A2A `SendMessage` → Gateway creates an ACP delegation message to the appropriate internal agent based on skill/domain matching.
2. **Outbound (ACP → A2A):** Internal agent escalates with `OUT_OF_DOMAIN` and no internal agent can handle it → Gateway discovers external agents via Agent Cards and sends A2A request.
3. **Status mapping:** ACP completion/escalation → A2A task status updates. ACP progress → A2A streaming messages.

### Key Differences in Philosophy

**A2A assumes opacity:** Agents don't share internals. This is correct for cross-org — you don't want to expose your agent's memory or tools to a vendor's agent.

**ACP assumes transparency:** Agents within an org benefit from shared context — trust scores, task history, domain knowledge. Opacity within your own org creates the same silos that make human orgs dysfunctional.

**Together they cover the full spectrum:** Transparent internally (ACP), opaque externally (A2A). This mirrors how human organizations actually work — open internally, formal externally.

### Future: ACP as an A2A Extension

A2A supports an Extension mechanism for additional functionality. ACP message types could be formalized as an A2A extension, allowing A2A-compatible agents to opt into richer intra-org communication when both parties support it:

```
AgentCard:
  extensions:
    - uri: "urn:bikinibottom:acp:v1"
      config:
        supportsAck: true
        supportsProgress: true
        supportsEscalation: true
```

This would let frameworks gradually adopt ACP semantics within A2A, creating a smooth migration path from flat peer communication to hierarchical org communication.

---

*ACP is designed to be framework-agnostic. Any agent system with a hierarchy can implement ACP — it's a communication standard, not a BikiniBottom-specific feature. Combined with A2A at org boundaries, it provides a complete communication stack for the agentic ecosystem.*
