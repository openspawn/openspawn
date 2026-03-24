"""Tests for Linear ↔ OpenSpawn two-way sync.

Covers:
- Webhook payload parsing for each event type
- Status mapping in both directions
- Task creation from Linear issue
- Task update from Linear issue update
- Task cancellation from Linear issue removal
- Comment sync from Linear
- OpenSpawn → Linear push operations (mocked)
- Idempotency (re-processing same webhook is safe)
- Edge cases (missing fields, unmapped statuses, etc.)
"""

from __future__ import annotations

import hashlib
import hmac
import uuid
from typing import Any
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.integrations.linear.client import LinearClient
from app.integrations.linear.status_map import (
    linear_to_openspawn,
    openspawn_to_linear,
)
from app.integrations.linear.sync import (
    TARGET_TYPE_TASK,
    _find_link_by_target,
    _get_or_create_system_agent,
    handle_webhook_event,
    push_task_comment,
    push_task_created,
    push_task_transition,
)
from app.models.enums import TaskStatus
from app.models.integration import LinearConnection
from app.models.task import Task, TaskComment

# ═══════════════════════════════════════════════
# Fixtures
# ═══════════════════════════════════════════════

WEBHOOK_SECRET = "test-secret-key-123"
API_KEY = "lin_api_test_key"
ORG_ID = uuid.uuid4()
TEAM_ID = "team-abc-123"


def _make_signature(body: bytes, secret: str = WEBHOOK_SECRET) -> str:
    return hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


def _issue_payload(
    action: str = "create",
    issue_id: str | None = None,
    title: str = "Test Issue",
    description: str = "A test issue",
    state_name: str = "Todo",
    assignee: dict | None = None,
    identifier: str = "LIN-42",
    url: str = "https://linear.app/team/issue/LIN-42",
) -> dict[str, Any]:
    data: dict[str, Any] = {
        "id": issue_id or str(uuid.uuid4()),
        "title": title,
        "description": description,
        "identifier": identifier,
        "url": url,
        "state": {"name": state_name},
    }
    if assignee:
        data["assignee"] = assignee
    return {
        "type": "Issue",
        "action": action,
        "data": data,
    }


def _comment_payload(
    issue_id: str,
    comment_id: str | None = None,
    body: str = "A test comment",
) -> dict[str, Any]:
    return {
        "type": "Comment",
        "action": "create",
        "data": {
            "id": comment_id or str(uuid.uuid4()),
            "body": body,
            "issue": {"id": issue_id},
        },
    }


# ═══════════════════════════════════════════════
# Status Mapping Tests
# ═══════════════════════════════════════════════


class TestStatusMapping:
    """Test status mapping between OpenSpawn and Linear."""

    def test_all_openspawn_statuses_mapped(self):
        """Every TaskStatus should have a Linear mapping."""
        for status in TaskStatus:
            result = openspawn_to_linear(status.value)
            assert result is not None, f"TaskStatus.{status.name} has no Linear mapping"

    def test_openspawn_to_linear_defaults(self):
        assert openspawn_to_linear("backlog") == "Backlog"
        assert openspawn_to_linear("todo") == "Todo"
        assert openspawn_to_linear("in_progress") == "In Progress"
        assert openspawn_to_linear("review") == "In Review"
        assert openspawn_to_linear("done") == "Done"
        assert openspawn_to_linear("cancelled") == "Cancelled"
        assert openspawn_to_linear("blocked") == "Blocked"

    def test_linear_to_openspawn_defaults(self):
        assert linear_to_openspawn("Backlog") == "backlog"
        assert linear_to_openspawn("Todo") == "todo"
        assert linear_to_openspawn("In Progress") == "in_progress"
        assert linear_to_openspawn("In Review") == "review"
        assert linear_to_openspawn("Done") == "done"
        assert linear_to_openspawn("Cancelled") == "cancelled"
        assert linear_to_openspawn("Blocked") == "blocked"

    def test_linear_to_openspawn_case_insensitive(self):
        assert linear_to_openspawn("backlog") == "backlog"
        assert linear_to_openspawn("BACKLOG") == "backlog"
        assert linear_to_openspawn("in progress") == "in_progress"
        assert linear_to_openspawn("IN PROGRESS") == "in_progress"

    def test_linear_aliases(self):
        """Linear uses various state names across teams."""
        assert linear_to_openspawn("Triage") == "backlog"
        assert linear_to_openspawn("Unstarted") == "todo"
        assert linear_to_openspawn("Started") == "in_progress"
        assert linear_to_openspawn("Completed") == "done"
        assert linear_to_openspawn("Canceled") == "cancelled"  # US spelling

    def test_custom_map_override(self):
        custom = {"in_progress": "Working On It"}
        assert openspawn_to_linear("in_progress", custom) == "Working On It"
        # Others still use defaults
        assert openspawn_to_linear("done", custom) == "Done"

    def test_custom_linear_to_openspawn_override(self):
        custom = {"wip": "in_progress"}
        assert linear_to_openspawn("WIP", custom) == "in_progress"

    def test_unknown_status_returns_none(self):
        assert openspawn_to_linear("nonexistent") is None
        assert linear_to_openspawn("NonexistentState") is None


