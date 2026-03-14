from __future__ import annotations

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.coordination.projections import (
    project_artifact_view,
    project_component_registry,
    project_test_coverage,
)
from app.coordination.schemas import EmitEventDto, ReplayDto, SubscribeDto
from app.events.emit import emit
from app.models.enums import SSEEventType
from app.models.event import Event
from app.models.event_subscription import EventSubscription

PROJECTION_REGISTRY = {
    "component_registry": project_component_registry,
    "test_coverage": project_test_coverage,
    "artifact_view": project_artifact_view,
}


async def emit_coordination_event(
    db: AsyncSession, org_id: uuid.UUID, actor_id: uuid.UUID, dto: EmitEventDto
) -> None:
    try:
        event_type = SSEEventType(dto.event_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown event type: {dto.event_type}",
        )

    targets = await _resolve_event_subscribers(db, org_id, dto.event_type, dto.task_id)

    # entity_id = task_id for coordination events (SQLite compatible, indexed)
    await emit(
        db=db,
        type=event_type,
        org_id=org_id,
        actor_id=actor_id,
        entity_type=dto.event_type.split(".")[0],
        entity_id=dto.task_id,
        data={
            "payload": dto.payload,
            "entity_name": dto.entity_name,
        },
        target_agents=targets if targets else None,
    )


async def subscribe_to_events(
    db: AsyncSession, org_id: uuid.UUID, agent_id: uuid.UUID, dto: SubscribeDto
) -> EventSubscription:
    existing = await db.execute(
        select(EventSubscription).where(
            EventSubscription.org_id == org_id,
            EventSubscription.agent_id == agent_id,
            EventSubscription.event_pattern == dto.event_pattern,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Subscription already exists",
        )

    sub = EventSubscription(
        org_id=org_id,
        agent_id=agent_id,
        event_pattern=dto.event_pattern,
        task_id=dto.task_id,
    )
    db.add(sub)
    await db.flush()
    await db.refresh(sub)
    return sub


async def replay_events(
    db: AsyncSession, org_id: uuid.UUID, dto: ReplayDto
) -> list[Event]:
    # entity_id = task_id for coordination events — works on SQLite + PostgreSQL
    q = select(Event).where(
        Event.org_id == org_id,
        Event.entity_id == dto.task_id,
    )

    if dto.since:
        q = q.where(Event.created_at >= dto.since)

    if dto.event_types:
        q = q.where(Event.type.in_(dto.event_types))

    q = q.order_by(Event.created_at.asc()).limit(dto.limit)
    result = await db.execute(q)
    return list(result.scalars().all())


async def get_projection(
    db: AsyncSession, org_id: uuid.UUID, task_id: uuid.UUID, projection_type: str
) -> dict:
    if projection_type not in PROJECTION_REGISTRY:
        valid = ", ".join(PROJECTION_REGISTRY.keys())
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown projection: {projection_type}. Valid: {valid}",
        )

    # On-demand rebuild — no caching. Fine for <1000 events per task.
    events = await db.execute(
        select(Event)
        .where(Event.org_id == org_id, Event.entity_id == task_id)
        .order_by(Event.created_at.asc())
    )
    event_list = list(events.scalars().all())
    return PROJECTION_REGISTRY[projection_type](event_list)


async def _resolve_event_subscribers(
    db: AsyncSession, org_id: uuid.UUID, event_type: str, task_id: uuid.UUID
) -> list[str]:
    result = await db.execute(
        select(EventSubscription).where(
            EventSubscription.org_id == org_id,
            (EventSubscription.task_id == task_id) | (EventSubscription.task_id.is_(None)),
        )
    )
    subs = result.scalars().all()

    matched: set[str] = set()
    for sub in subs:
        if _matches_pattern(event_type, sub.event_pattern):
            matched.add(str(sub.agent_id))

    return list(matched)


def _matches_pattern(event_type: str, pattern: str) -> bool:
    if pattern == "*":
        return True
    if pattern == event_type:
        return True
    if pattern.endswith(".*"):
        prefix = pattern[:-2]
        if event_type.startswith(prefix + "."):
            return True
    return False
