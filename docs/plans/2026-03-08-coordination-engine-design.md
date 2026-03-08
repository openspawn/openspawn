# Coordination Engine Design

**Issue:** #593
**Status:** Approved
**Date:** 2026-03-08

## Goal

Add task routing, escalation, and delegation to the FastAPI backend so tasks flow through the agent hierarchy automatically instead of being manually assigned.

## Architecture

Four components, all in `apps/api/app/coordination/`:

1. **Task Router** — synchronous, called at task creation
2. **SLA Monitor** — arq cron job, polls every 60s
3. **Escalation Handler** — called by SLA Monitor when thresholds breached
4. **Parent Task Status Sync** — event-driven, updates parent when subtask changes

```
Task Created
    |
    v
[Task Router] -- match capabilities --> assign to best agent
    |
    v
Task In Progress
    |
    v
[SLA Monitor] -- cron 60s --> check deadlines
    |                              |
    |                    breach -> [Escalation Handler]
    |                              |
    |                    escalate to parent agent
    |                    or reassign to peer
    v
Subtask Completed
    |
    v
[Parent Task Status Sync] -- all children done? --> complete parent
```

## Component Details

### 1. Task Router (`router.py`)

Synchronous function called when a task is created with no assignee.

**Algorithm:**
1. Parse task `required_capabilities` (new field on Task)
2. Query agents with matching capabilities (`AgentCapability` table)
3. Score candidates: `proficiency * availability_weight`
   - `availability_weight` = inverse of current active task count
4. Assign to highest-scoring agent
5. If no match found, assign to org's default coordinator agent

**Key decisions:**
- Capability matching first (not LLM-based) — deterministic, fast, testable
- No queue — direct assignment on creation
- Fallback to coordinator prevents orphaned tasks

### 2. SLA Monitor (`sla_monitor.py`)

arq cron job running every 60 seconds.

**Algorithm:**
1. Query tasks where `status = 'in_progress'` and `deadline IS NOT NULL`
2. For each task, check two thresholds:
   - **Warning**: 80% of deadline elapsed → emit `task.sla.warning` event
   - **Breach**: 100% of deadline elapsed → call Escalation Handler
3. Track `sla_warning_sent_at` to avoid duplicate warnings

**Key decisions:**
- Time-based + event-based escalation (SLA thresholds on deadline)
- Configurable thresholds via `SLA_WARNING_PCT` and `SLA_BREACH_PCT` env vars (default 80%, 100%)
- 60s poll interval balances responsiveness vs. DB load

### 3. Escalation Handler (`escalation.py`)

Called by SLA Monitor when a task breaches its SLA.

**Algorithm:**
1. Look up current assignee's `parent_agent_id`
2. If parent exists:
   - Reassign task to parent agent
   - Emit `task.escalated` event with reason
   - Create system message in task channel
3. If no parent (top-level agent):
   - Emit `task.escalation.unresolvable` event
   - Mark task with `needs_attention` flag

**Key decisions:**
- Semi-automatic: system escalates, but doesn't decompose or re-plan (no LLM in loop yet)
- Escalation follows existing `parent_agent_id` hierarchy — no new relationship model needed
- Future: LLM-based re-planning as opt-in upgrade path

### 4. Parent Task Status Sync (`status_sync.py`)

Event-driven, triggered when any subtask changes status.

**Algorithm:**
1. On subtask status change, look up parent task via `TaskDependency`
2. Query all sibling subtasks
3. If all siblings `completed` → mark parent `completed`
4. If any sibling `failed` → mark parent `blocked`
5. Emit `task.parent.status_synced` event

**Key decisions:**
- Uses existing `TaskDependency` table (no new parent_task_id column needed)
- Only syncs upward (parent reflects children), never downward
- `blocked` on failure lets coordinator decide next steps

## Data Model Changes

### New columns on `Task`:

```python
required_capabilities: list[str]  # e.g. ["code_review", "python"]
deadline: datetime | None         # UTC, nullable
sla_warning_sent_at: datetime | None  # prevents duplicate warnings
needs_attention: bool             # set when escalation has no parent
```

### New columns on `Agent`:

None — existing `parent_agent_id` and `AgentCapability` table sufficient.

## API Changes

### Modified endpoints:

- `POST /tasks` — accepts `required_capabilities` and `deadline`; auto-routes if no `assignee_id`
- `PATCH /tasks/{id}` — triggers Parent Task Status Sync on status change

### New endpoints:

- `GET /tasks/{id}/escalation-history` — returns escalation events for a task
- `POST /tasks/{id}/escalate` — manual escalation trigger (for dashboard button)

## Events

| Event | Payload | When |
|-------|---------|------|
| `task.routed` | `{task_id, agent_id, score}` | Router assigns task |
| `task.sla.warning` | `{task_id, deadline, elapsed_pct}` | 80% threshold |
| `task.escalated` | `{task_id, from_agent, to_agent, reason}` | SLA breach escalation |
| `task.escalation.unresolvable` | `{task_id, agent_id}` | No parent to escalate to |
| `task.parent.status_synced` | `{parent_id, new_status, children}` | Parent status updated |

## Testing Strategy

- **Unit tests**: Each component isolated with mocked DB queries
- **Integration tests**: Full flow from task creation → routing → SLA breach → escalation
- **Load test**: 1000 tasks with various deadlines, verify SLA monitor handles volume

## Decisions Log

| # | Decision | Chosen | Alternatives | Rationale |
|---|----------|--------|-------------|-----------|
| 1 | Routing mechanism | Capability matching | LLM-based, round-robin, manual | Deterministic, fast, testable; LLM option later |
| 2 | Escalation trigger | Time + event (SLA thresholds) | Time-only, event-only, manual | Covers both slow tasks and deadline-critical work |
| 3 | Delegation style | Semi-automatic (system routes/escalates) | Fully manual, fully autonomous (LLM) | Predictable now; LLM opt-in upgrade path preserved |
| 4 | Parent status sync | Event-driven via TaskDependency | Polling, new parent_task_id column | Uses existing schema; real-time updates |
| 5 | SLA monitor | arq cron (60s) | Celery beat, APScheduler, pg_cron | Already using arq; consistent with existing jobs |
