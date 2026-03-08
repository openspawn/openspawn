from __future__ import annotations

import uuid

import pendulum
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import AuthContext, require_auth
from app.auth.schemas import AuthenticatedAgent
from app.database import get_db
from app.models.agent import Agent
from app.models.consensus import ConsensusRequest, ConsensusVote
from app.models.enums import ConsensusStatus, TaskStatus
from app.models.escalation import Escalation
from app.models.organization import Organization
from app.models.task import Task, TaskComment, TaskDependency, TaskTag
from app.schemas import DataMessageResponse, DataResponse, PaginatedResponse, PaginationMeta
from app.tasks.schemas import (
    AddCommentDto,
    AddDependencyDto,
    AssignTaskDto,
    CastVoteDto,
    ConsensusRequestResponse,
    ConsensusVoteResponse,
    CreateConsensusDto,
    CreateTaskDto,
    EscalateTaskDto,
    EscalationResponse,
    ResolveEscalationDto,
    TaskCommentResponse,
    TaskDependencyResponse,
    TaskResponse,
    TransitionTaskDto,
)

router = APIRouter(prefix="/tasks", tags=["tasks"])

# Valid status transitions
VALID_TRANSITIONS: dict[str, list[str]] = {
    TaskStatus.BACKLOG.value: [TaskStatus.TODO.value, TaskStatus.CANCELLED.value],
    TaskStatus.TODO.value: [
        TaskStatus.IN_PROGRESS.value,
        TaskStatus.BACKLOG.value,
        TaskStatus.CANCELLED.value,
    ],
    TaskStatus.IN_PROGRESS.value: [
        TaskStatus.REVIEW.value,
        TaskStatus.BLOCKED.value,
        TaskStatus.CANCELLED.value,
    ],
    TaskStatus.REVIEW.value: [
        TaskStatus.DONE.value,
        TaskStatus.IN_PROGRESS.value,
        TaskStatus.CANCELLED.value,
    ],
    TaskStatus.BLOCKED.value: [TaskStatus.TODO.value, TaskStatus.CANCELLED.value],
    TaskStatus.DONE.value: [TaskStatus.IN_PROGRESS.value],
    TaskStatus.CANCELLED.value: [TaskStatus.BACKLOG.value],
}


# --- Core CRUD ---


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_task(
    dto: CreateTaskDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[TaskResponse]:
    # Generate identifier
    org = await db.get(Organization, auth.org_id)
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    identifier = f"{org.task_prefix}-{org.next_task_number}"
    org.next_task_number += 1

    creator_id = auth.id

    task = Task(
        org_id=auth.org_id,
        identifier=identifier,
        title=dto.title,
        description=dto.description,
        status=TaskStatus.BACKLOG.value,
        priority=dto.priority.value,
        assignee_id=dto.assignee_id,
        creator_id=creator_id,
        parent_task_id=dto.parent_task_id,
        approval_required=dto.approval_required,
        due_date=dto.due_at,
        metadata_=dto.metadata,
        required_capabilities=dto.required_capabilities,
    )
    db.add(task)
    await db.flush()

    # Add tags
    for tag_str in dto.tags:
        db.add(TaskTag(org_id=auth.org_id, task_id=task.id, tag=tag_str))

    await db.commit()
    await db.refresh(task)
    return DataResponse(data=TaskResponse.model_validate(task))


@router.get("")
async def list_tasks(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
    status_filter: TaskStatus | None = Query(None, alias="status"),
    assignee_id: uuid.UUID | None = None,
    creator_id: uuid.UUID | None = None,
    parent_task_id: uuid.UUID | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, le=200),
) -> PaginatedResponse[TaskResponse]:
    q = select(Task).where(Task.org_id == auth.org_id, Task.deleted_at.is_(None))
    if status_filter:
        q = q.where(Task.status == status_filter.value)
    if assignee_id:
        q = q.where(Task.assignee_id == assignee_id)
    if creator_id:
        q = q.where(Task.creator_id == creator_id)
    if parent_task_id:
        q = q.where(Task.parent_task_id == parent_task_id)

    total = await db.scalar(select(func.count()).select_from(q.subquery())) or 0
    offset = (page - 1) * limit
    result = await db.execute(q.order_by(Task.created_at.desc()).offset(offset).limit(limit))
    tasks = [TaskResponse.model_validate(t) for t in result.scalars().all()]
    return PaginatedResponse(data=tasks, meta=PaginationMeta(total=total, page=page, limit=limit))


