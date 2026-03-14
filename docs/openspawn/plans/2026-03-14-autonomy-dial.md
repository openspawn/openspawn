# Autonomy Dial Spike Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove that a per-task autonomy level (0-10) with risk-based approval gating works across task transitions and artifact publishing — the two primary agent action types.

**Architecture:** Add `autonomy_level` to Task (nullable override) and `default_autonomy_level` to Agent (default 5). New `ApprovalRequest` model tracks gated actions. Pure gate function compares risk level to effective autonomy. Task transitions return 403 when gated; artifact publish writes DRAFT status when gated. Approval REST endpoints + 3 MCP tools complete the loop.

**Tech Stack:** FastAPI, SQLAlchemy async, Alembic, existing emit()/SSE infrastructure

**Verified against codebase:**
- `Task` already has `approval_required`, `approved_by`, `approved_at` — autonomy gate layers on top (both can trigger)
- `Artifact` has `approved_by`, `approved_at`, `ArtifactStatus.DRAFT`, and `DRAFT → PUBLISHED` in `VALID_STATUS_TRANSITIONS` — all scaffolded but unused
- `SSEEventType.APPROVAL_REQUESTED` and `APPROVAL_RESOLVED` are declared but unused
- `approve_task()` emits no SSE event — we'll fix that in this spike
- `_publish_one()` hardcodes `status=PUBLISHED` — we'll conditionally set DRAFT when gated
- `update_artifact_status()` validates `DRAFT → PUBLISHED` but doesn't set `approved_by`/`approved_at` — we'll add that

**Design decisions:**
- Approved `ApprovalRequest` records are **audit-only** — they do NOT grant the agent a bypass token to retry the gated action autonomously. The human/manager who approves the intent should perform the action directly (e.g., transition the task themselves). This avoids callback/replay complexity.
- `resolved_by` stores a raw UUID with no FK constraint — it's polymorphic (can be an agent UUID from `agents.id` or a user UUID from `users.id`)
- Authority check for agent approvers uses `requester.level + 2` (org hierarchy), not `autonomy_level + 2` (task config)

---

## File Structure

| File | Responsibility |
|------|----------------|
| `app/models/enums.py` | Add `ApprovalStatus`, `ActionType` enums |
| `app/models/approval.py` | `ApprovalRequest` SQLAlchemy model |
| `app/models/agent.py` | Add `default_autonomy_level` column |
| `app/models/task.py` | Add `autonomy_level` column |
| `app/models/__init__.py` | Register new model + enum exports |
| `app/autonomy/__init__.py` | Package init |
| `app/autonomy/gate.py` | Pure gate function + risk registry |
| `app/approvals/__init__.py` | Package init |
| `app/approvals/schemas.py` | Pydantic DTOs for approval endpoints |
| `app/approvals/service.py` | Business logic: create, list, respond |
| `app/approvals/router.py` | REST endpoints |
| `app/tasks/service.py` | Add autonomy gate to `transition_task()`, emit event in `approve_task()` |
| `app/tasks/schemas.py` | Add `autonomy_level` to `CreateTaskDto` + `TaskResponse` |
| `app/agents/schemas.py` | Add `default_autonomy_level` to DTOs + response |
| `app/artifacts/router.py` | Conditional DRAFT status in `_publish_one()`, approval fields in `update_artifact_status()` |
| `app/main.py` | Register approvals router |
| `app/mcp_server/server.py` | 3 MCP tools |
| `alembic/versions/0007_add_approvals_autonomy.py` | Migration |
| `tests/test_autonomy_gate.py` | Gate logic unit tests |
| `tests/test_approvals_e2e.py` | Full flow E2E test |

---

## Chunk 1: Data Model + Migration

### Task 1: ApprovalStatus and ActionType enums

**Files:**
- Modify: `apps/api/app/models/enums.py`

- [ ] **Step 1: Add enums**

```python
# After existing enums, before SSEEventType:

class ApprovalStatus(enum.StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class ActionType(enum.StrEnum):
    TASK_TRANSITION = "task_transition"
    ARTIFACT_PUBLISH = "artifact_publish"
```

- [ ] **Step 2: Run tests**

Run: `cd apps/api && uv run pytest tests/ -v --tb=short -q`
Expected: All pass (additive enum change)

- [ ] **Step 3: Commit**

```bash
git add apps/api/app/models/enums.py
git commit -m "feat(api): add ApprovalStatus and ActionType enums"
```

### Task 2: Add columns to Agent and Task models

**Files:**
- Modify: `apps/api/app/models/agent.py`
- Modify: `apps/api/app/models/task.py`
- Modify: `apps/api/app/agents/schemas.py`
- Modify: `apps/api/app/tasks/schemas.py`

- [ ] **Step 1: Add `default_autonomy_level` to Agent model**

In `apps/api/app/models/agent.py`, after the `trust_score` field:

```python
    default_autonomy_level: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, server_default="5"
    )
```

