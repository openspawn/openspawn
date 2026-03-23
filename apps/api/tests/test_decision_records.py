"""Tests for decision record creation, structured fields, and the /memory/decisions endpoint."""

from __future__ import annotations

from datetime import UTC

import pytest
from httpx import AsyncClient

from app.memory.schemas import DecisionAlternative, DecisionResponse, StoreMemoryDto

# ── Schema Tests ──────────────────────────────────────────────────────────────


class TestDecisionSchema:
    def test_decision_alternative(self) -> None:
        alt = DecisionAlternative(
            option="MongoDB",
            rejected_because="No existing expertise",
        )
        assert alt.option == "MongoDB"
        assert alt.rejected_because == "No existing expertise"

    def test_store_memory_dto_with_decision_fields(self) -> None:
        dto = StoreMemoryDto(
            content="Use PostgreSQL over MongoDB",
            type="decision",
            source="architecture_review",
            alternatives=[
                DecisionAlternative(
                    option="MongoDB",
                    rejected_because="No existing expertise, adds complexity",
                ),
                DecisionAlternative(
                    option="SQLite",
                    rejected_because="Can't handle concurrent writes",
                ),
            ],
            constraints=[
                "VPS has only 3.8GB RAM",
                "Team familiar with PostgreSQL",
            ],
            decided_by="dennis",
            what_outsider_would_miss="SQLite would seem simpler but we have 3 agents writing concurrently",
        )
        assert dto.type == "decision"
        assert len(dto.alternatives) == 2
        assert dto.alternatives[0].option == "MongoDB"
        assert len(dto.constraints) == 2
        assert dto.decided_by == "dennis"
        assert dto.what_outsider_would_miss is not None

    def test_store_memory_dto_without_decision_fields(self) -> None:
        """Existing StoreMemoryDto usage should still work without decision fields."""
        dto = StoreMemoryDto(
            content="Regular memory",
            type="episodic",
            source="observation",
        )
        assert dto.alternatives is None
        assert dto.constraints is None
        assert dto.decided_by is None
        assert dto.what_outsider_would_miss is None
        assert dto.review_by is None

    def test_decision_fields_merge_into_metadata(self) -> None:
        """Decision fields should be serializable for metadata storage."""
        dto = StoreMemoryDto(
            content="Test decision",
            type="decision",
            alternatives=[
                DecisionAlternative(option="A", rejected_because="Too slow"),
            ],
            constraints=["Budget < $100"],
            decided_by="ceo",
            what_outsider_would_miss="Internal politics",
        )

        # Simulate what the router does
        metadata = dict(dto.metadata)
        if dto.alternatives is not None:
            metadata["alternatives"] = [a.model_dump() for a in dto.alternatives]
        if dto.constraints is not None:
            metadata["constraints"] = dto.constraints
        if dto.decided_by is not None:
            metadata["decided_by"] = dto.decided_by
        if dto.what_outsider_would_miss is not None:
            metadata["what_outsider_would_miss"] = dto.what_outsider_would_miss

        assert metadata["alternatives"] == [{"option": "A", "rejected_because": "Too slow"}]
        assert metadata["constraints"] == ["Budget < $100"]
        assert metadata["decided_by"] == "ceo"

    def test_decision_response_model(self) -> None:
        from datetime import datetime

        resp = DecisionResponse(
            id="00000000-0000-0000-0000-000000000001",
            org_id="00000000-0000-0000-0000-000000000002",
            agent_id="00000000-0000-0000-0000-000000000003",
            content="Use PostgreSQL",
            source="architecture_review",
            confidence=85,
            strength=50,
            created_at=datetime.now(tz=UTC),
            occurred_at=datetime.now(tz=UTC),
            alternatives=[
                DecisionAlternative(option="MongoDB", rejected_because="Complexity"),
            ],
            constraints=["Low RAM"],
            decided_by="dennis",
            what_outsider_would_miss="Concurrency issue",
        )
        assert resp.decided_by == "dennis"
        assert len(resp.alternatives) == 1
        assert resp.review_by is None


# ── Route Tests ───────────────────────────────────────────────────────────────


class TestDecisionRoutes:
    @pytest.mark.anyio
    async def test_decisions_endpoint_requires_auth(self, client: AsyncClient) -> None:
        r = await client.get("/memory/decisions")
        assert r.status_code == 401

    @pytest.mark.anyio
    async def test_store_decision_requires_auth(self, client: AsyncClient) -> None:
        r = await client.post(
            "/memory",
            json={
                "content": "Use PostgreSQL",
                "type": "decision",
                "alternatives": [
                    {"option": "MongoDB", "rejected_because": "Complexity"},
                ],
                "constraints": ["Low RAM"],
                "decided_by": "dennis",
            },
        )
        assert r.status_code == 401

    @pytest.mark.anyio
    async def test_search_decisions_requires_auth(self, client: AsyncClient) -> None:
        r = await client.get("/memory/search", params={"query": "postgresql", "type": "decision"})
        assert r.status_code == 401