@router.get("/{task_id}")
async def get_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[TaskResponse]:
    task = await _get_task_or_404(db, task_id, auth.org_id)
    return DataResponse(data=TaskResponse.model_validate(task))


# --- Status transitions ---


@router.post("/{task_id}/transition")
async def transition_task(
    task_id: uuid.UUID,
    dto: TransitionTaskDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[TaskResponse]:
    task = await _get_task_or_404(db, task_id, auth.org_id)

    valid = VALID_TRANSITIONS.get(task.status, [])
    if dto.status.value not in valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from {task.status} to {dto.status.value}",
        )

    # Check approval requirement
    if dto.status == TaskStatus.DONE and task.approval_required and not task.approved_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task requires approval before completion",
        )

    task.status = dto.status.value

    if dto.status == TaskStatus.DONE:
        task.completed_at = pendulum.now("UTC")

    await db.commit()
    await db.refresh(task)
    return DataResponse(data=TaskResponse.model_validate(task))


@router.post("/{task_id}/approve")
async def approve_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[TaskResponse]:
    task = await _get_task_or_404(db, task_id, auth.org_id)
    if not task.approval_required:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Task does not require approval"
        )
    if task.approved_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Task already approved")

    approver_name = auth.agent_id if isinstance(auth, AuthenticatedAgent) else auth.name
    task.approved_by = approver_name
    task.approved_at = pendulum.now("UTC")
    await db.commit()
    await db.refresh(task)
    return DataMessageResponse(data=TaskResponse.model_validate(task), message="Task approved")


