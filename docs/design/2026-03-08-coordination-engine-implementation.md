# Coordination Engine Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add task routing, SLA monitoring, automatic escalation, and parent task status sync to the FastAPI backend.

**Architecture:** Four coordination components (`app/coordination/`) wired into existing task CRUD. Task Router runs synchronously on task creation. SLA Monitor is an arq cron job (60s). Escalation Handler is called by SLA Monitor. Status Sync is called after status transitions.

**Tech Stack:** FastAPI, SQLAlchemy async, arq (cron), PostgreSQL, pytest + httpx

**Design doc:** `docs/plans/2026-03-08-coordination-engine-design.md`

---

## Context for Implementer

### Existing code you need to know:

- **Task model**: `apps/api/app/models/task.py` — already has `parent_task_id`, `subtasks` relationship, `due_date`
- **Agent model**: `apps/api/app/models/agent.py` — has `parent_id`, `capabilities` (AgentCapability list)
- **AgentCapability model**: `apps/api/app/models/agent.py:88-111` — has `capability` (str) and `proficiency` (Proficiency enum: BASIC/STANDARD/EXPERT)
- **Escalation model**: `apps/api/app/models/escalation.py` — already exists, has `from_agent_id`, `to_agent_id`, `reason`, `is_automatic`
- **Event model**: `apps/api/app/models/event.py` — append-only audit log with `type`, `actor_id`, `entity_type`, `entity_id`, `data` (JSONB)
- **Task router (HTTP)**: `apps/api/app/tasks/router.py` — has `create_task`, `transition_task`, existing manual `escalate_task`
- **Task schemas**: `apps/api/app/tasks/schemas.py` — `CreateTaskDto`, `TaskResponse`
- **Enums**: `apps/api/app/models/enums.py` — `TaskStatus`, `Proficiency`, `EscalationReason`
- **Worker pattern**: `apps/api/app/workers/enrichment.py` — arq `WorkerSettings` with `functions` + `cron_jobs`
- **Config**: `apps/api/app/config.py` — pydantic `Settings` class
- **DB session**: `apps/api/app/database.py` — `async_session` (for workers), `get_db` (for routes)

### Enums already available:

- `TaskStatus`: BACKLOG, TODO, IN_PROGRESS, REVIEW, DONE, BLOCKED, CANCELLED
- `Proficiency`: BASIC, STANDARD, EXPERT
- `EscalationReason`: BLOCKED_TIMEOUT, STALE_TASK, SLA_BREACH, ASSIGNEE_INACTIVE, QUALITY_ISSUES, MANUAL, CAPACITY_OVERFLOW
- `AgentStatus`: PENDING, ACTIVE, SUSPENDED, REVOKED

### Test pattern:

- Tests in `apps/api/tests/`
- `conftest.py` provides `client` fixture (httpx AsyncClient with ASGITransport)
- Auth smoke tests check 401; unit tests mock DB
- Run: `cd apps/api && uv run pytest tests/ -v`
- Lint: `cd apps/api && uv run ruff check --fix . && uv run ruff format .`

---

## Task 1: Alembic migration — add coordination columns to tasks

**Files:**

- Create: `apps/api/alembic/versions/0004_add_coordination_columns.py`

**Step 1: Write the migration**

```python
"""add coordination columns to tasks table

Revision ID: 0004
Revises: 0003
Create Date: 2026-03-08
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "tasks",
        sa.Column(
            "required_capabilities",
            postgresql.JSONB,
            nullable=False,
            server_default="[]",
        ),
    )
    op.add_column(
        "tasks",
        sa.Column("sla_warning_sent_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "tasks",
        sa.Column("needs_attention", sa.Boolean, nullable=False, server_default="false"),
    )
    # Index for SLA monitor query: status + due_date
    op.create_index(
        "ix_tasks_status_due_date",
        "tasks",
        ["status", "due_date"],
        postgresql_where=sa.text("due_date IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("ix_tasks_status_due_date", table_name="tasks")
    op.drop_column("tasks", "needs_attention")
    op.drop_column("tasks", "sla_warning_sent_at")
    op.drop_column("tasks", "required_capabilities")
```

**Step 2: Verify migration file is valid**

Run: `cd apps/api && uv run alembic heads`
Expected: Shows `0004` as head

**Step 3: Commit**

```bash
git add apps/api/alembic/versions/0004_add_coordination_columns.py
git commit -m "feat(api): add coordination columns migration

required_capabilities, sla_warning_sent_at, needs_attention on tasks"
```

---

## Task 2: Update Task model with new columns

**Files:**

- Modify: `apps/api/app/models/task.py:14-52`

**Step 1: Write failing test**

Create `apps/api/tests/test_coordination_models.py`:

