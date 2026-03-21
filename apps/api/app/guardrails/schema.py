"""Guardrail schema definitions — Pydantic models for guardrail rules."""

from __future__ import annotations

from enum import StrEnum

from pydantic import BaseModel, Field


class GuardrailAction(StrEnum):
    BLOCK = "block"
    ESCALATE = "escalate"
    REQUIRE_APPROVAL = "require_approval"
    WARN = "warn"
    LOG = "log"


class GuardrailDefinition(BaseModel):
    """A single guardrail rule parsed from ORG.md or defined via API."""

    name: str = Field(description="Unique identifier for this guardrail")
    trigger: str = Field(
        description="Event trigger, e.g. 'task.transition', 'task.created', 'memory.stored'"
    )
    condition: str | None = Field(
        default=None,
        description="Condition expression, e.g. 'day_of_week != friday'",
    )
    match: str | None = Field(
        default=None,
        description="Regex pattern to match against event content/title",
    )
    action: GuardrailAction = Field(
        default=GuardrailAction.LOG,
        description="Action to take when guardrail is triggered",
    )
    escalate_to: str | None = Field(
        default=None,
        description="Agent/role to escalate to (for escalate action)",
    )
    message: str = Field(description="Human-readable explanation of the guardrail")


class GuardrailEvent(BaseModel):
    """An event to evaluate against guardrails."""

    trigger: str = Field(description="Event type, e.g. 'task.transition', 'task.created'")
    content: str = Field(default="", description="Content/title of the event for pattern matching")
    agent_id: str | None = Field(default=None, description="Agent that triggered the event")
    agent_level: int | None = Field(default=None, description="Level of the triggering agent")
    metadata: dict = Field(default_factory=dict, description="Additional event context")


class GuardrailResult(BaseModel):
    """Result of evaluating a single guardrail against an event."""

    guardrail_name: str
    triggered: bool
    action: GuardrailAction
    message: str
    escalate_to: str | None = None


class EvaluateRequest(BaseModel):
    """Request body for POST /guardrails/evaluate."""

    event: GuardrailEvent
    guardrails: list[GuardrailDefinition] | None = Field(
        default=None,
        description="Optional guardrails to evaluate. If omitted, uses org-level guardrails.",
    )


class EvaluateResponse(BaseModel):
    """Response from guardrail evaluation."""

    results: list[GuardrailResult]
    blocked: bool = Field(description="True if any guardrail blocked the event")
    warnings: list[str] = Field(default_factory=list)
