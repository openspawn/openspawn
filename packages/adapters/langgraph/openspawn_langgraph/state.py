"""OpenSpawn-backed checkpointer for LangGraph state persistence."""

from __future__ import annotations

import json
import logging
from typing import Any

from openspawn import OpenSpawnClient
from openspawn.types import MemoryType, MemoryVisibility

logger = logging.getLogger("openspawn.langgraph.state")


class OpenSpawnCheckpointer:
    """Stores LangGraph checkpoints in OpenSpawn memory.

    Provides a simple key-value interface that persists graph state
    as OpenSpawn memory entries, enabling cross-session state recovery.

    Usage::

        from openspawn import OpenSpawnClient
        from openspawn_langgraph import OpenSpawnCheckpointer

        client = OpenSpawnClient(...)
        checkpointer = OpenSpawnCheckpointer(client)
        checkpointer.save("thread-1", {"messages": [...], "step": 3})
        state = checkpointer.load("thread-1")
    """

    def __init__(
        self,
        client: OpenSpawnClient,
        *,
        prefix: str = "langgraph:checkpoint",
        visibility: MemoryVisibility = MemoryVisibility.ORG,
    ) -> None:
        self.client = client
        self.prefix = prefix
        self.visibility = visibility

    def save(self, thread_id: str, state: dict[str, Any]) -> str:
        """Save a checkpoint to OpenSpawn memory.

        Args:
            thread_id: Unique identifier for the graph execution thread.
            state: The graph state to persist.

        Returns:
            The memory entry ID.
        """
        content = json.dumps(state, default=str)
        try:
            mem = self.client.store_memory(
                content=f"[{self.prefix}:{thread_id}] {content}",
                memory_type=MemoryType.FACT,
                visibility=self.visibility,
                metadata={
                    "source": "langgraph",
                    "checkpoint_key": f"{self.prefix}:{thread_id}",
                    "thread_id": thread_id,
                },
            )
            logger.info("Saved checkpoint for thread %s → %s", thread_id, mem.id)
            return mem.id
        except Exception as exc:
            logger.error("Failed to save checkpoint for thread %s: %s", thread_id, exc)
            raise

    def load(self, thread_id: str) -> dict[str, Any] | None:
        """Load the latest checkpoint for a thread from OpenSpawn memory.

        Args:
            thread_id: The thread identifier to look up.

        Returns:
            The stored state dict, or None if no checkpoint exists.
        """
        try:
            results = self.client.search_memory(
                f"{self.prefix}:{thread_id}",
                limit=1,
                similarity_threshold=0.9,
            )
            if not results:
                return None

            content = results[0].get("content", "")
            # Extract JSON after the prefix tag
            prefix_tag = f"[{self.prefix}:{thread_id}] "
            if prefix_tag in content:
                json_str = content.split(prefix_tag, 1)[1]
            else:
                json_str = content

            return json.loads(json_str)
        except json.JSONDecodeError:
            logger.warning("Failed to parse checkpoint for thread %s", thread_id)
            return None
        except Exception as exc:
            logger.error("Failed to load checkpoint for thread %s: %s", thread_id, exc)
            return None
