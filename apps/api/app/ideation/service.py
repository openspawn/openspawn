"""Service layer for cooperative ideation flow (#669)."""

from __future__ import annotations

from typing import TYPE_CHECKING

import structlog
from fastapi import HTTPException, status
from sqlalchemy import select

from app.events.emit import emit
from app.models.enums import IdeationRole, IdeationStatus, SSEEventType
from app.models.ideation import IdeationBrief, IdeationSession

if TYPE_CHECKING:
    import uuid

    from sqlalchemy.ext.asyncio import AsyncSession

    from app.auth.dependencies import AuthContext

logger = structlog.stdlib.get_logger()

# Round labels for status transitions
_ROUND_STATUS = {
    1: IdeationStatus.ROUND1.value,
    2: IdeationStatus.ROUND2.value,
    3: IdeationStatus.AWAITING_SYNTHESIS.value,
}

# Default roles per round
_ROUND_ROLES = {
    1: IdeationRole.PROPOSER.value,
    2: IdeationRole.REVIEWER.value,
    3: IdeationRole.SYNTHESIZER.value,
}


async def start_ideation(
    db: AsyncSession,
    auth: AuthContext,
    task_id: uuid.UUID,
    participant_agent_ids: list[uuid.UUID] | None = None,
    autonomy_level: int = 5,
) -> IdeationSession:
    """Create a new ideation session. Auto-selects participants if not specified."""
    participants: list[str]

    if participant_agent_ids:
        participants = [str(pid) for pid in participant_agent_ids]
    else:
        # Auto-select: pick active agents in the org
        from app.models.agent import Agent

        result = await db.execute(
            select(Agent.id)
            .where(
                Agent.org_id == auth.org_id,
                Agent.status == "active",
            )
            .order_by(Agent.level.desc(), Agent.name)
            .limit(5)
        )
        agent_ids = list(result.scalars().all())
        if not agent_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active agents available for ideation",
            )
        participants = [str(aid) for aid in agent_ids]

    session = IdeationSession(
        org_id=auth.org_id,
        task_id=task_id,
        participants=participants,
        current_round=1,
        status=IdeationStatus.ROUND1.value,
        autonomy_level=autonomy_level,
    )
    db.add(session)
    await db.flush()
    await db.refresh(session)

    await emit(
        db=db,
        type=SSEEventType.IDEATION_STARTED,
        org_id=auth.org_id,
        actor_id=auth.id,
        entity_type="ideation_session",
        entity_id=session.id,
        data={
            "task_id": str(task_id),
            "participants": participants,
            "autonomy_level": autonomy_level,
        },
    )

    await logger.ainfo(
        "ideation_started",
        session_id=str(session.id),
        task_id=str(task_id),
        participant_count=len(participants),
    )
    return session


