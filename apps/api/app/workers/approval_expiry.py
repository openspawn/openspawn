"""Auto-expire pending approval requests past their expires_at timestamp."""

from __future__ import annotations

import structlog
from sqlalchemy import select, update

from app.database import async_session
from app.models.approval import ApprovalRequest
from app.models.enums import ApprovalStatus, SSEEventType
from app.models.event import Event

logger = structlog.get_logger()


async def expire_approvals(ctx: dict) -> int:
    """Set status='expired' on pending approvals past expires_at, emit events."""
    from sqlalchemy import func

    async with async_session() as session:
        # Find pending approvals that have expired
        expired_q = (
            select(ApprovalRequest)
            .where(
                ApprovalRequest.status == ApprovalStatus.PENDING.value,
                ApprovalRequest.expires_at.is_not(None),
                ApprovalRequest.expires_at < func.now(),
            )
        )
        result = await session.execute(expired_q)
        expired_rows = list(result.scalars().all())

        if not expired_rows:
            logger.info("expire_approvals.done", expired=0)
            return 0

        # Bulk update status
        ids = [r.id for r in expired_rows]
        await session.execute(
            update(ApprovalRequest)
            .where(ApprovalRequest.id.in_(ids))
            .values(status=ApprovalStatus.EXPIRED.value)
        )

        # Emit individual SSE events per expired approval
        import pendulum

        now = pendulum.now("UTC")
        for row in expired_rows:
            event = Event(
                org_id=row.org_id,
                type=SSEEventType.APPROVAL_RESOLVED.value,
                actor_id=row.requested_by,
                entity_type="approval",
                entity_id=row.id,
                data={
                    "action_type": row.action_type,
                    "entity_type": row.entity_type,
                    "entity_id": str(row.entity_id),
                    "decision": ApprovalStatus.EXPIRED.value,
                },
                severity="info",
                created_at=now,
            )
            session.add(event)

        await session.commit()
        logger.info("expire_approvals.done", expired=len(ids))
        return len(ids)
