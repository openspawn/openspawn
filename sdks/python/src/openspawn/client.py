"""Main OpenSpawn client."""

from typing import Optional

from openspawn.auth import APIKeyAuth, HMACAuth
from openspawn.http_client import AsyncHTTPClient, SyncHTTPClient
from openspawn.resources import (
    AgentsResource,
    AsyncAgentsResource,
    AsyncCreditsResource,
    AsyncEventsResource,
    AsyncMessagesResource,
    AsyncTasksResource,
    CreditsResource,
    EventsResource,
    MessagesResource,
    TasksResource,
)


class OpenSpawnClient:
    """
    Synchronous OpenSpawn API client.

    Example with API key:
        >>> client = OpenSpawnClient(
        ...     base_url="https://api.openspawn.dev",
        ...     api_key="your-api-key"
        ... )
        >>> agents = client.agents.list()

    Example with HMAC auth:
        >>> client = OpenSpawnClient(
        ...     base_url="https://api.openspawn.dev",
        ...     agent_id="agent_123",
        ...     secret="your-hex-secret"
        ... )
        >>> tasks = client.tasks.list()
    """

    def __init__(
        self,
        base_url: str,
        *,
        api_key: Optional[str] = None,
        agent_id: Optional[str] = None,
        secret: Optional[str] = None,
        timeout: float = 30.0,
        max_retries: int = 3,
    ) -> None:
        """
        Initialize OpenSpawn client.

        Args:
            base_url: Base URL for the API (e.g., "https://api.openspawn.dev")
            api_key: API key for authentication (mutually exclusive with agent_id/secret)
            agent_id: Agent ID for HMAC authentication
            secret: Hex-encoded signing secret for HMAC authentication
            timeout: Request timeout in seconds
            max_retries: Maximum number of retries for failed requests

        Raises:
            ValueError: If neither api_key nor (agent_id, secret) are provided
        """
        if api_key:
            auth = APIKeyAuth(api_key)
        elif agent_id and secret:
            auth = HMACAuth(agent_id, secret)
        else:
            raise ValueError(
                "Must provide either api_key or both agent_id and secret for authentication"
            )

        self._http_client = SyncHTTPClient(
            base_url=base_url,
            auth=auth,
            timeout=timeout,
            max_retries=max_retries,
        )

        # Initialize resource modules
        self.agents = AgentsResource(self._http_client)
        self.tasks = TasksResource(self._http_client)
        self.credits = CreditsResource(self._http_client)
        self.messages = MessagesResource(self._http_client)
        self.events = EventsResource(self._http_client)

    def close(self) -> None:
        """Close the HTTP client and cleanup resources."""
        self._http_client.close()

    def __enter__(self) -> "OpenSpawnClient":
        """Support context manager protocol."""
        return self

    def __exit__(self, *args: object) -> None:
        """Support context manager protocol."""
        self.close()


class AsyncOpenSpawnClient:
    """
    Asynchronous OpenSpawn API client.

    Example with API key:
        >>> async with AsyncOpenSpawnClient(
        ...     base_url="https://api.openspawn.dev",
        ...     api_key="your-api-key"
        ... ) as client:
        ...     agents = await client.agents.list()

    Example with HMAC auth:
        >>> async with AsyncOpenSpawnClient(
        ...     base_url="https://api.openspawn.dev",
        ...     agent_id="agent_123",
        ...     secret="your-hex-secret"
        ... ) as client:
        ...     tasks = await client.tasks.list()
    """

    def __init__(
        self,
        base_url: str,
        *,
        api_key: Optional[str] = None,
        agent_id: Optional[str] = None,
        secret: Optional[str] = None,
        timeout: float = 30.0,
        max_retries: int = 3,
    ) -> None:
        """
        Initialize async OpenSpawn client.

        Args:
            base_url: Base URL for the API (e.g., "https://api.openspawn.dev")
            api_key: API key for authentication (mutually exclusive with agent_id/secret)
            agent_id: Agent ID for HMAC authentication
            secret: Hex-encoded signing secret for HMAC authentication
            timeout: Request timeout in seconds
            max_retries: Maximum number of retries for failed requests

        Raises:
            ValueError: If neither api_key nor (agent_id, secret) are provided
        """
        if api_key:
            auth = APIKeyAuth(api_key)
        elif agent_id and secret:
            auth = HMACAuth(agent_id, secret)
        else:
            raise ValueError(
                "Must provide either api_key or both agent_id and secret for authentication"
            )

        self._http_client = AsyncHTTPClient(
            base_url=base_url,
            auth=auth,
            timeout=timeout,
            max_retries=max_retries,
        )

        # Initialize resource modules
        self.agents = AsyncAgentsResource(self._http_client)
        self.tasks = AsyncTasksResource(self._http_client)
        self.credits = AsyncCreditsResource(self._http_client)
        self.messages = AsyncMessagesResource(self._http_client)
        self.events = AsyncEventsResource(self._http_client)

    async def close(self) -> None:
        """Close the HTTP client and cleanup resources."""
        await self._http_client.close()

    async def __aenter__(self) -> "AsyncOpenSpawnClient":
        """Support async context manager protocol."""
        return self

    async def __aexit__(self, *args: object) -> None:
        """Support async context manager protocol."""
        await self.close()
