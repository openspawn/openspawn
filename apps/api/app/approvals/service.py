from __future__ import annotations

from typing import TYPE_CHECKING

import pendulum
from fastapi import HTTPException, status
from sqlalchemy import func, select

from app.auth.schemas import AuthenticatedAgent
from app.events.emit import emit
from app.models.approval import ApprovalRequest
from app.models.enums import ApprovalStatus, SSEEventType

if TYPE_CHECKING:
    import uuid

    from sqlalchemy.ext.asyncio import AsyncSession

    from app.auth.dependencies import AuthContext


async def create_approval(
    db: AsyncSession,
    org_id: uuid.UUID,
    agent_id: uuid.UUID,
    action_type: str,
    entity_type: str,
    entity_id: uuid.UUID,
    risk_level: int,
    autonomy_level: int,
    payload: dict[str, object],
) -> ApprovalRequest:
    # Idempotency: check for existing pending request
    existing = await db.execute(
        select(ApprovalRequest).where(
            ApprovalRequest.org_id == org_id,
            ApprovalRequest.requested_by == agent_id,
            ApprovalRequest.action_type == action_type,
            ApprovalRequest.entity_id == entity_id,
            ApprovalRequest.status == ApprovalStatus.PENDING.value,
        )
    )
    if found := existing.scalar_one_or_none():
        return found

    approval = ApprovalRequest(
        org_id=org_id,
        requested_by=agent_id,
        action_type=action_type,
        entity_type=entity_type,
        entity_id=entity_id,
        risk_level=risk_level,
        autonomy_level=autonomy_level,
        payload=payload,
        status=ApprovalStatus.PENDING.value,
        expires_at=pendulum.now("UTC").add(hours=24),
    )
    db.add(approval)
    try:
        await db.flush()
    except Exception:
        # TOCTOU race — concurrent request created the same approval
        await db.rollback()
        existing = await db.execute(
            select(ApprovalRequest).where(
                ApprovalRequest.org_id == org_id,
                ApprovalRequest.requested_by == agent_id,
                ApprovalRequest.action_type == action_type,
                ApprovalRequest.entity_id == entity_id,
                ApprovalRequest.status == ApprovalStatus.PENDING.value,
            )
        )
        if found := existing.scalar_one_or_none():
            return found
        raise
    await db.refresh(approval)

    await emit(
        db=db,
        type=SSEEventType.APPROVAL_REQUESTED,
        org_id=org_id,
        actor_id=agent_id,
        entity_type="approval",
        entity_id=approval.id,
        data={
            "action_type": action_type,
            "entity_type": entity_type,
            "entity_id": str(entity_id),
            "risk_level": risk_level,
            "autonomy_level": autonomy_level,
        },
    )
    return approval


async def list_approvals(
    db: AsyncSession,
    org_id: uuid.UUID,
    approval_status: str | None = None,
    action_type: str | None = None,
    page: int = 1,
    limit: int = 50,
) -> tuple[list[ApprovalRequest], int]:
    q = select(ApprovalRequest).where(ApprovalRequest.org_id == org_id)

    if approval_status:
        q = q.where(ApprovalRequest.status == approval_status)
    if action_type:
        q = q.where(ApprovalRequest.action_type == action_type)

    # Filter out expired pending approvals
    now = pendulum.now("UTC")
    q = q.where(
        (ApprovalRequest.status != ApprovalStatus.PENDING.value)
        | (ApprovalRequest.expires_at.is_(None))
        | (ApprovalRequest.expires_at > now)
    )

    total = await db.scalar(select(func.count()).select_from(q.subquery())) or 0
    offset = (page - 1) * limit
    result = await db.execute(
        q.order_by(ApprovalRequest.created_at.desc()).offset(offset).limit(limit)
    )
    return list(result.scalars().all()), total


async def get_approval(
    db: AsyncSession, org_id: uuid.UUID, approval_id: uuid.UUID
) -> ApprovalRequest:
    result = await db.execute(
        select(ApprovalRequest).where(
            ApprovalRequest.id == approval_id,
            ApprovalRequest.org_id == org_id,
        )
    )
    approval = result.scalar_one_or_none()
    if not approval:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval not found")
    return approval


async def respond_to_approval(
    db: AsyncSession,
    auth: AuthContext,
    approval_id: uuid.UUID,
    decision: str,
    notes: str | None = None,
) -> ApprovalRequest:
    approval = await get_approval(db, auth.org_id, approval_id)

    if approval.status != ApprovalStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Approval is {approval.status}, not pending",
        )

    # Self-approval prevention
    if approval.requested_by == auth.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot approve your own request",
        )

    # Agent authority check: level >= requester.level + level_delta, or parent
    if isinstance(auth, AuthenticatedAgent):
        from app.models.agent import Agent
        from app.models.organization import Organization

        requester = await db.get(Agent, approval.requested_by)
        is_parent = requester is not None and requester.parent_id == auth.id
        requester_level = requester.level if requester else 0

        # Load configurable level_delta from org settings (default: 2)
        org = await db.get(Organization, auth.org_id)
        org_settings = (org.settings if org else None) or {}
        approver_cfg = org_settings.get("approver_authority", {})
        level_delta: int = approver_cfg.get("level_delta", 2) if isinstance(approver_cfg, dict) else 2
        required_level = requester_level + level_delta

        has_level = auth.level >= required_level
        if not (is_parent or has_level):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient level to approve (need level >= {required_level} or be parent agent)",
            )

    now = pendulum.now("UTC")
    approval.status = decision
    approval.resolved_by = auth.id
    approval.resolved_at = now
    approval.notes = notes

    await emit(
        db=db,
        type=SSEEventType.APPROVAL_RESOLVED,
        org_id=auth.org_id,
        actor_id=auth.id,
        entity_type="approval",
        entity_id=approval.id,
        data={
            "action_type": approval.action_type,
            "entity_type": approval.entity_type,
            "entity_id": str(approval.entity_id),
            "decision": decision,
        },
    )
    return approval
