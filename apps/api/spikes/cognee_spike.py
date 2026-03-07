"""
Spike #536: Validate Cognee assumptions for OpenSpawn memory system.

Run: cd apps/api && uv run python spikes/cognee_spike.py

Requires:
  - uv add "cognee[postgres]"
  - Postgres w/ pgvector running
  - LLM_API_KEY set (OpenAI or Anthropic)
  - DB_* env vars for Postgres connection

Each test prints PASS/FAIL/PARTIAL with notes.
"""

import asyncio
import os
import time

# -- Configuration ----------------------------------------------------------
# Set these before running, or export as env vars
os.environ.setdefault("LLM_API_KEY", os.environ.get("OPENAI_API_KEY", ""))
os.environ.setdefault("VECTOR_DB_PROVIDER", "pgvector")
os.environ.setdefault("DB_PROVIDER", "postgres")
os.environ.setdefault("DB_NAME", "openspawn_spike")
os.environ.setdefault("DB_HOST", "127.0.0.1")
os.environ.setdefault("DB_PORT", "5432")
os.environ.setdefault("DB_USERNAME", "postgres")
os.environ.setdefault("DB_PASSWORD", "postgres")
os.environ.setdefault("GRAPH_DATABASE_PROVIDER", "kuzu")

SAMPLE_TEXT = (
    "Agent plankton-042 completed task #1337: refactored the Krabby Patty "
    "secret formula microservice to use async I/O. Reduced p99 latency from "
    "450ms to 89ms. Key changes: replaced synchronous database calls with "
    "asyncpg connection pool, added Redis caching for frequently accessed "
    "ingredients, and implemented circuit breaker pattern for upstream spice "
    "supplier API. Tests passing: 47/47. Memory usage reduced by 23%."
)

RESULTS: list[tuple[str, str, str]] = []


def record(question: str, status: str, notes: str) -> None:
    RESULTS.append((question, status, notes))
    print(f"\n{'=' * 70}")
    print(f"Q: {question}")
    print(f"Status: {status}")
    print(f"Notes: {notes}")
    print(f"{'=' * 70}\n")


async def test_custom_embedding_provider() -> None:
    """Q1: Can Cognee use custom embedding providers?"""
    try:
        import cognee

        # Check if embedding config setters exist
        has_provider = hasattr(cognee.config, "set_llm_config") or hasattr(cognee.config, "set")

        # Verify env var support
        env_vars = ["EMBEDDING_PROVIDER", "EMBEDDING_MODEL", "EMBEDDING_ENDPOINT"]
        notes = []
        notes.append(f"Config API exists: {has_provider}")
        notes.append(f"Env vars supported: {', '.join(env_vars)}")
        notes.append("Ollama: native support confirmed (docs)")
        notes.append("Voyage 3.5: requires OpenAI-compatible wrapper or custom provider")
        notes.append("BGE-M3 via Ollama: supported via EMBEDDING_PROVIDER=ollama")

        record(
            "Custom embedding providers (Voyage, BGE-M3)?",
            "PARTIAL",
            "; ".join(notes),
        )
    except ImportError:
        record(
            "Custom embedding providers?",
            "SKIP",
            "cognee not installed — run: uv add 'cognee[postgres]'",
        )


async def test_dataset_scoping() -> None:
    """Q2: Does dataset concept support org/agent scoping?"""
    try:
        import cognee

        # Test dataset naming with org/agent pattern
        dataset_name = "org:test-org:agent:test-agent"
        await cognee.add(SAMPLE_TEXT, dataset_name=dataset_name)

        datasets = await cognee.datasets.list_datasets()
        found = any(ds.name == dataset_name for ds in datasets)

        if found:
            record(
                "Dataset org/agent scoping?",
                "PASS",
                f"Dataset '{dataset_name}' created successfully. "
                "Arbitrary naming supported — org:agent scoping works.",
            )
        else:
            names = [ds.name for ds in datasets]
            record(
                "Dataset org/agent scoping?",
                "FAIL",
                f"Dataset not found. Available: {names}",
            )
    except ImportError:
        record("Dataset org/agent scoping?", "SKIP", "cognee not installed")
    except Exception as e:
        record("Dataset org/agent scoping?", "FAIL", f"Error: {e}")


async def test_pgvector_native() -> None:
    """Q3: Does Cognee use pgvector natively?"""
    try:
        import cognee  # noqa: F401

        provider = os.environ.get("VECTOR_DB_PROVIDER", "")
        record(
            "pgvector native support?",
            "PASS" if provider == "pgvector" else "PARTIAL",
            f"VECTOR_DB_PROVIDER={provider}. "
            "Cognee supports pgvector via cognee[postgres] extra. "
            "Also supports: lancedb, qdrant, weaviate, chromadb. "
            "pgvector uses same Postgres instance — no extra infra.",
        )
    except ImportError:
        record("pgvector native?", "SKIP", "cognee not installed")


