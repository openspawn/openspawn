"""Integration tests for artifact endpoints on SQLite backend."""

from __future__ import annotations

import os
import uuid
from typing import TYPE_CHECKING
from unittest.mock import patch

import pytest
from httpx import ASGITransport, AsyncClient

if TYPE_CHECKING:
    from collections.abc import AsyncGenerator

# Owner IDs used by auth.mode=none
_OWNER_ID = "00000000-0000-0000-0000-000000000001"
_OWNER_ORG_ID = "00000000-0000-0000-0000-000000000001"


@pytest.fixture(autouse=True)
def sqlite_env(tmp_path):
    db_path = tmp_path / "test.db"
    env = {
        "DATABASE_URL": f"sqlite+aiosqlite:///{db_path}",
        "REDIS_URL": "",
        "AUTH_MODE": "none",
        "AUTH_JWT_SECRET": "test-secret-32-chars-long-enough!",
    }
    with patch.dict(os.environ, env, clear=False):
        from importlib import reload

        import app.config
        import app.database

        reload(app.config)
        reload(app.database)
        yield


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient]:
    from app.database import create_tables

    await create_tables()

    from app.main import app

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as c:
        yield c


@pytest.fixture
async def seeded_client(client: AsyncClient) -> AsyncClient:
    """Client with org + agent + task seeded for artifact operations."""
    from app.database import async_session
    from app.models.agent import Agent
    from app.models.organization import Organization
    from app.models.task import Task

    async with async_session() as db:
        org = Organization(
            id=uuid.UUID(_OWNER_ORG_ID),
            name="TestOrg",
            slug="test",
            task_prefix="T",
            next_task_number=1,
        )
        db.add(org)
        await db.flush()

        agent = Agent(
            id=uuid.UUID(_OWNER_ID),
            org_id=org.id,
            agent_id="test-agent",
            name="Test Agent",
            level=5,
            model="sonnet",
            status="active",
            role="worker",
            mode="worker",
            hmac_secret_enc=b"\x00" * 32,
        )
        db.add(agent)
        await db.flush()

        task = Task(
            id=uuid.UUID("00000000-0000-0000-0000-000000000002"),
            org_id=org.id,
            identifier="T-1",
            title="Test Task",
            status="in_progress",
            priority="normal",
            creator_id=agent.id,
        )
        db.add(task)
        await db.commit()

    return client


def _component_payload(name: str = "SubmitButton") -> dict:
    return {
        "artifact_type": "component",
        "name": name,
        "content": {
            "name": name,
            "test_ids": ["submit-btn"],
            "props": [{"name": "onClick", "type": "() => void"}],
        },
        "task_id": "00000000-0000-0000-0000-000000000002",
    }


# ---------------------------------------------------------------------------
# Publish
# ---------------------------------------------------------------------------


class TestPublish:
    @pytest.mark.asyncio
    async def test_publish_creates_v1(self, seeded_client: AsyncClient):
        r = await seeded_client.post("/artifacts", json=_component_payload())
        assert r.status_code == 201
        data = r.json()["data"]
        assert data["version"] == 1
        assert data["status"] == "published"
        assert data["artifact_type"] == "component"
        assert data["name"] == "SubmitButton"
        assert len(data["content_hash"]) == 64

    @pytest.mark.asyncio
    async def test_publish_existing_name_increments_version(self, seeded_client: AsyncClient):
        await seeded_client.post("/artifacts", json=_component_payload())

        payload = _component_payload()
        payload["content"]["test_ids"] = ["submit-btn", "submit-loading"]
        r = await seeded_client.post("/artifacts", json=payload)
        assert r.status_code == 201
        assert r.json()["data"]["version"] == 2

    @pytest.mark.asyncio
    async def test_publish_supersedes_previous(self, seeded_client: AsyncClient):
        r1 = await seeded_client.post("/artifacts", json=_component_payload())
        v1_id = r1.json()["data"]["id"]

        payload = _component_payload()
        payload["content"]["test_ids"] = ["submit-btn-v2"]
        await seeded_client.post("/artifacts", json=payload)

        r = await seeded_client.get(f"/artifacts/{v1_id}")
        assert r.json()["data"]["status"] == "superseded"

    @pytest.mark.asyncio
    async def test_duplicate_content_returns_existing(self, seeded_client: AsyncClient):
        r1 = await seeded_client.post("/artifacts", json=_component_payload())
        r2 = await seeded_client.post("/artifacts", json=_component_payload())
        assert r1.json()["data"]["id"] == r2.json()["data"]["id"]
        assert r2.json()["data"]["version"] == 1

    @pytest.mark.asyncio
    async def test_batch_publish(self, seeded_client: AsyncClient):
        payloads = [
            _component_payload("ButtonA"),
            _component_payload("ButtonB"),
        ]
        r = await seeded_client.post("/artifacts/batch", json=payloads)
        assert r.status_code == 201
        data = r.json()["data"]
        assert len(data) == 2
        names = {a["name"] for a in data}
        assert names == {"ButtonA", "ButtonB"}

    @pytest.mark.asyncio
    async def test_source_artifact_ids(self, seeded_client: AsyncClient):
        r1 = await seeded_client.post("/artifacts", json=_component_payload())
        component_id = r1.json()["data"]["id"]

        test_plan = {
            "artifact_type": "test_plan",
            "name": "SubmitButtonTests",
            "content": {"test_file": "submit.spec.ts", "scenarios": ["happy path"]},
            "task_id": "00000000-0000-0000-0000-000000000002",
            "source_artifact_ids": [component_id],
        }
        r2 = await seeded_client.post("/artifacts", json=test_plan)
        assert r2.status_code == 201
        assert component_id in r2.json()["data"]["source_artifact_ids"]


