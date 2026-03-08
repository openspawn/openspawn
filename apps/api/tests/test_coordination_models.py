"""Tests for coordination-related model columns and schemas."""

import uuid

from app.models.task import Task
from app.tasks.schemas import CreateTaskDto, TaskResponse


def test_task_has_required_capabilities_field() -> None:
    task = Task(
        org_id=uuid.uuid4(),
        identifier="TSK-1",
        title="Test",
        creator_id=uuid.uuid4(),
        required_capabilities=["python", "code_review"],
    )
    assert task.required_capabilities == ["python", "code_review"]


def test_task_has_sla_warning_sent_at_field() -> None:
    task = Task(
        org_id=uuid.uuid4(),
        identifier="TSK-2",
        title="Test",
        creator_id=uuid.uuid4(),
    )
    assert task.sla_warning_sent_at is None


def test_task_has_needs_attention_field() -> None:
    task = Task(
        org_id=uuid.uuid4(),
        identifier="TSK-3",
        title="Test",
        creator_id=uuid.uuid4(),
    )
    # needs_attention defaults via server_default; Python-side may be None before flush
    assert not task.needs_attention or task.needs_attention is None


def test_create_task_dto_accepts_required_capabilities() -> None:
    dto = CreateTaskDto(
        title="Test",
        required_capabilities=["python", "testing"],
    )
    assert dto.required_capabilities == ["python", "testing"]


def test_create_task_dto_defaults_capabilities_to_empty() -> None:
    dto = CreateTaskDto(title="Test")
    assert dto.required_capabilities == []


def test_task_response_includes_coordination_fields() -> None:
    data = TaskResponse.model_json_schema()
    props = data["properties"]
    assert "required_capabilities" in props
    assert "needs_attention" in props
    assert "sla_warning_sent_at" in props
