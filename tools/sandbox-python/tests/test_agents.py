"""Unit tests for agent factory."""

from app.agents import create_all_agents, create_coo, make_agent
from app.types import AgentRole, AgentStatus, TriggerMode


class TestMakeAgent:
    def test_basic_worker(self):
        agent = make_agent("test-worker", "Test Worker", AgentRole.WORKER, 4, "Engineering", "lead-1")
        assert agent.id == "test-worker"
        assert agent.name == "Test Worker"
        assert agent.level == 4
        assert agent.domain == "Engineering"
        assert agent.parent_id == "lead-1"
        assert agent.trigger == TriggerMode.POLLING
        assert agent.trigger_on is None

    def test_l7_gets_event_driven(self):
        agent = make_agent("lead", "Lead", AgentRole.LEAD, 7, "Engineering")
        assert agent.trigger == TriggerMode.EVENT_DRIVEN
        assert agent.trigger_on is not None
        assert len(agent.trigger_on) > 0

    def test_l10_gets_event_driven(self):
        agent = make_agent("coo", "COO", AgentRole.COO, 10, "Operations")
        assert agent.trigger == TriggerMode.EVENT_DRIVEN

    def test_l4_gets_polling(self):
        agent = make_agent("dev", "Dev", AgentRole.WORKER, 4, "Engineering")
        assert agent.trigger == TriggerMode.POLLING

    def test_system_prompt_contains_name(self):
        agent = make_agent("sandy", "Sandy Cheeks", AgentRole.SENIOR, 6, "Engineering")
        assert "Sandy Cheeks" in agent.system_prompt
        assert "L6" in agent.system_prompt

    def test_l7_plus_can_spawn(self):
        agent = make_agent("lead", "Lead", AgentRole.LEAD, 7, "Engineering")
        assert "spawn_agent" in agent.system_prompt

    def test_l4_cannot_spawn(self):
        agent = make_agent("worker", "Worker", AgentRole.WORKER, 4, "Engineering")
        assert "spawn_agent" not in agent.system_prompt

    def test_trigger_override(self):
        agent = make_agent("test", "Test", AgentRole.WORKER, 4, "Engineering", trigger_override=TriggerMode.EVENT_DRIVEN)
        assert agent.trigger == TriggerMode.EVENT_DRIVEN

    def test_fresh_stats(self):
        agent = make_agent("test", "Test", AgentRole.WORKER, 4, "Engineering")
        assert agent.stats.tasks_completed == 0
        assert agent.stats.messages_sent == 0
        assert agent.stats.credits_earned == 0


class TestCreateCOO:
    def test_returns_single_coo(self):
        agents = create_coo()
        assert len(agents) == 1
        assert agents[0].role == AgentRole.COO
        assert agents[0].level == 10
        assert agents[0].id == "mr-krabs"

    def test_coo_has_no_parent(self):
        agents = create_coo()
        assert agents[0].parent_id is None


class TestCreateAllAgents:
    def test_returns_32_agents(self):
        agents = create_all_agents()
        assert len(agents) == 32

    def test_has_one_coo(self):
        agents = create_all_agents()
        coos = [a for a in agents if a.role == AgentRole.COO]
        assert len(coos) == 1

    def test_unique_ids(self):
        agents = create_all_agents()
        ids = [a.id for a in agents]
        assert len(ids) == len(set(ids)), f"Duplicate IDs: {[x for x in ids if ids.count(x) > 1]}"

    def test_hierarchy_valid(self):
        """Every agent with a parent_id should reference an existing agent."""
        agents = create_all_agents()
        ids = {a.id for a in agents}
        for agent in agents:
            if agent.parent_id:
                assert agent.parent_id in ids, f"{agent.name} has invalid parent_id: {agent.parent_id}"

    def test_level_distribution(self):
        agents = create_all_agents()
        levels = {}
        for a in agents:
            levels[a.level] = levels.get(a.level, 0) + 1
        # Should have agents at multiple levels
        assert len(levels) >= 5
        # L10 should be rare (just COO)
        assert levels.get(10, 0) == 1

    def test_multiple_domains(self):
        agents = create_all_agents()
        domains = {a.domain for a in agents}
        assert len(domains) >= 5  # Engineering, Finance, Marketing, Sales, Support, HR

    def test_all_agents_start_active(self):
        agents = create_all_agents()
        for a in agents:
            assert a.status == AgentStatus.ACTIVE
