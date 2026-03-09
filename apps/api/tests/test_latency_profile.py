"""Coordination engine latency profiling benchmarks (#618).

Measures algorithm latency with assertions — CI-safe, $0, no LLM calls.
Uses mocked AsyncSession for all DB interactions.
"""

from __future__ import annotations

import time
import uuid
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.coordination.escalation import escalate_task_automatic
from app.coordination.router import route_task, score_candidate
from app.coordination.sla_monitor import check_sla_thresholds
from app.coordination.status_sync import compute_parent_status, sync_parent_status
from app.models.enums import AgentStatus, Proficiency, TaskStatus

# ---------------------------------------------------------------------------
# Helpers (same pattern as test_coordination_e2e.py)
# ---------------------------------------------------------------------------


def _mock_db() -> AsyncMock:
    db = AsyncMock()
    db.add = MagicMock()
    return db


def _mock_scalars_result(items: list[Any]) -> MagicMock:
    result = MagicMock()
    result.scalars.return_value.all.return_value = items
    return result


def _mock_rows_result(rows: list[tuple[Any, ...]]) -> MagicMock:
    result = MagicMock()
    result.all.return_value = rows
    return result


def _agent(
    *,
    agent_id: uuid.UUID | None = None,
    org_id: uuid.UUID | None = None,
    status: str = AgentStatus.ACTIVE.value,
    parent_id: uuid.UUID | None = None,
    level: int = 4,
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
        completed_at=None,
    )


# Storage for latency results across test methods
_latency_results: list[tuple[str, float]] = []


def _measure(label: str) -> tuple[float, float]:
    """Return (start, 0.0) — caller fills in elapsed after."""
    return time.perf_counter(), 0.0


# ═══════════════════════════════════════════════════════════════════════════
# Latency profiling benchmarks
# ═══════════════════════════════════════════════════════════════════════════


