"""Tests for dashboard event stream integration."""
import os
from collections.abc import AsyncGenerator
from unittest.mock import patch

import pytest
from httpx import ASGITransport, AsyncClient


@pytest.fixture(autouse=True)
def _auth_mode_none():
    """Use AUTH_MODE=none so endpoints are accessible without JWT setup."""
    with patch.dict(os.environ, {"AUTH_MODE": "none"}):
        from importlib import reload

        import app.config

        reload(app.config)
        yield
        reload(app.config)


@pytest.fixture
async def auth_none_client() -> AsyncGenerator[AsyncClient]:
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_events_list_endpoint(auth_none_client: AsyncClient):
    """GET /events should return a paginated list."""
    resp = await auth_none_client.get("/events")
    assert resp.status_code == 200
    body = resp.json()
    # Should have data key with list
    assert "data" in body
    assert isinstance(body["data"], list)


@pytest.mark.asyncio
async def test_events_created_on_task_transition(auth_none_client: AsyncClient):
    """Creating and transitioning a task should produce events."""
    # Create task
    resp = await auth_none_client.post(
        "/tasks",
        json={"title": "Test task for events", "priority": "medium"},
    )
    assert resp.status_code == 200
    task_id = resp.json()["data"]["id"]

    # Transition
    resp = await auth_none_client.post(
        f"/tasks/{task_id}/transition",
        json={"status": "in_progress"},
    )
    assert resp.status_code in (200, 201, 204)

    # Check events were created
    resp = await auth_none_client.get("/events")
    assert resp.status_code == 200
    events = resp.json()["data"]
    assert len(events) > 0


@pytest.mark.asyncio
async def test_sse_token_endpoint(auth_none_client: AsyncClient):
    """SSE token endpoint should return a valid JWT."""
    resp = await auth_none_client.post("/events/token")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "token" in data
    assert "expires_in" in data