# ---------------------------------------------------------------------------
# Read
# ---------------------------------------------------------------------------


class TestRead:
    @pytest.mark.asyncio
    async def test_list_artifacts(self, seeded_client: AsyncClient):
        await seeded_client.post("/artifacts", json=_component_payload())
        r = await seeded_client.get("/artifacts")
        assert r.status_code == 200
        assert r.json()["meta"]["total"] >= 1

    @pytest.mark.asyncio
    async def test_list_filter_by_type(self, seeded_client: AsyncClient):
        await seeded_client.post("/artifacts", json=_component_payload())
        r = await seeded_client.get("/artifacts?artifact_type=component")
        assert r.status_code == 200
        assert all(a["artifact_type"] == "component" for a in r.json()["data"])

    @pytest.mark.asyncio
    async def test_list_filter_by_name(self, seeded_client: AsyncClient):
        await seeded_client.post("/artifacts", json=_component_payload("UniqueBtn"))
        r = await seeded_client.get("/artifacts?name=UniqueBtn")
        assert r.status_code == 200
        assert len(r.json()["data"]) == 1

    @pytest.mark.asyncio
    async def test_get_latest(self, seeded_client: AsyncClient):
        await seeded_client.post("/artifacts", json=_component_payload())
        payload = _component_payload()
        payload["content"]["test_ids"] = ["v2"]
        await seeded_client.post("/artifacts", json=payload)

        r = await seeded_client.get("/artifacts/latest?name=SubmitButton")
        assert r.status_code == 200
        assert r.json()["data"]["version"] == 2

    @pytest.mark.asyncio
    async def test_get_latest_not_found(self, seeded_client: AsyncClient):
        r = await seeded_client.get("/artifacts/latest?name=NonExistent")
        assert r.status_code == 404

    @pytest.mark.asyncio
    async def test_get_by_id(self, seeded_client: AsyncClient):
        r1 = await seeded_client.post("/artifacts", json=_component_payload())
        aid = r1.json()["data"]["id"]

        r = await seeded_client.get(f"/artifacts/{aid}")
        assert r.status_code == 200
        assert r.json()["data"]["id"] == aid

    @pytest.mark.asyncio
    async def test_get_history(self, seeded_client: AsyncClient):
        r1 = await seeded_client.post("/artifacts", json=_component_payload())
        aid = r1.json()["data"]["id"]

        payload = _component_payload()
        payload["content"]["test_ids"] = ["v2"]
        await seeded_client.post("/artifacts", json=payload)

        r = await seeded_client.get(f"/artifacts/{aid}/history")
        assert r.status_code == 200
        versions = [a["version"] for a in r.json()["data"]]
        assert versions == [2, 1]


# ---------------------------------------------------------------------------
# Status
# ---------------------------------------------------------------------------


class TestStatus:
    @pytest.mark.asyncio
    async def test_transition_published_to_superseded(self, seeded_client: AsyncClient):
        r1 = await seeded_client.post("/artifacts", json=_component_payload())
        aid = r1.json()["data"]["id"]

        r = await seeded_client.put(f"/artifacts/{aid}/status", json={"status": "superseded"})
        assert r.status_code == 200
        assert r.json()["data"]["status"] == "superseded"

    @pytest.mark.asyncio
    async def test_invalid_transition_returns_400(self, seeded_client: AsyncClient):
        r1 = await seeded_client.post("/artifacts", json=_component_payload())
        aid = r1.json()["data"]["id"]

        # published → draft is not valid
        r = await seeded_client.put(f"/artifacts/{aid}/status", json={"status": "draft"})
        assert r.status_code == 400


# ---------------------------------------------------------------------------
# Subscriptions
# ---------------------------------------------------------------------------


