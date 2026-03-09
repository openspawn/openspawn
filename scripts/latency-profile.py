#!/usr/bin/env python3
"""Standalone latency profiling script for OpenSpawn coordination engine (#618).

Connects to a running OpenSpawn API, creates test data, and measures
latency at each coordination stage via REST API calls.

No LLM calls — tests API/coordination plumbing only.

Usage:
    uv run scripts/latency-profile.py
    uv run scripts/latency-profile.py --base-url http://localhost:8000

Cost: ~$2.50 (API calls only, no LLM)
"""

from __future__ import annotations

import argparse
import asyncio
import csv
import statistics
import sys
import time
from pathlib import Path

import httpx

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

DEFAULT_BASE_URL = "http://localhost:8000"
ITERATIONS = 3
TIMEOUT = 30.0


# ---------------------------------------------------------------------------
# Latency measurement
# ---------------------------------------------------------------------------


async def measure_latency(
    client: httpx.AsyncClient,
    method: str,
    url: str,
    iterations: int = ITERATIONS,
    **kwargs: object,
) -> tuple[float, int]:
    """Run request `iterations` times, return (median_seconds, last_status_code)."""
    timings: list[float] = []
    last_status = 0

    for _ in range(iterations):
        start = time.perf_counter()
        resp = await getattr(client, method)(url, **kwargs)
        elapsed = time.perf_counter() - start
        timings.append(elapsed)
        last_status = resp.status_code

    median = statistics.median(timings)
    return median, last_status


# ---------------------------------------------------------------------------
# Profiling stages
# ---------------------------------------------------------------------------


async def profile_health(
    client: httpx.AsyncClient,
    results: list[tuple[str, float, int]],
) -> None:
    """GET /health — API health check."""
    median, status = await measure_latency(client, "get", "/health")
    results.append(("GET /health", median, status))


async def profile_health_db(
    client: httpx.AsyncClient,
    results: list[tuple[str, float, int]],
) -> None:
    """GET /health/db — DB connectivity check."""
    median, status = await measure_latency(client, "get", "/health/db")
    results.append(("GET /health/db", median, status))


async def profile_agent_creation(
    client: httpx.AsyncClient,
    headers: dict[str, str],
    org_id: str,
    results: list[tuple[str, float, int]],
) -> list[dict[str, str]]:
    """POST /agents/register — create 4 agents, measure latency."""
    agents_created: list[dict[str, str]] = []
    agent_defs = [
        {
            "agent_id": "latency-lead",
            "name": "Lead Engineer",
            "level": 7,
            "role": "admin",
            "mode": "orchestrator",
            "capabilities": [
                {"capability": "coding", "proficiency": "standard"},
                {"capability": "architecture", "proficiency": "expert"},
            ],
        },
        {
            "agent_id": "latency-coder",
            "name": "Coder",
            "level": 4,
            "role": "worker",
            "mode": "worker",
            "capabilities": [{"capability": "coding", "proficiency": "expert"}],
        },
        {
            "agent_id": "latency-writer",
            "name": "Writer",
            "level": 4,
            "role": "worker",
            "mode": "worker",
            "capabilities": [{"capability": "writing", "proficiency": "expert"}],
        },
        {
            "agent_id": "latency-analyst",
            "name": "Analyst",
            "level": 4,
            "role": "worker",
            "mode": "worker",
            "capabilities": [{"capability": "analysis", "proficiency": "expert"}],
        },
    ]

    timings: list[float] = []
    for agent_def in agent_defs:
        start = time.perf_counter()
        resp = await client.post(
            "/agents/register",
            json=agent_def,
            headers=headers,
        )
        elapsed = time.perf_counter() - start
        timings.append(elapsed)

        if resp.status_code == 201:
            data = resp.json()
            agent_data = data.get("data", {}).get("agent", {})
            agents_created.append(
                {
                    "id": agent_data.get("id", ""),
                    "agent_id": agent_def["agent_id"],
                    "hmac_secret": data.get("data", {}).get("hmac_secret", ""),
                }
            )
        elif resp.status_code == 409:
            # Already exists — try to look up
            print(f"  Agent {agent_def['agent_id']} already exists, skipping creation")
        else:
            print(f"  WARN: agent creation returned {resp.status_code}: {resp.text[:200]}")

    median = statistics.median(timings) if timings else 0.0
    results.append(("POST /agents/register (x4 median)", median, 201 if agents_created else 409))
    return agents_created


