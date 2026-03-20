# Architecture Decision: Inter-Agent Coordination (#664)

**Epic:** #664 · **Date:** 2026-03-19 · **Status:** Decided

---

## Decision

OpenSpawn's inter-agent coordination uses **two complementary primitives** — the Artifact Bus and Event Mesh — layered on SSE real-time push, with a configurable autonomy dial (0-10) gating human oversight at each coordination point.

CRDTs and gossip protocols were evaluated and deferred (see [layered-protocol-stack.md](layered-protocol-stack.md)).

---

## What Was Built

| Subsystem | Issue | Purpose |
|-----------|-------|---------|
| **SSE Real-Time Push** | #670 | Server→client notifications via `EventSourceResponse`, zero new deps |
| **Artifact Bus** | #665 | Typed, versioned, subscribable artifacts as coordination medium |
| **Event Mesh** | #666 | Typed domain events with subscriptions, replay, and server-side projections |
| **Autonomy Dial** | #668 | Per-task autonomy level (0-10) gating artifact publish, task transitions, escalations |
| **Cooperative Ideation** | #669 | Multi-agent brainstorming: propose → review → synthesize → approve |
| **Layered Protocol Research** | #667 | Evaluated gossip + CRDTs — deferred both |

---

## Why These Primitives

### Artifact Bus (objects) + Event Mesh (actions) = complete coordination

The two primitives cover complementary patterns:

| Pattern | Primitive |
|---------|-----------|
| Agent A produces something → Agent B consumes it | Artifact publish/subscribe |
| Agent A does something → Agent B reacts | Event emit/subscribe |
| New agent joins → catches up | Event replay + artifact list |
| Human oversight at coordination points | Autonomy dial gates artifact publish + task transitions |
| Derived state (component registry, test coverage) | Event projections |

### Why not just one?

Artifacts alone lack activity semantics ("what happened"). Events alone lack object semantics ("what's the current state of X"). Together they model both the nouns and verbs of multi-agent coordination.

### Why not CRDTs or gossip?

- **CRDTs** solve concurrent editing — but OpenSpawn's task decomposition assigns non-overlapping work. Agents publish artifacts and emit events; they don't co-edit documents. See [layered-protocol-stack.md](layered-protocol-stack.md).
- **Gossip** (ambient status) is trivially additive later (~50 lines on existing `EventBus`). Deferred until dashboard needs real-time progress indicators.
- **No multi-agent platform** uses CRDTs or gossip as of March 2026.

---

## Key Implementation Details

### Artifact Bus (`apps/api/app/artifacts/`)
- SQLAlchemy model with type, name, version (monotonic), content (JSONB), content_hash (dedup)
- Status lifecycle: draft → published → superseded
- Subscriptions by artifact_type (with wildcard), scoped to task or org
- SSE notifications on publish via `EventBus`

### Event Mesh (`apps/api/app/events/` + `apps/api/app/coordination/`)
- Typed domain events: `component.created`, `test.written`, `doc.section.written`, etc.
- Pattern-based subscriptions (e.g., `component.*`, `*`)
- Replay from arbitrary sequence numbers (late-joining agents)
- Server-side projections: `component_registry`, `test_coverage`, `artifact_view`

### Autonomy Dial (`apps/api/app/approvals/`)
- Per-task `autonomy_level` (0-10) with per-agent `default_autonomy_level`
- Gates artifact publish, task transitions, and escalations based on risk vs. autonomy
- `ApprovalRequest` model for gated actions awaiting human/manager approval

### SSE Push (`apps/api/app/events/sse_router.py` + `bus.py`)
- `BusBackend` protocol abstraction (in-memory now, Redis later)
- Subscription filtering, sequence-based reconnection
- Non-persisted events supported (future gossip/status layer)

---

## Trade-offs Accepted

| Trade-off | Rationale |
|-----------|-----------|
| No causal ordering (sequence numbers, not vector clocks) | Single coordinator serializes writes; revisit if distributed |
| Projections rebuilt on every call (no caching) | Fine at <1K events/task; #710 tracks caching |
| Event payloads are unvalidated dicts | Works now; #709 tracks schema validation |
| No cross-task-tree artifact references | Task decomposition keeps artifacts scoped; revisit if needed |

---

## Verification

- **E2E test** (`test_coordination_full_e2e.py`): 3-agent flow — dev publishes component with testids → test agent subscribes/consumes/publishes test artifact → docs agent publishes doc section → projections verified
- **Ideation test** (`test_ideation.py`): Full 3-round ideation cycle with round advancement, duplicate prevention, auth gating
- **No new external dependencies**: SQLite (Tier 1) / PostgreSQL (Tier 2) + FastAPI + SQLAlchemy only

---

## Open Items (tracked)

| Item | Issue |
|------|-------|
| Event schema validation | #709 |
| Projection caching | #710 |
| Autonomy dial Phase 3 (policies + auto-expiry) | #691 |
| Ideation synthesis algorithm | Follow-up from #669 |
| Ideation plan-to-execution pipeline | Follow-up from #669 |
| Dashboard ideation view | Follow-up from #669 |
