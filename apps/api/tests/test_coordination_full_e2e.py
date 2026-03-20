"""Full end-to-end coordination integration test (#664).

Success criterion from the epic:
> One spike demonstrates end-to-end: dev agent publishes testid →
> test agent consumes it → docs agent captures screenshot —
> all within a single session.

This test creates a realistic 3-agent org (dev L7, test L5, docs L5),
creates a parent task, and exercises the full coordination flow:

1. Dev agent emits ComponentCreated with testids
2. Test agent subscribes to component events, receives them, publishes TestWritten artifact
3. Docs agent subscribes to component events, publishes DocSection artifact
4. Verifies component_registry projection shows component with test coverage
5. Verifies all 3 artifacts exist and are linked to the parent task

Uses SQLite in-memory DB + FastAPI TestClient (same pattern as test_event_mesh_e2e.py).
"""

from __future__ import annotations

import contextlib
import os
import uuid
from typing import TYPE_CHECKING
from unittest.mock import patch

import pytest
from httpx import ASGITransport, AsyncClient

if TYPE_CHECKING:
    from collections.abc import AsyncGenerator

# Fixed IDs for deterministic testing
_ORG_ID = "00000000-0000-0000-0000-000000000100"
_OWNER_ID = "00000000-0000-0000-0000-000000000101"
_DEV_AGENT_ID = "00000000-0000-0000-0000-000000000102"
_TEST_AGENT_ID = "00000000-0000-0000-0000-000000000103"
_DOCS_AGENT_ID = "00000000-0000-0000-0000-000000000104"
_TASK_ID = "00000000-0000-0000-0000-000000000200"


# ── Agent identity helper ─────────────────────────────────────────────────


