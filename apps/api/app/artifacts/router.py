from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.artifacts.schemas import (
    ArtifactResponse,
    PublishArtifactDto,
    SubscribeDto,
    SubscriptionResponse,
    UpdateStatusDto,
    compute_content_hash,
)
from app.auth.dependencies import AuthContext, require_auth
from app.database import get_db
from app.events.emit import emit
from app.models.artifact import Artifact, ArtifactSubscription
from app.models.enums import ArtifactStatus, ArtifactType, SSEEventType
from app.schemas import DataResponse, PaginatedResponse, PaginationMeta

router = APIRouter(prefix="/artifacts", tags=["artifacts"])

_CONTENT_TRUNCATE_BYTES = 100_000

VALID_STATUS_TRANSITIONS: dict[str, list[str]] = {
    ArtifactStatus.DRAFT.value: [ArtifactStatus.PUBLISHED.value, ArtifactStatus.SUPERSEDED.value],
    ArtifactStatus.PUBLISHED.value: [ArtifactStatus.SUPERSEDED.value],
}


async def _resolve_subscribers(
    db: AsyncSession, org_id: uuid.UUID, artifact_type: str, task_id: uuid.UUID
) -> list[str]:
    result = await db.execute(
        select(ArtifactSubscription).where(
            ArtifactSubscription.org_id == org_id,
            ArtifactSubscription.artifact_type.in_([artifact_type, "*"]),
            (ArtifactSubscription.task_id.is_(None)) | (ArtifactSubscription.task_id == task_id),
        )
    )
    return [str(s.agent_id) for s in result.scalars().all()]


async def _publish_one(
    db: AsyncSession,
    dto: PublishArtifactDto,
    org_id: uuid.UUID,
    producer_id: uuid.UUID,
) -> tuple[Artifact, bool]:
    """Publish a single artifact. Returns (artifact, is_new).

    If content_hash matches latest version, returns existing (is_new=False).
    """
    content_hash = compute_content_hash(dto.content)

    latest = await db.execute(
        select(Artifact)
        .where(
            Artifact.org_id == org_id,
            Artifact.name == dto.name,
            Artifact.status != ArtifactStatus.SUPERSEDED.value,
        )
        .order_by(Artifact.version.desc())
        .limit(1)
    )
    existing = latest.scalar_one_or_none()

    if existing and existing.content_hash == content_hash:
        return existing, False

    max_ver = await db.scalar(
        select(func.max(Artifact.version)).where(
            Artifact.org_id == org_id, Artifact.name == dto.name
        )
    )
    new_version = (max_ver or 0) + 1

    artifact = Artifact(
        org_id=org_id,
        task_id=dto.task_id,
        producer_agent_id=producer_id,
        artifact_type=dto.artifact_type.value,
        name=dto.name,
        version=new_version,
        status=ArtifactStatus.PUBLISHED.value,
        content=dto.content,
        content_hash=content_hash,
        metadata_=dto.metadata,
        source_artifact_ids=[str(sid) for sid in dto.source_artifact_ids],
    )
    db.add(artifact)
    await db.flush()

    if existing:
        existing.superseded_by_id = artifact.id
        existing.status = ArtifactStatus.SUPERSEDED.value

    return artifact, True


# --- Publish ---


@router.post("", status_code=status.HTTP_201_CREATED)
async def publish_artifact(
    dto: PublishArtifactDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[ArtifactResponse]:
    artifact, is_new = await _publish_one(db, dto, auth.org_id, auth.id)

    if is_new:
        targets = await _resolve_subscribers(db, auth.org_id, dto.artifact_type.value, dto.task_id)
        content_data = artifact.content
        content_truncated = False
        if len(str(content_data)) > _CONTENT_TRUNCATE_BYTES:
            content_data = {}
            content_truncated = True

        await emit(
            db=db,
            type=SSEEventType.ARTIFACT_PUBLISHED,
            org_id=auth.org_id,
            actor_id=auth.id,
            entity_type="artifact",
            entity_id=artifact.id,
            data={
                "artifact_type": artifact.artifact_type,
                "name": artifact.name,
                "version": artifact.version,
                "content": content_data,
                "content_hash": artifact.content_hash,
                "content_truncated": content_truncated,
                "producer_agent_id": str(artifact.producer_agent_id),
            },
            target_agents=targets if targets else None,
        )

    await db.commit()
    await db.refresh(artifact)
    return DataResponse(data=ArtifactResponse.model_validate(artifact))


@router.post("/batch", status_code=status.HTTP_201_CREATED)
async def publish_batch(
    dtos: list[PublishArtifactDto],
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[ArtifactResponse]]:
    results: list[Artifact] = []
    new_artifacts: list[dict[str, object]] = []

    for dto in dtos:
        artifact, is_new = await _publish_one(db, dto, auth.org_id, auth.id)
        results.append(artifact)
        if is_new:
            new_artifacts.append(
                {
                    "artifact_id": str(artifact.id),
                    "artifact_type": artifact.artifact_type,
                    "name": artifact.name,
                    "version": artifact.version,
                    "content_hash": artifact.content_hash,
                }
            )

    if new_artifacts:
        all_types = {str(a["artifact_type"]) for a in new_artifacts}
        all_task_ids = {dto.task_id for dto in dtos}
        targets: list[str] = []
        for t in all_types:
            for tid in all_task_ids:
                targets.extend(await _resolve_subscribers(db, auth.org_id, t, tid))
        targets = list(set(targets))

        await emit(
            db=db,
            type=SSEEventType.ARTIFACTS_BATCH_PUBLISHED,
            org_id=auth.org_id,
            actor_id=auth.id,
            entity_type="artifact",
            entity_id=results[0].id,
            data={"artifacts": new_artifacts, "count": len(new_artifacts)},
            target_agents=targets if targets else None,
        )

    await db.commit()
    for a in results:
        await db.refresh(a)
    return DataResponse(data=[ArtifactResponse.model_validate(a) for a in results])


# --- Read ---


@router.get("")
async def list_artifacts(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
    artifact_type: ArtifactType | None = None,
    name: str | None = None,
    task_id: uuid.UUID | None = None,
    status_filter: ArtifactStatus | None = Query(None, alias="status"),
    producer_agent_id: uuid.UUID | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, le=200),
) -> PaginatedResponse[ArtifactResponse]:
    q = select(Artifact).where(Artifact.org_id == auth.org_id)
    if artifact_type:
        q = q.where(Artifact.artifact_type == artifact_type.value)
    if name:
        q = q.where(Artifact.name == name)
    if task_id:
        q = q.where(Artifact.task_id == task_id)
    if status_filter:
        q = q.where(Artifact.status == status_filter.value)
    if producer_agent_id:
        q = q.where(Artifact.producer_agent_id == producer_agent_id)

    total = await db.scalar(select(func.count()).select_from(q.subquery())) or 0
    offset = (page - 1) * limit
    result = await db.execute(q.order_by(Artifact.created_at.desc()).offset(offset).limit(limit))
    artifacts = [ArtifactResponse.model_validate(a) for a in result.scalars().all()]
    return PaginatedResponse(
        data=artifacts, meta=PaginationMeta(total=total, page=page, limit=limit)
    )