async def profile_task_creation(
    client: httpx.AsyncClient,
    headers: dict[str, str],
    results: list[tuple[str, float, int]],
) -> list[str]:
    """POST /tasks — create 5 tasks with required_capabilities for auto-routing."""
    task_ids: list[str] = []
    task_defs = [
        {
            "title": "Latency test: coding task",
            "priority": "normal",
            "required_capabilities": ["coding"],
        },
        {
            "title": "Latency test: writing task",
            "priority": "normal",
            "required_capabilities": ["writing"],
        },
        {
            "title": "Latency test: analysis task",
            "priority": "normal",
            "required_capabilities": ["analysis"],
        },
        {
            "title": "Latency test: architecture task",
            "priority": "high",
            "required_capabilities": ["architecture"],
        },
        {
            "title": "Latency test: unroutable task",
            "priority": "low",
            "required_capabilities": ["quantum_computing"],
        },
    ]

    timings: list[float] = []
    for task_def in task_defs:
        start = time.perf_counter()
        resp = await client.post("/tasks", json=task_def, headers=headers)
        elapsed = time.perf_counter() - start
        timings.append(elapsed)

        if resp.status_code == 201:
            task_data = resp.json().get("data", {})
            task_ids.append(task_data.get("id", ""))
        else:
            print(f"  WARN: task creation returned {resp.status_code}: {resp.text[:200]}")

    median = statistics.median(timings) if timings else 0.0
    results.append(("POST /tasks (x5 median, incl routing)", median, 201 if task_ids else 0))
    return task_ids


async def profile_task_transition(
    client: httpx.AsyncClient,
    headers: dict[str, str],
    task_ids: list[str],
    results: list[tuple[str, float, int]],
) -> None:
    """POST /tasks/{id}/transition — backlog → todo → in_progress."""
    if not task_ids:
        results.append(("POST /tasks/{id}/transition", 0.0, 0))
        return

    transitions = [
        ("todo", "backlog → todo"),
        ("in_progress", "todo → in_progress"),
    ]

    for target_status, label in transitions:
        timings: list[float] = []
        last_status = 0
        for tid in task_ids[:3]:  # first 3 tasks
            start = time.perf_counter()
            resp = await client.post(
                f"/tasks/{tid}/transition",
                json={"status": target_status},
                headers=headers,
            )
            elapsed = time.perf_counter() - start
            timings.append(elapsed)
            last_status = resp.status_code

        median = statistics.median(timings) if timings else 0.0
        results.append((f"POST transition ({label})", median, last_status))


async def profile_memory_store(
    client: httpx.AsyncClient,
    headers: dict[str, str],
    results: list[tuple[str, float, int]],
) -> None:
    """POST /memory — store a memory entry."""
    memory_payload = {
        "content": "Latency profiling test memory — coordination engine performs well under load",
        "source": "observation",
        "type": "semantic",
        "visibility": "shared",
    }

    median, status = await measure_latency(
        client,
        "post",
        "/memory",
        json=memory_payload,
        headers=headers,
    )
    results.append(("POST /memory", median, status))


async def profile_memory_search(
    client: httpx.AsyncClient,
    headers: dict[str, str],
    results: list[tuple[str, float, int]],
) -> None:
    """GET /memory/search — search memories by query."""
    median, status = await measure_latency(
        client,
        "get",
        "/memory/search?query=coordination+latency&limit=5",
        headers=headers,
    )
    results.append(("GET /memory/search", median, status))


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------