- [ ] **Step 2: Add `autonomy_level` to Task model**

In `apps/api/app/models/task.py`, after the `approval_required` field:

```python
    autonomy_level: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
```

- [ ] **Step 3: Update Agent schemas**

In `apps/api/app/agents/schemas.py`:

Add to `CreateAgentDto`:
```python
    default_autonomy_level: int = Field(default=5, ge=0, le=10)
```

Add to `UpdateAgentDto`:
```python
    default_autonomy_level: int | None = Field(default=None, ge=0, le=10)
```

Add to `AgentResponse`:
```python
    default_autonomy_level: int
```

- [ ] **Step 4: Update Task schemas**

In `apps/api/app/tasks/schemas.py`:

Add to `CreateTaskDto`:
```python
    autonomy_level: int | None = Field(default=None, ge=0, le=10)
```

Add to `TaskResponse`:
```python
    autonomy_level: int | None
```

- [ ] **Step 5: Run tests**

Run: `cd apps/api && uv run pytest tests/ -v --tb=short -q`
Expected: All pass

- [ ] **Step 6: Commit**

```bash
git add apps/api/app/models/agent.py apps/api/app/models/task.py \
       apps/api/app/agents/schemas.py apps/api/app/tasks/schemas.py
git commit -m "feat(api): add autonomy_level to Task and default_autonomy_level to Agent"
```

### Task 3: ApprovalRequest model

**Files:**
- Create: `apps/api/app/models/approval.py`
- Modify: `apps/api/app/models/__init__.py`

- [ ] **Step 1: Write the model**

Note: `resolved_by` has no FK — it's polymorphic (agent UUID or user UUID).

```python
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, ForeignKey, Index, SmallInteger, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPrimaryKeyMixin
from app.models.compat import CompatJSONB, CompatUUID


class ApprovalRequest(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "approval_requests"
    __table_args__ = (
        CheckConstraint(
            "risk_level >= 0 AND risk_level <= 10", name="chk_approval_risk_level"
        ),
        CheckConstraint(
            "autonomy_level >= 0 AND autonomy_level <= 10",
            name="chk_approval_autonomy_level",
        ),
        Index("ix_approval_requests_org_id_status", "org_id", "status"),
        Index("ix_approval_requests_org_id_requested_by", "org_id", "requested_by"),
        Index("ix_approval_requests_org_id_entity_id", "org_id", "entity_id"),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("organizations.id"), nullable=False
    )
    requested_by: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("agents.id"), nullable=False
    )
    action_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(CompatUUID(), nullable=False)
    risk_level: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    autonomy_level: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    payload: Mapped[dict[str, object]] = mapped_column(CompatJSONB(), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="pending")
    resolved_by: Mapped[uuid.UUID | None] = mapped_column(
        CompatUUID(), nullable=True
    )
    resolved_at: Mapped[datetime | None] = mapped_column(nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now(), nullable=False
    )

    requester = relationship("Agent", foreign_keys=[requested_by], lazy="selectin")
```

- [ ] **Step 2: Register in `__init__.py`**

Add import and `__all__` entry for `ApprovalRequest`, `ApprovalStatus`, `ActionType`.

- [ ] **Step 3: Commit**

```bash
git add apps/api/app/models/approval.py apps/api/app/models/__init__.py
git commit -m "feat(api): add ApprovalRequest model"
```

### Task 4: Alembic migration

**Files:**
- Create: `apps/api/alembic/versions/0007_add_approvals_autonomy.py`

- [ ] **Step 1: Write migration**

Note: No `op.create_check_constraint()` as ALTER TABLE — SQLite doesn't support it. Pydantic validates at API layer. Check constraints are inline in `create_table` only.

```python
"""add approval_requests table and autonomy columns

Revision ID: 0007
Revises: 0006
Create Date: 2026-03-14
"""

import sqlalchemy as sa

from alembic import op

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add autonomy columns to existing tables (no check constraints — SQLite compat)
    op.add_column(
        "agents",
        sa.Column(
            "default_autonomy_level",
            sa.SmallInteger(),
            nullable=False,
            server_default="5",
        ),
    )

    op.add_column(
        "tasks",
        sa.Column("autonomy_level", sa.SmallInteger(), nullable=True),
    )

    # Create approval_requests table
    op.create_table(
        "approval_requests",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column(
            "org_id", sa.Text(), sa.ForeignKey("organizations.id"), nullable=False
        ),
        sa.Column(
            "requested_by", sa.Text(), sa.ForeignKey("agents.id"), nullable=False
        ),
        sa.Column("action_type", sa.String(50), nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", sa.Text(), nullable=False),
        sa.Column("risk_level", sa.SmallInteger(), nullable=False),
        sa.Column("autonomy_level", sa.SmallInteger(), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("resolved_by", sa.Text(), nullable=True),
        sa.Column("resolved_at", sa.DateTime(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False
        ),
        sa.CheckConstraint(
            "risk_level >= 0 AND risk_level <= 10", name="chk_approval_risk_level"
        ),
        sa.CheckConstraint(
            "autonomy_level >= 0 AND autonomy_level <= 10",
            name="chk_approval_autonomy_level",
        ),
    )
    op.create_index(
        "ix_approval_requests_org_id_status",
        "approval_requests",
        ["org_id", "status"],
    )
    op.create_index(
        "ix_approval_requests_org_id_requested_by",
        "approval_requests",
        ["org_id", "requested_by"],
    )
    op.create_index(
        "ix_approval_requests_org_id_entity_id",
        "approval_requests",
        ["org_id", "entity_id"],
    )


def downgrade() -> None:
    op.drop_table("approval_requests")
    op.drop_column("tasks", "autonomy_level")
    op.drop_column("agents", "default_autonomy_level")
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/alembic/versions/0007_*
git commit -m "feat(api): add approvals + autonomy migration"
```