# ═══════════════════════════════════════════════
# Webhook Integration Tests (via HTTP)
# ═══════════════════════════════════════════════


@pytest.fixture(autouse=True)
def _sqlite_env(tmp_path):
    """Point at a temp SQLite file for all tests in this module."""
    import os
    from unittest.mock import patch as sync_patch

    db_path = tmp_path / "test.db"
    env = {
        "AUTH_MODE": "none",
        "DATABASE_URL": f"sqlite+aiosqlite:///{db_path}",
        "REDIS_URL": "",
    }
    with sync_patch.dict(os.environ, env, clear=False):
        from importlib import reload

        import app.config
        import app.database

        reload(app.config)
        reload(app.database)
        yield
        reload(app.config)
        reload(app.database)


@pytest.fixture
async def seeded_db():
    """Set up tables with org, agent, and Linear connection."""
    from app.database import async_session, create_tables

    await create_tables()

    async with async_session() as db:
        from app.models.organization import Organization

        org = Organization(
            id=ORG_ID,
            name="Test Org",
            slug="test-org",
            task_prefix="TST",
            next_task_number=1,
        )
        db.add(org)
        await db.flush()

        from app.models.agent import Agent

        agent = Agent(
            org_id=ORG_ID,
            agent_id="test-agent",
            name="Test Agent",
            role="worker",
            status="active",
            hmac_secret_enc=b"test-secret-bytes",
            metadata_={},
        )
        db.add(agent)
        await db.flush()

        linear_conn = LinearConnection(
            org_id=ORG_ID,
            team_id=TEAM_ID,
            name="Test Linear",
            webhook_secret=WEBHOOK_SECRET,
            api_key=API_KEY,
            team_filter=[],
            sync_config={},
            enabled=True,
        )
        db.add(linear_conn)
        await db.commit()

        yield db, org, agent, linear_conn


# ═══════════════════════════════════════════════
# Sync Unit Tests
# ═══════════════════════════════════════════════


class TestWebhookIssueCreated:
    """Test Issue.create webhook → task creation."""

    @pytest.mark.asyncio
    async def test_creates_task_from_issue(self, seeded_db):
        db, _org, _agent, conn = seeded_db
        issue_id = str(uuid.uuid4())
        payload = _issue_payload(action="create", issue_id=issue_id, title="New Feature")

        result = await handle_webhook_event(db, conn, payload)

        assert result["handled"] is True
        assert result["action"] == "task_created"
        assert "task_id" in result

        # Verify task was created

        task = await db.get(Task, uuid.UUID(result["task_id"]))
        assert task is not None
        assert task.title == "New Feature"
        assert task.status == TaskStatus.TODO.value
        assert task.metadata_["linear_issue_id"] == issue_id

    @pytest.mark.asyncio
    async def test_idempotent_issue_create(self, seeded_db):
        db, _org, _agent, conn = seeded_db
        issue_id = str(uuid.uuid4())
        payload = _issue_payload(action="create", issue_id=issue_id)

        result1 = await handle_webhook_event(db, conn, payload)
        result2 = await handle_webhook_event(db, conn, payload)

        assert result1["action"] == "task_created"
        assert result2["action"] == "already_linked"
        assert result1["task_id"] == result2["task_id"]

    @pytest.mark.asyncio
    async def test_status_mapped_on_create(self, seeded_db):
        db, _org, _agent, conn = seeded_db
        payload = _issue_payload(action="create", state_name="In Progress")

        result = await handle_webhook_event(db, conn, payload)
        task = await db.get(Task, uuid.UUID(result["task_id"]))
        assert task.status == TaskStatus.IN_PROGRESS.value

    @pytest.mark.asyncio
    async def test_missing_issue_id(self, seeded_db):
        db, _org, _agent, conn = seeded_db
        payload = {"type": "Issue", "action": "create", "data": {}}

        result = await handle_webhook_event(db, conn, payload)
        assert result["handled"] is False


