"""Tests for GitHub + Linear integration endpoints."""

from httpx import AsyncClient


async def test_github_connections_requires_auth(client: AsyncClient) -> None:
    r = await client.get("/integrations/github/connections")
    assert r.status_code == 401


async def test_create_github_connection_requires_auth(client: AsyncClient) -> None:
    r = await client.post(
        "/integrations/github/connections",
        json={"installation_id": 123, "name": "test", "webhook_secret": "secret"},
    )
    assert r.status_code == 401


async def test_github_webhook_missing_signature(client: AsyncClient) -> None:
    r = await client.post(
        "/integrations/github/webhook",
        json={"action": "opened"},
        headers={"x-github-event": "issues"},
    )
    assert r.status_code == 401
    assert "Missing signature" in r.json()["detail"]


async def test_linear_connections_requires_auth(client: AsyncClient) -> None:
    r = await client.get("/integrations/linear/connections")
    assert r.status_code == 401


async def test_create_linear_connection_requires_auth(client: AsyncClient) -> None:
    r = await client.post(
        "/integrations/linear/connections",
        json={"team_id": "team-1", "name": "test", "webhook_secret": "secret"},
    )
    assert r.status_code == 401


async def test_linear_webhook_missing_signature(client: AsyncClient) -> None:
    r = await client.post(
        "/integrations/linear/webhook",
        json={"action": "create", "type": "Issue"},
    )
    assert r.status_code == 401
    assert "Missing signature" in r.json()["detail"]
