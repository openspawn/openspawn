"""Tests for authentication module."""

import time

from openspawn.auth import APIKeyAuth, HMACAuth


def test_hmac_auth_signature() -> None:
    """Test HMAC signature generation."""
    auth = HMACAuth(
        agent_id="test-agent",
        secret="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    )

    # Test with fixed values to verify signature
    timestamp = "1234567890"
    nonce = "test-nonce"
    signature = auth.sign("GET", "/agents", timestamp, nonce, "")

    # Signature should be deterministic
    signature2 = auth.sign("GET", "/agents", timestamp, nonce, "")
    assert signature == signature2


def test_hmac_auth_headers() -> None:
    """Test HMAC header generation."""
    auth = HMACAuth(
        agent_id="test-agent",
        secret="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    )

    headers = auth.get_headers("GET", "/agents")

    assert "X-Agent-Id" in headers
    assert headers["X-Agent-Id"] == "test-agent"
    assert "X-Timestamp" in headers
    assert "X-Nonce" in headers
    assert "X-Signature" in headers

    # Timestamp should be recent
    timestamp = int(headers["X-Timestamp"])
    now = int(time.time())
    assert abs(timestamp - now) < 5  # Within 5 seconds


def test_hmac_auth_body_included() -> None:
    """Test that request body is included in signature."""
    auth = HMACAuth(
        agent_id="test-agent",
        secret="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    )

    # Different bodies should produce different signatures
    headers1 = auth.get_headers("POST", "/agents", '{"name":"agent1"}')
    headers2 = auth.get_headers("POST", "/agents", '{"name":"agent2"}')

    assert headers1["X-Signature"] != headers2["X-Signature"]


def test_api_key_auth_headers() -> None:
    """Test API key authentication headers."""
    auth = APIKeyAuth("test-api-key-123")

    headers = auth.get_headers("GET", "/agents")

    assert "Authorization" in headers
    assert headers["Authorization"] == "Bearer test-api-key-123"