class TestWebhookIssueUpdated:
    """Test Issue.update webhook → task update."""

    @pytest.mark.asyncio
    async def test_updates_task_title(self, seeded_db):
        db, _org, _agent, conn = seeded_db
        issue_id = str(uuid.uuid4())

        # Create first
        create_payload = _issue_payload(action="create", issue_id=issue_id, title="Original")
        create_result = await handle_webhook_event(db, conn, create_payload)

        # Update
        update_payload = _issue_payload(
            action="update", issue_id=issue_id, title="Updated Title"
        )
        update_result = await handle_webhook_event(db, conn, update_payload)

        assert update_result["handled"] is True
        assert "title" in update_result["fields"]

        task = await db.get(Task, uuid.UUID(create_result["task_id"]))
        assert task.title == "Updated Title"

    @pytest.mark.asyncio
    async def test_updates_task_status(self, seeded_db):
        db, _org, _agent, conn = seeded_db
        issue_id = str(uuid.uuid4())

        create_payload = _issue_payload(action="create", issue_id=issue_id)
        create_result = await handle_webhook_event(db, conn, create_payload)

        update_payload = _issue_payload(
            action="update", issue_id=issue_id, state_name="Done"
        )
        await handle_webhook_event(db, conn, update_payload)

        task = await db.get(Task, uuid.UUID(create_result["task_id"]))
        assert task.status == TaskStatus.DONE.value
        assert task.completed_at is not None

    @pytest.mark.asyncio
    async def test_updates_description(self, seeded_db):
        db, _org, _agent, conn = seeded_db
        issue_id = str(uuid.uuid4())

        create_payload = _issue_payload(action="create", issue_id=issue_id)
        create_result = await handle_webhook_event(db, conn, create_payload)

        update_payload = _issue_payload(
            action="update", issue_id=issue_id, description="New description"
        )
        update_result = await handle_webhook_event(db, conn, update_payload)

        assert "description" in update_result["fields"]
        task = await db.get(Task, uuid.UUID(create_result["task_id"]))
        assert task.description == "New description"

    @pytest.mark.asyncio
    async def test_update_unlinked_issue_creates_task(self, seeded_db):
        """Update for an unknown issue should auto-create if configured."""
        db, _org, _agent, conn = seeded_db
        payload = _issue_payload(action="update", title="Auto-linked Issue")

        result = await handle_webhook_event(db, conn, payload)
        assert result["handled"] is True
        assert result["action"] == "task_created"

    @pytest.mark.asyncio
    async def test_no_change_update(self, seeded_db):
        """Update with same data should be a no-op."""
        db, _org, _agent, conn = seeded_db
        issue_id = str(uuid.uuid4())

        create_payload = _issue_payload(
            action="create", issue_id=issue_id, title="Same", state_name="Todo"
        )
        await handle_webhook_event(db, conn, create_payload)

        update_payload = _issue_payload(
            action="update", issue_id=issue_id, title="Same", state_name="Todo"
        )
        result = await handle_webhook_event(db, conn, update_payload)
        assert result["fields"] == []


