# Artifact Bus Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** First-class typed, versioned, subscribable artifacts as coordination medium between parallel agent streams.

**Architecture:** Artifact + ArtifactSubscription models with typed columns + JSONB content. REST CRUD endpoints, subscription-aware SSE delivery via existing EventBus, MCP tools for agent access. Builds on #670 SSE infra.

**Tech Stack:** FastAPI, SQLAlchemy async, Alembic, Pydantic, existing `emit()` + `EventBus`

**Spec:** `docs/openspawn/specs/2026-03-13-artifact-bus-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `apps/api/app/models/enums.py` | Modify | Add ArtifactType, ArtifactStatus, ARTIFACTS_BATCH_PUBLISHED |
| `apps/api/app/models/artifact.py` | Create | Artifact + ArtifactSubscription SQLAlchemy models |
| `apps/api/app/artifacts/__init__.py` | Create | Package init |
| `apps/api/app/artifacts/schemas.py` | Create | Pydantic DTOs + response schemas |
| `apps/api/app/artifacts/router.py` | Create | REST endpoints (10 routes) |
| `apps/api/app/main.py` | Modify | Register artifacts_router |
| `apps/api/app/mcp_server/server.py` | Modify | Add 5 artifact MCP tools |
| `apps/api/alembic/versions/0005_add_artifacts_tables.py` | Create | Migration for artifacts + artifact_subscriptions |
| `apps/api/tests/test_artifact_unit.py` | Create | Unit tests for publish logic, hashing, versioning |
| `apps/api/tests/test_artifact_integration.py` | Create | Integration tests on SQLite |

---

## Task 1: Enums + Model

**Files:**
- Modify: `apps/api/app/models/enums.py`
- Create: `apps/api/app/models/artifact.py`

- [ ] **Step 1: Add enums to `enums.py`**

Append after `SSEEventType`:

```python
class ArtifactType(enum.StrEnum):
    COMPONENT = "component"
    TEST_PLAN = "test_plan"
    SCREENSHOT = "screenshot"
    API_CONTRACT = "api_contract"
    MIGRATION = "migration"
    SCHEMA = "schema"
    DOC_SECTION = "doc_section"


