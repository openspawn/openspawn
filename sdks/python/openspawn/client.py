"""OpenSpawn API client."""

from __future__ import annotations

import os
from typing import Any, Optional
from urllib.parse import urljoin

try:
    import httpx
except ImportError:
    raise ImportError("httpx is required. Install with: pip install openspawn[http]")

from openspawn.models import (
    Agent,
    Task,
    TaskStatus,
    TaskPriority,
    Channel,
    Message,
    CreditBalance,
    Escalation,
)


class OpenSpawnError(Exception):
    """Base exception for OpenSpawn SDK."""
    pass


class APIError(OpenSpawnError):
    """API request failed."""
    def __init__(self, message: str, status_code: Optional[int] = None, response: Optional[dict] = None):
        super().__init__(message)
        self.status_code = status_code
        self.response = response


class OpenSpawn:
    """OpenSpawn API client.
    
    Args:
        api_url: Base URL for the OpenSpawn API (default: https://api.openspawn.ai)
        api_key: API key for authentication (default: from OPENSPAWN_API_KEY env var)
        org_id: Organization ID (required for most operations)
        timeout: Request timeout in seconds (default: 30)
    
    Example:
        >>> from openspawn import OpenSpawn, TaskPriority
        >>> client = OpenSpawn(org_id="my-org-id", api_key="...")
        >>> task = client.tasks.create(
        ...     title="Build feature",
        ...     priority=TaskPriority.HIGH,
        ...     assignee_agent_id="engineer-1"
        ... )
    """

    def __init__(
        self,
        api_url: str = "https://api.openspawn.ai",
        api_key: Optional[str] = None,
        org_id: Optional[str] = None,
        timeout: float = 30.0,
    ):
        self.api_url = api_url.rstrip("/")
        self.api_key = api_key or os.getenv("OPENSPAWN_API_KEY")
        self.org_id = org_id or os.getenv("OPENSPAWN_ORG_ID")
        self.timeout = timeout
        self._client = httpx.Client(timeout=timeout)
        
        # Resource namespaces
        self.tasks = TasksResource(self)
        self.agents = AgentsResource(self)
        self.messages = MessagesResource(self)
        self.credits = CreditsResource(self)
        self.escalations = EscalationsResource(self)

    def _request(
        self,
        method: str,
        path: str,
        json: Optional[dict] = None,
        params: Optional[dict] = None,
        require_org: bool = True,
    ) -> dict[str, Any]:
        """Make an API request."""
        if require_org and not self.org_id:
            raise OpenSpawnError("org_id is required for this operation")
        
        url = urljoin(self.api_url, path)
        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        # Add org_id to params if required
        if require_org and params is None:
            params = {}
        if require_org:
            params["orgId"] = self.org_id
        
        try:
            resp = self._client.request(
                method,
                url,
                json=json,
                params=params,
                headers=headers,
            )
            resp.raise_for_status()
            return resp.json() if resp.content else {}
        except httpx.HTTPStatusError as e:
            try:
                error_data = e.response.json()
                message = error_data.get("message", str(e))
            except Exception:
                message = str(e)
            raise APIError(message, status_code=e.response.status_code, response=error_data if 'error_data' in locals() else None)
        except httpx.RequestError as e:
            raise APIError(f"Request failed: {e}")

    def close(self):
        """Close the HTTP client."""
        self._client.close()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()


