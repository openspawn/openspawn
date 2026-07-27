"""A2A v1.0 Pydantic models for agent-to-agent communication."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class A2APart(BaseModel):
    """A single content part within an A2A message."""

    kind: Literal["text", "file", "data"]
    text: str | None = None
    name: str | None = None
    mimeType: str | None = None
    uri: str | None = None
    data: dict | None = None


class A2AMessage(BaseModel):
    """An A2A protocol message."""

    kind: Literal["message"] = "message"
    messageId: str
    role: Literal["user", "agent"]
    parts: list[A2APart]
    contextId: str | None = None


# A2A task states
A2ATaskState = Literal["submitted", "working", "input-required", "completed", "failed", "canceled"]


class A2ATaskStatus(BaseModel):
    """Status of an A2A task."""

    state: A2ATaskState
    message: str | None = None
    timestamp: str


class A2ATask(BaseModel):
    """An A2A task with status and message history."""

    id: str
    contextId: str | None = None
    status: A2ATaskStatus
    messages: list[A2AMessage] = Field(default_factory=list)


class A2ASendRequest(BaseModel):
    """Request to send an A2A message to a target agent."""

    agentId: str  # target agent
    senderId: str  # sender agent
    message: A2AMessage
    contextId: str | None = None


class A2ACompleteRequest(BaseModel):
    """Request to mark a task as completed or failed."""

    agentId: str
    status: Literal["completed", "failed"]
    result: str


class A2AAgentCard(BaseModel):
    """Agent discovery card (/.well-known/agent.json)."""

    name: str = "OpenSpawn Platform"
    description: str = "Centralized A2A coordination platform for multi-agent organizations"
    url: str = "https://api.openspawn.ai"
    version: str = "1.0"
    capabilities: dict = Field(
        default_factory=lambda: {
            "a2a": True,
            "websocket": True,
            "sse": True,
        }
    )
    authentication: dict = Field(
        default_factory=lambda: {
            "schemes": ["bearer", "hmac"],
        }
    )
