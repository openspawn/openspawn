from __future__ import annotations

import inspect
import uuid
from datetime import UTC, datetime

from app.memory.graph.postgres_store import PostgresGraphStore
from app.memory.graph.protocol import GraphStore
from app.memory.graph.schemas import (
    GapResult,
    GraphEntityResponse,
    GraphRelationshipResponse,
    OverlapResult,
    SubGraph,
)


def test_postgres_graph_store_implements_protocol() -> None:
    assert isinstance(PostgresGraphStore(), GraphStore)


def test_protocol_has_all_methods() -> None:
    expected = {
        "upsert_entity",
        "get_entity",
        "find_entity",
        "find_similar_entity",
        "list_entities",
        "merge_entities",
        "upsert_relationship",
        "get_relationships",
        "link_memory_entity",
        "get_neighbors",
        "get_agent_entities",
        "get_entity_agents",
        "compute_overlap",
        "find_gaps",
        "export_agent_subgraph",
        "export_org_graph",
    }
    protocol_methods = {
        name
        for name, _ in inspect.getmembers(GraphStore, predicate=inspect.isfunction)
        if not name.startswith("_")
    }
    assert expected == protocol_methods


def test_graph_entity_response_constructs() -> None:
    now = datetime.now(UTC)
    entity = GraphEntityResponse(
        id=uuid.uuid4(),
        org_id=uuid.uuid4(),
        name="test-entity",
        entity_type="concept",
        description="A test entity",
        mention_count=3,
        confidence=75.0,
        last_seen_at=now,
        metadata={},
        created_at=now,
    )
    assert entity.name == "test-entity"
    assert entity.entity_type == "concept"
    assert entity.mention_count == 3


def test_graph_relationship_response_constructs() -> None:
    now = datetime.now(UTC)
    rel = GraphRelationshipResponse(
        id=uuid.uuid4(),
        org_id=uuid.uuid4(),
        source_entity_id=uuid.uuid4(),
        target_entity_id=uuid.uuid4(),
        relationship_type="uses",
        weight=0.7,
        evidence_count=2,
        last_seen_at=now,
        metadata={},
    )
    assert rel.relationship_type == "uses"
    assert rel.weight == 0.7


def test_subgraph_constructs() -> None:
    sg = SubGraph(entities=[], relationships=[])
    assert sg.entities == []
    assert sg.relationships == []


def test_overlap_result_constructs() -> None:
    overlap = OverlapResult(
        agent_a=uuid.uuid4(),
        agent_b=uuid.uuid4(),
        jaccard_score=0.5,
        shared_count=3,
        union_count=6,
        shared_entities=[],
    )
    assert overlap.jaccard_score == 0.5
    assert overlap.shared_count == 3


def test_gap_result_constructs() -> None:
    gap = GapResult(
        entity_name="deploy-pipeline",
        entity_type="process",
        agent_count=1,
        risk="high",
    )
    assert gap.risk == "high"
    assert gap.agent_count == 1
