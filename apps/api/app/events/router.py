from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import AuthContext, require_auth
from app.database import get_db
from app.events.schemas import EventResponse
from app.models.event import Event
from app.schemas import DataResponse, PaginatedResponse, PaginationMeta

router = APIRouter(prefix="/events", tags=["events"])


@router.get("")
async def list_events(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
    type: str | None = None,
    actor_id: uuid.UUID | None = None,
    entity_type: str | None = None,
    entity_id: uuid.UUID | None = None,
    severity: str | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, le=200),
) -> PaginatedResponse[EventResponse]:
    q = select(Event).where(Event.org_id == auth.org_id)

    if type:
        q = q.where(Event.type == type)
    if actor_id:
        q = q.where(Event.actor_id == actor_id)
    if entity_type:
        q = q.where(Event.entity_type == entity_type)
    if entity_id:
        q = q.where(Event.entity_id == entity_id)
    if severity:
        q = q.where(Event.severity == severity)
    if start_date:
        q = q.where(Event.created_at >= start_date)
    if end_date:
        q = q.where(Event.created_at <= end_date)

    total = await db.scalar(select(func.count()).select_from(q.subquery())) or 0
    offset = (page - 1) * limit
    result = await db.execute(q.order_by(Event.created_at.desc()).offset(offset).limit(limit))
    events = [EventResponse.model_validate(e) for e in result.scalars().all()]
    return PaginatedResponse(data=events, meta=PaginationMeta(total=total, page=page, limit=limit))


@router.get("/{event_id}")
async def get_event(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[EventResponse]:
    result = await db.execute(
        select(Event).where(Event.id == event_id, Event.org_id == auth.org_id)
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return DataResponse(data=EventResponse.model_validate(event))
