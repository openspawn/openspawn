"""Unit tests for API response mappers."""

from app.agents import create_all_agents
from app.mappers import (
    collect_all_messages,
    generate_credits,
    map_agent,
    map_event,
    map_task,
)
from app.types import (
    ACPMessage,
    ACPType,
    AgentRole,
    SandboxAgent,
    SandboxEvent,
    SandboxTask,
    TaskPriority,
    TaskStatus,
)


def _make_agent(**kwargs) -> SandboxAgent:
    defaults = {"id": "test", "name": "Test", "role": AgentRole.WORKER, "level": 4, "domain": "Engineering"}
    return SandboxAgent(**{**defaults, **kwargs})


class TestMapAgent:
    def test_maps_basic_fields(self):
        agent = _make_agent(id="sandy", name="Sandy Cheeks", level=6, domain="Engineering")
        result = map_agent(agent, [agent])
        assert result["id"] == "sandy"
        assert result["agentId"] == "sandy"
        assert result["name"] == "Sandy Cheeks"
        assert result["level"] == 6
        assert result["domain"] == "Engineering"

    def test_status_mapping(self):
        agent = _make_agent(status="active")
        result = map_agent(agent, [agent])
        assert result["status"] == "ACTIVE"

    def test_busy_maps_to_active(self):
        agent = _make_agent(status="busy")
        result = map_agent(agent, [agent])
        assert result["status"] == "ACTIVE"

    def test_trust_score_calculation(self):
        agent = _make_agent(level=10)
        agent.stats.tasks_completed = 5
        result = map_agent(agent, [agent])
        expected = min(100, 30 + 10 * 7 + 5 * 2)
        assert result["trustScore"] == expected

    def test_reputation_levels(self):
        for level, expected in [(10, "ELITE"), (7, "VETERAN"), (4, "TRUSTED"), (2, "PROBATION"), (1, "NEW")]:
            agent = _make_agent(level=level)
            result = map_agent(agent, [agent])
            assert result["reputationLevel"] == expected, f"L{level} should be {expected}"

    def test_orchestrator_vs_worker_mode(self):
        lead = _make_agent(level=7)
        worker = _make_agent(level=4)
        assert map_agent(lead, [lead])["mode"] == "ORCHESTRATOR"
        assert map_agent(worker, [worker])["mode"] == "WORKER"

    def test_avatar_fields_passed_through(self):
        agent = _make_agent(avatar="🦀", avatar_color="#ff0000", avatar_url="/avatars/test.png")
        result = map_agent(agent, [agent])
        assert result["avatar"] == "🦀"
        assert result["avatarColor"] == "#ff0000"
        assert result["avatarUrl"] == "/avatars/test.png"

    def test_team_id_from_domain(self):
        agent = _make_agent(domain="Engineering")
        result = map_agent(agent, [agent])
        assert result["teamId"] == "team-engineering"

    def test_parent_id_strips_human_principal(self):
        agent = _make_agent(parent_id="human-principal")
        result = map_agent(agent, [agent])
        assert result["parentId"] is None

    def test_all_32_agents_map_without_error(self):
        agents = create_all_agents()
        for agent in agents:
            result = map_agent(agent, agents)
            assert result["id"] == agent.id
            assert isinstance(result["trustScore"], int)


class TestMapTask:
    def test_maps_basic_fields(self):
        task = SandboxTask(id="TASK-0001", title="Fix bug", priority=TaskPriority.HIGH, creator_id="coo")
        result = map_task(task, [])
        assert result["id"] == "TASK-0001"
        assert result["title"] == "Fix bug"
        assert result["priority"] == "HIGH"
        assert result["status"] == "BACKLOG"

    def test_status_mapping(self):
        mappings = {
            TaskStatus.BACKLOG: "BACKLOG",
            TaskStatus.ASSIGNED: "TODO",
            TaskStatus.IN_PROGRESS: "IN_PROGRESS",
            TaskStatus.REVIEW: "REVIEW",
            TaskStatus.DONE: "DONE",
            TaskStatus.BLOCKED: "BLOCKED",
        }
        for status, expected in mappings.items():
            task = SandboxTask(id="t", title="t", status=status)
            assert map_task(task, [])["status"] == expected

    def test_assignee_resolved(self):
        agent = _make_agent(id="dev-1", name="Dev 1")
        task = SandboxTask(id="t", title="t", assignee_id="dev-1")
        result = map_task(task, [agent])
        assert result["assignee"]["id"] == "dev-1"
        assert result["assignee"]["name"] == "Dev 1"

    def test_no_assignee(self):
        task = SandboxTask(id="t", title="t")
        result = map_task(task, [])
        assert result["assignee"] is None
        assert result["assigneeId"] is None

    def test_done_has_completed_at(self):
        task = SandboxTask(id="t", title="t", status=TaskStatus.DONE)
        result = map_task(task, [])
        assert result["completedAt"] is not None

    def test_not_done_no_completed_at(self):
        task = SandboxTask(id="t", title="t", status=TaskStatus.IN_PROGRESS)
        result = map_task(task, [])
        assert result["completedAt"] is None


class TestMapEvent:
    def test_maps_system_event(self):
        event = SandboxEvent(type="system", message="Boot")
        result = map_event(event, [])
        assert result["type"] == "system"
        assert result["severity"] == "INFO"
        assert result["reasoning"] == "Boot"

    def test_maps_agent_event(self):
        agent = _make_agent(id="dev", name="Dev")
        event = SandboxEvent(type="agent_action", agent_id="dev", message="Working")
        result = map_event(event, [agent])
        assert result["actor"]["name"] == "Dev"
        assert result["entityType"] == "agent"

    def test_task_event_entity_type(self):
        event = SandboxEvent(type="agent_action", agent_id="dev", task_id="TASK-0001", message="Done")
        result = map_event(event, [])
        assert result["entityType"] == "task"
        assert result["entityId"] == "TASK-0001"


class TestCollectAllMessages:
    def test_deduplicates(self):
        msg = ACPMessage(id="msg-1", type=ACPType.ACK, **{"from": "a"}, to="b")
        agent_a = _make_agent(id="a")
        agent_b = _make_agent(id="b")
        agent_a.recent_messages = [msg]
        agent_b.recent_messages = [msg]
        result = collect_all_messages([agent_a, agent_b])
        assert len(result) == 1

    def test_sorted_by_timestamp(self):
        msg1 = ACPMessage(id="m1", type=ACPType.ACK, **{"from": "a"}, to="b", timestamp=100)
        msg2 = ACPMessage(id="m2", type=ACPType.ACK, **{"from": "b"}, to="a", timestamp=200)
        agent = _make_agent(id="a")
        agent.recent_messages = [msg2, msg1]
        result = collect_all_messages([agent])
        assert result[0].timestamp < result[1].timestamp

    def test_empty_agents(self):
        assert collect_all_messages([]) == []


class TestGenerateCredits:
    def test_empty_sim(self):
        from app.simulation import Simulation
        sim = Simulation(create_all_agents(), tick_interval_ms=100)
        credits = generate_credits(sim)
        # No metrics yet, but agents with 0 credits → no entries
        assert isinstance(credits, list)