def print_results(results: list[tuple[str, float, int]]) -> None:
    """Print formatted results table."""
    print()
    print("=" * 70)
    print("  OPENSPAWN API LATENCY PROFILE")
    print("=" * 70)
    print(f"  {'Endpoint':<42} {'Latency':>12} {'Status':>8}")
    print("-" * 70)

    for label, elapsed, status_code in results:
        if elapsed < 0.001:
            formatted = f"{elapsed * 1_000_000:.0f} us"
        elif elapsed < 1.0:
            formatted = f"{elapsed * 1000:.1f} ms"
        else:
            formatted = f"{elapsed:.2f} s"

        status_str = str(status_code) if status_code else "N/A"
        print(f"  {label:<42} {formatted:>12} {status_str:>8}")

    print("-" * 70)
    total = sum(e for _, e, _ in results)
    print(f"  {'TOTAL':<42} {total * 1000:>9.1f} ms")
    print("=" * 70)


def write_csv(results: list[tuple[str, float, int]], path: Path) -> None:
    """Write results to CSV."""
    with path.open("w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["endpoint", "median_latency_ms", "status_code"])
        for label, elapsed, status_code in results:
            writer.writerow([label, f"{elapsed * 1000:.3f}", status_code])

    print(f"\nCSV written to {path}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


async def run(base_url: str) -> list[tuple[str, float, int]]:
    """Execute the full profiling suite."""
    results: list[tuple[str, float, int]] = []

    print(f"Connecting to {base_url}...")
    print()

    async with httpx.AsyncClient(
        base_url=base_url,
        timeout=TIMEOUT,
        follow_redirects=True,
    ) as client:
        # 1. Health checks (no auth needed)
        print("  [1/6] Health check...")
        await profile_health(client, results)
        await profile_health_db(client, results)

        # Check if API is reachable
        if results[0][2] != 200:
            print(f"\n  ERROR: API not reachable at {base_url} (status: {results[0][2]})")
            print("  Start the API with: cd apps/api && uv run uvicorn app.main:app --reload")
            return results

        # For authenticated endpoints, we need an API key
        # Try common env-based auth patterns
        api_key = _get_api_key()
        if not api_key:
            print("\n  WARN: No API key found. Skipping authenticated endpoints.")
            print("  Set OPENSPAWN_API_KEY env var or pass --api-key to test all endpoints.")
            print_results(results)
            return results

        headers = {"Authorization": f"Bearer {api_key}"}

        # 2. Agent creation
        print("  [2/6] Agent creation...")
        await profile_agent_creation(client, headers, "", results)

        # 3. Task creation + routing
        print("  [3/6] Task creation + auto-routing...")
        task_ids = await profile_task_creation(client, headers, results)

        # 4. Status transitions
        print("  [4/6] Status transitions...")
        await profile_task_transition(client, headers, task_ids, results)

        # 5. Memory store
        print("  [5/6] Memory store...")
        await profile_memory_store(client, headers, results)

        # 6. Memory search
        print("  [6/6] Memory search...")
        await profile_memory_search(client, headers, results)

    return results


def _get_api_key() -> str | None:
    """Try to find an API key from environment."""
    import os

    for key_name in ("OPENSPAWN_API_KEY", "API_KEY", "OSP_API_KEY"):
        val = os.environ.get(key_name)
        if val:
            return val
    return None


def main() -> None:
    parser = argparse.ArgumentParser(description="OpenSpawn coordination engine latency profiler")
    parser.add_argument(
        "--base-url",
        default=DEFAULT_BASE_URL,
        help=f"API base URL (default: {DEFAULT_BASE_URL})",
    )
    parser.add_argument(
        "--api-key",
        default=None,
        help="API key for authenticated endpoints (default: from OPENSPAWN_API_KEY env)",
    )
    parser.add_argument(
        "--csv",
        default="latency-profile.csv",
        help="CSV output file path (default: latency-profile.csv)",
    )
    args = parser.parse_args()

    # Allow --api-key to override env
    if args.api_key:
        import os

        os.environ["OPENSPAWN_API_KEY"] = args.api_key

    try:
        results = asyncio.run(run(args.base_url))
    except httpx.ConnectError:
        print(f"\nERROR: Cannot connect to {args.base_url}")
        print("Start the API with: cd apps/api && uv run uvicorn app.main:app --reload")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\nAborted.")
        sys.exit(130)

    if results:
        print_results(results)
        csv_path = Path(args.csv)
        write_csv(results, csv_path)


if __name__ == "__main__":
    main()
