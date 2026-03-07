from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel


class GraphEntityResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    org_id: uuid.UUID
    name: str
    entity_type: str
    description: str
    mention_count: int
    confidence: float
    last_seen_at: datetime
    metadata: dict
    created_at: datetime


class GraphRelationshipResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    org_id: uuid.UUID
    source_entity_id: uuid.UUID
    target_entity_id: uuid.UUID
    relationship_type: str
    weight: float
    evidence_count: int
    last_seen_at: datetime
    metadata: dict


class SubGraph(BaseModel):
    entities: list[GraphEntityResponse]
    relationships: list[GraphRelationshipResponse]


class OverlapResult(BaseModel):
    agent_a: uuid.UUID
    agent_b: uuid.UUID
    jaccard_score: float
    shared_count: int
    union_count: int
    shared_entities: list[GraphEntityResponse]


class GapResult(BaseModel):
    entity_name: str
    entity_type: str
    agent_count: int
    risk: str


class CytoscapeNode(BaseModel):
    data: dict


class CytoscapeEdge(BaseModel):
    data: dict


class CytoscapeGraph(BaseModel):
    nodes: list[CytoscapeNode]
    edges: list[CytoscapeEdge]
