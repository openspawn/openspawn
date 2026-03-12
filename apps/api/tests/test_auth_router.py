"""Tests for auth router endpoints across all auth modes."""

from __future__ import annotations

import uuid
from unittest.mock import patch

import jwt
import pendulum
import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.auth.middleware import (
    LocalTokenStore,
    hash_password,
)
from app.config import AuthMode, AuthSettings, Settings
from app.routers.auth import router


def _make_settings(**auth_overrides: object) -> Settings:
    """Build a Settings instance with custom auth config for testing."""
    auth = AuthSettings(**auth_overrides)  # type: ignore[arg-type]
    return Settings.model_construct(
        app_name="test",
        debug=False,
        database_url="sqlite+aiosqlite:///:memory:",
        cors_origins=[],
        log_level="WARNING",
        log_format="text",
        redis_url="redis://localhost:6379",
        sla_warning_pct=80,
        sla_breach_pct=100,
        auth=auth,
        logfire_token=None,
        langfuse_public_key=None,
        langfuse_secret_key=None,
        database_pool_size=5,
        database_pool_max_overflow=10,
    )


@pytest.fixture(autouse=True)
def _clear_local_tokens() -> None:
    """Ensure LocalTokenStore is empty between tests."""
    LocalTokenStore.clear()


@pytest.fixture
def app() -> FastAPI:
    """Create a test FastAPI app with the auth router."""
    test_app = FastAPI()
    test_app.include_router(router)
    return test_app