@router.get("/latest")
async def get_latest_artifact(
    name: str = Query(...),
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[ArtifactResponse]:
    result = await db.execute(
        select(Artifact)
        .where(
            Artifact.org_id == auth.org_id,
            Artifact.name == name,
            Artifact.status == ArtifactStatus.PUBLISHED.value,
        )
        .order_by(Artifact.version.desc())
        .limit(1)
    )
    artifact = result.scalar_one_or_none()
    if not artifact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artifact not found")
    return DataResponse(data=ArtifactResponse.model_validate(artifact))


@router.get("/{artifact_id}")
async def get_artifact(
    artifact_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[ArtifactResponse]:
    result = await db.execute(
        select(Artifact).where(Artifact.id == artifact_id, Artifact.org_id == auth.org_id)
    )
    artifact = result.scalar_one_or_none()
    if not artifact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artifact not found")
    return DataResponse(data=ArtifactResponse.model_validate(artifact))


@router.get("/{artifact_id}/history")
async def get_artifact_history(
    artifact_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[ArtifactResponse]]:
    result = await db.execute(
        select(Artifact).where(Artifact.id == artifact_id, Artifact.org_id == auth.org_id)
    )
    artifact = result.scalar_one_or_none()
    if not artifact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artifact not found")

    result = await db.execute(
        select(Artifact)
        .where(Artifact.org_id == auth.org_id, Artifact.name == artifact.name)
        .order_by(Artifact.version.desc())
    )
    return DataResponse(data=[ArtifactResponse.model_validate(a) for a in result.scalars().all()])


# --- Status ---


@router.put("/{artifact_id}/status")
async def update_artifact_status(
    artifact_id: uuid.UUID,
    dto: UpdateStatusDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[ArtifactResponse]:
    result = await db.execute(
        select(Artifact).where(Artifact.id == artifact_id, Artifact.org_id == auth.org_id)
    )
    artifact = result.scalar_one_or_none()
    if not artifact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artifact not found")

    valid = VALID_STATUS_TRANSITIONS.get(artifact.status, [])
    if dto.status.value not in valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from {artifact.status} to {dto.status.value}",
        )

    artifact.status = dto.status.value

    targets = await _resolve_subscribers(db, auth.org_id, artifact.artifact_type, artifact.task_id)
    await emit(
        db=db,
        type=SSEEventType.ARTIFACT_UPDATED,
        org_id=auth.org_id,
        actor_id=auth.id,
        entity_type="artifact",
        entity_id=artifact.id,
        data={"name": artifact.name, "version": artifact.version, "status": dto.status.value},
        target_agents=targets if targets else None,
    )

    await db.commit()
    await db.refresh(artifact)
    return DataResponse(data=ArtifactResponse.model_validate(artifact))


# --- Subscriptions ---


@router.post("/subscribe", status_code=status.HTTP_201_CREATED)
async def create_subscription(
    dto: SubscribeDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[SubscriptionResponse]:
    sub = ArtifactSubscription(
        org_id=auth.org_id,
        agent_id=auth.id,
        artifact_type=dto.artifact_type,
        task_id=dto.task_id,
    )
    db.add(sub)
    try:
        await db.flush()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Subscription already exists"
        ) from exc
    await db.commit()
    await db.refresh(sub)
    return DataResponse(data=SubscriptionResponse.model_validate(sub))


@router.get("/subscriptions")
async def list_subscriptions(
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[SubscriptionResponse]]:
    result = await db.execute(
        select(ArtifactSubscription)
        .where(
            ArtifactSubscription.org_id == auth.org_id,
            ArtifactSubscription.agent_id == auth.id,
        )
        .order_by(ArtifactSubscription.created_at)
    )
    return DataResponse(
        data=[SubscriptionResponse.model_validate(s) for s in result.scalars().all()]
    )


@router.delete("/subscriptions/{subscription_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subscription(
    subscription_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> None:
    result = await db.execute(
        select(ArtifactSubscription).where(
            ArtifactSubscription.id == subscription_id,
            ArtifactSubscription.org_id == auth.org_id,
        )
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")
    await db.delete(sub)
    await db.commit()
