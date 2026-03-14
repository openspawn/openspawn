"""End-to-end event mesh spike test — full DoD scenario."""

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

_OWNER_ID = "00000000-0000-0000-0000-000000000001"
_OWNER_ORG_ID = "00000000-0000-0000-0000-000000000001"
_DEV_AGENT_ID = "00000000-0000-0000-0000-000000000010"
_TEST_AGENT_ID = "00000000-0000-0000-0000-000000000011"
_DOCS_AGENT_ID = "00000000-0000-0000-0000-000000000012"
_TASK_ID = "00000000-0000-0000-0000-000000000002"


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

    import app.models.artifact
    import app.models.event_subscription
    from app.database import get_db
    from app.models.base import Base

    db_path = tmp_path / "test.db"
    engine = create_async_engine(
        f"sqlite+aiosqlite:///{db_path}",
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    from sqlalchemy.dialects.postgresql import UUID as PG_UUID

    from app.models.compat import CompatUUID

    # Save original column types so we can restore after test
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

    # Restore original column types to avoid polluting other tests
    for col, saved in originals:
        if saved[0] == "computed":
            col.computed = saved[1]  # type: ignore[union-attr]
            col.server_default = saved[2]  # type: ignore[union-attr]
        elif saved[0] == "type":
            col.type = saved[1]  # type: ignore[union-attr]


@pytest.fixture
async def seeded_client(client: AsyncClient) -> AsyncClient:
    """Client with org + 3 agents + task."""
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

    for agent_id, name, role in [
        (_OWNER_ID, "Owner", "worker"),
        (_DEV_AGENT_ID, "Dev Agent", "worker"),
        (_TEST_AGENT_ID, "Test Agent", "worker"),
        (_DOCS_AGENT_ID, "Docs Agent", "worker"),
    ]:
        agent = Agent(
            id=uuid.UUID(agent_id),
            org_id=org.id,
            agent_id=f"agent-{name.lower().replace(' ', '-')}",
            name=name,
            level=5,
            model="sonnet",
            status="active",
            role=role,
            mode="worker",
            hmac_secret_enc=b"\x00" * 32,
        )
        db.add(agent)
        await db.flush()

    task = Task(
        id=uuid.UUID(_TASK_ID),
        org_id=org.id,
        identifier="T-1",
        title="Build Dashboard",
        status="in_progress",
        priority="normal",
        creator_id=uuid.UUID(_OWNER_ID),
    )
    db.add(task)
    await db.commit()

    with contextlib.suppress(StopAsyncIteration):
        await db_gen.__anext__()

    return client


@pytest.mark.asyncio
async def test_full_dod_scenario(seeded_client: AsyncClient):
    c = seeded_client

    # 1. Test agent subscribes to component.*
    r = await c.post(
        "/coordination/subscribe",
        json={
            "event_pattern": "component.*",
            "task_id": _TASK_ID,
        },
    )
    assert r.status_code == 201

    # 2. Docs agent subscribes to *
    r = await c.post(
        "/coordination/subscribe",
        json={
            "event_pattern": "*",
        },
    )
    assert r.status_code == 201

    # 3. Dev agent emits component.created for SubmitButton
    r = await c.post(
        "/coordination/emit",
        json={
            "event_type": "component.created",
            "payload": {
                "name": "SubmitButton",
                "file_path": "src/SubmitButton.tsx",
                "test_ids": ["submit-btn"],
                "props": [{"name": "onClick", "type": "() => void"}],
                "route": "/checkout",
            },
            "task_id": _TASK_ID,
            "entity_name": "SubmitButton",
        },
    )
    assert r.status_code == 200
    assert r.json()["message"] == "Event emitted"

    # 4. Dev agent emits component.created for CheckoutForm
    r = await c.post(
        "/coordination/emit",
        json={
            "event_type": "component.created",
            "payload": {
                "name": "CheckoutForm",
                "file_path": "src/CheckoutForm.tsx",
                "test_ids": ["checkout-form"],
                "props": [{"name": "onSubmit", "type": "() => void"}],
                "route": "/checkout",
            },
            "task_id": _TASK_ID,
            "entity_name": "CheckoutForm",
        },
    )
    assert r.status_code == 200

    # 5. Replay events — should get both in order
    r = await c.post(
        "/coordination/replay",
        json={
            "task_id": _TASK_ID,
        },
    )
    assert r.status_code == 200
    events = r.json()["data"]
    assert len(events) == 2
    assert events[0]["type"] == "component.created"
    assert events[1]["type"] == "component.created"

    # 6. Test agent emits test.written for SubmitButton
    r = await c.post(
        "/coordination/emit",
        json={
            "event_type": "test.written",
            "payload": {
                "covers_component": "SubmitButton",
                "test_file": "SubmitButton.spec.tsx",
                "test_ids_used": ["submit-btn"],
                "scenarios": ["renders", "handles click"],
            },
            "task_id": _TASK_ID,
            "entity_name": "submit-btn-test",
        },
    )
    assert r.status_code == 200

    # 7. Docs agent emits screenshot.captured for SubmitButton
    r = await c.post(
        "/coordination/emit",
        json={
            "event_type": "screenshot.captured",
            "payload": {
                "name": "SubmitButton",
                "url": "screenshots/submit-btn.png",
            },
            "task_id": _TASK_ID,
            "entity_name": "SubmitButton",
        },
    )
    assert r.status_code == 200

    # 8. component_registry projection
    r = await c.get(
        "/coordination/project",
        params={
            "task_id": _TASK_ID,
            "projection_type": "component_registry",
        },
    )
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["count"] == 2
    assert "SubmitButton" in data["components"]
    assert "CheckoutForm" in data["components"]

    # 9. test_coverage projection
    r = await c.get(
        "/coordination/project",
        params={
            "task_id": _TASK_ID,
            "projection_type": "test_coverage",
        },
    )
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["coverage_ratio"] == 0.5
    assert data["covered_count"] == 1
    assert data["total_components"] == 2

    # 10. artifact_view projection (hypothesis test)
    r = await c.get(
        "/coordination/project",
        params={
            "task_id": _TASK_ID,
            "projection_type": "artifact_view",
        },
    )
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["count"] == 4  # 2 components + 1 test_plan + 1 screenshot
    types = {a["artifact_type"] for a in data["artifacts"]}
    assert types == {"component", "test_plan", "screenshot"}

    # 11. New agent replays all events — catches up
    r = await c.post(
        "/coordination/replay",
        json={
            "task_id": _TASK_ID,
        },
    )
    assert r.status_code == 200
    assert len(r.json()["data"]) == 4

    # 12. Duplicate subscription → 409
    r = await c.post(
        "/coordination/subscribe",
        json={
            "event_pattern": "component.*",
            "task_id": _TASK_ID,
        },
    )
    assert r.status_code == 409

    # 13. Invalid event type → 400
    r = await c.post(
        "/coordination/emit",
        json={
            "event_type": "nonexistent.event",
            "payload": {},
            "task_id": _TASK_ID,
        },
    )
    assert r.status_code == 400

    # 14. Unknown projection → 400
    r = await c.get(
        "/coordination/project",
        params={
            "task_id": _TASK_ID,
            "projection_type": "nonexistent",
        },
    )
    assert r.status_code == 400
