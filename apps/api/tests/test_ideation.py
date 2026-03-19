"""End-to-end tests for cooperative ideation flow (#669)."""

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
_AGENT_A_ID = "00000000-0000-0000-0000-000000000040"
_AGENT_B_ID = "00000000-0000-0000-0000-000000000041"
_AGENT_C_ID = "00000000-0000-0000-0000-000000000042"
_TASK_ID = "00000000-0000-0000-0000-000000000050"


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
    from sqlalchemy.dialects.postgresql import UUID as PG_UUID
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
    from sqlalchemy.pool import StaticPool

    import app.models.approval
    import app.models.artifact
    import app.models.event_subscription
    import app.models.ideation
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
def as_agent(agent_id: str, org_id: str, name: str, level: int = 5):
    """Override require_auth to return an AuthenticatedAgent."""
    from app.auth.dependencies import require_auth
    from app.auth.schemas import AuthenticatedAgent
    from app.main import app

    original = app.dependency_overrides.get(require_auth)
    app.dependency_overrides[require_auth] = lambda: AuthenticatedAgent(
        id=uuid.UUID(agent_id),
        org_id=uuid.UUID(org_id),
        agent_id=f"agent-{name.lower()}",
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

    for aid, name in [
        (_AGENT_A_ID, "AgentA"),
        (_AGENT_B_ID, "AgentB"),
        (_AGENT_C_ID, "AgentC"),
    ]:
        agent = Agent(
            id=uuid.UUID(aid),
            org_id=org.id,
            agent_id=f"agent-{name.lower()}",
            name=name,
            level=5,
            default_autonomy_level=5,
            model="sonnet",
            status="active",
            role="worker",
            mode="worker",
            hmac_secret_enc=b"\x00" * 32,
        )
        db.add(agent)

    await db.flush()

    task = Task(
        id=uuid.UUID(_TASK_ID),
        org_id=org.id,
        identifier="T-1",
        title="Design Feature X",
        status="in_progress",
        priority="normal",
        creator_id=uuid.UUID(_AGENT_A_ID),
        approval_required=False,
    )
    db.add(task)
    await db.commit()

    with contextlib.suppress(StopAsyncIteration):
        await db_gen.__anext__()

    return client


@pytest.mark.asyncio
async def test_create_ideation_session(seeded_client: AsyncClient):
    """Test creating an ideation session with explicit participants."""
    c = seeded_client

    with as_agent(_AGENT_A_ID, _OWNER_ORG_ID, "AgentA"):
        r = await c.post(
            "/ideation/sessions",
            json={
                "task_id": _TASK_ID,
                "participant_agent_ids": [_AGENT_A_ID, _AGENT_B_ID],
                "autonomy_level": 5,
            },
        )
        assert r.status_code == 201
        data = r.json()["data"]
        assert data["task_id"] == _TASK_ID
        assert data["status"] == "round1"
        assert data["current_round"] == 1
        assert len(data["participants"]) == 2
        assert data["autonomy_level"] == 5


@pytest.mark.asyncio
async def test_submit_briefs_across_rounds(seeded_client: AsyncClient):
    """Test submitting briefs and round advancement."""
    c = seeded_client

    # Create session with 2 participants
    with as_agent(_AGENT_A_ID, _OWNER_ORG_ID, "AgentA"):
        r = await c.post(
            "/ideation/sessions",
            json={
                "task_id": _TASK_ID,
                "participant_agent_ids": [_AGENT_A_ID, _AGENT_B_ID],
            },
        )
        assert r.status_code == 201
        session_id = r.json()["data"]["id"]

    # Agent A submits round 1 brief
    with as_agent(_AGENT_A_ID, _OWNER_ORG_ID, "AgentA"):
        r = await c.post(
            f"/ideation/sessions/{session_id}/briefs",
            json={"content": {"proposal": "Use microservices"}},
        )
        assert r.status_code == 201
        data = r.json()["data"]
        assert data["round"] == 1
        assert data["role"] == "proposer"

    # Agent A tries to submit again → 409
    with as_agent(_AGENT_A_ID, _OWNER_ORG_ID, "AgentA"):
        r = await c.post(
            f"/ideation/sessions/{session_id}/briefs",
            json={"content": {"proposal": "Duplicate"}},
        )
        assert r.status_code == 409

    # Agent B submits round 1 brief → round should advance to 2
    with as_agent(_AGENT_B_ID, _OWNER_ORG_ID, "AgentB"):
        r = await c.post(
            f"/ideation/sessions/{session_id}/briefs",
            json={"content": {"proposal": "Use monolith"}},
        )
        assert r.status_code == 201

    # Verify round advanced
    with as_agent(_AGENT_A_ID, _OWNER_ORG_ID, "AgentA"):
        r = await c.get(f"/ideation/sessions/{session_id}")
        assert r.status_code == 200
        data = r.json()["data"]
        assert data["current_round"] == 2
        assert data["status"] == "round2"


@pytest.mark.asyncio
async def test_round_advancement(seeded_client: AsyncClient):
    """Test that rounds advance correctly when all participants submit."""
    c = seeded_client

    with as_agent(_AGENT_A_ID, _OWNER_ORG_ID, "AgentA"):
        r = await c.post(
            "/ideation/sessions",
            json={
                "task_id": _TASK_ID,
                "participant_agent_ids": [_AGENT_A_ID, _AGENT_B_ID],
            },
        )
        session_id = r.json()["data"]["id"]

    # Round 1: both submit
    for aid, name in [(_AGENT_A_ID, "AgentA"), (_AGENT_B_ID, "AgentB")]:
        with as_agent(aid, _OWNER_ORG_ID, name):
            r = await c.post(
                f"/ideation/sessions/{session_id}/briefs",
                json={"content": {"idea": f"Proposal from {name}"}},
            )
            assert r.status_code == 201

    # Should be round 2 now
    with as_agent(_AGENT_A_ID, _OWNER_ORG_ID, "AgentA"):
        r = await c.get(f"/ideation/sessions/{session_id}")
        assert r.json()["data"]["current_round"] == 2
        assert r.json()["data"]["status"] == "round2"

    # Round 2: both submit reviews
    for aid, name in [(_AGENT_A_ID, "AgentA"), (_AGENT_B_ID, "AgentB")]:
        with as_agent(aid, _OWNER_ORG_ID, name):
            r = await c.post(
                f"/ideation/sessions/{session_id}/briefs",
                json={"content": {"review": f"Review from {name}"}},
            )
            assert r.status_code == 201

    # Should be round 3 / synthesis
    with as_agent(_AGENT_A_ID, _OWNER_ORG_ID, "AgentA"):
        r = await c.get(f"/ideation/sessions/{session_id}")
        assert r.json()["data"]["current_round"] == 3
        assert r.json()["data"]["status"] == "synthesis"


@pytest.mark.asyncio
async def test_synthesis(seeded_client: AsyncClient):
    """Test synthesizing briefs into a unified plan."""
    c = seeded_client

    # Create and complete rounds 1-2
    with as_agent(_AGENT_A_ID, _OWNER_ORG_ID, "AgentA"):
        r = await c.post(
            "/ideation/sessions",
            json={
                "task_id": _TASK_ID,
                "participant_agent_ids": [_AGENT_A_ID, _AGENT_B_ID],
            },
        )
        session_id = r.json()["data"]["id"]

    # Complete round 1
    for aid, name in [(_AGENT_A_ID, "AgentA"), (_AGENT_B_ID, "AgentB")]:
        with as_agent(aid, _OWNER_ORG_ID, name):
            await c.post(
                f"/ideation/sessions/{session_id}/briefs",
                json={"content": {"proposal": f"From {name}"}},
            )

    # Complete round 2
    for aid, name in [(_AGENT_A_ID, "AgentA"), (_AGENT_B_ID, "AgentB")]:
        with as_agent(aid, _OWNER_ORG_ID, name):
            await c.post(
                f"/ideation/sessions/{session_id}/briefs",
                json={"content": {"review": f"Review from {name}"}},
            )

    # Synthesize
    with as_agent(_AGENT_A_ID, _OWNER_ORG_ID, "AgentA"):
        r = await c.post(
            f"/ideation/sessions/{session_id}/synthesize",
            json={"content": {"unified_plan": "Combined approach: microservices with shared DB"}},
        )
        assert r.status_code == 201
        data = r.json()["data"]
        assert data["role"] == "synthesizer"
        assert data["round"] == 3

    # Duplicate synthesis → 409
    with as_agent(_AGENT_A_ID, _OWNER_ORG_ID, "AgentA"):
        r = await c.post(
            f"/ideation/sessions/{session_id}/synthesize",
            json={"content": {"unified_plan": "Duplicate"}},
        )
        assert r.status_code == 409


@pytest.mark.asyncio
async def test_full_3_round_flow(seeded_client: AsyncClient):
    """Test the complete ideation lifecycle: create → round1 → round2 → synthesize → approve."""
    c = seeded_client

    # 1. Start session
    with as_agent(_AGENT_A_ID, _OWNER_ORG_ID, "AgentA"):
        r = await c.post(
            "/ideation/sessions",
            json={
                "task_id": _TASK_ID,
                "participant_agent_ids": [_AGENT_A_ID, _AGENT_B_ID],
                "autonomy_level": 7,
            },
        )
        assert r.status_code == 201
        session_id = r.json()["data"]["id"]
        assert r.json()["data"]["status"] == "round1"

    # 2. Round 1: proposals
    for aid, name in [(_AGENT_A_ID, "AgentA"), (_AGENT_B_ID, "AgentB")]:
        with as_agent(aid, _OWNER_ORG_ID, name):
            r = await c.post(
                f"/ideation/sessions/{session_id}/briefs",
                json={"content": {"proposal": f"Approach from {name}"}},
            )
            assert r.status_code == 201

    # Verify round advanced
    with as_agent(_AGENT_A_ID, _OWNER_ORG_ID, "AgentA"):
        r = await c.get(f"/ideation/sessions/{session_id}")
        assert r.json()["data"]["status"] == "round2"

    # 3. Round 2: reviews
    for aid, name in [(_AGENT_A_ID, "AgentA"), (_AGENT_B_ID, "AgentB")]:
        with as_agent(aid, _OWNER_ORG_ID, name):
            r = await c.post(
                f"/ideation/sessions/{session_id}/briefs",
                json={"content": {"review": f"Feedback from {name}"}},
            )
            assert r.status_code == 201

    # Verify moved to synthesis
    with as_agent(_AGENT_A_ID, _OWNER_ORG_ID, "AgentA"):
        r = await c.get(f"/ideation/sessions/{session_id}")
        assert r.json()["data"]["status"] == "synthesis"

    # 4. Synthesize
    with as_agent(_AGENT_A_ID, _OWNER_ORG_ID, "AgentA"):
        r = await c.post(
            f"/ideation/sessions/{session_id}/synthesize",
            json={
                "content": {
                    "unified_plan": "Hybrid approach",
                    "action_items": ["Build API", "Write tests", "Deploy"],
                }
            },
        )
        assert r.status_code == 201

    # 5. Approve
    with as_agent(_AGENT_A_ID, _OWNER_ORG_ID, "AgentA"):
        r = await c.post(f"/ideation/sessions/{session_id}/approve")
        assert r.status_code == 200
        data = r.json()["data"]
        assert data["status"] == "approved"

    # 6. Verify all briefs
    with as_agent(_AGENT_A_ID, _OWNER_ORG_ID, "AgentA"):
        r = await c.get(f"/ideation/sessions/{session_id}/briefs")
        assert r.status_code == 200
        briefs = r.json()["data"]
        assert len(briefs) == 5  # 2 round1 + 2 round2 + 1 synthesis

    # 7. Filter briefs by round
    with as_agent(_AGENT_A_ID, _OWNER_ORG_ID, "AgentA"):
        r = await c.get(f"/ideation/sessions/{session_id}/briefs", params={"round": 1})
        assert r.status_code == 200
        assert len(r.json()["data"]) == 2

    # 8. Approve again → 400
    with as_agent(_AGENT_A_ID, _OWNER_ORG_ID, "AgentA"):
        r = await c.post(f"/ideation/sessions/{session_id}/approve")
        assert r.status_code == 400


@pytest.mark.asyncio
async def test_non_participant_cannot_submit(seeded_client: AsyncClient):
    """Test that non-participants are rejected."""
    c = seeded_client

    with as_agent(_AGENT_A_ID, _OWNER_ORG_ID, "AgentA"):
        r = await c.post(
            "/ideation/sessions",
            json={
                "task_id": _TASK_ID,
                "participant_agent_ids": [_AGENT_A_ID, _AGENT_B_ID],
            },
        )
        session_id = r.json()["data"]["id"]

    # Agent C is not a participant
    with as_agent(_AGENT_C_ID, _OWNER_ORG_ID, "AgentC"):
        r = await c.post(
            f"/ideation/sessions/{session_id}/briefs",
            json={"content": {"proposal": "Intruder"}},
        )
        assert r.status_code == 403


@pytest.mark.asyncio
async def test_session_not_found(seeded_client: AsyncClient):
    """Test 404 for nonexistent session."""
    c = seeded_client
    fake_id = "00000000-0000-0000-0000-999999999999"

    with as_agent(_AGENT_A_ID, _OWNER_ORG_ID, "AgentA"):
        r = await c.get(f"/ideation/sessions/{fake_id}")
        assert r.status_code == 404


@pytest.mark.asyncio
async def test_cannot_synthesize_in_round1(seeded_client: AsyncClient):
    """Test that synthesis is rejected when session is still in round 1."""
    c = seeded_client

    with as_agent(_AGENT_A_ID, _OWNER_ORG_ID, "AgentA"):
        r = await c.post(
            "/ideation/sessions",
            json={
                "task_id": _TASK_ID,
                "participant_agent_ids": [_AGENT_A_ID, _AGENT_B_ID],
            },
        )
        session_id = r.json()["data"]["id"]

    with as_agent(_AGENT_A_ID, _OWNER_ORG_ID, "AgentA"):
        r = await c.post(
            f"/ideation/sessions/{session_id}/synthesize",
            json={"content": {"plan": "Too early"}},
        )
        assert r.status_code == 400
