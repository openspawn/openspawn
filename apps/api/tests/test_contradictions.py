"""Tests for contradiction resolution logic."""

from __future__ import annotations


class TestResolutionStrategy:
    def test_all_strategies_valid(self) -> None:
        from app.memory.contradictions import ResolutionStrategy

        assert len(ResolutionStrategy) == 4
        assert ResolutionStrategy.KEEP_NEWER == "keep_newer"
        assert ResolutionStrategy.KEEP_OLDER == "keep_older"
        assert ResolutionStrategy.MERGE == "merge"
        assert ResolutionStrategy.FLAG == "flag"


class TestLinkContradiction:
    def test_links_memories_and_penalizes(self) -> None:
        from unittest.mock import MagicMock

        from app.memory.contradictions import link_contradiction

        existing = MagicMock()
        existing.id = "existing-id"
        existing.metadata_ = {}
        existing.confidence = 80

        new_mem = MagicMock()
        new_mem.id = "new-id"
        new_mem.metadata_ = {}

        link_contradiction(existing, new_mem)

        assert existing.metadata_["contradicted_by"] == "new-id"
        assert existing.confidence == 60
        assert new_mem.metadata_["contradicts_id"] == "existing-id"

    def test_confidence_floors_at_zero(self) -> None:
        from unittest.mock import MagicMock

        from app.memory.contradictions import link_contradiction

        existing = MagicMock()
        existing.id = "e"
        existing.metadata_ = {}
        existing.confidence = 10

        new_mem = MagicMock()
        new_mem.id = "n"
        new_mem.metadata_ = {}

        link_contradiction(existing, new_mem)
        assert existing.confidence == 0

    def test_preserves_existing_metadata(self) -> None:
        from unittest.mock import MagicMock

        from app.memory.contradictions import link_contradiction

        existing = MagicMock()
        existing.id = "e"
        existing.metadata_ = {"foo": "bar"}
        existing.confidence = 50

        new_mem = MagicMock()
        new_mem.id = "n"
        new_mem.metadata_ = {"baz": 1}

        link_contradiction(existing, new_mem)
        assert existing.metadata_["foo"] == "bar"
        assert existing.metadata_["contradicted_by"] == "n"
        assert new_mem.metadata_["baz"] == 1
        assert new_mem.metadata_["contradicts_id"] == "e"


class TestContradictionSchemas:
    def test_resolve_dto_accepts_valid_strategy(self) -> None:
        from app.memory.schemas import ResolveContradictionDto

        dto = ResolveContradictionDto(strategy="keep_newer")
        assert dto.strategy == "keep_newer"

    def test_contradiction_pair_response_structure(self) -> None:
        from app.memory.schemas import ContradictionPairResponse

        # Verify the model has the expected fields
        fields = ContradictionPairResponse.model_fields
        assert "older_memory" in fields
        assert "newer_memory" in fields
