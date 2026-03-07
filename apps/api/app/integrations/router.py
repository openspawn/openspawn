from __future__ import annotations

import hashlib
import hmac
import uuid

import structlog
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import AuthContext, require_auth
from app.database import get_db
from app.integrations.schemas import (
    CreateGitHubConnectionDto,
    CreateLinearConnectionDto,
    GitHubConnectionResponse,
    IntegrationLinkResponse,
    LinearConnectionResponse,
    UpdateGitHubConnectionDto,
    UpdateLinearConnectionDto,
)
from app.models.integration import GitHubConnection, IntegrationLink, LinearConnection
from app.schemas import DataMessageResponse, DataResponse

logger = structlog.stdlib.get_logger()

router = APIRouter(prefix="/integrations", tags=["integrations"])


# ═══════════════════════════════════════════════
# GitHub Connections
# ═══════════════════════════════════════════════


@router.post("/github/connections", status_code=status.HTTP_201_CREATED)
async def create_github_connection(
    dto: CreateGitHubConnectionDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[GitHubConnectionResponse]:
    conn = GitHubConnection(
        org_id=auth.org_id,
        installation_id=dto.installation_id,
        name=dto.name,
        webhook_secret=dto.webhook_secret,
        repo_filter=dto.repo_filter,
        sync_config=dto.sync_config,
    )
    db.add(conn)
    await db.commit()
    await db.refresh(conn)
    return DataResponse(data=GitHubConnectionResponse.model_validate(conn))


@router.get("/github/connections")
async def list_github_connections(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[GitHubConnectionResponse]]:
    result = await db.execute(
        select(GitHubConnection).where(GitHubConnection.org_id == auth.org_id)
    )
    return DataResponse(
        data=[GitHubConnectionResponse.model_validate(c) for c in result.scalars().all()]
    )


@router.get("/github/connections/{conn_id}")
async def get_github_connection(
    conn_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[GitHubConnectionResponse]:
    conn = await _get_github_conn_or_404(db, conn_id, auth.org_id)
    return DataResponse(data=GitHubConnectionResponse.model_validate(conn))


@router.patch("/github/connections/{conn_id}")
async def update_github_connection(
    conn_id: uuid.UUID,
    dto: UpdateGitHubConnectionDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[GitHubConnectionResponse]:
    conn = await _get_github_conn_or_404(db, conn_id, auth.org_id)
    for field, value in dto.model_dump(exclude_unset=True).items():
        setattr(conn, field, value)
    await db.commit()
    await db.refresh(conn)
    return DataResponse(data=GitHubConnectionResponse.model_validate(conn))


@router.delete("/github/connections/{conn_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_github_connection(
    conn_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> None:
    conn = await _get_github_conn_or_404(db, conn_id, auth.org_id)
    await db.delete(conn)
    await db.commit()


@router.post("/github/connections/{conn_id}/test")
async def test_github_connection(
    conn_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[dict]:
    conn = await _get_github_conn_or_404(db, conn_id, auth.org_id)
    # Basic connectivity test — just verify the connection exists and is enabled
    return DataMessageResponse(
        data={"connection_id": str(conn.id), "enabled": conn.enabled},
        message="Connection test passed" if conn.enabled else "Connection is disabled",
    )


@router.get("/github/connections/{conn_id}/links")
async def get_github_links(
    conn_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[IntegrationLinkResponse]]:
    await _get_github_conn_or_404(db, conn_id, auth.org_id)
    result = await db.execute(
        select(IntegrationLink).where(
            IntegrationLink.org_id == auth.org_id, IntegrationLink.provider == "github"
        )
    )
    return DataResponse(
        data=[IntegrationLinkResponse.model_validate(link) for link in result.scalars().all()]
    )


# ═══════════════════════════════════════════════
# GitHub Webhook
# ═══════════════════════════════════════════════


@router.post("/github/webhook")
async def github_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> DataMessageResponse[dict]:
    signature = request.headers.get("x-hub-signature-256")
    event_type = request.headers.get("x-github-event", "")
    body = await request.body()

    if not signature:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing signature")

    # Find matching connection by verifying signature against all connections
    result = await db.execute(select(GitHubConnection).where(GitHubConnection.enabled.is_(True)))
    matched_conn = None
    for conn in result.scalars().all():
        expected = (
            "sha256=" + hmac.new(conn.webhook_secret.encode(), body, hashlib.sha256).hexdigest()
        )
        if hmac.compare_digest(signature, expected):
            matched_conn = conn
            break

    if not matched_conn:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid signature")

    await logger.ainfo(
        "github_webhook",
        event_type=event_type,
        connection_id=str(matched_conn.id),
    )

    # Handle event types
    if event_type == "ping":
        return DataMessageResponse(data={"event": "ping"}, message="pong")

    # For issues/PRs, create integration links or tasks
    # Full event processing is domain-specific and extensible
    return DataMessageResponse(
        data={"event": event_type, "connection_id": str(matched_conn.id)},
        message=f"Processed {event_type} event",
    )


# ═══════════════════════════════════════════════
# Linear Connections
# ═══════════════════════════════════════════════


@router.post("/linear/connections", status_code=status.HTTP_201_CREATED)
async def create_linear_connection(
    dto: CreateLinearConnectionDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[LinearConnectionResponse]:
    conn = LinearConnection(
        org_id=auth.org_id,
        team_id=dto.team_id,
        name=dto.name,
        webhook_secret=dto.webhook_secret,
        api_key=dto.api_key,
        team_filter=dto.team_filter,
        sync_config=dto.sync_config,
    )
    db.add(conn)
    await db.commit()
    await db.refresh(conn)
    return DataResponse(data=LinearConnectionResponse.model_validate(conn))


@router.get("/linear/connections")
async def list_linear_connections(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[LinearConnectionResponse]]:
    result = await db.execute(
        select(LinearConnection).where(LinearConnection.org_id == auth.org_id)
    )
    return DataResponse(
        data=[LinearConnectionResponse.model_validate(c) for c in result.scalars().all()]
    )


@router.get("/linear/connections/{conn_id}")
async def get_linear_connection(
    conn_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[LinearConnectionResponse]:
    conn = await _get_linear_conn_or_404(db, conn_id, auth.org_id)
    return DataResponse(data=LinearConnectionResponse.model_validate(conn))


@router.patch("/linear/connections/{conn_id}")
async def update_linear_connection(
    conn_id: uuid.UUID,
    dto: UpdateLinearConnectionDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[LinearConnectionResponse]:
    conn = await _get_linear_conn_or_404(db, conn_id, auth.org_id)
    for field, value in dto.model_dump(exclude_unset=True).items():
        setattr(conn, field, value)
    await db.commit()
    await db.refresh(conn)
    return DataResponse(data=LinearConnectionResponse.model_validate(conn))


@router.delete("/linear/connections/{conn_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_linear_connection(
    conn_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> None:
    conn = await _get_linear_conn_or_404(db, conn_id, auth.org_id)
    await db.delete(conn)
    await db.commit()


@router.post("/linear/connections/{conn_id}/test")
async def test_linear_connection(
    conn_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[dict]:
    conn = await _get_linear_conn_or_404(db, conn_id, auth.org_id)
    return DataMessageResponse(
        data={"connection_id": str(conn.id), "enabled": conn.enabled},
        message="Connection test passed" if conn.enabled else "Connection is disabled",
    )


@router.get("/linear/connections/{conn_id}/links")
async def get_linear_links(
    conn_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[IntegrationLinkResponse]]:
    await _get_linear_conn_or_404(db, conn_id, auth.org_id)
    result = await db.execute(
        select(IntegrationLink).where(
            IntegrationLink.org_id == auth.org_id, IntegrationLink.provider == "linear"
        )
    )
    return DataResponse(
        data=[IntegrationLinkResponse.model_validate(link) for link in result.scalars().all()]
    )


# ═══════════════════════════════════════════════
# Linear Webhook
# ═══════════════════════════════════════════════


@router.post("/linear/webhook")
async def linear_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> DataMessageResponse[dict]:
    signature = request.headers.get("linear-signature")
    body = await request.body()

    if not signature:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing signature")

    # Verify against all active Linear connections
    result = await db.execute(select(LinearConnection).where(LinearConnection.enabled.is_(True)))
    matched_conn = None
    for conn in result.scalars().all():
        expected = hmac.new(conn.webhook_secret.encode(), body, hashlib.sha256).hexdigest()
        if hmac.compare_digest(signature, expected):
            matched_conn = conn
            break

    if not matched_conn:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid signature")

    import json

    payload = json.loads(body)
    action = payload.get("action", "unknown")
    event_type = payload.get("type", "unknown")

    await logger.ainfo(
        "linear_webhook",
        event_type=event_type,
        action=action,
        connection=str(matched_conn.id),
    )

    return DataMessageResponse(
        data={"type": event_type, "action": action, "connection_id": str(matched_conn.id)},
        message=f"Processed {event_type}.{action} event",
    )


# ═══════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════


async def _get_github_conn_or_404(
    db: AsyncSession, conn_id: uuid.UUID, org_id: uuid.UUID
) -> GitHubConnection:
    result = await db.execute(
        select(GitHubConnection).where(
            GitHubConnection.id == conn_id, GitHubConnection.org_id == org_id
        )
    )
    conn = result.scalar_one_or_none()
    if not conn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="GitHub connection not found"
        )
    return conn


async def _get_linear_conn_or_404(
    db: AsyncSession, conn_id: uuid.UUID, org_id: uuid.UUID
) -> LinearConnection:
    result = await db.execute(
        select(LinearConnection).where(
            LinearConnection.id == conn_id, LinearConnection.org_id == org_id
        )
    )
    conn = result.scalar_one_or_none()
    if not conn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Linear connection not found"
        )
    return conn
