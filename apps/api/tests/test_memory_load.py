"""Load tests for memory system — concurrent writes, search latency, rate limiting.

Run with: cd apps/api && uv run pytest tests/test_memory_load.py -v -s

These tests require a running database with pgvector. Skip in CI unless
MEMORY_LOAD_TEST=1 is set. They exercise the memory API under concurrent load.
"""

from __future__ import annotations

import asyncio
import os
import time
import uuid

import pytest
from httpx import ASGITransport, AsyncClient

SKIP_REASON = "Set MEMORY_LOAD_TEST=1 to run load tests"
pytestmark = pytest.mark.skipif(
    os.environ.get("MEMORY_LOAD_TEST") != "1",
    reason=SKIP_REASON,
)


@pytest.fixture
def base_url() -> str:
    return os.environ.get("MEMORY_API_URL", "http://test")


@pytest.fixture
def auth_headers() -> dict[str, str]:
    api_key = os.environ.get("MEMORY_API_KEY", "osp_test_key")
    return {"Authorization": f"Bearer {api_key}"}


def _make_memory(agent_id: str, idx: int) -> dict[str, object]:
    return {
        "content": f"Load test memory #{idx} from agent {agent_id}. "
        f"This tests concurrent write throughput and search indexing under load.",
        "type": "semantic",
        "source": "task_completion",
        "tags": ["load-test", f"batch-{idx % 10}"],
    }


class TestConcurrentWrites:
    """50 concurrent agents writing memories."""

    AGENT_COUNT = 50
    MEMORIES_PER_AGENT = 5

    async def test_concurrent_write_throughput(
        self,
        auth_headers: dict[str, str],
        base_url: str,
    ) -> None:
        from app.main import app

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url=base_url) as client:
            start = time.perf_counter()

            async def write_batch(agent_idx: int) -> list[int]:
                agent_id = str(uuid.uuid4())
                statuses = []
                for i in range(self.MEMORIES_PER_AGENT):
                    r = await client.post(
                        "/memory",
                        json=_make_memory(agent_id, i),
                        headers={**auth_headers, "X-Agent-Id": agent_id},
                    )
                    statuses.append(r.status_code)
                return statuses

            tasks = [write_batch(i) for i in range(self.AGENT_COUNT)]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            elapsed = time.perf_counter() - start

            total_writes = self.AGENT_COUNT * self.MEMORIES_PER_AGENT
            successes = sum(
                1
                for batch in results
                if not isinstance(batch, Exception)
                for s in batch
                if s in (200, 201)
            )

            print("\n--- Concurrent Write Results ---")
            print(f"Total writes: {total_writes}")
            print(f"Successes: {successes}")
            print(f"Elapsed: {elapsed:.2f}s")
            print(f"Throughput: {total_writes / elapsed:.1f} writes/s")

            # At least 80% should succeed (some may hit rate limits)
            assert successes >= total_writes * 0.8


class TestSearchLatency:
    """Search latency under concurrent writes."""

    async def test_search_p95_under_500ms(
        self,
        auth_headers: dict[str, str],
        base_url: str,
    ) -> None:
        from app.main import app

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url=base_url) as client:
            queries = ["pipeline", "deployment", "rate limit", "budget", "testing"]
            latencies: list[float] = []

            for query in queries * 10:  # 50 searches
                start = time.perf_counter()
                await client.get(
                    "/memory/search",
                    params={"q": query},
                    headers=auth_headers,
                )
                elapsed = time.perf_counter() - start
                latencies.append(elapsed)

            latencies.sort()
            p50 = latencies[len(latencies) // 2]
            p95 = latencies[int(len(latencies) * 0.95)]
            p99 = latencies[int(len(latencies) * 0.99)]

            print("\n--- Search Latency Results ---")
            print(f"Queries: {len(latencies)}")
            print(f"p50: {p50 * 1000:.1f}ms")
            print(f"p95: {p95 * 1000:.1f}ms")
            print(f"p99: {p99 * 1000:.1f}ms")

            assert p95 < 0.5, f"p95 search latency {p95 * 1000:.1f}ms exceeds 500ms threshold"


class TestRateLimitingUnderBurst:
    """Rate limiting enforcement under burst conditions."""

    async def test_burst_rate_limit(
        self,
        auth_headers: dict[str, str],
        base_url: str,
    ) -> None:
        from app.main import app

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url=base_url) as client:
            agent_id = str(uuid.uuid4())
            headers = {**auth_headers, "X-Agent-Id": agent_id}
            statuses: list[int] = []

            # Send 15 requests rapidly (limit is 10/min)
            for i in range(15):
                r = await client.post(
                    "/memory",
                    json=_make_memory(agent_id, i),
                    headers=headers,
                )
                statuses.append(r.status_code)

            successes = sum(1 for s in statuses if s in (200, 201))
            rate_limited = sum(1 for s in statuses if s == 429)

            print("\n--- Rate Limit Burst Results ---")
            print(f"Successes: {successes}")
            print(f"Rate limited (429): {rate_limited}")
            print(f"Other: {15 - successes - rate_limited}")

            assert successes <= 10, "More than 10 writes should not succeed within a minute"
            assert rate_limited >= 1, "At least one request should be rate-limited"
