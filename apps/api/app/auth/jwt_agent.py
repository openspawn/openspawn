"""Agent JWT token issuance and validation.

Agents exchange HMAC credentials for short-lived JWTs, avoiding the overhead
of per-request HMAC computation and nonce tracking.
"""

from __future__ import annotations

import os
import uuid
from typing import Any

import jwt
import pendulum
from fastapi import HTTPException, status

from app.auth.schemas import AuthenticatedAgent

# ---------------------------------------------------------------------------
# Scope constants derived from agent level
# ---------------------------------------------------------------------------

_BASE_SCOPES = ["read:channels", "read:tasks"]
_MID_SCOPES = _BASE_SCOPES + ["write:messages", "transition:task"]
_HIGH_SCOPES = _MID_SCOPES + ["create:task", "spawn:agent", "manage:credits"]
_ALL_SCOPES = ["*"]

AGENT_JWT_TTL_MINUTES = 15
AGENT_JWT_ALGORITHM = "HS256"


def _get_agent_jwt_secret() -> str:
    secret = os.environ.get("AUTH_JWT_SECRET")
    if not secret:
        raise RuntimeError("AUTH_JWT_SECRET not configured")
    return secret


def scopes_for_level(level: int) -> list[str]:
    """Return the scope list for a given agent level (1-10)."""
    if level >= 10:
        return list(_ALL_SCOPES)
    if level >= 7:
        return list(_HIGH_SCOPES)
    if level >= 4:
        return list(_MID_SCOPES)
    return list(_BASE_SCOPES)


def create_agent_token(agent: AuthenticatedAgent) -> str:
    """Create a signed JWT for an authenticated agent."""
    secret = _get_agent_jwt_secret()
    now = pendulum.now("UTC")
    expire = now.add(minutes=AGENT_JWT_TTL_MINUTES)

    payload: dict[str, Any] = {
        "sub": str(agent.agent_id),
        "agent_uuid": str(agent.id),
        "org_id": str(agent.org_id),
        "level": agent.level,
        "role": agent.role,
        "mode": agent.mode,
        "scopes": scopes_for_level(agent.level),
        "state": "active",
        "token_type": "agent",
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }

    return jwt.encode(payload, secret, algorithm=AGENT_JWT_ALGORITHM)


def decode_agent_token(token: str) -> dict[str, Any]:
    """Decode and validate an agent JWT. Raises HTTPException on failure."""
    secret = _get_agent_jwt_secret()

    try:
        payload: dict[str, Any] = jwt.decode(token, secret, algorithms=[AGENT_JWT_ALGORITHM])
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Agent token expired",
        ) from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid agent token",
        ) from exc

    if payload.get("token_type") != "agent":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid agent token",
        )

    return payload


def authenticated_agent_from_jwt(payload: dict[str, Any]) -> AuthenticatedAgent:
    """Build an AuthenticatedAgent from decoded JWT claims."""
    return AuthenticatedAgent(
        id=uuid.UUID(str(payload["agent_uuid"])),
        org_id=uuid.UUID(str(payload["org_id"])),
        agent_id=str(payload["sub"]),
        name="",  # not stored in JWT -- lightweight claim set
        role=str(payload["role"]),
        mode=str(payload["mode"]),
        level=int(payload["level"]),
    )