class TestWebhookIssueRemoved:
    """Test Issue.remove webhook → task cancellation."""

    @pytest.mark.asyncio
    async def test_cancels_linked_task(self, seeded_db):
        db, _org, _agent, conn = seeded_db
        issue_id = str(uuid.uuid4())

        create_payload = _issue_payload(action="create", issue_id=issue_id)
        create_result = await handle_webhook_event(db, conn, create_payload)

        remove_payload = {"type": "Issue", "action": "remove", "data": {"id": issue_id}}
        remove_result = await handle_webhook_event(db, conn, remove_payload)

        assert remove_result["handled"] is True
        assert remove_result["action"] == "task_cancelled"

        task = await db.get(Task, uuid.UUID(create_result["task_id"]))
        assert task.status == TaskStatus.CANCELLED.value
        assert task.metadata_["cancelled_reason"] == "linear_issue_removed"

    @pytest.mark.asyncio
    async def test_remove_unlinked_issue(self, seeded_db):
        db, _org, _agent, conn = seeded_db
        payload = {"type": "Issue", "action": "remove", "data": {"id": str(uuid.uuid4())}}

        result = await handle_webhook_event(db, conn, payload)
        assert result["handled"] is False

    @pytest.mark.asyncio
    async def test_remove_already_cancelled(self, seeded_db):
        """Re-removing should be idempotent."""
        db, _org, _agent, conn = seeded_db
        issue_id = str(uuid.uuid4())

        await handle_webhook_event(db, conn, _issue_payload(action="create", issue_id=issue_id))

        remove_payload = {"type": "Issue", "action": "remove", "data": {"id": issue_id}}
        await handle_webhook_event(db, conn, remove_payload)
        result = await handle_webhook_event(db, conn, remove_payload)

        assert result["handled"] is True


class TestWebhookCommentCreated:
    """Test Comment.create webhook → task comment."""

    @pytest.mark.asyncio
    async def test_creates_comment_on_linked_task(self, seeded_db):
        db, _org, _agent, conn = seeded_db
        issue_id = str(uuid.uuid4())

        create_result = await handle_webhook_event(
            db, conn, _issue_payload(action="create", issue_id=issue_id)
        )
        task_id = create_result["task_id"]

        comment_payload = _comment_payload(issue_id=issue_id, body="Great work!")
        result = await handle_webhook_event(db, conn, comment_payload)

        assert result["handled"] is True
        assert result["action"] == "comment_created"

        # Verify comment exists on task
        from sqlalchemy import select

        comments = (
            await db.execute(
                select(TaskComment).where(TaskComment.task_id == uuid.UUID(task_id))
            )
        ).scalars().all()
        assert len(comments) == 1
        assert "[Linear] Great work!" in comments[0].body

    @pytest.mark.asyncio
    async def test_idempotent_comment(self, seeded_db):
        db, _org, _agent, conn = seeded_db
        issue_id = str(uuid.uuid4())
        comment_id = str(uuid.uuid4())

        await handle_webhook_event(
            db, conn, _issue_payload(action="create", issue_id=issue_id)
        )

        payload = _comment_payload(issue_id=issue_id, comment_id=comment_id)
        result1 = await handle_webhook_event(db, conn, payload)
        result2 = await handle_webhook_event(db, conn, payload)

        assert result1["action"] == "comment_created"
        assert result2["action"] == "comment_already_linked"

    @pytest.mark.asyncio
    async def test_comment_on_unlinked_issue(self, seeded_db):
        db, _org, _agent, conn = seeded_db
        payload = _comment_payload(issue_id=str(uuid.uuid4()))

        result = await handle_webhook_event(db, conn, payload)
        assert result["handled"] is False

    @pytest.mark.asyncio
    async def test_comment_missing_body(self, seeded_db):
        db, _org, _agent, conn = seeded_db
        payload = {
            "type": "Comment",
            "action": "create",
            "data": {"id": str(uuid.uuid4()), "body": "", "issue": {"id": str(uuid.uuid4())}},
        }
        result = await handle_webhook_event(db, conn, payload)
        assert result["handled"] is False


class TestUnhandledEvents:
    """Test that unknown event types are gracefully handled."""

    @pytest.mark.asyncio
    async def test_unknown_event_type(self, seeded_db):
        db, _org, _agent, conn = seeded_db
        payload = {"type": "Project", "action": "create", "data": {}}

        result = await handle_webhook_event(db, conn, payload)
        assert result["handled"] is False
        assert "unhandled" in result["reason"]


# ═══════════════════════════════════════════════
# Push Tests (OpenSpawn → Linear, mocked API)
# ═══════════════════════════════════════════════


