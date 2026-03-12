"""Smoke tests for all CRUD endpoint routes — verifies routing and auth gates."""

import pytest
from httpx import AsyncClient


@pytest.fixture
def auth_headers() -> dict[str, str]:
    """Headers that will fail auth but prove the route exists (401 vs 404)."""
    return {"Authorization": "Bearer osp_invalid_key"}


# --- Agents ---


async def test_list_agents_requires_auth(client: AsyncClient) -> None:
    r = await client.get("/agents")
    assert r.status_code == 401


async def test_register_agent_requires_auth(client: AsyncClient) -> None:
    r = await client.post("/agents/register", json={"agent_id": "test", "name": "Test"})
    assert r.status_code == 401


async def test_get_agent_requires_auth(client: AsyncClient) -> None:
    r = await client.get("/agents/00000000-0000-0000-0000-000000000001")
    assert r.status_code == 401


# --- Tasks ---


async def test_list_tasks_requires_auth(client: AsyncClient) -> None:
    r = await client.get("/tasks")
    assert r.status_code == 401


async def test_create_task_requires_auth(client: AsyncClient) -> None:
    r = await client.post("/tasks", json={"title": "Test task"})
    assert r.status_code == 401


async def test_get_task_requires_auth(client: AsyncClient) -> None:
    r = await client.get("/tasks/00000000-0000-0000-0000-000000000001")
    assert r.status_code == 401


# --- Credits ---


async def test_credits_balance_requires_auth(client: AsyncClient) -> None:
    r = await client.get("/credits/balance")
    assert r.status_code == 401


async def test_credits_spend_requires_auth(client: AsyncClient) -> None:
    r = await client.post("/credits/spend", json={"amount": 10, "reason": "test"})
    assert r.status_code == 401


async def test_credits_history_requires_auth(client: AsyncClient) -> None:
    r = await client.get("/credits/history")
    assert r.status_code == 401


async def test_credits_analytics_requires_auth(client: AsyncClient) -> None:
    r = await client.get("/credits/analytics/stats")
    assert r.status_code == 401


# --- Messages ---


async def test_list_channels_requires_auth(client: AsyncClient) -> None:
    r = await client.get("/channels")
    assert r.status_code == 401


async def test_create_channel_requires_auth(client: AsyncClient) -> None:
    r = await client.post("/channels", json={"name": "test", "type": "general"})
    assert r.status_code == 401


async def test_send_message_requires_auth(client: AsyncClient) -> None:
    r = await client.post(
        "/messages",
        json={
            "channel_id": "00000000-0000-0000-0000-000000000001",
            "body": "hello",
        },
    )
    assert r.status_code == 401


# --- Events ---


async def test_list_events_requires_auth(client: AsyncClient) -> None:
    r = await client.get("/events")
    assert r.status_code == 401


async def test_get_event_requires_auth(client: AsyncClient) -> None:
    r = await client.get("/events/00000000-0000-0000-0000-000000000001")
    assert r.status_code == 401


# --- Escalations ---


async def test_open_escalations_requires_auth(client: AsyncClient) -> None:
    r = await client.get("/tasks/escalations/open")
    assert r.status_code == 401


# --- Consensus ---


async def test_pending_consensus_requires_auth(client: AsyncClient) -> None:
    r = await client.get("/tasks/consensus/pending")
    assert r.status_code == 401


async def test_create_consensus_requires_auth(client: AsyncClient) -> None:
    r = await client.post(
        "/tasks/consensus",
        json={"type": "CUSTOM", "title": "Test"},
    )
    assert r.status_code == 401


# --- DM ---


async def test_send_dm_requires_auth(client: AsyncClient) -> None:
    r = await client.post(
        "/dm",
        json={
            "recipient_id": "00000000-0000-0000-0000-000000000001",
            "body": "hello",
        },
    )
    assert r.status_code == 401
