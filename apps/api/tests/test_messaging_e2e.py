"""Tests for messaging: channels, messages, threads, DMs."""

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
async def client() -> AsyncGenerator[AsyncClient]:
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def seeded_agent_id(client: AsyncClient) -> str:
    """Register a test agent and return its UUID."""
    resp = await client.post(
        "/agents/register",
        json={"agent_id": "test-msg-agent", "name": "Messaging Test Agent"},
    )
    assert resp.status_code in (200, 201, 409)
    if resp.status_code == 409:
        list_resp = await client.get("/agents")
        agents = list_resp.json().get("data", [])
        for a in agents:
            if a.get("agent_id") == "test-msg-agent":
                return a["id"]
        pytest.fail("Agent registered (409) but not found in list")
    data = resp.json()
    return data.get("data", data).get("id", data.get("data", {}).get("id", ""))


@pytest.fixture
async def second_agent_id(client: AsyncClient) -> str:
    """Register a second agent for DM tests."""
    resp = await client.post(
        "/agents/register",
        json={"agent_id": "test-msg-agent-2", "name": "Second Agent"},
    )
    assert resp.status_code in (200, 201, 409)
    if resp.status_code == 409:
        list_resp = await client.get("/agents")
        agents = list_resp.json().get("data", [])
        for a in agents:
            if a.get("agent_id") == "test-msg-agent-2":
                return a["id"]
        pytest.fail("Agent registered (409) but not found in list")
    data = resp.json()
    return data.get("data", data).get("id", data.get("data", {}).get("id", ""))


@pytest.mark.asyncio
async def test_create_channel_and_send_message(client: AsyncClient):
    """Create channel → send message → list messages."""
    # Create channel
    resp = await client.post(
        "/channels", json={"name": "general", "type": "general"}
    )
    assert resp.status_code in (200, 201)
    channel_id = resp.json()["data"]["id"]

    # Send message
    resp = await client.post(
        "/messages",
        json={"channel_id": channel_id, "body": "Hello team!", "type": "text"},
    )
    assert resp.status_code in (200, 201)
    msg_id = resp.json()["data"]["id"]
    assert msg_id  # non-empty

    # List messages
    resp = await client.get(f"/messages?channel_id={channel_id}")
    assert resp.status_code == 200
    messages = resp.json()["data"]
    assert len(messages) >= 1
    bodies = [m["body"] for m in messages]
    assert "Hello team!" in bodies


@pytest.mark.asyncio
async def test_message_thread(client: AsyncClient):
    """Send message → reply → check thread."""
    # Create channel
    resp = await client.post(
        "/channels", json={"name": "threads-test", "type": "general"}
    )
    assert resp.status_code in (200, 201)
    channel_id = resp.json()["data"]["id"]

    # Send parent message
    resp = await client.post(
        "/messages",
        json={"channel_id": channel_id, "body": "Parent msg", "type": "text"},
    )
    assert resp.status_code in (200, 201)
    parent_id = resp.json()["data"]["id"]

    # Send reply
    resp = await client.post(
        "/messages",
        json={
            "channel_id": channel_id,
            "body": "Reply",
            "type": "text",
            "parent_message_id": parent_id,
        },
    )
    assert resp.status_code in (200, 201)

    # Get thread
    resp = await client.get(f"/messages/{parent_id}/thread")
    assert resp.status_code == 200
    thread = resp.json()["data"]
    assert isinstance(thread, list)
    assert len(thread) >= 1


@pytest.mark.asyncio
async def test_direct_message(client: AsyncClient, second_agent_id: str):
    """Send and retrieve direct messages between agents."""
    resp = await client.post(
        "/dm",
        json={"recipient_id": second_agent_id, "body": "Hey, need your help"},
    )
    assert resp.status_code in (200, 201)

    resp = await client.get(f"/dm/{second_agent_id}")
    assert resp.status_code == 200
    messages = resp.json()["data"]
    assert isinstance(messages, list)


@pytest.mark.asyncio
async def test_list_channels(client: AsyncClient):
    """Create channels and list them."""
    await client.post("/channels", json={"name": "ch-list-1", "type": "general"})
    await client.post("/channels", json={"name": "ch-list-2", "type": "task"})

    resp = await client.get("/channels")
    assert resp.status_code == 200
    channels = resp.json()["data"]
    names = [c["name"] for c in channels]
    assert "ch-list-1" in names
    assert "ch-list-2" in names


@pytest.mark.asyncio
async def test_get_single_message(client: AsyncClient):
    """Send a message and retrieve it by ID."""
    resp = await client.post(
        "/channels", json={"name": "single-msg-test", "type": "general"}
    )
    channel_id = resp.json()["data"]["id"]

    resp = await client.post(
        "/messages",
        json={"channel_id": channel_id, "body": "Unique message", "type": "text"},
    )
    msg_id = resp.json()["data"]["id"]

    resp = await client.get(f"/messages/{msg_id}")
    assert resp.status_code == 200
    assert resp.json()["data"]["body"] == "Unique message"