class TasksResource:
    """Tasks API methods."""
    
    def __init__(self, client: OpenSpawn):
        self._client = client

    def create(
        self,
        title: str,
        description: str = "",
        priority: TaskPriority = TaskPriority.MEDIUM,
        assignee_agent_id: Optional[str] = None,
        **kwargs,
    ) -> Task:
        """Create a new task."""
        data = {
            "title": title,
            "description": description,
            "priority": priority.value,
            "orgId": self._client.org_id,
            **kwargs,
        }
        if assignee_agent_id:
            data["assigneeAgentId"] = assignee_agent_id
        
        resp = self._client._request("POST", "/api/v1/tasks", json=data)
        return Task.from_dict(resp)

    def list(self, status: Optional[TaskStatus] = None, assignee_agent_id: Optional[str] = None) -> list[Task]:
        """List tasks."""
        params = {}
        if status:
            params["status"] = status.value
        if assignee_agent_id:
            params["assigneeAgentId"] = assignee_agent_id
        
        resp = self._client._request("GET", "/api/v1/tasks", params=params)
        return [Task.from_dict(t) for t in resp]

    def get(self, task_id: str) -> Task:
        """Get a task by ID."""
        resp = self._client._request("GET", f"/api/v1/tasks/{task_id}")
        return Task.from_dict(resp)

    def transition(self, task_id: str, status: TaskStatus) -> Task:
        """Transition a task to a new status."""
        resp = self._client._request("POST", f"/api/v1/tasks/{task_id}/transition", json={"status": status.value})
        return Task.from_dict(resp)

    def assign(self, task_id: str, assignee_agent_id: str) -> Task:
        """Assign a task to an agent."""
        resp = self._client._request("POST", f"/api/v1/tasks/{task_id}/assign", json={"assigneeAgentId": assignee_agent_id})
        return Task.from_dict(resp)


class AgentsResource:
    """Agents API methods."""
    
    def __init__(self, client: OpenSpawn):
        self._client = client

    def list(self) -> list[Agent]:
        """List all agents in the organization."""
        resp = self._client._request("GET", "/api/v1/agents")
        return [Agent.from_dict(a) for a in resp]

    def get(self, agent_id: str) -> Agent:
        """Get an agent by ID."""
        resp = self._client._request("GET", f"/api/v1/agents/{agent_id}")
        return Agent.from_dict(resp)

    def register(self, name: str, role: str, level: int = 5, **kwargs) -> Agent:
        """Register a new agent."""
        data = {
            "name": name,
            "role": role,
            "level": level,
            "orgId": self._client.org_id,
            **kwargs,
        }
        resp = self._client._request("POST", "/api/v1/agents/register", json=data)
        return Agent.from_dict(resp)


class MessagesResource:
    """Messages API methods."""
    
    def __init__(self, client: OpenSpawn):
        self._client = client

    def send(self, content: str, channel_id: Optional[str] = None, recipient_agent_id: Optional[str] = None) -> Message:
        """Send a message to a channel or agent."""
        if channel_id:
            data = {"content": content, "channelId": channel_id, "orgId": self._client.org_id}
            resp = self._client._request("POST", "/api/v1/messages", json=data)
        elif recipient_agent_id:
            data = {"content": content, "recipientAgentId": recipient_agent_id, "orgId": self._client.org_id}
            resp = self._client._request("POST", "/api/v1/dm", json=data)
        else:
            raise ValueError("Either channel_id or recipient_agent_id must be provided")
        
        return Message.from_dict(resp)

    def list(self, channel_id: str, limit: int = 50) -> list[Message]:
        """List messages in a channel."""
        params = {"channelId": channel_id, "limit": limit}
        resp = self._client._request("GET", "/api/v1/messages", params=params)
        return [Message.from_dict(m) for m in resp]


class CreditsResource:
    """Credits API methods."""
    
    def __init__(self, client: OpenSpawn):
        self._client = client

    def balance(self, agent_id: str) -> CreditBalance:
        """Get credit balance for an agent."""
        resp = self._client._request("GET", f"/api/v1/agents/{agent_id}/credits/balance")
        return CreditBalance.from_dict(resp)


class EscalationsResource:
    """Escalations API methods."""
    
    def __init__(self, client: OpenSpawn):
        self._client = client

    def list_open(self) -> list[Escalation]:
        """List open escalations."""
        resp = self._client._request("GET", "/api/v1/tasks/escalations/open")
        return [Escalation.from_dict(e) for e in resp]

    def resolve(self, escalation_id: str) -> Escalation:
        """Resolve an escalation."""
        resp = self._client._request("POST", f"/api/v1/tasks/escalations/{escalation_id}/resolve")
        return Escalation.from_dict(resp)
