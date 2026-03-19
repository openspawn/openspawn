"""Router for cooperative ideation flow (#669)."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

import app.ideation.service as service
from app.auth.dependencies import AuthContext, require_auth
from app.database import get_db
from app.ideation.schemas import (
    IdeationBriefResponse,
    IdeationSessionResponse,
    StartIdeationDto,
    SubmitBriefDto,
)
from app.schemas import DataResponse

router = APIRouter(prefix="/ideation", tags=["ideation"])


@router.post("/sessions", status_code=201)
async def start_ideation(
    dto: StartIdeationDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[IdeationSessionResponse]:
    session = await service.start_ideation(
        db,
        auth,
        task_id=dto.task_id,
        participant_agent_ids=dto.participant_agent_ids,
        autonomy_level=dto.autonomy_level,
    )
    await db.commit()
    return DataResponse(data=IdeationSessionResponse.model_validate(session))


@router.get("/sessions/{session_id}")
async def get_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[IdeationSessionResponse]:
    session = await service.get_session_status(db, auth.org_id, session_id)
    return DataResponse(data=IdeationSessionResponse.model_validate(session))


@router.post("/sessions/{session_id}/briefs", status_code=201)
async def submit_brief(
    session_id: uuid.UUID,
    dto: SubmitBriefDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[IdeationBriefResponse]:
    brief = await service.submit_brief(db, auth, session_id, dto.content)
    await db.commit()
    return DataResponse(data=IdeationBriefResponse.model_validate(brief))


@router.get("/sessions/{session_id}/briefs")
async def list_briefs(
    session_id: uuid.UUID,
    round: int | None = Query(None, ge=1, le=3),
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[IdeationBriefResponse]]:
    briefs = await service.list_briefs(db, auth.org_id, session_id, round_filter=round)
    return DataResponse(data=[IdeationBriefResponse.model_validate(b) for b in briefs])


@router.post("/sessions/{session_id}/synthesize", status_code=201)
async def synthesize(
    session_id: uuid.UUID,
    dto: SubmitBriefDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[IdeationBriefResponse]:
    brief = await service.synthesize(db, auth, session_id, dto.content)
    await db.commit()
    return DataResponse(data=IdeationBriefResponse.model_validate(brief))


@router.post("/sessions/{session_id}/approve")
async def approve_plan(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[IdeationSessionResponse]:
    session = await service.approve_plan(db, auth, session_id)
    await db.commit()
    return DataResponse(data=IdeationSessionResponse.model_validate(session))
