"""HTTP client with retry logic and error handling."""

import asyncio
import json
import secrets
from typing import Any, Optional, Union

import httpx

from openspawn.auth import APIKeyAuth, HMACAuth


class OpenSpawnError(Exception):
    """Base exception for OpenSpawn SDK errors."""

    pass


class APIError(OpenSpawnError):
    """API error response."""

    def __init__(
        self, message: str, status_code: int, response_data: Optional[dict[str, Any]] = None
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.response_data = response_data or {}


class AuthenticationError(OpenSpawnError):
    """Authentication error."""

    pass


class RetryableError(OpenSpawnError):
    """Error that can be retried."""

    pass


class BaseHTTPClient:
    """Base HTTP client with shared functionality."""

    def __init__(
        self,
        base_url: str,
        auth: Union[HMACAuth, APIKeyAuth],
        timeout: float = 30.0,
        max_retries: int = 3,
    ) -> None:
        """
        Initialize HTTP client.

        Args:
            base_url: Base URL for API (e.g., "https://api.openspawn.dev")
            auth: Authentication instance (HMACAuth or APIKeyAuth)
            timeout: Request timeout in seconds
            max_retries: Maximum number of retries for retryable errors
        """
        self.base_url = base_url.rstrip("/")
        self.auth = auth
        self.timeout = timeout
        self.max_retries = max_retries

    def _should_retry(self, status_code: int) -> bool:
        """Check if a status code should be retried."""
        return status_code in (408, 429, 500, 502, 503, 504)

    def _get_retry_delay(self, attempt: int) -> float:
        """Calculate exponential backoff delay."""
        return min(2**attempt, 32)  # Max 32 seconds

    def _generate_idempotency_key(self) -> str:
        """Generate a random idempotency key."""
        return secrets.token_hex(16)


class SyncHTTPClient(BaseHTTPClient):
    """Synchronous HTTP client."""

    def __init__(
        self,
        base_url: str,
        auth: Union[HMACAuth, APIKeyAuth],
        timeout: float = 30.0,
        max_retries: int = 3,
    ) -> None:
        super().__init__(base_url, auth, timeout, max_retries)
        self.client = httpx.Client(timeout=timeout)

    def request(
        self,
        method: str,
        path: str,
        *,
        json_data: Optional[dict[str, Any]] = None,
        params: Optional[dict[str, Any]] = None,
        idempotent: bool = False,
    ) -> dict[str, Any]:
        """
        Make an HTTP request with retry logic.

        Args:
            method: HTTP method
            path: Request path (e.g., "/agents")
            json_data: JSON request body
            params: Query parameters
            idempotent: Whether to add idempotency key header

        Returns:
            Response JSON data

        Raises:
            APIError: On API error response
            AuthenticationError: On authentication failure
            RetryableError: On retryable error after max retries
        """
        url = f"{self.base_url}{path}"
        body = json.dumps(json_data) if json_data else ""

        headers = {
            "Content-Type": "application/json",
            **self.auth.get_headers(method, path, body),
        }

        if idempotent:
            headers["Idempotency-Key"] = self._generate_idempotency_key()

        for attempt in range(self.max_retries + 1):
            try:
                response = self.client.request(
                    method,
                    url,
                    content=body if body else None,
                    params=params,
                    headers=headers,
                )

                if response.status_code == 401:
                    raise AuthenticationError("Authentication failed")

                if 200 <= response.status_code < 300:
                    return response.json()

                if self._should_retry(response.status_code) and attempt < self.max_retries:
                    import time

                    delay = self._get_retry_delay(attempt)
                    time.sleep(delay)
                    continue

                # Non-retryable error or max retries exceeded
                error_data = response.json() if response.content else {}
                raise APIError(
                    f"API request failed: {response.status_code}",
                    response.status_code,
                    error_data,
                )

            except httpx.RequestError as e:
                if attempt < self.max_retries:
                    import time

                    delay = self._get_retry_delay(attempt)
                    time.sleep(delay)
                    continue
                raise RetryableError(f"Request failed after {self.max_retries} retries: {e}")

        raise RetryableError(f"Request failed after {self.max_retries} retries")

    def close(self) -> None:
        """Close the HTTP client."""
        self.client.close()

    def __enter__(self) -> "SyncHTTPClient":
        return self

    def __exit__(self, *args: Any) -> None:
        self.close()


class AsyncHTTPClient(BaseHTTPClient):
    """Asynchronous HTTP client."""

    def __init__(
        self,
        base_url: str,
        auth: Union[HMACAuth, APIKeyAuth],
        timeout: float = 30.0,
        max_retries: int = 3,
    ) -> None:
        super().__init__(base_url, auth, timeout, max_retries)
        self.client = httpx.AsyncClient(timeout=timeout)

    async def request(
        self,
        method: str,
        path: str,
        *,
        json_data: Optional[dict[str, Any]] = None,
        params: Optional[dict[str, Any]] = None,
        idempotent: bool = False,
    ) -> dict[str, Any]:
        """
        Make an async HTTP request with retry logic.

        Args:
            method: HTTP method
            path: Request path (e.g., "/agents")
            json_data: JSON request body
            params: Query parameters
            idempotent: Whether to add idempotency key header

        Returns:
            Response JSON data

        Raises:
            APIError: On API error response
            AuthenticationError: On authentication failure
            RetryableError: On retryable error after max retries
        """
        url = f"{self.base_url}{path}"
        body = json.dumps(json_data) if json_data else ""

        headers = {
            "Content-Type": "application/json",
            **self.auth.get_headers(method, path, body),
        }

        if idempotent:
            headers["Idempotency-Key"] = self._generate_idempotency_key()

        for attempt in range(self.max_retries + 1):
            try:
                response = await self.client.request(
                    method,
                    url,
                    content=body if body else None,
                    params=params,
                    headers=headers,
                )

                if response.status_code == 401:
                    raise AuthenticationError("Authentication failed")

                if 200 <= response.status_code < 300:
                    return response.json()

                if self._should_retry(response.status_code) and attempt < self.max_retries:
                    delay = self._get_retry_delay(attempt)
                    await asyncio.sleep(delay)
                    continue

                # Non-retryable error or max retries exceeded
                error_data = response.json() if response.content else {}
                raise APIError(
                    f"API request failed: {response.status_code}",
                    response.status_code,
                    error_data,
                )

            except httpx.RequestError as e:
                if attempt < self.max_retries:
                    delay = self._get_retry_delay(attempt)
                    await asyncio.sleep(delay)
                    continue
                raise RetryableError(f"Request failed after {self.max_retries} retries: {e}")

        raise RetryableError(f"Request failed after {self.max_retries} retries")

    async def close(self) -> None:
        """Close the HTTP client."""
        await self.client.aclose()

    async def __aenter__(self) -> "AsyncHTTPClient":
        return self

    async def __aexit__(self, *args: Any) -> None:
        await self.close()
