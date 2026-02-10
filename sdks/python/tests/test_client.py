"""Tests for OpenSpawn client."""

import pytest

from openspawn import AsyncOpenSpawnClient, OpenSpawnClient


def test_sync_client_init_with_api_key() -> None:
    """Test synchronous client initialization with API key."""
    client = OpenSpawnClient(
        base_url="https://api.openspawn.dev",
        api_key="test-key",
    )

    assert client.agents is not None
    assert client.tasks is not None
    assert client.credits is not None
    assert client.messages is not None
    assert client.events is not None

    client.close()


def test_sync_client_init_with_hmac() -> None:
    """Test synchronous client initialization with HMAC auth."""
    client = OpenSpawnClient(
        base_url="https://api.openspawn.dev",
        agent_id="test-agent",
        secret="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    )

    assert client.agents is not None
    client.close()


def test_sync_client_init_missing_auth() -> None:
    """Test that client initialization fails without auth."""
    with pytest.raises(ValueError, match="Must provide either api_key"):
        OpenSpawnClient(base_url="https://api.openspawn.dev")


def test_sync_client_context_manager() -> None:
    """Test synchronous client as context manager."""
    with OpenSpawnClient(
        base_url="https://api.openspawn.dev",
        api_key="test-key",
    ) as client:
        assert client.agents is not None


@pytest.mark.asyncio
async def test_async_client_init_with_api_key() -> None:
    """Test asynchronous client initialization with API key."""
    client = AsyncOpenSpawnClient(
        base_url="https://api.openspawn.dev",
        api_key="test-key",
    )

    assert client.agents is not None
    assert client.tasks is not None
    assert client.credits is not None
    assert client.messages is not None
    assert client.events is not None

    await client.close()


@pytest.mark.asyncio
async def test_async_client_context_manager() -> None:
    """Test asynchronous client as context manager."""
    async with AsyncOpenSpawnClient(
        base_url="https://api.openspawn.dev",
        api_key="test-key",
    ) as client:
        assert client.agents is not None