@contextlib.contextmanager
def as_agent(agent_id: str, org_id: str, name: str, level: int = 5):
    """Override require_auth to return an AuthenticatedAgent for a specific agent."""
    from app.auth.dependencies import require_auth
    from app.auth.schemas import AuthenticatedAgent
    from app.main import app

    original = app.dependency_overrides.get(require_auth)
    app.dependency_overrides[require_auth] = lambda: AuthenticatedAgent(
        id=uuid.UUID(agent_id),
        org_id=uuid.UUID(org_id),
        agent_id=f"agent-{name.lower().replace(' ', '-')}",
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


# ── Fixtures ──────────────────────────────────────────────────────────────


@pytest.fixture(autouse=True)
def _sqlite_env():
    """AUTH_MODE=none so we can call endpoints without JWT setup."""
    env = {
        "AUTH_MODE": "none",
        "AUTH_JWT_SECRET": "test-secret-32-chars-long-enough!",
    }
    with patch.dict(os.environ, env, clear=False):
        from importlib import reload

        import app.config

        reload(app.config)
        yield
        reload(app.config)


@pytest.fixture
async def client(tmp_path) -> AsyncGenerator[AsyncClient]:
    """AsyncClient backed by a fresh SQLite DB with all tables created."""
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
    from sqlalchemy.pool import StaticPool

    # Ensure all models are imported so Base.metadata has all tables
    import app.models.artifact
    import app.models.event_subscription
    from app.database import get_db
    from app.models.base import Base

    db_path = tmp_path / "test.db"
    engine = create_async_engine(
        f"sqlite+aiosqlite:///{db_path}",
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    # Patch PostgreSQL-specific column types for SQLite compatibility
    from sqlalchemy.dialects.postgresql import UUID as PG_UUID

    from app.models.compat import CompatUUID

    originals: list[tuple[object, object]] = []
    for table in Base.metadata.tables.values():
        for col in table.columns:
            if col.computed is not None:
                originals.append((col, ("computed", col.computed, col.server_default)))
                col.computed = None  # type: ignore[assignment]
                col.server_default = None
            if isinstance(col.type, PG_UUID):
                originals.append((col, ("type", col.type)))
                col.type = CompatUUID()  # type: ignore[assignment]

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async def _override_get_db():  # type: ignore[no-untyped-def]
        async with session_factory() as session:
            yield session

    from app.main import app

    app.dependency_overrides[get_db] = _override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as c:
        yield c

    app.dependency_overrides.pop(get_db, None)
    await engine.dispose()

    # Restore original column types
    for col, saved in originals:
        if saved[0] == "computed":
            col.computed = saved[1]  # type: ignore[union-attr]
            col.server_default = saved[2]  # type: ignore[union-attr]
        elif saved[0] == "type":
            col.type = saved[1]  # type: ignore[union-attr]


@pytest.fixture
async def seeded(client: AsyncClient) -> AsyncClient:
    """Seed the DB with an org, 3 agents (dev L7, test L5, docs L5), and a parent task."""
    from app.database import get_db
    from app.main import app
    from app.models.agent import Agent
    from app.models.organization import Organization
    from app.models.task import Task

    override_fn = app.dependency_overrides[get_db]
    db_gen = override_fn()
    db = await db_gen.__anext__()

    org = Organization(
        id=uuid.UUID(_ORG_ID),
        name="Coordination Test Org",
        slug="coord-test",
        task_prefix="CT",
        next_task_number=2,
    )
    db.add(org)
    await db.flush()

    agents = [
        (_OWNER_ID, "Owner", "lead", 7),
        (_DEV_AGENT_ID, "Dev Agent", "worker", 7),
        (_TEST_AGENT_ID, "Test Agent", "worker", 5),
        (_DOCS_AGENT_ID, "Docs Agent", "worker", 5),
    ]
    for agent_id, name, role, level in agents:
        agent = Agent(
            id=uuid.UUID(agent_id),
            org_id=org.id,
            agent_id=f"agent-{name.lower().replace(' ', '-')}",
            name=name,
            level=level,
            model="sonnet",
            status="active",
            role=role,
            mode="worker",
            hmac_secret_enc=b"\x00" * 32,
        )
        db.add(agent)
    await db.flush()

    task = Task(
        id=uuid.UUID(_TASK_ID),
        org_id=org.id,
        identifier="CT-1",
        title="Build checkout flow",
        status="in_progress",
        priority="high",
        creator_id=uuid.UUID(_OWNER_ID),
    )
    db.add(task)
    await db.commit()

    with contextlib.suppress(StopAsyncIteration):
        await db_gen.__anext__()

    return client


# ── Main E2E Test ─────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_e2e_coordination_three_agents(seeded: AsyncClient):
    """Full DoD scenario for epic #664.

    Dev publishes component with testids → Test agent consumes and writes tests
    → Docs agent consumes and writes doc section → projections verified →
    artifacts verified.
    """
    c = seeded

    # ── Step 1: Test agent subscribes to component.* events ───────────
    with as_agent(_TEST_AGENT_ID, _ORG_ID, "Test Agent", level=5):
        r = await c.post(
            "/coordination/subscribe",
            json={"event_pattern": "component.*", "task_id": _TASK_ID},
        )
        assert r.status_code == 201, f"Test agent subscribe failed: {r.text}"

    # ── Step 2: Docs agent subscribes to all events (wildcard) ──────────
    with as_agent(_DOCS_AGENT_ID, _ORG_ID, "Docs Agent", level=5):
        r = await c.post(
            "/coordination/subscribe",
            json={"event_pattern": "*"},
        )
        assert r.status_code == 201, f"Docs agent subscribe failed: {r.text}"

    # ── Step 3: Dev agent emits ComponentCreated with testids ─────────
    with as_agent(_DEV_AGENT_ID, _ORG_ID, "Dev Agent", level=7):
        r = await c.post(
            "/coordination/emit",
            json={
                "event_type": "component.created",
                "payload": {
                    "name": "CheckoutForm",
                    "file_path": "src/components/CheckoutForm.tsx",
                    "test_ids": ["checkout-form", "checkout-submit-btn", "checkout-total"],
                    "props": [
                        {"name": "onSubmit", "type": "(data: FormData) => Promise<void>"},
                        {"name": "cartItems", "type": "CartItem[]"},
                    ],
                    "route": "/checkout",
                },
                "task_id": _TASK_ID,
                "entity_name": "CheckoutForm",
            },
        )
        assert r.status_code == 200, f"Dev emit failed: {r.text}"
        assert r.json()["message"] == "Event emitted"

    # ── Step 4: Test agent replays to discover the component ──────────
    with as_agent(_TEST_AGENT_ID, _ORG_ID, "Test Agent", level=5):
        r = await c.post(
            "/coordination/replay",
            json={"task_id": _TASK_ID},
        )
        assert r.status_code == 200
        events = r.json()["data"]
        assert len(events) == 1
        assert events[0]["type"] == "component.created"
        component_payload = events[0]["data"]["payload"]
        assert component_payload["name"] == "CheckoutForm"
        assert "checkout-form" in component_payload["test_ids"]

    # ── Step 5: Test agent emits test.written for CheckoutForm ────────
    with as_agent(_TEST_AGENT_ID, _ORG_ID, "Test Agent", level=5):
        r = await c.post(
            "/coordination/emit",
            json={
                "event_type": "test.written",
                "payload": {
                    "covers_component": "CheckoutForm",
                    "test_file": "CheckoutForm.spec.tsx",
                    "test_ids_used": ["checkout-form", "checkout-submit-btn"],
                    "scenarios": [
                        "renders form with cart items",
                        "validates required fields",
                        "submits form data",
                        "displays total correctly",
                    ],
                },
                "task_id": _TASK_ID,
                "entity_name": "checkout-form-tests",
            },
        )
        assert r.status_code == 200, f"Test agent emit failed: {r.text}"

    # ── Step 6: Test agent publishes TestWritten artifact ─────────────
    with as_agent(_TEST_AGENT_ID, _ORG_ID, "Test Agent", level=5):
        r = await c.post(
            "/artifacts",
            json={
                "artifact_type": "test_plan",
                "name": "CheckoutForm-tests",
                "content": {
                    "covers_component": "CheckoutForm",
                    "test_file": "CheckoutForm.spec.tsx",
                    "test_ids_used": ["checkout-form", "checkout-submit-btn"],
                    "scenarios": [
                        "renders form with cart items",
                        "validates required fields",
                        "submits form data",
                        "displays total correctly",
                    ],
                    "framework": "vitest",
                },
                "task_id": _TASK_ID,
                "metadata": {"generated_by": "test-agent", "confidence": 0.95},
            },
        )
        assert r.status_code == 201, f"Test artifact publish failed: {r.text}"
        test_artifact = r.json()["data"]
        assert test_artifact["artifact_type"] == "test_plan"
        assert test_artifact["version"] == 1
        test_artifact_id = test_artifact["id"]

    # ── Step 7: Docs agent emits doc.section.written ──────────────────
    with as_agent(_DOCS_AGENT_ID, _ORG_ID, "Docs Agent", level=5):
        r = await c.post(
            "/coordination/emit",
            json={
                "event_type": "doc.section.written",
                "payload": {
                    "name": "CheckoutForm",
                    "section": "Components > CheckoutForm",
                    "content_md": "## CheckoutForm\n\nHandles the checkout flow...",
                },
                "task_id": _TASK_ID,
                "entity_name": "CheckoutForm-docs",
            },
        )
        assert r.status_code == 200, f"Docs agent event emit failed: {r.text}"

    # ── Step 8: Docs agent publishes DocSection artifact ──────────────
    with as_agent(_DOCS_AGENT_ID, _ORG_ID, "Docs Agent", level=5):
        r = await c.post(
            "/artifacts",
            json={
                "artifact_type": "doc_section",
                "name": "CheckoutForm-docs",
                "content": {
                    "section": "Components > CheckoutForm",
                    "content_md": (
                        "## CheckoutForm\n\n"
                        "Handles the checkout flow with form validation.\n\n"
                        "### Props\n"
                        "- `onSubmit`: `(data: FormData) => Promise<void>`\n"
                        "- `cartItems`: `CartItem[]`\n\n"
                        "### Test IDs\n"
                        "- `checkout-form` — root form element\n"
                        "- `checkout-submit-btn` — submit button\n"
                        "- `checkout-total` — total display\n"
                    ),
                    "screenshot_url": "screenshots/checkout-form.png",
                },
                "task_id": _TASK_ID,
                "source_artifact_ids": [test_artifact_id],
                "metadata": {"generated_by": "docs-agent"},
            },
        )
        assert r.status_code == 201, f"Docs artifact publish failed: {r.text}"
        docs_artifact = r.json()["data"]
        assert docs_artifact["artifact_type"] == "doc_section"
        assert docs_artifact["version"] == 1
        assert docs_artifact["id"]

    # ── Step 9: Dev agent publishes Component artifact ────────────────
    with as_agent(_DEV_AGENT_ID, _ORG_ID, "Dev Agent", level=7):
        r = await c.post(
            "/artifacts",
            json={
                "artifact_type": "component",
                "name": "CheckoutForm",
                "content": {
                    "file_path": "src/components/CheckoutForm.tsx",
                    "test_ids": ["checkout-form", "checkout-submit-btn", "checkout-total"],
                    "props": [
                        {"name": "onSubmit", "type": "(data: FormData) => Promise<void>"},
                        {"name": "cartItems", "type": "CartItem[]"},
                    ],
                    "route": "/checkout",
                    "loc": 147,
                },
                "task_id": _TASK_ID,
                "metadata": {"generated_by": "dev-agent"},
            },
        )
        assert r.status_code == 201, f"Dev artifact publish failed: {r.text}"
        dev_artifact = r.json()["data"]
        assert dev_artifact["artifact_type"] == "component"
        assert dev_artifact["id"]

    # ═══════════════════════════════════════════════════════════════════
    # VERIFICATION: Projections (must use as_agent to match org_id)
    # ═══════════════════════════════════════════════════════════════════

    with as_agent(_DEV_AGENT_ID, _ORG_ID, "Dev Agent", level=7):
        # ── Verify component_registry projection ──────────────────────────
        r = await c.get(
            "/coordination/project",
            params={"task_id": _TASK_ID, "projection_type": "component_registry"},
        )
        assert r.status_code == 200
        registry = r.json()["data"]
        assert registry["count"] == 1
        assert "CheckoutForm" in registry["components"]
        component = registry["components"]["CheckoutForm"]
        assert component["file_path"] == "src/components/CheckoutForm.tsx"
        assert "checkout-form" in component["test_ids"]
        assert "checkout-submit-btn" in component["test_ids"]
        assert "checkout-total" in component["test_ids"]

        # ── Verify test_coverage projection ───────────────────────────────
        r = await c.get(
            "/coordination/project",
            params={"task_id": _TASK_ID, "projection_type": "test_coverage"},
        )
        assert r.status_code == 200
        coverage = r.json()["data"]
        assert coverage["total_components"] == 1
        assert coverage["covered_count"] == 1
        assert coverage["coverage_ratio"] == 1.0
        assert coverage["components"]["CheckoutForm"]["has_tests"] is True

        # ── Verify artifact_view projection ───────────────────────────────
        r = await c.get(
            "/coordination/project",
            params={"task_id": _TASK_ID, "projection_type": "artifact_view"},
        )
        assert r.status_code == 200
        artifact_view = r.json()["data"]
        # Should have: component (CheckoutForm), test_plan, doc_section
        assert artifact_view["count"] == 3
        types_found = {a["artifact_type"] for a in artifact_view["artifacts"]}
        assert types_found == {"component", "test_plan", "doc_section"}

        # ═══════════════════════════════════════════════════════════════════
        # VERIFICATION: All 3 artifacts linked to parent task
        # ═══════════════════════════════════════════════════════════════════

        r = await c.get("/artifacts", params={"task_id": _TASK_ID})
        assert r.status_code == 200
        artifacts = r.json()["data"]
        assert len(artifacts) == 3

        artifact_types = {a["artifact_type"] for a in artifacts}
        assert artifact_types == {"component", "test_plan", "doc_section"}

        # All linked to the same parent task
        for a in artifacts:
            assert a["task_id"] == _TASK_ID
            assert a["status"] == "published"

        # Verify doc_section has source_artifact_ids linking to test artifact
        doc = next(a for a in artifacts if a["artifact_type"] == "doc_section")
        assert test_artifact_id in doc["source_artifact_ids"]

        # ── Verify replay shows full event timeline ───────────────────────
        r = await c.post(
            "/coordination/replay",
            json={"task_id": _TASK_ID},
        )
        assert r.status_code == 200
        all_events = r.json()["data"]
        assert len(all_events) == 3  # component.created, test.written, doc.section.written
        event_types = [e["type"] for e in all_events]
        assert event_types == ["component.created", "test.written", "doc.section.written"]


@pytest.mark.asyncio
async def test_artifact_subscriptions_notify_consumers(seeded: AsyncClient):
    """Test agent subscribes to component artifacts, docs agent to all.

    Verifies the subscription mechanism works for artifact-level subscriptions.
    """
    c = seeded

    # Test agent subscribes to component artifacts
    r = await c.post(
        "/artifacts/subscribe",
        json={"artifact_type": "component", "task_id": _TASK_ID},
    )
    assert r.status_code == 201
    sub = r.json()["data"]
    assert sub["artifact_type"] == "component"

    # Docs agent subscribes to all artifacts (wildcard)
    r = await c.post(
        "/artifacts/subscribe",
        json={"artifact_type": "*"},
    )
    assert r.status_code == 201

    # List subscriptions
    r = await c.get("/artifacts/subscriptions")
    assert r.status_code == 200
    subs = r.json()["data"]
    assert len(subs) == 2

    # Publish a component artifact → subscribers should be resolved
    r = await c.post(
        "/artifacts",
        json={
            "artifact_type": "component",
            "name": "PaymentForm",
            "content": {
                "file_path": "src/components/PaymentForm.tsx",
                "test_ids": ["payment-form"],
            },
            "task_id": _TASK_ID,
        },
    )
    assert r.status_code == 201


@pytest.mark.asyncio
async def test_multi_component_coverage_tracking(seeded: AsyncClient):
    """Multiple components, partial test coverage → projection reflects reality."""
    c = seeded

    # Dev creates 3 components
    for name, test_ids in [
        ("Header", ["header-logo", "header-nav"]),
        ("CartDrawer", ["cart-drawer", "cart-item"]),
        ("Footer", ["footer-links"]),
    ]:
        r = await c.post(
            "/coordination/emit",
            json={
                "event_type": "component.created",
                "payload": {
                    "name": name,
                    "file_path": f"src/components/{name}.tsx",
                    "test_ids": test_ids,
                },
                "task_id": _TASK_ID,
                "entity_name": name,
            },
        )
        assert r.status_code == 200

    # Test agent writes tests for Header and CartDrawer only
    for comp in ["Header", "CartDrawer"]:
        r = await c.post(
            "/coordination/emit",
            json={
                "event_type": "test.written",
                "payload": {
                    "covers_component": comp,
                    "test_file": f"{comp}.spec.tsx",
                    "scenarios": ["renders correctly"],
                },
                "task_id": _TASK_ID,
                "entity_name": f"{comp}-tests",
            },
        )
        assert r.status_code == 200

    # Check coverage: 2/3 components covered
    r = await c.get(
        "/coordination/project",
        params={"task_id": _TASK_ID, "projection_type": "test_coverage"},
    )
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["total_components"] == 3
    assert data["covered_count"] == 2
    assert abs(data["coverage_ratio"] - 2 / 3) < 0.01

    # Header and CartDrawer covered, Footer not
    assert data["components"]["Header"]["has_tests"] is True
    assert data["components"]["CartDrawer"]["has_tests"] is True
    assert data["components"]["Footer"]["has_tests"] is False

    # Component registry shows all 3
    r = await c.get(
        "/coordination/project",
        params={"task_id": _TASK_ID, "projection_type": "component_registry"},
    )
    assert r.status_code == 200
    assert r.json()["data"]["count"] == 3
