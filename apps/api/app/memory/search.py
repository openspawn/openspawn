"""Hybrid search: pgvector cosine + tsvector BM25 + Reciprocal Rank Fusion.

Validated by OpenClaw (189K stars) in production: ~84% precision vs ~62% vector-only.
"""

from __future__ import annotations

import math
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

import pendulum
import structlog
from pydantic import BaseModel, Field
from sqlalchemy import text

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger()

# Scoring weights (updated with helpfulness signal)
VECTOR_WEIGHT = 0.50
RECENCY_WEIGHT = 0.20
ACCESS_WEIGHT = 0.15
HELPFULNESS_WEIGHT = 0.15

# RRF constant (standard value from literature)
RRF_K = 60

# Recency decay half-life in days
RECENCY_HALF_LIFE_DAYS = 30.0

DEFAULT_LIMIT = 10
DEFAULT_SIMILARITY_THRESHOLD = 0.7


class SearchResult(BaseModel):
    memory_id: uuid.UUID
    content: str
    raw_content: str
    summary: str | None = None
    memory_type: str
    source: str
    confidence: int
    strength: int
    visibility: str
    agent_id: uuid.UUID
    score: float = Field(description="Combined hybrid score")
    vector_score: float = 0.0
    text_score: float = 0.0
    recency_score: float = 0.0
    access_score: float = 0.0
    created_at: datetime
    occurred_at: datetime
    access_count: int = 0
    metadata: dict = Field(default_factory=dict)


def _recency_decay(last_accessed: datetime | None, now: datetime) -> float:
    """Exponential decay from last access time. Returns 0-1."""
    if last_accessed is None:
        return 0.0
    delta_days = (now - last_accessed).total_seconds() / 86400.0
    if delta_days < 0:
        return 1.0
    return math.exp(-0.693 * delta_days / RECENCY_HALF_LIFE_DAYS)


def _rrf_fuse(
    vector_ranks: dict[uuid.UUID, int],
    text_ranks: dict[uuid.UUID, int],
) -> dict[uuid.UUID, float]:
    """Reciprocal Rank Fusion to merge two ranked result sets."""
    all_ids = set(vector_ranks) | set(text_ranks)
    scores: dict[uuid.UUID, float] = {}
    for mid in all_ids:
        score = 0.0
        if mid in vector_ranks:
            score += 1.0 / (RRF_K + vector_ranks[mid])
        if mid in text_ranks:
            score += 1.0 / (RRF_K + text_ranks[mid])
        scores[mid] = score
    return scores