```python
"""Tests for coordination-related model columns on Task."""

import uuid

from app.models.enums import TaskStatus
from app.models.task import Task


def test_task_has_required_capabilities_field() -> None:
    task = Task(
        org_id=uuid.uuid4(),
        identifier="TSK-1",
        title="Test",
        creator_id=uuid.uuid4(),
        required_capabilities=["python", "code_review"],
    )
    assert task.required_capabilities == ["python", "code_review"]


def test_task_required_capabilities_defaults_to_empty_list() -> None:
    task = Task(
        org_id=uuid.uuid4(),
        identifier="TSK-2",
        title="Test",
        creator_id=uuid.uuid4(),
    )
    # server_default handles DB-level; Python-level should also work
    assert task.required_capabilities is None or task.required_capabilities == []


def test_task_has_sla_warning_sent_at_field() -> None:
    task = Task(
        org_id=uuid.uuid4(),
        identifier="TSK-3",
        title="Test",
        creator_id=uuid.uuid4(),
    )
    assert task.sla_warning_sent_at is None


def test_task_has_needs_attention_field() -> None:
    task = Task(
        org_id=uuid.uuid4(),
        identifier="TSK-4",
        title="Test",
        creator_id=uuid.uuid4(),
    )
    assert task.needs_attention is not None
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && uv run pytest tests/test_coordination_models.py -v`
Expected: FAIL — `Task` has no `required_capabilities` attribute

**Step 3: Add columns to Task model**

In `apps/api/app/models/task.py`, add these columns after `deleted_at` (line 52):

```python
required_capabilities: Mapped[list] = mapped_column(
    JSONB, nullable=False, server_default="[]"
)
sla_warning_sent_at: Mapped[datetime | None] = mapped_column(nullable=True)
needs_attention: Mapped[bool] = mapped_column(nullable=False, server_default="false")
```

**Step 4: Run test to verify it passes**

Run: `cd apps/api && uv run pytest tests/test_coordination_models.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/app/models/task.py apps/api/tests/test_coordination_models.py
git commit -m "feat(api): add coordination columns to Task model

required_capabilities, sla_warning_sent_at, needs_attention"
```

---

## Task 3: Update schemas — CreateTaskDto and TaskResponse

**Files:**

- Modify: `apps/api/app/tasks/schemas.py:20-29` (CreateTaskDto)
- Modify: `apps/api/app/tasks/schemas.py:79-99` (TaskResponse)

**Step 1: Write failing test**

Add to `apps/api/tests/test_coordination_models.py`:

```python
from app.tasks.schemas import CreateTaskDto, TaskResponse


def test_create_task_dto_accepts_required_capabilities() -> None:
    dto = CreateTaskDto(
        title="Test",
        required_capabilities=["python", "testing"],
    )
    assert dto.required_capabilities == ["python", "testing"]


def test_create_task_dto_defaults_capabilities_to_empty() -> None:
    dto = CreateTaskDto(title="Test")
    assert dto.required_capabilities == []


def test_task_response_includes_coordination_fields() -> None:
    data = TaskResponse.model_json_schema()
    props = data["properties"]
    assert "required_capabilities" in props
    assert "needs_attention" in props
    assert "sla_warning_sent_at" in props
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && uv run pytest tests/test_coordination_models.py::test_create_task_dto_accepts_required_capabilities -v`
Expected: FAIL — `CreateTaskDto` has no `required_capabilities` field

**Step 3: Update schemas**

In `apps/api/app/tasks/schemas.py`:

Add to `CreateTaskDto` (after `metadata` field):

```python
required_capabilities: list[str] = Field(default_factory=list)
```

Add to `TaskResponse` (after `completed_at` field):

```python
required_capabilities: list[str]
needs_attention: bool
sla_warning_sent_at: datetime | None
```

**Step 4: Run tests to verify they pass**

Run: `cd apps/api && uv run pytest tests/test_coordination_models.py -v`
Expected: PASS

**Step 5: Update create_task handler to pass required_capabilities**

In `apps/api/app/tasks/router.py`, update the `Task()` constructor in `create_task` (around line 83-96) to include:

```python
required_capabilities=dto.required_capabilities,
```

**Step 6: Commit**

```bash
git add apps/api/app/tasks/schemas.py apps/api/app/tasks/router.py apps/api/tests/test_coordination_models.py
git commit -m "feat(api): add required_capabilities to task schemas

CreateTaskDto accepts list[str], TaskResponse includes coordination fields"
```

---

## Task 4: Create coordination package + Task Router

**Files:**

- Create: `apps/api/app/coordination/__init__.py`
- Create: `apps/api/app/coordination/router.py`
- Create: `apps/api/tests/test_task_router.py`

**Step 1: Create package init**

Create `apps/api/app/coordination/__init__.py` (empty file).

**Step 2: Write failing test**

Create `apps/api/tests/test_task_router.py`:

```python
"""Tests for capability-based task routing."""

import uuid

import pytest

from app.coordination.router import PROFICIENCY_WEIGHTS, score_candidate


def test_proficiency_weights_are_ordered() -> None:
    assert PROFICIENCY_WEIGHTS["basic"] < PROFICIENCY_WEIGHTS["standard"]
    assert PROFICIENCY_WEIGHTS["standard"] < PROFICIENCY_WEIGHTS["expert"]


def test_score_candidate_single_capability_expert() -> None:
    """Expert proficiency with 0 active tasks should score highest."""
    score = score_candidate(
        agent_proficiencies={"python": "expert"},
        required_capabilities=["python"],
        active_task_count=0,
    )
    assert score == pytest.approx(3.0)  # expert=3 * 1/(1+0)=1.0


def test_score_candidate_multiple_capabilities() -> None:
    """Score sums proficiency across all matched capabilities."""
    score = score_candidate(
        agent_proficiencies={"python": "expert", "testing": "standard"},
        required_capabilities=["python", "testing"],
        active_task_count=0,
    )
    assert score == pytest.approx(5.0)  # 3 + 2


def test_score_candidate_missing_capability_returns_zero() -> None:
    """If agent is missing any required capability, score is 0."""
    score = score_candidate(
        agent_proficiencies={"python": "expert"},
        required_capabilities=["python", "rust"],
        active_task_count=0,
    )
    assert score == 0.0


def test_score_candidate_availability_reduces_score() -> None:
    """More active tasks should reduce the score."""
    score_idle = score_candidate(
        agent_proficiencies={"python": "standard"},
        required_capabilities=["python"],
        active_task_count=0,
    )
    score_busy = score_candidate(
        agent_proficiencies={"python": "standard"},
        required_capabilities=["python"],
        active_task_count=4,
    )
    assert score_idle > score_busy
    assert score_busy == pytest.approx(2.0 / 5.0)  # standard=2 * 1/(1+4)=0.2


def test_score_candidate_empty_required_capabilities() -> None:
    """No requirements means any agent scores based on availability only."""
    score = score_candidate(
        agent_proficiencies={"python": "expert"},
        required_capabilities=[],
        active_task_count=0,
    )
    # No capabilities to match, score = 1.0 (availability only)
    assert score == pytest.approx(1.0)
```

**Step 3: Run test to verify it fails**

Run: `cd apps/api && uv run pytest tests/test_task_router.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.coordination'`

**Step 4: Implement task router**

Create `apps/api/app/coordination/router.py`:

```python
"""Capability-based task routing.

Scores agents by capability match * availability and assigns the best candidate.
Called synchronously during task creation when no assignee is specified.
"""

from __future__ import annotations

import uuid

import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent, AgentCapability
from app.models.enums import AgentStatus, TaskStatus
from app.models.event import Event
from app.models.task import Task

logger = structlog.get_logger()

PROFICIENCY_WEIGHTS: dict[str, float] = {
    "basic": 1.0,
    "standard": 2.0,
    "expert": 3.0,
}


def score_candidate(
    agent_proficiencies: dict[str, str],
    required_capabilities: list[str],
    active_task_count: int,
) -> float:
    """Score an agent candidate for a task.

    Returns 0.0 if the agent is missing any required capability.
    Otherwise: sum(proficiency_weight) * availability_weight.
    """
    availability = 1.0 / (1.0 + active_task_count)

    if not required_capabilities:
        return availability

    total_proficiency = 0.0
    for cap in required_capabilities:
        prof = agent_proficiencies.get(cap)
        if prof is None:
            return 0.0
        total_proficiency += PROFICIENCY_WEIGHTS.get(prof, 1.0)

    return total_proficiency * availability


async def route_task(
    db: AsyncSession,
    task: Task,
    org_id: uuid.UUID,
    actor_id: uuid.UUID,
) -> uuid.UUID | None:
    """Find the best agent for a task based on required_capabilities.

    Returns the assigned agent's ID, or None if no match found.
    """
    required = task.required_capabilities or []

    # Query active agents with their capabilities
    agents_result = await db.execute(
        select(Agent).where(
            Agent.org_id == org_id,
            Agent.status == AgentStatus.ACTIVE.value,
            Agent.deleted_at.is_(None),
        )
    )
    agents = agents_result.scalars().all()

    if not agents:
        logger.warning("route_task.no_agents", task_id=str(task.id))
        return None

    best_agent_id: uuid.UUID | None = None
    best_score = 0.0

    for agent in agents:
        # Build proficiency map for this agent
        caps_result = await db.execute(
            select(AgentCapability).where(AgentCapability.agent_id == agent.id)
        )
        caps = caps_result.scalars().all()
        proficiencies = {c.capability: c.proficiency for c in caps}

        # Count active tasks
        active_count_result = await db.scalar(
            select(func.count()).select_from(Task).where(
                Task.assignee_id == agent.id,
                Task.status.in_([TaskStatus.IN_PROGRESS.value, TaskStatus.TODO.value]),
            )
        )
        active_count = active_count_result or 0

        score = score_candidate(proficiencies, required, active_count)

        if score > best_score:
            best_score = score
            best_agent_id = agent.id

    if best_agent_id is None:
        logger.info("route_task.no_match", task_id=str(task.id), required=required)
        return None

    # Assign task
    task.assignee_id = best_agent_id

    # Emit event
    event = Event(
        org_id=org_id,
        type="task.routed",
        actor_id=actor_id,
        entity_type="task",
        entity_id=task.id,
        data={"agent_id": str(best_agent_id), "score": best_score},
    )
    db.add(event)

    logger.info(
        "route_task.assigned",
        task_id=str(task.id),
        agent_id=str(best_agent_id),
        score=best_score,
    )
    return best_agent_id
```