class TestSubscriptions:
    @pytest.mark.asyncio
    async def test_create_subscription(self, seeded_client: AsyncClient):
        r = await seeded_client.post("/artifacts/subscribe", json={"artifact_type": "component"})
        assert r.status_code == 201
        assert r.json()["data"]["artifact_type"] == "component"

    @pytest.mark.asyncio
    async def test_list_subscriptions(self, seeded_client: AsyncClient):
        await seeded_client.post("/artifacts/subscribe", json={"artifact_type": "component"})
        r = await seeded_client.get("/artifacts/subscriptions")
        assert r.status_code == 200
        assert len(r.json()["data"]) == 1

    @pytest.mark.asyncio
    async def test_delete_subscription(self, seeded_client: AsyncClient):
        r1 = await seeded_client.post("/artifacts/subscribe", json={"artifact_type": "component"})
        sub_id = r1.json()["data"]["id"]

        r = await seeded_client.delete(f"/artifacts/subscriptions/{sub_id}")
        assert r.status_code == 204

        r = await seeded_client.get("/artifacts/subscriptions")
        assert len(r.json()["data"]) == 0

    @pytest.mark.asyncio
    async def test_duplicate_subscription_409(self, seeded_client: AsyncClient):
        await seeded_client.post("/artifacts/subscribe", json={"artifact_type": "component"})
        r = await seeded_client.post("/artifacts/subscribe", json={"artifact_type": "component"})
        assert r.status_code == 409


# ---------------------------------------------------------------------------
# Auth gate
# ---------------------------------------------------------------------------


class TestAuthGate:
    @pytest.mark.asyncio
    async def test_artifacts_requires_auth_in_full_mode(self):
        env = {
            "DATABASE_URL": "sqlite+aiosqlite:///",
            "REDIS_URL": "",
            "AUTH_MODE": "full",
            "AUTH_JWT_SECRET": "test-secret-32-chars-long-enough!",
        }
        with patch.dict(os.environ, env, clear=False):
            from importlib import reload

            import app.config
            import app.database

            reload(app.config)
            reload(app.database)

            from app.database import create_tables

            await create_tables()

            from app.main import app

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as c:
                assert (await c.get("/artifacts")).status_code == 401
                assert (await c.post("/artifacts", json={})).status_code == 401
                assert (await c.get("/artifacts/subscriptions")).status_code == 401


# ---------------------------------------------------------------------------
# E2E coordination flow
# ---------------------------------------------------------------------------


class TestE2ECoordination:
    @pytest.mark.asyncio
    async def test_dev_publishes_component_test_agent_references_it(
        self, seeded_client: AsyncClient
    ):
        """Full coordination flow: dev → component → test plan referencing it."""
        # Dev agent publishes ComponentArtifact
        component = await seeded_client.post(
            "/artifacts",
            json={
                "artifact_type": "component",
                "name": "CheckoutForm",
                "content": {
                    "name": "CheckoutForm",
                    "test_ids": ["checkout-form", "checkout-submit"],
                    "props": [{"name": "onSubmit", "type": "() => Promise<void>"}],
                    "route": "/checkout",
                },
                "task_id": "00000000-0000-0000-0000-000000000002",
            },
        )
        assert component.status_code == 201
        component_id = component.json()["data"]["id"]

        # Test agent publishes TestPlanArtifact referencing the component
        test_plan = await seeded_client.post(
            "/artifacts",
            json={
                "artifact_type": "test_plan",
                "name": "CheckoutFormTests",
                "content": {
                    "test_file": "e2e/checkout.spec.ts",
                    "test_ids_used": ["checkout-form", "checkout-submit"],
                    "scenarios": ["happy path", "validation error", "network timeout"],
                },
                "task_id": "00000000-0000-0000-0000-000000000002",
                "source_artifact_ids": [component_id],
            },
        )
        assert test_plan.status_code == 201
        test_plan_data = test_plan.json()["data"]
        assert component_id in test_plan_data["source_artifact_ids"]

        # Docs agent publishes ScreenshotArtifact referencing the component
        screenshot = await seeded_client.post(
            "/artifacts",
            json={
                "artifact_type": "screenshot",
                "name": "CheckoutFormScreenshot",
                "content": {
                    "file_path": "docs/screenshots/checkout.png",
                    "viewport": "1280x720",
                    "state": "default",
                },
                "task_id": "00000000-0000-0000-0000-000000000002",
                "source_artifact_ids": [component_id],
            },
        )
        assert screenshot.status_code == 201

        # Verify all 3 artifacts exist
        r = await seeded_client.get("/artifacts?task_id=00000000-0000-0000-0000-000000000002")
        assert r.json()["meta"]["total"] == 3

        # Verify lineage: both test plan and screenshot reference the component
        for artifact in r.json()["data"]:
            if artifact["name"] in ("CheckoutFormTests", "CheckoutFormScreenshot"):
                assert component_id in artifact["source_artifact_ids"]
