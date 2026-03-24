"""CrewAI adapter — wraps a CrewAI Crew to report activity to OpenSpawn."""

from __future__ import annotations

import logging
import time
from typing import Any

from openspawn import OpenSpawnClient
from openspawn.types import AgentRole, MemoryType, TaskPriority, TaskStatus

logger = logging.getLogger("openspawn.crewai")

try:
    from crewai import Agent, Crew, Task  # type: ignore[import-untyped]
except ImportError:
    raise ImportError(
        "CrewAI is required for the openspawn-crewai adapter. "
        "Install it with: pip install crewai"
    )


def _sanitize_agent_id(role: str) -> str:
    """Convert a CrewAI role string into a valid OpenSpawn agent_id."""
    return role.lower().replace(" ", "-").replace("_", "-")[:100]


def _truncate(text: str, max_length: int = 500) -> str:
    """Truncate text to max_length, appending ellipsis if truncated."""
    if len(text) <= max_length:
        return text
    return text[: max_length - 3] + "..."


class OpenSpawnCrew:
    """Wraps a CrewAI Crew to report all activity to OpenSpawn.

    Usage::

        from crewai import Agent, Task, Crew
        from openspawn import OpenSpawnClient
        from openspawn_crewai import OpenSpawnCrew

        crew = Crew(agents=[...], tasks=[...])
        client = OpenSpawnClient(api_url="...", agent_id="...", hmac_secret="...")
        os_crew = OpenSpawnCrew(crew, client)
        result = os_crew.kickoff()
    """

    def __init__(
        self,
        crew: Crew,
        client: OpenSpawnClient,
        *,
        auto_register: bool = True,
        default_priority: TaskPriority = TaskPriority.NORMAL,
        agent_level: int = 5,
        store_output_as_memory: bool = True,
    ) -> None:
        self.crew = crew
        self.client = client
        self.auto_register = auto_register
        self.default_priority = default_priority
        self.agent_level = agent_level
        self.store_output_as_memory = store_output_as_memory

        self._agent_map: dict[str, str] = {}  # crewai role → openspawn agent_id
        self._task_map: dict[int, str] = {}  # crewai task index → openspawn task_id

    def _register_agents(self) -> None:
        """Register all crew agents in OpenSpawn."""
        for agent in self.crew.agents:
            agent_id = _sanitize_agent_id(agent.role)
            try:
                info = self.client.register_agent(
                    agent_id=agent_id,
                    name=agent.role,
                    level=self.agent_level,
                    role=AgentRole.WORKER,
                    metadata={
                        "source": "crewai",
                        "goal": getattr(agent, "goal", None),
                        "backstory": _truncate(getattr(agent, "backstory", "") or "", 200),
                    },
                )
                self._agent_map[agent.role] = info.agent_id
                logger.info("Registered agent %s → %s", agent.role, info.agent_id)
            except Exception as exc:
                logger.warning("Failed to register agent %s: %s", agent.role, exc)
                self._agent_map[agent.role] = agent_id

    def _create_tasks(self) -> None:
        """Create OpenSpawn tasks for each crew task."""
        for idx, task in enumerate(self.crew.tasks):
            description = getattr(task, "description", str(task))
            expected_output = getattr(task, "expected_output", None)

            metadata: dict[str, Any] = {"source": "crewai", "task_index": idx}
            if expected_output:
                metadata["expected_output"] = _truncate(expected_output, 200)

            agent_role = getattr(task, "agent", None)
            if agent_role and hasattr(agent_role, "role"):
                agent_role = agent_role.role

            try:
                task_info = self.client.create_task(
                    title=_truncate(description, 100),
                    description=description,
                    priority=self.default_priority,
                    metadata=metadata,
                )
                self._task_map[idx] = task_info.id
                logger.info("Created task %d → %s", idx, task_info.id)
            except Exception as exc:
                logger.warning("Failed to create task %d: %s", idx, exc)

    def _report_task_start(self, idx: int) -> None:
        """Transition a task to in-progress."""
        task_id = self._task_map.get(idx)
        if task_id:
            try:
                self.client.transition_task(task_id, TaskStatus.IN_PROGRESS, reason="CrewAI kickoff started")
            except Exception as exc:
                logger.warning("Failed to transition task %s: %s", task_id, exc)

    def _report_completion(self, result: Any, elapsed: float) -> None:
        """Report crew completion to OpenSpawn."""
        # Transition all tasks to done
        for idx, task_id in self._task_map.items():
            try:
                self.client.transition_task(task_id, TaskStatus.DONE, reason="CrewAI kickoff completed")
            except Exception as exc:
                logger.warning("Failed to complete task %s: %s", task_id, exc)

        # Store the result as memory
        if self.store_output_as_memory and result:
            result_str = str(result)
            try:
                self.client.store_memory(
                    _truncate(result_str, 2000),
                    memory_type=MemoryType.OBSERVATION,
                    metadata={
                        "source": "crewai",
                        "elapsed_seconds": round(elapsed, 2),
                        "agent_count": len(self.crew.agents),
                        "task_count": len(self.crew.tasks),
                    },
                )
            except Exception as exc:
                logger.warning("Failed to store result memory: %s", exc)

        # Emit completion event
        try:
            self.client.emit_event(
                "crew.completed",
                {
                    "elapsed_seconds": round(elapsed, 2),
                    "agent_count": len(self.crew.agents),
                    "task_count": len(self.crew.tasks),
                    "result_preview": _truncate(str(result), 200) if result else None,
                },
            )
        except Exception as exc:
            logger.warning("Failed to emit completion event: %s", exc)

    def _report_failure(self, error: Exception, elapsed: float) -> None:
        """Report crew failure to OpenSpawn."""
        for idx, task_id in self._task_map.items():
            try:
                self.client.transition_task(task_id, TaskStatus.BLOCKED, reason=f"CrewAI error: {error}")
            except Exception:
                pass

        try:
            self.client.emit_event(
                "crew.failed",
                {
                    "error": str(error),
                    "error_type": type(error).__name__,
                    "elapsed_seconds": round(elapsed, 2),
                },
            )
        except Exception:
            pass

    def kickoff(self, inputs: dict[str, Any] | None = None) -> Any:
        """Run the crew with full OpenSpawn reporting.

        Args:
            inputs: Optional inputs to pass to the crew kickoff.

        Returns:
            The crew's kickoff result.
        """
        # Register agents
        if self.auto_register:
            self._register_agents()

        # Create tasks
        self._create_tasks()

        # Transition tasks to in-progress
        for idx in self._task_map:
            self._report_task_start(idx)

        # Run the crew
        start = time.monotonic()
        try:
            result = self.crew.kickoff(inputs=inputs)
            elapsed = time.monotonic() - start
            self._report_completion(result, elapsed)
            return result
        except Exception as exc:
            elapsed = time.monotonic() - start
            self._report_failure(exc, elapsed)
            raise