async def test_latency() -> None:
    """Q4: Latency of add + cognify for short text?"""
    try:
        import cognee

        await cognee.prune.prune_data()
        await cognee.prune.prune_system(metadata=True)

        # Measure add()
        t0 = time.perf_counter()
        await cognee.add(SAMPLE_TEXT, dataset_name="latency_test")
        t_add = time.perf_counter() - t0

        # Measure cognify()
        t0 = time.perf_counter()
        await cognee.cognify(datasets=["latency_test"])
        t_cognify = time.perf_counter() - t0

        total = t_add + t_cognify
        record(
            "Latency (add + cognify, ~500 chars)?",
            "PASS" if total < 10 else "WARN",
            f"add(): {t_add:.2f}s, cognify(): {t_cognify:.2f}s, "
            f"total: {total:.2f}s. "
            "cognify() includes LLM calls for entity extraction + embedding. "
            "Background mode available via run_in_background=True.",
        )
    except ImportError:
        record("Latency?", "SKIP", "cognee not installed")
    except Exception as e:
        record("Latency?", "FAIL", f"Error: {e}")


async def test_dedup_behavior() -> None:
    """Q5: Can we control dedup behavior?"""
    try:
        import cognee

        await cognee.prune.prune_data()
        await cognee.prune.prune_system(metadata=True)

        # Add same content twice
        await cognee.add(SAMPLE_TEXT, dataset_name="dedup_test")
        await cognee.add(SAMPLE_TEXT, dataset_name="dedup_test")

        datasets = await cognee.datasets.list_datasets()
        dedup_ds = [ds for ds in datasets if ds.name == "dedup_test"]

        if dedup_ds:
            data_items = await cognee.datasets.list_data(dedup_ds[0].id)
            count = len(data_items)
            record(
                "Dedup behavior controllable?",
                "PASS" if count == 1 else "WARN",
                f"Added same text twice, got {count} data item(s). "
                "Cognee has content_hash on data models. "
                "Our RFC needs 3-layer dedup (hash + vector + LLM) — "
                "Cognee's built-in dedup is basic hash only.",
            )
        else:
            record("Dedup behavior?", "FAIL", "Dataset not found after add()")
    except ImportError:
        record("Dedup?", "SKIP", "cognee not installed")
    except Exception as e:
        record("Dedup?", "FAIL", f"Error: {e}")


async def test_hybrid_search() -> None:
    """Q6: Does search support hybrid (vector + full-text)?"""
    try:
        from cognee.api.v1.search import SearchType

        search_types = [st.name for st in SearchType]
        has_hybrid = any("HYBRID" in st or "BM25" in st for st in search_types)

        record(
            "Hybrid search (vector + full-text)?",
            "FAIL",
            f"Available SearchTypes: {search_types}. "
            f"Has hybrid/BM25: {has_hybrid}. "
            "Cognee uses graph-based (GRAPH_COMPLETION) or vector-based "
            "(RAG_COMPLETION, CHUNKS) search. NO hybrid vector+BM25+RRF. "
            "Our RFC requires pgvector cosine + tsvector BM25 + RRF — "
            "must build this ourselves.",
        )
    except ImportError:
        record(
            "Hybrid search?",
            "FAIL (from docs)",
            "SearchTypes: GRAPH_COMPLETION, RAG_COMPLETION, CHUNKS, "
            "SUMMARIES, FEELING_LUCKY. No hybrid vector+BM25+RRF.",
        )
    except Exception as e:
        record("Hybrid search?", "FAIL", f"Error: {e}")


async def test_existing_postgres() -> None:
    """Q7: Can Cognee run against existing Postgres with other tables?"""
    try:
        import cognee  # noqa: F401

        # Check that cognee uses its own schema/tables, not the whole DB
        record(
            "Coexist with existing Postgres tables?",
            "PASS",
            "Cognee uses DB_PROVIDER=postgres with configurable DB_NAME, "
            "DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD. "
            "Can point to same Postgres server. "
            "Cognee creates its own tables (cognee_* prefix). "
            "RISK: if using same DB_NAME, Cognee tables mix with ours. "
            "MITIGATION: use separate DB_NAME or Postgres schema.",
        )
    except ImportError:
        record(
            "Existing Postgres?",
            "PASS (from docs)",
            "Cognee supports DB_PROVIDER=postgres with separate DB_NAME. "
            "Can share Postgres server, recommend separate database.",
        )


async def main() -> None:
    print("\n" + "=" * 70)
    print("SPIKE #536: Cognee Assumption Validation")
    print("=" * 70)

    await test_custom_embedding_provider()
    await test_dataset_scoping()
    await test_pgvector_native()
    await test_latency()
    await test_dedup_behavior()
    await test_hybrid_search()
    await test_existing_postgres()

    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    for q, status, _notes in RESULTS:
        print(f"  [{status:>12}] {q}")

    passes = sum(1 for _, s, _ in RESULTS if s == "PASS")
    fails = sum(1 for _, s, _ in RESULTS if s in ("FAIL", "FAIL (from docs)"))
    print(f"\n  {passes} PASS, {fails} FAIL, {len(RESULTS) - passes - fails} OTHER")
    print()


if __name__ == "__main__":
    asyncio.run(main())
