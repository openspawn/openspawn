"""Integration tests for SSE endpoints on SQLite backend."""

from __future__ import annotations

import asyncio
import os
import uuid
from typing import TYPE_CHECKING
from unittest.mock import AsyncMock, patch

import pendulum
import pytest
from httpx import ASGITransport, AsyncClient

if TYPE_CHECKING:
    from collections.abc import AsyncGenerator


@pytest.fixture(autouse=True)
def sqlite_env(tmp_path):
    """Point DATABASE_URL at a temp SQLite file, disable Redis."""
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


# ---------------------------------------------------------------------------
# POST /events/token
# ---------------------------------------------------------------------------


class TestSSEToken:
    @pytest.mark.asyncio
    async def test_token_endpoint_returns_jwt(self, client: AsyncClient):
        r = await client.post("/events/token")
        assert r.status_code == 200
        body = r.json()
        assert "data" in body
        assert "token" in body["data"]
        assert body["data"]["expires_in"] == 300
        token = body["data"]["token"]
        assert len(token.split(".")) == 3

    @pytest.mark.asyncio
    async def test_token_contains_sse_purpose(self, client: AsyncClient):
        import jwt

        r = await client.post("/events/token")
        token = r.json()["data"]["token"]

        decoded = jwt.decode(token, "test-secret-32-chars-long-enough!", algorithms=["HS256"])
        assert decoded["purpose"] == "sse"
        assert "sub" in decoded
        assert "org_id" in decoded
        assert "exp" in decoded

    @pytest.mark.asyncio
    async def test_token_has_expiry(self, client: AsyncClient):
        import jwt

        r = await client.post("/events/token")
        token = r.json()["data"]["token"]

        decoded = jwt.decode(token, "test-secret-32-chars-long-enough!", algorithms=["HS256"])
        assert decoded["exp"] > decoded["iat"]
        assert decoded["exp"] - decoded["iat"] == 300


# ---------------------------------------------------------------------------
# GET /events/stream — query param validation
# ---------------------------------------------------------------------------


class TestSSEStream:
    @pytest.mark.asyncio
    async def test_stream_requires_token_param(self, client: AsyncClient):
        r = await client.get("/events/stream")
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_stream_rejects_api_key_directly(self):
        """API keys can't be used directly for SSE in non-none auth modes."""
        from app.config import AuthMode
        from app.events.sse_router import _validate_sse_token

        with patch("app.events.sse_router.get_settings") as mock:
            cfg = mock.return_value
            cfg.auth.mode = AuthMode.LOCAL
            cfg.auth.jwt_secret = "test-secret-32-chars-long-enough!"
            cfg.auth.jwt_algorithm = "HS256"

            from fastapi import HTTPException

            with pytest.raises(HTTPException) as exc_info:
                _validate_sse_token("osp_some_key")
            assert exc_info.value.status_code == 400
            assert "API keys cannot be used" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_validate_rejects_expired_token(self):
        """Expired JWT is rejected."""
        import jwt

        from app.config import AuthMode
        from app.events.sse_router import _validate_sse_token

        with patch("app.events.sse_router.get_settings") as mock:
            cfg = mock.return_value
            cfg.auth.mode = AuthMode.FULL
            cfg.auth.jwt_secret = "test-secret-32-chars-long-enough!"
            cfg.auth.jwt_algorithm = "HS256"

            # Create an already-expired token
            expired_token = jwt.encode(
                {
                    "sub": str(uuid.uuid4()),
                    "org_id": str(uuid.uuid4()),
                    "purpose": "sse",
                    "iat": 1000000,
                    "exp": 1000001,
                },
                "test-secret-32-chars-long-enough!",
                algorithm="HS256",
            )

            from fastapi import HTTPException

            with pytest.raises(HTTPException) as exc_info:
                _validate_sse_token(expired_token)
            assert exc_info.value.status_code == 401
            assert "expired" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_validate_rejects_non_sse_token(self):
        """JWT without purpose=sse is rejected."""
        import jwt

        from app.config import AuthMode
        from app.events.sse_router import _validate_sse_token

        with patch("app.events.sse_router.get_settings") as mock:
            cfg = mock.return_value
            cfg.auth.mode = AuthMode.FULL
            cfg.auth.jwt_secret = "test-secret-32-chars-long-enough!"
            cfg.auth.jwt_algorithm = "HS256"

            non_sse_token = jwt.encode(
                {
                    "sub": str(uuid.uuid4()),
                    "org_id": str(uuid.uuid4()),
                    "purpose": "access",
                    "exp": pendulum.now("UTC").add(hours=1).int_timestamp,
                },
                "test-secret-32-chars-long-enough!",
                algorithm="HS256",
            )

            from fastapi import HTTPException

            with pytest.raises(HTTPException) as exc_info:
                _validate_sse_token(non_sse_token)
            assert exc_info.value.status_code == 401
            assert "not an SSE token" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_validate_accepts_valid_sse_token(self):
        """Valid SSE JWT returns (sub, org_id)."""
        import jwt

        from app.config import AuthMode
        from app.events.sse_router import _validate_sse_token

        sub = uuid.uuid4()
        org = uuid.uuid4()

        with patch("app.events.sse_router.get_settings") as mock:
            cfg = mock.return_value
            cfg.auth.mode = AuthMode.FULL
            cfg.auth.jwt_secret = "test-secret-32-chars-long-enough!"
            cfg.auth.jwt_algorithm = "HS256"

            token = jwt.encode(
                {
                    "sub": str(sub),
                    "org_id": str(org),
                    "purpose": "sse",
                    "exp": pendulum.now("UTC").add(minutes=5).int_timestamp,
                },
                "test-secret-32-chars-long-enough!",
                algorithm="HS256",
            )

            result_sub, result_org = _validate_sse_token(token)
            assert result_sub == sub
            assert result_org == org

    @pytest.mark.asyncio
    async def test_validate_none_mode_accepts_any_token(self):
        """In auth.mode=none, any token value is accepted."""
        from app.config import AuthMode
        from app.events.sse_router import _validate_sse_token

        with patch("app.events.sse_router.get_settings") as mock:
            cfg = mock.return_value
            cfg.auth.mode = AuthMode.NONE

            sub, org = _validate_sse_token("literally-anything")
            # Returns owner IDs
            assert sub == uuid.UUID("00000000-0000-0000-0000-000000000001")
            assert org == uuid.UUID("00000000-0000-0000-0000-000000000001")