---

## Chunk 2: Gate Logic + Approval Service

### Task 5: Pure gate function + risk registry

**Files:**
- Create: `apps/api/app/autonomy/__init__.py` (empty)
- Create: `apps/api/app/autonomy/gate.py`

- [ ] **Step 1: Write gate module**

```python
from __future__ import annotations

# Risk levels (0-10) per (action_type, subtype) pair.
# Higher = riskier = needs higher autonomy to proceed without approval.
RISK_REGISTRY: dict[tuple[str, str], int] = {
    # Task transitions
    ("task_transition", "done"): 3,
    ("task_transition", "cancelled"): 5,
    ("task_transition", "review"): 2,
    ("task_transition", "blocked"): 1,
    ("task_transition", "in_progress"): 0,
    ("task_transition", "todo"): 0,
    ("task_transition", "assigned"): 0,
    ("task_transition", "backlog"): 0,
    # Artifact types
    ("artifact_publish", "screenshot"): 1,
    ("artifact_publish", "test_plan"): 2,
    ("artifact_publish", "doc_section"): 2,
    ("artifact_publish", "component"): 4,
    ("artifact_publish", "api_contract"): 7,
    ("artifact_publish", "schema"): 7,
    ("artifact_publish", "migration"): 9,
}

DEFAULT_RISK = 5  # unknown actions default to medium risk (fail closed)


def get_risk_level(action_type: str, subtype: str) -> int:
    return RISK_REGISTRY.get((action_type, subtype), DEFAULT_RISK)


def is_gated(effective_autonomy: int, risk_level: int) -> bool:
    """Returns True if the action requires approval.

    An action is gated when its risk exceeds the effective autonomy level.
    autonomy=0 gates everything (risk > 0). autonomy=10 gates nothing (risk <= 10).
    """
    return risk_level > effective_autonomy


def resolve_effective_autonomy(
    task_autonomy: int | None, agent_autonomy: int
) -> int:
    """Task-level override takes precedence over agent default."""
    if task_autonomy is not None:
        return task_autonomy
    return agent_autonomy
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/app/autonomy/
git commit -m "feat(api): add autonomy gate function + risk registry"
```

### Task 6: Approval schemas

**Files:**
- Create: `apps/api/app/approvals/__init__.py` (empty)
- Create: `apps/api/app/approvals/schemas.py`

- [ ] **Step 1: Write schemas**

Note: `metadata` uses `Field(alias="metadata_")` to match codebase convention (see `AgentResponse`).

```python
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import ActionType, ApprovalStatus


class CreateApprovalDto(BaseModel):
    action_type: ActionType
    entity_type: str
    entity_id: uuid.UUID
    risk_level: int = Field(ge=0, le=10)
    payload: dict[str, object]


class RespondApprovalDto(BaseModel):
    notes: str | None = None


class ApprovalResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    org_id: uuid.UUID
    requested_by: uuid.UUID
    action_type: str
    entity_type: str
    entity_id: uuid.UUID
    risk_level: int
    autonomy_level: int
    payload: dict[str, object]
    status: ApprovalStatus
    resolved_by: uuid.UUID | None
    resolved_at: datetime | None
    notes: str | None
    expires_at: datetime | None
    metadata: dict[str, object] = Field(alias="metadata_")
    created_at: datetime


class GatedResponse(BaseModel):
    """Returned when an action is gated by the autonomy dial."""
    approval_id: uuid.UUID
    status: str = "pending"
    risk_level: int
    autonomy_level: int
    message: str
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/app/approvals/
git commit -m "feat(api): add approval schemas"
```

### Task 7: Approval service

**Files:**
- Create: `apps/api/app/approvals/service.py`

- [ ] **Step 1: Write service**

Note: authority check uses `requester.level + 2` (org hierarchy), not `autonomy_level + 2`. `list_pending` filters expired records. Idempotency handles IntegrityError for TOCTOU race.

