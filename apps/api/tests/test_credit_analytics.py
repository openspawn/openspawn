"""Tests for credit analytics endpoints."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_credit_stats_returns_summary(client: AsyncClient):
    """GET /credits/analytics/stats should return aggregated stats."""
    resp = await client.get("/credits/analytics/stats")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "total_credits" in data
    assert "total_debits" in data
    assert "net" in data
    assert "transaction_count" in data


@pytest.mark.asyncio
async def test_credit_trends_returns_daily_points(client: AsyncClient):
    """GET /credits/analytics/trends should return date/amount pairs."""
    resp = await client.get("/credits/analytics/trends?days=7")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_per_agent_spending(client: AsyncClient):
    """GET /credits/analytics/agents should return per-agent totals."""
    resp = await client.get("/credits/analytics/agents")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_top_spenders(client: AsyncClient):
    """GET /credits/analytics/top-spenders should return ranked agents."""
    resp = await client.get("/credits/analytics/top-spenders?limit=5")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert isinstance(data, list)
