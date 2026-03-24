"""Tests for the CrewAI adapter — all CrewAI classes are mocked."""

from __future__ import annotations

import sys
from dataclasses import dataclass, field
from types import ModuleType
from typing import Any
from unittest.mock import MagicMock, call, patch

import pytest


# ── Mock CrewAI before importing the adapter ──────────────────────────────────


@dataclass
class MockAgent:
    role: str = "Researcher"
    goal: str = "Find information"
    backstory: str = "An experienced researcher"


@dataclass
class MockTask:
    description: str = "Research the topic"
    expected_output: str = "A summary"
    agent: MockAgent | None = None


@dataclass
class MockCrew:
    agents: list[MockAgent] = field(default_factory=list)
    tasks: list[MockTask] = field(default_factory=list)
    _kickoff_result: Any = "Crew completed successfully"
    _should_fail: bool = False

    def kickoff(self, inputs: dict | None = None) -> Any:
        if self._should_fail:
            raise RuntimeError("Crew execution failed")
        return self._kickoff_result


# Install mock crewai module
mock_crewai = ModuleType("crewai")
mock_crewai.Agent = MockAgent  # type: ignore
mock_crewai.Task = MockTask  # type: ignore
mock_crewai.Crew = MockCrew  # type: ignore
sys.modules["crewai"] = mock_crewai

from openspawn_crewai.adapter import OpenSpawnCrew, _sanitize_agent_id, _truncate
from openspawn_crewai.hooks import OpenSpawnTaskCallback


# ── Fixtures ──────────────────────────────────────────────────────────────────


@pytest.fixture
def mock_client() -> MagicMock:
    client = MagicMock()
    client.register_agent.return_value = MagicMock(agent_id="researcher", hmac_secret="secret")
    client.create_task.return_value = MagicMock(id="task-uuid-1")
    client.transition_task.return_value = {"status": "done"}
    client.store_memory.return_value = MagicMock(id="mem-1")
    client.emit_event.return_value = {"event_id": "evt-1"}
    return client


@pytest.fixture
def crew() -> MockCrew:
    agents = [MockAgent(role="Researcher"), MockAgent(role="Writer")]
    tasks = [
        MockTask(description="Research AI trends", agent=agents[0]),
        MockTask(description="Write a report", agent=agents[1]),
    ]
    return MockCrew(agents=agents, tasks=tasks)


# ── Utility Tests ─────────────────────────────────────────────────────────────


class TestUtilities:
    def test_sanitize_agent_id(self) -> None:
        assert _sanitize_agent_id("Senior Researcher") == "senior-researcher"
        assert _sanitize_agent_id("data_analyst") == "data-analyst"
        assert _sanitize_agent_id("A" * 200) == "a" * 100

    def test_truncate(self) -> None:
        assert _truncate("short", 100) == "short"
        assert _truncate("a" * 50, 20) == "a" * 17 + "..."
        assert len(_truncate("x" * 1000, 100)) == 100


# ── OpenSpawnCrew Tests ───────────────────────────────────────────────────────


