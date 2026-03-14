# Artifact Bus Design Spec

Part of #664 (Inter-Agent Coordination Architecture). Implements #665.

## Problem

Parallel agent execution streams (dev, tests, docs) produce and consume shared work products — component interfaces, test IDs, API schemas, screenshots. No mechanism exists for Agent A to publish a typed, versioned artifact and Agent B to be notified in real-time.

## Solution

First-class **Artifact** model with typed columns + JSONB content, subscription-based SSE delivery, and MCP tools for agent access.

## Data Model

### Artifact

```python
class Artifact(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "artifacts"
    __table_args__ = (
        Index("ix_artifacts_org_type", "org_id", "artifact_type"),
        Index("ix_artifacts_org_name", "org_id", "name"),
        UniqueConstraint("org_id", "name", "version", name="uq_artifact_name_version"),
    )

    org_id: UUID
    task_id: UUID                    # FK tasks
    producer_agent_id: UUID          # FK agents
    artifact_type: str               # ArtifactType enum
    name: str                        # e.g. "SubmitButton"
    version: int                     # monotonic per (org, name), starts at 1
    status: str                      # ArtifactStatus enum
    content: dict                    # JSONB — type-specific payload
    content_hash: str                # SHA-256 of canonical JSON
    metadata_: dict                  # JSONB — tags, labels
    source_artifact_ids: list[UUID]  # CompatArray — lineage references
    superseded_by_id: UUID | None    # forward pointer to newer version
    approved_by: str | None          # placeholder for autonomy dial (#668)
    approved_at: datetime | None     # placeholder for autonomy dial (#668)
```

### ArtifactSubscription

```python
class ArtifactSubscription(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "artifact_subscriptions"
    __table_args__ = (
        UniqueConstraint("org_id", "agent_id", "artifact_type", name="uq_sub_agent_type"),
    )

    org_id: UUID
    agent_id: UUID           # FK agents
    artifact_type: str       # filter by type, or "*" for all
    task_id: UUID | None     # optional scope to a task tree
    created_at: datetime
```

### Enums

```python
class ArtifactType(StrEnum):
    COMPONENT = "component"
    TEST_PLAN = "test_plan"
    SCREENSHOT = "screenshot"
    API_CONTRACT = "api_contract"
    MIGRATION = "migration"
    SCHEMA = "schema"
    DOC_SECTION = "doc_section"

class ArtifactStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    SUPERSEDED = "superseded"
```

### Key Behaviors

- Publishing a new version auto-supersedes the previous version (sets `superseded_by_id`)
- Version auto-incremented: `MAX(version) + 1 WHERE org_id=? AND name=?`
- Duplicate content (same `content_hash`) skips version bump, returns existing artifact
- Canonical hash: `sha256(json.dumps(content, sort_keys=True))`

## REST API

| Method | Path | Purpose |
|--------|------|---------|
| POST | /artifacts | Publish single artifact |
| POST | /artifacts/batch | Publish multiple, grouped SSE |
| GET | /artifacts | List with filters: type, name, task_id, status, producer_agent_id |
| GET | /artifacts/latest | Latest published version by name |
| GET | /artifacts/{id} | Get single artifact |
| GET | /artifacts/{id}/history | All versions by name |
| PUT | /artifacts/{id}/status | Transition status |
| POST | /artifacts/subscribe | Create subscription |
| GET | /artifacts/subscriptions | List agent's subscriptions |
| DELETE | /artifacts/subscriptions/{id} | Remove subscription |

### Publish Flow

1. Hash content → SHA-256 (canonical JSON, sorted keys)
2. Check if latest version of (org, name) has same hash → return existing if duplicate
3. Auto-increment version
4. Set previous version's `superseded_by_id` → new artifact ID
5. Insert artifact with `status=published`
6. Query matching subscriptions → resolve target agent IDs
7. `emit()` with `target_agents` list → SSE push
8. Return artifact with version number

### Request Schemas

```python
class PublishArtifactDto(BaseModel):
    artifact_type: ArtifactType
    name: str = Field(max_length=200)
    content: dict
    task_id: UUID
    source_artifact_ids: list[UUID] = Field(default_factory=list)
    metadata: dict = Field(default_factory=dict)

class UpdateStatusDto(BaseModel):
    status: ArtifactStatus
```

## MCP Tools

| Tool | Params | Maps to |
|------|--------|---------|
| artifact_publish | type, name, content_json, task_id, source_artifact_ids?, metadata_json? | POST /artifacts |
| artifact_get | artifact_id?, name? | GET /artifacts/{id} or /latest |
| artifact_list | task_id?, type?, status?, producer_agent_id? | GET /artifacts |
| artifact_subscribe | artifact_type, task_id? | POST /artifacts/subscribe |
| artifact_history | name | GET /artifacts/{id}/history |

`content_json` accepted as string, parsed + validated server-side. One tool for publish and update (auto-versions on existing name).

## SSE Integration

Builds on #670 SSE infrastructure.

### Event Types (already defined)

- `artifact.published` — new artifact or new version
- `artifact.updated` — status change
- `artifact.batch_published` — batch publish (new)

### Subscription-Aware Delivery

At publish time, query matching `ArtifactSubscription` rows:

```python
subs = select(ArtifactSubscription).where(
    org_id == artifact.org_id,
    artifact_type.in_([artifact.artifact_type, "*"]),
    (task_id IS NULL OR task_id == artifact.task_id),
)
target_agents = [str(s.agent_id) for s in subs]
emit(..., target_agents=target_agents if target_agents else None)
```

No subscriptions → broadcast (dashboard sees everything). Subscriptions exist → targeted delivery.

### SSE Payload

Include full content in SSE payload (saves follow-up `artifact_get`). Cap at 100KB; above that, `content: null` + `content_truncated: true`.

### Batch Events

`POST /artifacts/batch` emits single `artifact.batch_published` event with `data.artifacts: [...]` instead of N separate events.

## Testing

### Unit Tests (test_artifact_bus.py)

- Publish creates v1
- Existing name increments version
- Supersedes previous version
- Duplicate content hash skips version bump
- Batch publish creates all + returns list
- Status transitions (draft→published, published→superseded)
- Invalid status transition raises 400
- Subscription filters by type
- Subscription with task_id scoping
- Content hash deterministic (key order independent)

### Integration Tests (test_artifact_integration.py)

- Full CRUD lifecycle on SQLite
- `/latest` returns highest published version
- Auth gate: 401 without creds
- Subscription → emit → targeted SSE delivery
- Batch publish emits grouped SSE event
- Source artifact IDs creates lineage chain
- **E2E coordination flow**: dev publishes component → test agent's subscription fires → test agent publishes test plan referencing component → verify lineage query

### Edge Cases

- Concurrent publish race condition: unique constraint prevents duplicate versions
- Content hash with nested dict key ordering: canonical serialization

## Files to Create/Modify

### New Files

- `apps/api/app/models/artifact.py` — Artifact + ArtifactSubscription models
- `apps/api/app/artifacts/__init__.py`
- `apps/api/app/artifacts/schemas.py` — DTOs + responses
- `apps/api/app/artifacts/router.py` — REST endpoints
- `apps/api/alembic/versions/0005_add_artifacts_tables.py` — migration
- `apps/api/tests/test_artifact_bus.py` — unit tests
- `apps/api/tests/test_artifact_integration.py` — integration tests

### Modified Files

- `apps/api/app/models/enums.py` — add ArtifactType, ArtifactStatus, ARTIFACTS_BATCH_PUBLISHED
- `apps/api/app/mcp_server/server.py` — add 5 artifact tools
- `apps/api/app/main.py` — register artifacts_router
