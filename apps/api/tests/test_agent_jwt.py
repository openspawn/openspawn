"""Tests for agent JWT token issuance, refresh, scope derivation, and require_auth integration."""

from __future__ import annotations

import os
import time
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import jwt
import pendulum
import pytest
from httpx import AsyncClient

from app.auth.jwt_agent import (
    AGENT_JWT_ALGORITHM,
    AGENT_JWT_TTL_MINUTES,
    authenticated_agent_from_jwt,
    create_agent_token,
    decode_agent_token,
    scopes_for_level,
)
from app.auth.schemas import AuthenticatedAgent

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

TEST_JWT_SECRET = "test-agent-jwt-secret-do-not-use-in-prod"


@pytest.fixture(autouse=True)
def _jwt_env():
    with patch.dict(os.environ, {"AUTH_JWT_SECRET": TEST_JWT_SECRET}):
        yield


def _make_agent(
    level: int = 5,
    status: str = "active",
    agent_id: str = "agent-007",
) -> AuthenticatedAgent:
    return AuthenticatedAgent(
        id=uuid.uuid4(),
        org_id=uuid.uuid4(),
        agent_id=agent_id,
        name="Test Agent",
        role="worker",
        mode="worker",
        level=level,
    )


# ---------------------------------------------------------------------------
# Scope derivation
# ---------------------------------------------------------------------------


class TestScopeDerivation:
    def test_level_1_base_scopes(self):
        scopes = scopes_for_level(1)
        assert scopes == ["read:channels", "read:tasks"]

    def test_level_3_base_scopes(self):
        scopes = scopes_for_level(3)
        assert scopes == ["read:channels", "read:tasks"]

    def test_level_4_mid_scopes(self):
        scopes = scopes_for_level(4)
        assert "write:messages" in scopes
        assert "transition:task" in scopes
        assert "read:channels" in scopes

    def test_level_6_mid_scopes(self):
        scopes = scopes_for_level(6)
        assert "write:messages" in scopes
        assert "spawn:agent" not in scopes

    def test_level_7_high_scopes(self):
        scopes = scopes_for_level(7)
        assert "create:task" in scopes
        assert "spawn:agent" in scopes
        assert "manage:credits" in scopes

    def test_level_9_high_scopes(self):
        scopes = scopes_for_level(9)
        assert "spawn:agent" in scopes

    def test_level_10_all_scopes(self):
        scopes = scopes_for_level(10)
        assert scopes == ["*"]


# ---------------------------------------------------------------------------
# Token creation and decoding
# ---------------------------------------------------------------------------


class TestTokenLifecycle:
    def test_create_and_decode(self):
        agent = _make_agent(level=5)
        token = create_agent_token(agent)
        payload = decode_agent_token(token)

        assert payload["sub"] == agent.agent_id
        assert payload["org_id"] == str(agent.org_id)
        assert payload["level"] == 5
        assert payload["role"] == "worker"
        assert payload["mode"] == "worker"
        assert payload["token_type"] == "agent"
        assert "write:messages" in payload["scopes"]

    def test_expired_token_rejected(self):
        agent = _make_agent()
        secret = TEST_JWT_SECRET
        now = pendulum.now("UTC")
        payload = {
            "sub": agent.agent_id,
            "agent_uuid": str(agent.id),
            "org_id": str(agent.org_id),
            "level": agent.level,
            "role": agent.role,
            "mode": agent.mode,
            "scopes": scopes_for_level(agent.level),
            "state": "active",
            "token_type": "agent",
            "iat": int(now.subtract(minutes=20).timestamp()),
            "exp": int(now.subtract(minutes=5).timestamp()),
        }
        token = jwt.encode(payload, secret, algorithm=AGENT_JWT_ALGORITHM)

        from fastapi import HTTPException

        with pytest.raises(HTTPException) as exc_info:
            decode_agent_token(token)
        assert exc_info.value.status_code == 401
        assert "expired" in exc_info.value.detail.lower()

    def test_invalid_token_rejected(self):
        from fastapi import HTTPException

        with pytest.raises(HTTPException) as exc_info:
            decode_agent_token("not.a.valid.token")
        assert exc_info.value.status_code == 401

    def test_wrong_token_type_rejected(self):
        """A JWT without token_type=agent should be rejected."""
        secret = TEST_JWT_SECRET
        now = int(time.time())
        payload = {
            "sub": "user-123",
            "token_type": "user",
            "iat": now,
            "exp": now + 900,
        }
        token = jwt.encode(payload, secret, algorithm=AGENT_JWT_ALGORITHM)

        from fastapi import HTTPException

        with pytest.raises(HTTPException) as exc_info:
            decode_agent_token(token)
        assert exc_info.value.status_code == 401

    def test_roundtrip_authenticated_agent(self):
        agent = _make_agent(level=8)
        token = create_agent_token(agent)
        payload = decode_agent_token(token)
        restored = authenticated_agent_from_jwt(payload)

        assert restored.id == agent.id
        assert restored.org_id == agent.org_id
        assert restored.agent_id == agent.agent_id
        assert restored.role == agent.role
        assert restored.mode == agent.mode
        assert restored.level == agent.level