**Step 5: Run test to verify it passes**

Run: `cd apps/api && uv run pytest tests/test_task_router.py -v`
Expected: PASS

**Step 6: Commit**

```bash
git add apps/api/app/coordination/__init__.py apps/api/app/coordination/router.py apps/api/tests/test_task_router.py
git commit -m "feat(api): add capability-based task router

scores agents by proficiency * availability, assigns best match"
```

---

## Task 5: Create Escalation Handler

**Files:**

- Create: `apps/api/app/coordination/escalation.py`
- Create: `apps/api/tests/test_escalation_handler.py`

**Step 1: Write failing test**

Create `apps/api/tests/test_escalation_handler.py`:

```python
"""Tests for automatic escalation handler."""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.coordination.escalation import _build_escalation_event


def test_build_escalation_event_has_correct_type() -> None:
    org_id = uuid.uuid4()
    task_id = uuid.uuid4()
    from_agent_id = uuid.uuid4()
    to_agent_id = uuid.uuid4()

    event = _build_escalation_event(
        org_id=org_id,
        task_id=task_id,
        from_agent_id=from_agent_id,
        to_agent_id=to_agent_id,
        reason="SLA_BREACH",
    )
    assert event.type == "task.escalated"
    assert event.entity_type == "task"
    assert event.entity_id == task_id
    assert event.data["from_agent"] == str(from_agent_id)
    assert event.data["to_agent"] == str(to_agent_id)
    assert event.data["reason"] == "SLA_BREACH"


def test_build_unresolvable_event() -> None:
    from app.coordination.escalation import _build_unresolvable_event

    org_id = uuid.uuid4()
    task_id = uuid.uuid4()
    agent_id = uuid.uuid4()

    event = _build_unresolvable_event(
        org_id=org_id,
        task_id=task_id,
        agent_id=agent_id,
    )
    assert event.type == "task.escalation.unresolvable"
    assert event.data["agent_id"] == str(agent_id)
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && uv run pytest tests/test_escalation_handler.py -v`
Expected: FAIL — `ModuleNotFoundError`

**Step 3: Implement escalation handler**

Create `apps/api/app/coordination/escalation.py`:

```python
"""Automatic escalation handler.

Called by the SLA Monitor when a task breaches its deadline.
Escalates to the assignee's parent agent, or marks as needs_attention.
"""

from __future__ import annotations

import uuid

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent
from app.models.escalation import Escalation
from app.models.event import Event
from app.models.task import Task

logger = structlog.get_logger()


def _build_escalation_event(
    org_id: uuid.UUID,
    task_id: uuid.UUID,
    from_agent_id: uuid.UUID,
    to_agent_id: uuid.UUID,
    reason: str,
) -> Event:
    return Event(
        org_id=org_id,
        type="task.escalated",
        actor_id=from_agent_id,
        entity_type="task",
        entity_id=task_id,
        data={
            "from_agent": str(from_agent_id),
            "to_agent": str(to_agent_id),
            "reason": reason,
        },
        severity="warning",
    )


def _build_unresolvable_event(
    org_id: uuid.UUID,
    task_id: uuid.UUID,
    agent_id: uuid.UUID,
) -> Event:
    return Event(
        org_id=org_id,
        type="task.escalation.unresolvable",
        actor_id=agent_id,
        entity_type="task",
        entity_id=task_id,
        data={"agent_id": str(agent_id)},
        severity="error",
    )


async def escalate_task_automatic(
    db: AsyncSession,
    task: Task,
    reason: str = "SLA_BREACH",
) -> bool:
    """Escalate a task to its assignee's parent agent.

    Returns True if escalation succeeded, False if unresolvable.
    """
    if not task.assignee_id:
        logger.warning("escalate.no_assignee", task_id=str(task.id))
        task.needs_attention = True
        db.add(_build_unresolvable_event(
            org_id=task.org_id, task_id=task.id, agent_id=task.creator_id,
        ))
        return False

    # Find assignee's parent
    assignee = await db.get(Agent, task.assignee_id)
    if not assignee:
        logger.error("escalate.assignee_not_found", task_id=str(task.id))
        return False

    if assignee.parent_id:
        # Escalate to parent
        parent = await db.get(Agent, assignee.parent_id)
        if not parent:
            logger.error("escalate.parent_not_found", agent_id=str(assignee.id))
            return False

        # Reassign task
        old_assignee_id = task.assignee_id
        task.assignee_id = parent.id

        # Create escalation record
        escalation = Escalation(
            org_id=task.org_id,
            task_id=task.id,
            from_agent_id=old_assignee_id,
            to_agent_id=parent.id,
            reason=reason,
            is_automatic=True,
        )
        db.add(escalation)

        # Emit event
        db.add(_build_escalation_event(
            org_id=task.org_id,
            task_id=task.id,
            from_agent_id=old_assignee_id,
            to_agent_id=parent.id,
            reason=reason,
        ))

        logger.info(
            "escalate.success",
            task_id=str(task.id),
            from_agent=str(old_assignee_id),
            to_agent=str(parent.id),
        )
        return True
    else:
        # No parent — mark as needs_attention
        task.needs_attention = True
        db.add(_build_unresolvable_event(
            org_id=task.org_id, task_id=task.id, agent_id=assignee.id,
        ))
        logger.warning(
            "escalate.unresolvable",
            task_id=str(task.id),
            agent_id=str(assignee.id),
        )
        return False
```

**Step 4: Run test to verify it passes**

Run: `cd apps/api && uv run pytest tests/test_escalation_handler.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/app/coordination/escalation.py apps/api/tests/test_escalation_handler.py
git commit -m "feat(api): add automatic escalation handler

escalates to parent agent on SLA breach, marks needs_attention if no parent"
```

---

## Task 6: Create Parent Task Status Sync

**Files:**

- Create: `apps/api/app/coordination/status_sync.py`
- Create: `apps/api/tests/test_status_sync.py`

**Step 1: Write failing test**

Create `apps/api/tests/test_status_sync.py`:

```python
"""Tests for parent task status sync logic."""

from app.coordination.status_sync import compute_parent_status
from app.models.enums import TaskStatus


def test_all_done_completes_parent() -> None:
    statuses = [TaskStatus.DONE, TaskStatus.DONE, TaskStatus.DONE]
    assert compute_parent_status(statuses) == TaskStatus.DONE


def test_any_blocked_blocks_parent() -> None:
    statuses = [TaskStatus.DONE, TaskStatus.BLOCKED, TaskStatus.IN_PROGRESS]
    assert compute_parent_status(statuses) == TaskStatus.BLOCKED


def test_any_cancelled_with_rest_done_completes_parent() -> None:
    statuses = [TaskStatus.DONE, TaskStatus.CANCELLED, TaskStatus.DONE]
    assert compute_parent_status(statuses) == TaskStatus.DONE


def test_mixed_in_progress_stays_in_progress() -> None:
    statuses = [TaskStatus.DONE, TaskStatus.IN_PROGRESS]
    assert compute_parent_status(statuses) == TaskStatus.IN_PROGRESS


def test_empty_children_returns_none() -> None:
    assert compute_parent_status([]) is None


def test_all_cancelled_returns_cancelled() -> None:
    statuses = [TaskStatus.CANCELLED, TaskStatus.CANCELLED]
    assert compute_parent_status(statuses) == TaskStatus.CANCELLED
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && uv run pytest tests/test_status_sync.py -v`
Expected: FAIL — `ModuleNotFoundError`

**Step 3: Implement status sync**

Create `apps/api/app/coordination/status_sync.py`:

```python
"""Parent task status sync.

Computes parent status from children and updates when subtask transitions.
Called after status transitions in the tasks router.
"""

from __future__ import annotations

import uuid

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import TaskStatus
from app.models.event import Event
from app.models.task import Task

logger = structlog.get_logger()

# Terminal statuses that don't prevent parent completion
_TERMINAL = {TaskStatus.DONE, TaskStatus.CANCELLED}
_ACTIVE = {TaskStatus.IN_PROGRESS, TaskStatus.REVIEW, TaskStatus.TODO, TaskStatus.BACKLOG}


def compute_parent_status(child_statuses: list[TaskStatus]) -> TaskStatus | None:
    """Determine what a parent's status should be based on its children.

    Rules:
    - Empty children → None (no change)
    - Any BLOCKED → BLOCKED
    - All DONE or CANCELLED (at least one DONE) → DONE
    - All CANCELLED → CANCELLED
    - Otherwise → IN_PROGRESS
    """
    if not child_statuses:
        return None

    has_blocked = any(s == TaskStatus.BLOCKED for s in child_statuses)
    if has_blocked:
        return TaskStatus.BLOCKED

    non_cancelled = [s for s in child_statuses if s != TaskStatus.CANCELLED]

    if not non_cancelled:
        return TaskStatus.CANCELLED

    all_done = all(s == TaskStatus.DONE for s in non_cancelled)
    if all_done:
        return TaskStatus.DONE

    return TaskStatus.IN_PROGRESS


async def sync_parent_status(
    db: AsyncSession,
    task: Task,
    actor_id: uuid.UUID,
) -> bool:
    """Check if this task's parent needs a status update.

    Returns True if parent status was changed.
    """
    if not task.parent_task_id:
        return False

    parent = await db.get(Task, task.parent_task_id)
    if not parent:
        return False

    # Fetch all sibling subtasks (including this one)
    result = await db.execute(
        select(Task.status).where(
            Task.parent_task_id == parent.id,
            Task.deleted_at.is_(None),
        )
    )
    child_statuses = [TaskStatus(row[0]) for row in result.all()]

    new_status = compute_parent_status(child_statuses)
    if new_status is None or new_status.value == parent.status:
        return False

    old_status = parent.status
    parent.status = new_status.value

    if new_status == TaskStatus.DONE:
        import pendulum
        parent.completed_at = pendulum.now("UTC")

    # Emit event
    event = Event(
        org_id=parent.org_id,
        type="task.parent.status_synced",
        actor_id=actor_id,
        entity_type="task",
        entity_id=parent.id,
        data={
            "old_status": old_status,
            "new_status": new_status.value,
            "trigger_task_id": str(task.id),
            "children_count": len(child_statuses),
        },
    )
    db.add(event)

    logger.info(
        "status_sync.parent_updated",
        parent_id=str(parent.id),
        old_status=old_status,
        new_status=new_status.value,
    )

    # Recurse: if parent also has a parent, sync upward
    if parent.parent_task_id:
        await sync_parent_status(db, parent, actor_id)

    return True
```

**Step 4: Run test to verify it passes**

Run: `cd apps/api && uv run pytest tests/test_status_sync.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/app/coordination/status_sync.py apps/api/tests/test_status_sync.py
git commit -m "feat(api): add parent task status sync

computes parent status from children, syncs upward recursively"
```

---

## Task 7: Add SLA config to Settings

**Files:**

- Modify: `apps/api/app/config.py:5-47`

**Step 1: Write failing test**

Add to `apps/api/tests/test_coordination_models.py`:

```python
def test_settings_has_sla_config() -> None:
    from app.config import settings

    assert hasattr(settings, "sla_warning_pct")
    assert hasattr(settings, "sla_breach_pct")
    assert settings.sla_warning_pct == 80
    assert settings.sla_breach_pct == 100
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && uv run pytest tests/test_coordination_models.py::test_settings_has_sla_config -v`
Expected: FAIL — `AttributeError`

**Step 3: Add SLA config fields**

In `apps/api/app/config.py`, add after `redis_url` (line 39):

```python
# Coordination engine
sla_warning_pct: int = 80
sla_breach_pct: int = 100
```

**Step 4: Run test to verify it passes**

Run: `cd apps/api && uv run pytest tests/test_coordination_models.py::test_settings_has_sla_config -v`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/app/config.py apps/api/tests/test_coordination_models.py
git commit -m "feat(api): add SLA threshold config

sla_warning_pct (80%) and sla_breach_pct (100%) env vars"
```

---

## Task 8: Create SLA Monitor cron job

**Files:**

- Create: `apps/api/app/coordination/sla_monitor.py`
- Create: `apps/api/tests/test_sla_monitor.py`

**Step 1: Write failing test**

Create `apps/api/tests/test_sla_monitor.py`:

```python
"""Tests for SLA monitor threshold calculations."""

from datetime import datetime, timedelta, timezone

from app.coordination.sla_monitor import check_sla_thresholds


def test_no_deadline_returns_none() -> None:
    result = check_sla_thresholds(
        created_at=datetime.now(timezone.utc),
        due_date=None,
        sla_warning_sent=False,
        warning_pct=80,
        breach_pct=100,
    )
    assert result is None


def test_within_threshold_returns_ok() -> None:
    now = datetime.now(timezone.utc)
    created_at = now - timedelta(hours=1)
    due_date = now + timedelta(hours=9)  # 10h total, 1h elapsed = 10%
    result = check_sla_thresholds(
        created_at=created_at,
        due_date=due_date,
        sla_warning_sent=False,
        warning_pct=80,
        breach_pct=100,
    )
    assert result == "ok"


