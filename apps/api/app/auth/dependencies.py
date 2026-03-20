from __future__ import annotations

import uuid

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.hmac import (
    compute_signature,
    decrypt_secret,
    get_encryption_key,
    secure_compare,
    validate_timestamp,
)
from app.auth.middleware import _get_owner_auth_context, decode_access_token
from app.auth.schemas import AuthenticatedAgent, AuthenticatedUser
from app.config import AuthMode, get_settings
from app.database import get_db
from app.models.agent import Agent
from app.models.auth import ApiKey, Nonce, User
from app.models.enums import AgentStatus

type AuthContext = AuthenticatedAgent | AuthenticatedUser


def _try_agent_jwt(token: str) -> AuthenticatedAgent | None:
    """Attempt to decode *token* as an agent JWT.

    Returns AuthenticatedAgent on success, None if the token is not
    an agent JWT (so the caller can fall through to user JWT logic).
    Raises HTTPException only for *expired* agent tokens (clear signal).
    """
    try:
        from app.auth.jwt_agent import authenticated_agent_from_jwt, decode_agent_token

        payload = decode_agent_token(token)
        return authenticated_agent_from_jwt(payload)
    except HTTPException as exc:
        # If it is an expired agent token, surface immediately
        if "expired" in str(exc.detail).lower():
            raise
        # Otherwise it is not an agent token -- fall through
        return None


async def _authenticate_hmac(
    request: Request,
    db: AsyncSession,
) -> AuthenticatedAgent:
    agent_id = request.headers.get("x-agent-id")
    timestamp = request.headers.get("x-timestamp")
    nonce_val = request.headers.get("x-nonce")
    signature = request.headers.get("x-signature")

    if not all([agent_id, timestamp, nonce_val, signature]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing auth headers: x-agent-id, x-timestamp, x-nonce, x-signature required",
        )

    assert timestamp is not None
    assert nonce_val is not None
    assert signature is not None
    assert agent_id is not None

    try:
        validate_timestamp(timestamp)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e)) from e

    result = await db.execute(select(Agent).where(Agent.agent_id == agent_id))
    agent = result.scalar_one_or_none()

    if not agent:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if agent.status != AgentStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Agent is not active")

    encryption_key = get_encryption_key()
    plaintext_secret = decrypt_secret(agent.hmac_secret_enc, encryption_key)

    body = ""
    if request.method not in ("GET", "DELETE"):
        body_bytes = await request.body()
        body = body_bytes.decode("utf-8") if body_bytes else ""

    message = f"{request.method}{request.url.path}{timestamp}{nonce_val}{body}"
    expected_signature = compute_signature(plaintext_secret, message)

    if not secure_compare(signature, expected_signature):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    nonce_obj = Nonce(
        nonce=nonce_val,
        agent_id=agent.id,
        expires_at=None,  # type: ignore[arg-type]
    )
    try:
        db.add(nonce_obj)
        await db.flush()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Nonce already used"
        ) from exc

    return AuthenticatedAgent(
        id=agent.id,
        org_id=agent.org_id,
        agent_id=agent.agent_id,
        name=agent.name,
        role=agent.role,
        mode=agent.mode,
        level=agent.level,
    )


async def _authenticate_api_key(
    key: str,
    db: AsyncSession,
) -> AuthenticatedUser:
    import hashlib

    key_hash = hashlib.sha256(key.encode("utf-8")).hexdigest()
    result = await db.execute(
        select(ApiKey).where(ApiKey.key_hash == key_hash, ApiKey.revoked_at.is_(None))
    )
    api_key = result.scalar_one_or_none()

    if not api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")

    if api_key.expires_at is not None:
        import pendulum

        if pendulum.now("UTC") > pendulum.instance(api_key.expires_at):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="API key expired")

    return AuthenticatedUser(
        id=api_key.user_id,
        org_id=api_key.org_id,
        email="",
        name=api_key.name,
        role="api_key",
        scopes=[str(s) for s in api_key.scopes],
        is_api_key=True,
    )


async def _authenticate_jwt(
    token: str,
    db: AsyncSession,
) -> AuthenticatedUser:
    """Authenticate a JWT bearer token (full auth mode)."""
    payload = decode_access_token(token)

    user_id = uuid.UUID(str(payload["sub"]))
    org_id = uuid.UUID(str(payload["org_id"]))

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return AuthenticatedUser(
        id=user_id,
        org_id=org_id,
        email=str(payload["email"]),
        name=user.name,
        role=str(payload["role"]),
        scopes=[],
        is_api_key=False,
    )


async def require_auth(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> AuthContext:
    """
    Main auth dependency used by all resource routers.

    Respects auth.mode:
    - mode=none: returns synthetic owner, no checks
    - mode=local/full: checks HMAC, API key, or JWT bearer token
    """
    cfg = get_settings()

    # mode=none — skip all auth, return owner context
    if cfg.auth.mode == AuthMode.NONE:
        return _get_owner_auth_context()

    auth_header = request.headers.get("authorization")

    # API key auth (Bearer osp_...)
    if auth_header and auth_header.startswith("Bearer osp_"):
        key = auth_header[7:]
        return await _authenticate_api_key(key, db)

    # HMAC agent auth
    if request.headers.get("x-agent-id") or request.headers.get("x-signature"):
        return await _authenticate_hmac(request, db)

    # Bearer token -- try agent JWT first, then user JWT / local token
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:]

        # Attempt agent JWT (token_type=agent claim distinguishes it)
        agent_ctx = _try_agent_jwt(token)
        if agent_ctx is not None:
            return agent_ctx

        if cfg.auth.mode == AuthMode.FULL:
            return await _authenticate_jwt(token, db)
        # local mode -- accept any valid local token via middleware
        from app.auth.middleware import _authenticate_local

        return await _authenticate_local(token)

    # No valid auth
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Auth required. Provide Bearer osp_... API key, HMAC agent headers, or Bearer JWT.",
    )


async def get_current_agent(
    auth: AuthContext = Depends(require_auth),
) -> AuthenticatedAgent:
    if not isinstance(auth, AuthenticatedAgent):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Agent authentication required",
        )
    return auth


async def get_current_user(
    auth: AuthContext = Depends(require_auth),
) -> AuthenticatedUser:
    if not isinstance(auth, AuthenticatedUser):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User authentication required",
        )
    return auth