class ArtifactStatus(enum.StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    SUPERSEDED = "superseded"
```

Add `ARTIFACTS_BATCH_PUBLISHED` to `SSEEventType`:

```python
    # Artifact Bus (#665)
    ARTIFACT_PUBLISHED = "artifact.published"
    ARTIFACT_UPDATED = "artifact.updated"
    ARTIFACTS_BATCH_PUBLISHED = "artifact.batch_published"
```

(Replace the existing two `ARTIFACT_*` entries and the `# Future:` comment.)

- [ ] **Step 2: Create `app/models/artifact.py`**

```python
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.compat import CompatArray, CompatJSONB


class Artifact(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "artifacts"
    __table_args__ = (
        Index("ix_artifacts_org_type", "org_id", "artifact_type"),
        Index("ix_artifacts_org_name", "org_id", "name"),
        UniqueConstraint("org_id", "name", "version", name="uq_artifact_name_version"),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False
    )
    producer_agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False
    )
    artifact_type: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    version: Mapped[int] = mapped_column(nullable=False, default=1)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="published")
    content: Mapped[dict] = mapped_column(CompatJSONB(), nullable=False)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    metadata_: Mapped[dict] = mapped_column(
        "metadata", CompatJSONB(), nullable=False, server_default="{}"
    )
    source_artifact_ids: Mapped[list[object]] = mapped_column(
        CompatArray(UUID(as_uuid=True)), nullable=False, server_default="[]"
    )
    superseded_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("artifacts.id"), nullable=True
    )
    approved_by: Mapped[str | None] = mapped_column(String(200), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(nullable=True)

    organization: Mapped[Organization] = relationship("Organization")
    task: Mapped[Task] = relationship("Task")
    producer: Mapped[Agent] = relationship("Agent")
    superseded_by: Mapped[Artifact | None] = relationship("Artifact", remote_side="Artifact.id")


class ArtifactSubscription(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "artifact_subscriptions"
    __table_args__ = (
        UniqueConstraint("org_id", "agent_id", "artifact_type", name="uq_sub_agent_type"),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False
    )
    artifact_type: Mapped[str] = mapped_column(String(50), nullable=False)
    task_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(server_default="now()", nullable=False)

    agent: Mapped[Agent] = relationship("Agent")


# Avoid circular imports
from app.models.agent import Agent  # noqa: E402
from app.models.organization import Organization  # noqa: E402
from app.models.task import Task  # noqa: E402
```

- [ ] **Step 3: Run lint + typecheck**

```bash
cd apps/api
uv run ruff format app/models/artifact.py app/models/enums.py
uv run ruff check app/models/artifact.py app/models/enums.py
uv run pyright app/models/artifact.py app/models/enums.py
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/app/models/artifact.py apps/api/app/models/enums.py
git commit -m "feat(api): add Artifact + ArtifactSubscription models (#665)"
```

---

## Task 2: Schemas + Publish Helpers

**Files:**
- Create: `apps/api/app/artifacts/__init__.py`
- Create: `apps/api/app/artifacts/schemas.py`

- [ ] **Step 1: Create `app/artifacts/__init__.py`**

Empty file.

- [ ] **Step 2: Create `app/artifacts/schemas.py`**

```python
from __future__ import annotations

import hashlib
import json
import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import ArtifactStatus, ArtifactType


class PublishArtifactDto(BaseModel):
    artifact_type: ArtifactType
    name: str = Field(max_length=200)
    content: dict
    task_id: uuid.UUID
    source_artifact_ids: list[uuid.UUID] = Field(default_factory=list)
    metadata: dict = Field(default_factory=dict)


class UpdateStatusDto(BaseModel):
    status: ArtifactStatus


class SubscribeDto(BaseModel):
    artifact_type: str = Field(description="ArtifactType value or '*' for all")
    task_id: uuid.UUID | None = None


class ArtifactResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    org_id: uuid.UUID
    task_id: uuid.UUID
    producer_agent_id: uuid.UUID
    artifact_type: ArtifactType
    name: str
    version: int
    status: ArtifactStatus
    content: dict
    content_hash: str
    metadata_: dict = Field(alias="metadata")
    source_artifact_ids: list[uuid.UUID]
    superseded_by_id: uuid.UUID | None
    approved_by: str | None
    approved_at: datetime | None
    created_at: datetime
    updated_at: datetime


class SubscriptionResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    org_id: uuid.UUID
    agent_id: uuid.UUID
    artifact_type: str
    task_id: uuid.UUID | None
    created_at: datetime


def compute_content_hash(content: dict) -> str:
    canonical = json.dumps(content, sort_keys=True, default=str)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()
```

- [ ] **Step 3: Lint + typecheck**

```bash
cd apps/api
uv run ruff format app/artifacts/
uv run ruff check app/artifacts/
uv run pyright app/artifacts/
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/app/artifacts/
git commit -m "feat(api): add artifact schemas + content hash helper (#665)"
```

---

## Task 3: Router — CRUD + Publish + Subscribe

**Files:**
- Create: `apps/api/app/artifacts/router.py`
- Modify: `apps/api/app/main.py`

- [ ] **Step 1: Create `app/artifacts/router.py`**

```python
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
from app.auth.dependencies import AuthContext, get_current_agent, require_auth
from app.database import get_db
from app.events.emit import emit
from app.models.artifact import Artifact, ArtifactSubscription
from app.models.enums import ArtifactStatus, ArtifactType, SSEEventType
from app.schemas import DataMessageResponse, DataResponse, PaginatedResponse, PaginationMeta

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

    # Check for duplicate content
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

    # Auto-increment version
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

    # Supersede previous version
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
        targets = await _resolve_subscribers(
            db, auth.org_id, dto.artifact_type.value, dto.task_id
        )
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
            new_artifacts.append({
                "artifact_id": str(artifact.id),
                "artifact_type": artifact.artifact_type,
                "name": artifact.name,
                "version": artifact.version,
                "content_hash": artifact.content_hash,
            })

    if new_artifacts:
        all_types = {a["artifact_type"] for a in new_artifacts}
        all_task_ids = {dto.task_id for dto in dtos}
        targets: list[str] = []
        for t in all_types:
            for tid in all_task_ids:
                targets.extend(
                    await _resolve_subscribers(db, auth.org_id, str(t), tid)
                )
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
    return PaginatedResponse(data=artifacts, meta=PaginationMeta(total=total, page=page, limit=limit))


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
    # Get the artifact to find its name
    result = await db.execute(
        select(Artifact).where(Artifact.id == artifact_id, Artifact.org_id == auth.org_id)
    )
    artifact = result.scalar_one_or_none()
    if not artifact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artifact not found")

    # Get all versions by name
    result = await db.execute(
        select(Artifact)
        .where(Artifact.org_id == auth.org_id, Artifact.name == artifact.name)
        .order_by(Artifact.version.desc())
    )
    return DataResponse(
        data=[ArtifactResponse.model_validate(a) for a in result.scalars().all()]
    )


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

    targets = await _resolve_subscribers(
        db, auth.org_id, artifact.artifact_type, artifact.task_id
    )
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
        .where(ArtifactSubscription.org_id == auth.org_id, ArtifactSubscription.agent_id == auth.id)
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found"
        )
    await db.delete(sub)
    await db.commit()
```

- [ ] **Step 2: Register router in `app/main.py`**

Add import:
```python
from app.artifacts.router import router as artifacts_router
```

Add registration (before `sse_router` to avoid path conflicts):
```python
app.include_router(artifacts_router)
```

- [ ] **Step 3: Lint + typecheck**

```bash
cd apps/api
uv run ruff format app/artifacts/ app/main.py
uv run ruff check app/artifacts/ app/main.py
uv run pyright app/artifacts/ app/main.py
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/app/artifacts/ apps/api/app/main.py
git commit -m "feat(api): add artifact REST endpoints + subscription routing (#665)"
```

---

## Task 4: MCP Tools

**Files:**
- Modify: `apps/api/app/mcp_server/server.py`

- [ ] **Step 1: Add artifact tools section**

Append after the last existing tool section:

```python
# ═══════════════════════════════════════════════
# Artifact Tools
# ═══════════════════════════════════════════════


@mcp.tool
async def artifact_publish(
    artifact_type: str,
    name: str,
    content_json: str,
    task_id: str,
    source_artifact_ids: str | None = None,
    metadata_json: str | None = None,
) -> str:
    """Publish an artifact. Auto-versions if name already exists."""
    body: dict[str, object] = {
        "artifact_type": artifact_type,
        "name": name,
        "content": json.loads(content_json),
        "task_id": task_id,
    }
    if source_artifact_ids:
        body["source_artifact_ids"] = json.loads(source_artifact_ids)
    if metadata_json:
        body["metadata"] = json.loads(metadata_json)
    result = await _get_client().post("/artifacts", json=body)
    return _format(result)


@mcp.tool
async def artifact_get(
    artifact_id: str | None = None,
    name: str | None = None,
) -> str:
    """Get artifact by ID, or latest published version by name."""
    if artifact_id:
        result = await _get_client().get(f"/artifacts/{artifact_id}")
    elif name:
        result = await _get_client().get("/artifacts/latest", params={"name": name})
    else:
        return '{"error": "Provide artifact_id or name"}'
    return _format(result)


@mcp.tool
async def artifact_list(
    task_id: str | None = None,
    artifact_type: str | None = None,
    status: str | None = None,
    producer_agent_id: str | None = None,
) -> str:
    """List artifacts with optional filters."""
    params: dict[str, str] = {}
    if task_id:
        params["task_id"] = task_id
    if artifact_type:
        params["artifact_type"] = artifact_type
    if status:
        params["status"] = status
    if producer_agent_id:
        params["producer_agent_id"] = producer_agent_id
    result = await _get_client().get("/artifacts", params=params or None)
    return _format(result)


@mcp.tool
async def artifact_subscribe(
    artifact_type: str,
    task_id: str | None = None,
) -> str:
    """Subscribe to artifact type notifications. Use '*' for all types."""
    body: dict[str, object] = {"artifact_type": artifact_type}
    if task_id:
        body["task_id"] = task_id
    result = await _get_client().post("/artifacts/subscribe", json=body)
    return _format(result)


@mcp.tool
async def artifact_history(name: str) -> str:
    """Get all versions of an artifact by name."""
    # Get latest first to find its ID, then get history
    latest = await _get_client().get("/artifacts/latest", params={"name": name})
    if "data" in latest and "id" in latest["data"]:
        artifact_id = latest["data"]["id"]
        result = await _get_client().get(f"/artifacts/{artifact_id}/history")
        return _format(result)
    return _format(latest)
```

- [ ] **Step 2: Lint**

```bash
cd apps/api
uv run ruff format app/mcp_server/server.py
uv run ruff check app/mcp_server/server.py
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/app/mcp_server/server.py
git commit -m "feat(api): add 5 artifact MCP tools (#665)"
```

---

## Task 5: Alembic Migration

**Files:**
- Create: `apps/api/alembic/versions/0005_add_artifacts_tables.py`

- [ ] **Step 1: Create migration file**

```python
"""add artifacts and artifact_subscriptions tables

Revision ID: 0005
Revises: 0004
Create Date: 2026-03-13
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "artifacts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("org_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("task_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tasks.id"), nullable=False),
        sa.Column("producer_agent_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("agents.id"), nullable=False),
        sa.Column("artifact_type", sa.String(50), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("status", sa.String(20), nullable=False, server_default="published"),
        sa.Column("content", postgresql.JSONB, nullable=False),
        sa.Column("content_hash", sa.String(64), nullable=False),
        sa.Column("metadata", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("source_artifact_ids", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("superseded_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("artifacts.id"), nullable=True),
        sa.Column("approved_by", sa.String(200), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_artifacts_org_type", "artifacts", ["org_id", "artifact_type"])
    op.create_index("ix_artifacts_org_name", "artifacts", ["org_id", "name"])
    op.create_unique_constraint("uq_artifact_name_version", "artifacts", ["org_id", "name", "version"])

    op.create_table(
        "artifact_subscriptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("org_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("agent_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("agents.id"), nullable=False),
        sa.Column("artifact_type", sa.String(50), nullable=False),
        sa.Column("task_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tasks.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_unique_constraint("uq_sub_agent_type", "artifact_subscriptions", ["org_id", "agent_id", "artifact_type"])


def downgrade() -> None:
    op.drop_table("artifact_subscriptions")
    op.drop_table("artifacts")
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/alembic/versions/0005_add_artifacts_tables.py
git commit -m "feat(api): add alembic migration for artifacts tables (#665)"
```

---

## Task 6: Unit Tests

**Files:**
- Create: `apps/api/tests/test_artifact_unit.py`

- [ ] **Step 1: Write unit tests**

Tests for: content hashing, publish logic (version increment, dedup, supersede), status transitions, subscription filtering. Use mocked DB (AsyncMock) following `test_sse_bus.py` pattern.

Key tests:
- `test_content_hash_deterministic` — same dict regardless of key order
- `test_content_hash_differs` — different content → different hash
- `test_valid_status_transitions` — draft→published, published→superseded
- `test_invalid_status_transition` — superseded→draft raises
- `test_artifact_type_enum_values` — all lowercase, no spaces
- `test_artifact_status_enum_values` — all lowercase

- [ ] **Step 2: Run tests**

```bash
cd apps/api && uv run pytest tests/test_artifact_unit.py -v
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/tests/test_artifact_unit.py
git commit -m "test(api): add artifact unit tests (#665)"
```

---

## Task 7: Integration Tests

**Files:**
- Create: `apps/api/tests/test_artifact_integration.py`

- [ ] **Step 1: Write integration tests**

Use SQLite fixture pattern from `test_sse_integration.py` (sqlite_env + client fixtures, AUTH_MODE=none).

Key tests:
- `test_publish_creates_v1` — POST /artifacts returns artifact with version=1
- `test_publish_existing_name_increments_version` — second publish → version=2
- `test_publish_supersedes_previous` — v1 gets superseded_by_id set
- `test_duplicate_content_returns_existing` — same content_hash → no new version
- `test_batch_publish` — POST /artifacts/batch creates multiple
- `test_list_with_filters` — type, name, status, producer filters
- `test_get_latest` — returns highest published version
- `test_get_history` — returns all versions ordered desc
- `test_status_transition` — PUT /artifacts/{id}/status
- `test_invalid_status_transition_400` — bad transition returns 400
- `test_subscribe_and_list` — POST /artifacts/subscribe + GET /subscriptions
- `test_delete_subscription` — DELETE /subscriptions/{id}
- `test_auth_gate` — all endpoints return 401 in full auth mode
- `test_source_artifact_ids_lineage` — publish with source refs, verify on get
- `test_e2e_coordination_flow` — dev publishes component → test agent publishes test plan referencing it → verify lineage

- [ ] **Step 2: Run tests**

```bash
cd apps/api && uv run pytest tests/test_artifact_integration.py -v
```

- [ ] **Step 3: Run full suite**

```bash
cd apps/api && uv run pytest tests/ -v
```

- [ ] **Step 4: Lint + typecheck everything**

```bash
cd apps/api
uv run ruff format .
uv run ruff check .
uv run pyright app/artifacts/ app/models/artifact.py app/models/enums.py
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/tests/test_artifact_integration.py
git commit -m "test(api): add artifact integration tests + e2e coordination flow (#665)"
```

---

## Task 8: Branch + PR

- [ ] **Step 1: Create branch and push**

```bash
git checkout -b adamwdennis/artifact-bus
git push -u origin adamwdennis/artifact-bus
```

- [ ] **Step 2: Open PR**

Title: `feat(api): Artifact Bus — first-class shared artifacts (#665)`

Body should reference #665, #664, list all deliverables, include test plan.
