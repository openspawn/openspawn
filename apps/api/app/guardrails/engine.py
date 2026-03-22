"""Guardrail evaluation engine — checks events against guardrail definitions."""

from __future__ import annotations

import re
from datetime import UTC, datetime

from app.guardrails.schema import (
    EvaluateResponse,
    GuardrailAction,
    GuardrailDefinition,
    GuardrailEvent,
    GuardrailResult,
)


def _check_condition(condition: str, event: GuardrailEvent) -> bool:
    """Evaluate a simple condition expression against an event.

    Supported conditions:
    - "day_of_week != friday" / "day_of_week == monday"
    - "agent.level < 7" / "agent.level >= 5"
    - "always" (always true)
    - empty/None (always true)
    """
    if not condition or condition.strip().lower() == "always":
        return True

    cond = condition.strip().lower()

    # Day-of-week conditions
    day_match = re.match(r"day_of_week\s*(!=|==)\s*(\w+)", cond)
    if day_match:
        op, day_name = day_match.group(1), day_match.group(2)
        current_day = datetime.now(tz=UTC).strftime("%A").lower()
        if op == "!=":
            return current_day != day_name.lower()
        return current_day == day_name.lower()

    # Agent level conditions
    level_match = re.match(r"agent\.level\s*(<|>|<=|>=|==|!=)\s*(\d+)", cond)
    if level_match and event.agent_level is not None:
        op, threshold = level_match.group(1), int(level_match.group(2))
        level = event.agent_level
        ops = {
            "<": level < threshold,
            ">": level > threshold,
            "<=": level <= threshold,
            ">=": level >= threshold,
            "==": level == threshold,
            "!=": level != threshold,
        }
        return ops.get(op, True)

    # Unknown condition — default to true (fail-safe: trigger the guardrail)
    return True


def _check_match(pattern: str | None, content: str) -> bool:
    """Check if content matches a regex pattern."""
    if not pattern:
        return True
    try:
        return bool(re.search(pattern, content, re.IGNORECASE))
    except re.error:
        return False


def _check_trigger(guardrail_trigger: str, event_trigger: str) -> bool:
    """Check if the event trigger matches the guardrail trigger."""
    # Normalize both
    gt = guardrail_trigger.strip().lower()
    et = event_trigger.strip().lower()

    # Exact match
    if gt == et:
        return True

    # Prefix match (e.g. "task.transition" matches "task.transition.done")
    if et.startswith(gt):
        return True

    # Wildcard match (e.g. "task.*")
    if gt.endswith(".*"):
        prefix = gt[:-2]
        return et.startswith(prefix)

    return False


def evaluate_guardrail(
    guardrail: GuardrailDefinition,
    event: GuardrailEvent,
) -> GuardrailResult:
    """Evaluate a single guardrail against an event."""
    # Check trigger match
    if not _check_trigger(guardrail.trigger, event.trigger):
        return GuardrailResult(
            guardrail_name=guardrail.name,
            triggered=False,
            action=guardrail.action,
            message=guardrail.message,
        )

    # Check content match
    if not _check_match(guardrail.match, event.content):
        return GuardrailResult(
            guardrail_name=guardrail.name,
            triggered=False,
            action=guardrail.action,
            message=guardrail.message,
        )

    # Check condition — note: condition controls when the guardrail PASSES (doesn't fire).
    # If condition is "day_of_week != friday", the guardrail fires when it IS friday.
    condition_met = _check_condition(guardrail.condition or "always", event)

    # For "!=" conditions: if condition is met, the guardrail does NOT fire
    # For "always" or None: guardrail always fires
    # The condition represents when it's SAFE — guardrail fires when condition is NOT met
    is_safety_condition = guardrail.condition and "!=" in guardrail.condition
    triggered = not condition_met if is_safety_condition else condition_met

    return GuardrailResult(
        guardrail_name=guardrail.name,
        triggered=triggered,
        action=guardrail.action,
        message=guardrail.message,
        escalate_to=guardrail.escalate_to if triggered else None,
    )


def evaluate_guardrails(
    guardrails: list[GuardrailDefinition],
    event: GuardrailEvent,
) -> EvaluateResponse:
    """Evaluate all guardrails against an event."""
    results = [evaluate_guardrail(g, event) for g in guardrails]
    triggered_results = [r for r in results if r.triggered]

    blocked = any(r.action == GuardrailAction.BLOCK for r in triggered_results)
    warnings = [r.message for r in triggered_results if r.action == GuardrailAction.WARN]

    return EvaluateResponse(
        results=results,
        blocked=blocked,
        warnings=warnings,
    )
