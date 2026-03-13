"""SSE streaming endpoint + short-lived token issuer.

GET /events/stream — Server-Sent Events stream (auth via query param token)
POST /events/token — Issue a short-lived JWT for SSE connection
"""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

import jwt
import pendulum
import structlog
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from fastapi.sse import EventSourceResponse, ServerSentEvent
from sqlalchemy import select

from app.auth.dependencies import AuthContext, require_auth
from app.config import AuthMode, get_settings
from app.database import get_db
from app.events.bus import event_bus
from app.events.schemas import SSEEvent, SSETokenResponse
from app.models.event import Event
from app.schemas import DataResponse

if TYPE_CHECKING:
    from collections.abc import AsyncIterable

    from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.stdlib.get_logger()

router = APIRouter(prefix="/events", tags=["events-sse"])

_SSE_TOKEN_TTL_SECONDS = 300  # 5 minutes
_REPLAY_MAX_EVENTS = 1000
_REPLAY_MAX_AGE_SECONDS = 3600  # 1 hour


@router.post("/token")
async def create_sse_token(
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[SSETokenResponse]:
    """Issue a short-lived JWT for SSE stream authentication.

    EventSource API cannot set custom headers, so agents use this token
    as a query parameter on GET /events/stream.
    """
    cfg = get_settings()
    secret = cfg.auth.jwt_secret
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="JWT_SECRET not configured — SSE tokens unavailable",
        )

    now = pendulum.now("UTC")
    payload = {
        "sub": str(auth.id),
        "org_id": str(auth.org_id),
        "purpose": "sse",
        "iat": int(now.timestamp()),
        "exp": int(now.add(seconds=_SSE_TOKEN_TTL_SECONDS).timestamp()),
    }
    token = jwt.encode(payload, secret, algorithm=cfg.auth.jwt_algorithm)
    return DataResponse(data=SSETokenResponse(token=token, expires_in=_SSE_TOKEN_TTL_SECONDS))


def _validate_sse_token(token: str) -> tuple[uuid.UUID, uuid.UUID]:
    """Validate an SSE JWT and return (user/agent id, org_id).

    Raises HTTPException on invalid/expired token.
    """
    cfg = get_settings()

    # auth.mode=none — accept any token value, return owner context
    if cfg.auth.mode == AuthMode.NONE:
        owner_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
        return owner_id, owner_id

    secret = cfg.auth.jwt_secret
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="JWT_SECRET not configured",
        )

    # API key auth not yet supported for SSE — use POST /events/token instead
    if token.startswith("osp_"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="API keys cannot be used directly for SSE. Use POST /events/token first.",
        )

    try:
        decoded: dict[str, str | int] = jwt.decode(
            token, secret, algorithms=[cfg.auth.jwt_algorithm]
        )
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="SSE token expired — request a new one via POST /events/token",
        ) from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid SSE token",
        ) from exc

    if decoded.get("purpose") != "sse":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is not an SSE token",
        )

    return uuid.UUID(str(decoded["sub"])), uuid.UUID(str(decoded["org_id"]))


@router.get("/stream", response_class=EventSourceResponse)
async def event_stream(
    token: str = Query(..., description="SSE JWT from POST /events/token"),
    last_event_id: int | None = Header(None, alias="Last-Event-ID"),
    db: AsyncSession = Depends(get_db),
) -> AsyncIterable[ServerSentEvent]:
    """Server-Sent Events stream.

    Authenticate via query param `token` (short-lived JWT from POST /events/token).
    Supports reconnection via Last-Event-ID header — replays missed events from DB.
    """
    subscriber_id, org_id = _validate_sse_token(token)
    sub_key = str(subscriber_id)

    await logger.ainfo("sse_connected", subscriber=sub_key, org_id=str(org_id))

    async def _generate() -> AsyncIterable[ServerSentEvent]:
        try:
            # Replay missed events on reconnection
            if last_event_id is not None:
                async for sse in _replay_missed(db, org_id, last_event_id):
                    yield sse

            # Stream live events
            async for event in event_bus.subscribe(sub_key):
                # Filter to subscriber's org
                if event.org_id != org_id:
                    continue
                yield ServerSentEvent(
                    data=event.model_dump_json(),
                    event=event.type,
                    id=str(event.sequence),
                )
        finally:
            await event_bus.disconnect(sub_key)
            await logger.ainfo("sse_disconnected", subscriber=sub_key)

    return EventSourceResponse(_generate())  # type: ignore[return-value]


async def _replay_missed(
    db: AsyncSession,
    org_id: uuid.UUID,
    last_sequence: int,
) -> AsyncIterable[ServerSentEvent]:
    """Replay events from DB that the client missed during disconnection.

    Uses created_at ordering since sequence is in-memory and resets on restart.
    Falls back to replaying recent events within the replay window.
    """
    cutoff = pendulum.now("UTC").subtract(seconds=_REPLAY_MAX_AGE_SECONDS)

    result = await db.execute(
        select(Event)
        .where(Event.org_id == org_id, Event.created_at >= cutoff)
        .order_by(Event.created_at.asc())
        .limit(_REPLAY_MAX_EVENTS)
    )
    events = result.scalars().all()

    for i, event in enumerate(events):
        yield ServerSentEvent(
            data=SSEEvent(
                sequence=last_sequence + i + 1,
                type=event.type,
                org_id=event.org_id,
                actor_id=event.actor_id,
                entity_type=event.entity_type,
                entity_id=event.entity_id,
                data=event.data,
                created_at=event.created_at,
            ).model_dump_json(),
            event=event.type,
            id=str(last_sequence + i + 1),
        )
