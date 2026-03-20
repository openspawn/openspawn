"""Middleware to track API calls per user in hosted mode."""

from __future__ import annotations

from typing import TYPE_CHECKING

import structlog
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from app.config import get_settings

if TYPE_CHECKING:
    from starlette.requests import Request
    from starlette.responses import Response

logger = structlog.stdlib.get_logger()


class UsageTrackingMiddleware(BaseHTTPMiddleware):
    """Increment API call counter for authenticated users in hosted mode.

    Runs after auth — extracts user_id from request state (set by auth
    dependency) and bumps the counter in a fire-and-forget manner.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)

        if not get_settings().hosted_mode:
            return response

        # Only track successful API calls (non-health, non-docs)
        if request.url.path in ("/health", "/health/db", "/docs", "/redoc", "/openapi.json"):
            return response

        # Extract user from auth header (if API key was used)
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer osp_") and response.status_code < 400:
            try:
                await _increment_usage(auth_header[7:])
            except Exception:
                # Don't fail requests over usage tracking
                await logger.awarning("usage_tracking_failed", path=request.url.path)

        return response


async def _increment_usage(api_key: str) -> None:
    """Increment the call counter for the user who owns this API key."""
    import hashlib

    import pendulum
    from sqlalchemy import select

    from app.database import async_session
    from app.models.auth import ApiKey
    from app.models.usage import UsageCounter

    key_hash = hashlib.sha256(api_key.encode("utf-8")).hexdigest()

    async with async_session() as db:
        # Find the user
        result = await db.execute(
            select(ApiKey.user_id).where(ApiKey.key_hash == key_hash, ApiKey.revoked_at.is_(None))
        )
        row = result.first()
        if not row:
            return

        user_id = row[0]

        # Upsert usage counter
        existing = await db.execute(
            select(UsageCounter).where(UsageCounter.user_id == user_id)
        )
        counter = existing.scalar_one_or_none()

        if counter:
            counter.call_count += 1
            counter.last_call_at = pendulum.now("UTC")
        else:
            counter = UsageCounter(
                user_id=user_id,
                call_count=1,
                last_call_at=pendulum.now("UTC"),
            )
            db.add(counter)

        await db.commit()
