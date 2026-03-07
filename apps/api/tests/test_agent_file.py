"""Tests for Agent File export/import format."""

from __future__ import annotations

import json

import pytest
from fastapi.routing import APIRoute
from pydantic import ValidationError

from app.main import app
from app.memory.graph.agent_file import (
    AgentFileEntity,
    AgentFileExport,
    AgentFileMemory,
    AgentFileRelationship,
)


def _registered_paths() -> set[str]:
    return {route.path for route in app.routes if isinstance(route, APIRoute)}


class TestAgentFileSchema:
    def test_export_format_has_version(self) -> None:
        export = AgentFileExport(
            version="1.0",
            exported_at="2026-03-07T12:00:00Z",
            agent={"name": "test"},
            memories=[],
            entities=[],
            relationships=[],
        )
        assert export.version == "1.0"

    def test_export_serializes_to_json(self) -> None:
        export = AgentFileExport(
            version="1.0",
            exported_at="2026-03-07T12:00:00Z",
            agent={"name": "test"},
            memories=[],
            entities=[],
            relationships=[],
        )
        data = json.loads(export.model_dump_json())
        assert data["version"] == "1.0"
        assert "memories" in data
        assert "entities" in data

    def test_rejects_unknown_version(self) -> None:
        with pytest.raises(ValidationError):
            AgentFileExport(
                version="99.0",
                exported_at="2026-03-07T12:00:00Z",
                agent={"name": "test"},
                memories=[],
                entities=[],
                relationships=[],
            )

    def test_accepts_valid_version(self) -> None:
        export = AgentFileExport(
            version="1.0",
            exported_at="2026-03-07T12:00:00Z",
            agent={"name": "test"},
            memories=[],
            entities=[],
            relationships=[],
        )
        assert export.version == "1.0"


class TestAgentFileSubModels:
    def test_memory_model(self) -> None:
        mem = AgentFileMemory(content="test fact", confidence=85, source="task_completion")
        assert mem.content == "test fact"

    def test_entity_model(self) -> None:
        entity = AgentFileEntity(name="Docker", type="tool", description="Container platform")
        assert entity.name == "Docker"

    def test_relationship_model(self) -> None:
        rel = AgentFileRelationship(source="Docker", target="CI", type="used_by", weight=0.8)
        assert rel.source == "Docker"


class TestAgentFileRoutes:
    def test_export_route_registered(self) -> None:
        assert "/memory/graph/agent-file/export/{agent_id}" in _registered_paths()

    def test_import_route_registered(self) -> None:
        assert "/memory/graph/agent-file/import" in _registered_paths()