```python
from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

import pendulum
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.schemas import AuthenticatedAgent
from app.events.emit import emit
from app.models.approval import ApprovalRequest
from app.models.enums import ApprovalStatus, SSEEventType

if TYPE_CHECKING:
    from app.auth.dependencies import AuthContext


async def create_approval(
    db: AsyncSession,
    org_id: uuid.UUID,
    agent_id: uuid.UUID,
    action_type: str,
    entity_type: str,
    entity_id: uuid.UUID,
    risk_level: int,
    autonomy_level: int,
    payload: dict[str, object],
) -> ApprovalRequest:
    # Idempotency: check for existing pending request
    existing = await db.execute(
        select(ApprovalRequest).where(
            ApprovalRequest.org_id == org_id,
            ApprovalRequest.requested_by == agent_id,
            ApprovalRequest.action_type == action_type,
            ApprovalRequest.entity_id == entity_id,
            ApprovalRequest.status == ApprovalStatus.PENDING.value,
        )
    )
    if found := existing.scalar_one_or_none():
        return found

    approval = ApprovalRequest(
        org_id=org_id,
        requested_by=agent_id,
        action_type=action_type,
        entity_type=entity_type,
        entity_id=entity_id,
        risk_level=risk_level,
        autonomy_level=autonomy_level,
        payload=payload,
        status=ApprovalStatus.PENDING.value,
        expires_at=pendulum.now("UTC").add(hours=24),
    )
    db.add(approval)
    try:
        await db.flush()
    except Exception:
        # TOCTOU race — concurrent request created the same approval
        await db.rollback()
        existing = await db.execute(
            select(ApprovalRequest).where(
                ApprovalRequest.org_id == org_id,
                ApprovalRequest.requested_by == agent_id,
                ApprovalRequest.action_type == action_type,
                ApprovalRequest.entity_id == entity_id,
                ApprovalRequest.status == ApprovalStatus.PENDING.value,
            )
        )
        if found := existing.scalar_one_or_none():
            return found
        raise
    await db.refresh(approval)

    await emit(
        db=db,
        type=SSEEventType.APPROVAL_REQUESTED,
        org_id=org_id,
        actor_id=agent_id,
        entity_type="approval",
        entity_id=approval.id,
        data={
            "action_type": action_type,
            "entity_type": entity_type,
            "entity_id": str(entity_id),
            "risk_level": risk_level,
            "autonomy_level": autonomy_level,
        },
    )
    return approval


async def list_approvals(
    db: AsyncSession,
    org_id: uuid.UUID,
    approval_status: str | None = None,
    action_type: str | None = None,
    page: int = 1,
    limit: int = 50,
) -> tuple[list[ApprovalRequest], int]:
    q = select(ApprovalRequest).where(ApprovalRequest.org_id == org_id)

    if approval_status:
        q = q.where(ApprovalRequest.status == approval_status)
    if action_type:
        q = q.where(ApprovalRequest.action_type == action_type)

    # Filter out expired pending approvals
    now = pendulum.now("UTC")
    q = q.where(
        (ApprovalRequest.status != ApprovalStatus.PENDING.value)
        | (ApprovalRequest.expires_at.is_(None))
        | (ApprovalRequest.expires_at > now)
    )

    total = await db.scalar(select(func.count()).select_from(q.subquery())) or 0
    offset = (page - 1) * limit
    result = await db.execute(
        q.order_by(ApprovalRequest.created_at.desc()).offset(offset).limit(limit)
    )
    return list(result.scalars().all()), total


async def get_approval(
    db: AsyncSession, org_id: uuid.UUID, approval_id: uuid.UUID
) -> ApprovalRequest:
    result = await db.execute(
        select(ApprovalRequest).where(
            ApprovalRequest.id == approval_id,
            ApprovalRequest.org_id == org_id,
        )
    )
    approval = result.scalar_one_or_none()
    if not approval:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval not found")
    return approval


async def respond_to_approval(
    db: AsyncSession,
    auth: AuthContext,
    approval_id: uuid.UUID,
    decision: str,
    notes: str | None = None,
) -> ApprovalRequest:
    approval = await get_approval(db, auth.org_id, approval_id)

    if approval.status != ApprovalStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Approval is {approval.status}, not pending",
        )

    # Self-approval prevention
    if approval.requested_by == auth.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot approve your own request",
        )

    # Agent authority check: level >= requester.level + 2, or parent
    if isinstance(auth, AuthenticatedAgent):
        from app.models.agent import Agent

        requester = await db.get(Agent, approval.requested_by)
        is_parent = requester and requester.parent_id == auth.id
        requester_level = requester.level if requester else 0
        has_level = auth.level >= requester_level + 2
        if not (is_parent or has_level):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient level to approve (need level >= {requester_level + 2} or be parent agent)",
            )

    now = pendulum.now("UTC")
    approval.status = decision
    approval.resolved_by = auth.id
    approval.resolved_at = now
    approval.notes = notes

    await emit(
        db=db,
        type=SSEEventType.APPROVAL_RESOLVED,
        org_id=auth.org_id,
        actor_id=auth.id,
        entity_type="approval",
        entity_id=approval.id,
        data={
            "action_type": approval.action_type,
            "entity_type": approval.entity_type,
            "entity_id": str(approval.entity_id),
            "decision": decision,
        },
    )
    return approval
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/app/approvals/service.py
git commit -m "feat(api): add approval service with authority checks"
```

