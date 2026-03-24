"""LangGraph adapter — wraps a LangGraph StateGraph to report state transitions to OpenSpawn."""

from __future__ import annotations

import functools
import logging
import time
from typing import Any, Callable, TypeVar

from openspawn import OpenSpawnClient
from openspawn.types import AgentRole, MemoryType, TaskPriority, TaskStatus

logger = logging.getLogger("openspawn.langgraph")

try:
    from langgraph.graph import StateGraph  # type: ignore[import-untyped]
except ImportError:
    raise ImportError(
        "LangGraph is required for the openspawn-langgraph adapter. "
        "Install it with: pip install langgraph"
    )


T = TypeVar("T")


class OpenSpawnGraph:
    """Wraps a LangGraph StateGraph to report execution to OpenSpawn.

    Maps graph nodes to OpenSpawn agents and state transitions to events.

    Usage::

        from langgraph.graph import StateGraph
        from openspawn import OpenSpawnClient
        from openspawn_langgraph import OpenSpawnGraph

        graph = StateGraph(MyState)
        graph.add_node("researcher", researcher_fn)
        graph.add_node("writer", writer_fn)
        graph.add_edge("researcher", "writer")

        client = OpenSpawnClient(...)
        os_graph = OpenSpawnGraph(graph, client)
        compiled = os_graph.compile()
        result = compiled.invoke(initial_state)
    """

    def __init__(
        self,
        graph: StateGraph,
        client: OpenSpawnClient,
        *,
        register_nodes_as_agents: bool = True,
        track_transitions: bool = True,
        store_checkpoints: bool = True,
        agent_level: int = 5,
    ) -> None:
        self.graph = graph
        self.client = client
        self.register_nodes_as_agents = register_nodes_as_agents
        self.track_transitions = track_transitions
        self.store_checkpoints = store_checkpoints
        self.agent_level = agent_level

        self._node_agent_map: dict[str, str] = {}
        self._task_id: str | None = None

    def _register_nodes(self) -> None:
        """Register each graph node as an OpenSpawn agent."""
        nodes = getattr(self.graph, "_nodes", getattr(self.graph, "nodes", {}))
        for node_name in nodes:
            if node_name in ("__start__", "__end__"):
                continue
            agent_id = f"langgraph-{node_name}".lower().replace(" ", "-")[:100]
            try:
                info = self.client.register_agent(
                    agent_id=agent_id,
                    name=f"LangGraph: {node_name}",
                    level=self.agent_level,
                    role=AgentRole.WORKER,
                    metadata={"source": "langgraph", "node_name": node_name},
                )
                self._node_agent_map[node_name] = info.agent_id
                logger.info("Registered node %s → %s", node_name, info.agent_id)
            except Exception as exc:
                logger.warning("Failed to register node %s: %s", node_name, exc)
                self._node_agent_map[node_name] = agent_id

    def _create_graph_task(self) -> None:
        """Create a parent task for the graph execution."""
        try:
            nodes = getattr(self.graph, "_nodes", getattr(self.graph, "nodes", {}))
            node_names = [n for n in nodes if n not in ("__start__", "__end__")]
            task_info = self.client.create_task(
                title=f"LangGraph execution ({len(node_names)} nodes)",
                description=f"Graph nodes: {', '.join(node_names)}",
                priority=TaskPriority.NORMAL,
                metadata={"source": "langgraph", "node_count": len(node_names)},
            )
            self._task_id = task_info.id
        except Exception as exc:
            logger.warning("Failed to create graph task: %s", exc)

    def _wrap_node(self, node_name: str, fn: Callable[..., T]) -> Callable[..., T]:
        """Wrap a node function to emit events on entry and exit."""
        client = self.client
        track = self.track_transitions
        store = self.store_checkpoints

        @functools.wraps(fn)
        def wrapper(*args: Any, **kwargs: Any) -> T:
            if track:
                try:
                    client.emit_event(
                        "langgraph.node.entered",
                        {"node": node_name, "task_id": self._task_id},
                    )
                except Exception as exc:
                    logger.warning("Failed to emit node entry event for %s: %s", node_name, exc)

            start = time.monotonic()
            try:
                result = fn(*args, **kwargs)
                elapsed = time.monotonic() - start

                if track:
                    try:
                        client.emit_event(
                            "langgraph.node.completed",
                            {
                                "node": node_name,
                                "elapsed_seconds": round(elapsed, 3),
                                "task_id": self._task_id,
                            },
                        )
                    except Exception as exc:
                        logger.warning("Failed to emit node completion for %s: %s", node_name, exc)

                if store and result is not None:
                    try:
                        state_preview = str(result)[:500]
                        client.store_memory(
                            f"[LangGraph:{node_name}] {state_preview}",
                            memory_type=MemoryType.OBSERVATION,
                            metadata={
                                "source": "langgraph",
                                "node": node_name,
                                "elapsed_seconds": round(elapsed, 3),
                            },
                        )
                    except Exception as exc:
                        logger.warning("Failed to store checkpoint for %s: %s", node_name, exc)

                return result
            except Exception as exc:
                elapsed = time.monotonic() - start
                if track:
                    try:
                        client.emit_event(
                            "langgraph.node.failed",
                            {
                                "node": node_name,
                                "error": str(exc),
                                "error_type": type(exc).__name__,
                                "elapsed_seconds": round(elapsed, 3),
                                "task_id": self._task_id,
                            },
                        )
                    except Exception:
                        pass
                raise

        return wrapper  # type: ignore[return-value]

    def compile(self, **kwargs: Any) -> Any:
        """Compile the graph with OpenSpawn instrumentation.

        Wraps each node function to emit events and store checkpoints.
        Returns the compiled LangGraph runnable.
        """
        if self.register_nodes_as_agents:
            self._register_nodes()

        self._create_graph_task()

        # Wrap node functions
        if self.track_transitions or self.store_checkpoints:
            nodes = getattr(self.graph, "_nodes", getattr(self.graph, "nodes", {}))
            for node_name in list(nodes):
                if node_name in ("__start__", "__end__"):
                    continue
                original_fn = nodes[node_name]
                if callable(original_fn):
                    nodes[node_name] = self._wrap_node(node_name, original_fn)

        compiled = self.graph.compile(**kwargs)

        if self._task_id:
            try:
                self.client.transition_task(
                    self._task_id,
                    TaskStatus.IN_PROGRESS,
                    reason="Graph compiled and ready",
                )
            except Exception as exc:
                logger.warning("Failed to transition graph task: %s", exc)

        return compiled
