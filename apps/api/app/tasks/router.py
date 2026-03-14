from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

import app.tasks.service as service
from app.auth.dependencies import AuthContext, require_auth
from app.database import get_db
from app.models.enums import TaskStatus
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


# --- Core CRUD ---


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_task(
    dto: CreateTaskDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[TaskResponse]:
    task = await service.create_task(db, auth, dto)
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
    tasks, total = await service.list_tasks(
        db, auth, status_filter, assignee_id, creator_id, parent_task_id, page, limit
    )
    return PaginatedResponse(
        data=[TaskResponse.model_validate(t) for t in tasks],
        meta=PaginationMeta(total=total, page=page, limit=limit),
    )


@router.get("/{task_id}")
async def get_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[TaskResponse]:
    task = await service.get_task(db, auth, task_id)
    return DataResponse(data=TaskResponse.model_validate(task))


# --- Status transitions ---


@router.post("/{task_id}/transition")
async def transition_task(
    task_id: uuid.UUID,
    dto: TransitionTaskDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[TaskResponse]:
    task = await service.transition_task(db, auth, task_id, dto)
    return DataResponse(data=TaskResponse.model_validate(task))


@router.post("/{task_id}/approve")
async def approve_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[TaskResponse]:
    task = await service.approve_task(db, auth, task_id)
    return DataMessageResponse(data=TaskResponse.model_validate(task), message="Task approved")


@router.post("/{task_id}/assign")
async def assign_task(
    task_id: uuid.UUID,
    dto: AssignTaskDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[TaskResponse]:
    task = await service.assign_task(db, auth, task_id, dto)
    return DataResponse(data=TaskResponse.model_validate(task))


# --- Dependencies ---


@router.post("/{task_id}/dependencies", status_code=status.HTTP_201_CREATED)
async def add_dependency(
    task_id: uuid.UUID,
    dto: AddDependencyDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[TaskDependencyResponse]:
    dep = await service.add_dependency(db, auth, task_id, dto)
    return DataResponse(data=TaskDependencyResponse.model_validate(dep))


@router.delete("/{task_id}/dependencies/{dep_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_dependency(
    task_id: uuid.UUID,
    dep_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> None:
    await service.remove_dependency(db, auth, task_id, dep_id)


# --- Comments ---


@router.post("/{task_id}/comments", status_code=status.HTTP_201_CREATED)
async def add_comment(
    task_id: uuid.UUID,
    dto: AddCommentDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[TaskCommentResponse]:
    comment = await service.add_comment(db, auth, task_id, dto)
    return DataResponse(data=TaskCommentResponse.model_validate(comment))


@router.get("/{task_id}/comments")
async def list_comments(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[TaskCommentResponse]]:
    comments = await service.list_comments(db, auth, task_id)
    return DataResponse(data=[TaskCommentResponse.model_validate(c) for c in comments])


# --- Escalations ---


@router.post("/{task_id}/escalate", status_code=status.HTTP_201_CREATED)
async def escalate_task(
    task_id: uuid.UUID,
    dto: EscalateTaskDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[EscalationResponse]:
    escalation = await service.escalate_task(db, auth, task_id, dto)
    return DataResponse(data=EscalationResponse.model_validate(escalation))


@router.get("/{task_id}/escalations")
async def get_task_escalations(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[EscalationResponse]]:
    escalations = await service.get_task_escalations(db, auth, task_id)
    return DataResponse(data=[EscalationResponse.model_validate(e) for e in escalations])


@router.get("/escalations/open")
async def list_open_escalations(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[EscalationResponse]]:
    escalations = await service.list_open_escalations(db, auth)
    return DataResponse(data=[EscalationResponse.model_validate(e) for e in escalations])


@router.post("/escalations/{escalation_id}/resolve")
async def resolve_escalation(
    escalation_id: uuid.UUID,
    dto: ResolveEscalationDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[EscalationResponse]:
    escalation = await service.resolve_escalation(db, auth, escalation_id, dto)
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
    consensus = await service.create_consensus(db, auth, dto)
    return DataResponse(data=ConsensusRequestResponse.model_validate(consensus))


@router.get("/consensus/pending")
async def get_pending_consensus(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[ConsensusRequestResponse]]:
    items = await service.get_pending_consensus(db, auth)
    return DataResponse(data=[ConsensusRequestResponse.model_validate(c) for c in items])


@router.get("/consensus/{request_id}")
async def get_consensus(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[ConsensusRequestResponse]:
    consensus = await service.get_consensus(db, auth, request_id)
    return DataResponse(data=ConsensusRequestResponse.model_validate(consensus))


@router.post("/consensus/{request_id}/vote")
async def cast_vote(
    request_id: uuid.UUID,
    dto: CastVoteDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[ConsensusVoteResponse]:
    vote = await service.cast_vote(db, auth, request_id, dto)
    return DataMessageResponse(data=ConsensusVoteResponse.model_validate(vote), message="Vote cast")


@router.delete("/consensus/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_consensus(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> None:
    await service.cancel_consensus(db, auth, request_id)
