"""Tests for entity extraction pipeline."""

from __future__ import annotations


class TestExtractionModels:
    def test_extracted_entity_model(self) -> None:
        from app.memory.graph.extraction import ExtractedEntity

        entity = ExtractedEntity(
            name="Docker", entity_type="tool", description="Container platform", confidence=0.9
        )
        assert entity.name == "Docker"

    def test_extracted_relationship_model(self) -> None:
        from app.memory.graph.extraction import ExtractedRelationship

        rel = ExtractedRelationship(
            source="Docker", target="CI pipeline", relationship_type="used_by", weight=0.8
        )
        assert rel.source == "Docker"

    def test_extraction_result_model(self) -> None:
        from app.memory.graph.extraction import ExtractionResult

        result = ExtractionResult(entities=[], relationships=[])
        assert len(result.entities) == 0


class TestExtractionPrompt:
    def test_prompt_exists(self) -> None:
        from app.memory.graph.extraction import EXTRACTION_PROMPT

        assert "entities" in EXTRACTION_PROMPT.lower()
        assert "relationships" in EXTRACTION_PROMPT.lower()


class TestConfidencePropagation:
    def test_weighted_average(self) -> None:
        from app.memory.graph.extraction import compute_entity_confidence

        assert compute_entity_confidence([90, 85, 80]) >= 80.0

    def test_low_confidence(self) -> None:
        from app.memory.graph.extraction import compute_entity_confidence

        assert compute_entity_confidence([40, 30]) <= 40.0

    def test_empty_list(self) -> None:
        from app.memory.graph.extraction import compute_entity_confidence

        assert compute_entity_confidence([]) == 50.0


class TestMinConfidenceThreshold:
    def test_threshold_value(self) -> None:
        from app.memory.graph.extraction import MIN_ENTITY_CONFIDENCE

        assert MIN_ENTITY_CONFIDENCE == 20


class TestEnrichmentWorkerUpdated:
    def test_extract_entities_replaces_derive_facts(self) -> None:
        from app.workers.enrichment import WorkerSettings

        fn_names = [fn.__name__ for fn in WorkerSettings.functions]
        assert "extract_entities" in fn_names
        assert "derive_facts" not in fn_names

    def test_merge_entities_job_registered(self) -> None:
        from app.workers.enrichment import WorkerSettings

        fn_names = [fn.__name__ for fn in WorkerSettings.functions]
        assert "merge_duplicate_entities" in fn_names

    def test_six_functions_total(self) -> None:
        from app.workers.enrichment import WorkerSettings

        assert len(WorkerSettings.functions) == 6

    def test_six_cron_jobs_total(self) -> None:
        from app.workers.enrichment import WorkerSettings

        assert len(WorkerSettings.cron_jobs) == 6
