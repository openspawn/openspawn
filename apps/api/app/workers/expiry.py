"""Auto-expire time-bound memories past their expires_at timestamp."""

from __future__ import annotations

import structlog
from sqlalchemy import func, text, update

from app.database import async_session
from app.models.memory import Memory

logger = structlog.get_logger()


async def expire_memories(ctx: dict) -> int:
    """Soft-delete memories past their expires_at by setting metadata.expired = true."""
    async with async_session() as session:
        cursor = await session.execute(
            update(Memory)
            .where(Memory.expires_at < func.now())
            .where(
                Memory.metadata_["expired"].as_boolean().is_not(True)  # type: ignore[union-attr]
            )
            .values(
                metadata_=func.jsonb_set(
                    func.coalesce(Memory.metadata_, text("'{}'::jsonb")),
                    text("'{expired}'"),
                    text("'true'::jsonb"),
                )
            )
        )
        expired = getattr(cursor, "rowcount", 0) or 0
        await session.commit()
        logger.info("expire_memories.done", expired=expired)
        return expired