def test_warning_threshold_returns_warning() -> None:
    now = datetime.now(timezone.utc)
    created_at = now - timedelta(hours=9)
    due_date = now + timedelta(hours=1)  # 10h total, 9h elapsed = 90%
    result = check_sla_thresholds(
        created_at=created_at,
        due_date=due_date,
        sla_warning_sent=False,
        warning_pct=80,
        breach_pct=100,
    )
    assert result == "warning"


def test_warning_already_sent_returns_ok() -> None:
    now = datetime.now(timezone.utc)
    created_at = now - timedelta(hours=9)
    due_date = now + timedelta(hours=1)  # 90% elapsed
    result = check_sla_thresholds(
        created_at=created_at,
        due_date=due_date,
        sla_warning_sent=True,
        warning_pct=80,
        breach_pct=100,
    )
    assert result == "ok"


def test_breach_threshold_returns_breach() -> None:
    now = datetime.now(timezone.utc)
    created_at = now - timedelta(hours=11)
    due_date = now - timedelta(hours=1)  # past deadline = 110%
    result = check_sla_thresholds(
        created_at=created_at,
        due_date=due_date,
        sla_warning_sent=True,
        warning_pct=80,
        breach_pct=100,
    )
    assert result == "breach"
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && uv run pytest tests/test_sla_monitor.py -v`
Expected: FAIL — `ModuleNotFoundError`

**Step 3: Implement SLA monitor**

Create `apps/api/app/coordination/sla_monitor.py`:

```python
"""SLA Monitor — arq cron job that checks task deadlines.

Runs every 60 seconds. Emits warning events at threshold and triggers
automatic escalation on breach.
"""

from __future__ import annotations

from datetime import datetime, timezone

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.coordination.escalation import escalate_task_automatic
from app.database import async_session
from app.models.enums import TaskStatus
from app.models.event import Event
from app.models.task import Task

logger = structlog.get_logger()


def check_sla_thresholds(
    created_at: datetime,
    due_date: datetime | None,
    sla_warning_sent: bool,
    warning_pct: int = 80,
    breach_pct: int = 100,
) -> str | None:
    """Check SLA status for a single task.

    Returns: None (no deadline), "ok", "warning", or "breach".
    """
    if due_date is None:
        return None

    now = datetime.now(timezone.utc)

    # Ensure timezone-aware
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    if due_date.tzinfo is None:
        due_date = due_date.replace(tzinfo=timezone.utc)

    total_duration = (due_date - created_at).total_seconds()
    if total_duration <= 0:
        return "breach"

    elapsed = (now - created_at).total_seconds()
    elapsed_pct = (elapsed / total_duration) * 100

    if elapsed_pct >= breach_pct:
        return "breach"
    if elapsed_pct >= warning_pct and not sla_warning_sent:
        return "warning"

    return "ok"


async def monitor_sla(ctx: dict) -> int:
    """arq job: scan in-progress tasks with deadlines, warn or escalate."""
    async with async_session() as db:
        result = await db.execute(
            select(Task).where(
                Task.status == TaskStatus.IN_PROGRESS.value,
                Task.due_date.isnot(None),
                Task.deleted_at.is_(None),
            )
        )
        tasks = result.scalars().all()

        warnings = 0
        breaches = 0

        for task in tasks:
            status = check_sla_thresholds(
                created_at=task.created_at,
                due_date=task.due_date,
                sla_warning_sent=task.sla_warning_sent_at is not None,
                warning_pct=settings.sla_warning_pct,
                breach_pct=settings.sla_breach_pct,
            )

            if status == "warning":
                await _emit_warning(db, task)
                warnings += 1
            elif status == "breach":
                await escalate_task_automatic(db, task, reason="SLA_BREACH")
                breaches += 1

        await db.commit()
        logger.info(
            "sla_monitor.done",
            scanned=len(tasks),
            warnings=warnings,
            breaches=breaches,
        )
        return warnings + breaches


async def _emit_warning(db: AsyncSession, task: Task) -> None:
    """Mark task as warned and emit SLA warning event."""
    import pendulum

    task.sla_warning_sent_at = pendulum.now("UTC")

    total = (task.due_date - task.created_at).total_seconds()
    now = datetime.now(timezone.utc)
    if task.created_at.tzinfo is None:
        created = task.created_at.replace(tzinfo=timezone.utc)
    else:
        created = task.created_at
    elapsed = (now - created).total_seconds()
    elapsed_pct = round((elapsed / total) * 100, 1) if total > 0 else 100.0

    actor_id = task.assignee_id or task.creator_id
    event = Event(
        org_id=task.org_id,
        type="task.sla.warning",
        actor_id=actor_id,
        entity_type="task",
        entity_id=task.id,
        data={
            "deadline": str(task.due_date),
            "elapsed_pct": elapsed_pct,
        },
        severity="warning",
    )
    db.add(event)

    logger.info(
        "sla_monitor.warning",
        task_id=str(task.id),
        elapsed_pct=elapsed_pct,
    )
