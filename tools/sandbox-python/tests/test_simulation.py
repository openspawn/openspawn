"""Unit tests for the deterministic simulation engine."""

import pytest

from app.agents import create_all_agents, create_coo
from app.simulation import (
    Simulation,
    detect_domain,
    detect_domains,
    parse_order_into_tasks,
)
from app.types import AgentRole, AgentStatus, TaskPriority, TaskStatus


# ── Domain detection ─────────────────────────────────────────────────────────


class TestDetectDomain:
    def test_engineering_keywords(self):
        assert detect_domain("Fix the login bug in the API") == "engineering"
        assert detect_domain("Build a new frontend component") == "engineering"
        assert detect_domain("Deploy to production server") == "engineering"

    def test_marketing_keywords(self):
        assert detect_domain("Launch a blog post campaign") == "marketing"
        assert detect_domain("SEO audit for the website") == "marketing"

    def test_finance_keywords(self):
        assert detect_domain("Q1 revenue projection report") == "finance"
        assert detect_domain("Update the pricing model") == "finance"

    def test_sales_keywords(self):
        assert detect_domain("Cold outreach to enterprise prospects") == "sales"
        assert detect_domain("Prepare a demo for the client") == "sales"

    def test_support_keywords(self):
        assert detect_domain("Resolve the customer ticket backlog") == "support"

    def test_hr_keywords(self):
        assert detect_domain("Onboard new team members and hire recruits") == "hr"

    def test_defaults_to_engineering(self):
        assert detect_domain("Do something vague") == "engineering"

    def test_case_insensitive(self):
        assert detect_domain("FIX THE API BUG") == "engineering"


class TestDetectDomains:
    def test_single_domain(self):
        domains = detect_domains("Fix the API bug")
        assert domains[0] == "engineering"

    def test_multiple_domains(self):
        domains = detect_domains("Build an API and launch a marketing campaign for the website")
        assert "engineering" in domains
        assert "marketing" in domains

    def test_defaults_to_engineering(self):
        domains = detect_domains("Do something")
        assert domains == ["engineering"]


class TestParseOrderIntoTasks:
    def test_numbered_list(self):
        order = "1) Fix the login bug. 2) Launch marketing campaign. 3) Update pricing page."
        tasks = parse_order_into_tasks(order)
        assert len(tasks) >= 3
        assert any("login" in t["title"].lower() for t in tasks)
        assert any("marketing" in t["title"].lower() for t in tasks)

    def test_bullet_points(self):
        order = "- Build authentication system\n- Write E2E tests\n- SEO audit"
        tasks = parse_order_into_tasks(order)
        assert len(tasks) >= 3

    def test_single_sentence(self):
        order = "Fix the critical Safari crash"
        tasks = parse_order_into_tasks(order)
        assert len(tasks) >= 1
        assert tasks[0]["domain"] == "engineering"

    def test_multi_domain_detection(self):
        order = "Build an API endpoint and launch a blog post about it"
        tasks = parse_order_into_tasks(order)
        domains = {t["domain"] for t in tasks}
        assert len(domains) >= 2

    def test_all_tasks_have_priority(self):
        tasks = parse_order_into_tasks("1) Do this 2) Do that")
        for t in tasks:
            assert "priority" in t


# ── Simulation engine ────────────────────────────────────────────────────────


class TestSimulationInit:
    def test_creates_with_agents(self):
        agents = create_all_agents()
        sim = Simulation(agents, tick_interval_ms=100)
        assert len(sim.agents) == 32
        assert sim.tick == 0
        assert sim.tasks == []
        assert sim.events != []  # Boot log events

    def test_staggered_spawn(self):
        """Only COO should start active, rest pending."""
        agents = create_all_agents()
        sim = Simulation(agents, tick_interval_ms=100)
        active = [a for a in sim.agents if a.status == AgentStatus.ACTIVE]
        pending = [a for a in sim.agents if a.status == AgentStatus.PENDING]
        assert len(active) == 1
        assert active[0].role == AgentRole.COO
        assert len(pending) == 31

    def test_spawn_queue_populated(self):
        agents = create_all_agents()
        sim = Simulation(agents, tick_interval_ms=100)
        assert len(sim._spawn_queue) == 31


