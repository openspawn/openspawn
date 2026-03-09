"""End-to-end coordination correctness tests (#617).

Tests capability routing, SLA monitoring, auto-escalation chains,
and recursive parent status sync using mocked AsyncSession.
No LLM calls, no real DB — pure algorithm verification.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.coordination.escalation import escalate_task_automatic
from app.coordination.router import PROFICIENCY_WEIGHTS, route_task, score_candidate
from app.coordination.sla_monitor import monitor_sla
from app.coordination.status_sync import sync_parent_status
from app.models.enums import AgentStatus, Proficiency, TaskStatus
from app.models.event import Event

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_ids(n: int = 1) -> list[uuid.UUID]:
    return [uuid.uuid4() for _ in range(n)]


def _agent(
    *,
    agent_id: uuid.UUID | None = None,
    org_id: uuid.UUID | None = None,
    status: str = AgentStatus.ACTIVE.value,
    parent_id: uuid.UUID | None = None,
    level: int = 1,
    deleted_at: datetime | None = None,
) -> SimpleNamespace:
    return SimpleNamespace(
        id=agent_id or uuid.uuid4(),
        org_id=org_id or uuid.uuid4(),
        status=status,
        parent_id=parent_id,
        level=level,
        deleted_at=deleted_at,
    )


def _capability(
    agent_id: uuid.UUID,
    capability: str,
    proficiency: str = Proficiency.STANDARD.value,
) -> SimpleNamespace:
    return SimpleNamespace(
        agent_id=agent_id,
        capability=capability,
        proficiency=proficiency,
    )


def _task(
    *,
    task_id: uuid.UUID | None = None,
    org_id: uuid.UUID | None = None,
    assignee_id: uuid.UUID | None = None,
    creator_id: uuid.UUID | None = None,
    parent_task_id: uuid.UUID | None = None,
    status: str = TaskStatus.IN_PROGRESS.value,
    required_capabilities: list[str] | None = None,
    due_date: datetime | None = None,
    created_at: datetime | None = None,
    sla_warning_sent_at: datetime | None = None,
    needs_attention: bool = False,
) -> SimpleNamespace:
    return SimpleNamespace(
        id=task_id or uuid.uuid4(),
        org_id=org_id or uuid.uuid4(),
        assignee_id=assignee_id,
        creator_id=creator_id or uuid.uuid4(),
        parent_task_id=parent_task_id,
        status=status,
        required_capabilities=required_capabilities or [],
        due_date=due_date,
        created_at=created_at or datetime.now(UTC),
        sla_warning_sent_at=sla_warning_sent_at,
        needs_attention=needs_attention,
    )


def _mock_scalars_result(items: list[Any]) -> MagicMock:
    """Mock db.execute() result with .scalars().all() returning items."""
    result = MagicMock()
    result.scalars.return_value.all.return_value = items
    return result


def _mock_rows_result(rows: list[tuple[Any, ...]]) -> MagicMock:
    """Mock db.execute() result with .all() returning row tuples."""
    result = MagicMock()
    result.all.return_value = rows
    return result


def _mock_db() -> AsyncMock:
    """Create an AsyncMock session with db.add as sync (suppresses unawaited warnings)."""
    db = AsyncMock()
    db.add = MagicMock()
    return db


def _collect_added(db: AsyncMock) -> list[Any]:
    """Collect all objects passed to db.add()."""
    return [c.args[0] for c in db.add.call_args_list]


# ═══════════════════════════════════════════════════════════════════════════
# 1. CAPABILITY-BASED ROUTING — score_candidate
# ═══════════════════════════════════════════════════════════════════════════


class TestScoreCandidate:
    """Pure unit tests for the scoring algorithm."""

    def test_perfect_expert_match(self) -> None:
        proficiencies = {"python": "expert", "testing": "expert"}
        score = score_candidate(proficiencies, ["python", "testing"], 0)
        expected = (PROFICIENCY_WEIGHTS["expert"] * 2) * (1.0 / (1.0 + 0))
        assert score == expected

    def test_missing_capability_returns_zero(self) -> None:
        proficiencies = {"python": "expert"}
        score = score_candidate(proficiencies, ["python", "go"], 0)
        assert score == 0.0

    def test_availability_penalizes_busy_agent(self) -> None:
        proficiencies = {"coding": "standard"}
        idle_score = score_candidate(proficiencies, ["coding"], 0)
        busy_score = score_candidate(proficiencies, ["coding"], 5)
        assert idle_score > busy_score

    def test_tie_breaking_by_availability(self) -> None:
        """Same proficiency, different load → idle agent wins."""
        prof = {"coding": "expert"}
        score_idle = score_candidate(prof, ["coding"], 0)
        score_loaded = score_candidate(prof, ["coding"], 3)
        assert score_idle > score_loaded

    def test_expert_beats_basic_at_same_load(self) -> None:
        expert = {"coding": "expert"}
        basic = {"coding": "basic"}
        assert score_candidate(expert, ["coding"], 0) > score_candidate(basic, ["coding"], 0)

    def test_no_requirements_returns_availability(self) -> None:
        score = score_candidate({"anything": "expert"}, [], 2)
        expected = 1.0 / (1.0 + 2)
        assert score == pytest.approx(expected)

    def test_multi_cap_sums_weights(self) -> None:
        proficiencies = {"a": "basic", "b": "standard", "c": "expert"}
        score = score_candidate(proficiencies, ["a", "b", "c"], 0)
        expected = (1.0 + 2.0 + 3.0) * 1.0
        assert score == expected


# ═══════════════════════════════════════════════════════════════════════════
# 2. CAPABILITY-BASED ROUTING — route_task (async, mocked DB)
# ═══════════════════════════════════════════════════════════════════════════


class TestRouteTask:
    """Async tests for capability-based task routing with mocked DB."""

    @pytest.mark.asyncio
    async def test_assigns_best_matching_agent(self) -> None:
        org_id, actor_id = _make_ids(2)
        agent_a = _agent(org_id=org_id)
        agent_b = _agent(org_id=org_id)

        cap_a = _capability(agent_a.id, "coding", Proficiency.BASIC.value)
        cap_b = _capability(agent_b.id, "coding", Proficiency.EXPERT.value)

        task = _task(org_id=org_id, required_capabilities=["coding"])

        db = _mock_db()
        # First call: select agents
        db.execute.side_effect = [
            _mock_scalars_result([agent_a, agent_b]),
            _mock_scalars_result([cap_a]),  # caps for agent_a
            _mock_scalars_result([cap_b]),  # caps for agent_b
        ]
        db.scalar.side_effect = [0, 0]  # active task counts

        result = await route_task(db, task, org_id, actor_id)

        assert result == agent_b.id
        assert task.assignee_id == agent_b.id

    @pytest.mark.asyncio
    async def test_no_agents_returns_none(self) -> None:
        org_id, actor_id = _make_ids(2)
        task = _task(org_id=org_id, required_capabilities=["coding"])

        db = _mock_db()
        db.execute.return_value = _mock_scalars_result([])

        result = await route_task(db, task, org_id, actor_id)
        assert result is None

    @pytest.mark.asyncio
    async def test_no_capability_match_returns_none(self) -> None:
        org_id, actor_id = _make_ids(2)
        agent = _agent(org_id=org_id)
        cap = _capability(agent.id, "writing", Proficiency.EXPERT.value)

        task = _task(org_id=org_id, required_capabilities=["coding"])

        db = _mock_db()
        db.execute.side_effect = [
            _mock_scalars_result([agent]),
            _mock_scalars_result([cap]),
        ]
        db.scalar.return_value = 0

        result = await route_task(db, task, org_id, actor_id)
        assert result is None

    @pytest.mark.asyncio
    async def test_busy_agent_loses_to_idle_agent(self) -> None:
        org_id, actor_id = _make_ids(2)
        busy = _agent(org_id=org_id)
        idle = _agent(org_id=org_id)

        cap_busy = _capability(busy.id, "coding", Proficiency.EXPERT.value)
        cap_idle = _capability(idle.id, "coding", Proficiency.EXPERT.value)

        task = _task(org_id=org_id, required_capabilities=["coding"])

        db = _mock_db()
        db.execute.side_effect = [
            _mock_scalars_result([busy, idle]),
            _mock_scalars_result([cap_busy]),
            _mock_scalars_result([cap_idle]),
        ]
        db.scalar.side_effect = [10, 0]  # busy has 10 tasks, idle has 0

        result = await route_task(db, task, org_id, actor_id)
        assert result == idle.id

    @pytest.mark.asyncio
    async def test_emits_task_routed_event(self) -> None:
        org_id, actor_id = _make_ids(2)
        agent = _agent(org_id=org_id)
        cap = _capability(agent.id, "coding", Proficiency.STANDARD.value)
        task = _task(org_id=org_id, required_capabilities=["coding"])

        db = _mock_db()
        db.execute.side_effect = [
            _mock_scalars_result([agent]),
            _mock_scalars_result([cap]),
        ]
        db.scalar.return_value = 0

        await route_task(db, task, org_id, actor_id)

        added = _collect_added(db)
        events = [o for o in added if isinstance(o, Event)]
        assert len(events) == 1
        assert events[0].type == "task.routed"
        assert events[0].data["agent_id"] == str(agent.id)

    @pytest.mark.asyncio
    async def test_four_agents_with_distinct_capabilities(self) -> None:
        """Issue #617 scenario: 4 agents, task needs 'analysis' → only analyst matches."""
        org_id, actor_id = _make_ids(2)
        coder = _agent(org_id=org_id)
        writer = _agent(org_id=org_id)
        analyst = _agent(org_id=org_id)
        support = _agent(org_id=org_id)

        task = _task(org_id=org_id, required_capabilities=["analysis"])

        db = _mock_db()
        db.execute.side_effect = [
            _mock_scalars_result([coder, writer, analyst, support]),
            _mock_scalars_result([_capability(coder.id, "coding", "expert")]),
            _mock_scalars_result([_capability(writer.id, "writing", "expert")]),
            _mock_scalars_result([_capability(analyst.id, "analysis", "expert")]),
            _mock_scalars_result([_capability(support.id, "support", "expert")]),
        ]
        db.scalar.side_effect = [0, 0, 0, 0]

        result = await route_task(db, task, org_id, actor_id)
        assert result == analyst.id


