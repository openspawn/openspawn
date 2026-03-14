from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

import app.coordination.service as service
from app.auth.dependencies import AuthContext, require_auth
from app.coordination.schemas import (
    EmitEventDto,
    EventSubscriptionResponse,
    ReplayDto,
    SubscribeDto,
)
from app.database import get_db
from app.schemas import DataMessageResponse, DataResponse

router = APIRouter(prefix="/coordination", tags=["coordination"])


@router.post("/emit")
async def emit_event(
    dto: EmitEventDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[dict]:
    await service.emit_coordination_event(db, auth.org_id, auth.id, dto)
    await db.commit()
    return DataMessageResponse(
        data={"event_type": dto.event_type, "task_id": str(dto.task_id)},
        message="Event emitted",
    )


@router.post("/subscribe", status_code=201)
async def subscribe(
    dto: SubscribeDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[EventSubscriptionResponse]:
    sub = await service.subscribe_to_events(db, auth.org_id, auth.id, dto)
    await db.commit()
    return DataResponse(data=EventSubscriptionResponse.model_validate(sub))


@router.post("/replay")
async def replay(
    dto: ReplayDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[dict]]:
    events = await service.replay_events(db, auth.org_id, dto)
    return DataResponse(
        data=[
            {
                "id": str(e.id),
                "type": e.type,
                "data": e.data,
                "actor_id": str(e.actor_id),
                "entity_id": str(e.entity_id),
                "created_at": str(e.created_at),
            }
            for e in events
        ]
    )


@router.get("/project")
async def project(
    task_id: str = Query(...),
    projection_type: str = Query(...),
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[dict]:
    result = await service.get_projection(db, auth.org_id, uuid.UUID(task_id), projection_type)
    return DataResponse(data=result)
