"""Tests for automatic escalation handler."""

import uuid

from app.coordination.escalation import _build_escalation_event, _build_unresolvable_event


def test_build_escalation_event_has_correct_type() -> None:
    org_id = uuid.uuid4()
    task_id = uuid.uuid4()
    from_agent_id = uuid.uuid4()
    to_agent_id = uuid.uuid4()

    event = _build_escalation_event(
        org_id=org_id,
        task_id=task_id,
        from_agent_id=from_agent_id,
        to_agent_id=to_agent_id,
        reason="SLA_BREACH",
    )
    assert event.type == "task.escalated"
    assert event.entity_type == "task"
    assert event.entity_id == task_id
    assert event.data["from_agent"] == str(from_agent_id)
    assert event.data["to_agent"] == str(to_agent_id)
    assert event.data["reason"] == "SLA_BREACH"
    assert event.severity == "warning"


def test_build_unresolvable_event() -> None:
    org_id = uuid.uuid4()
    task_id = uuid.uuid4()
    agent_id = uuid.uuid4()

    event = _build_unresolvable_event(
        org_id=org_id,
        task_id=task_id,
        agent_id=agent_id,
    )
    assert event.type == "task.escalation.unresolvable"
    assert event.data["agent_id"] == str(agent_id)
    assert event.severity == "error"