# ═══════════════════════════════════════════════════════════════════════════
# 3. AUTO-ESCALATION
# ═══════════════════════════════════════════════════════════════════════════


class TestEscalateTaskAutomatic:
    """Async tests for automatic escalation with mocked DB."""

    @pytest.mark.asyncio
    async def test_escalates_to_parent(self) -> None:
        org_id = uuid.uuid4()
        lead = _agent(org_id=org_id, level=7)
        worker = _agent(org_id=org_id, parent_id=lead.id, level=4)
        task = _task(org_id=org_id, assignee_id=worker.id)

        db = _mock_db()
        db.get.side_effect = lambda model, uid: {
            worker.id: worker,
            lead.id: lead,
        }.get(uid)

        result = await escalate_task_automatic(db, task, reason="SLA_BREACH")

        assert result is True
        assert task.assignee_id == lead.id

    @pytest.mark.asyncio
    async def test_no_parent_sets_needs_attention(self) -> None:
        org_id = uuid.uuid4()
        top_agent = _agent(org_id=org_id, parent_id=None, level=8)
        task = _task(org_id=org_id, assignee_id=top_agent.id)

        db = _mock_db()
        db.get.return_value = top_agent

        result = await escalate_task_automatic(db, task)

        assert result is False
        assert task.needs_attention is True

    @pytest.mark.asyncio
    async def test_no_assignee_sets_needs_attention(self) -> None:
        task = _task(assignee_id=None)

        db = _mock_db()
        result = await escalate_task_automatic(db, task)

        assert result is False
        assert task.needs_attention is True

    @pytest.mark.asyncio
    async def test_emits_escalation_event(self) -> None:
        org_id = uuid.uuid4()
        lead = _agent(org_id=org_id, level=7)
        worker = _agent(org_id=org_id, parent_id=lead.id, level=4)
        task = _task(org_id=org_id, assignee_id=worker.id)

        db = _mock_db()
        db.get.side_effect = lambda model, uid: {
            worker.id: worker,
            lead.id: lead,
        }.get(uid)

        await escalate_task_automatic(db, task, reason="SLA_BREACH")

        added = _collect_added(db)
        events = [o for o in added if isinstance(o, Event)]
        assert any(e.type == "task.escalated" for e in events)
        escalation_event = next(e for e in events if e.type == "task.escalated")
        assert escalation_event.data["from_agent"] == str(worker.id)
        assert escalation_event.data["to_agent"] == str(lead.id)
        assert escalation_event.data["reason"] == "SLA_BREACH"

    @pytest.mark.asyncio
    async def test_emits_unresolvable_event_when_no_parent(self) -> None:
        org_id = uuid.uuid4()
        top = _agent(org_id=org_id, parent_id=None)
        task = _task(org_id=org_id, assignee_id=top.id)

        db = _mock_db()
        db.get.return_value = top

        await escalate_task_automatic(db, task)

        added = _collect_added(db)
        events = [o for o in added if isinstance(o, Event)]
        assert any(e.type == "task.escalation.unresolvable" for e in events)

    @pytest.mark.asyncio
    async def test_creates_escalation_record(self) -> None:
        from app.models.escalation import Escalation

        org_id = uuid.uuid4()
        lead = _agent(org_id=org_id, level=7)
        worker = _agent(org_id=org_id, parent_id=lead.id, level=4)
        task = _task(org_id=org_id, assignee_id=worker.id)

        db = _mock_db()
        db.get.side_effect = lambda model, uid: {
            worker.id: worker,
            lead.id: lead,
        }.get(uid)

        await escalate_task_automatic(db, task, reason="SLA_BREACH")

        added = _collect_added(db)
        escalations = [o for o in added if isinstance(o, Escalation)]
        assert len(escalations) == 1
        assert escalations[0].from_agent_id == worker.id
        assert escalations[0].to_agent_id == lead.id
        assert escalations[0].reason == "SLA_BREACH"
        assert escalations[0].is_automatic is True

    @pytest.mark.asyncio
    async def test_three_level_escalation_chain(self) -> None:
        """#617: worker → specialist → lead, lead has no parent → needs_attention."""
        org_id = uuid.uuid4()
        lead = _agent(org_id=org_id, parent_id=None, level=7)
        specialist = _agent(org_id=org_id, parent_id=lead.id, level=5)
        worker = _agent(org_id=org_id, parent_id=specialist.id, level=4)

        task = _task(org_id=org_id, assignee_id=worker.id)

        db = _mock_db()
        db.get.side_effect = lambda model, uid: {
            worker.id: worker,
            specialist.id: specialist,
            lead.id: lead,
        }.get(uid)

        # Step 1: worker → specialist
        result1 = await escalate_task_automatic(db, task, reason="SLA_BREACH")
        assert result1 is True
        assert task.assignee_id == specialist.id

        # Step 2: specialist → lead
        result2 = await escalate_task_automatic(db, task, reason="SLA_BREACH")
        assert result2 is True
        assert task.assignee_id == lead.id

        # Step 3: lead has no parent → unresolvable
        result3 = await escalate_task_automatic(db, task, reason="SLA_BREACH")
        assert result3 is False
        assert task.needs_attention is True

    @pytest.mark.asyncio
    async def test_escalation_preserves_reason(self) -> None:
        from app.models.escalation import Escalation

        org_id = uuid.uuid4()
        lead = _agent(org_id=org_id, level=7)
        worker = _agent(org_id=org_id, parent_id=lead.id, level=4)
        task = _task(org_id=org_id, assignee_id=worker.id)

        db = _mock_db()
        db.get.side_effect = lambda model, uid: {
            worker.id: worker,
            lead.id: lead,
        }.get(uid)

        await escalate_task_automatic(db, task, reason="BLOCKED_TIMEOUT")

        added = _collect_added(db)
        escalations = [o for o in added if isinstance(o, Escalation)]
        assert escalations[0].reason == "BLOCKED_TIMEOUT"

        events = [o for o in added if isinstance(o, Event)]
        esc_event = next(e for e in events if e.type == "task.escalated")
        assert esc_event.data["reason"] == "BLOCKED_TIMEOUT"


