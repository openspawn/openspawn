"""End-to-end autonomy dial approval test."""

from __future__ import annotations

import contextlib
import os
import uuid
from typing import TYPE_CHECKING
from unittest.mock import patch

import pytest
from httpx import ASGITransport, AsyncClient

if TYPE_CHECKING:
    from collections.abc import AsyncGenerator

_OWNER_ORG_ID = "00000000-0000-0000-0000-000000000001"
_WORKER_ID = "00000000-0000-0000-0000-000000000020"
_MANAGER_ID = "00000000-0000-0000-0000-000000000021"
_TASK_ID = "00000000-0000-0000-0000-000000000030"


@pytest.fixture(autouse=True)
def sqlite_env():
    env = {
        "AUTH_MODE": "none",
        "AUTH_JWT_SECRET": "test-secret-32-chars-long-enough!",
    }
    with patch.dict(os.environ, env, clear=False):
        from importlib import reload

        import app.config

        reload(app.config)
        yield
        reload(app.config)


@pytest.fixture
async def client(tmp_path) -> AsyncGenerator[AsyncClient]:
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
    from sqlalchemy.pool import StaticPool

    from sqlalchemy.dialects.postgresql import UUID as PG_UUID

    import app.models.approval  # noqa: F401
    import app.models.artifact  # noqa: F401
    import app.models.event_subscription  # noqa: F401
    from app.database import get_db
    from app.models.base import Base
    from app.models.compat import CompatUUID

    db_path = tmp_path / "test.db"
    engine = create_async_engine(
        f"sqlite+aiosqlite:///{db_path}",
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    originals: list[tuple[object, object]] = []
    for table in Base.metadata.tables.values():
        for col in table.columns:
            if col.computed is not None:
                originals.append((col, ("computed", col.computed, col.server_default)))
                col.computed = None  # type: ignore[assignment]
                col.server_default = None
            if isinstance(col.type, PG_UUID):
                originals.append((col, ("type", col.type)))
                col.type = CompatUUID()  # type: ignore[assignment]

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async def _override_get_db():  # type: ignore[no-untyped-def]
        async with session_factory() as session:
            yield session

    from app.main import app

    app.dependency_overrides[get_db] = _override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as c:
        yield c

    app.dependency_overrides.pop(get_db, None)
    await engine.dispose()

    for col, saved in originals:
        if saved[0] == "computed":
            col.computed = saved[1]  # type: ignore[union-attr]
            col.server_default = saved[2]  # type: ignore[union-attr]
        elif saved[0] == "type":
            col.type = saved[1]  # type: ignore[union-attr]


@contextlib.contextmanager
def as_agent(agent_id: str, org_id: str, name: str, level: int, agent_id_str: str = "test-agent"):
    """Override require_auth to return an AuthenticatedAgent."""
    from app.auth.dependencies import require_auth
    from app.auth.schemas import AuthenticatedAgent
    from app.main import app

    original = app.dependency_overrides.get(require_auth)
    app.dependency_overrides[require_auth] = lambda: AuthenticatedAgent(
        id=uuid.UUID(agent_id),
        org_id=uuid.UUID(org_id),
        agent_id=agent_id_str,
        name=name,
        role="worker",
        mode="worker",
        level=level,
    )
    try:
        yield
    finally:
        if original:
            app.dependency_overrides[require_auth] = original
        else:
            app.dependency_overrides.pop(require_auth, None)


@pytest.fixture
async def seeded_client(client: AsyncClient) -> AsyncClient:
    from app.database import get_db
    from app.main import app
    from app.models.agent import Agent
    from app.models.organization import Organization
    from app.models.task import Task

    override_fn = app.dependency_overrides[get_db]
    db_gen = override_fn()
    db = await db_gen.__anext__()

    org = Organization(
        id=uuid.UUID(_OWNER_ORG_ID),
        name="TestOrg",
        slug="test",
        task_prefix="T",
        next_task_number=1,
    )
    db.add(org)
    await db.flush()

    worker = Agent(
        id=uuid.UUID(_WORKER_ID),
        org_id=org.id,
        agent_id="agent-worker",
        name="Worker",
        level=3,
        default_autonomy_level=3,
        model="sonnet",
        status="active",
        role="worker",
        mode="worker",
        hmac_secret_enc=b"\x00" * 32,
    )
    db.add(worker)
    await db.flush()

    manager = Agent(
        id=uuid.UUID(_MANAGER_ID),
        org_id=org.id,
        agent_id="agent-manager",
        name="Manager",
        level=8,
        default_autonomy_level=8,
        model="sonnet",
        status="active",
        role="manager",
        mode="worker",
        hmac_secret_enc=b"\x00" * 32,
    )
    db.add(manager)
    await db.flush()

    task = Task(
        id=uuid.UUID(_TASK_ID),
        org_id=org.id,
        identifier="T-1",
        title="Build Feature",
        status="in_progress",
        priority="normal",
        creator_id=worker.id,
        approval_required=False,
    )
    db.add(task)
    await db.commit()

    with contextlib.suppress(StopAsyncIteration):
        await db_gen.__anext__()

    return client


@pytest.mark.asyncio
async def test_task_transition_gate(seeded_client: AsyncClient):
    c = seeded_client

    # 1. Worker transitions to review (risk=2, autonomy=3) → allowed
    with as_agent(_WORKER_ID, _OWNER_ORG_ID, "Worker", 3, "agent-worker"):
        r = await c.post(
            f"/tasks/{_TASK_ID}/transition",
            json={"status": "review"},
        )
        assert r.status_code == 200

    # 2. Worker transitions review→done (risk=3, autonomy=3) → allowed (3 is not > 3)
    with as_agent(_WORKER_ID, _OWNER_ORG_ID, "Worker", 3, "agent-worker"):
        r = await c.post(
            f"/tasks/{_TASK_ID}/transition",
            json={"status": "done"},
        )
        assert r.status_code == 200, r.json()

    # 3. Reset done→in_progress for next test
    with as_agent(_WORKER_ID, _OWNER_ORG_ID, "Worker", 3, "agent-worker"):
        r = await c.post(
            f"/tasks/{_TASK_ID}/transition",
            json={"status": "in_progress"},
        )
        assert r.status_code == 200

    # 3. Worker transitions to cancelled (risk=5, autonomy=3) → 403 gated
    with as_agent(_WORKER_ID, _OWNER_ORG_ID, "Worker", 3, "agent-worker"):
        r = await c.post(
            f"/tasks/{_TASK_ID}/transition",
            json={"status": "cancelled"},
        )
        assert r.status_code == 403
        detail = r.json()["detail"]
        approval_id = detail["approval_id"]
        assert detail["risk_level"] == 5
        assert detail["autonomy_level"] == 3

    # 4. Retry same transition → same approval_id (idempotency)
    with as_agent(_WORKER_ID, _OWNER_ORG_ID, "Worker", 3, "agent-worker"):
        r = await c.post(
            f"/tasks/{_TASK_ID}/transition",
            json={"status": "cancelled"},
        )
        assert r.status_code == 403
        assert r.json()["detail"]["approval_id"] == approval_id

    # 5. GET pending approvals
    with as_agent(_WORKER_ID, _OWNER_ORG_ID, "Worker", 3, "agent-worker"):
        r = await c.get("/approvals/pending")
        assert r.status_code == 200
        assert r.json()["meta"]["total"] == 1

    # 6. Worker tries to self-approve → 403
    with as_agent(_WORKER_ID, _OWNER_ORG_ID, "Worker", 3, "agent-worker"):
        r = await c.post(f"/approvals/{approval_id}/approve")
        assert r.status_code == 403
        assert "Cannot approve your own" in r.json()["detail"]

    # 7. Manager approves
    with as_agent(_MANAGER_ID, _OWNER_ORG_ID, "Manager", 8, "agent-manager"):
        r = await c.post(
            f"/approvals/{approval_id}/approve",
            json={"notes": "Looks good"},
        )
        assert r.status_code == 200
        data = r.json()["data"]
        assert data["status"] == "approved"
        assert data["resolved_by"] == _MANAGER_ID

    # 8. Duplicate approval attempt → 400
    with as_agent(_MANAGER_ID, _OWNER_ORG_ID, "Manager", 8, "agent-manager"):
        r = await c.post(f"/approvals/{approval_id}/approve")
        assert r.status_code == 400

    # 9. GET approval → verified resolved
    with as_agent(_WORKER_ID, _OWNER_ORG_ID, "Worker", 3, "agent-worker"):
        r = await c.get(f"/approvals/{approval_id}")
        assert r.status_code == 200
        assert r.json()["data"]["status"] == "approved"

    # 10. Filter by status
    with as_agent(_WORKER_ID, _OWNER_ORG_ID, "Worker", 3, "agent-worker"):
        r = await c.get("/approvals", params={"status": "approved"})
        assert r.status_code == 200
        assert r.json()["meta"]["total"] == 1

    # 11. Invalid approval_id → 404
    with as_agent(_WORKER_ID, _OWNER_ORG_ID, "Worker", 3, "agent-worker"):
        fake_id = "00000000-0000-0000-0000-999999999999"
        r = await c.get(f"/approvals/{fake_id}")
        assert r.status_code == 404


@pytest.mark.asyncio
async def test_artifact_publish_gate(seeded_client: AsyncClient):
    c = seeded_client

    # 1. Worker publishes migration artifact (risk=9, autonomy=3) → 201 with status=draft
    with as_agent(_WORKER_ID, _OWNER_ORG_ID, "Worker", 3, "agent-worker"):
        r = await c.post(
            "/artifacts",
            json={
                "artifact_type": "migration",
                "name": "add_users_table",
                "content": {"sql": "CREATE TABLE users ..."},
                "task_id": _TASK_ID,
            },
        )
        assert r.status_code == 201
        data = r.json()["data"]
        assert data["status"] == "draft"
        artifact_id = data["id"]

    # 2. Verify approval request was created
    with as_agent(_WORKER_ID, _OWNER_ORG_ID, "Worker", 3, "agent-worker"):
        r = await c.get("/approvals/pending")
        assert r.status_code == 200
        pending = r.json()["data"]
        artifact_approvals = [a for a in pending if a["action_type"] == "artifact_publish"]
        assert len(artifact_approvals) == 1
        assert artifact_approvals[0]["entity_id"] == artifact_id

    # 3. Manager transitions DRAFT → PUBLISHED
    with as_agent(_MANAGER_ID, _OWNER_ORG_ID, "Manager", 8, "agent-manager"):
        r = await c.put(
            f"/artifacts/{artifact_id}/status",
            json={"status": "published"},
        )
        assert r.status_code == 200
        data = r.json()["data"]
        assert data["status"] == "published"
        assert data["approved_by"] == "agent-manager"
        assert data["approved_at"] is not None

    # 4. Worker publishes screenshot (risk=1, autonomy=3) → published immediately
    with as_agent(_WORKER_ID, _OWNER_ORG_ID, "Worker", 3, "agent-worker"):
        r = await c.post(
            "/artifacts",
            json={
                "artifact_type": "screenshot",
                "name": "login_page",
                "content": {"url": "screenshots/login.png"},
                "task_id": _TASK_ID,
            },
        )
        assert r.status_code == 201
        assert r.json()["data"]["status"] == "published"


@pytest.mark.asyncio
async def test_rejection_requires_notes(seeded_client: AsyncClient):
    c = seeded_client

    # Create a gated action
    with as_agent(_WORKER_ID, _OWNER_ORG_ID, "Worker", 3, "agent-worker"):
        r = await c.post(
            f"/tasks/{_TASK_ID}/transition",
            json={"status": "cancelled"},
        )
        assert r.status_code == 403
        approval_id = r.json()["detail"]["approval_id"]

    # Reject without notes → 400
    with as_agent(_MANAGER_ID, _OWNER_ORG_ID, "Manager", 8, "agent-manager"):
        r = await c.post(
            f"/approvals/{approval_id}/reject",
            json={"notes": None},
        )
        assert r.status_code == 400
        assert "Rejection reason" in r.json()["detail"]

    # Reject with notes → 200
    with as_agent(_MANAGER_ID, _OWNER_ORG_ID, "Manager", 8, "agent-manager"):
        r = await c.post(
            f"/approvals/{approval_id}/reject",
            json={"notes": "Not appropriate right now"},
        )
        assert r.status_code == 200
        assert r.json()["data"]["status"] == "rejected"
