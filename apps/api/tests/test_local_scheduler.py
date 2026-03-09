"""Tests for asyncio-based local scheduler."""

import asyncio
import contextlib

import pytest

from app.workers.local_scheduler import LocalScheduler


@pytest.mark.asyncio
async def test_scheduler_runs_job():
    call_count = 0

    async def dummy_job(ctx: dict) -> None:
        nonlocal call_count
        call_count += 1

    scheduler = LocalScheduler()
    scheduler.add_job(dummy_job, interval_seconds=0.1, name="dummy")

    task = asyncio.create_task(scheduler.start())
    # 1s initial delay + time for multiple runs at 0.1s interval
    await asyncio.sleep(1.5)
    scheduler.stop()

    with contextlib.suppress(asyncio.CancelledError, TimeoutError):
        await asyncio.wait_for(task, timeout=2.0)

    assert call_count >= 2


@pytest.mark.asyncio
async def test_scheduler_handles_job_error():
    """Jobs that raise should not crash the scheduler."""
    error_count = 0
    ok_count = 0

    async def failing_job(ctx: dict) -> None:
        nonlocal error_count
        error_count += 1
        msg = "boom"
        raise ValueError(msg)

    async def ok_job(ctx: dict) -> None:
        nonlocal ok_count
        ok_count += 1

    scheduler = LocalScheduler()
    scheduler.add_job(failing_job, interval_seconds=0.1, name="fail")
    scheduler.add_job(ok_job, interval_seconds=0.1, name="ok")

    task = asyncio.create_task(scheduler.start())
    # 1s initial delay + time for multiple runs at 0.1s interval
    await asyncio.sleep(1.5)
    scheduler.stop()

    with contextlib.suppress(asyncio.CancelledError, TimeoutError):
        await asyncio.wait_for(task, timeout=2.0)

    assert error_count >= 2
    assert ok_count >= 2


@pytest.mark.asyncio
async def test_scheduler_stop_cancels():
    async def long_job(ctx: dict) -> None:
        await asyncio.sleep(100)

    scheduler = LocalScheduler()
    scheduler.add_job(long_job, interval_seconds=1, name="long")

    task = asyncio.create_task(scheduler.start())
    await asyncio.sleep(0.1)
    scheduler.stop()

    with contextlib.suppress(asyncio.CancelledError, TimeoutError):
        await asyncio.wait_for(task, timeout=2.0)

    # Should have cleaned up
    assert len(scheduler._tasks) == 0 or all(t.done() for t in scheduler._tasks)
