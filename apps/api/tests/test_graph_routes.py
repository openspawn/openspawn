"""Smoke tests for graph API routes — verifies routing and auth gates."""

from __future__ import annotations

import pytest
from fastapi.routing import APIRoute
from httpx import AsyncClient

from app.main import app

DUMMY_UUID = "00000000-0000-0000-0000-000000000001"

EXPECTED_PATHS = [
    "/memory/graph/entities",
    "/memory/graph/entities/{entity_id}",
    "/memory/graph/entities/{entity_id}/memories",
    "/memory/graph/entities/{entity_id}/agents",
    "/memory/graph/entities/{entity_id}/neighbors",
    "/memory/graph/relationships",
    "/memory/graph/overlap",
    "/memory/graph/overlap/matrix",
    "/memory/graph/gaps",
    "/memory/graph/cytoscape",
]


def _registered_paths() -> set[str]:
    return {route.path for route in app.routes if isinstance(route, APIRoute)}


@pytest.mark.parametrize("path", EXPECTED_PATHS)
def test_route_registered(path: str) -> None:
    registered = _registered_paths()
    assert path in registered, f"{path} not found in registered routes: {sorted(registered)}"


# --- Auth gate tests ---


async def test_list_entities_requires_auth(client: AsyncClient) -> None:
    r = await client.get("/memory/graph/entities")
    assert r.status_code == 401


async def test_get_entity_requires_auth(client: AsyncClient) -> None:
    r = await client.get(f"/memory/graph/entities/{DUMMY_UUID}")
    assert r.status_code == 401


async def test_entity_memories_requires_auth(client: AsyncClient) -> None:
    r = await client.get(f"/memory/graph/entities/{DUMMY_UUID}/memories")
    assert r.status_code == 401


async def test_entity_agents_requires_auth(client: AsyncClient) -> None:
    r = await client.get(f"/memory/graph/entities/{DUMMY_UUID}/agents")
    assert r.status_code == 401


async def test_entity_neighbors_requires_auth(client: AsyncClient) -> None:
    r = await client.get(f"/memory/graph/entities/{DUMMY_UUID}/neighbors")
    assert r.status_code == 401


async def test_relationships_requires_auth(client: AsyncClient) -> None:
    r = await client.get("/memory/graph/relationships", params={"entity_id": DUMMY_UUID})
    assert r.status_code == 401


async def test_overlap_requires_auth(client: AsyncClient) -> None:
    r = await client.get(
        "/memory/graph/overlap",
        params={"agent_a": DUMMY_UUID, "agent_b": DUMMY_UUID},
    )
    assert r.status_code == 401


async def test_overlap_matrix_requires_auth(client: AsyncClient) -> None:
    r = await client.get("/memory/graph/overlap/matrix")
    assert r.status_code == 401


async def test_gaps_requires_auth(client: AsyncClient) -> None:
    r = await client.get("/memory/graph/gaps")
    assert r.status_code == 401


async def test_cytoscape_requires_auth(client: AsyncClient) -> None:
    r = await client.get("/memory/graph/cytoscape")
    assert r.status_code == 401
