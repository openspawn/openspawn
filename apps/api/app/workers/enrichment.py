"""Background enrichment jobs for the memory system.

Runs via arq on a cron schedule:
  - boost_co_retrieved: increment strength for frequently co-retrieved memories
  - identify_stale: flag low-confidence + low-access + old memories
  - derive_facts: cluster related memories and extract derived facts (stub)
"""

from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

import structlog
from arq import cron
from sqlalchemy import and_, select, text

from app.database import async_session
from app.models.memory import Memory
from app.workers.config import get_redis_settings

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


async def derive_facts(ctx: dict) -> int:
    """Cluster related memories and extract new derived facts.

    Stub — will use instructor + litellm to generate derived facts
    from clusters of semantically similar memories.
    """
    logger.info("derive_facts.done", derived=0)
    return 0


class WorkerSettings:
    """arq WorkerSettings — run with: arq app.workers.enrichment.WorkerSettings"""

    functions: ClassVar[list] = [boost_co_retrieved, identify_stale, derive_facts]
    cron_jobs: ClassVar[list] = [
        cron(boost_co_retrieved, hour={0, 6, 12, 18}),  # 4x daily
        cron(identify_stale, hour={3}),  # once daily at 3am
        cron(derive_facts, hour={4}),  # once daily at 4am
    ]
    redis_settings = get_redis_settings()
