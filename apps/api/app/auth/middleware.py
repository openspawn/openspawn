"""Auth middleware - configurable authentication based on auth mode."""

from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timedelta

import jwt
import pendulum
from fastapi import Depends, HTTPException, Request, status
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.schemas import AuthenticatedUser
from app.config import AuthMode, settings
from app.database import get_db
from app.models.auth import RefreshToken, User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def create_access_token(user_id: uuid.UUID, org_id: uuid.UUID, email: str, role: str) -> str:
    """Create a JWT access token."""
    if not settings.auth.jwt_secret:
        raise RuntimeError("JWT_SECRET not configured")

    now = datetime.utcnow()
    expire = now + timedelta(minutes=settings.auth.access_token_ttl_minutes)

    payload = {
        "sub": str(user_id),
        "org_id": str(org_id),
        "email": email,
        "role": role,
        "iat": now,
        "exp": expire,
    }

    return jwt.encode(payload, settings.auth.jwt_secret, algorithm=settings.auth.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT access token."""
    if not settings.auth.jwt_secret:
        raise RuntimeError("JWT_SECRET not configured")

    try:
        return jwt.decode(
            token, settings.auth.jwt_secret, algorithms=[settings.auth.jwt_algorithm]
        )
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
    import secrets

    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()

    expires_at = pendulum.now("UTC").add(days=settings.auth.refresh_token_ttl_days)

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
            RefreshToken.token_hash == token_hash, RefreshToken.revoked_at.is_(None)
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

    # Load the user
    result = await db.execute(select(User).where(User.id == refresh_token.user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )

    return user


async def revoke_refresh_token(token: str, db: AsyncSession) -> None:
    """Revoke a refresh token."""
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()

    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash, RefreshToken.revoked_at.is_(None)
        )
    )
    refresh_token = result.scalar_one_or_none()

    if refresh_token:
        refresh_token.revoked_at = pendulum.now("UTC")
        await db.flush()


def _get_owner_auth_context() -> AuthenticatedUser:
    """Return a synthetic owner AuthContext for auth.mode=none."""
    return AuthenticatedUser(
        id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
        org_id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
        email="owner@local",
        name="Owner",
        role="owner",
        scopes=["*"],
        is_api_key=False,
    )


async def _authenticate_local(token: str) -> AuthenticatedUser:
    """Authenticate using local mode (single password + bearer token)."""
    if not settings.auth.local_password_hash:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Local auth not configured",
        )

    # In local mode, the "token" is just a static bearer token
    # We verify it matches the hash stored in config
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()

    if token_hash != settings.auth.local_password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    return _get_owner_auth_context()


async def _authenticate_full(token: str, db: AsyncSession) -> AuthenticatedUser:
    """Authenticate using full JWT mode."""
    payload = decode_access_token(token)

    user_id = uuid.UUID(payload["sub"])
    org_id = uuid.UUID(payload["org_id"])

    # Optionally verify user still exists in DB
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )

    return AuthenticatedUser(
        id=user_id,
        org_id=org_id,
        email=payload["email"],
        name=user.name,
        role=payload["role"],
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
    - mode=local: verifies bearer token against local password hash
    - mode=full: verifies JWT access token
    """
    auth_mode = settings.auth.mode

    # Mode: none - always return owner
    if auth_mode == AuthMode.NONE:
        return _get_owner_auth_context()

    # Extract token from Authorization header
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )

    token = auth_header[7:]  # Remove "Bearer " prefix

    # Mode: local
    if auth_mode == AuthMode.LOCAL:
        return await _authenticate_local(token)

    # Mode: full
    if auth_mode == AuthMode.FULL:
        return await _authenticate_full(token, db)

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"Unknown auth mode: {auth_mode}",
    )
