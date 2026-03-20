"""Tests for coordination event payload schema validation (#709)."""

from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.coordination.event_schemas import (
    EVENT_PAYLOAD_SCHEMAS,
    BuildFailedPayload,
    BuildSucceededPayload,
    ComponentCreatedPayload,
    ComponentUpdatedPayload,
    TestFailedPayload,
    TestPassedPayload,
    TestWrittenPayload,
)
from app.coordination.schemas import EmitEventDto
from app.coordination.service import emit_coordination_event


# ---------------------------------------------------------------------------
# Unit tests: payload models
# ---------------------------------------------------------------------------


class TestPayloadModels:
    def test_component_created_valid(self):
        p = ComponentCreatedPayload(name="Button", file_path="src/Button.tsx")
        assert p.name == "Button"
        assert p.test_ids == []

    def test_component_created_missing_required(self):
        with pytest.raises(ValidationError):
            ComponentCreatedPayload(name="Button")  # missing file_path

    def test_component_created_extra_fields_allowed(self):
        """Pydantic v2 ignores extra fields by default."""
        p = ComponentCreatedPayload(
            name="Button", file_path="src/Button.tsx", extra_field="ok"
        )
        assert p.name == "Button"

    def test_component_updated_inherits(self):
        p = ComponentUpdatedPayload(name="Button", file_path="src/Button.tsx")
        assert isinstance(p, ComponentCreatedPayload)

    def test_test_written_valid(self):
        p = TestWrittenPayload(covers_component="Button", test_file="tests/test_button.py")
        assert p.covers_component == "Button"

    def test_test_passed_valid(self):
        p = TestPassedPayload(test_file="tests/test_button.py", passed_count=5)
        assert p.failed_count == 0

    def test_test_failed_with_errors(self):
        p = TestFailedPayload(
            test_file="tests/test_button.py",
            passed_count=3,
            failed_count=2,
            errors=["AssertionError: expected 1 got 2"],
        )
        assert len(p.errors) == 1

    def test_build_succeeded_optional_fields(self):
        p = BuildSucceededPayload()
        assert p.duration_ms is None

    def test_build_failed_requires_error(self):
        with pytest.raises(ValidationError):
            BuildFailedPayload(duration_ms=100)  # missing error

    def test_build_failed_valid(self):
        p = BuildFailedPayload(error="compile error", duration_ms=500)
        assert p.error == "compile error"


class TestPayloadRegistry:
    def test_all_coordination_event_types_covered(self):
        """Registry has entries for all coordination event mesh types."""
        expected = {
            "component.created",
            "component.updated",
            "test.written",
            "test.passed",
            "test.failed",
            "doc.section.written",
            "api_contract.defined",
            "api_contract.changed",
            "build.succeeded",
            "build.failed",
            "screenshot.captured",
            "migration.created",
            "dependency.added",
        }
        assert expected == set(EVENT_PAYLOAD_SCHEMAS.keys())


# ---------------------------------------------------------------------------
# Integration tests: emit_coordination_event with validation
# ---------------------------------------------------------------------------


class TestEmitValidation:
    """Test that emit_coordination_event validates payloads for known event types."""

    @pytest.fixture()
    def db(self):
        return AsyncMock()

    @pytest.fixture()
    def ids(self):
        return uuid.uuid4(), uuid.uuid4()

    @pytest.mark.asyncio
    @patch("app.coordination.service._resolve_event_subscribers", new_callable=AsyncMock, return_value=[])
    @patch("app.coordination.service.emit", new_callable=AsyncMock)
    async def test_valid_payload_passes(self, mock_emit, mock_subs, db, ids):
        org_id, actor_id = ids
        dto = EmitEventDto(
            event_type="component.created",
            payload={"name": "Button", "file_path": "src/Button.tsx"},
            task_id=uuid.uuid4(),
        )
        # Should not raise
        await emit_coordination_event(db, org_id, actor_id, dto)
        mock_emit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_invalid_payload_returns_422(self, db, ids):
        org_id, actor_id = ids
        dto = EmitEventDto(
            event_type="component.created",
            payload={"name": "Button"},  # missing file_path
            task_id=uuid.uuid4(),
        )
        with pytest.raises(HTTPException) as exc_info:
            await emit_coordination_event(db, org_id, actor_id, dto)
        assert exc_info.value.status_code == 422
        assert "file_path" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    @patch("app.coordination.service._resolve_event_subscribers", new_callable=AsyncMock, return_value=[])
    @patch("app.coordination.service.emit", new_callable=AsyncMock)
    async def test_unknown_event_type_passes_through(self, mock_emit, mock_subs, db, ids):
        """Event types in SSEEventType without a payload schema pass through."""
        org_id, actor_id = ids
        # task.created is a valid SSEEventType but has no payload schema
        dto = EmitEventDto(
            event_type="task.created",
            payload={"anything": "goes"},
            task_id=uuid.uuid4(),
        )
        await emit_coordination_event(db, org_id, actor_id, dto)
        mock_emit.assert_awaited_once()

    @pytest.mark.asyncio
    @patch("app.coordination.service._resolve_event_subscribers", new_callable=AsyncMock, return_value=[])
    @patch("app.coordination.service.emit", new_callable=AsyncMock)
    async def test_extra_fields_allowed(self, mock_emit, mock_subs, db, ids):
        org_id, actor_id = ids
        dto = EmitEventDto(
            event_type="component.created",
            payload={
                "name": "Button",
                "file_path": "src/Button.tsx",
                "custom_field": "custom_value",
            },
            task_id=uuid.uuid4(),
        )
        # Should not raise — Pydantic v2 ignores extra fields by default
        await emit_coordination_event(db, org_id, actor_id, dto)
        mock_emit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_build_failed_missing_error_returns_422(self, db, ids):
        org_id, actor_id = ids
        dto = EmitEventDto(
            event_type="build.failed",
            payload={"duration_ms": 100},  # missing required 'error'
            task_id=uuid.uuid4(),
        )
        with pytest.raises(HTTPException) as exc_info:
            await emit_coordination_event(db, org_id, actor_id, dto)
        assert exc_info.value.status_code == 422
        assert "error" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_completely_unknown_event_type_returns_400(self, db, ids):
        """An event_type not in SSEEventType at all should still return 400."""
        org_id, actor_id = ids
        dto = EmitEventDto(
            event_type="totally.bogus",
            payload={},
            task_id=uuid.uuid4(),
        )
        with pytest.raises(HTTPException) as exc_info:
            await emit_coordination_event(db, org_id, actor_id, dto)
        assert exc_info.value.status_code == 400
