"""Tests for the AutoGen adapter — all AutoGen classes are mocked."""

from __future__ import annotations

import sys
from dataclasses import dataclass, field
from types import ModuleType
from typing import Any
from unittest.mock import MagicMock, patch

import pytest


# ── Mock AutoGen before importing the adapter ─────────────────────────────────


class MockConversableAgent:
    """Mock AutoGen ConversableAgent."""

    def __init__(self, name: str = "assistant", system_message: str = "", **kwargs: Any) -> None:
        self.name = name
        self.system_message = system_message
        self._chat_results: list[Any] = []

    def initiate_chat(self, recipient: Any, message: str = "", **kwargs: Any) -> Any:
        return {"chat_history": [{"role": "user", "content": message}]}


class MockGroupChat:
    """Mock AutoGen GroupChat."""

    def __init__(
        self,
        agents: list[MockConversableAgent] | None = None,
        messages: list[dict] | None = None,
        max_round: int = 10,
        **kwargs: Any,
    ) -> None:
        self.agents = agents or []
        self.messages = messages or []
        self.max_round = max_round


class MockGroupChatManager:
    """Mock AutoGen GroupChatManager."""

    def __init__(self, groupchat: MockGroupChat, **kwargs: Any) -> None:
        self.groupchat = groupchat


# Install mock autogen module
mock_autogen = ModuleType("autogen")
mock_autogen.ConversableAgent = MockConversableAgent  # type: ignore
mock_autogen.GroupChat = MockGroupChat  # type: ignore
mock_autogen.GroupChatManager = MockGroupChatManager  # type: ignore
sys.modules["autogen"] = mock_autogen

from openspawn_autogen.adapter import OpenSpawnConversableAgent, OpenSpawnGroupChat


# ── Fixtures ──────────────────────────────────────────────────────────────────


@pytest.fixture
def mock_client() -> MagicMock:
    client = MagicMock()
    client.register_agent.return_value = MagicMock(agent_id="autogen-researcher")
    client.create_task.return_value = MagicMock(id="task-uuid-1")
    client.transition_task.return_value = {"status": "done"}
    client.store_memory.return_value = MagicMock(id="mem-1")
    client.emit_event.return_value = {"event_id": "evt-1"}
    return client


@pytest.fixture
def agents() -> list[MockConversableAgent]:
    return [
        MockConversableAgent(name="researcher", system_message="You are a researcher"),
        MockConversableAgent(name="writer", system_message="You are a writer"),
        MockConversableAgent(name="critic", system_message="You are a critic"),
    ]


@pytest.fixture
def group_chat(agents: list[MockConversableAgent]) -> MockGroupChat:
    return MockGroupChat(
        agents=agents,
        messages=[
            {"name": "researcher", "content": "I found some data"},
            {"name": "writer", "content": "Let me write it up"},
        ],
        max_round=10,
    )


# ── OpenSpawnConversableAgent Tests ───────────────────────────────────────────


class TestOpenSpawnConversableAgent:
    def test_register(self, mock_client: MagicMock, agents: list[MockConversableAgent]) -> None:
        os_agent = OpenSpawnConversableAgent(agents[0], mock_client)
        result = os_agent.register()

        mock_client.register_agent.assert_called_once()
        assert result == "autogen-researcher"

    def test_register_sets_flag(self, mock_client: MagicMock, agents: list[MockConversableAgent]) -> None:
        os_agent = OpenSpawnConversableAgent(agents[0], mock_client)
        assert not os_agent._registered

        os_agent.register()
        assert os_agent._registered

    def test_register_failure_returns_fallback(self, mock_client: MagicMock, agents: list[MockConversableAgent]) -> None:
        mock_client.register_agent.side_effect = Exception("Failed")
        os_agent = OpenSpawnConversableAgent(agents[0], mock_client)
        result = os_agent.register()

        assert result == "autogen-researcher"
        assert not os_agent._registered

    def test_report_message(self, mock_client: MagicMock, agents: list[MockConversableAgent]) -> None:
        os_agent = OpenSpawnConversableAgent(agents[0], mock_client)
        os_agent.register()
        os_agent.report_message("Hello world", recipient="writer")

        mock_client.emit_event.assert_called_once()
        call_args = mock_client.emit_event.call_args
        assert call_args[0][0] == "autogen.message.sent"

    def test_report_message_tracking_disabled(self, mock_client: MagicMock, agents: list[MockConversableAgent]) -> None:
        os_agent = OpenSpawnConversableAgent(agents[0], mock_client, track_messages=False)
        os_agent.report_message("Hello")

        mock_client.emit_event.assert_not_called()

    def test_store_conversation_memory(self, mock_client: MagicMock, agents: list[MockConversableAgent]) -> None:
        os_agent = OpenSpawnConversableAgent(agents[0], mock_client)
        os_agent.register()
        os_agent.store_conversation_memory("Full conversation...", summary="Short summary")

        mock_client.store_memory.assert_called_once()
        content = mock_client.store_memory.call_args[0][0]
        assert content == "Short summary"

    def test_store_conversation_no_summary(self, mock_client: MagicMock, agents: list[MockConversableAgent]) -> None:
        os_agent = OpenSpawnConversableAgent(agents[0], mock_client)
        os_agent.store_conversation_memory("Full conversation text here")

        mock_client.store_memory.assert_called_once()
        content = mock_client.store_memory.call_args[0][0]
        assert "Full conversation" in content

    def test_sanitize_name(self, mock_client: MagicMock) -> None:
        agent = MockConversableAgent(name="Senior Data Analyst")
        os_agent = OpenSpawnConversableAgent(agent, mock_client)
        assert os_agent._sanitize_name() == "autogen-senior-data-analyst"

    def test_handles_report_error(self, mock_client: MagicMock, agents: list[MockConversableAgent]) -> None:
        mock_client.emit_event.side_effect = Exception("Network error")
        os_agent = OpenSpawnConversableAgent(agents[0], mock_client)
        # Should not raise
        os_agent.report_message("Hello")


