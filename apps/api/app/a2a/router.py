"""A2A REST router — endpoints for agent-to-agent communication."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.a2a import service
from app.a2a.types import (
    A2AAgentCard,
    A2ACompleteRequest,
    A2ASendRequest,
    A2ATask,
)
from app.auth.dependencies import AuthContext, require_auth
from app.auth.schemas import AuthenticatedAgent
from app.database import get_db

router = APIRouter(prefix="/a2a", tags=["a2a"])


def _get_agent_id(auth: AuthContext) -> str:
    """Extract agent_id string from auth context."""
    if isinstance(auth, AuthenticatedAgent):
        return auth.agent_id
    # For user/API key auth, use a sentinel
    return "__owner__"


# --- Send message ---


@router.post("/send", response_model=A2ATask)
async def send_message(
    body: A2ASendRequest,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> A2ATask:
    """Create a task from an A2A message, assign to target agent."""
    return await service.send_message(
        db=db,
        sender_id=body.senderId,
        target_agent_id=body.agentId,
        message=body.message,
        context_id=body.contextId,
        org_id=auth.org_id,
    )


# --- List my tasks ---


@router.get("/tasks/mine", response_model=list[A2ATask])
async def get_my_tasks(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
    status: str | None = Query(None, description="Filter by OpenSpawn task status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> list[A2ATask]:
    """List A2A tasks assigned to the authenticated agent."""
    agent_id = _get_agent_id(auth)
    return await service.get_my_tasks(
        db=db,
        agent_id=agent_id,
        status_filter=status,
        limit=limit,
        offset=offset,
        org_id=auth.org_id,
    )


# --- Get task ---


@router.get("/tasks/{task_id}", response_model=A2ATask)
async def get_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> A2ATask:
    """Get a task with its A2A messages."""
    return await service.get_task(db=db, task_id=task_id, org_id=auth.org_id)


# --- Complete task ---


@router.post("/tasks/{task_id}/complete", response_model=A2ATask)
async def complete_task(
    task_id: uuid.UUID,
    body: A2ACompleteRequest,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> A2ATask:
    """Report task completion — must be the assigned agent."""
    return await service.complete_task(
        db=db,
        task_id=task_id,
        agent_id=body.agentId,
        completion_status=body.status,
        result=body.result,
        org_id=auth.org_id,
    )


# --- Claim task ---


@router.post("/tasks/{task_id}/claim", response_model=A2ATask)
async def claim_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> A2ATask:
    """Claim an unassigned A2A task."""
    agent_id = _get_agent_id(auth)
    return await service.claim_task(
        db=db, task_id=task_id, agent_id=agent_id, org_id=auth.org_id
    )


# --- Heartbeat ---


@router.post("/agents/heartbeat")
async def agent_heartbeat(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> dict:
    """Update agent's last_heartbeat timestamp."""
    agent_id = _get_agent_id(auth)
    await service.heartbeat(db=db, agent_id=agent_id, org_id=auth.org_id)
    return {"ok": True}


# --- Discovery (mounted at app level) ---


def get_agent_card_router() -> APIRouter:
    """Returns a router for /.well-known/agent.json, mount at app root."""
    card_router = APIRouter()

    @card_router.get("/.well-known/agent.json", response_model=A2AAgentCard)
    async def agent_card() -> A2AAgentCard:
        return A2AAgentCard()

    return card_router
