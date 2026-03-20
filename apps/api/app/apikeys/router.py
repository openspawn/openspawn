"""Router for hosted API — registration, login, whoami, usage."""

from __future__ import annotations

from typing import TYPE_CHECKING

from fastapi import APIRouter, Depends, HTTPException, status

from app.apikeys.schemas import (
    HostedLoginRequest,
    HostedLoginResponse,
    RegisterRequest,
    RegisterResponse,
    UsageResponse,
    WhoAmIResponse,
)
from app.apikeys.service import get_usage, login_user, register_user
from app.auth.dependencies import get_current_user
from app.config import get_settings
from app.database import get_db

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

    from app.auth.schemas import AuthenticatedUser

router = APIRouter(prefix="/auth", tags=["hosted"])


def _require_hosted_mode() -> None:
    """Raise 404 if hosted mode is disabled (self-hosted)."""
    if not get_settings().hosted_mode:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not available in self-hosted mode",
        )


@router.post("/register", response_model=RegisterResponse)
async def register(
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> RegisterResponse:
    """Create account and return API key. Only available in hosted mode."""
    _require_hosted_mode()

    user, org, api_key = await register_user(
        email=body.email,
        password=body.password,
        name=body.name,
        db=db,
    )
    await db.commit()

    return RegisterResponse(
        user_id=user.id,
        org_id=org.id,
        api_key=api_key,
    )


@router.post("/hosted-login", response_model=HostedLoginResponse)
async def hosted_login(
    body: HostedLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> HostedLoginResponse:
    """Login with email/password and get an API key. Only available in hosted mode."""
    _require_hosted_mode()

    user, api_key = await login_user(
        email=body.email,
        password=body.password,
        db=db,
    )
    await db.commit()

    return HostedLoginResponse(
        api_key=api_key,
        user_id=user.id,
        org_id=user.org_id,
    )


@router.get("/whoami", response_model=WhoAmIResponse)
async def whoami(
    user: AuthenticatedUser = Depends(get_current_user),
) -> WhoAmIResponse:
    """Return current user info from API key. Works in all modes."""
    return WhoAmIResponse(
        user_id=user.id,
        org_id=user.org_id,
        email=user.email,
        name=user.name,
        role=user.role,
    )


@router.get("/usage", response_model=UsageResponse)
async def usage(
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UsageResponse:
    """Return usage stats for the current user."""
    stats = await get_usage(user.id, db)
    return UsageResponse(**stats)