class TestPushTaskCreated:
    """Test pushing new OpenSpawn tasks to Linear."""

    @pytest.mark.asyncio
    async def test_push_creates_linear_issue(self, seeded_db):
        db, _org, _agent, conn = seeded_db

        # Create a task directly
        system_agent_id = await _get_or_create_system_agent(db, _org.id)
        task = Task(
            org_id=_org.id,
            identifier="TST-100",
            title="Push Test Task",
            description="Test description",
            status=TaskStatus.TODO.value,
            priority="normal",
            creator_id=system_agent_id,
            metadata_={},
        )
        db.add(task)
        await db.flush()

        mock_issue = {
            "id": "linear-issue-abc",
            "identifier": "LIN-99",
            "title": "Push Test Task",
            "url": "https://linear.app/issue/LIN-99",
            "state": {"name": "Todo"},
        }

        with patch.object(LinearClient, "create_issue", new_callable=AsyncMock) as mock_create:
            mock_create.return_value = mock_issue
            result = await push_task_created(db, task, conn)

        assert result is not None
        assert result["id"] == "linear-issue-abc"
        mock_create.assert_called_once_with(
            team_id=TEAM_ID,
            title="Push Test Task",
            description="Test description",
            state_name="Todo",
        )

        # Verify link was created
        link = await _find_link_by_target(db, _org.id, TARGET_TYPE_TASK, task.id)
        assert link is not None
        assert link.source_id == "linear-issue-abc"

    @pytest.mark.asyncio
    async def test_skip_push_for_linear_originated_task(self, seeded_db):
        """Tasks from Linear webhooks should NOT be pushed back."""
        db, _org, _agent, conn = seeded_db
        system_agent_id = await _get_or_create_system_agent(db, _org.id)

        task = Task(
            org_id=_org.id,
            identifier="TST-101",
            title="From Linear",
            status=TaskStatus.TODO.value,
            priority="normal",
            creator_id=system_agent_id,
            metadata_={"source": "linear_webhook"},
        )
        db.add(task)
        await db.flush()

        result = await push_task_created(db, task, conn)
        assert result is None

    @pytest.mark.asyncio
    async def test_skip_push_without_api_key(self, seeded_db):
        db, _org, _agent, conn = seeded_db
        conn.api_key = None

        system_agent_id = await _get_or_create_system_agent(db, _org.id)
        task = Task(
            org_id=_org.id,
            identifier="TST-102",
            title="No API Key",
            status=TaskStatus.TODO.value,
            priority="normal",
            creator_id=system_agent_id,
            metadata_={},
        )
        db.add(task)
        await db.flush()

        result = await push_task_created(db, task, conn)
        assert result is None


class TestPushTaskTransition:
    """Test pushing status transitions to Linear."""

    @pytest.mark.asyncio
    async def test_push_status_change(self, seeded_db):
        db, _org, _agent, conn = seeded_db
        issue_id = str(uuid.uuid4())

        # Create linked task via webhook
        create_result = await handle_webhook_event(
            db, conn, _issue_payload(action="create", issue_id=issue_id)
        )
        task = await db.get(Task, uuid.UUID(create_result["task_id"]))

        with patch.object(LinearClient, "update_issue", new_callable=AsyncMock) as mock_update:
            mock_update.return_value = {"id": issue_id}
            result = await push_task_transition(db, task, "done", conn)

        assert result is not None
        mock_update.assert_called_once_with(
            issue_id=issue_id,
            state_name="Done",
            team_id=TEAM_ID,
        )

    @pytest.mark.asyncio
    async def test_skip_transition_for_unlinked_task(self, seeded_db):
        db, _org, _agent, conn = seeded_db
        system_agent_id = await _get_or_create_system_agent(db, _org.id)

        task = Task(
            org_id=_org.id,
            identifier="TST-200",
            title="Unlinked",
            status=TaskStatus.TODO.value,
            priority="normal",
            creator_id=system_agent_id,
            metadata_={},
        )
        db.add(task)
        await db.flush()

        result = await push_task_transition(db, task, "done", conn)
        assert result is None


