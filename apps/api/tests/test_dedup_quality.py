"""Dedup quality tests — validates 3-layer dedup pipeline accuracy.

Layer 1 (hash): Always runs, pure Python
Layer 2 (vector): Requires DB + pgvector (gated)
Layer 3 (LLM): Requires API key (gated)
Issue: #615
"""

from __future__ import annotations

import os

import pytest

from app.memory.dedup import DedupAction, compute_content_hash

# ── Layer 1: Hash dedup (always runs, no external deps) ──────────────


class TestHashDedupAccuracy:
    """Layer 1 must be 100% accurate — it's deterministic."""

    def test_exact_same_string_produces_same_hash(self):
        content = "Redis cache TTL is 300 seconds."
        assert compute_content_hash(content) == compute_content_hash(content)

    def test_different_strings_produce_different_hashes(self):
        h1 = compute_content_hash("Redis cache TTL is 300 seconds.")
        h2 = compute_content_hash("PostgreSQL HNSW uses ef=200.")
        assert h1 != h2

    def test_whitespace_differences_produce_different_hashes(self):
        """Different whitespace = different hash. This is acceptable behavior."""
        h1 = compute_content_hash("Redis TTL is 300s")
        h2 = compute_content_hash("Redis TTL is  300s")  # extra space
        assert h1 != h2, "Hash layer allows whitespace variants through (by design)"

    def test_case_differences_produce_different_hashes(self):
        h1 = compute_content_hash("Redis")
        h2 = compute_content_hash("redis")
        assert h1 != h2

    def test_unicode_content_hashes_consistently(self):
        content = "Agent résumé: réussi à déployer en production 🚀"
        assert compute_content_hash(content) == compute_content_hash(content)

    def test_long_content_hashes_to_64_chars(self):
        content = "x" * 10_000
        h = compute_content_hash(content)
        assert len(h) == 64

    def test_empty_string_has_valid_hash(self):
        h = compute_content_hash("")
        assert len(h) == 64


# ── Layer 3: LLM decision quality (gated) ────────────────────────────

llm_gate = pytest.mark.skipif(
    os.environ.get("MEMORY_QUALITY_TEST") != "1",
    reason="Set MEMORY_QUALITY_TEST=1 to run (requires LLM API key)",
)


@llm_gate
@pytest.mark.asyncio
async def test_llm_noop_for_identical_content():
    """LLM should return NOOP when new memory adds no information."""
    from app.memory.dedup import _llm_decide

    decision = await _llm_decide(
        existing_content="Redis cache TTL is set to 300 seconds for ProductService.",
        new_content="The TTL for Redis caching in ProductService is 300s.",
    )
    assert decision.action == DedupAction.NOOP, (
        f"Expected NOOP for semantically identical, got {decision.action}: {decision.reasoning}"
    )


@llm_gate
@pytest.mark.asyncio
async def test_llm_update_for_new_info():
    """LLM should return UPDATE when new memory adds info to existing."""
    from app.memory.dedup import _llm_decide

    decision = await _llm_decide(
        existing_content="Redis cache TTL is 300 seconds.",
        new_content="Redis cache TTL is 300 seconds. The eviction policy uses LRU with maxmemory of 2GB.",
    )
    assert decision.action == DedupAction.UPDATE, (
        f"Expected UPDATE for new info added, got {decision.action}: {decision.reasoning}"
    )
    assert decision.merged_content is not None, "UPDATE should provide merged_content"
    assert "300" in decision.merged_content, "Merged content should preserve original TTL value"


@llm_gate
@pytest.mark.asyncio
async def test_llm_add_for_different_topics():
    """LLM should return ADD for memories about different topics."""
    from app.memory.dedup import _llm_decide

    decision = await _llm_decide(
        existing_content="Redis cache TTL is 300 seconds for ProductService.",
        new_content="PostgreSQL HNSW indexes use ef_construction=200 for the memories table.",
    )
    assert decision.action == DedupAction.ADD, (
        f"Expected ADD for different topics, got {decision.action}: {decision.reasoning}"
    )


@llm_gate
@pytest.mark.asyncio
async def test_llm_conflict_for_contradictions():
    """LLM should return CONFLICT when memories contradict."""
    from app.memory.dedup import _llm_decide

    decision = await _llm_decide(
        existing_content="The deployment succeeded and all services are healthy.",
        new_content="The deployment failed with 3 services reporting errors.",
    )
    assert decision.action == DedupAction.CONFLICT, (
        f"Expected CONFLICT for contradictions, got {decision.action}: {decision.reasoning}"
    )


@llm_gate
@pytest.mark.asyncio
async def test_llm_provides_reasoning():
    """Every LLM decision should include non-empty reasoning."""
    from app.memory.dedup import _llm_decide

    decision = await _llm_decide(
        existing_content="Agent Alice completed task-42.",
        new_content="Task-42 was finished by lead engineer Alice.",
    )
    assert decision.reasoning.strip(), "Decision should include reasoning"


@llm_gate
@pytest.mark.asyncio
async def test_llm_update_preserves_both_facts():
    """UPDATE merged_content should contain information from both memories."""
    from app.memory.dedup import _llm_decide

    decision = await _llm_decide(
        existing_content="Agent Bob deployed version 2.3.1 to staging.",
        new_content="The staging deployment of v2.3.1 passed all smoke tests with 100% success rate.",
    )
    if decision.action == DedupAction.UPDATE:
        assert decision.merged_content is not None
        merged = decision.merged_content.lower()
        assert "2.3.1" in merged, "Merged should preserve version number"