class TestCoordinationLatency:
    """Ordered latency benchmarks for coordination engine algorithms."""

    # ------------------------------------------------------------------
    # 1. score_candidate() — pure function, must be <1ms
    # ------------------------------------------------------------------

    def test_01_score_candidate_latency(self) -> None:
        proficiencies = {
            "coding": Proficiency.EXPERT.value,
            "testing": Proficiency.STANDARD.value,
            "analysis": Proficiency.BASIC.value,
        }
        required = ["coding", "testing"]

        start = time.perf_counter()
        for _ in range(1000):
            score_candidate(proficiencies, required, 2)
        elapsed = (time.perf_counter() - start) / 1000

        _latency_results.append(("score_candidate (1k avg)", elapsed))
        assert elapsed < 0.001, f"score_candidate took {elapsed * 1000:.3f}ms, expected <1ms"

    # ------------------------------------------------------------------
    # 2. route_task() — mocked DB, 4 agents, must be <100ms
    # ------------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_02_route_task_latency(self) -> None:
        org_id, actor_id = uuid.uuid4(), uuid.uuid4()

        agents = [
            _agent(org_id=org_id, level=4),
            _agent(org_id=org_id, level=4),
            _agent(org_id=org_id, level=4),
            _agent(org_id=org_id, level=7),
        ]
        caps_per_agent = [
            [_capability(agents[0].id, "coding", Proficiency.EXPERT.value)],
            [_capability(agents[1].id, "writing", Proficiency.EXPERT.value)],
            [_capability(agents[2].id, "analysis", Proficiency.EXPERT.value)],
            [
                _capability(agents[3].id, "coding", Proficiency.STANDARD.value),
                _capability(agents[3].id, "writing", Proficiency.STANDARD.value),
            ],
        ]

        task = _task(org_id=org_id, required_capabilities=["coding"])

        db = _mock_db()
        db.execute.side_effect = [
            _mock_scalars_result(agents),
            *[_mock_scalars_result(caps) for caps in caps_per_agent],
        ]
        db.scalar.side_effect = [0, 0, 0, 0]

        start = time.perf_counter()
        result = await route_task(db, task, org_id, actor_id)
        elapsed = time.perf_counter() - start

        _latency_results.append(("route_task (4 agents)", elapsed))
        assert result is not None
        assert elapsed < 0.1, f"route_task took {elapsed * 1000:.1f}ms, expected <100ms"

    # ------------------------------------------------------------------
    # 3. compute_parent_status() — pure function, must be <1ms
    # ------------------------------------------------------------------

    def test_03_compute_parent_status_latency(self) -> None:
        statuses = [TaskStatus.DONE, TaskStatus.IN_PROGRESS, TaskStatus.TODO]

        start = time.perf_counter()
        for _ in range(1000):
            compute_parent_status(statuses)
        elapsed = (time.perf_counter() - start) / 1000

        _latency_results.append(("compute_parent_status (1k avg)", elapsed))
        assert elapsed < 0.001, f"compute_parent_status took {elapsed * 1000:.3f}ms, expected <1ms"

    # ------------------------------------------------------------------
    # 4. check_sla_thresholds() — pure function, must be <1ms
    # ------------------------------------------------------------------

    def test_04_check_sla_thresholds_latency(self) -> None:
        now = datetime.now(UTC)
        created = now - timedelta(hours=9)
        due = now + timedelta(hours=1)

        start = time.perf_counter()
        for _ in range(1000):
            check_sla_thresholds(created, due, sla_warning_sent=False)
        elapsed = (time.perf_counter() - start) / 1000

        _latency_results.append(("check_sla_thresholds (1k avg)", elapsed))
        assert elapsed < 0.001, f"check_sla_thresholds took {elapsed * 1000:.3f}ms, expected <1ms"

    # ------------------------------------------------------------------
    # 5. escalate_task_automatic() — mocked DB, must be <100ms
    # ------------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_05_escalate_task_automatic_latency(self) -> None:
        org_id = uuid.uuid4()
        lead = _agent(org_id=org_id, level=7, parent_id=None)
        worker = _agent(org_id=org_id, level=4, parent_id=lead.id)
        task = _task(org_id=org_id, assignee_id=worker.id)

        db = _mock_db()
        db.get.side_effect = lambda model, uid: {
            worker.id: worker,
            lead.id: lead,
        }.get(uid)

        start = time.perf_counter()
        result = await escalate_task_automatic(db, task, reason="SLA_BREACH")
        elapsed = time.perf_counter() - start

        _latency_results.append(("escalate_task_automatic", elapsed))
        assert result is True
        assert elapsed < 0.1, (
            f"escalate_task_automatic took {elapsed * 1000:.1f}ms, expected <100ms"
        )

    # ------------------------------------------------------------------
    # 6. sync_parent_status() — mocked DB, must be <100ms
    # ------------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_06_sync_parent_status_latency(self) -> None:
        org_id, actor_id = uuid.uuid4(), uuid.uuid4()
        parent = _task(
            task_id=uuid.uuid4(),
            org_id=org_id,
            status=TaskStatus.IN_PROGRESS.value,
            parent_task_id=None,
        )
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
                (TaskStatus.DONE.value,),
                (TaskStatus.DONE.value,),
            ]
        )

        start = time.perf_counter()
        result = await sync_parent_status(db, child, actor_id)
        elapsed = time.perf_counter() - start

        _latency_results.append(("sync_parent_status", elapsed))
        assert result is True
        assert elapsed < 0.1, f"sync_parent_status took {elapsed * 1000:.1f}ms, expected <100ms"

    # ------------------------------------------------------------------
    # 7. Full coordination cycle — must be <500ms
    # ------------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_07_full_coordination_cycle_latency(self) -> None:
        """route → work → escalate → sync — full cycle under 500ms."""
        org_id, actor_id = uuid.uuid4(), uuid.uuid4()

        lead = _agent(org_id=org_id, level=7, parent_id=None)
        coder = _agent(org_id=org_id, level=4, parent_id=lead.id)
        writer = _agent(org_id=org_id, level=4, parent_id=lead.id)
        analyst = _agent(org_id=org_id, level=4, parent_id=lead.id)
        agents = [coder, writer, analyst, lead]

        caps_per_agent = [
            [_capability(coder.id, "coding", Proficiency.EXPERT.value)],
            [_capability(writer.id, "writing", Proficiency.EXPERT.value)],
            [_capability(analyst.id, "analysis", Proficiency.EXPERT.value)],
            [
                _capability(lead.id, "coding", Proficiency.STANDARD.value),
                _capability(lead.id, "writing", Proficiency.STANDARD.value),
            ],
        ]

        parent_task = _task(
            org_id=org_id,
            status=TaskStatus.IN_PROGRESS.value,
            parent_task_id=None,
        )
        coding_task = _task(
            org_id=org_id,
            required_capabilities=["coding"],
            parent_task_id=parent_task.id,
        )
        writing_task = _task(
            org_id=org_id,
            required_capabilities=["writing"],
            parent_task_id=parent_task.id,
        )

        start = time.perf_counter()

        # Step 1: Route coding task
        db1 = _mock_db()
        db1.execute.side_effect = [
            _mock_scalars_result(agents),
            *[_mock_scalars_result(caps) for caps in caps_per_agent],
        ]
        db1.scalar.side_effect = [0, 0, 0, 0]
        route_result = await route_task(db1, coding_task, org_id, actor_id)
        assert route_result == coder.id

        # Step 2: Simulate work — coder hits blocker
        coding_task.status = TaskStatus.BLOCKED.value

        # Step 3: Escalate to lead
        db2 = _mock_db()
        db2.get.side_effect = lambda model, uid: {
            coder.id: coder,
            lead.id: lead,
        }.get(uid)
        esc_result = await escalate_task_automatic(db2, coding_task, reason="BLOCKED_TIMEOUT")
        assert esc_result is True
        assert coding_task.assignee_id == lead.id

        # Step 4: Lead resolves, mark done
        coding_task.status = TaskStatus.DONE.value
        writing_task.status = TaskStatus.DONE.value

        # Step 5: Sync parent status
        db3 = _mock_db()
        db3.get.return_value = parent_task
        db3.execute.return_value = _mock_rows_result(
            [
                (TaskStatus.DONE.value,),
                (TaskStatus.DONE.value,),
            ]
        )
        sync_result = await sync_parent_status(db3, coding_task, actor_id)
        assert sync_result is True
        assert parent_task.status == TaskStatus.DONE.value

        elapsed = time.perf_counter() - start

        _latency_results.append(("full cycle (route→escalate→sync)", elapsed))
        assert elapsed < 0.5, f"Full cycle took {elapsed * 1000:.1f}ms, expected <500ms"

    # ------------------------------------------------------------------
    # 8. Print results table (runs last due to ordering)
    # ------------------------------------------------------------------

    def test_99_print_latency_table(self) -> None:
        """Print formatted latency results table (must run last)."""
        print("\n")
        print("=" * 60)
        print("  COORDINATION ENGINE LATENCY PROFILE")
        print("=" * 60)
        print(f"  {'Operation':<40} {'Latency':>12}")
        print("-" * 60)

        for label, elapsed in _latency_results:
            if elapsed < 0.001:
                formatted = f"{elapsed * 1_000_000:.1f} us"
            else:
                formatted = f"{elapsed * 1000:.2f} ms"
            print(f"  {label:<40} {formatted:>12}")

        print("-" * 60)
        total = sum(e for _, e in _latency_results)
        print(f"  {'TOTAL':<40} {total * 1000:>9.2f} ms")
        print("=" * 60)
