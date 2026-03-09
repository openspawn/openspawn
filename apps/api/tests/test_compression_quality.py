"""Compression quality tests — validates LLM produces useful atomic facts.

Gate: MEMORY_QUALITY_TEST=1 (requires LLM API key)
Cost: ~$0.005 (10-20 Haiku calls)
Issue: #614
"""

from __future__ import annotations

import os

import pytest

pytestmark = pytest.mark.skipif(
    os.environ.get("MEMORY_QUALITY_TEST") != "1",
    reason="Set MEMORY_QUALITY_TEST=1 to run (requires LLM API key)",
)


@pytest.mark.asyncio
async def test_technical_terms_preserved():
    """Compression preserves technical terms like HNSW, ef_construction."""
    from app.memory.compression import compress_to_facts

    result = await compress_to_facts(
        "PostgreSQL HNSW indexes provide approximate nearest neighbor search "
        "with configurable ef_construction parameter set to 200 for optimal recall."
    )
    all_text = " ".join(result.facts).lower()
    assert "hnsw" in all_text, f"Missing 'HNSW' in facts: {result.facts}"
    assert len(result.facts) >= 1
    assert result.summary.strip()


@pytest.mark.asyncio
async def test_specific_values_preserved():
    """Compression preserves specific numeric values (TTL, service names)."""
    from app.memory.compression import compress_to_facts

    result = await compress_to_facts(
        "Agent fixed caching bug in ProductService by adding Redis TTL of 300s. "
        "The fix reduced cache miss rate from 45% to 3%."
    )
    all_text = " ".join(result.facts)
    assert "300" in all_text, f"Missing '300' (TTL value) in facts: {result.facts}"
    assert len(result.facts) >= 2


@pytest.mark.asyncio
async def test_numbers_and_comparisons_preserved():
    """Compression preserves comparative metrics."""
    from app.memory.compression import compress_to_facts

    result = await compress_to_facts(
        "The team decided to use Voyage 3.5 because it scored 8.26% better "
        "than OpenAI on retrieval benchmarks and costs $0.06 per million tokens."
    )
    all_text = " ".join(result.facts)
    # At least the key number should survive
    assert "8.26" in all_text or "8.2" in all_text, f"Missing metric in facts: {result.facts}"
    assert len(result.facts) >= 1


@pytest.mark.asyncio
async def test_redundancy_removal():
    """Three sentences saying the same thing compress to fewer facts."""
    from app.memory.compression import compress_to_facts

    result = await compress_to_facts(
        "The deployment failed because of a DNS issue. "
        "DNS problems caused the deployment to not work. "
        "The deploy didn't succeed due to DNS configuration errors."
    )
    # Should compress 3 redundant sentences into 1-2 facts
    assert len(result.facts) <= 2, (
        f"Expected <=2 facts for redundant input, got {len(result.facts)}: {result.facts}"
    )


@pytest.mark.asyncio
async def test_multiple_distinct_facts():
    """Content with multiple distinct facts produces multiple atomic facts."""
    from app.memory.compression import compress_to_facts

    result = await compress_to_facts(
        "Alice upgraded PostgreSQL from 14 to 16. "
        "Bob migrated the Redis cache from standalone to cluster mode. "
        "Carol wrote 47 integration tests for the new API endpoints."
    )
    assert len(result.facts) >= 3, (
        f"Expected >=3 facts for 3 distinct events, got {len(result.facts)}"
    )


@pytest.mark.asyncio
async def test_summary_captures_core_insight():
    """Summary is a single sentence capturing the main point."""
    from app.memory.compression import compress_to_facts

    result = await compress_to_facts(
        "The SLA monitor detected that task-42 exceeded its 5-minute deadline. "
        "It was auto-escalated from worker Bob (L4) to lead Alice (L7). "
        "Alice resolved the blocker by reassigning to senior engineer Carol (L6)."
    )
    assert len(result.summary) > 10, "Summary too short"
    assert len(result.summary) < 500, "Summary too long — should be one sentence"


@pytest.mark.asyncio
async def test_empty_input_graceful():
    """Empty or whitespace input doesn't crash."""
    from app.memory.compression import compress_to_facts

    result = await compress_to_facts("   ")
    # Should return something (even if just the whitespace as a fact)
    assert isinstance(result.facts, list)
    assert isinstance(result.summary, str)


@pytest.mark.asyncio
async def test_no_hallucinated_facts():
    """Facts should be derivable from input — no invented information."""
    from app.memory.compression import compress_to_facts

    input_text = "Redis cache TTL is 300 seconds for the ProductService."
    result = await compress_to_facts(input_text)

    # Facts should not mention things not in the input
    all_text = " ".join(result.facts).lower()
    # These should NOT appear (hallucination indicators)
    hallucination_terms = ["postgresql", "mongodb", "kubernetes", "docker"]
    for term in hallucination_terms:
        assert term not in all_text, f"Hallucinated term '{term}' found in facts: {result.facts}"