class TestOpenSpawnCrew:
    def test_kickoff_registers_agents(self, mock_client: MagicMock, crew: MockCrew) -> None:
        os_crew = OpenSpawnCrew(crew, mock_client)
        os_crew.kickoff()

        assert mock_client.register_agent.call_count == 2
        calls = mock_client.register_agent.call_args_list
        assert calls[0].kwargs.get("agent_id") or calls[0][1][0] if calls[0][1] else True

    def test_kickoff_creates_tasks(self, mock_client: MagicMock, crew: MockCrew) -> None:
        os_crew = OpenSpawnCrew(crew, mock_client)
        os_crew.kickoff()

        assert mock_client.create_task.call_count == 2

    def test_kickoff_transitions_tasks(self, mock_client: MagicMock, crew: MockCrew) -> None:
        os_crew = OpenSpawnCrew(crew, mock_client)
        os_crew.kickoff()

        # Should transition to in-progress (2 tasks) and then to done (2 tasks)
        transition_calls = mock_client.transition_task.call_args_list
        assert len(transition_calls) == 4  # 2 in-progress + 2 done

    def test_kickoff_returns_crew_result(self, mock_client: MagicMock, crew: MockCrew) -> None:
        crew._kickoff_result = {"summary": "AI is evolving"}
        os_crew = OpenSpawnCrew(crew, mock_client)
        result = os_crew.kickoff()

        assert result == {"summary": "AI is evolving"}

    def test_kickoff_passes_inputs(self, mock_client: MagicMock, crew: MockCrew) -> None:
        os_crew = OpenSpawnCrew(crew, mock_client)

        with patch.object(crew, "kickoff", return_value="result") as mock_kickoff:
            os_crew.kickoff(inputs={"topic": "AI"})
            mock_kickoff.assert_called_once_with(inputs={"topic": "AI"})

    def test_kickoff_stores_result_as_memory(self, mock_client: MagicMock, crew: MockCrew) -> None:
        os_crew = OpenSpawnCrew(crew, mock_client)
        os_crew.kickoff()

        mock_client.store_memory.assert_called_once()

    def test_kickoff_emits_completion_event(self, mock_client: MagicMock, crew: MockCrew) -> None:
        os_crew = OpenSpawnCrew(crew, mock_client)
        os_crew.kickoff()

        mock_client.emit_event.assert_called_once()
        event_call = mock_client.emit_event.call_args
        assert event_call[0][0] == "crew.completed"

    def test_kickoff_skip_auto_register(self, mock_client: MagicMock, crew: MockCrew) -> None:
        os_crew = OpenSpawnCrew(crew, mock_client, auto_register=False)
        os_crew.kickoff()

        mock_client.register_agent.assert_not_called()

    def test_kickoff_skip_memory_storage(self, mock_client: MagicMock, crew: MockCrew) -> None:
        os_crew = OpenSpawnCrew(crew, mock_client, store_output_as_memory=False)
        os_crew.kickoff()

        mock_client.store_memory.assert_not_called()

    def test_kickoff_handles_registration_failure(self, mock_client: MagicMock, crew: MockCrew) -> None:
        mock_client.register_agent.side_effect = Exception("Registration failed")
        os_crew = OpenSpawnCrew(crew, mock_client)

        # Should not raise — failures are logged
        result = os_crew.kickoff()
        assert result is not None

    def test_kickoff_handles_task_creation_failure(self, mock_client: MagicMock, crew: MockCrew) -> None:
        mock_client.create_task.side_effect = Exception("Task creation failed")
        os_crew = OpenSpawnCrew(crew, mock_client)

        result = os_crew.kickoff()
        assert result is not None

    def test_kickoff_reports_failure_on_error(self, mock_client: MagicMock, crew: MockCrew) -> None:
        crew._should_fail = True
        os_crew = OpenSpawnCrew(crew, mock_client)

        with pytest.raises(RuntimeError, match="Crew execution failed"):
            os_crew.kickoff()

        # Should emit failure event
        emit_calls = [c for c in mock_client.emit_event.call_args_list if c[0][0] == "crew.failed"]
        assert len(emit_calls) == 1

    def test_custom_priority(self, mock_client: MagicMock, crew: MockCrew) -> None:
        from openspawn.types import TaskPriority

        os_crew = OpenSpawnCrew(crew, mock_client, default_priority=TaskPriority.HIGH)
        os_crew.kickoff()

        for call_args in mock_client.create_task.call_args_list:
            assert call_args.kwargs.get("priority") == TaskPriority.HIGH

    def test_empty_crew(self, mock_client: MagicMock) -> None:
        empty_crew = MockCrew(agents=[], tasks=[])
        os_crew = OpenSpawnCrew(empty_crew, mock_client)
        result = os_crew.kickoff()

        mock_client.register_agent.assert_not_called()
        mock_client.create_task.assert_not_called()
        assert result is not None


# ── OpenSpawnTaskCallback Tests ───────────────────────────────────────────────


class TestOpenSpawnTaskCallback:
    def test_on_task_start(self, mock_client: MagicMock) -> None:
        callback = OpenSpawnTaskCallback(mock_client, task_id="task-1")
        callback.on_task_start(MockTask())

        mock_client.transition_task.assert_called_once()
        mock_client.emit_event.assert_called_once()

    def test_on_task_complete(self, mock_client: MagicMock) -> None:
        callback = OpenSpawnTaskCallback(mock_client, task_id="task-1")
        callback.on_task_complete(MockTask(), "output text")

        mock_client.transition_task.assert_called_once()
        mock_client.store_memory.assert_called_once()

    def test_on_task_error(self, mock_client: MagicMock) -> None:
        callback = OpenSpawnTaskCallback(mock_client, task_id="task-1")
        callback.on_task_error(MockTask(), RuntimeError("fail"))

        mock_client.transition_task.assert_called_once()
        mock_client.emit_event.assert_called_once()

    def test_no_task_id_skips_transition(self, mock_client: MagicMock) -> None:
        callback = OpenSpawnTaskCallback(mock_client, task_id=None)
        callback.on_task_start(MockTask())

        mock_client.transition_task.assert_not_called()
        mock_client.emit_event.assert_called_once()

    def test_store_output_disabled(self, mock_client: MagicMock) -> None:
        callback = OpenSpawnTaskCallback(mock_client, task_id="t1", store_output=False)
        callback.on_task_complete(MockTask(), "output")

        mock_client.store_memory.assert_not_called()

    def test_handles_client_errors_gracefully(self, mock_client: MagicMock) -> None:
        mock_client.transition_task.side_effect = Exception("Network error")
        mock_client.emit_event.side_effect = Exception("Network error")

        callback = OpenSpawnTaskCallback(mock_client, task_id="t1")
        # Should not raise
        callback.on_task_start(MockTask())
        callback.on_task_complete(MockTask(), "output")
        callback.on_task_error(MockTask(), RuntimeError("fail"))
