"""Unit tests for coordination projections (no DB, mock events)."""

from __future__ import annotations

import uuid
from datetime import datetime
from types import SimpleNamespace

import pytest

from app.coordination.projections import (
    project_artifact_view,
    project_component_registry,
    project_test_coverage,
)


def _event(
    event_type: str,
    payload: dict,
    entity_name: str | None = None,
    actor_id: uuid.UUID | None = None,
    created_at: datetime | None = None,
) -> SimpleNamespace:
    return SimpleNamespace(
        type=event_type,
        data={"payload": payload, "entity_name": entity_name},
        actor_id=actor_id or uuid.uuid4(),
        created_at=created_at or datetime(2026, 3, 14, 12, 0, 0),
    )


# ═══════════════════════════════════════════════
# component_registry
# ═══════════════════════════════════════════════


class TestComponentRegistry:
    def test_empty_events(self):
        result = project_component_registry([])
        assert result["count"] == 0
        assert result["components"] == {}

    def test_single_component_created(self):
        events = [
            _event("component.created", {"name": "SubmitButton", "file_path": "src/Submit.tsx"}),
        ]
        result = project_component_registry(events)
        assert result["count"] == 1
        assert result["components"]["SubmitButton"]["version"] == 1
        assert result["components"]["SubmitButton"]["file_path"] == "src/Submit.tsx"

    def test_component_updated_increments_version(self):
        events = [
            _event("component.created", {"name": "SubmitButton", "props": ["onClick"]}),
            _event("component.updated", {"name": "SubmitButton", "props": ["onClick", "disabled"]}),
        ]
        result = project_component_registry(events)
        assert result["count"] == 1
        assert result["components"]["SubmitButton"]["version"] == 2
        assert result["components"]["SubmitButton"]["props"] == ["onClick", "disabled"]

    def test_non_component_events_ignored(self):
        events = [
            _event("test.written", {"test_file": "test.spec.ts"}),
            _event("build.succeeded", {}),
        ]
        result = project_component_registry(events)
        assert result["count"] == 0


# ═══════════════════════════════════════════════
# test_coverage
# ═══════════════════════════════════════════════


class TestTestCoverage:
    def test_component_without_tests(self):
        events = [
            _event("component.created", {"name": "Button"}),
        ]
        result = project_test_coverage(events)
        assert result["total_components"] == 1
        assert result["covered_count"] == 0
        assert result["coverage_ratio"] == 0

    def test_component_with_test(self):
        events = [
            _event("component.created", {"name": "Button"}),
            _event("test.written", {"covers_component": "Button", "test_file": "Button.spec.ts"}),
        ]
        result = project_test_coverage(events)
        assert result["coverage_ratio"] == 1.0
        assert result["components"]["Button"]["has_tests"] is True

    def test_partial_coverage(self):
        events = [
            _event("component.created", {"name": "Button"}),
            _event("component.created", {"name": "Input"}),
            _event("test.written", {"covers_component": "Button", "test_file": "Button.spec.ts"}),
        ]
        result = project_test_coverage(events)
        assert result["coverage_ratio"] == 0.5
        assert result["covered_count"] == 1
        assert result["total_components"] == 2


# ═══════════════════════════════════════════════
# artifact_view (hypothesis test)
# ═══════════════════════════════════════════════


class TestArtifactView:
    def test_component_creates_artifact(self):
        events = [
            _event("component.created", {"name": "SubmitButton"}, entity_name="SubmitButton"),
        ]
        result = project_artifact_view(events)
        assert result["count"] == 1
        artifact = result["artifacts"][0]
        assert artifact["artifact_type"] == "component"
        assert artifact["name"] == "SubmitButton"
        assert artifact["version"] == 1
        assert artifact["status"] == "published"

    def test_component_updated_increments_version(self):
        agent = uuid.uuid4()
        events = [
            _event("component.created", {"name": "Btn"}, entity_name="Btn", actor_id=agent),
            _event("component.updated", {"name": "Btn"}, entity_name="Btn", actor_id=agent),
        ]
        result = project_artifact_view(events)
        assert result["count"] == 1
        assert result["artifacts"][0]["version"] == 2

    def test_test_written_creates_test_plan_artifact(self):
        events = [
            _event("test.written", {"name": "btn-test"}, entity_name="btn-test"),
        ]
        result = project_artifact_view(events)
        assert result["count"] == 1
        assert result["artifacts"][0]["artifact_type"] == "test_plan"

    def test_screenshot_creates_screenshot_artifact(self):
        events = [
            _event("screenshot.captured", {"name": "submit-ss"}, entity_name="submit-ss"),
        ]
        result = project_artifact_view(events)
        assert result["count"] == 1
        assert result["artifacts"][0]["artifact_type"] == "screenshot"

    def test_build_event_ignored(self):
        events = [
            _event("build.succeeded", {"name": "main"}, entity_name="main"),
        ]
        result = project_artifact_view(events)
        assert result["count"] == 0

    def test_hypothesis_field_present(self):
        result = project_artifact_view([])
        assert "hypothesis" in result
