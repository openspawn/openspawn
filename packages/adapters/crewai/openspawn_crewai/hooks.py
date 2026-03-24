"""CrewAI callback hooks for fine-grained OpenSpawn reporting."""

from __future__ import annotations

import logging
from typing import Any

from openspawn import OpenSpawnClient
from openspawn.types import MemoryType, TaskStatus

logger = logging.getLogger("openspawn.crewai.hooks")

try:
    from crewai import Task  # type: ignore[import-untyped]
except ImportError:
    raise ImportError(
        "CrewAI is required for the openspawn-crewai adapter. "
        "Install it with: pip install crewai"
    )


class OpenSpawnTaskCallback:
    """Callback handler that reports individual task lifecycle events to OpenSpawn.

    Use this for more granular tracking than OpenSpawnCrew provides.
    Attach to CrewAI tasks via the callback mechanism::

        callback = OpenSpawnTaskCallback(client, task_id="openspawn-task-uuid")
        # Wire into CrewAI's task callback system
    """

    def __init__(
        self,
        client: OpenSpawnClient,
        task_id: str | None = None,
        *,
        store_output: bool = True,
    ) -> None:
        self.client = client
        self.task_id = task_id
        self.store_output = store_output

    def on_task_start(self, task: Any) -> None:
        """Called when a task begins execution."""
        if self.task_id:
            try:
                self.client.transition_task(
                    self.task_id,
                    TaskStatus.IN_PROGRESS,
                    reason="Task started",
                )
            except Exception as exc:
                logger.warning("Failed to report task start: %s", exc)

        try:
            self.client.emit_event(
                "crewai.task.started",
                {
                    "task_description": str(getattr(task, "description", ""))[:200],
                    "openspawn_task_id": self.task_id,
                },
            )
        except Exception as exc:
            logger.warning("Failed to emit task start event: %s", exc)

    def on_task_complete(self, task: Any, output: Any) -> None:
        """Called when a task completes successfully."""
        if self.task_id:
            try:
                self.client.transition_task(
                    self.task_id,
                    TaskStatus.DONE,
                    reason="Task completed",
                )
            except Exception as exc:
                logger.warning("Failed to report task completion: %s", exc)

        if self.store_output and output:
            try:
                self.client.store_memory(
                    str(output)[:2000],
                    memory_type=MemoryType.OBSERVATION,
                    metadata={
                        "source": "crewai",
                        "openspawn_task_id": self.task_id,
                        "task_description": str(getattr(task, "description", ""))[:200],
                    },
                )
            except Exception as exc:
                logger.warning("Failed to store task output: %s", exc)

    def on_task_error(self, task: Any, error: Exception) -> None:
        """Called when a task fails."""
        if self.task_id:
            try:
                self.client.transition_task(
                    self.task_id,
                    TaskStatus.BLOCKED,
                    reason=f"Task failed: {error}",
                )
            except Exception as exc:
                logger.warning("Failed to report task failure: %s", exc)

        try:
            self.client.emit_event(
                "crewai.task.failed",
                {
                    "error": str(error),
                    "error_type": type(error).__name__,
                    "openspawn_task_id": self.task_id,
                },
            )
        except Exception as exc:
            logger.warning("Failed to emit task error event: %s", exc)