class TestSimulationTick:
    @pytest.mark.asyncio
    async def test_tick_increments(self):
        agents = create_all_agents()
        sim = Simulation(agents, tick_interval_ms=100)
        await sim.run_tick()
        assert sim.tick == 1

    @pytest.mark.asyncio
    async def test_agents_spawn_over_ticks(self):
        agents = create_all_agents()
        sim = Simulation(agents, tick_interval_ms=100)
        # 2 agents spawn per tick
        await sim.run_tick()
        active = [a for a in sim.agents if a.status == AgentStatus.ACTIVE]
        assert len(active) == 3  # COO + 2 spawned

    @pytest.mark.asyncio
    async def test_all_agents_eventually_active(self):
        agents = create_all_agents()
        sim = Simulation(agents, tick_interval_ms=100)
        # 31 pending / 2 per tick = 16 ticks
        for _ in range(16):
            await sim.run_tick()
        active = [a for a in sim.agents if a.status == AgentStatus.ACTIVE]
        assert len(active) == 32

    @pytest.mark.asyncio
    async def test_metrics_recorded(self):
        agents = create_all_agents()
        sim = Simulation(agents, tick_interval_ms=100)
        await sim.run_tick()
        assert len(sim.metrics_history) == 1
        snap = sim.metrics_history[0]
        assert snap.tick == 1
        assert snap.active_agents >= 1


class TestOrderProcessing:
    @pytest.mark.asyncio
    async def test_order_creates_tasks(self):
        agents = create_all_agents()
        sim = Simulation(agents, tick_interval_ms=100)
        # Activate all agents first
        for _ in range(16):
            await sim.run_tick()

        sim.process_order("Build a user authentication API")
        # Run a few ticks to let COO process
        for _ in range(5):
            await sim.run_tick()
        assert len(sim.tasks) > 0

    @pytest.mark.asyncio
    async def test_order_hires_leads_for_missing_domains(self):
        sim = Simulation(create_coo(), tick_interval_ms=100)
        sim.process_order("Build an API and launch a marketing campaign")
        assert len(sim._pending_hires) > 0

    @pytest.mark.asyncio
    async def test_tasks_get_delegated(self):
        agents = create_all_agents()
        sim = Simulation(agents, tick_interval_ms=100)
        for _ in range(16):
            await sim.run_tick()
        sim.process_order("Fix the critical login bug")
        for _ in range(5):
            await sim.run_tick()

        assigned_tasks = [t for t in sim.tasks if t.assignee_id is not None]
        assert len(assigned_tasks) > 0


class TestWorkProgression:
    @pytest.mark.asyncio
    async def test_task_progresses_to_done(self):
        agents = create_all_agents()
        sim = Simulation(agents, tick_interval_ms=100)
        for _ in range(16):
            await sim.run_tick()

        sim.process_order("Fix critical bug")
        # Run enough ticks for tasks to complete
        for _ in range(30):
            await sim.run_tick()

        done_tasks = [t for t in sim.tasks if t.status == TaskStatus.DONE]
        assert len(done_tasks) > 0, "At least one task should complete in 30 ticks"

    @pytest.mark.asyncio
    async def test_completed_tasks_earn_credits(self):
        agents = create_all_agents()
        sim = Simulation(agents, tick_interval_ms=100)
        for _ in range(16):
            await sim.run_tick()

        sim.process_order("Fix critical bug")
        # Run many ticks to complete tasks
        for _ in range(50):
            await sim.run_tick()

        done_count = sum(1 for t in sim.tasks if t.status == TaskStatus.DONE)
        if done_count > 0:
            total_credits = sum(a.stats.credits_earned for a in sim.agents)
            assert total_credits > 0

    @pytest.mark.asyncio
    async def test_messages_generated_during_work(self):
        agents = create_all_agents()
        sim = Simulation(agents, tick_interval_ms=100)
        for _ in range(16):
            await sim.run_tick()

        sim.process_order("Fix critical login bug")
        for _ in range(10):
            await sim.run_tick()

        total_messages = sum(a.stats.messages_sent for a in sim.agents)
        assert total_messages > 0


class TestRestart:
    @pytest.mark.asyncio
    async def test_restart_organic(self):
        agents = create_all_agents()
        sim = Simulation(agents, tick_interval_ms=100)
        sim.process_order("Do stuff")
        for _ in range(5):
            await sim.run_tick()

        await sim.restart("organic")
        assert sim.tick == 0
        assert len(sim.tasks) == 0
        assert len(sim.agents) == 1  # Just COO
        assert sim.agents[0].role == AgentRole.COO

    @pytest.mark.asyncio
    async def test_restart_full(self):
        sim = Simulation(create_coo(), tick_interval_ms=100)
        await sim.restart("full")
        assert len(sim.agents) == 32
        assert sim.tick == 0


class TestEventSystem:
    @pytest.mark.asyncio
    async def test_sse_listener_receives_events(self):
        agents = create_all_agents()
        sim = Simulation(agents, tick_interval_ms=100)
        received = []
        sim.on_event(lambda e: received.append(e))
        await sim.run_tick()
        assert len(received) > 0

    @pytest.mark.asyncio
    async def test_sse_unsubscribe(self):
        sim = Simulation(create_coo(), tick_interval_ms=100)
        received = []
        unsub = sim.on_event(lambda e: received.append(e))
        unsub()
        await sim.run_tick()
        # Should only have events from before unsub (boot events)
        boot_count = len(received)
        await sim.run_tick()
        assert len(received) == boot_count  # No new events after unsub
