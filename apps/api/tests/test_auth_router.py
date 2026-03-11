"""Tests for auth router endpoints across all auth modes."""

from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import jwt
import pendulum
import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.auth.middleware import hash_password
from app.config import AuthMode, AuthSettings, settings
from app.models.auth import RefreshToken, User
from app.models.organization import Organization
from app.routers.auth import router


@pytest.fixture
def app() -> FastAPI:
    """Create a test FastAPI app with only the auth router."""
    test_app = FastAPI()
    test_app.include_router(router)
    return test_app


@pytest.fixture
async def client(app: FastAPI) -> AsyncClient:
    """Create an async HTTP client for testing."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# Test auth mode: none


@pytest.mark.asyncio
async def test_login_mode_none(client: AsyncClient) -> None:
    """Test /auth/login in mode=none returns static token."""
    with patch.object(settings, "auth", AuthSettings(mode=AuthMode.NONE)):
        response = await client.post(
            "/auth/login",
            json={"email": "any@example.com", "password": "anypassword"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["access_token"] == "owner-static-token-local-dev"
        assert data["refresh_token"] == "owner-static-token-local-dev"
        assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_refresh_mode_none(client: AsyncClient) -> None:
    """Test /auth/refresh in mode=none returns static token."""
    with patch.object(settings, "auth", AuthSettings(mode=AuthMode.NONE)):
        response = await client.post(
            "/auth/refresh",
            json={"refresh_token": "any-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["access_token"] == "owner-static-token-local-dev"
        assert data["refresh_token"] == "owner-static-token-local-dev"


@pytest.mark.asyncio
async def test_logout_mode_none(client: AsyncClient) -> None:
    """Test /auth/logout in mode=none is no-op."""
    with patch.object(settings, "auth", AuthSettings(mode=AuthMode.NONE)):
        response = await client.post(
            "/auth/logout",
            json={"refresh_token": "any-token"},
        )

        assert response.status_code == 204


@pytest.mark.asyncio
async def test_me_mode_none(client: AsyncClient) -> None:
    """Test /auth/me in mode=none returns owner profile."""
    with patch.object(settings, "auth", AuthSettings(mode=AuthMode.NONE)):
        response = await client.get("/auth/me")

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "owner@local"
        assert data["name"] == "Owner"
        assert data["role"] == "owner"
        assert data["totp_enabled"] is False


# Test auth mode: local


@pytest.mark.asyncio
async def test_login_mode_local_valid_password(client: AsyncClient) -> None:
    """Test /auth/login in mode=local with valid password."""
    password = "localsecret123"
    password_hash = hash_password(password)

    auth_settings = AuthSettings(mode=AuthMode.LOCAL, local_password_hash=password_hash)

    with patch.object(settings, "auth", auth_settings):
        response = await client.post(
            "/auth/login",
            json={"email": "local@example.com", "password": password},
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_mode_local_invalid_password(client: AsyncClient) -> None:
    """Test /auth/login in mode=local with invalid password."""
    password = "correctpassword"
    password_hash = hash_password(password)

    auth_settings = AuthSettings(mode=AuthMode.LOCAL, local_password_hash=password_hash)

    with patch.object(settings, "auth", auth_settings):
        response = await client.post(
            "/auth/login",
            json={"email": "local@example.com", "password": "wrongpassword"},
        )

        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]


@pytest.mark.asyncio
async def test_refresh_mode_local(client: AsyncClient) -> None:
    """Test /auth/refresh in mode=local returns same token."""
    auth_settings = AuthSettings(mode=AuthMode.LOCAL)

    with patch.object(settings, "auth", auth_settings):
        token = "local-bearer-token"
        response = await client.post(
            "/auth/refresh",
            json={"refresh_token": token},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["access_token"] == token
        assert data["refresh_token"] == token


# Test auth mode: full


@pytest.mark.asyncio
async def test_login_mode_full_valid_credentials(client: AsyncClient) -> None:
    """Test /auth/login in mode=full with valid credentials."""
    jwt_secret = secrets.token_urlsafe(32)
    auth_settings = AuthSettings(mode=AuthMode.FULL, jwt_secret=jwt_secret)

    # Mock user
    user = User(
        id=uuid.uuid4(),
        org_id=uuid.uuid4(),
        email="test@example.com",
        name="Test User",
        password_hash=hash_password("testpassword123"),
        role="member",
        totp_enabled=False,
    )

    # Mock database
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = user
    mock_db.execute.return_value = mock_result

    with patch.object(settings, "auth", auth_settings), patch(
        "app.routers.auth.get_db", return_value=mock_db
    ):
        response = await client.post(
            "/auth/login",
            json={"email": "test@example.com", "password": "testpassword123"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

        # Verify JWT structure
        payload = jwt.decode(data["access_token"], jwt_secret, algorithms=["HS256"])
        assert payload["email"] == "test@example.com"
        assert payload["role"] == "member"


@pytest.mark.asyncio
async def test_login_mode_full_invalid_credentials(client: AsyncClient) -> None:
    """Test /auth/login in mode=full with invalid credentials."""
    jwt_secret = secrets.token_urlsafe(32)
    auth_settings = AuthSettings(mode=AuthMode.FULL, jwt_secret=jwt_secret)

    # Mock user with different password
    user = User(
        id=uuid.uuid4(),
        org_id=uuid.uuid4(),
        email="test@example.com",
        name="Test User",
        password_hash=hash_password("testpassword123"),
        role="member",
        totp_enabled=False,
    )

    # Mock database
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = user
    mock_db.execute.return_value = mock_result

    with patch.object(settings, "auth", auth_settings), patch(
        "app.routers.auth.get_db", return_value=mock_db
    ):
        response = await client.post(
            "/auth/login",
            json={"email": "test@example.com", "password": "wrongpassword"},
        )

        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_mode_full_nonexistent_user(client: AsyncClient) -> None:
    """Test /auth/login in mode=full with nonexistent user."""
    jwt_secret = secrets.token_urlsafe(32)
    auth_settings = AuthSettings(mode=AuthMode.FULL, jwt_secret=jwt_secret)

    # Mock database returning no user
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_result

    with patch.object(settings, "auth", auth_settings), patch(
        "app.routers.auth.get_db", return_value=mock_db
    ):
        response = await client.post(
            "/auth/login",
            json={"email": "nonexistent@example.com", "password": "password"},
        )

        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]


@pytest.mark.asyncio
async def test_refresh_mode_full_valid_token(client: AsyncClient) -> None:
    """Test /auth/refresh in mode=full with valid refresh token."""
    jwt_secret = secrets.token_urlsafe(32)
    auth_settings = AuthSettings(mode=AuthMode.FULL, jwt_secret=jwt_secret)

    user_id = uuid.uuid4()
    org_id = uuid.uuid4()

    # Mock user
    user = User(
        id=user_id,
        org_id=org_id,
        email="test@example.com",
        name="Test User",
        role="member",
        totp_enabled=False,
    )

    # Create a mock refresh token
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()

    refresh_token = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=pendulum.now("UTC").add(days=7),
    )

    # Mock database
    mock_db = AsyncMock()
    mock_result_token = MagicMock()
    mock_result_token.scalar_one_or_none.return_value = refresh_token
    mock_result_user = MagicMock()
    mock_result_user.scalar_one_or_none.return_value = user

    # Side effect to return different results for different queries
    mock_db.execute.side_effect = [mock_result_token, mock_result_user]

    with patch.object(settings, "auth", auth_settings), patch(
        "app.routers.auth.get_db", return_value=mock_db
    ):
        response = await client.post(
            "/auth/refresh",
            json={"refresh_token": token},
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["refresh_token"] != token  # Token rotation


@pytest.mark.asyncio
async def test_refresh_mode_full_invalid_token(client: AsyncClient) -> None:
    """Test /auth/refresh in mode=full with invalid refresh token."""
    jwt_secret = secrets.token_urlsafe(32)
    auth_settings = AuthSettings(mode=AuthMode.FULL, jwt_secret=jwt_secret)

    # Mock database returning no token
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_result

    with patch.object(settings, "auth", auth_settings), patch(
        "app.routers.auth.get_db", return_value=mock_db
    ):
        response = await client.post(
            "/auth/refresh",
            json={"refresh_token": "invalid-token"},
        )

        assert response.status_code == 401
        assert "Invalid refresh token" in response.json()["detail"]


@pytest.mark.asyncio
async def test_refresh_mode_full_expired_token(client: AsyncClient) -> None:
    """Test /auth/refresh in mode=full with expired refresh token."""
    jwt_secret = secrets.token_urlsafe(32)
    auth_settings = AuthSettings(mode=AuthMode.FULL, jwt_secret=jwt_secret)

    user_id = uuid.uuid4()

    # Create an expired mock refresh token
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()

    refresh_token = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=pendulum.now("UTC").subtract(days=1),  # Expired
    )

    # Mock database
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = refresh_token
    mock_db.execute.return_value = mock_result

    with patch.object(settings, "auth", auth_settings), patch(
        "app.routers.auth.get_db", return_value=mock_db
    ):
        response = await client.post(
            "/auth/refresh",
            json={"refresh_token": token},
        )

        assert response.status_code == 401
        assert "expired" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_logout_mode_full(client: AsyncClient) -> None:
    """Test /auth/logout in mode=full revokes refresh token."""
    jwt_secret = secrets.token_urlsafe(32)
    auth_settings = AuthSettings(mode=AuthMode.FULL, jwt_secret=jwt_secret)

    user_id = uuid.uuid4()

    # Create a mock refresh token
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()

    refresh_token = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=pendulum.now("UTC").add(days=7),
    )

    # Mock database
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = refresh_token
    mock_db.execute.return_value = mock_result

    with patch.object(settings, "auth", auth_settings), patch(
        "app.routers.auth.get_db", return_value=mock_db
    ):
        response = await client.post(
            "/auth/logout",
            json={"refresh_token": token},
        )

        assert response.status_code == 204

        # Verify token is revoked
        assert refresh_token.revoked_at is not None


@pytest.mark.asyncio
async def test_me_mode_full(client: AsyncClient) -> None:
    """Test /auth/me in mode=full returns user profile."""
    jwt_secret = secrets.token_urlsafe(32)
    auth_settings = AuthSettings(mode=AuthMode.FULL, jwt_secret=jwt_secret)

    user_id = uuid.uuid4()
    org_id = uuid.uuid4()

    # Mock user
    user = User(
        id=user_id,
        org_id=org_id,
        email="test@example.com",
        name="Test User",
        role="member",
        totp_enabled=False,
    )

    # Create access token
    now = datetime.utcnow()
    expire = now + timedelta(minutes=15)

    payload = {
        "sub": str(user_id),
        "org_id": str(org_id),
        "email": "test@example.com",
        "role": "member",
        "iat": now,
        "exp": expire,
    }

    access_token = jwt.encode(payload, jwt_secret, algorithm="HS256")

    # Mock database
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = user
    mock_db.execute.return_value = mock_result

    with patch.object(settings, "auth", auth_settings), patch(
        "app.routers.auth.get_db", return_value=mock_db
    ):
        response = await client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["name"] == "Test User"
        assert data["role"] == "member"
        assert data["totp_enabled"] is False


# Test Google OAuth stub


@pytest.mark.asyncio
async def test_google_oauth_stub(client: AsyncClient) -> None:
    """Test /auth/google returns 501 Not Implemented."""
    response = await client.get("/auth/google")

    assert response.status_code == 501
    assert "not implemented" in response.json()["detail"].lower()