### Task 8: Approval REST router

**Files:**
- Create: `apps/api/app/approvals/router.py`
- Modify: `apps/api/app/main.py`

- [ ] **Step 1: Write router**

```python
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

import app.approvals.service as service
from app.approvals.schemas import ApprovalResponse, RespondApprovalDto
from app.auth.dependencies import AuthContext, require_auth
from app.database import get_db
from app.models.enums import ApprovalStatus
from app.schemas import DataResponse, PaginatedResponse, PaginationMeta

router = APIRouter(prefix="/approvals", tags=["approvals"])


@router.get("")
async def list_approvals(
    status_filter: str | None = Query(None, alias="status"),
    action_type: str | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, le=200),
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> PaginatedResponse[ApprovalResponse]:
    approvals, total = await service.list_approvals(
        db, auth.org_id, status_filter, action_type, page, limit
    )
    return PaginatedResponse(
        data=[ApprovalResponse.model_validate(a) for a in approvals],
        meta=PaginationMeta(total=total, page=page, limit=limit),
    )


@router.get("/pending")
async def list_pending(
    action_type: str | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, le=200),
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> PaginatedResponse[ApprovalResponse]:
    approvals, total = await service.list_approvals(
        db, auth.org_id, ApprovalStatus.PENDING.value, action_type, page, limit
    )
    return PaginatedResponse(
        data=[ApprovalResponse.model_validate(a) for a in approvals],
        meta=PaginationMeta(total=total, page=page, limit=limit),
    )


@router.get("/{approval_id}")
async def get_approval(
    approval_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[ApprovalResponse]:
    approval = await service.get_approval(db, auth.org_id, approval_id)
    return DataResponse(data=ApprovalResponse.model_validate(approval))


@router.post("/{approval_id}/approve")
async def approve(
    approval_id: uuid.UUID,
    dto: RespondApprovalDto | None = None,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[ApprovalResponse]:
    approval = await service.respond_to_approval(
        db, auth, approval_id, ApprovalStatus.APPROVED.value, dto.notes if dto else None
    )
    await db.commit()
    return DataResponse(data=ApprovalResponse.model_validate(approval))


@router.post("/{approval_id}/reject")
async def reject(
    approval_id: uuid.UUID,
    dto: RespondApprovalDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[ApprovalResponse]:
    if not dto.notes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rejection reason is required",
        )
    approval = await service.respond_to_approval(
        db, auth, approval_id, ApprovalStatus.REJECTED.value, dto.notes
    )
    await db.commit()
    return DataResponse(data=ApprovalResponse.model_validate(approval))
```

- [ ] **Step 2: Register in main.py**

Add after existing router imports:
```python
from app.approvals.router import router as approvals_router
```
Add after existing `app.include_router` calls:
```python
app.include_router(approvals_router)
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/app/approvals/router.py apps/api/app/main.py
git commit -m "feat(api): add approval REST endpoints"
```

---

## Chunk 3: Gate Integration

### Task 9: Integrate gate into task transitions

**Files:**
- Modify: `apps/api/app/tasks/service.py`

- [ ] **Step 1: Add autonomy gate to `transition_task()`**

After the state machine validation (line ~157) and before the existing approval_required check, add:

```python
    # Autonomy dial gate — skip for human operators
    from app.auth.schemas import AuthenticatedAgent as _AuthAgent

    if isinstance(auth, _AuthAgent):
        from app.autonomy.gate import get_risk_level, is_gated, resolve_effective_autonomy
        from app.models.agent import Agent

        agent = await db.get(Agent, auth.id)
        effective_autonomy = resolve_effective_autonomy(
            task.autonomy_level, agent.default_autonomy_level if agent else 5
        )
        risk = get_risk_level("task_transition", dto.status.value)

        if is_gated(effective_autonomy, risk):
            from app.approvals.schemas import GatedResponse
            from app.approvals.service import create_approval

            approval = await create_approval(
                db=db,
                org_id=auth.org_id,
                agent_id=auth.id,
                action_type="task_transition",
                entity_type="task",
                entity_id=task.id,
                risk_level=risk,
                autonomy_level=effective_autonomy,
                payload={
                    "from_status": task.status,
                    "to_status": dto.status.value,
                    "reason": dto.reason,
                },
            )
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=GatedResponse(
                    approval_id=approval.id,
                    risk_level=risk,
                    autonomy_level=effective_autonomy,
                    message=f"Action gated — autonomy {effective_autonomy} < risk {risk}",
                ).model_dump(mode="json"),
            )
```