# ═══════════════════════════════════════════════════════════════════════════
# 4. PARENT STATUS SYNC (async, mocked DB)
# ═══════════════════════════════════════════════════════════════════════════


class TestSyncParentStatus:
    """Async tests for recursive parent status sync with mocked DB."""

    @pytest.mark.asyncio
    async def test_mixed_children_sets_in_progress(self) -> None:
        org_id, actor_id = _make_ids(2)
        parent = _task(task_id=uuid.uuid4(), org_id=org_id, status=TaskStatus.TODO.value)
        child = _task(
            org_id=org_id,
            parent_task_id=parent.id,
            status=TaskStatus.DONE.value,
        )

        db = _mock_db()
        db.get.return_value = parent
        db.execute.return_value = _mock_rows_result(
            [
                (TaskStatus.DONE.value,),
                (TaskStatus.IN_PROGRESS.value,),
                (TaskStatus.TODO.value,),
            ]
        )

        result = await sync_parent_status(db, child, actor_id)

        assert result is True
        assert parent.status == TaskStatus.IN_PROGRESS.value

    @pytest.mark.asyncio
    async def test_all_done_completes_parent(self) -> None:
        org_id, actor_id = _make_ids(2)
        parent = _task(org_id=org_id, status=TaskStatus.IN_PROGRESS.value)
        child = _task(org_id=org_id, parent_task_id=parent.id, status=TaskStatus.DONE.value)

        db = _mock_db()
        db.get.return_value = parent
        db.execute.return_value = _mock_rows_result(
            [
                (TaskStatus.DONE.value,),
                (TaskStatus.DONE.value,),
                (TaskStatus.DONE.value,),
            ]
        )

        result = await sync_parent_status(db, child, actor_id)

        assert result is True
        assert parent.status == TaskStatus.DONE.value
        assert parent.completed_at is not None

    @pytest.mark.asyncio
    async def test_blocked_child_blocks_parent(self) -> None:
        org_id, actor_id = _make_ids(2)
        parent = _task(org_id=org_id, status=TaskStatus.IN_PROGRESS.value)
        child = _task(org_id=org_id, parent_task_id=parent.id, status=TaskStatus.BLOCKED.value)

        db = _mock_db()
        db.get.return_value = parent
        db.execute.return_value = _mock_rows_result(
            [
                (TaskStatus.DONE.value,),
                (TaskStatus.BLOCKED.value,),
                (TaskStatus.IN_PROGRESS.value,),
            ]
        )

        result = await sync_parent_status(db, child, actor_id)

        assert result is True
        assert parent.status == TaskStatus.BLOCKED.value

    @pytest.mark.asyncio
    async def test_no_parent_task_returns_false(self) -> None:
        actor_id = uuid.uuid4()
        child = _task(parent_task_id=None)

        db = _mock_db()
        result = await sync_parent_status(db, child, actor_id)
        assert result is False

    @pytest.mark.asyncio
    async def test_same_status_no_change(self) -> None:
        org_id, actor_id = _make_ids(2)
        parent = _task(org_id=org_id, status=TaskStatus.IN_PROGRESS.value)
        child = _task(org_id=org_id, parent_task_id=parent.id)

        db = _mock_db()
        db.get.return_value = parent
        db.execute.return_value = _mock_rows_result(
            [
                (TaskStatus.DONE.value,),
                (TaskStatus.TODO.value,),
            ]
        )

        result = await sync_parent_status(db, child, actor_id)
        assert result is False  # IN_PROGRESS → IN_PROGRESS = no change

    @pytest.mark.asyncio
    async def test_emits_status_synced_event(self) -> None:
        org_id, actor_id = _make_ids(2)
        parent = _task(org_id=org_id, status=TaskStatus.TODO.value)
        child = _task(org_id=org_id, parent_task_id=parent.id)

        db = _mock_db()
        db.get.return_value = parent
        db.execute.return_value = _mock_rows_result(
            [
                (TaskStatus.DONE.value,),
                (TaskStatus.DONE.value,),
            ]
        )

        await sync_parent_status(db, child, actor_id)

        added = _collect_added(db)
        events = [o for o in added if isinstance(o, Event)]
        assert len(events) == 1
        assert events[0].type == "task.parent.status_synced"
        assert events[0].data["old_status"] == TaskStatus.TODO.value
        assert events[0].data["new_status"] == TaskStatus.DONE.value

    @pytest.mark.asyncio
    async def test_recursive_grandchild_sync(self) -> None:
        """#617: grandchild done → child updated → grandparent updated."""
        org_id, actor_id = _make_ids(2)
        grandparent = _task(org_id=org_id, status=TaskStatus.TODO.value, parent_task_id=None)
        parent = _task(org_id=org_id, status=TaskStatus.TODO.value, parent_task_id=grandparent.id)
        child = _task(org_id=org_id, parent_task_id=parent.id, status=TaskStatus.DONE.value)

        db = _mock_db()

        # db.get called for parent, then grandparent (recursive)
        db.get.side_effect = lambda model, uid: {
            parent.id: parent,
            grandparent.id: grandparent,
        }.get(uid)

        # First execute: children of parent → all done
        # Second execute: children of grandparent → all done (after parent updated)
        db.execute.side_effect = [
            _mock_rows_result([(TaskStatus.DONE.value,), (TaskStatus.DONE.value,)]),
            _mock_rows_result([(TaskStatus.DONE.value,)]),
        ]

        result = await sync_parent_status(db, child, actor_id)

        assert result is True
        assert parent.status == TaskStatus.DONE.value
        assert grandparent.status == TaskStatus.DONE.value


