"""Router for agent JWT token endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import _authenticate_hmac
from app.auth.jwt_agent import (
    AGENT_JWT_TTL_MINUTES,
    authenticated_agent_from_jwt,
    create_agent_token,
    decode_agent_token,
    scopes_for_level,
)
from app.database import get_db
from app.models.agent import Agent
from app.models.enums import AgentStatus

router = APIRouter(prefix="/auth/agent", tags=["agent-jwt"])


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------


class AgentTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    scopes: list[str]


# ---------------------------------------------------------------------------
# POST /auth/agent/token -- exchange HMAC creds for JWT
# ---------------------------------------------------------------------------


@router.post("/token", response_model=AgentTokenResponse)
async def issue_agent_token(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> AgentTokenResponse:
    """Exchange valid HMAC credentials for a short-lived agent JWT."""
    agent_ctx = await _authenticate_hmac(request, db)

    token = create_agent_token(agent_ctx)
    scopes = scopes_for_level(agent_ctx.level)

    return AgentTokenResponse(
        access_token=token,
        expires_in=AGENT_JWT_TTL_MINUTES * 60,
        scopes=scopes,
    )


# ---------------------------------------------------------------------------
# POST /auth/agent/refresh -- refresh an existing agent JWT
# ---------------------------------------------------------------------------


class RefreshRequest(BaseModel):
    token: str


@router.post("/refresh", response_model=AgentTokenResponse)
async def refresh_agent_token(
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db),
) -> AgentTokenResponse:
    """Refresh an agent JWT. Only ACTIVE agents may refresh."""
    payload = decode_agent_token(body.token)

    # Verify agent is still active in DB
    agent_id = payload["sub"]
    org_id = payload["org_id"]

    result = await db.execute(
        select(Agent).where(Agent.agent_id == agent_id, Agent.org_id == org_id)
    )
    agent = result.scalar_one_or_none()

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Agent not found",
        )

    if agent.status != AgentStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Agent is not active",
        )

    # Re-derive from current DB state (level/role may have changed)
    from app.auth.schemas import AuthenticatedAgent

    agent_ctx = AuthenticatedAgent(
        id=agent.id,
        org_id=agent.org_id,
        agent_id=agent.agent_id,
        name=agent.name,
        role=agent.role,
        mode=agent.mode,
        level=agent.level,
    )

    token = create_agent_token(agent_ctx)
    scopes = scopes_for_level(agent_ctx.level)

    return AgentTokenResponse(
        access_token=token,
        expires_in=AGENT_JWT_TTL_MINUTES * 60,
        scopes=scopes,
    )
