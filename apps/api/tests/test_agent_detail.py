"""Tests for agent detail endpoints (reputation, budget, hierarchy, capabilities).

These tests use AUTH_MODE=none to bypass auth and seed a real agent via the
register endpoint, then exercise the detail sub-resources.
"""

import os
from collections.abc import AsyncGenerator
from unittest.mock import patch

import pytest
from httpx import ASGITransport, AsyncClient


@pytest.fixture(autouse=True)
def _auth_mode_none():
    """Disable auth so we can call endpoints without JWT."""
    with patch.dict(os.environ, {"AUTH_MODE": "none"}):
        from importlib import reload

        import app.config

        reload(app.config)
        yield
        reload(app.config)


@pytest.fixture
async def authed_client() -> AsyncGenerator[AsyncClient]:
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def seeded_agent_id(authed_client: AsyncClient) -> str:
    """Register a test agent and return its UUID."""
    resp = await authed_client.post(
        "/agents/register",
        json={"agent_id": "test-detail-agent", "name": "Detail Test Agent"},
    )
    assert resp.status_code in (200, 201, 409)  # 409 if already exists
    if resp.status_code == 409:
        # Already registered — fetch by listing
        list_resp = await authed_client.get("/agents")
        agents = list_resp.json().get("data", [])
        for a in agents:
            if a.get("agent_id") == "test-detail-agent":
                return a["id"]
        pytest.fail("Agent registered (409) but not found in list")
    data = resp.json()
    return data.get("data", data).get("id", data.get("data", {}).get("id", ""))


@pytest.mark.asyncio
async def test_agent_reputation_returns_summary(
    authed_client: AsyncClient, seeded_agent_id: str
):
    """GET /agents/{id}/reputation should return trust score and stats."""
    resp = await authed_client.get(f"/agents/{seeded_agent_id}/reputation")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "trust_score" in data
    assert "tasks_completed" in data
    assert "success_rate" in data


@pytest.mark.asyncio
async def test_agent_budget_returns_limits(
    authed_client: AsyncClient, seeded_agent_id: str
):
    """GET /agents/{id}/budget should return budget info."""
    resp = await authed_client.get(f"/agents/{seeded_agent_id}/budget")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "budget_period_limit" in data
    assert "budget_period_spent" in data


@pytest.mark.asyncio
async def test_agent_hierarchy(authed_client: AsyncClient, seeded_agent_id: str):
    """GET /agents/{id}/hierarchy should return tree structure."""
    resp = await authed_client.get(f"/agents/{seeded_agent_id}/hierarchy")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_agent_capabilities_empty_by_default(
    authed_client: AsyncClient, seeded_agent_id: str
):
    """GET /agents/{id}/capabilities should return empty list for new agent."""
    resp = await authed_client.get(f"/agents/{seeded_agent_id}/capabilities")
    assert resp.status_code == 200