# ═══════════════════════════════════════════════════════════════════════════
# 5. SLA MONITOR — integration test with mocked DB
# ═══════════════════════════════════════════════════════════════════════════


class TestMonitorSla:
    """Async tests for the SLA monitor job with mocked DB session."""

    @pytest.mark.asyncio
    async def test_warning_emitted_at_threshold(self) -> None:
        """Task at 90% elapsed → warning event emitted, sla_warning_sent_at set."""
        now = datetime.now(UTC)
        task = _task(
            status=TaskStatus.IN_PROGRESS.value,
            created_at=now - timedelta(hours=9),
            due_date=now + timedelta(hours=1),  # 90% elapsed
            sla_warning_sent_at=None,
        )

        mock_db = _mock_db()
        mock_db.execute.return_value = _mock_scalars_result([task])

        with patch("app.coordination.sla_monitor.async_session") as mock_session:
            mock_session.return_value.__aenter__ = AsyncMock(return_value=mock_db)
            mock_session.return_value.__aexit__ = AsyncMock(return_value=False)

            result = await monitor_sla({})

        assert result == 1  # 1 warning
        assert task.sla_warning_sent_at is not None

    @pytest.mark.asyncio
    async def test_breach_triggers_escalation(self) -> None:
        """Task past deadline → escalate_task_automatic called."""
        now = datetime.now(UTC)
        org_id = uuid.uuid4()
        lead = _agent(org_id=org_id, parent_id=None)
        worker = _agent(org_id=org_id, parent_id=lead.id)

        task = _task(
            org_id=org_id,
            status=TaskStatus.IN_PROGRESS.value,
            assignee_id=worker.id,
            created_at=now - timedelta(hours=11),
            due_date=now - timedelta(hours=1),  # past deadline
            sla_warning_sent_at=now - timedelta(hours=2),
        )

        mock_db = _mock_db()
        mock_db.execute.return_value = _mock_scalars_result([task])
        mock_db.get.side_effect = lambda model, uid: {
            worker.id: worker,
            lead.id: lead,
        }.get(uid)

        with patch("app.coordination.sla_monitor.async_session") as mock_session:
            mock_session.return_value.__aenter__ = AsyncMock(return_value=mock_db)
            mock_session.return_value.__aexit__ = AsyncMock(return_value=False)

            result = await monitor_sla({})

        assert result == 1  # 1 breach
        assert task.assignee_id == lead.id  # escalated to parent

    @pytest.mark.asyncio
    async def test_no_deadline_tasks_skipped(self) -> None:
        """Tasks without due_date are excluded by the query."""
        mock_db = _mock_db()
        mock_db.execute.return_value = _mock_scalars_result([])

        with patch("app.coordination.sla_monitor.async_session") as mock_session:
            mock_session.return_value.__aenter__ = AsyncMock(return_value=mock_db)
            mock_session.return_value.__aexit__ = AsyncMock(return_value=False)

            result = await monitor_sla({})

        assert result == 0

    @pytest.mark.asyncio
    async def test_warning_not_sent_twice(self) -> None:
        """Already-warned task at 90% → no additional warning."""
        now = datetime.now(UTC)
        task = _task(
            status=TaskStatus.IN_PROGRESS.value,
            created_at=now - timedelta(hours=9),
            due_date=now + timedelta(hours=1),
            sla_warning_sent_at=now - timedelta(hours=1),  # already warned
        )

        mock_db = _mock_db()
        mock_db.execute.return_value = _mock_scalars_result([task])

        with patch("app.coordination.sla_monitor.async_session") as mock_session:
            mock_session.return_value.__aenter__ = AsyncMock(return_value=mock_db)
            mock_session.return_value.__aexit__ = AsyncMock(return_value=False)

            result = await monitor_sla({})

        assert result == 0  # no warnings or breaches

    @pytest.mark.asyncio
    async def test_multiple_tasks_scanned(self) -> None:
        """Multiple tasks: one warned, one breached, one ok."""
        now = datetime.now(UTC)
        org_id = uuid.uuid4()
        lead = _agent(org_id=org_id, parent_id=None)
        worker = _agent(org_id=org_id, parent_id=lead.id)

        ok_task = _task(
            org_id=org_id,
            status=TaskStatus.IN_PROGRESS.value,
            created_at=now - timedelta(hours=1),
            due_date=now + timedelta(hours=9),  # 10% elapsed
        )
        warn_task = _task(
            org_id=org_id,
            status=TaskStatus.IN_PROGRESS.value,
            created_at=now - timedelta(hours=9),
            due_date=now + timedelta(hours=1),  # 90% elapsed
        )
        breach_task = _task(
            org_id=org_id,
            status=TaskStatus.IN_PROGRESS.value,
            assignee_id=worker.id,
            created_at=now - timedelta(hours=11),
            due_date=now - timedelta(hours=1),  # past deadline
            sla_warning_sent_at=now - timedelta(hours=2),
        )

        mock_db = _mock_db()
        mock_db.execute.return_value = _mock_scalars_result([ok_task, warn_task, breach_task])
        mock_db.get.side_effect = lambda model, uid: {
            worker.id: worker,
            lead.id: lead,
        }.get(uid)

        with patch("app.coordination.sla_monitor.async_session") as mock_session:
            mock_session.return_value.__aenter__ = AsyncMock(return_value=mock_db)
            mock_session.return_value.__aexit__ = AsyncMock(return_value=False)

            result = await monitor_sla({})

        assert result == 2  # 1 warning + 1 breach


