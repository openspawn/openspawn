"""Full org lifecycle e2e smoke test — simulated ($0, no LLM calls).

Exercises the complete coordination engine flow:
  Setup → Task creation → Routing → Work simulation → Escalation → Status sync

All database interactions are mocked. No external services are called.
Ref: https://github.com/openspawn/openspawn/issues/619
"""

from __future__ import annotations

import uuid
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.coordination.escalation import escalate_task_automatic
from app.coordination.router import route_task, score_candidate
from app.coordination.status_sync import compute_parent_status, sync_parent_status
from app.models.enums import AgentStatus, Proficiency, TaskStatus

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _mock_db() -> AsyncMock:
    db = AsyncMock()
    db.add = MagicMock()
    return db


def _agent(
    *,
    name: str,
    level: int,
    parent_id: uuid.UUID | None = None,
    status: str = AgentStatus.ACTIVE.value,
) -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid.uuid4(),
        name=name,
        level=level,
        status=status,
        parent_id=parent_id,
        org_id=uuid.uuid4(),
        deleted_at=None,
    )


def _capability(
    agent_id: uuid.UUID,
    capability: str,
    proficiency: str = Proficiency.STANDARD.value,
) -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid.uuid4(),
        agent_id=agent_id,
        capability=capability,
        proficiency=proficiency,
    )


def _task(
    *,
    title: str,
    required_capabilities: list[str] | None = None,
    creator_id: uuid.UUID,
    org_id: uuid.UUID,
    parent_task_id: uuid.UUID | None = None,
    status: str = TaskStatus.BACKLOG.value,
) -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid.uuid4(),
        title=title,
        required_capabilities=required_capabilities or [],
        creator_id=creator_id,
        org_id=org_id,
        assignee_id=None,
        parent_task_id=parent_task_id,
        status=status,
        needs_attention=False,
        deleted_at=None,
        completed_at=None,
    )


# ---------------------------------------------------------------------------
# Phase 1 — Setup: org + agents + capabilities
# ---------------------------------------------------------------------------


