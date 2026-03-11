"""Auth router - login, refresh, logout, user info, OAuth stub."""

from __future__ import annotations

import hashlib
import secrets
import uuid  # noqa: TC003 — Pydantic needs uuid.UUID at runtime for model fields
from typing import TYPE_CHECKING

import pyotp
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select

from app.auth.hmac import decrypt_secret, get_encryption_key
from app.auth.middleware import (
    LocalTokenStore,
    create_access_token,
    create_refresh_token,
    get_auth_context,
    revoke_refresh_token,
    verify_password,
    verify_refresh_token,
)
from app.config import AuthMode, get_settings
from app.database import get_db
from app.models.auth import User

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

    from app.auth.schemas import AuthenticatedUser

router = APIRouter(prefix="/auth", tags=["auth"])


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------


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


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("/login", response_model=LoginResponse)
async def login(
    body: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> LoginResponse:
    """
    Authenticate user and return access + refresh tokens.

    Behavior varies by auth mode:
    - mode=none: returns static owner token, any credentials accepted
    - mode=local: validates password against config hash, returns bearer token
    - mode=full: validates credentials against User DB, optional TOTP, returns JWT
    """
    cfg = get_settings()
    auth_mode = cfg.auth.mode

    # Mode: none — accept anything, return static token
    if auth_mode == AuthMode.NONE:
        static_token = "owner-static-token-local-dev"
        return LoginResponse(
            access_token=static_token,
            refresh_token=static_token,
        )

    # Mode: local — single password, bearer token
    if auth_mode == AuthMode.LOCAL:
        if not cfg.auth.local_password_hash:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Local auth not configured — set AUTH_LOCAL_PASSWORD_HASH",
            )

        if not verify_password(body.password, cfg.auth.local_password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        # Generate a bearer token and store its hash for verification
        bearer_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(bearer_token.encode("utf-8")).hexdigest()
        LocalTokenStore.add(token_hash)

        return LoginResponse(
            access_token=bearer_token,
            refresh_token=bearer_token,
        )

    # Mode: full — JWT flow
    if auth_mode == AuthMode.FULL:
        result = await db.execute(select(User).where(User.email == body.email))
        user = result.scalar_one_or_none()

        if not user or not user.password_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        if not verify_password(body.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        # TOTP check
        if user.totp_enabled:
            if not body.totp_code:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="TOTP code required",
                )

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

        # Issue tokens
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

    In full mode, implements token rotation (old refresh token revoked).
    """
    cfg = get_settings()
    auth_mode = cfg.auth.mode

    if auth_mode == AuthMode.NONE:
        static_token = "owner-static-token-local-dev"
        return RefreshResponse(
            access_token=static_token,
            refresh_token=static_token,
        )

    if auth_mode == AuthMode.LOCAL:
        # In local mode, refresh just returns the same token (no rotation)
        return RefreshResponse(
            access_token=body.refresh_token,
            refresh_token=body.refresh_token,
        )

    if auth_mode == AuthMode.FULL:
        user = await verify_refresh_token(body.refresh_token, db)

        access_token = create_access_token(user.id, user.org_id, user.email, user.role)

        user_agent = request.headers.get("user-agent")
        client_ip = request.client.host if request.client else None
        new_refresh_token = await create_refresh_token(user.id, db, user_agent, client_ip)

        # Token rotation — revoke old
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
    cfg = get_settings()
    auth_mode = cfg.auth.mode

    if auth_mode == AuthMode.NONE:
        return

    if auth_mode == AuthMode.LOCAL:
        # Remove local bearer token from store
        token_hash = hashlib.sha256(body.refresh_token.encode("utf-8")).hexdigest()
        LocalTokenStore.remove(token_hash)
        return

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
    cfg = get_settings()
    auth_mode = cfg.auth.mode

    if auth_mode in (AuthMode.NONE, AuthMode.LOCAL):
        return UserInfoResponse(
            id=auth.id,
            org_id=auth.org_id,
            email=auth.email,
            name=auth.name,
            role=auth.role,
            totp_enabled=False,
        )

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
    """Google OAuth login — stub for Phase 2."""
    return {"detail": "Google OAuth not implemented yet (Phase 2)"}
