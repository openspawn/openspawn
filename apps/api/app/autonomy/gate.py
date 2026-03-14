from __future__ import annotations

# Risk levels (0-10) per (action_type, subtype) pair.
# Higher = riskier = needs higher autonomy to proceed without approval.
RISK_REGISTRY: dict[tuple[str, str], int] = {
    # Task transitions
    ("task_transition", "done"): 3,
    ("task_transition", "cancelled"): 5,
    ("task_transition", "review"): 2,
    ("task_transition", "blocked"): 1,
    ("task_transition", "in_progress"): 0,
    ("task_transition", "todo"): 0,
    ("task_transition", "assigned"): 0,
    ("task_transition", "backlog"): 0,
    # Artifact types
    ("artifact_publish", "screenshot"): 1,
    ("artifact_publish", "test_plan"): 2,
    ("artifact_publish", "doc_section"): 2,
    ("artifact_publish", "component"): 4,
    ("artifact_publish", "api_contract"): 7,
    ("artifact_publish", "schema"): 7,
    ("artifact_publish", "migration"): 9,
}

DEFAULT_RISK = 5  # unknown actions default to medium risk (fail closed)


def get_risk_level(action_type: str, subtype: str) -> int:
    return RISK_REGISTRY.get((action_type, subtype), DEFAULT_RISK)


def is_gated(effective_autonomy: int, risk_level: int) -> bool:
    """Returns True if the action requires approval.

    An action is gated when its risk exceeds the effective autonomy level.
    autonomy=0 gates everything (risk > 0). autonomy=10 gates nothing (risk <= 10).
    """
    return risk_level > effective_autonomy


def resolve_effective_autonomy(task_autonomy: int | None, agent_autonomy: int) -> int:
    """Task-level override takes precedence over agent default."""
    if task_autonomy is not None:
        return task_autonomy
    return agent_autonomy
