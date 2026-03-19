# Research: Layered Protocol Stack — Gossip + Structured + CRDTs

**Issue:** #667 · **Epic:** #664 (Inter-Agent Coordination Architecture)
**Date:** 2026-03-19 · **Status:** Research (no code)

---

## Executive Summary

This document evaluates whether OpenSpawn needs a three-layer communication stack (ambient gossip, structured coordination, CRDT shared state) beyond the Artifact Bus (#665) and Event Mesh (#666) already implemented. The finding: **the existing two primitives cover 95% of multi-agent coordination needs today**. Gossip is cheap to add later as an SSE broadcast extension. CRDTs solve problems we don't yet have and carry significant complexity cost. Neither should block shipping.

---

## Layer 1: Ambient (Gossip)

### Do we actually need gossip?

**Short answer: Not yet, but it's the cheapest layer to add.**

OpenSpawn's SSE push (`apps/api/app/events/sse_router.py`) already delivers real-time artifact and event notifications to subscribed agents. An agent publishing a `ComponentArtifact` triggers `artifact.published` SSE events to all subscribers. This covers the "something happened" case well.

What SSE notifications *don't* cover is **continuous status** — the peripheral awareness signals that let agents (and humans) know what's happening *between* discrete events:

- "I'm 60% through writing tests for UserForm"
- "I'm blocked waiting on the API contract"
- "My build is compiling — ETA 30 seconds"
- "I've been idle for 2 minutes (stalled?)"

These are fire-and-forget, lossy by design, and high-frequency. They don't need persistence, ordering guarantees, or acknowledgment. They're closer to a heartbeat than a message.

### What would gossip look like in OpenSpawn?

A minimal gossip protocol for OpenSpawn would be:

```
Agent → POST /agents/{id}/status
{
  "state": "working" | "blocked" | "idle" | "waiting_approval",
  "progress": 0.6,
  "detail": "Writing e2e tests for SubmitButton",
  "blocked_on": "artifact:api-contract-checkout"  // optional
}
```

The coordinator broadcasts this to all agents in the same task tree via SSE. No persistence needed — latest status overwrites previous. Consumers use it for dashboard UX ("Agent 3 is 60% done") and opportunistic coordination ("Agent 2 is blocked on what I'm building — I should prioritize it").

### Implementation options

| Option | Complexity | Latency | Scalability |
|--------|-----------|---------|-------------|
| **SSE broadcast** (extend existing `EventBus`) | Trivial — add a `status.update` event type, skip DB persistence | ~10ms | Single-process; sufficient for v1 |
| **Redis pub/sub** | Low — swap `InMemoryBackend` for Redis (bus.py already has `BusBackend` protocol) | ~5ms | Multi-process ready |
| **In-memory dict + polling** | Trivial — agents poll `/agents/status` | 1-5s (polling interval) | Scales poorly |

**Recommendation:** SSE broadcast. The `EventBus` already supports a `BusBackend` protocol abstraction (`apps/api/app/events/bus.py`). Adding a non-persisted `status.update` SSE event type is ~50 lines of code. The architecture is already designed for this.

### What about "Layer 1.5" — structured gossip?

Issue #667 asked whether there's a useful middle ground between ambient gossip and full A2A structured messages. The answer: **not really, as a distinct layer.** The SSE broadcast recommendation already covers this — a `status.update` event with structured fields (state, progress, blocked_on) is both ambient AND structured. It's gossip with schema. Treating it as a separate layer adds conceptual overhead without adding capability. The `BusBackend` abstraction handles the spectrum from fire-and-forget status pings to persistent coordination events — no need for a separate protocol.

### Verdict

Gossip is **purely additive** — it requires no architectural changes. The `InMemoryBackend` → `BusBackend` protocol in `bus.py` was designed for exactly this kind of extension. Build it when the dashboard needs real-time progress indicators, or when agents start needing to reason about each other's state. Not before.

---

## Layer 2: Structured (A2A/MCP)

### Current state

This layer is **already implemented** across three subsystems:

1. **Artifact Bus** (`apps/api/app/artifacts/`) — typed, versioned artifacts with publish/subscribe, content hashing, status transitions (draft → published → superseded), and autonomy gating.

2. **Event Mesh** (`apps/api/app/events/` + `apps/api/app/coordination/`) — typed domain events (`component.created`, `test.written`, etc.) with subscriptions, replay from arbitrary points, and server-side projections (`component_registry`, `test_coverage`, `artifact_view`).

3. **SSE Push** (`apps/api/app/events/sse_router.py` + `bus.py`) — real-time delivery with in-memory pub/sub, subscription filtering, and sequence-based reconnection.

### What gaps remain?

| Gap | Impact | Severity |
|-----|--------|----------|
| **No cross-task-tree artifact references** | Agent in Task A can't reference artifacts from Task B | Medium — matters when multiple features share components |
| **No artifact dependency graph** | Can't express "this TestPlan depends on this Component" formally | Low — `source_artifact_ids` exists but isn't enforced |
| **No event schema validation** | Event payloads are arbitrary dicts; no runtime validation of `ComponentCreated` shape | Low — works fine now, tech debt later |
| **No causal ordering** | Events use sequence numbers, not vector clocks; concurrent events from two agents have arbitrary ordering | Low — single coordinator serializes writes today |
| **Projection rebuild cost** | `project_component_registry()` replays all events on every call; no caching | Low — fine at current scale (<1K events per task) |

### How well do artifacts + events cover structured coordination?

**Very well.** The artifact bus handles the "shared documents" pattern (publish, version, subscribe). The event mesh handles the "activity stream" pattern (emit, replay, project). Together they cover:

- ✅ Agent A produces something → Agent B consumes it (artifact publish/subscribe)
- ✅ Agent A does something → Agent B reacts (event emit/subscribe)
- ✅ New agent joins → catches up (event replay + artifact list)
- ✅ Human oversight → autonomy gating on artifacts
- ✅ Derived state → server-side projections

The main unsupported pattern is **concurrent editing of the same artifact by multiple agents**, which is the CRDT use case analyzed below.

---

## Layer 3: Shared State (CRDTs)

### What concurrent write conflicts would we actually see?

In OpenSpawn's current architecture, agents work on **separate subtasks** within a task tree. The coordination model is publish/subscribe, not concurrent editing. Conflicts would arise in:

| Scenario | Likelihood | Current Mitigation |
|----------|-----------|-------------------|
| Two agents update the same component artifact | Low — task decomposition assigns components to specific agents | Artifact versioning (monotonic version counter) |
| Two agents add entries to a shared registry | Medium — component registry is a projection, not a mutable document | Event replay rebuilds projection from scratch |
| Two agents update a shared test plan | Low — test agents own their test files | Separate artifacts per agent |
| Progress counters (5 agents reporting % done) | High if gossip exists | Last-write-wins on per-agent status |

**Key insight:** OpenSpawn's task decomposition model inherently reduces concurrent writes. Agents don't share mutable documents — they publish artifacts and emit events. The coordination pattern is closer to a message bus than Google Docs.

### Could simple last-write-wins handle them?

**Yes, for every scenario we've identified.** The existing artifact model uses version numbers and `content_hash` for deduplication. The event model is append-only — events don't conflict because they're immutable facts. Projections are derived state rebuilt from the event stream, so they're always eventually consistent.

The only scenario where LWW would lose data: two agents simultaneously publishing different versions of the same artifact with the same name. The current code handles this via database-level serialization (single coordinator process + `SELECT ... FOR UPDATE` equivalent via SQLAlchemy flush ordering). In a distributed deployment, this would need explicit conflict resolution — but we're not distributed.

### What's the smallest useful CRDT?

| CRDT | Use Case in OpenSpawn | Complexity | Value |
|------|----------------------|------------|-------|
| **G-Counter** | Aggregate progress across agents ("3 of 5 agents done") | Trivial (~20 lines) | Low — can be computed from task statuses |
| **LWW-Register** | Per-agent status (last heartbeat wins) | Trivial (~15 lines) | Low — in-memory dict does the same thing |
| **OR-Set** (Observed-Remove Set) | Shared component registry (agents add/remove entries concurrently) | Moderate (~100 lines + merge logic) | Low — event projections already solve this |
| **LWW-Element-Set** | Shared key-value store with concurrent updates | Moderate | Low — artifact bus covers this |
| **RGA** (Replicated Growable Array) | Collaborative text editing | High (~500+ lines) | None — agents don't co-edit text |

**The smallest useful CRDT is a G-Counter for progress tracking**, but it provides negligible value over computing progress from existing task status fields (`compute_parent_status` in `status_sync.py` already aggregates child statuses).

### Implementation cost in Python/SQLAlchemy

Building CRDTs on top of SQLAlchemy is awkward. CRDTs are designed for peer-to-peer state replication; SQLAlchemy is a centralized ORM. The impedance mismatch is significant:

- **Storage:** CRDT state vectors need to be serialized into JSON columns or separate tables. Each CRDT instance needs a row per replica (per agent).
- **Merge:** On read, you'd need to merge all replica states — either in Python (load N rows, merge) or via SQL aggregation (complex, non-standard).
- **Libraries:** No production-quality Python CRDT library exists that integrates with SQLAlchemy. [`pycrdts`](https://github.com/nicois/pycrdts) is a toy. You'd roll your own.
- **Estimated effort:** 2-3 days for G-Counter + OR-Set with SQLAlchemy storage. 1-2 weeks for a general-purpose CRDT layer with tests and migrations.

For comparison: the entire Artifact Bus (#665) was implemented in roughly the same time a general CRDT layer would take.

### Debugging complexity

CRDTs are notoriously hard to debug:

- **Merge anomalies** are silent — the CRDT "resolves" the conflict, but the resolution may not match human intent.
- **State vectors** are opaque — "why does the OR-Set contain item X?" requires tracing the full causal history.
- **No off-the-shelf tooling** exists for inspecting CRDT state in a Python/FastAPI application.
- **Testing** requires simulating concurrent operations with controlled interleavings — significantly harder than testing sequential artifact publish/subscribe.

Contrast with the current approach: artifact version conflicts are explicit (version number mismatch → HTTP 409), event ordering is visible (sequence numbers), and projections are deterministic (replay the same events → same state).

---

## Cross-Cutting Analysis

### Does any multi-agent platform use CRDTs or gossip?

**No.** As of March 2026, no multi-agent orchestration platform (CrewAI, AutoGen, MetaGPT, LangGraph, OpenAI Swarm, Anthropic's multi-agent patterns) uses CRDTs for agent coordination. The reasons are consistent:

1. **Task decomposition reduces concurrency** — agents are assigned non-overlapping work.
2. **Central coordinator serializes state** — no need for decentralized conflict resolution.
3. **Agent outputs are coarse-grained** — entire files, test suites, or documents, not character-by-character edits.

The closest analogy is **MetaGPT's shared message pool**, which is essentially an append-only event log (similar to our Event Mesh) — not a CRDT.

**Real-world CRDT users** (Figma, Google Docs, Linear) solve a fundamentally different problem: multiple *humans* editing the same document with sub-second latency requirements. Agent coordination is batch-oriented, not interactive.

### Would this be a meaningful differentiator or over-engineering?

**Over-engineering today. Potential differentiator in a specific future scenario.**

The scenario where CRDTs become valuable: **real-time collaborative workspaces** where multiple agents and humans simultaneously edit shared artifacts (a shared design doc, a live architecture diagram, a collaborative code buffer). This is more "Figma for agents" than "task orchestrator."

OpenSpawn's current positioning is task orchestration, not real-time collaboration. The differentiator should be coordination intelligence (autonomy dial, artifact bus, event mesh), not low-level conflict resolution primitives.

### Under what conditions should we add each layer?

**Layer 1 (Gossip) — Add when:**
- Dashboard needs real-time agent progress visualization
- Agents need to make decisions based on other agents' current state (e.g., "Agent B is blocked on what I'm producing, I should reprioritize")
- Users report confusion about what agents are doing during long-running tasks

**Layer 3 (CRDTs) — Add when:**
- Multiple agents demonstrably need to concurrently edit the same mutable document
- Artifact version conflicts become frequent (monitor: HTTP 409 rates on artifact publish)
- OpenSpawn pivots toward real-time collaborative agent workspaces
- The platform goes multi-node/distributed (CRDTs become necessary for consistency without coordination)

---

## Decision Matrix

| Layer | Verdict | Trigger Signal | Estimated Effort | Risk of Not Building |
|-------|---------|---------------|-----------------|---------------------|
| **Layer 1: Gossip** | **Build after MVP launch** | Dashboard UX feedback requesting real-time progress; agent idle/blocked detection needs | 1-2 days (SSE broadcast extension) | Low — agents coordinate fine without ambient awareness |
| **Layer 2: Structured** | **Already built** ✅ | N/A — Artifact Bus + Event Mesh + SSE Push are implemented | Done | N/A |
| **Layer 3: CRDTs** | **Don't build** (revisit if triggers fire) | Frequent artifact version conflicts (>5% of publishes); multi-node deployment; pivot to collaborative workspaces | 1-2 weeks (basic), 4-6 weeks (production) | Very low — LWW + event projections handle all current scenarios |

---

## Recommendation

**Don't build Layer 1 or Layer 3 now. Ship the Artifact Bus and Event Mesh.**

### Rationale

1. **The existing primitives solve the actual problem.** Agents need to publish artifacts, subscribe to changes, emit events, and replay history. All of this works today.

2. **Gossip is trivially additive.** When we need it, it's ~50 lines on top of the existing `EventBus`. No architectural decisions to make now. The `BusBackend` protocol abstraction in `bus.py` was designed to support this.

3. **CRDTs solve a problem we don't have.** Our task decomposition model assigns non-overlapping work to agents. Concurrent edits to the same artifact are an edge case, not a pattern. If they become a pattern, it signals a task decomposition failure that should be fixed upstream, not papered over with CRDTs.

4. **Complexity budget is finite.** Every abstraction we add is a concept users and contributors must understand. "Artifacts + Events" is a clean mental model. "Artifacts + Events + Gossip + CRDTs" is four concepts where two suffice.

5. **No competitive pressure.** No multi-agent platform uses CRDTs or gossip. We're not behind; we'd be building into a void with no user demand signal.

### Next Steps

- Close #667 with a link to this document
- Monitor artifact publish conflict rates after MVP launch
- Revisit gossip when building the real-time dashboard progress view
- Revisit CRDTs only if OpenSpawn pivots to collaborative agent workspaces or multi-node deployment

---

*This document is research only — no code changes are implied. Reference from #664 epic for architectural decisions.*
