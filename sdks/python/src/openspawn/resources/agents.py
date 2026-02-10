"""Agents resource module."""

from typing import Any, Optional

from openspawn.http_client import AsyncHTTPClient, SyncHTTPClient
from openspawn.models import Agent, CreateAgentRequest, UpdateAgentRequest


class AgentsResource:
    """Synchronous agents resource."""

    def __init__(self, client: SyncHTTPClient) -> None:
        self._client = client

    def list(self) -> list[Agent]:
        """
        List all agents in the organization.

        Returns:
            List of agents
        """
        response = self._client.request("GET", "/agents")
        return [Agent(**agent) for agent in response["data"]]

    def get(self, agent_id: str) -> Agent:
        """
        Get a specific agent by ID.

        Args:
            agent_id: Agent ID

        Returns:
            Agent instance
        """
        response = self._client.request("GET", f"/agents/{agent_id}")
        return Agent(**response["data"])

    def create(self, request: CreateAgentRequest) -> dict[str, Any]:
        """
        Register a new agent (HR role required).

        Args:
            request: Agent creation request

        Returns:
            Response containing agent data and secret (SAVE THE SECRET!)
        """
        response = self._client.request(
            "POST",
            "/agents/register",
            json_data=request.model_dump(exclude_none=True),
            idempotent=True,
        )
        return response

    def update(self, agent_id: str, request: UpdateAgentRequest) -> Agent:
        """
        Update an agent (HR role required).

        Args:
            agent_id: Agent ID
            request: Agent update request

        Returns:
            Updated agent
        """
        response = self._client.request(
            "PATCH",
            f"/agents/{agent_id}",
            json_data=request.model_dump(exclude_none=True),
        )
        return Agent(**response["data"])

    def revoke(self, agent_id: str) -> dict[str, Any]:
        """
        Revoke an agent (HR role required).

        Args:
            agent_id: Agent ID

        Returns:
            Response containing revoked agent status
        """
        response = self._client.request("POST", f"/agents/{agent_id}/revoke")
        return response

    def get_balance(self, agent_id: str) -> int:
        """
        Get credit balance for an agent.

        Args:
            agent_id: Agent ID

        Returns:
            Current balance
        """
        response = self._client.request("GET", f"/agents/{agent_id}/credits/balance")
        return response["data"]

    def spawn(
        self,
        name: str,
        level: int,
        *,
        model: Optional[str] = None,
        metadata: Optional[dict[str, Any]] = None,
    ) -> dict[str, Any]:
        """
        Spawn a new child agent.

        Args:
            name: Agent name
            level: Agent level
            model: AI model name
            metadata: Additional metadata

        Returns:
            Response containing spawned agent and secret
        """
        response = self._client.request(
            "POST",
            "/agents/spawn",
            json_data={
                "name": name,
                "level": level,
                "model": model,
                "metadata": metadata,
            },
            idempotent=True,
        )
        return response

    def activate(self, agent_id: str) -> dict[str, Any]:
        """
        Activate a pending agent.

        Args:
            agent_id: Agent ID

        Returns:
            Response with activation status
        """
        response = self._client.request("POST", f"/agents/{agent_id}/activate")
        return response

    def reject(self, agent_id: str, reason: Optional[str] = None) -> dict[str, Any]:
        """
        Reject a pending agent.

        Args:
            agent_id: Agent ID
            reason: Rejection reason

        Returns:
            Response message
        """
        response = self._client.request(
            "DELETE",
            f"/agents/{agent_id}/reject",
            json_data={"reason": reason} if reason else {},
        )
        return response

    def get_hierarchy(self, agent_id: str, depth: int = 3) -> dict[str, Any]:
        """
        Get agent hierarchy.

        Args:
            agent_id: Agent ID
            depth: Hierarchy depth

        Returns:
            Hierarchy data
        """
        response = self._client.request(
            "GET",
            f"/agents/{agent_id}/hierarchy",
            params={"depth": str(depth)},
        )
        return response["data"]


class AsyncAgentsResource:
    """Asynchronous agents resource."""

    def __init__(self, client: AsyncHTTPClient) -> None:
        self._client = client

    async def list(self) -> list[Agent]:
        """
        List all agents in the organization.

        Returns:
            List of agents
        """
        response = await self._client.request("GET", "/agents")
        return [Agent(**agent) for agent in response["data"]]

    async def get(self, agent_id: str) -> Agent:
        """
        Get a specific agent by ID.

        Args:
            agent_id: Agent ID

        Returns:
            Agent instance
        """
        response = await self._client.request("GET", f"/agents/{agent_id}")
        return Agent(**response["data"])

    async def create(self, request: CreateAgentRequest) -> dict[str, Any]:
        """
        Register a new agent (HR role required).

        Args:
            request: Agent creation request

        Returns:
            Response containing agent data and secret (SAVE THE SECRET!)
        """
        response = await self._client.request(
            "POST",
            "/agents/register",
            json_data=request.model_dump(exclude_none=True),
            idempotent=True,
        )
        return response

    async def update(self, agent_id: str, request: UpdateAgentRequest) -> Agent:
        """
        Update an agent (HR role required).

        Args:
            agent_id: Agent ID
            request: Agent update request

        Returns:
            Updated agent
        """
        response = await self._client.request(
            "PATCH",
            f"/agents/{agent_id}",
            json_data=request.model_dump(exclude_none=True),
        )
        return Agent(**response["data"])

    async def revoke(self, agent_id: str) -> dict[str, Any]:
        """
        Revoke an agent (HR role required).

        Args:
            agent_id: Agent ID

        Returns:
            Response containing revoked agent status
        """
        response = await self._client.request("POST", f"/agents/{agent_id}/revoke")
        return response

    async def get_balance(self, agent_id: str) -> int:
        """
        Get credit balance for an agent.

        Args:
            agent_id: Agent ID

        Returns:
            Current balance
        """
        response = await self._client.request("GET", f"/agents/{agent_id}/credits/balance")
        return response["data"]

    async def spawn(
        self,
        name: str,
        level: int,
        *,
        model: Optional[str] = None,
        metadata: Optional[dict[str, Any]] = None,
    ) -> dict[str, Any]:
        """
        Spawn a new child agent.

        Args:
            name: Agent name
            level: Agent level
            model: AI model name
            metadata: Additional metadata

        Returns:
            Response containing spawned agent and secret
        """
        response = await self._client.request(
            "POST",
            "/agents/spawn",
            json_data={
                "name": name,
                "level": level,
                "model": model,
                "metadata": metadata,
            },
            idempotent=True,
        )
        return response

    async def activate(self, agent_id: str) -> dict[str, Any]:
        """
        Activate a pending agent.

        Args:
            agent_id: Agent ID

        Returns:
            Response with activation status
        """
        response = await self._client.request("POST", f"/agents/{agent_id}/activate")
        return response

    async def reject(self, agent_id: str, reason: Optional[str] = None) -> dict[str, Any]:
        """
        Reject a pending agent.

        Args:
            agent_id: Agent ID
            reason: Rejection reason

        Returns:
            Response message
        """
        response = await self._client.request(
            "DELETE",
            f"/agents/{agent_id}/reject",
            json_data={"reason": reason} if reason else {},
        )
        return response

    async def get_hierarchy(self, agent_id: str, depth: int = 3) -> dict[str, Any]:
        """
        Get agent hierarchy.

        Args:
            agent_id: Agent ID
            depth: Hierarchy depth

        Returns:
            Hierarchy data
        """
        response = await self._client.request(
            "GET",
            f"/agents/{agent_id}/hierarchy",
            params={"depth": str(depth)},
        )
        return response["data"]