async def submit_brief(
    db: AsyncSession,
    auth: AuthContext,
    session_id: uuid.UUID,
    content: dict[str, object],
) -> IdeationBrief:
    """Submit a brief for the current round. Advances round when all participants have submitted."""
    session = await _get_session(db, auth.org_id, session_id)

    # Validate session is in an active round
    active_statuses = {
        IdeationStatus.ROUND1.value,
        IdeationStatus.ROUND2.value,
        IdeationStatus.AWAITING_SYNTHESIS.value,
    }
    if session.status not in active_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Session is {session.status}, not accepting briefs",
        )

    agent_id_str = str(auth.id)
    if agent_id_str not in session.participants:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Agent is not a participant in this ideation session",
        )

    # Check for duplicate submission in current round
    existing = await db.execute(
        select(IdeationBrief).where(
            IdeationBrief.session_id == session_id,
            IdeationBrief.agent_id == auth.id,
            IdeationBrief.round == session.current_round,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Already submitted brief for round {session.current_round}",
        )

    role = _ROUND_ROLES.get(session.current_round, IdeationRole.PROPOSER.value)

    brief = IdeationBrief(
        session_id=session_id,
        agent_id=auth.id,
        round=session.current_round,
        role=role,
        content=content,
    )
    db.add(brief)
    await db.flush()
    await db.refresh(brief)

    await emit(
        db=db,
        type=SSEEventType.IDEATION_BRIEF_SUBMITTED,
        org_id=auth.org_id,
        actor_id=auth.id,
        entity_type="ideation_brief",
        entity_id=brief.id,
        data={
            "session_id": str(session_id),
            "round": session.current_round,
            "role": role,
        },
    )

    # Check if all participants have submitted → advance round
    round_briefs = await db.execute(
        select(IdeationBrief).where(
            IdeationBrief.session_id == session_id,
            IdeationBrief.round == session.current_round,
        )
    )
    submitted_count = len(list(round_briefs.scalars().all()))

    if submitted_count == len(session.participants):
        await _advance_round(db, auth, session)

    await logger.ainfo(
        "ideation_brief_submitted",
        session_id=str(session_id),
        agent_id=str(auth.id),
        round=session.current_round,
    )
    return brief


async def _advance_round(
    db: AsyncSession,
    auth: AuthContext,
    session: IdeationSession,
) -> None:
    """Advance the session to the next round."""
    next_round = session.current_round + 1

    if next_round > 3:
        # All rounds complete — wait for synthesis
        return

    session.current_round = next_round
    new_status = _ROUND_STATUS.get(next_round, IdeationStatus.AWAITING_SYNTHESIS.value)
    session.status = new_status

    await emit(
        db=db,
        type=SSEEventType.IDEATION_ROUND_ADVANCED,
        org_id=auth.org_id,
        actor_id=auth.id,
        entity_type="ideation_session",
        entity_id=session.id,
        data={
            "new_round": next_round,
            "new_status": new_status,
        },
    )

    await logger.ainfo(
        "ideation_round_advanced",
        session_id=str(session.id),
        new_round=next_round,
    )


async def get_session_status(
    db: AsyncSession,
    org_id: uuid.UUID,
    session_id: uuid.UUID,
) -> IdeationSession:
    """Return session with all briefs."""
    return await _get_session(db, org_id, session_id)


async def synthesize(
    db: AsyncSession,
    auth: AuthContext,
    session_id: uuid.UUID,
    synthesis_content: dict[str, object],
) -> IdeationBrief:
    """Coordinator produces unified plan from all briefs (Round 3 / synthesis)."""
    session = await _get_session(db, auth.org_id, session_id)

    # Only the session owner / manager (level >= 7) can synthesize
    if auth.level < 7:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only manager agents (level >= 7) can synthesize ideation plans",
        )

    # Check if synthesis brief already exists (before status check for clearer error)
    existing = await db.execute(
        select(IdeationBrief).where(
            IdeationBrief.session_id == session_id,
            IdeationBrief.role == IdeationRole.SYNTHESIZER.value,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Synthesis has already been submitted",
        )

    # Allow synthesis when all round 2 reviews are in
    if session.status not in (
        IdeationStatus.ROUND2.value,
        IdeationStatus.AWAITING_SYNTHESIS.value,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Session is {session.status}, cannot synthesize yet",
        )

    brief = IdeationBrief(
        session_id=session_id,
        agent_id=auth.id,
        round=3,
        role=IdeationRole.SYNTHESIZER.value,
        content=synthesis_content,
    )
    db.add(brief)

    session.status = IdeationStatus.SYNTHESIZED.value
    session.current_round = 3

    await db.flush()
    await db.refresh(brief)

    await emit(
        db=db,
        type=SSEEventType.IDEATION_SYNTHESIZED,
        org_id=auth.org_id,
        actor_id=auth.id,
        entity_type="ideation_session",
        entity_id=session.id,
        data={
            "synthesizer_id": str(auth.id),
            "session_id": str(session_id),
        },
    )

    await logger.ainfo(
        "ideation_synthesized",
        session_id=str(session_id),
        synthesizer_id=str(auth.id),
    )
    return brief


async def approve_plan(
    db: AsyncSession,
    auth: AuthContext,
    session_id: uuid.UUID,
) -> IdeationSession:
    """Human approves the synthesized plan."""
    session = await _get_session(db, auth.org_id, session_id)

    # Only manager agents (level >= 7) can approve plans
    if auth.level < 7:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only manager agents (level >= 7) can approve ideation plans",
        )

    if session.status != IdeationStatus.SYNTHESIZED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Session is {session.status}, cannot approve (must be synthesized)",
        )

    # Verify synthesis brief exists
    synthesis = await db.execute(
        select(IdeationBrief).where(
            IdeationBrief.session_id == session_id,
            IdeationBrief.role == IdeationRole.SYNTHESIZER.value,
        )
    )
    if not synthesis.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No synthesis brief found — run synthesize first",
        )

    session.status = IdeationStatus.APPROVED.value
    await db.flush()
    await db.refresh(session)

    await emit(
        db=db,
        type=SSEEventType.IDEATION_APPROVED,
        org_id=auth.org_id,
        actor_id=auth.id,
        entity_type="ideation_session",
        entity_id=session.id,
        data={
            "task_id": str(session.task_id),
            "approved_by": str(auth.id),
        },
    )

    await logger.ainfo(
        "ideation_approved",
        session_id=str(session_id),
        approved_by=str(auth.id),
    )
    return session


async def list_briefs(
    db: AsyncSession,
    org_id: uuid.UUID,
    session_id: uuid.UUID,
    round_filter: int | None = None,
) -> list[IdeationBrief]:
    """List all briefs for a session, optionally filtered by round."""
    # Verify session exists and belongs to org
    await _get_session(db, org_id, session_id)

    q = select(IdeationBrief).where(IdeationBrief.session_id == session_id)
    if round_filter is not None:
        q = q.where(IdeationBrief.round == round_filter)
    q = q.order_by(IdeationBrief.round, IdeationBrief.created_at)

    result = await db.execute(q)
    return list(result.scalars().all())


async def _get_session(
    db: AsyncSession,
    org_id: uuid.UUID,
    session_id: uuid.UUID,
) -> IdeationSession:
    """Fetch session by id, scoped to org."""
    result = await db.execute(
        select(IdeationSession).where(
            IdeationSession.id == session_id,
            IdeationSession.org_id == org_id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ideation session not found",
        )
    return session
