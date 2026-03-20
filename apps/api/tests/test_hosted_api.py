"""Tests for hosted API MVP — registration, API keys, multi-tenant, usage."""

import os
from collections.abc import AsyncGenerator
from unittest.mock import patch

import pytest
from httpx import ASGITransport, AsyncClient


@pytest.fixture(autouse=True)
def hosted_env(tmp_path):
    """SQLite + hosted mode + full auth."""
    db_path = tmp_path / "test.db"
    env = {
        "DATABASE_URL": f"sqlite+aiosqlite:///{db_path}",
        "REDIS_URL": "",
        "HOSTED_MODE": "true",
        "AUTH_MODE": "full",
        "AUTH_JWT_SECRET": "test-secret-key-for-hosted-api",
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
    """Async test client backed by SQLite with hosted mode."""
    from app.database import create_tables

    await create_tables()

    from app.main import app

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as c:
        yield c


# ---------------------------------------------------------------------------
# Registration + API key issuance
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_register_returns_api_key(client: AsyncClient):
    """POST /auth/register creates user and returns osp_ API key."""
    r = await client.post(
        "/auth/register",
        json={"email": "alice@example.com", "password": "securepass123", "name": "Alice"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["api_key"].startswith("osp_")
    assert data["user_id"]
    assert data["org_id"]


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    """Duplicate email returns 409."""
    payload = {"email": "bob@example.com", "password": "pass123", "name": "Bob"}
    r1 = await client.post("/auth/register", json=payload)
    assert r1.status_code == 200

    r2 = await client.post("/auth/register", json=payload)
    assert r2.status_code == 409


@pytest.mark.asyncio
async def test_register_disabled_in_selfhosted(client: AsyncClient):
    """Registration returns 404 when HOSTED_MODE=false."""

    from app.config import settings

    original = settings.hosted_mode
    settings.hosted_mode = False
    try:
        r = await client.post(
            "/auth/register",
            json={"email": "x@x.com", "password": "pass", "name": "X"},
        )
        assert r.status_code == 404
    finally:
        settings.hosted_mode = original


# ---------------------------------------------------------------------------
# Hosted login
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_hosted_login_returns_api_key(client: AsyncClient):
    """Login with email/password returns a new API key."""
    # Register first
    await client.post(
        "/auth/register",
        json={"email": "carol@example.com", "password": "mypass", "name": "Carol"},
    )

    # Login
    r = await client.post(
        "/auth/hosted-login",
        json={"email": "carol@example.com", "password": "mypass"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["api_key"].startswith("osp_")


@pytest.mark.asyncio
async def test_hosted_login_wrong_password(client: AsyncClient):
    """Wrong password returns 401."""
    await client.post(
        "/auth/register",
        json={"email": "dan@example.com", "password": "correct", "name": "Dan"},
    )

    r = await client.post(
        "/auth/hosted-login",
        json={"email": "dan@example.com", "password": "wrong"},
    )
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# Whoami
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_whoami_with_api_key(client: AsyncClient):
    """GET /auth/whoami returns user info when authenticated with API key."""
    reg = await client.post(
        "/auth/register",
        json={"email": "eve@example.com", "password": "pass", "name": "Eve"},
    )
    api_key = reg.json()["api_key"]

    r = await client.get(
        "/auth/whoami",
        headers={"Authorization": f"Bearer {api_key}"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == "eve@example.com"
    assert data["name"] == "Eve"


@pytest.mark.asyncio
async def test_whoami_unauthenticated(client: AsyncClient):
    """GET /auth/whoami without auth returns 401."""
    r = await client.get("/auth/whoami")
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# Usage tracking
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_usage_returns_counts(client: AsyncClient):
    """GET /auth/usage returns usage stats."""
    reg = await client.post(
        "/auth/register",
        json={"email": "frank@example.com", "password": "pass", "name": "Frank"},
    )
    api_key = reg.json()["api_key"]

    r = await client.get(
        "/auth/usage",
        headers={"Authorization": f"Bearer {api_key}"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["org_count"] >= 1
    assert data["api_calls"] >= 0
    assert data["agent_count"] >= 0


# ---------------------------------------------------------------------------
# Multi-tenant isolation
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_multitenant_org_isolation(client: AsyncClient):
    """Two users get separate orgs."""
    r1 = await client.post(
        "/auth/register",
        json={"email": "tenant1@example.com", "password": "pass", "name": "Tenant 1"},
    )
    r2 = await client.post(
        "/auth/register",
        json={"email": "tenant2@example.com", "password": "pass", "name": "Tenant 2"},
    )

    key1 = r1.json()["api_key"]
    key2 = r2.json()["api_key"]

    me1 = await client.get("/auth/whoami", headers={"Authorization": f"Bearer {key1}"})
    me2 = await client.get("/auth/whoami", headers={"Authorization": f"Bearer {key2}"})

    assert me1.json()["org_id"] != me2.json()["org_id"]
    assert me1.json()["user_id"] != me2.json()["user_id"]