Note: the `db.commit()` before the raise is intentional — it persists the `ApprovalRequest` before the 403 unwinds the request. This deviates from the single-commit-at-end pattern but is required because the HTTPException would otherwise roll back the approval row.

- [ ] **Step 2: Add SSE event to `approve_task()`**

In `approve_task()`, after setting `approved_by`/`approved_at` and before `db.commit()`:

```python
    from app.events.emit import emit
    from app.models.enums import SSEEventType

    await emit(
        db=db,
        type=SSEEventType.APPROVAL_RESOLVED,
        org_id=auth.org_id,
        actor_id=auth.id,
        entity_type="task",
        entity_id=task.id,
        data={"approved_by": approver_name, "task_title": task.title},
    )
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/app/tasks/service.py
git commit -m "feat(api): add autonomy gate to task transitions"
```

### Task 10: Integrate gate into artifact publishing

**Files:**
- Modify: `apps/api/app/artifacts/router.py`

- [ ] **Step 1: Rewrite `_publish_one()` with gate logic**

Complete replacement handling all 3 code paths (cache hit, gated, ungated):

```python
async def _publish_one(
    db: AsyncSession,
    dto: PublishArtifactDto,
    org_id: uuid.UUID,
    producer_id: uuid.UUID,
    auth: AuthContext,
) -> tuple[Artifact, bool, uuid.UUID | None]:
    """Publish a single artifact. Returns (artifact, is_new, approval_id).

    If content_hash matches latest version, returns existing (is_new=False).
    If gated by autonomy dial, artifact is stored as DRAFT (approval_id set).
    """
    from app.auth.schemas import AuthenticatedAgent as _AuthAgent

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
        return existing, False, None

    max_ver = await db.scalar(
        select(func.max(Artifact.version)).where(
            Artifact.org_id == org_id, Artifact.name == dto.name
        )
    )
    new_version = (max_ver or 0) + 1

    # Determine status: DRAFT if gated, PUBLISHED otherwise
    artifact_status = ArtifactStatus.PUBLISHED.value
    approval_id: uuid.UUID | None = None

    if isinstance(auth, _AuthAgent):
        from app.autonomy.gate import get_risk_level, is_gated, resolve_effective_autonomy
        from app.models.agent import Agent
        from app.models.task import Task

        agent = await db.get(Agent, auth.id)
        task = await db.get(Task, dto.task_id)
        effective_autonomy = resolve_effective_autonomy(
            task.autonomy_level if task else None,
            agent.default_autonomy_level if agent else 5,
        )
        risk = get_risk_level("artifact_publish", dto.artifact_type.value)

        if is_gated(effective_autonomy, risk):
            artifact_status = ArtifactStatus.DRAFT.value

    now = pendulum.now("UTC")
    artifact = Artifact(
        org_id=org_id,
        task_id=dto.task_id,
        producer_agent_id=producer_id,
        artifact_type=dto.artifact_type.value,
        name=dto.name,
        version=new_version,
        status=artifact_status,
        content=dto.content,
        content_hash=content_hash,
        metadata_=dto.metadata,
        source_artifact_ids=[str(sid) for sid in dto.source_artifact_ids],
        created_at=now,
        updated_at=now,
    )
    db.add(artifact)
    await db.flush()

    if existing:
        existing.superseded_by_id = artifact.id
        existing.status = ArtifactStatus.SUPERSEDED.value

    # Create approval request if gated
    if artifact_status == ArtifactStatus.DRAFT.value and isinstance(auth, _AuthAgent):
        from app.approvals.service import create_approval

        approval = await create_approval(
            db=db,
            org_id=org_id,
            agent_id=auth.id,
            action_type="artifact_publish",
            entity_type="artifact",
            entity_id=artifact.id,
            risk_level=risk,
            autonomy_level=effective_autonomy,
            payload={
                "artifact_type": dto.artifact_type.value,
                "name": dto.name,
                "version": new_version,
            },
        )
        approval_id = approval.id

    return artifact, True, approval_id
```

- [ ] **Step 2: Update `publish_artifact()` to handle approval case**

