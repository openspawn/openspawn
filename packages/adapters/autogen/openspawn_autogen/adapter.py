"""AutoGen adapter — wraps AutoGen agents and group chats with OpenSpawn coordination."""

from __future__ import annotations

import logging
import time
from typing import Any

from openspawn import OpenSpawnClient
from openspawn.types import AgentRole, MemoryType, TaskPriority, TaskStatus

logger = logging.getLogger("openspawn.autogen")

try:
    from autogen import ConversableAgent, GroupChat, GroupChatManager  # type: ignore[import-untyped]
except ImportError:
    raise ImportError(
        "AutoGen is required for the openspawn-autogen adapter. "
        "Install it with: pip install pyautogen"
    )


class OpenSpawnConversableAgent:
    """Wraps an AutoGen ConversableAgent to report messages to OpenSpawn.

    Usage::

        from autogen import ConversableAgent
        from openspawn import OpenSpawnClient
        from openspawn_autogen import OpenSpawnConversableAgent

        agent = ConversableAgent(name="researcher", ...)
        client = OpenSpawnClient(...)
        os_agent = OpenSpawnConversableAgent(agent, client)
        os_agent.register()
    """

    def __init__(
        self,
        agent: ConversableAgent,
        client: OpenSpawnClient,
        *,
        level: int = 5,
        role: AgentRole = AgentRole.WORKER,
        track_messages: bool = True,
    ) -> None:
        self.agent = agent
        self.client = client
        self.level = level
        self.role = role
        self.track_messages = track_messages
        self._registered = False
        self._agent_id: str | None = None

    def _sanitize_name(self) -> str:
        """Convert agent name to valid OpenSpawn agent_id."""
        name = getattr(self.agent, "name", "autogen-agent")
        return f"autogen-{name}".lower().replace(" ", "-").replace("_", "-")[:100]

    def register(self) -> str:
        """Register this agent in OpenSpawn.

        Returns:
            The OpenSpawn agent_id.
        """
        agent_id = self._sanitize_name()
        name = getattr(self.agent, "name", agent_id)

        try:
            info = self.client.register_agent(
                agent_id=agent_id,
                name=name,
                level=self.level,
                role=self.role,
                metadata={
                    "source": "autogen",
                    "system_message": str(getattr(self.agent, "system_message", ""))[:200],
                },
            )
            self._agent_id = info.agent_id
            self._registered = True
            logger.info("Registered AutoGen agent %s → %s", name, info.agent_id)
            return info.agent_id
        except Exception as exc:
            logger.warning("Failed to register agent %s: %s", name, exc)
            self._agent_id = agent_id
            return agent_id

    def report_message(self, message: str, recipient: str | None = None) -> None:
        """Report a message exchange to OpenSpawn."""
        if not self.track_messages:
            return

        try:
            self.client.emit_event(
                "autogen.message.sent",
                {
                    "sender": self._agent_id or self._sanitize_name(),
                    "recipient": recipient,
                    "message_preview": message[:200],
                },
            )
        except Exception as exc:
            logger.warning("Failed to report message: %s", exc)

    def store_conversation_memory(self, conversation: str, summary: str | None = None) -> None:
        """Store conversation history as OpenSpawn memory."""
        content = summary or conversation[:2000]
        try:
            self.client.store_memory(
                content,
                memory_type=MemoryType.OBSERVATION,
                metadata={
                    "source": "autogen",
                    "agent_id": self._agent_id or self._sanitize_name(),
                },
            )
        except Exception as exc:
            logger.warning("Failed to store conversation memory: %s", exc)


