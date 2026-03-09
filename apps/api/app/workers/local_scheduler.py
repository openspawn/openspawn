"""Asyncio-based cron scheduler for local mode (replaces arq + Redis)."""

from __future__ import annotations

import asyncio
from collections.abc import Callable, Coroutine
from dataclasses import dataclass
from typing import Any

import structlog

logger = structlog.get_logger()

JobFunc = Callable[[dict[str, Any]], Coroutine[Any, Any, Any]]


@dataclass
class ScheduledJob:
    func: JobFunc
    interval_seconds: float
    name: str = ""


class LocalScheduler:
    """Simple asyncio scheduler that runs jobs at fixed intervals.

    Replacement for arq + Redis when running in local mode.
    Each job runs in its own asyncio task at a fixed interval.
    """

    def __init__(self) -> None:
        self._jobs: list[ScheduledJob] = []
        self._running = False
        self._tasks: set[asyncio.Task[None]] = set()

    def add_job(
        self,
        func: JobFunc,
        interval_seconds: float,
        name: str = "",
    ) -> None:
        """Register a job to run at a fixed interval."""
        self._jobs.append(
            ScheduledJob(
                func=func,
                interval_seconds=interval_seconds,
                name=name or getattr(func, "__name__", "unknown"),
            )
        )

    async def start(self) -> None:
        """Start all scheduled jobs as concurrent tasks."""
        self._running = True
        for job in self._jobs:
            task = asyncio.create_task(self._run_loop(job))
            self._tasks.add(task)
            task.add_done_callback(self._tasks.discard)
        logger.info(
            "scheduler.started",
            jobs=len(self._jobs),
            job_names=[j.name for j in self._jobs],
        )
        # Wait for all tasks (they run until stop() is called)
        if self._tasks:
            await asyncio.gather(*self._tasks, return_exceptions=True)

    def stop(self) -> None:
        """Signal all jobs to stop."""
        self._running = False
        for task in self._tasks:
            task.cancel()

    async def _run_loop(self, job: ScheduledJob) -> None:
        """Run a single job on its interval."""
        # Initial delay to stagger job starts
        await asyncio.sleep(1)
        while self._running:
            try:
                await job.func({})
                logger.debug("scheduler.job_ok", job=job.name)
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception("scheduler.job_failed", job=job.name)
            try:
                await asyncio.sleep(job.interval_seconds)
            except asyncio.CancelledError:
                break
