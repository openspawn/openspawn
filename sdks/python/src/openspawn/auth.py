"""Authentication utilities for OpenSpawn SDK."""

import hashlib
import hmac
import secrets
import time
from typing import Optional


class HMACAuth:
    """HMAC-SHA256 authentication for OpenSpawn API."""

    def __init__(self, agent_id: str, secret: str) -> None:
        """
        Initialize HMAC authentication.

        Args:
            agent_id: Agent ID
            secret: Hex-encoded signing secret (64 characters)
        """
        self.agent_id = agent_id
        self.secret = secret

    def sign(
        self, method: str, path: str, timestamp: str, nonce: str, body: str
    ) -> str:
        """
        Compute HMAC-SHA256 signature.

        Args:
            method: HTTP method (e.g., "GET", "POST")
            path: Request path (e.g., "/agents")
            timestamp: Unix timestamp as string
            nonce: Random nonce (hex)
            body: Request body (empty string for GET)

        Returns:
            Hex-encoded signature
        """
        message = f"{method}{path}{timestamp}{nonce}{body}"
        secret_bytes = bytes.fromhex(self.secret)
        signature = hmac.new(secret_bytes, message.encode(), hashlib.sha256)
        return signature.hexdigest()

    def get_headers(self, method: str, path: str, body: str = "") -> dict[str, str]:
        """
        Generate authentication headers for a request.

        Args:
            method: HTTP method
            path: Request path
            body: Request body (default: empty string)

        Returns:
            Dictionary of authentication headers
        """
        timestamp = str(int(time.time()))
        nonce = secrets.token_hex(16)
        signature = self.sign(method, path, timestamp, nonce, body)

        return {
            "X-Agent-Id": self.agent_id,
            "X-Timestamp": timestamp,
            "X-Nonce": nonce,
            "X-Signature": signature,
        }


class APIKeyAuth:
    """API key authentication for OpenSpawn API."""

    def __init__(self, api_key: str) -> None:
        """
        Initialize API key authentication.

        Args:
            api_key: API key
        """
        self.api_key = api_key

    def get_headers(self, method: str, path: str, body: str = "") -> dict[str, str]:
        """
        Generate authentication headers for a request.

        Args:
            method: HTTP method (unused for API key auth)
            path: Request path (unused for API key auth)
            body: Request body (unused for API key auth)

        Returns:
            Dictionary of authentication headers
        """
        return {"Authorization": f"Bearer {self.api_key}"}
