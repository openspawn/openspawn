# Event Mesh Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove that typed coordination events with subscriptions, replay, and server-side projections can serve as the substrate under the Artifact Bus — i.e., artifacts can be derived as projections over events.

**Architecture:** Extend SSEEventType with coordination event types. Add EventSubscription model (mirrors ArtifactSubscription). Build REST endpoints for coordination (required — MCP tools call REST via ApiClient). Add 4 MCP tools. Implement 3 projections including `artifact_view` to prove the core hypothesis.

**Tech Stack:** FastAPI, SQLAlchemy async, Alembic, existing EventBus/emit() infrastructure, MCP ApiClient

**Core hypothesis:** Can the Artifact Bus (#665) be reimplemented as a projection over coordination events? The `artifact_view` projection answers this.

**Verified against codebase:**

- Column types: `CompatUUID()` for FKs, `UUIDPrimaryKeyMixin` + `TimestampMixin` for models
- emit() returns `None` — service queries by entity_id after emit
- MCP tools call REST via `ApiClient` (not direct DB) — REST endpoints are required
- SQLite compat: use `entity_id = task_id` instead of JSONB path queries
- ForeignKeys use string table names: `ForeignKey("table.column")`
- Tests use AUTH_MODE=none, fixture creates org+agent+task via direct DB

---

## File Structure

| File                                               | Responsibility                                                  |
| -------------------------------------------------- | --------------------------------------------------------------- |
| `app/models/enums.py`                              | Extended SSEEventType with coordination event types             |
| `app/models/event_subscription.py`                 | EventSubscription SQLAlchemy model                              |
| `app/models/__init__.py`                           | Register new model                                              |
| `app/coordination/__init__.py`                     | Package init                                                    |
| `app/coordination/schemas.py`                      | Pydantic DTOs                                                   |
| `app/coordination/projections.py`                  | 3 projections: component_registry, test_coverage, artifact_view |
| `app/coordination/service.py`                      | Business logic: emit, subscribe, replay, project                |
| `app/coordination/router.py`                       | REST endpoints (required for MCP ApiClient)                     |
| `app/main.py`                                      | Register coordination router                                    |
| `app/mcp_server/server.py`                         | 4 MCP tools calling REST via ApiClient                          |
| `alembic/versions/0006_add_event_subscriptions.py` | Migration                                                       |
| `tests/test_projections.py`                        | Projection unit tests (mock Events, no DB)                      |
| `tests/test_event_mesh_e2e.py`                     | Full DoD scenario test                                          |

---

## Chunk 1: Data Model + Migration

### Task 1: CoordinationEventType enum

**Files:**

- Modify: `apps/api/app/models/enums.py`

- [ ] **Step 1: Add coordination event types to SSEEventType**

```python
# In SSEEventType enum, add:
COMPONENT_CREATED = "component.created"
COMPONENT_UPDATED = "component.updated"
TEST_WRITTEN = "test.written"
TEST_PASSED = "test.passed"
TEST_FAILED = "test.failed"
SCREENSHOT_CAPTURED = "screenshot.captured"
API_CONTRACT_DEFINED = "api_contract.defined"
API_CONTRACT_CHANGED = "api_contract.changed"
MIGRATION_CREATED = "migration.created"
DOC_SECTION_WRITTEN = "doc.section.written"
DEPENDENCY_ADDED = "dependency.added"
BUILD_SUCCEEDED = "build.succeeded"
BUILD_FAILED = "build.failed"
```

- [ ] **Step 2: Run existing tests**

Run: `cd apps/api && uv run pytest tests/ -v --tb=short -q`
Expected: All pass (enum extension is additive)

- [ ] **Step 3: Commit**

```bash
git add apps/api/app/models/enums.py
git commit -m "feat(api): add coordination event types to SSEEventType enum"
```

### Task 2: EventSubscription model

**Files:**

- Create: `apps/api/app/models/event_subscription.py`
- Modify: `apps/api/app/models/__init__.py`

- [ ] **Step 1: Write the model**

Uses `CompatUUID()` for all FK columns, `UUIDPrimaryKeyMixin` + `TimestampMixin` for base, matching the Artifact/ArtifactSubscription pattern exactly.

```python
from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.compat import CompatUUID


class EventSubscription(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "event_subscriptions"
    __table_args__ = (
        UniqueConstraint("org_id", "agent_id", "event_pattern", name="uq_event_sub_agent_pattern"),
    )

    org_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("organizations.id"), nullable=False
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(
        CompatUUID(), ForeignKey("agents.id"), nullable=False
    )
    event_pattern: Mapped[str] = mapped_column(String(100), nullable=False)
    task_id: Mapped[uuid.UUID | None] = mapped_column(
        CompatUUID(), ForeignKey("tasks.id"), nullable=True
    )

    agent = relationship("Agent", lazy="selectin")
```

`event_pattern` supports: exact match (`component.created`), wildcard prefix (`component.*`), or global (`*`).

- [ ] **Step 2: Register model in `__init__.py`**

Add import + `__all__` entry matching existing pattern.

- [ ] **Step 3: Commit**

```bash
git add apps/api/app/models/event_subscription.py apps/api/app/models/__init__.py
git commit -m "feat(api): add EventSubscription model"
```

### Task 3: Alembic migration

**Files:**

- Create: `apps/api/alembic/versions/0006_add_event_subscriptions.py`

- [ ] **Step 1: Generate migration**

Run: `cd apps/api && uv run alembic revision --autogenerate -m "add_event_subscriptions"`

- [ ] **Step 2: Review generated migration**

Verify: `event_subscriptions` table with unique constraint, 3 FKs (organizations, agents, tasks).

- [ ] **Step 3: Run migration**

Run: `cd apps/api && uv run alembic upgrade head`

- [ ] **Step 4: Commit**

```bash
git add apps/api/alembic/versions/0006_*
git commit -m "feat(api): add event_subscriptions migration"
```

---

## Chunk 2: Service Layer + Projections + REST

### Task 4: Schemas + package init

**Files:**

- Create: `apps/api/app/coordination/__init__.py` (empty)
- Create: `apps/api/app/coordination/schemas.py`

- [ ] **Step 1: Create schemas**

```python
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel


class EmitEventDto(BaseModel):
    event_type: str
    payload: dict
    task_id: uuid.UUID
    entity_name: str | None = None


class SubscribeDto(BaseModel):
    event_pattern: str
    task_id: uuid.UUID | None = None


class ReplayDto(BaseModel):
    task_id: uuid.UUID
    since: datetime | None = None
    event_types: list[str] | None = None
    limit: int = 500


class EventSubscriptionResponse(BaseModel):
    id: uuid.UUID
    agent_id: uuid.UUID
    event_pattern: str
    task_id: uuid.UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/app/coordination/
git commit -m "feat(api): add coordination schemas"
```

### Task 5: Projections (3 functions including artifact_view)

**Files:**

- Create: `apps/api/app/coordination/projections.py`

- [ ] **Step 1: Write 3 projection functions**

```python
from __future__ import annotations

from app.models.event import Event


def project_component_registry(events: list[Event]) -> dict:
    components: dict[str, dict] = {}

    for event in events:
        if event.type not in ("component.created", "component.updated"):
            continue
        payload = (event.data or {}).get("payload", {})
        name = payload.get("name")
        if not name:
            continue

        if name not in components:
            components[name] = {
                "name": name,
                "file_path": payload.get("file_path"),
                "test_ids": payload.get("test_ids", []),
                "props": payload.get("props", []),
                "route": payload.get("route"),
                "version": 1,
                "last_updated_by": str(event.actor_id),
                "created_at": str(event.created_at),
            }
        else:
            entry = components[name]
            entry["version"] += 1
            entry["last_updated_by"] = str(event.actor_id)
            entry["updated_at"] = str(event.created_at)
            for key in ("file_path", "test_ids", "props", "route"):
                if key in payload:
                    entry[key] = payload[key]

    return {"components": components, "count": len(components)}


def project_test_coverage(events: list[Event]) -> dict:
    components: dict[str, dict] = {}
    tests: dict[str, dict] = {}

    for event in events:
        payload = (event.data or {}).get("payload", {})

        if event.type in ("component.created", "component.updated"):
            name = payload.get("name")
            if name:
                components[name] = {
                    "test_ids": payload.get("test_ids", []),
                    "has_tests": False,
                }

        elif event.type == "test.written":
            covers = payload.get("covers_component")
            test_file = payload.get("test_file", "unknown")
            if covers and covers in components:
                components[covers]["has_tests"] = True
            tests[test_file] = {
                "covers_component": covers,
                "test_ids_used": payload.get("test_ids_used", []),
                "scenarios": payload.get("scenarios", []),
            }

    covered = sum(1 for c in components.values() if c["has_tests"])
    total = len(components)

    return {
        "components": components,
        "tests": tests,
        "coverage_ratio": covered / total if total > 0 else 0,
        "covered_count": covered,
        "total_components": total,
    }


def project_artifact_view(events: list[Event]) -> dict:
    """Hypothesis test: derive artifact-like objects from coordination events.
    Proves Artifact Bus could be reimplemented as a projection over events."""
    artifacts: dict[str, dict] = {}

    for event in events:
        payload = (event.data or {}).get("payload", {})
        entity_name = (event.data or {}).get("entity_name")
        name = entity_name or payload.get("name")
        if not name:
            continue

        artifact_type = _event_type_to_artifact_type(event.type)
        if not artifact_type:
            continue

        key = f"{artifact_type}:{name}"

        if key not in artifacts:
            artifacts[key] = {
                "artifact_type": artifact_type,
                "name": name,
                "version": 1,
                "content": payload,
                "producer_agent_id": str(event.actor_id),
                "status": "published",
                "created_at": str(event.created_at),
                "updated_at": str(event.created_at),
            }
        else:
            entry = artifacts[key]
            entry["version"] += 1
            entry["content"] = payload
            entry["updated_at"] = str(event.created_at)
            entry["producer_agent_id"] = str(event.actor_id)

    return {
        "artifacts": list(artifacts.values()),
        "count": len(artifacts),
        "hypothesis": "Artifact Bus state can be derived from coordination events",
    }


_EVENT_TO_ARTIFACT = {
    "component.created": "component",
    "component.updated": "component",
    "test.written": "test_plan",
    "screenshot.captured": "screenshot",
    "api_contract.defined": "api_contract",
    "api_contract.changed": "api_contract",
    "migration.created": "migration",
    "doc.section.written": "doc_section",
}


def _event_type_to_artifact_type(event_type: str) -> str | None:
    return _EVENT_TO_ARTIFACT.get(event_type)
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/app/coordination/projections.py
git commit -m "feat(api): add 3 projections including artifact_view hypothesis test"
```

### Task 6: Service layer

**Files:**

- Create: `apps/api/app/coordination/service.py`

Key design: uses `entity_id = task_id` for all coordination events (SQLite compatible). emit() returns None, so we don't try to return the Event object — just return success.

- [ ] **Step 1: Write service**

```python
from __future__ import annotations

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.coordination.projections import (
    project_artifact_view,
    project_component_registry,
    project_test_coverage,
)
from app.coordination.schemas import EmitEventDto, ReplayDto, SubscribeDto
from app.events.emit import emit
from app.models.enums import SSEEventType
from app.models.event import Event
from app.models.event_subscription import EventSubscription

PROJECTION_REGISTRY = {
    "component_registry": project_component_registry,
    "test_coverage": project_test_coverage,
    "artifact_view": project_artifact_view,
}


async def emit_coordination_event(
    db: AsyncSession, org_id: uuid.UUID, actor_id: uuid.UUID, dto: EmitEventDto
) -> None:
    try:
        event_type = SSEEventType(dto.event_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown event type: {dto.event_type}",
        )

    targets = await _resolve_event_subscribers(db, org_id, dto.event_type, dto.task_id)

    # entity_id = task_id for coordination events (SQLite compatible, indexed)
    await emit(
        db=db,
        type=event_type,
        org_id=org_id,
        actor_id=actor_id,
        entity_type=dto.event_type.split(".")[0],
        entity_id=dto.task_id,
        data={
            "payload": dto.payload,
            "entity_name": dto.entity_name,
        },
        target_agents=targets if targets else None,
    )


async def subscribe_to_events(
    db: AsyncSession, org_id: uuid.UUID, agent_id: uuid.UUID, dto: SubscribeDto
) -> EventSubscription:
    existing = await db.execute(
        select(EventSubscription).where(
            EventSubscription.org_id == org_id,
            EventSubscription.agent_id == agent_id,
            EventSubscription.event_pattern == dto.event_pattern,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Subscription already exists",
        )

    sub = EventSubscription(
        org_id=org_id,
        agent_id=agent_id,
        event_pattern=dto.event_pattern,
        task_id=dto.task_id,
    )
    db.add(sub)
    await db.flush()
    await db.refresh(sub)
    return sub


async def replay_events(
    db: AsyncSession, org_id: uuid.UUID, dto: ReplayDto
) -> list[Event]:
    # entity_id = task_id for coordination events — works on SQLite + PostgreSQL
    q = select(Event).where(
        Event.org_id == org_id,
        Event.entity_id == dto.task_id,
    )

    if dto.since:
        q = q.where(Event.created_at >= dto.since)

    if dto.event_types:
        q = q.where(Event.type.in_(dto.event_types))

    q = q.order_by(Event.created_at.asc()).limit(dto.limit)
    result = await db.execute(q)
    return list(result.scalars().all())


async def get_projection(
    db: AsyncSession, org_id: uuid.UUID, task_id: uuid.UUID, projection_type: str
) -> dict:
    if projection_type not in PROJECTION_REGISTRY:
        valid = ", ".join(PROJECTION_REGISTRY.keys())
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown projection: {projection_type}. Valid: {valid}",
        )

    # On-demand rebuild — no caching. Fine for <1000 events per task.
    events = await db.execute(
        select(Event)
        .where(Event.org_id == org_id, Event.entity_id == task_id)
        .order_by(Event.created_at.asc())
    )
    event_list = list(events.scalars().all())
    return PROJECTION_REGISTRY[projection_type](event_list)


async def _resolve_event_subscribers(
    db: AsyncSession, org_id: uuid.UUID, event_type: str, task_id: uuid.UUID
) -> list[str]:
    result = await db.execute(
        select(EventSubscription).where(
            EventSubscription.org_id == org_id,
            (EventSubscription.task_id == task_id) | (EventSubscription.task_id.is_(None)),
        )
    )
    subs = result.scalars().all()

    matched: set[str] = set()
    for sub in subs:
        if _matches_pattern(event_type, sub.event_pattern):
            matched.add(str(sub.agent_id))

    return list(matched)


def _matches_pattern(event_type: str, pattern: str) -> bool:
    if pattern == "*":
        return True
    if pattern == event_type:
        return True
    if pattern.endswith(".*"):
        prefix = pattern[:-2]
        if event_type.startswith(prefix + "."):
            return True
    return False
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/app/coordination/service.py
git commit -m "feat(api): add coordination service (SQLite compatible, entity_id=task_id)"
```

### Task 7: REST router + registration

**Files:**

- Create: `apps/api/app/coordination/router.py`
- Modify: `apps/api/app/main.py`

REST endpoints are required — MCP tools call REST via ApiClient.

- [ ] **Step 1: Create router**

```python
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

import app.coordination.service as service
from app.auth.dependencies import AuthContext, require_auth
from app.coordination.schemas import (
    EmitEventDto,
    EventSubscriptionResponse,
    ReplayDto,
    SubscribeDto,
)
from app.database import get_db
from app.schemas import DataMessageResponse, DataResponse

router = APIRouter(prefix="/coordination", tags=["coordination"])


@router.post("/emit")
async def emit_event(
    dto: EmitEventDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataMessageResponse[dict]:
    await service.emit_coordination_event(db, auth.org_id, auth.id, dto)
    await db.commit()
    return DataMessageResponse(
        data={"event_type": dto.event_type, "task_id": str(dto.task_id)},
        message="Event emitted",
    )


@router.post("/subscribe", status_code=201)
async def subscribe(
    dto: SubscribeDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[EventSubscriptionResponse]:
    sub = await service.subscribe_to_events(db, auth.org_id, auth.id, dto)
    await db.commit()
    return DataResponse(data=EventSubscriptionResponse.model_validate(sub))


@router.post("/replay")
async def replay(
    dto: ReplayDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[list[dict]]:
    events = await service.replay_events(db, auth.org_id, dto)
    return DataResponse(
        data=[
            {
                "id": str(e.id),
                "type": e.type,
                "data": e.data,
                "actor_id": str(e.actor_id),
                "entity_id": str(e.entity_id),
                "created_at": str(e.created_at),
            }
            for e in events
        ]
    )


@router.get("/project")
async def project(
    task_id: str = Query(...),
    projection_type: str = Query(...),
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[dict]:
    import uuid

    result = await service.get_projection(db, auth.org_id, uuid.UUID(task_id), projection_type)
    return DataResponse(data=result)
```

- [ ] **Step 2: Register in main.py**

Add after existing routers:

```python
from app.coordination.router import router as coordination_router
# ... in router registration section:
app.include_router(coordination_router)
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/app/coordination/router.py apps/api/app/main.py
git commit -m "feat(api): add coordination REST endpoints"
```

---

## Chunk 3: MCP Tools

### Task 8: Add 4 MCP tools

**Files:**

- Modify: `apps/api/app/mcp_server/server.py`

MCP tools call REST endpoints via `_get_client()` — matching the `artifact_*` tool pattern exactly.

- [ ] **Step 1: Add 4 coordination tools**

```python
@mcp.tool
async def coordination_emit(
    event_type: str,
    payload_json: str,
    task_id: str,
    entity_name: str | None = None,
) -> str:
    """Emit a typed coordination event (e.g., component.created, test.written)."""
    body: dict[str, object] = {
        "event_type": event_type,
        "payload": json.loads(payload_json),
        "task_id": task_id,
    }
    if entity_name:
        body["entity_name"] = entity_name
    result = await _get_client().post("/coordination/emit", json=body)
    return _format(result)


@mcp.tool
async def coordination_subscribe(
    event_pattern: str,
    task_id: str | None = None,
) -> str:
    """Subscribe to coordination events. Pattern: exact (component.created), wildcard (component.*), or all (*)."""
    body: dict[str, object] = {"event_pattern": event_pattern}
    if task_id:
        body["task_id"] = task_id
    result = await _get_client().post("/coordination/subscribe", json=body)
    return _format(result)


@mcp.tool
async def coordination_replay(
    task_id: str,
    event_types: str | None = None,
    limit: int = 500,
) -> str:
    """Replay coordination events for a task. Catch up to current state after joining mid-stream."""
    body: dict[str, object] = {"task_id": task_id, "limit": limit}
    if event_types:
        body["event_types"] = [t.strip() for t in event_types.split(",")]
    result = await _get_client().post("/coordination/replay", json=body)
    return _format(result)


@mcp.tool
async def coordination_project(
    task_id: str,
    projection_type: str,
) -> str:
    """Get derived state from coordination events. Types: component_registry, test_coverage, artifact_view."""
    result = await _get_client().get(
        "/coordination/project", params={"task_id": task_id, "projection_type": projection_type}
    )
    return _format(result)
```

- [ ] **Step 2: Run tests**

Run: `cd apps/api && uv run pytest tests/ -v --tb=short -q`

- [ ] **Step 3: Commit**

```bash
git add apps/api/app/mcp_server/server.py
git commit -m "feat(api): add 4 coordination MCP tools via ApiClient"
```

---

## Chunk 4: Tests

### Task 9: Projection unit tests

**Files:**

- Create: `apps/api/tests/test_projections.py`

- [ ] **Step 1: Write tests**

Test all 3 projections with mock Event objects (no DB needed). Create simple Event-like objects with `type`, `data`, `actor_id`, `created_at` attributes.

**component_registry tests:**

- Empty events → `count: 0`
- Single `component.created` → component appears, `version: 1`
- `component.created` + `component.updated` same name → `version: 2`, fields merged
- Non-component events ignored

**test_coverage tests:**

- `component.created` alone → `has_tests: False`, `coverage_ratio: 0`
- `component.created` + `test.written` referencing it → `has_tests: True`, `coverage_ratio: 1.0`
- 2 components, 1 tested → `coverage_ratio: 0.5`

**artifact_view tests (hypothesis):**

- `component.created` → artifact with `artifact_type: "component"`, `version: 1`, `status: "published"`
- `component.created` + `component.updated` → `version: 2`, content updated
- `test.written` → `artifact_type: "test_plan"`
- `screenshot.captured` → `artifact_type: "screenshot"`
- `build.succeeded` → ignored (no artifact mapping), `count: 0`
- Verify output shape matches Artifact Bus structure

- [ ] **Step 2: Run tests**

Run: `cd apps/api && uv run pytest tests/test_projections.py -v`

- [ ] **Step 3: Commit**

```bash
git add apps/api/tests/test_projections.py
git commit -m "test(api): add projection unit tests including artifact_view hypothesis"
```

### Task 10: End-to-end spike test

**Files:**

- Create: `apps/api/tests/test_event_mesh_e2e.py`

Uses the same fixture pattern as `test_artifact_integration.py`: create org+agents+task via direct DB, `AUTH_MODE=none`.

- [ ] **Step 1: Write the full DoD scenario**

```
1. Fixture: create org, 3 agents (dev, test, docs), 1 parent task
2. Test agent subscribes to "component.*"
3. Docs agent subscribes to "*"
4. Dev agent emits "component.created" for SubmitButton (with test_ids, props, route)
5. Dev agent emits "component.created" for CheckoutForm
6. Test agent replays events → receives both component events in order
7. Test agent emits "test.written" covering SubmitButton
8. Docs agent emits "screenshot.captured" for SubmitButton
9. GET component_registry projection → both components present, correct versions
10. GET test_coverage projection → SubmitButton covered, CheckoutForm not, ratio=0.5
11. GET artifact_view projection → 4 artifacts derived (2 components, 1 test_plan, 1 screenshot)
12. New agent replays all events → catches up to full state
13. Duplicate subscription → 409
14. Invalid event type → 400
15. Unknown projection → 400
```

- [ ] **Step 2: Run test**

Run: `cd apps/api && uv run pytest tests/test_event_mesh_e2e.py -v`

- [ ] **Step 3: Commit**

```bash
git add apps/api/tests/test_event_mesh_e2e.py
git commit -m "test(api): add end-to-end event mesh spike test (DoD scenario)"
```

---

## Chunk 5: Verification + Codegen

### Task 11: Full verification

- [ ] **Step 1: Format**

Run: `cd apps/api && uv run ruff format app/ tests/`

- [ ] **Step 2: Lint**

Run: `cd apps/api && uv run ruff check app/ tests/`

- [ ] **Step 3: Type check**

Run: `cd apps/api && uv run pyright app/`

- [ ] **Step 4: All tests**

Run: `cd apps/api && uv run pytest tests/ -v`

- [ ] **Step 5: Commit any fixes**

### Task 12: OpenAPI spec + codegen

New REST endpoints need to be in the generated schema for dashboard types.

- [ ] **Step 1: Regenerate OpenAPI spec**

Run: `cd apps/api && uv run python -c "import json; from app.main import app; print(json.dumps(app.openapi()))" > openapi.json`

- [ ] **Step 2: Run codegen**

Run: `pnpm run codegen`

- [ ] **Step 3: Commit**

```bash
git add apps/api/openapi.json libs/dashboard-data/src/rest/generated/
git commit -m "chore: regenerate OpenAPI spec + TS types for coordination endpoints"
```

### Task 13: Spike findings document

Document whether the hypothesis held: can artifacts be derived as projections over events?

- [ ] **Step 1: Write findings**

Create `docs/openspawn/spikes/2026-03-14-event-mesh-findings.md` with:

- Hypothesis: artifacts as projections over events
- Result: artifact_view projection output vs Artifact Bus output
- Trade-offs: event sourcing vs direct artifact storage
- Recommendation: events as substrate, artifacts as projection, or keep both independent
- Performance notes: projection rebuild cost at scale

- [ ] **Step 2: Commit**

```bash
git add docs/openspawn/spikes/
git commit -m "docs(spike): event mesh findings — artifacts as projections (#666)"
```

---

## What's NOT in this plan

- **#667 research doc** — independent, separate PR
- **#668 autonomy dial** — depends on spike outcome, separate issue
- **Dashboard visualization** — deferred until spike validates approach
- **Projection caching** — on-demand rebuild is fine for spike scale
- **Event schema evolution** — future concern, noted in findings doc
