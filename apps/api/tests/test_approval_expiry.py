"""Tests for the approval expiry background worker."""

from __future__ import annotations

import os
import uuid
from unittest.mock import patch

import pendulum
import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool


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
async def db_session(tmp_path) -> AsyncSession:
    from sqlalchemy.dialects.postgresql import UUID as PG_UUID

    import app.models.approval
    import app.models.artifact
    import app.models.event_subscription
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

    session = session_factory()

    yield session

    await session.close()
    await engine.dispose()

    for col, saved in originals:
        if saved[0] == "computed":
            col.computed = saved[1]  # type: ignore[union-attr]
            col.server_default = saved[2]  # type: ignore[union-attr]
        elif saved[0] == "type":
            col.type = saved[1]  # type: ignore[union-attr]


@pytest.mark.asyncio
async def test_expire_approvals(db_session: AsyncSession, monkeypatch):
    from sqlalchemy import select

    from app.models.approval import ApprovalRequest
    from app.models.enums import ApprovalStatus
    from app.models.organization import Organization

    # Monkeypatch async_session to return our test session
    import app.workers.approval_expiry as expiry_mod

    org_id = uuid.uuid4()
    agent_id = uuid.uuid4()
    entity_id = uuid.uuid4()

    # Seed org
    org = Organization(id=org_id, name="TestOrg", slug="test", task_prefix="T", next_task_number=1)
    db_session.add(org)
    await db_session.flush()

    # Expired approval (expires_at in the past)
    expired = ApprovalRequest(
        org_id=org_id,
        requested_by=agent_id,
        action_type="task_transition",
        entity_type="task",
        entity_id=entity_id,
        risk_level=5,
        autonomy_level=3,
        payload={"test": True},
        status=ApprovalStatus.PENDING.value,
        expires_at=pendulum.now("UTC").subtract(hours=1),
    )
    db_session.add(expired)

    # Non-expired approval (expires_at in the future)
    active = ApprovalRequest(
        org_id=org_id,
        requested_by=agent_id,
        action_type="task_transition",
        entity_type="task",
        entity_id=uuid.uuid4(),
        risk_level=3,
        autonomy_level=3,
        payload={"test": True},
        status=ApprovalStatus.PENDING.value,
        expires_at=pendulum.now("UTC").add(hours=24),
    )
    db_session.add(active)
    await db_session.commit()

    # Monkeypatch async_session to return our session
    from contextlib import asynccontextmanager

    @asynccontextmanager
    async def mock_session():
        yield db_session

    monkeypatch.setattr(expiry_mod, "async_session", mock_session)

    count = await expiry_mod.expire_approvals({})
    assert count == 1

    # Verify the expired one is updated
    result = await db_session.execute(
        select(ApprovalRequest).where(ApprovalRequest.id == expired.id)
    )
    row = result.scalar_one()
    assert row.status == ApprovalStatus.EXPIRED.value

    # Verify the active one is still pending
    result = await db_session.execute(
        select(ApprovalRequest).where(ApprovalRequest.id == active.id)
    )
    row = result.scalar_one()
    assert row.status == ApprovalStatus.PENDING.value


@pytest.mark.asyncio
async def test_expire_approvals_no_pending(db_session: AsyncSession, monkeypatch):
    """No pending approvals — worker returns 0."""
    import app.workers.approval_expiry as expiry_mod
    from contextlib import asynccontextmanager

    @asynccontextmanager
    async def mock_session():
        yield db_session

    monkeypatch.setattr(expiry_mod, "async_session", mock_session)

    count = await expiry_mod.expire_approvals({})
    assert count == 0
