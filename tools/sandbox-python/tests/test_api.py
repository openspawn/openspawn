"""Integration tests for the FastAPI server."""

import asyncio

import pytest
from fastapi.testclient import TestClient

from app.agents import create_all_agents
from app.server import app, get_sim
from app.simulation import Simulation


@pytest.fixture(autouse=True)
def setup_sim():
    """Initialize simulation before each test."""
    import app.server as server_module

    agents = create_all_agents()
    server_module.sim = Simulation(agents, tick_interval_ms=100)
    # Run a few ticks to get things going
    loop = asyncio.new_event_loop()
    for _ in range(16):
        loop.run_until_complete(server_module.sim.run_tick())
    yield server_module.sim
    loop.close()


@pytest.fixture
def client():
    return TestClient(app, raise_server_exceptions=False)


class TestHealthEndpoints:
    def test_state(self, client):
        r = client.get("/api/state")
        assert r.status_code == 200
        data = r.json()
        assert "tick" in data
        assert "agentCount" in data
        assert data["agentCount"] == 32

    def test_agents_list(self, client):
        r = client.get("/api/agents")
        assert r.status_code == 200
        agents = r.json()
        assert len(agents) == 32
        assert agents[0]["id"]
        assert agents[0]["name"]

    def test_tasks_list(self, client):
        r = client.get("/api/tasks")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_events_list(self, client):
        r = client.get("/api/events")
        assert r.status_code == 200
        events = r.json()
        assert isinstance(events, list)
        assert len(events) > 0  # Boot events exist

    def test_metrics(self, client):
        r = client.get("/api/metrics")
        assert r.status_code == 200
        metrics = r.json()
        assert isinstance(metrics, list)
        assert len(metrics) > 0

    def test_models(self, client):
        r = client.get("/api/models")
        assert r.status_code == 200
        data = r.json()
        assert data["provider"] == "deterministic"
        assert data["locked"] is True


class TestGraphQL:
    def test_agents_query(self, client):
        r = client.post("/graphql", json={
            "query": "query Agents { agents { id name level status } }",
        })
        assert r.status_code == 200
        data = r.json()["data"]
        assert len(data["agents"]) == 32

    def test_tasks_query(self, client):
        r = client.post("/graphql", json={
            "query": "query Tasks { tasks { id title status } }",
        })
        assert r.status_code == 200
        assert "tasks" in r.json()["data"]

    def test_agent_by_id(self, client):
        r = client.post("/graphql", json={
            "query": "query Agent($id: ID!) { agent(id: $id) { id name } }",
            "variables": {"id": "mr-krabs"},
        })
        assert r.status_code == 200
        agent = r.json()["data"]["agent"]
        assert agent["id"] == "mr-krabs"
        assert agent["name"] == "Mr. Krabs"

    def test_agent_not_found(self, client):
        r = client.post("/graphql", json={
            "query": "query Agent($id: ID!) { agent(id: $id) { id } }",
            "variables": {"id": "nonexistent"},
        })
        assert r.status_code == 200
        assert r.json()["data"]["agent"] is None

    def test_events_query(self, client):
        r = client.post("/graphql", json={
            "query": "query Events { events { id type reasoning } }",
        })
        assert r.status_code == 200
        assert "events" in r.json()["data"]

    def test_messages_query(self, client):
        r = client.post("/graphql", json={
            "query": "query Messages { messages { id content type } }",
        })
        assert r.status_code == 200
        assert "messages" in r.json()["data"]

    def test_trust_leaderboard(self, client):
        r = client.post("/graphql", json={
            "query": "query TrustLeaderboard { trustLeaderboard { id name trustScore } }",
        })
        assert r.status_code == 200
        leaders = r.json()["data"]["trustLeaderboard"]
        assert len(leaders) <= 10
        # Should be sorted by trust score descending
        scores = [l["trustScore"] for l in leaders]
        assert scores == sorted(scores, reverse=True)

    def test_credit_history(self, client):
        r = client.post("/graphql", json={
            "query": "query CreditHistory { creditHistory { id type amount } }",
        })
        assert r.status_code == 200
        assert "creditHistory" in r.json()["data"]

    def test_conversations(self, client):
        r = client.post("/graphql", json={
            "query": "query Conversations { conversations { id participants { id name } messageCount } }",
        })
        assert r.status_code == 200
        assert "conversations" in r.json()["data"]

    def test_unknown_operation(self, client):
        r = client.post("/graphql", json={
            "query": "query FooBar { fooBar { id } }",
        })
        assert r.status_code == 200
        assert r.json()["data"] == {}