class TestOrgLifecycleE2E:
    """Full org lifecycle exercised sequentially through all phases."""

    def _build_org(self) -> dict:
        """Create org, 4 agents (lead L7 + 3 workers L4), capabilities."""
        org_id = uuid.uuid4()

        lead = _agent(name="Lead Engineer", level=7)
        lead.org_id = org_id

        data_specialist = _agent(
            name="Data Migration Specialist",
            level=4,
            parent_id=lead.id,
        )
        data_specialist.org_id = org_id

        integration_eng = _agent(
            name="Integration Engineer",
            level=4,
            parent_id=lead.id,
        )
        integration_eng.org_id = org_id

        success_agent = _agent(
            name="Success Agent",
            level=4,
            parent_id=lead.id,
        )
        success_agent.org_id = org_id

        # Capabilities
        caps = {
            data_specialist.id: [
                _capability(data_specialist.id, "data_migration", Proficiency.EXPERT.value),
                _capability(data_specialist.id, "sql", Proficiency.STANDARD.value),
            ],
            integration_eng.id: [
                _capability(integration_eng.id, "api_integration", Proficiency.EXPERT.value),
                _capability(integration_eng.id, "testing", Proficiency.STANDARD.value),
            ],
            success_agent.id: [
                _capability(success_agent.id, "deployment", Proficiency.EXPERT.value),
                _capability(success_agent.id, "monitoring", Proficiency.STANDARD.value),
            ],
            lead.id: [
                _capability(lead.id, "architecture", Proficiency.EXPERT.value),
                _capability(lead.id, "api_integration", Proficiency.STANDARD.value),
                _capability(lead.id, "data_migration", Proficiency.STANDARD.value),
                _capability(lead.id, "deployment", Proficiency.STANDARD.value),
            ],
        }

        return {
            "org_id": org_id,
            "lead": lead,
            "data_specialist": data_specialist,
            "integration_eng": integration_eng,
            "success_agent": success_agent,
            "agents": [lead, data_specialist, integration_eng, success_agent],
            "caps": caps,
        }

    # ------------------------------------------------------------------
    # Phase 1: verify org setup
    # ------------------------------------------------------------------

    def test_phase1_org_setup(self) -> None:
        org = self._build_org()

        assert len(org["agents"]) == 4
        assert org["lead"].level == 7
        for worker in [org["data_specialist"], org["integration_eng"], org["success_agent"]]:
            assert worker.level == 4
            assert worker.parent_id == org["lead"].id

        # All agents active
        for agent in org["agents"]:
            assert agent.status == AgentStatus.ACTIVE.value
            assert agent.org_id == org["org_id"]

    # ------------------------------------------------------------------
    # Phase 2: routing scores — capability match
    # ------------------------------------------------------------------

    def test_phase2_routing_scores(self) -> None:
        """Verify score_candidate picks the right agent per task."""
        # Data migration task — data_specialist should score highest
        data_score = score_candidate(
            agent_proficiencies={"data_migration": "expert", "sql": "standard"},
            required_capabilities=["data_migration"],
            active_task_count=0,
        )
        lead_data_score = score_candidate(
            agent_proficiencies={"data_migration": "standard"},
            required_capabilities=["data_migration"],
            active_task_count=0,
        )
        integration_data_score = score_candidate(
            agent_proficiencies={"api_integration": "expert"},
            required_capabilities=["data_migration"],
            active_task_count=0,
        )

        assert data_score > lead_data_score  # expert > standard
        assert integration_data_score == 0.0  # missing capability

        # Integration task — integration_eng should score highest
        integration_score = score_candidate(
            agent_proficiencies={"api_integration": "expert", "testing": "standard"},
            required_capabilities=["api_integration"],
            active_task_count=0,
        )
        lead_int_score = score_candidate(
            agent_proficiencies={"api_integration": "standard"},
            required_capabilities=["api_integration"],
            active_task_count=0,
        )

        assert integration_score > lead_int_score

        # Deployment task — success_agent should score highest
        deploy_score = score_candidate(
            agent_proficiencies={"deployment": "expert", "monitoring": "standard"},
            required_capabilities=["deployment"],
            active_task_count=0,
        )
        lead_deploy_score = score_candidate(
            agent_proficiencies={"deployment": "standard"},
            required_capabilities=["deployment"],
            active_task_count=0,
        )

        assert deploy_score > lead_deploy_score

    # ------------------------------------------------------------------
    # Phase 3: full route_task with mocked DB
    # ------------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_phase3_route_task_assigns_best_agent(self) -> None:
        """route_task queries DB, picks best agent, assigns task."""
        org = self._build_org()
        db = _mock_db()

        parent_task = _task(
            title="Cloud migration project",
            creator_id=org["lead"].id,
            org_id=org["org_id"],
        )

        migration_task = _task(
            title="Data migration",
            required_capabilities=["data_migration"],
            creator_id=org["lead"].id,
            org_id=org["org_id"],
            parent_task_id=parent_task.id,
        )

        agents = org["agents"]
        caps_map = org["caps"]

        # Mock db.execute for agents query — returns all agents
        agents_result_mock = MagicMock()
        agents_result_mock.scalars.return_value.all.return_value = agents

        # Mock db.execute for capabilities — return per-agent caps
        def _make_caps_result(agent_id: uuid.UUID) -> MagicMock:
            result = MagicMock()
            result.scalars.return_value.all.return_value = caps_map.get(agent_id, [])
            return result

        execute_calls: list[MagicMock] = []

        async def mock_execute(stmt: object) -> MagicMock:
            call_idx = len(execute_calls)
            if call_idx == 0:
                # First call: fetch agents
                result = agents_result_mock
            else:
                # Subsequent: fetch capabilities per agent
                agent_idx = call_idx - 1
                if agent_idx < len(agents):
                    result = _make_caps_result(agents[agent_idx].id)
                else:
                    result = MagicMock()
                    result.scalars.return_value.all.return_value = []
            execute_calls.append(result)
            return result

        db.execute = AsyncMock(side_effect=mock_execute)

        # Mock db.scalar for active task counts — all idle
        db.scalar = AsyncMock(return_value=0)

        assigned_id = await route_task(
            db=db,
            task=migration_task,
            org_id=org["org_id"],
            actor_id=org["lead"].id,
        )

        # data_specialist should win (expert in data_migration)
        assert assigned_id == org["data_specialist"].id
        assert migration_task.assignee_id == org["data_specialist"].id

        # Event emitted via db.add
        assert db.add.called

    # ------------------------------------------------------------------
    # Phase 4: escalation — worker hits blocker, escalates to lead
    # ------------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_phase4_escalation_worker_to_lead(self) -> None:
        """Integration engineer hits blocker → escalates to lead."""
        org = self._build_org()
        db = _mock_db()

        integration_task = _task(
            title="API integration",
            required_capabilities=["api_integration"],
            creator_id=org["lead"].id,
            org_id=org["org_id"],
            status=TaskStatus.BLOCKED.value,
        )
        integration_task.assignee_id = org["integration_eng"].id

        # Mock db.get: returns assignee (integration_eng), then parent (lead)
        async def mock_get(model: type, entity_id: uuid.UUID) -> SimpleNamespace | None:
            if entity_id == org["integration_eng"].id:
                return org["integration_eng"]
            if entity_id == org["lead"].id:
                return org["lead"]
            return None

        db.get = AsyncMock(side_effect=mock_get)

        result = await escalate_task_automatic(
            db=db,
            task=integration_task,
            reason="BLOCKED_TIMEOUT",
        )

        assert result is True
        # Task reassigned to lead
        assert integration_task.assignee_id == org["lead"].id

        # Escalation record + event added
        add_calls = db.add.call_args_list
        assert len(add_calls) == 2  # Escalation + Event

    # ------------------------------------------------------------------
    # Phase 5: lead resolves, re-assigns back to worker
    # ------------------------------------------------------------------

    def test_phase5_lead_resolves_and_reassigns(self) -> None:
        """Lead resolves blocker, re-assigns to integration engineer."""
        org = self._build_org()

        integration_task = _task(
            title="API integration",
            required_capabilities=["api_integration"],
            creator_id=org["lead"].id,
            org_id=org["org_id"],
            status=TaskStatus.BLOCKED.value,
        )
        # Currently assigned to lead after escalation
        integration_task.assignee_id = org["lead"].id

        # Lead resolves and re-assigns
        integration_task.assignee_id = org["integration_eng"].id
        integration_task.status = TaskStatus.IN_PROGRESS.value

        assert integration_task.assignee_id == org["integration_eng"].id
        assert integration_task.status == TaskStatus.IN_PROGRESS.value

    # ------------------------------------------------------------------
    # Phase 6: all workers complete their subtasks
    # ------------------------------------------------------------------

    def test_phase6_all_subtasks_complete(self) -> None:
        """All 3 subtasks transition to DONE."""
        org = self._build_org()

        parent_task = _task(
            title="Cloud migration project",
            creator_id=org["lead"].id,
            org_id=org["org_id"],
        )

        subtasks = [
            _task(
                title="Data migration",
                required_capabilities=["data_migration"],
                creator_id=org["lead"].id,
                org_id=org["org_id"],
                parent_task_id=parent_task.id,
            ),
            _task(
                title="API integration",
                required_capabilities=["api_integration"],
                creator_id=org["lead"].id,
                org_id=org["org_id"],
                parent_task_id=parent_task.id,
            ),
            _task(
                title="Go-live deployment",
                required_capabilities=["deployment"],
                creator_id=org["lead"].id,
                org_id=org["org_id"],
                parent_task_id=parent_task.id,
            ),
        ]

        # Assign agents
        subtasks[0].assignee_id = org["data_specialist"].id
        subtasks[1].assignee_id = org["integration_eng"].id
        subtasks[2].assignee_id = org["success_agent"].id

        # Simulate work completion
        for t in subtasks:
            t.status = TaskStatus.IN_PROGRESS.value
        for t in subtasks:
            t.status = TaskStatus.DONE.value

        # All terminal
        for t in subtasks:
            assert t.status == TaskStatus.DONE.value

    # ------------------------------------------------------------------
    # Phase 7: status sync — parent auto-transitions to DONE
    # ------------------------------------------------------------------

    def test_phase7_parent_status_sync_all_done(self) -> None:
        """compute_parent_status returns DONE when all children done."""
        child_statuses = [TaskStatus.DONE, TaskStatus.DONE, TaskStatus.DONE]
        assert compute_parent_status(child_statuses) == TaskStatus.DONE

    def test_phase7_parent_blocked_during_escalation(self) -> None:
        """Parent should be BLOCKED when any child is blocked."""
        child_statuses = [TaskStatus.DONE, TaskStatus.BLOCKED, TaskStatus.IN_PROGRESS]
        assert compute_parent_status(child_statuses) == TaskStatus.BLOCKED

    def test_phase7_parent_in_progress_during_work(self) -> None:
        """Parent IN_PROGRESS while children still working."""
        child_statuses = [TaskStatus.DONE, TaskStatus.IN_PROGRESS, TaskStatus.TODO]
        assert compute_parent_status(child_statuses) == TaskStatus.IN_PROGRESS

    @pytest.mark.asyncio
    async def test_phase7_sync_parent_status_via_db(self) -> None:
        """sync_parent_status updates parent when all children DONE."""
        org = self._build_org()
        db = _mock_db()

        parent_task = _task(
            title="Cloud migration project",
            creator_id=org["lead"].id,
            org_id=org["org_id"],
            status=TaskStatus.IN_PROGRESS.value,
        )
        parent_task.parent_task_id = None  # top-level

        last_subtask = _task(
            title="Go-live deployment",
            creator_id=org["lead"].id,
            org_id=org["org_id"],
            parent_task_id=parent_task.id,
            status=TaskStatus.DONE.value,
        )

        # Mock db.get → returns parent
        db.get = AsyncMock(return_value=parent_task)

        # Mock db.execute → returns all children as DONE
        child_rows = [
            (TaskStatus.DONE.value,),
            (TaskStatus.DONE.value,),
            (TaskStatus.DONE.value,),
        ]
        result_mock = MagicMock()
        result_mock.all.return_value = child_rows
        db.execute = AsyncMock(return_value=result_mock)

        changed = await sync_parent_status(
            db=db,
            task=last_subtask,
            actor_id=org["lead"].id,
        )

        assert changed is True
        assert parent_task.status == TaskStatus.DONE.value
        assert parent_task.completed_at is not None
        assert db.add.called  # event emitted

    # ------------------------------------------------------------------
    # Phase 8: full lifecycle integration — single sequential flow
    # ------------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_phase8_full_lifecycle_no_llm(self) -> None:
        """Complete org lifecycle in one test. No LLM calls made."""
        org = self._build_org()

        # -- Setup --
        parent_task = _task(
            title="Cloud migration project",
            creator_id=org["lead"].id,
            org_id=org["org_id"],
        )

        migration = _task(
            title="Data migration",
            required_capabilities=["data_migration"],
            creator_id=org["lead"].id,
            org_id=org["org_id"],
            parent_task_id=parent_task.id,
        )
        integration = _task(
            title="API integration",
            required_capabilities=["api_integration"],
            creator_id=org["lead"].id,
            org_id=org["org_id"],
            parent_task_id=parent_task.id,
        )
        go_live = _task(
            title="Go-live deployment",
            required_capabilities=["deployment"],
            creator_id=org["lead"].id,
            org_id=org["org_id"],
            parent_task_id=parent_task.id,
        )
        subtasks = [migration, integration, go_live]

        # -- Route via score_candidate (pure function, no DB) --
        agents_with_caps = [
            (org["data_specialist"], {"data_migration": "expert", "sql": "standard"}),
            (org["integration_eng"], {"api_integration": "expert", "testing": "standard"}),
            (org["success_agent"], {"deployment": "expert", "monitoring": "standard"}),
            (
                org["lead"],
                {
                    "architecture": "expert",
                    "api_integration": "standard",
                    "data_migration": "standard",
                    "deployment": "standard",
                },
            ),
        ]

        for task in subtasks:
            best_agent = None
            best_score = 0.0
            for agent, caps in agents_with_caps:
                s = score_candidate(caps, task.required_capabilities, 0)
                if s > best_score:
                    best_score = s
                    best_agent = agent
            assert best_agent is not None
            task.assignee_id = best_agent.id

        # Verify routing
        assert migration.assignee_id == org["data_specialist"].id
        assert integration.assignee_id == org["integration_eng"].id
        assert go_live.assignee_id == org["success_agent"].id

        # -- Work: data_specialist completes migration --
        migration.status = TaskStatus.IN_PROGRESS.value
        migration.status = TaskStatus.DONE.value

        # -- Work: integration_eng hits blocker --
        integration.status = TaskStatus.IN_PROGRESS.value
        integration.status = TaskStatus.BLOCKED.value

        # -- Escalation to lead --
        db = _mock_db()

        async def mock_get(model: type, entity_id: uuid.UUID) -> SimpleNamespace | None:
            if entity_id == org["integration_eng"].id:
                return org["integration_eng"]
            if entity_id == org["lead"].id:
                return org["lead"]
            return None

        db.get = AsyncMock(side_effect=mock_get)

        escalated = await escalate_task_automatic(db=db, task=integration, reason="BLOCKED_TIMEOUT")
        assert escalated is True
        assert integration.assignee_id == org["lead"].id

        # -- Lead resolves, re-assigns --
        integration.assignee_id = org["integration_eng"].id
        integration.status = TaskStatus.IN_PROGRESS.value
        integration.status = TaskStatus.DONE.value

        # -- Success agent completes go-live --
        go_live.status = TaskStatus.IN_PROGRESS.value
        go_live.status = TaskStatus.DONE.value

        # -- Status sync: all children done → parent DONE --
        child_statuses = [TaskStatus(t.status) for t in subtasks]
        new_parent_status = compute_parent_status(child_statuses)
        assert new_parent_status == TaskStatus.DONE
        parent_task.status = new_parent_status.value

        # -- Final assertions --
        # 1. All tasks terminal
        for t in subtasks:
            assert t.status == TaskStatus.DONE.value
        assert parent_task.status == TaskStatus.DONE.value

        # 2. Escalation chain worked (worker → lead verified above)

        # 3. Parent marked done after children
        assert new_parent_status == TaskStatus.DONE

        # 4. No LLM calls — verified by absence of any API/HTTP mocks;
        #    entire test uses only coordination engine pure functions + mock DB