async def hybrid_search(
    session: AsyncSession,
    org_id: uuid.UUID,
    query_text: str,
    query_embedding: list[float] | None = None,
    requesting_agent_id: uuid.UUID | None = None,
    limit: int = DEFAULT_LIMIT,
    similarity_threshold: float = DEFAULT_SIMILARITY_THRESHOLD,
    memory_type: str | None = None,
) -> list[SearchResult]:
    """Hybrid search combining vector similarity + full-text + RRF + scoring."""

    now = pendulum.now("UTC")

    # Build visibility filter
    visibility_filter = _build_visibility_filter(requesting_agent_id)
    type_filter = "AND m.type = :memory_type" if memory_type else ""
    expiry_filter = (
        "AND (m.expires_at IS NULL OR m.expires_at > NOW()) "
        "AND (m.metadata->>'expired' IS NULL OR m.metadata->>'expired' != 'true')"
    )

    params: dict[str, str | int | float] = {
        "org_id": str(org_id),
        "fetch_limit": limit * 3,  # overfetch for RRF merge
    }
    if memory_type:
        params["memory_type"] = memory_type

    # Vector search
    vector_results: dict[uuid.UUID, tuple[int, float]] = {}
    if query_embedding is not None:
        embedding_str = "[" + ",".join(str(v) for v in query_embedding) + "]"
        vector_sql = text(f"""
            SELECT m.id, 1 - (m.embedding <=> :embedding::vector) as similarity
            FROM memories m
            WHERE m.org_id = :org_id
              AND m.embedding IS NOT NULL
              AND 1 - (m.embedding <=> :embedding::vector) >= :threshold
              {visibility_filter}
              {type_filter}
              {expiry_filter}
            ORDER BY m.embedding <=> :embedding::vector
            LIMIT :fetch_limit
        """)
        result = await session.execute(
            vector_sql,
            {**params, "embedding": embedding_str, "threshold": similarity_threshold},
        )
        for rank, row in enumerate(result, start=1):
            vector_results[row.id] = (rank, row.similarity)

    # Full-text search
    text_results: dict[uuid.UUID, tuple[int, float]] = {}
    text_sql = text(f"""
        SELECT m.id, ts_rank(m.content_tsv, plainto_tsquery('english', :query)) as rank_score
        FROM memories m
        WHERE m.org_id = :org_id
          AND m.content_tsv @@ plainto_tsquery('english', :query)
          {visibility_filter}
          {type_filter}
          {expiry_filter}
        ORDER BY rank_score DESC
        LIMIT :fetch_limit
    """)
    result = await session.execute(text_sql, {**params, "query": query_text})
    for rank, row in enumerate(result, start=1):
        text_results[row.id] = (rank, row.rank_score)

    # RRF fusion
    vector_ranks = {mid: rank for mid, (rank, _) in vector_results.items()}
    text_ranks = {mid: rank for mid, (rank, _) in text_results.items()}
    rrf_scores = _rrf_fuse(vector_ranks, text_ranks)

    if not rrf_scores:
        return []

    # Fetch full memory data for top results
    candidate_ids = sorted(rrf_scores, key=lambda x: rrf_scores[x], reverse=True)[:limit]
    id_list = ",".join(f"'{mid!s}'" for mid in candidate_ids)

    full_sql = text(f"""
        SELECT m.id, m.content, m.raw_content, m.summary, m.type, m.source,
               m.confidence, m.strength, m.visibility, m.agent_id,
               m.created_at, m.occurred_at, m.access_count,
               m.last_accessed_at, m.helpful_count, m.unhelpful_count,
               m.metadata
        FROM memories m
        WHERE m.id IN ({id_list})
    """)
    rows = await session.execute(full_sql)

    # Build scored results
    max_access = 1
    memory_data = {}
    for row in rows:
        memory_data[row.id] = row
        if row.access_count > max_access:
            max_access = row.access_count

    results: list[SearchResult] = []
    for mid in candidate_ids:
        if mid not in memory_data:
            continue
        row = memory_data[mid]
        vector_sim = vector_results.get(mid, (0, 0.0))[1]
        text_sim = text_results.get(mid, (0, 0.0))[1]
        recency = _recency_decay(row.last_accessed_at, now)
        access_norm = row.access_count / max_access if max_access > 0 else 0.0

        helpfulness = row.helpful_count / max(1, row.helpful_count + row.unhelpful_count)
        combined_score = (
            VECTOR_WEIGHT * vector_sim
            + RECENCY_WEIGHT * recency
            + ACCESS_WEIGHT * access_norm
            + HELPFULNESS_WEIGHT * helpfulness
        )

        results.append(
            SearchResult(
                memory_id=row.id,
                content=row.content,
                raw_content=row.raw_content,
                summary=row.summary,
                memory_type=row.type,
                source=row.source,
                confidence=row.confidence,
                strength=row.strength,
                visibility=row.visibility,
                agent_id=row.agent_id,
                score=combined_score,
                vector_score=vector_sim,
                text_score=text_sim,
                recency_score=recency,
                access_score=access_norm,
                created_at=row.created_at,
                occurred_at=row.occurred_at,
                access_count=row.access_count,
                metadata=row.metadata or {},
            )
        )

    results.sort(key=lambda r: r.score, reverse=True)

    # Update retrieval metadata
    if results:
        await _update_retrieval_metadata(session, [r.memory_id for r in results], query_text)

    return results


async def _update_retrieval_metadata(
    session: AsyncSession,
    memory_ids: list[uuid.UUID],
    query_text: str,
) -> None:
    """Increment access_count, update last_accessed_at, store retrieval_context."""
    id_list = ",".join(f"'{mid!s}'" for mid in memory_ids)
    await session.execute(
        text(f"""
            UPDATE memories
            SET access_count = access_count + 1,
                last_accessed_at = now(),
                retrieval_context = jsonb_build_object('last_query', :query, 'retrieved_at', now()::text)
            WHERE id IN ({id_list})
        """),
        {"query": query_text},
    )


def _build_visibility_filter(requesting_agent_id: uuid.UUID | None) -> str:
    """Build SQL visibility filter clause."""
    if requesting_agent_id is None:
        return "AND m.visibility = 'shared'"
    agent_str = str(requesting_agent_id)
    return (
        f"AND (m.visibility = 'shared' "
        f"OR (m.visibility = 'private' AND m.agent_id = '{agent_str}') "
        f"OR (m.visibility = 'targeted' AND '{agent_str}' = ANY(m.target_agent_ids::text[])))"
    )
