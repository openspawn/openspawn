"""Unified event emitter: inserts Event row + publishes to SSE bus."""

from __future__ import annotations

from typing import TYPE_CHECKING

import pendulum
import structlog

from app.events.bus import event_bus
from app.events.schemas import SSEEvent
from app.models.enums import EventSeverity, SSEEventType
from app.models.event import Event

if TYPE_CHECKING:
    import uuid

    from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.stdlib.get_logger()

# Global sequence counter for SSE event IDs (used for Last-Event-ID reconnection).
# In-memory only — resets on restart. Reconnection replay uses DB created_at fallback.
_sequence: int = 0


def _next_sequence() -> int:
    global _sequence
    _sequence += 1
    return _sequence


async def emit(
    db: AsyncSession,
    type: SSEEventType,
    org_id: uuid.UUID,
    actor_id: uuid.UUID,
    entity_type: str,
    entity_id: uuid.UUID,
    data: dict[str, object],
    severity: EventSeverity = EventSeverity.INFO,
    reasoning: str | None = None,
    target_agents: list[str] | None = None,
) -> None:
    """Insert Event row + publish to SSE bus. Caller must commit."""
    now = pendulum.now("UTC")

    event = Event(
        org_id=org_id,
        type=type.value,
        actor_id=actor_id,
        entity_type=entity_type,
        entity_id=entity_id,
        data=data,
        severity=severity.value,
        reasoning=reasoning,
        created_at=now,
    )
    db.add(event)
    await db.flush()

    seq = _next_sequence()
    sse_event = SSEEvent(
        sequence=seq,
        type=type,
        org_id=org_id,
        actor_id=actor_id,
        entity_type=entity_type,
        entity_id=entity_id,
        data=data,
        created_at=now,
    )
    await event_bus.publish(sse_event, target_ids=target_agents)
    await logger.adebug("sse_emitted", type=type.value, seq=seq, entity_id=str(entity_id))