@router.post("/{task_id}/assign")
async def assign_task(
    task_id: uuid.UUID,
    dto: AssignTaskDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[TaskResponse]:
    task = await _get_task_or_404(db, task_id, auth.org_id)

    # Validate assignee exists in org
    assignee = await db.execute(
        select(Agent).where(Agent.id == dto.assignee_id, Agent.org_id == auth.org_id)
    )
    if not assignee.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignee not found")

    task.assignee_id = dto.assignee_id
    await db.commit()
    await db.refresh(task)
    return DataResponse(data=TaskResponse.model_validate(task))


# --- Dependencies ---


@router.post("/{task_id}/dependencies", status_code=status.HTTP_201_CREATED)
async def add_dependency(
    task_id: uuid.UUID,
    dto: AddDependencyDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[TaskDependencyResponse]:
    task = await _get_task_or_404(db, task_id, auth.org_id)
    dep_task = await _get_task_or_404(db, dto.depends_on_id, auth.org_id)

    if task_id == dto.depends_on_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Task cannot depend on itself"
        )

    # Check duplicate
    existing = await db.execute(
        select(TaskDependency).where(
            TaskDependency.task_id == task_id,
            TaskDependency.depends_on_id == dto.depends_on_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Dependency already exists"
        )

    dep = TaskDependency(
        org_id=auth.org_id,
        task_id=task.id,
        depends_on_id=dep_task.id,
        blocking=dto.blocking,
    )
    db.add(dep)
    await db.commit()
    await db.refresh(dep)
    return DataResponse(data=TaskDependencyResponse.model_validate(dep))


@router.delete("/{task_id}/dependencies/{dep_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_dependency(
    task_id: uuid.UUID,
    dep_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> None:
    result = await db.execute(
        select(TaskDependency).where(
            TaskDependency.id == dep_id,
            TaskDependency.task_id == task_id,
            TaskDependency.org_id == auth.org_id,
        )
    )
    dep = result.scalar_one_or_none()
    if not dep:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dependency not found")
    await db.delete(dep)
    await db.commit()


# --- Comments ---


@router.post("/{task_id}/comments", status_code=status.HTTP_201_CREATED)
async def add_comment(
    task_id: uuid.UUID,
    dto: AddCommentDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[TaskCommentResponse]:
    await _get_task_or_404(db, task_id, auth.org_id)

    comment = TaskComment(
        org_id=auth.org_id,
        task_id=task_id,
        author_id=auth.id,
        body=dto.body,
        parent_comment_id=dto.parent_comment_id,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return DataResponse(data=TaskCommentResponse.model_validate(comment))


@router.get("/{task_id}/comments")
async def list_comments(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[TaskCommentResponse]]:
    await _get_task_or_404(db, task_id, auth.org_id)
    result = await db.execute(
        select(TaskComment)
        .where(TaskComment.task_id == task_id, TaskComment.org_id == auth.org_id)
        .order_by(TaskComment.created_at)
    )
    return DataResponse(
        data=[TaskCommentResponse.model_validate(c) for c in result.scalars().all()]
    )


# --- Escalations ---


@router.post("/{task_id}/escalate", status_code=status.HTTP_201_CREATED)
async def escalate_task(
    task_id: uuid.UUID,
    dto: EscalateTaskDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[EscalationResponse]:
    if not isinstance(auth, AuthenticatedAgent):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Agent authentication required"
        )

    task = await _get_task_or_404(db, task_id, auth.org_id)

    # Find escalation target (parent agent or higher-level agent)
    from_agent = await db.get(Agent, auth.id)
    if not from_agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")

    to_agent_id = from_agent.parent_id
    if not to_agent_id:
        # Find any agent with higher level
        result = await db.execute(
            select(Agent)
            .where(
                Agent.org_id == auth.org_id,
                Agent.level > from_agent.level,
                Agent.status == "active",
            )
            .order_by(Agent.level)
            .limit(1)
        )
        higher = result.scalar_one_or_none()
        if not higher:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No escalation target available",
            )
        to_agent_id = higher.id

    escalation = Escalation(
        org_id=auth.org_id,
        task_id=task.id,
        from_agent_id=auth.id,
        to_agent_id=to_agent_id,
        reason=dto.reason.value,
        notes=dto.notes,
        is_automatic=False,
    )
    db.add(escalation)
    await db.commit()
    await db.refresh(escalation)
    return DataResponse(data=EscalationResponse.model_validate(escalation))


@router.get("/{task_id}/escalations")
async def get_task_escalations(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[EscalationResponse]]:
    await _get_task_or_404(db, task_id, auth.org_id)
    result = await db.execute(
        select(Escalation)
        .where(Escalation.task_id == task_id, Escalation.org_id == auth.org_id)
        .order_by(Escalation.created_at.desc())
    )
    return DataResponse(data=[EscalationResponse.model_validate(e) for e in result.scalars().all()])


@router.get("/escalations/open")
async def list_open_escalations(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[EscalationResponse]]:
    result = await db.execute(
        select(Escalation)
        .where(Escalation.org_id == auth.org_id, Escalation.resolved_at.is_(None))
        .order_by(Escalation.created_at.desc())
    )
    return DataResponse(data=[EscalationResponse.model_validate(e) for e in result.scalars().all()])


@router.post("/escalations/{escalation_id}/resolve")
async def resolve_escalation(
    escalation_id: uuid.UUID,
    dto: ResolveEscalationDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[EscalationResponse]:
    result = await db.execute(
        select(Escalation).where(Escalation.id == escalation_id, Escalation.org_id == auth.org_id)
    )
    escalation = result.scalar_one_or_none()
    if not escalation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Escalation not found")
    if escalation.resolved_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Escalation already resolved"
        )

    escalation.resolved_at = pendulum.now("UTC")
    if dto.notes:
        escalation.notes = dto.notes
    await db.commit()
    await db.refresh(escalation)
    return DataMessageResponse(
        data=EscalationResponse.model_validate(escalation), message="Escalation resolved"
    )


# --- Consensus ---


@router.post("/consensus", status_code=status.HTTP_201_CREATED)
async def create_consensus(
    dto: CreateConsensusDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[ConsensusRequestResponse]:
    if not isinstance(auth, AuthenticatedAgent):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Agent authentication required"
        )

    expires_at = pendulum.now("UTC").add(hours=dto.expires_in_hours)

    consensus = ConsensusRequest(
        org_id=auth.org_id,
        type=dto.type.value,
        status=ConsensusStatus.PENDING.value,
        title=dto.title,
        description=dto.description,
        requester_id=auth.id,
        subject_id=dto.subject_id,
        subject_type=dto.subject_type,
        quorum_required=dto.quorum_required,
        approval_threshold=dto.approval_threshold,
        expires_at=expires_at,
    )
    db.add(consensus)
    await db.commit()
    await db.refresh(consensus)
    return DataResponse(data=ConsensusRequestResponse.model_validate(consensus))


@router.get("/consensus/pending")
async def get_pending_consensus(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[ConsensusRequestResponse]]:
    result = await db.execute(
        select(ConsensusRequest).where(
            ConsensusRequest.org_id == auth.org_id,
            ConsensusRequest.status == ConsensusStatus.PENDING.value,
        )
    )
    return DataResponse(
        data=[ConsensusRequestResponse.model_validate(c) for c in result.scalars().all()]
    )


@router.get("/consensus/{request_id}")
async def get_consensus(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[ConsensusRequestResponse]:
    result = await db.execute(
        select(ConsensusRequest).where(
            ConsensusRequest.id == request_id, ConsensusRequest.org_id == auth.org_id
        )
    )
    consensus = result.scalar_one_or_none()
    if not consensus:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Consensus request not found"
        )
    return DataResponse(data=ConsensusRequestResponse.model_validate(consensus))


@router.post("/consensus/{request_id}/vote")
async def cast_vote(
    request_id: uuid.UUID,
    dto: CastVoteDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[ConsensusVoteResponse]:
    if not isinstance(auth, AuthenticatedAgent):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Agent authentication required"
        )

    result = await db.execute(
        select(ConsensusRequest).where(
            ConsensusRequest.id == request_id, ConsensusRequest.org_id == auth.org_id
        )
    )
    consensus = result.scalar_one_or_none()
    if not consensus:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Consensus request not found"
        )
    if consensus.status != ConsensusStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Consensus request is not pending"
        )

    # Check for duplicate vote
    existing = await db.execute(
        select(ConsensusVote).where(
            ConsensusVote.request_id == request_id, ConsensusVote.voter_id == auth.id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already voted")

    vote = ConsensusVote(
        org_id=auth.org_id,
        request_id=request_id,
        voter_id=auth.id,
        vote=dto.vote.value,
        reason=dto.reason,
        voter_level=auth.level,
    )
    db.add(vote)

    # Update vote counts
    if dto.vote.value == "APPROVE":
        consensus.votes_approve += 1
    elif dto.vote.value == "REJECT":
        consensus.votes_reject += 1
    else:
        consensus.votes_abstain += 1

    # Check if quorum reached and decide
    total_votes = consensus.votes_approve + consensus.votes_reject + consensus.votes_abstain
    if total_votes >= consensus.quorum_required:
        total_decisive = consensus.votes_approve + consensus.votes_reject
        if total_decisive > 0:
            approval_pct = consensus.votes_approve / total_decisive * 100
            if approval_pct >= consensus.approval_threshold:
                consensus.status = ConsensusStatus.APPROVED.value
            else:
                consensus.status = ConsensusStatus.REJECTED.value
            consensus.decided_at = pendulum.now("UTC")

    await db.commit()
    await db.refresh(vote)
    return DataMessageResponse(data=ConsensusVoteResponse.model_validate(vote), message="Vote cast")


@router.delete("/consensus/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_consensus(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> None:
    result = await db.execute(
        select(ConsensusRequest).where(
            ConsensusRequest.id == request_id, ConsensusRequest.org_id == auth.org_id
        )
    )
    consensus = result.scalar_one_or_none()
    if not consensus:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Consensus request not found"
        )
    if consensus.status != ConsensusStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Can only cancel pending requests"
        )

    consensus.status = ConsensusStatus.CANCELLED.value
    consensus.decided_at = pendulum.now("UTC")
    await db.commit()


# --- Helpers ---


async def _get_task_or_404(db: AsyncSession, task_id: uuid.UUID, org_id: uuid.UUID) -> Task:
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.org_id == org_id, Task.deleted_at.is_(None))
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task
