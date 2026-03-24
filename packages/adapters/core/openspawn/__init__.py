"""OpenSpawn Python Client — core client for all framework adapters."""

from openspawn.client import OpenSpawnClient
from openspawn.types import (
    AgentMode,
    AgentRole,
    AgentStatus,
    EventType,
    MemoryType,
    MemoryVisibility,
    TaskPriority,
    TaskStatus,
)

__all__ = [
    "OpenSpawnClient",
    "AgentMode",
    "AgentRole",
    "AgentStatus",
    "EventType",
    "MemoryType",
    "MemoryVisibility",
    "TaskPriority",
    "TaskStatus",
]

__version__ = "0.1.0"
