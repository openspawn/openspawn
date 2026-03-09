"""Integration test: full API lifecycle on SQLite backend."""

import os
from collections.abc import AsyncGenerator
from unittest.mock import patch

import pytest
from httpx import ASGITransport, AsyncClient


@pytest.fixture(autouse=True)
def sqlite_env(tmp_path):
    """Point DATABASE_URL at a temp SQLite file and disable Redis."""
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
