"""Background enrichment jobs for the memory system.

Runs via arq on a cron schedule:
  - boost_co_retrieved: increment strength for frequently co-retrieved memories
  - identify_stale: flag low-confidence + low-access + old memories
  - extract_entities: LLM entity/relationship extraction from unprocessed memories
  - merge_duplicate_entities: periodic entity dedup sweep (stub)
"""

from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

import structlog
from arq import cron
from sqlalchemy import and_, select, text

from app.database import async_session
from app.models.memory import Memory
from app.workers.config import get_redis_settings
from app.workers.expiry import expire_memories

if TYPE_CHECKING:
    from collections.abc import Sequence

logger = structlog.get_logger()

STALE_CONFIDENCE_THRESHOLD = 30
STALE_ACCESS_THRESHOLD = 3
STALE_AGE_DAYS = 60


async def boost_co_retrieved(ctx: dict) -> int:
    """Increment strength for memories frequently retrieved together.

    Finds pairs sharing the same retrieval_context->query in the last 24h
    and bumps their strength by 1 (capped at 100).
    """
    async with async_session() as session:
        # Find memories that share the same retrieval query within 24h
        rows: Sequence[tuple[str]] = (
            await session.execute(
                text("""
                    SELECT m1.id
                    FROM memories m1
                    JOIN memories m2
                      ON m1.org_id = m2.org_id
                     AND m1.id < m2.id
                     AND m1.retrieval_context->>'query' = m2.retrieval_context->>'query'
                    WHERE m1.last_accessed_at > NOW() - INTERVAL '24 hours'
                      AND m2.last_accessed_at > NOW() - INTERVAL '24 hours'
                      AND m1.retrieval_context IS NOT NULL
                    GROUP BY m1.id
                    HAVING COUNT(*) >= 2
                """)
            )
        ).all()

        boosted = 0
        for (mem_id,) in rows:
            mem = await session.get(Memory, mem_id)
            if mem and mem.strength < 100:
                mem.strength = min(100, mem.strength + 1)
                boosted += 1

        await session.commit()
        logger.info("boost_co_retrieved.done", boosted=boosted)
        return boosted


async def identify_stale(ctx: dict) -> int:
    """Flag memories with low confidence + low access + old age as stale."""
    async with async_session() as session:
        cutoff = text(f"NOW() - INTERVAL '{STALE_AGE_DAYS} days'")
        stale_mems = (
            await session.scalars(
                select(Memory).where(
                    and_(
                        Memory.confidence < STALE_CONFIDENCE_THRESHOLD,
                        Memory.access_count < STALE_ACCESS_THRESHOLD,
                        Memory.updated_at < cutoff,
                    )
                )
            )
        ).all()

        count = 0
        for mem in stale_mems:
            existing = mem.metadata_ or {}
            if not existing.get("stale"):
                mem.metadata_ = {**existing, "stale": True}
                count += 1

        await session.commit()
        logger.info("identify_stale.done", flagged=count)
        return count


async def extract_entities(ctx: dict) -> None:
    """Extract entities and relationships from recent unprocessed memories."""
    from app.memory.graph.extraction import MIN_ENTITY_CONFIDENCE, extract_from_content
    from app.memory.graph.postgres_store import PostgresGraphStore

    async with async_session() as session:
        result = await session.execute(
            text("""
                SELECT m.id, m.org_id, m.agent_id, m.content, m.confidence
                FROM memories m
                LEFT JOIN memory_entity_links mel ON mel.memory_id = m.id
                WHERE mel.memory_id IS NULL
                  AND m.created_at > NOW() - INTERVAL '24 hours'
                  AND m.content IS NOT NULL
                ORDER BY m.created_at DESC
                LIMIT 100
            """)
        )
        memories = result.fetchall()
        if not memories:
            logger.info("extract_entities: no unprocessed memories")
            return

        store = PostgresGraphStore(session)
        for mem in memories:
            if mem.confidence < MIN_ENTITY_CONFIDENCE:
                continue
            extraction = await extract_from_content(mem.content)
            for entity in extraction.entities:
                entity_id = await store.upsert_entity(
                    org_id=mem.org_id,
                    name=entity.name,
                    entity_type=entity.entity_type,
                    description=entity.description,
                    embedding=None,
                )
                await store.link_memory_entity(mem.id, entity_id, mem.agent_id)

            for rel in extraction.relationships:
                source = await store.find_entity(mem.org_id, rel.source, "")
                target = await store.find_entity(mem.org_id, rel.target, "")
                if source and target:
                    await store.upsert_relationship(
                        org_id=mem.org_id,
                        source_id=source.id,
                        target_id=target.id,
                        rel_type=rel.relationship_type,
                        weight=rel.weight,
                    )
            await session.commit()
        logger.info("extract_entities completed", processed=len(memories))


async def merge_duplicate_entities(ctx: dict) -> None:
    """Periodic entity dedup sweep via embedding similarity."""
    logger.info("merge_duplicate_entities: stub")


class WorkerSettings:
    """arq WorkerSettings — run with: arq app.workers.enrichment.WorkerSettings"""

    functions: ClassVar[list] = [
        boost_co_retrieved,
        identify_stale,
        extract_entities,
        expire_memories,
        merge_duplicate_entities,
    ]
    cron_jobs: ClassVar[list] = [
        cron(boost_co_retrieved, hour={0, 6, 12, 18}),  # 4x daily
        cron(identify_stale, hour={3}),  # once daily at 3am
        cron(extract_entities, hour={4}),  # once daily at 4am
        cron(expire_memories, minute={0}),  # every hour
        cron(merge_duplicate_entities, hour={5}),  # once daily at 5am
    ]
    redis_settings = get_redis_settings()
