"""Auth middleware - configurable authentication based on auth mode."""

from __future__ import annotations

import hashlib
import secrets
import uuid
from typing import ClassVar

import bcrypt
import jwt
import pendulum
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.schemas import AuthenticatedUser
from app.config import AuthMode, get_settings
from app.database import get_db
from app.models.auth import RefreshToken, User


class LocalTokenStore:
    """In-memory store for local mode bearer tokens.

    In local mode, we issue a bearer token on login and need to verify it
    on subsequent requests. This simple store keeps active tokens in memory.
    Tokens are lost on restart (user must re-login), which is acceptable
    for the single-user local mode.
    """

    _tokens: ClassVar[set[str]] = set()

    @classmethod
    def add(cls, token_hash: str) -> None:
        cls._tokens.add(token_hash)

    @classmethod
    def verify(cls, token_hash: str) -> bool:
        return token_hash in cls._tokens

    @classmethod
    def remove(cls, token_hash: str) -> None:
        cls._tokens.discard(token_hash)

    @classmethod
    def clear(cls) -> None:
        cls._tokens.clear()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a bcrypt hash."""
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def hash_password(password: str) -> str:
    """Hash a password with bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def create_access_token(user_id: uuid.UUID, org_id: uuid.UUID, email: str, role: str) -> str:
    """Create a JWT access token."""
    cfg = get_settings()
    if not cfg.auth.jwt_secret:
        raise RuntimeError("JWT_SECRET not configured")

    now = pendulum.now("UTC")
    expire = now.add(minutes=cfg.auth.access_token_ttl_minutes)

    payload = {
        "sub": str(user_id),
        "org_id": str(org_id),
        "email": email,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }

    return jwt.encode(payload, cfg.auth.jwt_secret, algorithm=cfg.auth.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, str | int]:
    """Decode and validate a JWT access token."""
    cfg = get_settings()
    if not cfg.auth.jwt_secret:
        raise RuntimeError("JWT_SECRET not configured")

    try:
        payload: dict[str, str | int] = jwt.decode(
            token, cfg.auth.jwt_secret, algorithms=[cfg.auth.jwt_algorithm]
        )
        return payload
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Access token expired"
        ) from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token"
        ) from exc


async def create_refresh_token(
    user_id: uuid.UUID,
    db: AsyncSession,
    user_agent: str | None = None,
    ip_address: str | None = None,
) -> str:
    """Create a refresh token and store it in the database."""
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()

    cfg = get_settings()
    expires_at = pendulum.now("UTC").add(days=cfg.auth.refresh_token_ttl_days)

    refresh_token = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
        user_agent=user_agent,
        ip_address=ip_address,
    )

    db.add(refresh_token)
    await db.flush()

    return token


async def verify_refresh_token(token: str, db: AsyncSession) -> User:
    """Verify a refresh token and return the associated user."""
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()

    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked_at.is_(None),
        )
    )
    refresh_token = result.scalar_one_or_none()

    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    if pendulum.now("UTC") > pendulum.instance(refresh_token.expires_at):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired"
        )

    result = await db.execute(select(User).where(User.id == refresh_token.user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user


async def revoke_refresh_token(token: str, db: AsyncSession) -> None:
    """Revoke a refresh token."""
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()

    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked_at.is_(None),
        )
    )
    refresh_token = result.scalar_one_or_none()

    if refresh_token:
        refresh_token.revoked_at = pendulum.now("UTC")
        await db.flush()


_OWNER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
_OWNER_ORG_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


def _get_owner_auth_context() -> AuthenticatedUser:
    """Return a synthetic owner AuthContext for auth.mode=none."""
    return AuthenticatedUser(
        id=_OWNER_ID,
        org_id=_OWNER_ORG_ID,
        email="owner@local",
        name="Owner",
        role="owner",
        scopes=["*"],
        is_api_key=False,
    )


async def _authenticate_local(token: str) -> AuthenticatedUser:
    """Authenticate using local mode bearer token."""
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()

    if not LocalTokenStore.verify(token_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    return _get_owner_auth_context()


async def _authenticate_full(token: str, db: AsyncSession) -> AuthenticatedUser:
    """Authenticate using full JWT mode."""
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


async def get_auth_context(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> AuthenticatedUser:
    """
    Main auth dependency. Returns AuthenticatedUser based on auth mode.

    - mode=none: returns synthetic owner, no checks
    - mode=local: verifies bearer token against in-memory store
    - mode=full: verifies JWT access token

    Note: Agent HMAC auth and API key auth are handled separately by
    require_auth() in app/auth/dependencies.py. This dependency is for
    user-facing endpoints (dashboard login flow).
    """
    cfg = get_settings()
    auth_mode = cfg.auth.mode

    if auth_mode == AuthMode.NONE:
        return _get_owner_auth_context()

    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )

    token = auth_header[7:]  # Strip "Bearer " prefix

    if auth_mode == AuthMode.LOCAL:
        return await _authenticate_local(token)

    if auth_mode == AuthMode.FULL:
        return await _authenticate_full(token, db)

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"Unknown auth mode: {auth_mode}",
    )
