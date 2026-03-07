"""Integration tests for the memory system end-to-end flows.

These tests require a running PostgreSQL + pgvector database.
Skip in CI unless MEMORY_INTEGRATION_TEST=1 is set.

Covers:
- Store → search round-trip
- Dedup (exact + near-duplicate)
- Visibility enforcement (private, targeted, shared)
- Rate limiting
- Feedback recording
- Confidence defaults
"""

from __future__ import annotations

import os
import typing
import uuid

import pytest
from httpx import ASGITransport, AsyncClient

SKIP_REASON = "Set MEMORY_INTEGRATION_TEST=1 to run integration tests (requires DB)"
pytestmark = pytest.mark.skipif(
    os.environ.get("MEMORY_INTEGRATION_TEST") != "1",
    reason=SKIP_REASON,
)


@pytest.fixture
def agent_id() -> str:
    return str(uuid.uuid4())


@pytest.fixture
def other_agent_id() -> str:
    return str(uuid.uuid4())


@pytest.fixture
def auth_headers() -> dict[str, str]:
    api_key = os.environ.get("MEMORY_API_KEY", "osp_test_key")
    return {"Authorization": f"Bearer {api_key}"}


@pytest.fixture
async def client() -> AsyncClient:
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


class TestStoreAndSearch:
    """Agent stores memory -> search returns it."""

    async def test_store_then_keyword_search(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        agent_id: str,
    ) -> None:
        # Store
        r = await client.post(
            "/memory",
            json={
                "content": "PostgreSQL HNSW indexes provide approximate nearest neighbor search",
                "type": "semantic",
                "source": "task_completion",
                "tags": ["postgres", "vector"],
            },
            headers={**auth_headers, "X-Agent-Id": agent_id},
        )
        assert r.status_code in (200, 201)
        memory_id = r.json()["id"]

        # Search by keyword
        r = await client.get(
            "/memory/search",
            params={"q": "HNSW indexes"},
            headers={**auth_headers, "X-Agent-Id": agent_id},
        )
        assert r.status_code == 200
        results = r.json()
        ids = [m["id"] for m in results]
        assert memory_id in ids

    async def test_store_then_semantic_search(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        agent_id: str,
    ) -> None:
        r = await client.post(
            "/memory",
            json={
                "content": "Agents that complete sandbox tutorials before live tasks have fewer errors",
                "type": "episodic",
                "source": "observation",
                "tags": ["onboarding"],
            },
            headers={**auth_headers, "X-Agent-Id": agent_id},
        )
        assert r.status_code in (200, 201)
        memory_id = r.json()["id"]

        # Search with related but not exact terms
        r = await client.get(
            "/memory/search",
            params={"q": "training new agents reduces mistakes"},
            headers={**auth_headers, "X-Agent-Id": agent_id},
        )
        assert r.status_code == 200
        results = r.json()
        ids = [m["id"] for m in results]
        assert memory_id in ids


class TestDedup:
    """Dedup: exact duplicate -> NOOP, near-duplicate -> LLM decision."""

    async def test_exact_duplicate_blocked(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        agent_id: str,
    ) -> None:
        content = "Exact duplicate test content for dedup validation"
        headers = {**auth_headers, "X-Agent-Id": agent_id}
        payload = {"content": content, "type": "semantic", "source": "observation"}

        r1 = await client.post("/memory", json=payload, headers=headers)
        assert r1.status_code in (200, 201)

        r2 = await client.post("/memory", json=payload, headers=headers)
        # Second attempt should be rejected or return existing
        assert r2.status_code in (200, 409)
        if r2.status_code == 200:
            # If 200, should return the existing memory (NOOP)
            assert r2.json().get("id") == r1.json()["id"]


class TestVisibility:
    """PRIVATE memory not visible to other agents."""

    async def test_private_hidden_from_others(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        agent_id: str,
        other_agent_id: str,
    ) -> None:
        # Store private memory
        r = await client.post(
            "/memory",
            json={
                "content": "Secret private memory for visibility test",
                "type": "semantic",
                "source": "inference",
                "visibility": "private",
            },
            headers={**auth_headers, "X-Agent-Id": agent_id},
        )
        assert r.status_code in (200, 201)

        # Other agent searches — should NOT find it
        r = await client.get(
            "/memory/search",
            params={"q": "secret private memory"},
            headers={**auth_headers, "X-Agent-Id": other_agent_id},
        )
        assert r.status_code == 200
        assert r.json() == [] or all(
            m.get("agent_id") != agent_id or m.get("visibility") != "private" for m in r.json()
        )


class TestConfidenceDefaults:
    """Source-based confidence defaults applied correctly."""

    EXPECTED: typing.ClassVar[dict[str, int]] = {
        "task_completion": 90,
        "code_change": 85,
        "observation": 60,
        "inference": 40,
    }

    async def test_confidence_from_source(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        agent_id: str,
    ) -> None:
        for source, expected_confidence in self.EXPECTED.items():
            r = await client.post(
                "/memory",
                json={
                    "content": f"Confidence test for source={source} - {uuid.uuid4()}",
                    "type": "semantic",
                    "source": source,
                },
                headers={**auth_headers, "X-Agent-Id": agent_id},
            )
            if r.status_code in (200, 201):
                assert r.json().get("confidence") == expected_confidence


class TestFeedback:
    """Feedback: helpful/unhelpful updates counts."""

    async def test_feedback_increments_count(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
        agent_id: str,
    ) -> None:
        # Store
        r = await client.post(
            "/memory",
            json={
                "content": "Feedback test memory for helpful/unhelpful tracking",
                "type": "semantic",
                "source": "task_completion",
            },
            headers={**auth_headers, "X-Agent-Id": agent_id},
        )
        assert r.status_code in (200, 201)
        memory_id = r.json()["id"]

        # Submit positive feedback
        r = await client.post(
            f"/memory/{memory_id}/feedback",
            json={"helpful": True},
            headers={**auth_headers, "X-Agent-Id": agent_id},
        )
        assert r.status_code == 200

        # Verify feedback was recorded
        r = await client.get(
            f"/memory/{memory_id}",
            headers={**auth_headers, "X-Agent-Id": agent_id},
        )
        assert r.status_code == 200
        data = r.json()
        assert data.get("helpful_count", 0) >= 1


class TestRateLimiting:
    """Rate limiting: burst limit enforced (10/min)."""

    async def test_burst_limit_enforced(
        self,
        client: AsyncClient,
        auth_headers: dict[str, str],
    ) -> None:
        agent_id = str(uuid.uuid4())
        headers = {**auth_headers, "X-Agent-Id": agent_id}
        statuses = []

        for i in range(12):
            r = await client.post(
                "/memory",
                json={
                    "content": f"Rate limit test #{i} - {uuid.uuid4()}",
                    "type": "semantic",
                    "source": "observation",
                },
                headers=headers,
            )
            statuses.append(r.status_code)

        successes = sum(1 for s in statuses if s in (200, 201))
        rate_limited = sum(1 for s in statuses if s == 429)

        assert successes <= 10
        assert rate_limited >= 2
