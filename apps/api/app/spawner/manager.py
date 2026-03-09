"""Agent spawn manager with concurrency control."""

from __future__ import annotations

import asyncio
from collections import deque
from dataclasses import dataclass

import structlog

logger = structlog.get_logger()


@dataclass
class SpawnRequest:
    agent_id: str
    workspace: str
    prompt: str
    task_id: str | None = None


class SpawnManager:
    """Manages Claude Code subprocess lifecycle with concurrency cap."""

    def __init__(self, max_concurrent: int = 2, dry_run: bool = False):
        self.max_concurrent = max_concurrent
        self.dry_run = dry_run
        self._queue: deque[SpawnRequest] = deque()
        self._active: dict[str, asyncio.subprocess.Process] = {}
        self._watchers: set[asyncio.Task[None]] = set()
        self._lock = asyncio.Lock()

    @property
    def queued_count(self) -> int:
        return len(self._queue)

    @property
    def active_count(self) -> int:
        return len(self._active)

    def enqueue(
        self,
        agent_id: str,
        workspace: str,
        prompt: str,
        task_id: str | None = None,
    ) -> None:
        """Add an agent to the spawn queue."""
        self._queue.append(SpawnRequest(agent_id, workspace, prompt, task_id))
        logger.info("spawn.enqueued", agent=agent_id, queue_size=len(self._queue))

    async def drain(self) -> None:
        """Process the queue, spawning agents up to the concurrency cap."""
        async with self._lock:
            while self._queue and self.active_count < self.max_concurrent:
                req = self._queue.popleft()
                await self._spawn(req)

    async def _spawn(self, req: SpawnRequest) -> None:
        """Spawn a single agent process."""
        if self.dry_run:
            logger.info("spawn.dry_run", agent=req.agent_id)
            return

        from app.spawner.process import spawn_claude_process

        proc = await spawn_claude_process(req.agent_id, req.workspace, req.prompt)
        self._active[req.agent_id] = proc
        task = asyncio.create_task(self._watch(req.agent_id, proc))
        self._watchers.add(task)
        task.add_done_callback(self._watchers.discard)
        logger.info(
            "spawn.started",
            agent=req.agent_id,
            active=self.active_count,
            queued=self.queued_count,
        )

    async def _watch(self, agent_id: str, proc: asyncio.subprocess.Process) -> None:
        """Watch a subprocess and recycle its slot when it exits."""
        stdout, stderr = await proc.communicate()
        self._active.pop(agent_id, None)

        if stdout:
            logger.info("spawn.stdout", agent=agent_id, output=stdout.decode()[:500])
        if stderr:
            logger.warning("spawn.stderr", agent=agent_id, output=stderr.decode()[:500])

        logger.info(
            "spawn.exited",
            agent=agent_id,
            returncode=proc.returncode,
            active=self.active_count,
            queued=self.queued_count,
        )
        # Spawn next queued agent
        await self.drain()

    async def shutdown(self) -> None:
        """Terminate all active agent processes."""
        for agent_id, proc in list(self._active.items()):
            logger.info("spawn.terminating", agent=agent_id)
            proc.terminate()
        # Wait for all to exit
        for proc in self._active.values():
            try:
                await asyncio.wait_for(proc.wait(), timeout=5.0)
            except TimeoutError:
                proc.kill()
        self._active.clear()
        self._queue.clear()
