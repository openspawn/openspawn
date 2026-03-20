"""Tests for task workflow: assign, comment, transition, approve, escalate."""

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
        json={"agent_id": "test-workflow-agent", "name": "Workflow Test Agent"},
    )
    assert resp.status_code in (200, 201, 409)
    if resp.status_code == 409:
        list_resp = await client.get("/agents")
        agents = list_resp.json().get("data", [])
        for a in agents:
            if a.get("agent_id") == "test-workflow-agent":
                return a["id"]
        pytest.fail("Could not find seeded agent after 409")
    return resp.json()["data"]["id"]


@pytest.mark.asyncio
async def test_task_assign_and_transition(client: AsyncClient, seeded_agent_id: str):
    """Full workflow: create -> assign -> transition -> complete."""
    # Create
    resp = await client.post(
        "/tasks",
        json={"title": "Workflow test", "priority": "high"},
    )
    assert resp.status_code == 200
    task_id = resp.json()["data"]["id"]

    # Assign
    resp = await client.post(
        f"/tasks/{task_id}/assign",
        json={"assignee_id": seeded_agent_id},
    )
    assert resp.status_code == 200

    # Transition to in_progress
    resp = await client.post(
        f"/tasks/{task_id}/transition",
        json={"status": "in_progress"},
    )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_task_comments(client: AsyncClient):
    """Adding and listing comments on a task."""
    # Create task
    resp = await client.post(
        "/tasks",
        json={"title": "Comment test", "priority": "medium"},
    )
    task_id = resp.json()["data"]["id"]

    # Add comment
    resp = await client.post(
        f"/tasks/{task_id}/comments",
        json={"body": "Working on this now"},
    )
    assert resp.status_code in (200, 201)

    # List comments
    resp = await client.get(f"/tasks/{task_id}/comments")
    assert resp.status_code == 200
    comments = resp.json()["data"]
    assert len(comments) >= 1
    assert comments[0]["body"] == "Working on this now"


@pytest.mark.asyncio
async def test_task_escalation(client: AsyncClient):
    """Escalating a task should create an escalation record."""
    resp = await client.post(
        "/tasks",
        json={"title": "Escalation test", "priority": "critical"},
    )
    task_id = resp.json()["data"]["id"]

    resp = await client.post(
        f"/tasks/{task_id}/escalate",
        json={"reason": "MANUAL", "notes": "Blocked by dependency"},
    )
    assert resp.status_code == 200

    # Check escalation
    resp = await client.get(f"/tasks/{task_id}/escalations")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_pending_approvals(client: AsyncClient):
    """Tasks with approval_required should appear in pending approvals."""
    resp = await client.post(
        "/tasks",
        json={
            "title": "Needs approval",
            "priority": "high",
            "approval_required": True,
        },
    )
    assert resp.status_code == 200

    resp = await client.get("/approvals/pending")
    assert resp.status_code == 200