# ═══════════════════════════════════════════════════════════════════════════
# 6. NO LLM CALLS — verify coordination is pure algorithm
# ═══════════════════════════════════════════════════════════════════════════


class TestNoLlmCalls:
    """Verify no external API calls are made during coordination."""

    @pytest.mark.asyncio
    async def test_routing_makes_no_http_calls(self) -> None:
        org_id, actor_id = _make_ids(2)
        agent = _agent(org_id=org_id)
        cap = _capability(agent.id, "coding", "expert")
        task = _task(org_id=org_id, required_capabilities=["coding"])

        db = _mock_db()
        db.execute.side_effect = [
            _mock_scalars_result([agent]),
            _mock_scalars_result([cap]),
        ]
        db.scalar.return_value = 0

        with patch("httpx.AsyncClient") as mock_http:
            await route_task(db, task, org_id, actor_id)
            mock_http.assert_not_called()

    @pytest.mark.asyncio
    async def test_escalation_makes_no_http_calls(self) -> None:
        org_id = uuid.uuid4()
        lead = _agent(org_id=org_id)
        worker = _agent(org_id=org_id, parent_id=lead.id)
        task = _task(org_id=org_id, assignee_id=worker.id)

        db = _mock_db()
        db.get.side_effect = lambda model, uid: {
            worker.id: worker,
            lead.id: lead,
        }.get(uid)

        with patch("httpx.AsyncClient") as mock_http:
            await escalate_task_automatic(db, task)
            mock_http.assert_not_called()
