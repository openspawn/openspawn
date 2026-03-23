"""Memory service — business logic for store, search, rate limiting, confidence."""

from __future__ import annotations

import hashlib
import time
import uuid
from collections import defaultdict
from typing import TYPE_CHECKING, Any

import pendulum
import structlog
from sqlalchemy import func, select

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger()

# Source-based confidence defaults
SOURCE_CONFIDENCE: dict[str, int] = {
    "task_completion": 90,
    "code_change": 85,
    "observation": 60,
    "inference": 40,
    "unknown": 50,
}

# Rate limit defaults
RATE_LIMIT_PER_MIN = 10
RATE_LIMIT_PER_DAY = 1000
RATE_LIMIT_PER_ORG = 100_000

# In-memory rate limit counters (per-process, reset on restart)
_minute_counts: dict[str, list[float]] = defaultdict(list)
_day_counts: dict[str, int] = defaultdict(int)
_day_reset: dict[str, float] = {}


class RateLimitExceededError(Exception):
    def __init__(self, detail: str) -> None:
        self.detail = detail
        super().__init__(detail)


def get_confidence_for_source(source: str) -> int:
    return SOURCE_CONFIDENCE.get(source, SOURCE_CONFIDENCE["unknown"])


def compute_content_hash(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def check_rate_limit(
    agent_id: uuid.UUID,
    per_min: int = RATE_LIMIT_PER_MIN,
    per_day: int = RATE_LIMIT_PER_DAY,
) -> None:
    """Check in-memory rate limits. Raises RateLimitExceededError if over limit."""
    now = time.time()
    key = str(agent_id)

    # Per-minute check
    _minute_counts[key] = [t for t in _minute_counts[key] if now - t < 60]
    if len(_minute_counts[key]) >= per_min:
        raise RateLimitExceededError(f"Rate limit: {per_min}/min exceeded for agent")

    # Per-day check
    day_key = f"{key}:day"
    if day_key not in _day_reset or now - _day_reset[day_key] > 86400:
        _day_counts[day_key] = 0
        _day_reset[day_key] = now

    if _day_counts[day_key] >= per_day:
        raise RateLimitExceededError(f"Rate limit: {per_day}/day exceeded for agent")

    # Record this request
    _minute_counts[key].append(now)
    _day_counts[day_key] += 1


async def check_org_rate_limit(
    session: AsyncSession,
    org_id: uuid.UUID,
    limit: int = RATE_LIMIT_PER_ORG,
) -> None:
    """Check org-level memory count limit."""
    from app.models.memory import Memory

    count = await session.scalar(select(func.count()).where(Memory.org_id == org_id))
    if count is not None and count >= limit:
        raise RateLimitExceededError(f"Org memory limit: {limit} reached")


async def store_memory(
    session: AsyncSession,
    org_id: uuid.UUID,
    agent_id: uuid.UUID,
    content: str,
    source: str = "unknown",
    memory_type: str = "episodic",
    visibility: str = "shared",
    target_agent_ids: list[uuid.UUID] | None = None,
    occurred_at: str | None = None,
    expires_at: str | None = None,
    metadata: dict | None = None,
) -> uuid.UUID:
    """Store a memory. Returns the memory ID."""
    from app.models.memory import Memory

    # Rate limit
    check_rate_limit(agent_id)
    await check_org_rate_limit(session, org_id)

    # Confidence from source
    confidence = get_confidence_for_source(source)

    # Hash for instant dedup
    content_hash = compute_content_hash(content)

    # Check hash dedup
    existing = await session.scalar(
        select(Memory.id).where(
            Memory.org_id == org_id,
            Memory.agent_id == agent_id,
            Memory.content_hash == content_hash,
        )
    )
    if existing:
        logger.info("memory.hash_dedup", existing_id=str(existing))
        return existing

    now = pendulum.now("UTC")
    memory = Memory(
        org_id=org_id,
        agent_id=agent_id,
        type=memory_type,
        content=content,
        raw_content=content,
        content_hash=content_hash,
        visibility=visibility,
        target_agent_ids=target_agent_ids,
        confidence=confidence,
        source=source,
        occurred_at=pendulum.parse(occurred_at) if occurred_at else now,
        expires_at=pendulum.parse(expires_at) if expires_at else None,
        metadata_=metadata or {},
    )
    session.add(memory)
    await session.flush()

    # Two-tier resilience: enqueue background enrichment (best-effort)
    await _enqueue_enrichment(memory.id)

    logger.info("memory.stored", memory_id=str(memory.id), source=source, confidence=confidence)
    return memory.id


async def _enqueue_enrichment(memory_id: uuid.UUID) -> None:
    """Best-effort enqueue of background enrichment via arq/Redis."""
    try:
        from arq import create_pool

        from app.workers.config import get_redis_settings

        pool = await create_pool(get_redis_settings())
        await pool.enqueue_job("boost_co_retrieved", _job_id=f"enrich:{memory_id}")
        await pool.close()
    except Exception:
        logger.warning("enrichment.enqueue_failed", memory_id=str(memory_id))


async def get_memory(
    session: AsyncSession,
    memory_id: uuid.UUID,
    org_id: uuid.UUID,
) -> object | None:
    """Get a single memory by ID."""
    from app.models.memory import Memory

    result = await session.execute(
        select(Memory).where(Memory.id == memory_id, Memory.org_id == org_id)
    )
    return result.scalar_one_or_none()


async def list_memories(
    session: AsyncSession,
    org_id: uuid.UUID,
    agent_id: uuid.UUID | None = None,
    memory_type: str | None = None,
    visibility: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[Any], int]:
    """List memories with filters. Returns (memories, total_count)."""
    from app.models.memory import Memory

    q = select(Memory).where(Memory.org_id == org_id)
    count_q = select(func.count()).select_from(Memory).where(Memory.org_id == org_id)

    if agent_id:
        q = q.where(Memory.agent_id == agent_id)
        count_q = count_q.where(Memory.agent_id == agent_id)
    if memory_type:
        q = q.where(Memory.type == memory_type)
        count_q = count_q.where(Memory.type == memory_type)
    if visibility:
        q = q.where(Memory.visibility == visibility)
        count_q = count_q.where(Memory.visibility == visibility)

    total = await session.scalar(count_q) or 0

    result = await session.execute(q.order_by(Memory.created_at.desc()).offset(offset).limit(limit))
    return list(result.scalars().all()), total


async def record_feedback(
    session: AsyncSession,
    memory_id: uuid.UUID,
    org_id: uuid.UUID,
    helpful: bool,
) -> bool:
    """Record helpful/unhelpful feedback. Returns True if memory found."""
    from app.models.memory import Memory

    result = await session.execute(
        select(Memory).where(Memory.id == memory_id, Memory.org_id == org_id)
    )
    memory = result.scalar_one_or_none()
    if not memory:
        return False

    if helpful:
        memory.helpful_count += 1
        memory.confidence = min(100, memory.confidence + 2)
    else:
        memory.unhelpful_count += 1
        memory.confidence = max(0, memory.confidence - 5)

    return True