```

**Step 4: Run test to verify it passes**

Run: `cd apps/api && uv run pytest tests/test_sla_monitor.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/app/coordination/sla_monitor.py apps/api/tests/test_sla_monitor.py
git commit -m "feat(api): add SLA monitor cron job

scans in-progress tasks, warns at threshold, escalates on breach"
```

---

## Task 9: Wire Task Router into create_task

**Files:**

- Modify: `apps/api/app/tasks/router.py:67-106`

**Step 1: Write failing test**

Add to `apps/api/tests/test_coordination_models.py`:

```python
async def test_create_task_endpoint_accepts_required_capabilities(client) -> None:
    """Verify the route accepts required_capabilities without 422."""
    r = await client.post(
        "/tasks",
        json={
            "title": "Test routing",
            "required_capabilities": ["python", "testing"],
        },
    )
    # Will be 401 (no auth), but NOT 422 (validation error)
    assert r.status_code == 401
```

**Step 2: Run test to verify it passes** (should already pass from Task 3 schema changes)

Run: `cd apps/api && uv run pytest tests/test_coordination_models.py::test_create_task_endpoint_accepts_required_capabilities -v`
Expected: PASS (401, not 422)

**Step 3: Wire router into create_task**

In `apps/api/app/tasks/router.py`, update the `create_task` function.

After `await db.flush()` (line 98) and tag creation, before `await db.commit()` (line 104), add:

```python
# Auto-route if no assignee specified
if task.assignee_id is None and task.required_capabilities:
    from app.coordination.router import route_task
    await route_task(db, task, auth.org_id, creator_id)
```

**Step 4: Run all tests to ensure nothing is broken**

Run: `cd apps/api && uv run pytest tests/ -v`
Expected: All existing tests PASS

**Step 5: Commit**

```bash
git add apps/api/app/tasks/router.py apps/api/tests/test_coordination_models.py
git commit -m "feat(api): wire task router into create_task

auto-routes tasks with required_capabilities and no assignee"
```

---

## Task 10: Wire Status Sync into transition_task

**Files:**

- Modify: `apps/api/app/tasks/router.py:150-181`

**Step 1: Update transition_task**

In `apps/api/app/tasks/router.py`, in the `transition_task` function, after `task.status = dto.status.value` (line 173) and before `await db.commit()` (line 178), add:

```python
# Sync parent status if this task has a parent
if task.parent_task_id:
    from app.coordination.status_sync import sync_parent_status
    await sync_parent_status(db, task, auth.id)
```

**Step 2: Run all tests**

Run: `cd apps/api && uv run pytest tests/ -v`
Expected: All PASS

**Step 3: Commit**

```bash
git add apps/api/app/tasks/router.py
git commit -m "feat(api): wire status sync into transition_task

syncs parent task status when subtask transitions"
```

---

## Task 11: Add SLA monitor to worker settings

**Files:**

- Modify: `apps/api/app/workers/enrichment.py:154-171`

**Step 1: Add import and cron entry**

In `apps/api/app/workers/enrichment.py`:

Add import at top (after existing imports):

```python
from app.coordination.sla_monitor import monitor_sla
```

Add to `WorkerSettings.functions` list:

```python
monitor_sla,
```

Add to `WorkerSettings.cron_jobs` list:

```python
cron(monitor_sla, minute={0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59}),
```

Actually, arq `cron` with no time filter runs every minute. Simplify:

```python
cron(monitor_sla, second={0}),  # every minute
```

**Step 2: Run tests**

Run: `cd apps/api && uv run pytest tests/ -v`
Expected: All PASS

**Step 3: Commit**

```bash
git add apps/api/app/workers/enrichment.py
git commit -m "feat(api): add SLA monitor to arq worker cron

runs every minute, checks deadlines on in-progress tasks"
```

---

## Task 12: Lint and format

**Step 1: Run ruff**

```bash
cd apps/api && uv run ruff check --fix . && uv run ruff format .
```

**Step 2: Run full test suite**

```bash
cd apps/api && uv run pytest tests/ -v
```

**Step 3: Fix any issues, then commit**

```bash
git add -u
git commit -m "chore(api): lint and format coordination engine"
```

---

## Unresolved Questions

1. **SLA monitor `cron` syntax** — arq's `second={0}` runs every minute; confirm this matches design's "every 60 seconds" intent
2. **Coordinator fallback** — design mentions "org's default coordinator agent" fallback; not implemented yet because no `default_coordinator_id` column on Organization. Add later if needed?
3. **System messages in channels** — design mentions "create system message in task channel" on escalation; not implemented since channel creation for tasks isn't automatic yet. Wire when channel system is connected?
