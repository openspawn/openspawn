from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

import app.approvals.service as service
from app.approvals.schemas import ApprovalResponse, RespondApprovalDto
from app.auth.dependencies import AuthContext, require_auth
from app.database import get_db
from app.models.enums import ApprovalStatus
from app.schemas import DataResponse, PaginatedResponse, PaginationMeta

router = APIRouter(prefix="/approvals", tags=["approvals"])


@router.get("")
async def list_approvals(
    status_filter: str | None = Query(None, alias="status"),
    action_type: str | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, le=200),
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> PaginatedResponse[ApprovalResponse]:
    approvals, total = await service.list_approvals(
        db, auth.org_id, status_filter, action_type, page, limit
    )
    return PaginatedResponse(
        data=[ApprovalResponse.model_validate(a) for a in approvals],
        meta=PaginationMeta(total=total, page=page, limit=limit),
    )


@router.get("/pending")
async def list_pending(
    action_type: str | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, le=200),
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> PaginatedResponse[ApprovalResponse]:
    approvals, total = await service.list_approvals(
        db, auth.org_id, ApprovalStatus.PENDING.value, action_type, page, limit
    )
    return PaginatedResponse(
        data=[ApprovalResponse.model_validate(a) for a in approvals],
        meta=PaginationMeta(total=total, page=page, limit=limit),
    )


@router.get("/{approval_id}")
async def get_approval(
    approval_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[ApprovalResponse]:
    approval = await service.get_approval(db, auth.org_id, approval_id)
    return DataResponse(data=ApprovalResponse.model_validate(approval))


@router.post("/{approval_id}/approve")
async def approve(
    approval_id: uuid.UUID,
    dto: RespondApprovalDto | None = None,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[ApprovalResponse]:
    approval = await service.respond_to_approval(
        db, auth, approval_id, ApprovalStatus.APPROVED.value, dto.notes if dto else None
    )
    await db.commit()
    return DataResponse(data=ApprovalResponse.model_validate(approval))


@router.post("/{approval_id}/reject")
async def reject(
    approval_id: uuid.UUID,
    dto: RespondApprovalDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[ApprovalResponse]:
    if not dto.notes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rejection reason is required",
        )
    approval = await service.respond_to_approval(
        db, auth, approval_id, ApprovalStatus.REJECTED.value, dto.notes
    )
    await db.commit()
    return DataResponse(data=ApprovalResponse.model_validate(approval))