class OpenSpawnGroupChat:
    """Wraps an AutoGen GroupChat with OpenSpawn coordination.

    Usage::

        from autogen import ConversableAgent, GroupChat, GroupChatManager
        from openspawn import OpenSpawnClient
        from openspawn_autogen import OpenSpawnGroupChat

        agents = [agent1, agent2, agent3]
        group_chat = GroupChat(agents=agents, messages=[], max_round=10)
        client = OpenSpawnClient(...)

        os_chat = OpenSpawnGroupChat(group_chat, client)
        os_chat.run(initiator=agent1, message="Let's discuss AI trends")
    """

    def __init__(
        self,
        group_chat: GroupChat,
        client: OpenSpawnClient,
        *,
        auto_register: bool = True,
        agent_level: int = 5,
        store_transcript: bool = True,
    ) -> None:
        self.group_chat = group_chat
        self.client = client
        self.auto_register = auto_register
        self.agent_level = agent_level
        self.store_transcript = store_transcript

        self._agent_map: dict[str, str] = {}  # agent name → openspawn agent_id
        self._task_id: str | None = None

    def _register_agents(self) -> None:
        """Register all group chat agents in OpenSpawn."""
        for agent in self.group_chat.agents:
            name = getattr(agent, "name", str(agent))
            agent_id = f"autogen-{name}".lower().replace(" ", "-").replace("_", "-")[:100]

            try:
                info = self.client.register_agent(
                    agent_id=agent_id,
                    name=name,
                    level=self.agent_level,
                    role=AgentRole.WORKER,
                    metadata={
                        "source": "autogen",
                        "system_message": str(getattr(agent, "system_message", ""))[:200],
                    },
                )
                self._agent_map[name] = info.agent_id
                logger.info("Registered agent %s → %s", name, info.agent_id)
            except Exception as exc:
                logger.warning("Failed to register agent %s: %s", name, exc)
                self._agent_map[name] = agent_id

    def _create_chat_task(self, message: str) -> None:
        """Create a task representing the group chat session."""
        try:
            task_info = self.client.create_task(
                title=f"AutoGen GroupChat: {message[:80]}",
                description=f"Group chat with {len(self.group_chat.agents)} agents",
                priority=TaskPriority.NORMAL,
                metadata={
                    "source": "autogen",
                    "agent_count": len(self.group_chat.agents),
                    "max_round": getattr(self.group_chat, "max_round", None),
                },
            )
            self._task_id = task_info.id
        except Exception as exc:
            logger.warning("Failed to create chat task: %s", exc)

    def _report_completion(self, result: Any, elapsed: float) -> None:
        """Report chat completion to OpenSpawn."""
        if self._task_id:
            try:
                self.client.transition_task(
                    self._task_id,
                    TaskStatus.DONE,
                    reason="GroupChat completed",
                )
            except Exception as exc:
                logger.warning("Failed to complete chat task: %s", exc)

        if self.store_transcript:
            messages = getattr(self.group_chat, "messages", [])
            transcript = "\n".join(
                f"[{m.get('name', 'unknown')}]: {m.get('content', '')[:100]}"
                for m in messages[-20:]  # Last 20 messages
            )
            if transcript:
                try:
                    self.client.store_memory(
                        transcript[:2000],
                        memory_type=MemoryType.OBSERVATION,
                        metadata={
                            "source": "autogen",
                            "task_id": self._task_id,
                            "message_count": len(messages),
                            "elapsed_seconds": round(elapsed, 2),
                        },
                    )
                except Exception as exc:
                    logger.warning("Failed to store transcript: %s", exc)

        try:
            self.client.emit_event(
                "autogen.groupchat.completed",
                {
                    "agent_count": len(self.group_chat.agents),
                    "message_count": len(getattr(self.group_chat, "messages", [])),
                    "elapsed_seconds": round(elapsed, 2),
                    "task_id": self._task_id,
                },
            )
        except Exception as exc:
            logger.warning("Failed to emit completion event: %s", exc)

    def _report_failure(self, error: Exception, elapsed: float) -> None:
        """Report chat failure to OpenSpawn."""
        if self._task_id:
            try:
                self.client.transition_task(
                    self._task_id,
                    TaskStatus.BLOCKED,
                    reason=f"GroupChat error: {error}",
                )
            except Exception:
                pass

        try:
            self.client.emit_event(
                "autogen.groupchat.failed",
                {
                    "error": str(error),
                    "error_type": type(error).__name__,
                    "elapsed_seconds": round(elapsed, 2),
                },
            )
        except Exception:
            pass

    def run(
        self,
        initiator: ConversableAgent,
        message: str,
        **kwargs: Any,
    ) -> Any:
        """Run the group chat with full OpenSpawn reporting.

        Args:
            initiator: The agent that starts the conversation.
            message: The initial message.
            **kwargs: Additional arguments passed to initiate_chat.

        Returns:
            The chat result.
        """
        if self.auto_register:
            self._register_agents()

        self._create_chat_task(message)

        if self._task_id:
            try:
                self.client.transition_task(
                    self._task_id,
                    TaskStatus.IN_PROGRESS,
                    reason="GroupChat started",
                )
            except Exception:
                pass

        start = time.monotonic()
        try:
            # Create GroupChatManager and initiate
            manager = GroupChatManager(groupchat=self.group_chat)
            result = initiator.initiate_chat(manager, message=message, **kwargs)
            elapsed = time.monotonic() - start
            self._report_completion(result, elapsed)
            return result
        except Exception as exc:
            elapsed = time.monotonic() - start
            self._report_failure(exc, elapsed)
            raise