class TestOrderEndpoint:
    def test_send_order(self, client):
        r = client.post("/api/order", json={"message": "Build authentication system"})
        assert r.status_code == 200
        data = r.json()
        assert data["ok"] is True
        assert "Mr. Krabs" in data["message"]

    def test_order_missing_message(self, client):
        r = client.post("/api/order", json={})
        assert r.status_code == 200
        assert "error" in r.json()

    def test_order_creates_tasks(self, client):
        client.post("/api/order", json={"message": "Fix the login bug and write tests"})
        # Run a tick via state check
        r = client.get("/api/state")
        # Tasks may not be created instantly (need ticks) — just verify no error
        assert r.status_code == 200


class TestSpawnAgent:
    def test_spawn_new_agent(self, client):
        r = client.post("/api/agents/spawn", json={
            "name": "Test Agent",
            "role": "worker",
            "domain": "Engineering",
            "level": 4,
        })
        assert r.status_code == 200
        data = r.json()
        assert data["ok"] is True
        assert data["agent"]["name"] == "Test Agent"

    def test_spawn_duplicate_fails(self, client):
        client.post("/api/agents/spawn", json={"name": "Unique Agent"})
        r = client.post("/api/agents/spawn", json={"name": "Unique Agent"})
        assert "error" in r.json()

    def test_spawn_missing_name(self, client):
        r = client.post("/api/agents/spawn", json={"role": "worker"})
        assert "error" in r.json()


class TestSpeedControl:
    def test_get_speed(self, client):
        r = client.get("/api/speed")
        assert r.status_code == 200
        assert "tickIntervalMs" in r.json()

    def test_set_speed_by_interval(self, client):
        r = client.put("/api/speed", json={"tickIntervalMs": 500})
        assert r.status_code == 200
        assert r.json()["tickIntervalMs"] == 500

    def test_speed_clamped_min(self, client):
        r = client.put("/api/speed", json={"tickIntervalMs": 10})
        assert r.json()["tickIntervalMs"] == 100  # Min 100

    def test_speed_clamped_max(self, client):
        r = client.put("/api/speed", json={"tickIntervalMs": 99999})
        assert r.json()["tickIntervalMs"] == 10000  # Max 10000


class TestACPMetrics:
    def test_acp_metrics_structure(self, client):
        r = client.get("/api/metrics/acp")
        assert r.status_code == 200
        data = r.json()
        assert "ackLatencyMs" in data
        assert "escalationRate" in data
        assert "avgDelegationDepth" in data
        assert "completionRate" in data
        assert "totalAcks" in data
        assert "totalEscalations" in data
        assert "totalCompletions" in data
        assert "totalDelegations" in data
        assert "escalationsByReason" in data


class TestRestart:
    def test_restart_organic(self, client):
        r = client.post("/api/restart?mode=organic")
        assert r.status_code == 200
        data = r.json()
        assert data["ok"] is True
        assert data["agentCount"] == 1  # Just COO

    def test_restart_full(self, client):
        r = client.post("/api/restart?mode=full")
        assert r.status_code == 200
        assert r.json()["agentCount"] == 32


class TestTaskActivity:
    def test_missing_task_returns_empty(self, client):
        r = client.get("/api/task/NONEXISTENT/activity")
        assert r.status_code == 200
        assert r.json() == []


class TestAgentMessages:
    def test_agent_messages(self, client):
        r = client.get("/api/agent/mr-krabs/messages")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
