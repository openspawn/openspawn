from __future__ import annotations

from app.models.base import Base
from app.models.enums import EntityType


def test_entity_type_enum_values() -> None:
    values = [e.value for e in EntityType]
    assert values == ["person", "tool", "concept", "process", "system", "location", "event"]


def test_graph_entity_columns() -> None:
    table = Base.metadata.tables["graph_entities"]
    expected = {
        "id",
        "org_id",
        "name",
        "entity_type",
        "description",
        "embedding",
        "mention_count",
        "confidence",
        "last_seen_at",
        "metadata",
        "created_at",
        "updated_at",
    }
    assert expected == set(table.columns.keys())


def test_graph_entity_unique_constraint() -> None:
    table = Base.metadata.tables["graph_entities"]
    constraint_names = {c.name for c in table.constraints if hasattr(c, "name") and c.name}
    assert "uq_graph_entity_org_name_type" in constraint_names


def test_graph_relationship_columns() -> None:
    table = Base.metadata.tables["graph_relationships"]
    expected = {
        "id",
        "org_id",
        "source_entity_id",
        "target_entity_id",
        "relationship_type",
        "weight",
        "last_seen_at",
        "evidence_count",
        "metadata",
        "created_at",
        "updated_at",
    }
    assert expected == set(table.columns.keys())


def test_memory_entity_link_columns() -> None:
    table = Base.metadata.tables["memory_entity_links"]
    expected = {
        "memory_id",
        "entity_id",
        "agent_id",
        "created_at",
    }
    assert expected == set(table.columns.keys())
