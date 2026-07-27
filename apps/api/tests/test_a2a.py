"""Tests for A2A (Agent-to-Agent) protocol endpoints."""

from __future__ import annotations

import uuid

from httpx import AsyncClient

# ---------------------------------------------------------------------------
# Auth gate tests — verify routes exist and require auth
# ---------------------------------------------------------------------------


async def test_a2a_send_requires_auth(client: AsyncClient) -> None:
    r = await client.post(
        "/a2a/send",
        json={
            "agentId": "dennis",
            "senderId": "ceo",
            "message": {
                "kind": "message",
                "messageId": "msg-1",
                "role": "user",
                "parts": [{"kind": "text", "text": "Hello"}],
            },
        },
    )
    assert r.status_code == 401


async def test_a2a_tasks_mine_requires_auth(client: AsyncClient) -> None:
    r = await client.get("/a2a/tasks/mine")
    assert r.status_code == 401


async def test_a2a_get_task_requires_auth(client: AsyncClient) -> None:
    task_id = str(uuid.uuid4())
    r = await client.get(f"/a2a/tasks/{task_id}")
    assert r.status_code == 401


async def test_a2a_complete_task_requires_auth(client: AsyncClient) -> None:
    task_id = str(uuid.uuid4())
    r = await client.post(
        f"/a2a/tasks/{task_id}/complete",
        json={
            "agentId": "dennis",
            "status": "completed",
            "result": "Done!",
        },
    )
    assert r.status_code == 401


async def test_a2a_claim_task_requires_auth(client: AsyncClient) -> None:
    task_id = str(uuid.uuid4())
    r = await client.post(f"/a2a/tasks/{task_id}/claim")
    assert r.status_code == 401


async def test_a2a_heartbeat_requires_auth(client: AsyncClient) -> None:
    r = await client.post("/a2a/agents/heartbeat")
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# Discovery endpoint (no auth required)
# ---------------------------------------------------------------------------


async def test_agent_card_returns_discovery(client: AsyncClient) -> None:
    r = await client.get("/.well-known/agent.json")
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "OpenSpawn Platform"
    assert data["version"] == "1.0"
    assert data["capabilities"]["a2a"] is True
    assert data["capabilities"]["websocket"] is True


# ---------------------------------------------------------------------------
# Pydantic model tests
# ---------------------------------------------------------------------------


def test_a2a_types_import() -> None:
    """Verify all A2A types can be imported and instantiated."""
    from app.a2a.types import (
        A2AAgentCard,
        A2ACompleteRequest,
        A2AMessage,
        A2APart,
        A2ASendRequest,
        A2ATask,
        A2ATaskStatus,
    )

    part = A2APart(kind="text", text="hello")
    assert part.kind == "text"
    assert part.text == "hello"

    msg = A2AMessage(
        messageId="msg-1",
        role="user",
        parts=[part],
    )
    assert msg.kind == "message"
    assert len(msg.parts) == 1

    status = A2ATaskStatus(
        state="submitted",
        timestamp="2026-03-26T00:00:00Z",
    )
    assert status.state == "submitted"

    task = A2ATask(
        id="task-1",
        status=status,
        messages=[msg],
    )
    assert task.id == "task-1"
    assert len(task.messages) == 1

    send = A2ASendRequest(
        agentId="dennis",
        senderId="ceo",
        message=msg,
    )
    assert send.agentId == "dennis"

    complete = A2ACompleteRequest(
        agentId="dennis",
        status="completed",
        result="All done",
    )
    assert complete.status == "completed"

    card = A2AAgentCard()
    assert card.name == "OpenSpawn Platform"


def test_a2a_task_state_literals() -> None:
    """Verify all A2A task states are accepted."""
    from app.a2a.types import A2ATaskStatus

    for state in ["submitted", "working", "input-required", "completed", "failed", "canceled"]:
        s = A2ATaskStatus(state=state, timestamp="2026-03-26T00:00:00Z")
        assert s.state == state


def test_a2a_message_roles() -> None:
    """Verify both user and agent roles work."""
    from app.a2a.types import A2AMessage, A2APart

    for role in ["user", "agent"]:
        msg = A2AMessage(
            messageId="msg-1",
            role=role,
            parts=[A2APart(kind="text", text="test")],
        )
        assert msg.role == role


# ---------------------------------------------------------------------------
# Service unit tests (state mapping)
# ---------------------------------------------------------------------------


def test_state_mapping() -> None:
    """Test OpenSpawn → A2A state mapping."""
    from app.a2a.service import _to_a2a_state

    assert _to_a2a_state("backlog") == "submitted"
    assert _to_a2a_state("todo") == "submitted"
    assert _to_a2a_state("in_progress") == "working"
    assert _to_a2a_state("review") == "working"
    assert _to_a2a_state("done") == "completed"
    assert _to_a2a_state("cancelled") == "failed"
    assert _to_a2a_state("blocked") == "input-required"
    # Unknown states default to submitted
    assert _to_a2a_state("some_unknown") == "submitted"


# ---------------------------------------------------------------------------
# WebSocket connection manager unit tests
# ---------------------------------------------------------------------------


def test_connection_manager_init() -> None:
    from app.a2a.websocket import A2AConnectionManager

    mgr = A2AConnectionManager()
    assert mgr.online_agents == []
    assert mgr.is_online("dennis") is False


# ---------------------------------------------------------------------------
# Model column tests
# ---------------------------------------------------------------------------


def test_task_model_has_a2a_fields() -> None:
    """Verify the Task model has new A2A columns."""
    from app.models.task import Task

    mapper = Task.__table__
    col_names = {c.name for c in mapper.columns}
    assert "source" in col_names
    assert "a2a_context_id" in col_names
    assert "a2a_messages" in col_names


def test_agent_model_has_a2a_fields() -> None:
    """Verify the Agent model has new A2A columns."""
    from app.models.agent import Agent

    mapper = Agent.__table__
    col_names = {c.name for c in mapper.columns}
    assert "a2a_callback_url" in col_names
    assert "a2a_skills" in col_names
    assert "last_heartbeat" in col_names
