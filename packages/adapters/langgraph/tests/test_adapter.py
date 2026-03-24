"""Tests for the LangGraph adapter — all LangGraph classes are mocked."""

from __future__ import annotations

import json
import sys
from types import ModuleType
from typing import Any
from unittest.mock import MagicMock, patch

import pytest


# ── Mock LangGraph before importing the adapter ──────────────────────────────


class MockCompiledGraph:
    """Mock compiled graph that records invocations."""

    def __init__(self) -> None:
        self.invocations: list[Any] = []

    def invoke(self, state: Any) -> Any:
        self.invocations.append(state)
        return {"result": "done"}


class MockStateGraph:
    """Mock StateGraph that tracks nodes and edges."""

    def __init__(self, state_schema: Any = None) -> None:
        self._nodes: dict[str, Any] = {}
        self._edges: list[tuple[str, str]] = []
        self.state_schema = state_schema
        self._compiled = MockCompiledGraph()

    def add_node(self, name: str, fn: Any) -> None:
        self._nodes[name] = fn

    def add_edge(self, source: str, target: str) -> None:
        self._edges.append((source, target))

    def compile(self, **kwargs: Any) -> MockCompiledGraph:
        return self._compiled


# Install mock langgraph module
mock_langgraph = ModuleType("langgraph")
mock_langgraph_graph = ModuleType("langgraph.graph")
mock_langgraph_graph.StateGraph = MockStateGraph  # type: ignore
mock_langgraph.graph = mock_langgraph_graph  # type: ignore
sys.modules["langgraph"] = mock_langgraph
sys.modules["langgraph.graph"] = mock_langgraph_graph

from openspawn_langgraph.adapter import OpenSpawnGraph
from openspawn_langgraph.state import OpenSpawnCheckpointer


# ── Fixtures ──────────────────────────────────────────────────────────────────


def researcher_fn(state: dict) -> dict:
    return {"research": "findings"}


def writer_fn(state: dict) -> dict:
    return {"report": "written"}


@pytest.fixture
def mock_client() -> MagicMock:
    client = MagicMock()
    client.register_agent.return_value = MagicMock(agent_id="langgraph-researcher")
    client.create_task.return_value = MagicMock(id="task-uuid-1")
    client.transition_task.return_value = {"status": "in_progress"}
    client.store_memory.return_value = MagicMock(id="mem-1")
    client.emit_event.return_value = {"event_id": "evt-1"}
    client.search_memory.return_value = []
    return client


@pytest.fixture
def graph() -> MockStateGraph:
    g = MockStateGraph()
    g.add_node("researcher", researcher_fn)
    g.add_node("writer", writer_fn)
    g.add_edge("researcher", "writer")
    return g


# ── OpenSpawnGraph Tests ──────────────────────────────────────────────────────


class TestOpenSpawnGraph:
    def test_compile_registers_nodes(self, mock_client: MagicMock, graph: MockStateGraph) -> None:
        os_graph = OpenSpawnGraph(graph, mock_client)
        os_graph.compile()

        assert mock_client.register_agent.call_count == 2

    def test_compile_creates_task(self, mock_client: MagicMock, graph: MockStateGraph) -> None:
        os_graph = OpenSpawnGraph(graph, mock_client)
        os_graph.compile()

        mock_client.create_task.assert_called_once()
        call_kwargs = mock_client.create_task.call_args
        assert "LangGraph execution" in call_kwargs.kwargs.get("title", call_kwargs[0][0] if call_kwargs[0] else "")

    def test_compile_wraps_node_functions(self, mock_client: MagicMock, graph: MockStateGraph) -> None:
        os_graph = OpenSpawnGraph(graph, mock_client)
        os_graph.compile()

        # Node functions should be wrapped (not the originals)
        assert graph._nodes["researcher"] is not researcher_fn
        assert graph._nodes["writer"] is not writer_fn

    def test_wrapped_node_emits_events(self, mock_client: MagicMock, graph: MockStateGraph) -> None:
        os_graph = OpenSpawnGraph(graph, mock_client)
        os_graph.compile()

        # Call the wrapped node
        graph._nodes["researcher"]({"input": "test"})

        # Should emit entered + completed events
        event_calls = mock_client.emit_event.call_args_list
        event_types = [c[0][0] for c in event_calls]
        assert "langgraph.node.entered" in event_types
        assert "langgraph.node.completed" in event_types

    def test_wrapped_node_stores_checkpoint(self, mock_client: MagicMock, graph: MockStateGraph) -> None:
        os_graph = OpenSpawnGraph(graph, mock_client)
        os_graph.compile()

        graph._nodes["researcher"]({"input": "test"})

        mock_client.store_memory.assert_called_once()

    def test_wrapped_node_emits_failure(self, mock_client: MagicMock, graph: MockStateGraph) -> None:
        def failing_fn(state: dict) -> dict:
            raise ValueError("Node failed")

        graph._nodes["researcher"] = failing_fn

        os_graph = OpenSpawnGraph(graph, mock_client)
        os_graph.compile()

        with pytest.raises(ValueError, match="Node failed"):
            graph._nodes["researcher"]({"input": "test"})

        event_calls = mock_client.emit_event.call_args_list
        event_types = [c[0][0] for c in event_calls]
        assert "langgraph.node.failed" in event_types

    def test_compile_skips_registration(self, mock_client: MagicMock, graph: MockStateGraph) -> None:
        os_graph = OpenSpawnGraph(graph, mock_client, register_nodes_as_agents=False)
        os_graph.compile()

        mock_client.register_agent.assert_not_called()

    def test_compile_skips_tracking(self, mock_client: MagicMock, graph: MockStateGraph) -> None:
        os_graph = OpenSpawnGraph(graph, mock_client, track_transitions=False, store_checkpoints=False)
        os_graph.compile()

        # Nodes should NOT be wrapped when both tracking and checkpoints are off
        assert graph._nodes["researcher"] is researcher_fn

    def test_compile_returns_compiled_graph(self, mock_client: MagicMock, graph: MockStateGraph) -> None:
        os_graph = OpenSpawnGraph(graph, mock_client)
        compiled = os_graph.compile()

        assert isinstance(compiled, MockCompiledGraph)

    def test_compile_transitions_task(self, mock_client: MagicMock, graph: MockStateGraph) -> None:
        os_graph = OpenSpawnGraph(graph, mock_client)
        os_graph.compile()

        mock_client.transition_task.assert_called_once()

    def test_handles_registration_failure(self, mock_client: MagicMock, graph: MockStateGraph) -> None:
        mock_client.register_agent.side_effect = Exception("Registration failed")
        os_graph = OpenSpawnGraph(graph, mock_client)

        # Should not raise
        compiled = os_graph.compile()
        assert compiled is not None

    def test_handles_task_creation_failure(self, mock_client: MagicMock, graph: MockStateGraph) -> None:
        mock_client.create_task.side_effect = Exception("Task failed")
        os_graph = OpenSpawnGraph(graph, mock_client)

        compiled = os_graph.compile()
        assert compiled is not None

    def test_empty_graph(self, mock_client: MagicMock) -> None:
        empty_graph = MockStateGraph()
        os_graph = OpenSpawnGraph(empty_graph, mock_client)
        compiled = os_graph.compile()

        mock_client.register_agent.assert_not_called()
        assert compiled is not None


