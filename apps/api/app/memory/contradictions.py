"""Contradiction resolution for conflicting memories."""

from __future__ import annotations

import enum
import uuid
from typing import TYPE_CHECKING

import structlog
from sqlalchemy import select

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

    from app.models.memory import Memory

logger = structlog.get_logger()


class ResolutionStrategy(enum.StrEnum):
    KEEP_NEWER = "keep_newer"
    KEEP_OLDER = "keep_older"
    MERGE = "merge"
    FLAG = "flag"


async def list_contradictions(
    org_id: uuid.UUID, session: AsyncSession
) -> list[tuple[Memory, Memory]]:
    """Find memory pairs with contradiction links in an org."""
    from app.models.memory import Memory

    stmt = select(Memory).where(
        Memory.org_id == org_id,
        Memory.metadata_["contradicts_id"].isnot(None),
    )
    newer_mems = (await session.scalars(stmt)).all()
    pairs: list[tuple[Memory, Memory]] = []
    for mem in newer_mems:
        older_id = (mem.metadata_ or {}).get("contradicts_id")
        if older_id:
            older = await session.get(Memory, older_id)
            if older:
                pairs.append((older, mem))
    return pairs


async def resolve_contradiction(
    memory_id: uuid.UUID,
    strategy: ResolutionStrategy,
    session: AsyncSession,
) -> Memory | None:
    """Resolve a contradiction between two linked memories."""
    from app.models.memory import Memory

    mem = await session.get(Memory, memory_id)
    if not mem:
        return None

    contradicts_id = (mem.metadata_ or {}).get("contradicts_id")
    other = await session.get(Memory, contradicts_id) if contradicts_id else None

    if strategy == ResolutionStrategy.KEEP_NEWER:
        if other:
            other.confidence = 0
            other.metadata_ = {**(other.metadata_ or {}), "resolved": "superseded"}
        mem.metadata_ = {**(mem.metadata_ or {}), "resolved": "kept"}
    elif strategy == ResolutionStrategy.KEEP_OLDER:
        mem.confidence = 0
        mem.metadata_ = {**(mem.metadata_ or {}), "resolved": "superseded"}
        if other:
            other.metadata_ = {**(other.metadata_ or {}), "resolved": "kept"}
    elif strategy == ResolutionStrategy.FLAG:
        mem.metadata_ = {**(mem.metadata_ or {}), "resolved": "flagged_for_review"}
        if other:
            other.metadata_ = {**(other.metadata_ or {}), "resolved": "flagged_for_review"}
    elif strategy == ResolutionStrategy.MERGE:
        # Stub — would use instructor + litellm to merge content
        mem.metadata_ = {**(mem.metadata_ or {}), "resolved": "merge_pending"}

    await session.flush()
    logger.info(
        "contradiction.resolved",
        memory_id=str(memory_id),
        strategy=strategy.value,
    )
    return mem


def link_contradiction(
    existing: Memory,
    new_memory: Memory,
) -> None:
    """Cross-link two memories as contradictions and penalize the older one."""
    existing.metadata_ = {
        **(existing.metadata_ or {}),
        "contradicted_by": str(new_memory.id),
    }
    existing.confidence = max(0, existing.confidence - 20)
    new_memory.metadata_ = {
        **(new_memory.metadata_ or {}),
        "contradicts_id": str(existing.id),
    }
