"""Auto-expire time-bound memories past their expires_at timestamp."""

from __future__ import annotations

import structlog
from sqlalchemy import func, text, update

from app.database import async_session
from app.models.memory import Memory
from app.models.sql_helpers import json_set_fn

logger = structlog.get_logger()


def _dialect() -> str:
    from app.config import settings

    return "sqlite" if settings.is_sqlite else "postgresql"


async def expire_memories(ctx: dict) -> int:
    """Soft-delete memories past their expires_at by setting metadata.expired = true."""
    d = _dialect()
    set_fn = getattr(func, json_set_fn(d))
    if d == "sqlite":
        empty_json = text("'{}'")
        expired_path = text("'$.expired'")
        true_val = text("json('true')")
    else:
        empty_json = text("'{}'::jsonb")
        expired_path = text("'{expired}'")
        true_val = text("'true'::jsonb")

    async with async_session() as session:
        cursor = await session.execute(
            update(Memory)
            .where(Memory.expires_at < func.now())
            .where(
                Memory.metadata_["expired"].as_boolean().is_not(True)  # type: ignore[union-attr]
            )
            .values(
                metadata_=set_fn(
                    func.coalesce(Memory.metadata_, empty_json),
                    expired_path,
                    true_val,
                )
            )
        )
        expired = getattr(cursor, "rowcount", 0) or 0
        await session.commit()
        logger.info("expire_memories.done", expired=expired)
        return expired