# ── OpenSpawnCheckpointer Tests ───────────────────────────────────────────────


class TestOpenSpawnCheckpointer:
    def test_save_checkpoint(self, mock_client: MagicMock) -> None:
        cp = OpenSpawnCheckpointer(mock_client)
        result = cp.save("thread-1", {"messages": ["hello"], "step": 1})

        mock_client.store_memory.assert_called_once()
        call_kwargs = mock_client.store_memory.call_args
        content = call_kwargs.kwargs.get("content", call_kwargs[0][0] if call_kwargs[0] else "")
        assert "thread-1" in content
        assert result == "mem-1"

    def test_save_includes_metadata(self, mock_client: MagicMock) -> None:
        cp = OpenSpawnCheckpointer(mock_client)
        cp.save("thread-1", {"step": 1})

        call_kwargs = mock_client.store_memory.call_args.kwargs
        assert call_kwargs["metadata"]["thread_id"] == "thread-1"
        assert call_kwargs["metadata"]["source"] == "langgraph"

    def test_load_checkpoint_found(self, mock_client: MagicMock) -> None:
        state = {"messages": ["hello"], "step": 3}
        mock_client.search_memory.return_value = [
            {"content": f"[langgraph:checkpoint:thread-1] {json.dumps(state)}"}
        ]

        cp = OpenSpawnCheckpointer(mock_client)
        result = cp.load("thread-1")

        assert result == state
        assert result["step"] == 3

    def test_load_checkpoint_not_found(self, mock_client: MagicMock) -> None:
        mock_client.search_memory.return_value = []

        cp = OpenSpawnCheckpointer(mock_client)
        result = cp.load("nonexistent")

        assert result is None

    def test_load_checkpoint_invalid_json(self, mock_client: MagicMock) -> None:
        mock_client.search_memory.return_value = [{"content": "not valid json"}]

        cp = OpenSpawnCheckpointer(mock_client)
        result = cp.load("thread-1")

        assert result is None

    def test_load_handles_error(self, mock_client: MagicMock) -> None:
        mock_client.search_memory.side_effect = Exception("Network error")

        cp = OpenSpawnCheckpointer(mock_client)
        result = cp.load("thread-1")

        assert result is None

    def test_save_raises_on_error(self, mock_client: MagicMock) -> None:
        mock_client.store_memory.side_effect = Exception("Storage failed")

        cp = OpenSpawnCheckpointer(mock_client)
        with pytest.raises(Exception, match="Storage failed"):
            cp.save("thread-1", {"step": 1})

    def test_custom_prefix(self, mock_client: MagicMock) -> None:
        cp = OpenSpawnCheckpointer(mock_client, prefix="custom:prefix")
        cp.save("t1", {"data": "value"})

        call_kwargs = mock_client.store_memory.call_args.kwargs
        assert "custom:prefix:t1" in call_kwargs.get("content", call_kwargs.get("content", ""))
