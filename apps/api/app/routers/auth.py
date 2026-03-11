"""Auth router - login, refresh, logout, user info, OAuth stub."""

from __future__ import annotations

import hashlib
import secrets
import uuid

import pyotp
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.hmac import decrypt_secret, get_encryption_key
from app.auth.middleware import (
    create_access_token,
    create_refresh_token,
    get_auth_context,
    revoke_refresh_token,
    verify_password,
    verify_refresh_token,
)
from app.auth.schemas import AuthenticatedUser
from app.config import AuthMode, settings
from app.database import get_db
from app.models.auth import User

router = APIRouter(prefix="/auth", tags=["auth"])


# Request/Response Models


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    totp_code: str | None = None


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class RefreshResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LogoutRequest(BaseModel):
    refresh_token: str


class UserInfoResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    email: str
    name: str
    role: str
    totp_enabled: bool = False


# Endpoints


@router.post("/login", response_model=LoginResponse)
async def login(
    body: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> LoginResponse:
    """
    Authenticate user and return access + refresh tokens.

    Behavior varies by auth mode:
    - mode=none: returns static owner token
    - mode=local: validates password against config hash
    - mode=full: validates credentials against User DB, checks TOTP if enabled
    """
    auth_mode = settings.auth.mode

    # Mode: none - return static owner token
    if auth_mode == AuthMode.NONE:
        static_token = "owner-static-token-local-dev"
        return LoginResponse(
            access_token=static_token,
            refresh_token=static_token,
        )

    # Mode: local - single password validation
    if auth_mode == AuthMode.LOCAL:
        if not settings.auth.local_password_hash:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Local auth not configured",
            )

        # Verify password
        if not verify_password(body.password, settings.auth.local_password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        # Generate a static bearer token for local mode
        local_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(local_token.encode("utf-8")).hexdigest()

        # Store hash in-memory for this session (in production, store in config/DB)
        # For now, just return the token
        return LoginResponse(
            access_token=local_token,
            refresh_token=local_token,
        )

    # Mode: full - full JWT flow
    if auth_mode == AuthMode.FULL:
        # Look up user by email
        result = await db.execute(select(User).where(User.email == body.email))
        user = result.scalar_one_or_none()

        if not user or not user.password_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        # Verify password
        if not verify_password(body.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        # Check TOTP if enabled
        if user.totp_enabled:
            if not body.totp_code:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="TOTP code required",
                )

            # Decrypt TOTP secret and verify code
            if not user.totp_secret_enc:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="TOTP secret not configured",
                )

            encryption_key = get_encryption_key()
            totp_secret = decrypt_secret(user.totp_secret_enc, encryption_key)
            totp = pyotp.TOTP(totp_secret)

            if not totp.verify(body.totp_code, valid_window=1):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid TOTP code",
                )

        # Generate tokens
        access_token = create_access_token(user.id, user.org_id, user.email, user.role)

        user_agent = request.headers.get("user-agent")
        client_ip = request.client.host if request.client else None
        refresh_token = await create_refresh_token(user.id, db, user_agent, client_ip)

        await db.commit()

        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
        )

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"Unknown auth mode: {auth_mode}",
    )


@router.post("/refresh", response_model=RefreshResponse)
async def refresh(
    body: RefreshRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> RefreshResponse:
    """
    Exchange refresh token for new access + refresh tokens.

    Implements token rotation - old refresh token is revoked, new one issued.
    """
    auth_mode = settings.auth.mode

    # Mode: none - return static token
    if auth_mode == AuthMode.NONE:
        static_token = "owner-static-token-local-dev"
        return RefreshResponse(
            access_token=static_token,
            refresh_token=static_token,
        )

    # Mode: local - return same token (no rotation in local mode)
    if auth_mode == AuthMode.LOCAL:
        return RefreshResponse(
            access_token=body.refresh_token,
            refresh_token=body.refresh_token,
        )

    # Mode: full - verify refresh token and issue new tokens
    if auth_mode == AuthMode.FULL:
        user = await verify_refresh_token(body.refresh_token, db)

        # Generate new tokens
        access_token = create_access_token(user.id, user.org_id, user.email, user.role)

        user_agent = request.headers.get("user-agent")
        client_ip = request.client.host if request.client else None
        new_refresh_token = await create_refresh_token(user.id, db, user_agent, client_ip)

        # Revoke old refresh token (token rotation)
        await revoke_refresh_token(body.refresh_token, db)

        await db.commit()

        return RefreshResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
        )

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"Unknown auth mode: {auth_mode}",
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    body: LogoutRequest,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Revoke refresh token (logout)."""
    auth_mode = settings.auth.mode

    # Mode: none or local - no-op
    if auth_mode in (AuthMode.NONE, AuthMode.LOCAL):
        return

    # Mode: full - revoke refresh token
    if auth_mode == AuthMode.FULL:
        await revoke_refresh_token(body.refresh_token, db)
        await db.commit()
        return

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"Unknown auth mode: {auth_mode}",
    )


@router.get("/me", response_model=UserInfoResponse)
async def get_current_user_info(
    auth: AuthenticatedUser = Depends(get_auth_context),
    db: AsyncSession = Depends(get_db),
) -> UserInfoResponse:
    """Return current user profile from bearer token."""
    auth_mode = settings.auth.mode

    # Mode: none or local - return owner profile
    if auth_mode in (AuthMode.NONE, AuthMode.LOCAL):
        return UserInfoResponse(
            id=auth.id,
            org_id=auth.org_id,
            email=auth.email,
            name=auth.name,
            role=auth.role,
            totp_enabled=False,
        )

    # Mode: full - load user from DB to get full profile
    if auth_mode == AuthMode.FULL:
        result = await db.execute(select(User).where(User.id == auth.id))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )

        return UserInfoResponse(
            id=user.id,
            org_id=user.org_id,
            email=user.email,
            name=user.name,
            role=user.role,
            totp_enabled=user.totp_enabled,
        )

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"Unknown auth mode: {auth_mode}",
    )


@router.get("/google", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def google_oauth() -> dict[str, str]:
    """
    Google OAuth login - stub for Phase 2.

    Returns 501 Not Implemented.
    """
    return {"detail": "Google OAuth not implemented yet (Phase 2)"}