# ---------------------------------------------------------------------------
# Router integration tests
# ---------------------------------------------------------------------------


def _mock_agent_row(
    agent_id: str = "agent-007",
    status: str = "active",
    level: int = 5,
    org_id: uuid.UUID | None = None,
):
    """Create a mock Agent ORM row."""
    row = MagicMock()
    row.id = uuid.uuid4()
    row.org_id = org_id or uuid.uuid4()
    row.agent_id = agent_id
    row.name = "Test Agent"
    row.role = "worker"
    row.mode = "worker"
    row.level = level
    row.status = status
    row.hmac_secret_enc = b""
    return row


class TestTokenEndpoint:
    """Test POST /auth/agent/token via HMAC exchange."""

    @pytest.mark.anyio
    async def test_token_issued_for_valid_hmac(self, client: AsyncClient):
        """Valid HMAC headers -> JWT returned."""
        agent = _make_agent(level=6)

        with patch(
            "app.auth.router_agent_jwt._authenticate_hmac", new_callable=AsyncMock
        ) as mock_hmac:
            mock_hmac.return_value = agent
            resp = await client.post(
                "/auth/agent/token",
                headers={
                    "x-agent-id": agent.agent_id,
                    "x-timestamp": str(int(time.time())),
                    "x-nonce": "nonce123",
                    "x-signature": "fake-sig",
                },
            )

        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["expires_in"] == AGENT_JWT_TTL_MINUTES * 60
        assert "write:messages" in data["scopes"]

    @pytest.mark.anyio
    async def test_token_rejected_for_invalid_hmac(self, client: AsyncClient):
        """Missing HMAC headers -> 401."""
        resp = await client.post("/auth/agent/token")
        assert resp.status_code == 401