class TestPushTaskComment:
    """Test pushing comments to Linear."""

    @pytest.mark.asyncio
    async def test_push_comment(self, seeded_db):
        db, _org, _agent, conn = seeded_db
        issue_id = str(uuid.uuid4())

        create_result = await handle_webhook_event(
            db, conn, _issue_payload(action="create", issue_id=issue_id)
        )
        task = await db.get(Task, uuid.UUID(create_result["task_id"]))
        system_agent_id = await _get_or_create_system_agent(db, _org.id)

        comment = TaskComment(
            org_id=_org.id,
            task_id=task.id,
            author_id=system_agent_id,
            body="This is a test comment",
        )
        db.add(comment)
        await db.flush()

        mock_result = {"id": "linear-comment-xyz", "body": "[OpenSpawn] This is a test comment"}
        with patch.object(LinearClient, "create_comment", new_callable=AsyncMock) as mock_create:
            mock_create.return_value = mock_result
            result = await push_task_comment(db, task, comment, conn)

        assert result is not None
        mock_create.assert_called_once_with(
            issue_id=issue_id,
            body="[OpenSpawn] This is a test comment",
        )

    @pytest.mark.asyncio
    async def test_skip_push_linear_originated_comment(self, seeded_db):
        """Comments from Linear (prefixed [Linear]) should not be pushed back."""
        db, _org, _agent, conn = seeded_db
        issue_id = str(uuid.uuid4())

        create_result = await handle_webhook_event(
            db, conn, _issue_payload(action="create", issue_id=issue_id)
        )
        task = await db.get(Task, uuid.UUID(create_result["task_id"]))
        system_agent_id = await _get_or_create_system_agent(db, _org.id)

        comment = TaskComment(
            org_id=_org.id,
            task_id=task.id,
            author_id=system_agent_id,
            body="[Linear] Original comment",
        )
        db.add(comment)
        await db.flush()

        result = await push_task_comment(db, task, comment, conn)
        assert result is None


# ═══════════════════════════════════════════════
# System Agent Tests
# ═══════════════════════════════════════════════


class TestSystemAgent:
    @pytest.mark.asyncio
    async def test_creates_agent_on_first_call(self, seeded_db):
        db, _org, _agent, _conn = seeded_db
        agent_id = await _get_or_create_system_agent(db, _org.id)
        assert agent_id is not None

    @pytest.mark.asyncio
    async def test_reuses_existing_agent(self, seeded_db):
        db, _org, _agent, _conn = seeded_db
        id1 = await _get_or_create_system_agent(db, _org.id)
        id2 = await _get_or_create_system_agent(db, _org.id)
        assert id1 == id2


# ═══════════════════════════════════════════════
# Linear Client Tests (mocked HTTP)
# ═══════════════════════════════════════════════


class TestLinearClient:
    @pytest.mark.asyncio
    async def test_create_issue_success(self):
        client = LinearClient("test-key")
        mock_response = {
            "data": {
                "issueCreate": {
                    "success": True,
                    "issue": {
                        "id": "issue-123",
                        "identifier": "LIN-1",
                        "title": "Test",
                        "url": "https://linear.app/issue/LIN-1",
                        "state": {"name": "Todo"},
                        "assignee": None,
                    },
                }
            }
        }
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_req:
            mock_req.return_value = mock_response["data"]
            result = await client.create_issue("team-1", "Test")
            assert result["id"] == "issue-123"

    @pytest.mark.asyncio
    async def test_create_comment_success(self):
        client = LinearClient("test-key")
        mock_response = {
            "commentCreate": {
                "success": True,
                "comment": {
                    "id": "comment-123",
                    "body": "Test comment",
                    "user": {"id": "user-1", "displayName": "Test"},
                },
            }
        }
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_req:
            mock_req.return_value = mock_response
            result = await client.create_comment("issue-1", "Test comment")
            assert result["id"] == "comment-123"

    @pytest.mark.asyncio
    async def test_test_connection(self):
        client = LinearClient("test-key")
        with patch.object(client, "_request", new_callable=AsyncMock) as mock_req:
            mock_req.return_value = {"viewer": {"id": "user-1", "displayName": "Test User"}}
            result = await client.test_connection()
            assert "viewer" in result


# ═══════════════════════════════════════════════
# Webhook Signature Verification (HTTP-level)
# ═══════════════════════════════════════════════


class TestWebhookSignature:
    @pytest.mark.asyncio
    async def test_missing_signature_returns_401(self):
        from app.database import create_tables

        await create_tables()
        from app.main import app as fastapi_app

        transport = ASGITransport(app=fastapi_app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/integrations/linear/webhook",
                content=b'{"type":"Issue","action":"create","data":{}}',
                headers={"Content-Type": "application/json"},
            )
            assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_invalid_signature_returns_401(self):
        from app.database import create_tables

        await create_tables()
        from app.main import app as fastapi_app

        transport = ASGITransport(app=fastapi_app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/integrations/linear/webhook",
                content=b'{"type":"Issue","action":"create","data":{}}',
                headers={
                    "Content-Type": "application/json",
                    "linear-signature": "invalid-sig",
                },
            )
            assert resp.status_code == 401