When `approval_id` is not None, skip `ARTIFACT_PUBLISHED` emit (subscribers shouldn't see DRAFT artifacts):

```python
@router.post("", status_code=status.HTTP_201_CREATED)
async def publish_artifact(
    dto: PublishArtifactDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[ArtifactResponse]:
    artifact, is_new, approval_id = await _publish_one(db, dto, auth.org_id, auth.id, auth)

    if is_new and approval_id is None:
        # Only emit ARTIFACT_PUBLISHED for non-gated artifacts
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
    return DataResponse(data=ArtifactResponse.model_validate(artifact))
```

- [ ] **Step 3: Update `publish_batch()` to handle new signature**

Update the unpacking in the batch loop:
```python
    for dto in dtos:
        artifact, is_new, _approval_id = await _publish_one(db, dto, auth.org_id, auth.id, auth)
```

Only include non-gated new artifacts in the batch event data.

- [ ] **Step 4: Update `update_artifact_status()` for DRAFT→PUBLISHED approval**

In the `update_artifact_status` endpoint, after `artifact.status = dto.status.value`:

```python
    old_status = artifact.status
    artifact.status = dto.status.value
    artifact.updated_at = pendulum.now("UTC")

    # Set approval fields on DRAFT → PUBLISHED
    if old_status == ArtifactStatus.DRAFT.value and dto.status == ArtifactStatus.PUBLISHED:
        from app.auth.schemas import AuthenticatedAgent as _AuthAgent

        approver_name = auth.agent_id if isinstance(auth, _AuthAgent) else auth.name
        artifact.approved_by = approver_name
        artifact.approved_at = pendulum.now("UTC")

    # Emit ARTIFACT_PUBLISHED (not just UPDATED) for DRAFT → PUBLISHED
    sse_type = SSEEventType.ARTIFACT_PUBLISHED if (
        old_status == ArtifactStatus.DRAFT.value
        and dto.status == ArtifactStatus.PUBLISHED
    ) else SSEEventType.ARTIFACT_UPDATED
```

Use `sse_type` in the existing `emit()` call.

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/artifacts/router.py
git commit -m "feat(api): add autonomy gate to artifact publishing"
```

---

## Chunk 4: MCP Tools

### Task 11: Add 3 MCP tools

**Files:**
- Modify: `apps/api/app/mcp_server/server.py`

- [ ] **Step 1: Add tools**

Note: `approval_respond` validates `decision` parameter before constructing URL.

```python
# ═══════════════════════════════════════════════
# Autonomy Dial Tools
# ═══════════════════════════════════════════════


@mcp.tool
async def approval_request(
    action_type: str,
    entity_type: str,
    entity_id: str,
    risk_level: int,
    payload_json: str,
) -> str:
    """Create an approval request when an action exceeds autonomy level."""
    body: dict[str, object] = {
        "action_type": action_type,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "risk_level": risk_level,
        "payload": json.loads(payload_json),
    }
    result = await _get_client().post("/approvals", json=body)
    return _format(result)


@mcp.tool
async def approval_respond(
    approval_id: str,
    decision: str,
    notes: str | None = None,
) -> str:
    """Approve or reject a pending approval request. Decision must be 'approve' or 'reject'."""
    if decision not in ("approve", "reject"):
        return json.dumps({"error": "decision must be 'approve' or 'reject'"})
    body: dict[str, str] = {}
    if notes:
        body["notes"] = notes
    result = await _get_client().post(
        f"/approvals/{approval_id}/{decision}", json=body or None
    )
    return _format(result)


@mcp.tool
async def approval_list(
    status: str | None = None,
    action_type: str | None = None,
) -> str:
    """List approval requests. Filter by status (pending/approved/rejected) or action_type."""
    params: dict[str, str] = {}
    if status:
        params["status"] = status
    if action_type:
        params["action_type"] = action_type
    result = await _get_client().get("/approvals", params=params or None)
    return _format(result)
```

- [ ] **Step 2: Update MCP tool count test**

In `tests/test_mcp_server.py`, update the expected tool count and add the 3 new tool names to `expected_tools`.

- [ ] **Step 3: Run tests**

Run: `cd apps/api && uv run pytest tests/test_mcp_server.py -v`

- [ ] **Step 4: Commit**

```bash
git add apps/api/app/mcp_server/server.py apps/api/tests/test_mcp_server.py
git commit -m "feat(api): add 3 autonomy dial MCP tools"
```

---

## Chunk 5: Tests

### Task 12: Gate logic unit tests

**Files:**
- Create: `apps/api/tests/test_autonomy_gate.py`

- [ ] **Step 1: Write tests**

Test `is_gated()`:
- `autonomy=5, risk=3` → not gated
- `autonomy=5, risk=5` → not gated (equal = allowed)
- `autonomy=5, risk=6` → gated
- `autonomy=0, risk=1` → gated (everything gated)
- `autonomy=10, risk=10` → not gated (nothing gated)

Test `resolve_effective_autonomy()`:
- `task=None, agent=5` → 5 (inherit)
- `task=3, agent=5` → 3 (task override)
- `task=8, agent=5` → 8 (task can raise too)

Test `get_risk_level()`:
- `("task_transition", "done")` → 3
- `("artifact_publish", "migration")` → 9
- `("unknown", "action")` → 5 (default)

- [ ] **Step 2: Run tests**

Run: `cd apps/api && uv run pytest tests/test_autonomy_gate.py -v`

- [ ] **Step 3: Commit**

```bash
git add apps/api/tests/test_autonomy_gate.py
git commit -m "test(api): add autonomy gate unit tests"
```

### Task 13: End-to-end approval test

**Files:**
- Create: `apps/api/tests/test_approvals_e2e.py`

- [ ] **Step 1: Write E2E test**

**CRITICAL: Must override `require_auth` to return `AuthenticatedAgent`.** The `AUTH_MODE=none` fixture returns `AuthenticatedUser`, which bypasses the gate (`isinstance(auth, AuthenticatedAgent)` is False). Override `require_auth` dependency per-step using a context manager:

```python
import contextlib
from app.auth.dependencies import require_auth
from app.auth.schemas import AuthenticatedAgent

@contextlib.contextmanager
def as_agent(app, agent_id, org_id, name, level, agent_id_str="test-agent"):
    """Override require_auth to return an AuthenticatedAgent."""
    original = app.dependency_overrides.get(require_auth)
    app.dependency_overrides[require_auth] = lambda: AuthenticatedAgent(
        id=agent_id,
        org_id=org_id,
        agent_id=agent_id_str,
        name=name,
        role="worker",
        mode="worker",
        level=level,
    )
    try:
        yield
    finally:
        if original:
            app.dependency_overrides[require_auth] = original
        else:
            app.dependency_overrides.pop(require_auth, None)
```

Scenario:
1. Create org, 2 agents (worker: level=3, default_autonomy_level=3; manager: level=8), task
2. **As worker**: attempt `task_transition` to `done` (risk=3, autonomy=3) → 200 (3 is not > 3)
3. Reset task to `in_progress`
4. **As worker**: attempt `task_transition` to `cancelled` (risk=5, autonomy=3) → 403 with approval_id
5. **As worker**: retry same transition → 403 with SAME approval_id (idempotency)
6. `GET /approvals/pending` → 1 pending
7. `GET /approvals/{id}` → correct fields (risk_level=5, autonomy_level=3, action_type=task_transition)
8. **As worker**: try to self-approve → 403 (self-approval blocked)
9. **As manager**: approve → 200
10. `GET /approvals/{id}` → status=approved, resolved_by=manager
11. **As manager**: duplicate approval attempt → 400 (already resolved)
12. **As worker**: publish `migration` artifact → 201 with `status=draft` (risk=9, autonomy=3)
13. Verify corresponding approval request exists
14. **As manager (human-like)**: `PUT /artifacts/{id}/status` → `PUBLISHED`, verify `approved_by` set
15. Invalid approval_id → 404
16. **As worker**: reject without notes → 400
17. `GET /approvals?status=approved` → returns the resolved approval
18. `GET /approvals?status=pending` → returns only the artifact approval (if still pending)

- [ ] **Step 2: Run test**

Run: `cd apps/api && uv run pytest tests/test_approvals_e2e.py -v`

- [ ] **Step 3: Commit**

```bash
git add apps/api/tests/test_approvals_e2e.py
git commit -m "test(api): add end-to-end autonomy dial approval test"
```

---

## Chunk 6: Verification + Codegen

### Task 14: Full verification

- [ ] **Step 1: Format**

Run: `cd apps/api && uv run ruff format app/ tests/`

- [ ] **Step 2: Lint**

Run: `cd apps/api && uv run ruff check app/ tests/`

- [ ] **Step 3: Type check**

Run: `cd apps/api && uv run pyright app/`

- [ ] **Step 4: All tests**

Run: `cd apps/api && uv run pytest tests/ -v`

- [ ] **Step 5: Commit any fixes**

### Task 15: OpenAPI spec + codegen

- [ ] **Step 1: Regenerate OpenAPI spec**

Run: `cd apps/api && uv run python -c "import json; from app.main import app; open('openapi.json','w').write(json.dumps(app.openapi(), indent=2))"`

- [ ] **Step 2: Run codegen**

Run: `pnpm run codegen`

- [ ] **Step 3: Commit**

```bash
git add apps/api/openapi.json libs/dashboard-data/src/rest/generated/
git commit -m "chore(api): regenerate OpenAPI spec + TS types for approval endpoints"
```

---

## What's NOT in this spike

- **Dashboard UI** — autonomy slider, approval queue page (Phase 2)
- **ORG.md parser** — org-level autonomy config from markdown (Phase 3)
- **Configurable approver authority** — hardcoded rules for now (Phase 2)
- **Auto-expiry worker** — approvals have `expires_at` but no cron job to expire them (Phase 2)
- **Escalation gating** — only task transitions + artifact publish for now
- **Credit/agent spawn gating** — extensible via `ActionType` enum later
- **Per-artifact-type risk overrides** — risk registry is code-only for now
- **Approval bypass tokens** — approved ApprovalRequest is audit-only, does not auto-bypass gate on retry

## Unresolved Questions

- Should `approval_request` MCP tool exist separately or is it only created internally by gates? (current: both paths — internal gate + explicit MCP tool for agent-initiated requests)
