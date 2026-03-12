"""Integration test: full API lifecycle on SQLite backend."""

import os
from collections.abc import AsyncGenerator
from pathlib import Path
from unittest.mock import patch

import pytest
from httpx import ASGITransport, AsyncClient


@pytest.fixture(autouse=True)
def sqlite_env(tmp_path):
    """Point DATABASE_URL at a temp SQLite file, disable Redis, force auth mode full."""
    db_path = tmp_path / "test.db"
    env = {
        "DATABASE_URL": f"sqlite+aiosqlite:///{db_path}",
        "REDIS_URL": "",
    }
    with patch.dict(os.environ, env, clear=False):
        from importlib import reload

        import app.config
        import app.database

        reload(app.config)
        reload(app.database)
        yield


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient]:
    """Create async test client backed by SQLite."""
    from app.database import create_tables

    await create_tables()

    from app.main import app

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as c:
        yield c


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    """Health endpoint returns 200 on SQLite."""
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_health_db(client: AsyncClient):
    """DB health endpoint proves SQLite engine works."""
    r = await client.get("/health/db")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"


# ---------------------------------------------------------------------------
# Task 3: Auth-gated endpoint smoke tests (all return 401 without creds)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_agents_requires_auth(client: AsyncClient):
    r = await client.get("/agents")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_tasks_requires_auth(client: AsyncClient):
    r = await client.get("/tasks")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_credits_requires_auth(client: AsyncClient):
    r = await client.get("/credits/balance")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_channels_requires_auth(client: AsyncClient):
    r = await client.get("/channels")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_events_requires_auth(client: AsyncClient):
    r = await client.get("/events")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_memory_requires_auth(client: AsyncClient):
    r = await client.get("/memory")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_escalations_requires_auth(client: AsyncClient):
    r = await client.get("/tasks/escalations/open")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_consensus_requires_auth(client: AsyncClient):
    r = await client.get("/tasks/consensus/pending")
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# Task 4: Seeder end-to-end on SQLite
# ---------------------------------------------------------------------------

_MINIMAL_ORG_MD = """\
# Test Org

## Agents

| Name  | Role   | Level | Reports To |
|-------|--------|-------|------------|
| Alice | lead   | 7     | —          |
| Bob   | worker | 4     | Alice      |
"""

_SINGLE_AGENT_ORG_MD = """\
# Solo Org

## Agents

| Name  | Role   | Level | Reports To |
|-------|--------|-------|------------|
| Carol | worker | 4     | —          |
"""


@pytest.mark.asyncio
async def test_seed_from_org_creates_agents(client: AsyncClient, tmp_path: Path):
    """Seeder creates agents from a minimal ORG.md table."""
    org_file = tmp_path / "ORG.md"
    org_file.write_text(_MINIMAL_ORG_MD, encoding="utf-8")

    from app.seeder import seed_from_org

    count = await seed_from_org(str(org_file))
    assert count == 2


@pytest.mark.asyncio
async def test_seed_from_org_upserts_on_rerun(client: AsyncClient, tmp_path: Path):
    """Seeder upserts (not duplicates) on repeated runs."""
    org_file = tmp_path / "ORG.md"
    org_file.write_text(_SINGLE_AGENT_ORG_MD, encoding="utf-8")

    from app.seeder import seed_from_org

    first = await seed_from_org(str(org_file))
    second = await seed_from_org(str(org_file))
    assert first == 1
    assert second == 1