@pytest.fixture
async def client(app: FastAPI) -> AsyncClient:
    """Create an async HTTP client for testing."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac  # type: ignore[misc]


# =========================================================================
# mode=none
# =========================================================================


class TestAuthModeNone:
    """All endpoints in mode=none should pass without real credentials."""

    @pytest.mark.asyncio
    async def test_login_returns_static_token(self, client: AsyncClient) -> None:
        test_settings = _make_settings(mode=AuthMode.NONE)
        with patch("app.routers.auth.get_settings", return_value=test_settings):
            response = await client.post(
                "/auth/login",
                json={"email": "any@example.com", "password": "anything"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["access_token"] == "owner-static-token-local-dev"
        assert data["refresh_token"] == "owner-static-token-local-dev"
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_refresh_returns_static_token(self, client: AsyncClient) -> None:
        test_settings = _make_settings(mode=AuthMode.NONE)
        with patch("app.routers.auth.get_settings", return_value=test_settings):
            response = await client.post(
                "/auth/refresh",
                json={"refresh_token": "anything"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["access_token"] == "owner-static-token-local-dev"

    @pytest.mark.asyncio
    async def test_logout_is_noop(self, client: AsyncClient) -> None:
        test_settings = _make_settings(mode=AuthMode.NONE)
        with patch("app.routers.auth.get_settings", return_value=test_settings):
            response = await client.post(
                "/auth/logout",
                json={"refresh_token": "anything"},
            )

        assert response.status_code == 204

    @pytest.mark.asyncio
    async def test_me_returns_owner(self, client: AsyncClient) -> None:
        test_settings = _make_settings(mode=AuthMode.NONE)
        with (
            patch("app.routers.auth.get_settings", return_value=test_settings),
            patch("app.auth.middleware.get_settings", return_value=test_settings),
        ):
            response = await client.get("/auth/me")

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "owner@local"
        assert data["name"] == "Owner"
        assert data["role"] == "owner"
        assert data["totp_enabled"] is False


# =========================================================================
# mode=local
# =========================================================================


class TestAuthModeLocal:
    """Local mode: single password, bearer token flow."""

    def _local_settings(self, password: str = "localsecret123") -> Settings:
        return _make_settings(
            mode=AuthMode.LOCAL,
            local_password_hash=hash_password(password),
        )

    @pytest.mark.asyncio
    async def test_login_valid_password(self, client: AsyncClient) -> None:
        test_settings = self._local_settings()
        with patch("app.routers.auth.get_settings", return_value=test_settings):
            response = await client.post(
                "/auth/login",
                json={"email": "local@example.com", "password": "localsecret123"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["access_token"]
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_login_invalid_password(self, client: AsyncClient) -> None:
        test_settings = self._local_settings()
        with patch("app.routers.auth.get_settings", return_value=test_settings):
            response = await client.post(
                "/auth/login",
                json={"email": "local@example.com", "password": "wrong"},
            )

        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_login_no_password_configured(self, client: AsyncClient) -> None:
        test_settings = _make_settings(mode=AuthMode.LOCAL, local_password_hash=None)
        with patch("app.routers.auth.get_settings", return_value=test_settings):
            response = await client.post(
                "/auth/login",
                json={"email": "x@x.com", "password": "anything"},
            )

        assert response.status_code == 500
        assert "not configured" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_me_with_valid_local_token(self, client: AsyncClient) -> None:
        """Login, then use the returned token to call /auth/me."""
        test_settings = self._local_settings()
        with (
            patch("app.routers.auth.get_settings", return_value=test_settings),
            patch("app.auth.middleware.get_settings", return_value=test_settings),
        ):
            # Login first
            login_resp = await client.post(
                "/auth/login",
                json={"email": "local@example.com", "password": "localsecret123"},
            )
            assert login_resp.status_code == 200
            token = login_resp.json()["access_token"]

            # Use token for /me
            me_resp = await client.get(
                "/auth/me",
                headers={"Authorization": f"Bearer {token}"},
            )

        assert me_resp.status_code == 200
        assert me_resp.json()["email"] == "owner@local"

    @pytest.mark.asyncio
    async def test_me_with_invalid_local_token(self, client: AsyncClient) -> None:
        test_settings = self._local_settings()
        with (
            patch("app.routers.auth.get_settings", return_value=test_settings),
            patch("app.auth.middleware.get_settings", return_value=test_settings),
        ):
            response = await client.get(
                "/auth/me",
                headers={"Authorization": "Bearer bogus-token"},
            )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_logout_removes_local_token(self, client: AsyncClient) -> None:
        test_settings = self._local_settings()
        with (
            patch("app.routers.auth.get_settings", return_value=test_settings),
            patch("app.auth.middleware.get_settings", return_value=test_settings),
        ):
            # Login
            login_resp = await client.post(
                "/auth/login",
                json={"email": "local@example.com", "password": "localsecret123"},
            )
            token = login_resp.json()["access_token"]

            # Logout
            logout_resp = await client.post(
                "/auth/logout",
                json={"refresh_token": token},
            )
            assert logout_resp.status_code == 204

            # Token should no longer work
            me_resp = await client.get(
                "/auth/me",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert me_resp.status_code == 401

    @pytest.mark.asyncio
    async def test_refresh_returns_same_token(self, client: AsyncClient) -> None:
        test_settings = self._local_settings()
        with patch("app.routers.auth.get_settings", return_value=test_settings):
            response = await client.post(
                "/auth/refresh",
                json={"refresh_token": "local-token"},
            )

        assert response.status_code == 200
        assert response.json()["access_token"] == "local-token"


# =========================================================================
# mode=full
# =========================================================================


class TestAuthModeFull:
    """Full mode: JWT access tokens, refresh rotation, TOTP."""

    JWT_SECRET = "test-jwt-secret-for-unit-tests-must-be-32-bytes-long!"

    def _full_settings(self) -> Settings:
        return _make_settings(mode=AuthMode.FULL, jwt_secret=self.JWT_SECRET)

    @pytest.mark.asyncio
    async def test_login_valid_credentials(self, client: AsyncClient, app: FastAPI) -> None:
        from unittest.mock import AsyncMock, MagicMock

        user_id = uuid.uuid4()
        org_id = uuid.uuid4()
        user = MagicMock()
        user.id = user_id
        user.org_id = org_id
        user.email = "test@example.com"
        user.name = "Test User"
        user.password_hash = hash_password("correctpassword")
        user.role = "member"
        user.totp_enabled = False

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = user
        mock_db.execute.return_value = mock_result
        mock_db.flush = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.add = MagicMock()  # add() is sync, not async

        from app.database import get_db

        app.dependency_overrides[get_db] = lambda: mock_db

        test_settings = self._full_settings()
        with (
            patch("app.routers.auth.get_settings", return_value=test_settings),
            patch("app.auth.middleware.get_settings", return_value=test_settings),
        ):
            response = await client.post(
                "/auth/login",
                json={"email": "test@example.com", "password": "correctpassword"},
            )

        app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert data["access_token"]
        assert data["refresh_token"]

        # Verify JWT payload
        payload = jwt.decode(data["access_token"], self.JWT_SECRET, algorithms=["HS256"])
        assert payload["email"] == "test@example.com"
        assert payload["role"] == "member"
        assert payload["sub"] == str(user_id)

    @pytest.mark.asyncio
    async def test_login_invalid_password(self, client: AsyncClient, app: FastAPI) -> None:
        from unittest.mock import AsyncMock, MagicMock

        user = MagicMock()
        user.id = uuid.uuid4()
        user.org_id = uuid.uuid4()
        user.email = "test@example.com"
        user.password_hash = hash_password("correctpassword")
        user.totp_enabled = False

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = user
        mock_db.execute.return_value = mock_result

        from app.database import get_db

        app.dependency_overrides[get_db] = lambda: mock_db

        test_settings = self._full_settings()
        with patch("app.routers.auth.get_settings", return_value=test_settings):
            response = await client.post(
                "/auth/login",
                json={"email": "test@example.com", "password": "wrong"},
            )

        app.dependency_overrides.clear()

        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, client: AsyncClient, app: FastAPI) -> None:
        from unittest.mock import AsyncMock, MagicMock

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        from app.database import get_db

        app.dependency_overrides[get_db] = lambda: mock_db

        test_settings = self._full_settings()
        with patch("app.routers.auth.get_settings", return_value=test_settings):
            response = await client.post(
                "/auth/login",
                json={"email": "nobody@example.com", "password": "anything"},
            )

        app.dependency_overrides.clear()

        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_me_with_valid_jwt(self, client: AsyncClient, app: FastAPI) -> None:
        from unittest.mock import AsyncMock, MagicMock

        user_id = uuid.uuid4()
        org_id = uuid.uuid4()

        user = MagicMock()
        user.id = user_id
        user.org_id = org_id
        user.email = "test@example.com"
        user.name = "Test User"
        user.role = "member"
        user.totp_enabled = False

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = user
        mock_db.execute.return_value = mock_result

        from app.database import get_db

        app.dependency_overrides[get_db] = lambda: mock_db

        # Create a valid JWT
        now = pendulum.now("UTC")
        payload = {
            "sub": str(user_id),
            "org_id": str(org_id),
            "email": "test@example.com",
            "role": "member",
            "iat": int(now.timestamp()),
            "exp": int(now.add(minutes=15).timestamp()),
        }
        access_token = jwt.encode(payload, self.JWT_SECRET, algorithm="HS256")

        test_settings = self._full_settings()
        with (
            patch("app.routers.auth.get_settings", return_value=test_settings),
            patch("app.auth.middleware.get_settings", return_value=test_settings),
        ):
            response = await client.get(
                "/auth/me",
                headers={"Authorization": f"Bearer {access_token}"},
            )

        app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["name"] == "Test User"

    @pytest.mark.asyncio
    async def test_me_with_expired_jwt(self, client: AsyncClient, app: FastAPI) -> None:
        now = pendulum.now("UTC")
        payload = {
            "sub": str(uuid.uuid4()),
            "org_id": str(uuid.uuid4()),
            "email": "test@example.com",
            "role": "member",
            "iat": int(now.subtract(hours=1).timestamp()),
            "exp": int(now.subtract(minutes=30).timestamp()),
        }
        expired_token = jwt.encode(payload, self.JWT_SECRET, algorithm="HS256")

        test_settings = self._full_settings()
        with (
            patch("app.routers.auth.get_settings", return_value=test_settings),
            patch("app.auth.middleware.get_settings", return_value=test_settings),
        ):
            response = await client.get(
                "/auth/me",
                headers={"Authorization": f"Bearer {expired_token}"},
            )

        assert response.status_code == 401
        assert "expired" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_me_without_auth_header(self, client: AsyncClient) -> None:
        test_settings = self._full_settings()
        with (
            patch("app.routers.auth.get_settings", return_value=test_settings),
            patch("app.auth.middleware.get_settings", return_value=test_settings),
        ):
            response = await client.get("/auth/me")

        assert response.status_code == 401
        assert "Authorization" in response.json()["detail"]


# =========================================================================
# Google OAuth stub
# =========================================================================


class TestGoogleOAuthStub:
    @pytest.mark.asyncio
    async def test_returns_501(self, client: AsyncClient) -> None:
        response = await client.get("/auth/google")

        assert response.status_code == 501
        assert "not implemented" in response.json()["detail"].lower()