class TestRefreshEndpoint:
    """Test POST /auth/agent/refresh."""

    @pytest.mark.anyio
    async def test_refresh_active_agent(self, client: AsyncClient):
        agent = _make_agent(level=5)
        token = create_agent_token(agent)

        mock_row = _mock_agent_row(
            agent_id=agent.agent_id,
            status="active",
            level=5,
            org_id=agent.org_id,
        )

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_row
        mock_db = AsyncMock()
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.database import get_db
        from app.main import app

        app.dependency_overrides[get_db] = lambda: mock_db
        try:
            resp = await client.post(
                "/auth/agent/refresh",
                json={"token": token},
            )
        finally:
            app.dependency_overrides.pop(get_db, None)

        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["access_token"] != token

    @pytest.mark.anyio
    async def test_refresh_rejected_for_suspended_agent(self, client: AsyncClient):
        agent = _make_agent(level=5)
        token = create_agent_token(agent)

        mock_row = _mock_agent_row(
            agent_id=agent.agent_id,
            status="suspended",
            org_id=agent.org_id,
        )

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_row
        mock_db = AsyncMock()
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.database import get_db
        from app.main import app

        app.dependency_overrides[get_db] = lambda: mock_db
        try:
            resp = await client.post(
                "/auth/agent/refresh",
                json={"token": token},
            )
        finally:
            app.dependency_overrides.pop(get_db, None)

        assert resp.status_code == 401
        assert "not active" in resp.json()["detail"].lower()

    @pytest.mark.anyio
    async def test_refresh_rejected_for_expired_token(self, client: AsyncClient):
        """Expired JWT -> 401 on refresh."""
        agent = _make_agent()
        secret = TEST_JWT_SECRET
        now = pendulum.now("UTC")
        payload = {
            "sub": agent.agent_id,
            "agent_uuid": str(agent.id),
            "org_id": str(agent.org_id),
            "level": agent.level,
            "role": agent.role,
            "mode": agent.mode,
            "scopes": scopes_for_level(agent.level),
            "state": "active",
            "token_type": "agent",
            "iat": int(now.subtract(minutes=20).timestamp()),
            "exp": int(now.subtract(minutes=5).timestamp()),
        }
        expired_token = jwt.encode(payload, secret, algorithm=AGENT_JWT_ALGORITHM)

        resp = await client.post(
            "/auth/agent/refresh",
            json={"token": expired_token},
        )

        assert resp.status_code == 401
        assert "expired" in resp.json()["detail"].lower()


# ---------------------------------------------------------------------------
# require_auth integration — _try_agent_jwt unit tests
# ---------------------------------------------------------------------------


class TestRequireAuthAcceptsAgentJWT:
    def test_agent_jwt_parsed_by_try_agent_jwt(self):
        """_try_agent_jwt should return AuthenticatedAgent for valid agent JWT."""
        from app.auth.dependencies import _try_agent_jwt

        agent = _make_agent(level=7)
        token = create_agent_token(agent)

        result = _try_agent_jwt(token)
        assert result is not None
        assert isinstance(result, AuthenticatedAgent)
        assert result.agent_id == agent.agent_id
        assert result.level == 7

    def test_try_agent_jwt_returns_none_for_user_token(self):
        """_try_agent_jwt should return None for non-agent JWTs."""
        from app.auth.dependencies import _try_agent_jwt

        secret = TEST_JWT_SECRET
        now = int(time.time())
        payload = {
            "sub": "user-123",
            "org_id": str(uuid.uuid4()),
            "email": "test@example.com",
            "role": "admin",
            "iat": now,
            "exp": now + 900,
        }
        token = jwt.encode(payload, secret, algorithm=AGENT_JWT_ALGORITHM)

        result = _try_agent_jwt(token)
        assert result is None

    def test_try_agent_jwt_raises_for_expired_agent_token(self):
        """_try_agent_jwt should raise for expired agent tokens."""
        from fastapi import HTTPException

        from app.auth.dependencies import _try_agent_jwt

        agent = _make_agent()
        secret = TEST_JWT_SECRET
        now = pendulum.now("UTC")
        payload = {
            "sub": agent.agent_id,
            "agent_uuid": str(agent.id),
            "org_id": str(agent.org_id),
            "level": agent.level,
            "role": agent.role,
            "mode": agent.mode,
            "scopes": scopes_for_level(agent.level),
            "state": "active",
            "token_type": "agent",
            "iat": int(now.subtract(minutes=20).timestamp()),
            "exp": int(now.subtract(minutes=5).timestamp()),
        }
        expired_token = jwt.encode(payload, secret, algorithm=AGENT_JWT_ALGORITHM)

        with pytest.raises(HTTPException) as exc_info:
            _try_agent_jwt(expired_token)
        assert exc_info.value.status_code == 401
