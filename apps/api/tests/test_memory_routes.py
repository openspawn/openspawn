"""Smoke tests for memory API routes — verifies routing and auth gates.

These tests pass once the memory router is registered (depends on #541 merging).
Until then they are marked xfail (404 instead of 401).
"""

import pytest
from httpx import AsyncClient

_xfail_no_router = pytest.mark.xfail(reason="memory router not yet on main (#541)", strict=False)

# --- Memory CRUD ---


@_xfail_no_router
async def test_store_memory_requires_auth(client: AsyncClient) -> None:
    r = await client.post(
        "/memory",
        json={"content": "test memory", "type": "semantic"},
    )
    assert r.status_code == 401


@_xfail_no_router
async def test_search_memory_requires_auth(client: AsyncClient) -> None:
    r = await client.get("/memory/search", params={"q": "test"})
    assert r.status_code == 401


@_xfail_no_router
async def test_list_memories_requires_auth(client: AsyncClient) -> None:
    r = await client.get("/memory")
    assert r.status_code == 401


@_xfail_no_router
async def test_get_memory_requires_auth(client: AsyncClient) -> None:
    r = await client.get("/memory/00000000-0000-0000-0000-000000000001")
    assert r.status_code == 401


@_xfail_no_router
async def test_memory_feedback_requires_auth(client: AsyncClient) -> None:
    r = await client.post(
        "/memory/00000000-0000-0000-0000-000000000001/feedback",
        json={"helpful": True},
    )
    assert r.status_code == 401
