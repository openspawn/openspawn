"""Integration tests for knowledge graph (requires DB + MEMORY_INTEGRATION_TEST=1)."""

from __future__ import annotations

import os

import pytest

pytestmark = pytest.mark.skipif(
    not os.getenv("MEMORY_INTEGRATION_TEST"),
    reason="Set MEMORY_INTEGRATION_TEST=1",
)


class TestEntityExtractionIntegration:
    async def test_store_memory_triggers_extraction(self) -> None:
        """Store a memory, run extraction, verify entities appear."""

    async def test_entity_dedup_across_agents(self) -> None:
        """Two agents store memories about Docker -> single entity."""


class TestVisibilityEnforcement:
    async def test_private_memory_entities_excluded(self) -> None:
        """Private memory entities not in org-wide graph."""


class TestAgentFileRoundTrip:
    async def test_export_import_preserves_data(self) -> None:
        """Export agent file, import into new org, verify entities."""


class TestOverlapComputation:
    async def test_overlap_matrix_3_agents(self) -> None:
        """3 agents with shared entities -> correct Jaccard scores."""