# ---------------------------------------------------------------------------
# SSE stream + EventBus integration (direct generator test)
# ---------------------------------------------------------------------------


class TestSSEStreamGenerator:
    @pytest.mark.asyncio
    async def test_event_bus_delivers_to_subscriber(self):
        """Verify EventBus roundtrip: publish → subscribe delivers SSEEvent."""
        from app.events.bus import EventBus, InMemoryBackend
        from app.events.schemas import SSEEvent

        bus = EventBus(backend=InMemoryBackend())
        org_id = uuid.uuid4()

        event = SSEEvent(
            sequence=1,
            type="task.transitioned",
            org_id=org_id,
            actor_id=uuid.uuid4(),
            entity_type="task",
            entity_id=uuid.uuid4(),
            data={"status": "done"},
            created_at=pendulum.now("UTC"),
        )

        received = []

        async def _consume():
            async for e in bus.subscribe("test-sub"):
                received.append(e)
                break

        task = asyncio.create_task(_consume())
        await asyncio.sleep(0.01)

        await bus.publish(event)
        await asyncio.wait_for(task, timeout=1.0)

        assert len(received) == 1
        assert received[0].type == "task.transitioned"
        assert received[0].org_id == org_id

    @pytest.mark.asyncio
    async def test_emit_wires_db_and_bus(self):
        """Verify emit() creates Event row AND publishes to bus."""
        from app.events.bus import EventBus, InMemoryBackend

        bus = EventBus(backend=InMemoryBackend())
        db = AsyncMock()
        db.add = lambda obj: None  # no-op

        org_id = uuid.uuid4()
        entity_id = uuid.uuid4()
        received = []

        async def _consume():
            async for e in bus.subscribe("consumer"):
                received.append(e)
                break

        task = asyncio.create_task(_consume())
        await asyncio.sleep(0.01)

        with patch("app.events.emit.event_bus", bus):
            from app.events.emit import emit
            from app.models.enums import SSEEventType

            await emit(
                db=db,
                type=SSEEventType.TASK_COMPLETED,
                org_id=org_id,
                actor_id=uuid.uuid4(),
                entity_type="task",
                entity_id=entity_id,
                data={"title": "Deploy v2"},
            )

        await asyncio.wait_for(task, timeout=1.0)

        assert len(received) == 1
        assert received[0].entity_id == entity_id
        assert received[0].type == "task.completed"


# ---------------------------------------------------------------------------
# Auth gate (mode=full)
# ---------------------------------------------------------------------------


class TestSSEAuthGate:
    @pytest.mark.asyncio
    async def test_token_requires_auth_in_full_mode(self):
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
                r = await c.post("/events/token")
                assert r.status_code == 401


# ---------------------------------------------------------------------------
# Event types enum
# ---------------------------------------------------------------------------


class TestSSEEventTypes:
    def test_all_event_types_are_dotted(self):
        from app.models.enums import SSEEventType

        for member in SSEEventType:
            assert "." in member.value, f"{member.name} missing dot separator"

    def test_event_type_values_are_lowercase(self):
        from app.models.enums import SSEEventType

        for member in SSEEventType:
            assert member.value == member.value.lower(), f"{member.name} not lowercase"

    def test_event_type_count(self):
        from app.models.enums import SSEEventType

        assert len(SSEEventType) == 12