# ── OpenSpawnGroupChat Tests ─────────────────────────────────────────────────


class TestOpenSpawnGroupChat:
    def test_run_registers_agents(self, mock_client: MagicMock, group_chat: MockGroupChat, agents: list[MockConversableAgent]) -> None:
        os_chat = OpenSpawnGroupChat(group_chat, mock_client)
        os_chat.run(initiator=agents[0], message="Let's discuss AI")

        assert mock_client.register_agent.call_count == 3

    def test_run_creates_task(self, mock_client: MagicMock, group_chat: MockGroupChat, agents: list[MockConversableAgent]) -> None:
        os_chat = OpenSpawnGroupChat(group_chat, mock_client)
        os_chat.run(initiator=agents[0], message="Discuss AI trends")

        mock_client.create_task.assert_called_once()
        title = mock_client.create_task.call_args.kwargs.get("title", "")
        assert "AutoGen GroupChat" in title

    def test_run_transitions_task(self, mock_client: MagicMock, group_chat: MockGroupChat, agents: list[MockConversableAgent]) -> None:
        os_chat = OpenSpawnGroupChat(group_chat, mock_client)
        os_chat.run(initiator=agents[0], message="Start")

        # Should transition to in-progress and then done
        assert mock_client.transition_task.call_count == 2

    def test_run_stores_transcript(self, mock_client: MagicMock, group_chat: MockGroupChat, agents: list[MockConversableAgent]) -> None:
        os_chat = OpenSpawnGroupChat(group_chat, mock_client)
        os_chat.run(initiator=agents[0], message="Start")

        mock_client.store_memory.assert_called_once()

    def test_run_emits_completion_event(self, mock_client: MagicMock, group_chat: MockGroupChat, agents: list[MockConversableAgent]) -> None:
        os_chat = OpenSpawnGroupChat(group_chat, mock_client)
        os_chat.run(initiator=agents[0], message="Start")

        event_calls = [c for c in mock_client.emit_event.call_args_list if c[0][0] == "autogen.groupchat.completed"]
        assert len(event_calls) == 1

    def test_run_returns_result(self, mock_client: MagicMock, group_chat: MockGroupChat, agents: list[MockConversableAgent]) -> None:
        os_chat = OpenSpawnGroupChat(group_chat, mock_client)
        result = os_chat.run(initiator=agents[0], message="Start")

        assert result is not None
        assert "chat_history" in result

    def test_run_skip_auto_register(self, mock_client: MagicMock, group_chat: MockGroupChat, agents: list[MockConversableAgent]) -> None:
        os_chat = OpenSpawnGroupChat(group_chat, mock_client, auto_register=False)
        os_chat.run(initiator=agents[0], message="Start")

        mock_client.register_agent.assert_not_called()

    def test_run_skip_transcript(self, mock_client: MagicMock, group_chat: MockGroupChat, agents: list[MockConversableAgent]) -> None:
        os_chat = OpenSpawnGroupChat(group_chat, mock_client, store_transcript=False)
        os_chat.run(initiator=agents[0], message="Start")

        mock_client.store_memory.assert_not_called()

    def test_run_handles_registration_failure(self, mock_client: MagicMock, group_chat: MockGroupChat, agents: list[MockConversableAgent]) -> None:
        mock_client.register_agent.side_effect = Exception("Failed")
        os_chat = OpenSpawnGroupChat(group_chat, mock_client)

        # Should not raise
        result = os_chat.run(initiator=agents[0], message="Start")
        assert result is not None

    def test_run_handles_chat_failure(self, mock_client: MagicMock, group_chat: MockGroupChat) -> None:
        failing_agent = MockConversableAgent(name="failer")
        failing_agent.initiate_chat = MagicMock(side_effect=RuntimeError("Chat failed"))

        os_chat = OpenSpawnGroupChat(group_chat, mock_client)

        with pytest.raises(RuntimeError, match="Chat failed"):
            os_chat.run(initiator=failing_agent, message="Start")

        # Should emit failure event
        fail_events = [c for c in mock_client.emit_event.call_args_list if c[0][0] == "autogen.groupchat.failed"]
        assert len(fail_events) == 1

    def test_empty_group_chat(self, mock_client: MagicMock) -> None:
        empty_chat = MockGroupChat(agents=[], messages=[])
        agent = MockConversableAgent(name="solo")
        os_chat = OpenSpawnGroupChat(empty_chat, mock_client)
        result = os_chat.run(initiator=agent, message="Hello")

        mock_client.register_agent.assert_not_called()
        assert result is not None

    def test_handles_task_creation_failure(self, mock_client: MagicMock, group_chat: MockGroupChat, agents: list[MockConversableAgent]) -> None:
        mock_client.create_task.side_effect = Exception("Task creation failed")
        os_chat = OpenSpawnGroupChat(group_chat, mock_client)

        result = os_chat.run(initiator=agents[0], message="Start")
        assert result is not None
