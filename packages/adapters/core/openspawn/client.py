"""OpenSpawn Python Client — HMAC-authenticated client for the OpenSpawn API."""

from __future__ import annotations

import hashlib
import hmac
import logging
import secrets
import time
from typing import Any

import httpx

from openspawn.types import (
    AgentInfo,
    AgentMode,
    AgentRole,
    MemoryInfo,
    MemoryType,
    MemoryVisibility,
    TaskInfo,
    TaskPriority,
    TaskStatus,
    TokenResponse,
)

logger = logging.getLogger("openspawn")


class OpenSpawnError(Exception):
    """Base exception for OpenSpawn client errors."""

    def __init__(self, message: str, status_code: int | None = None, response: dict | None = None):
        super().__init__(message)
        self.status_code = status_code
        self.response = response


class AuthenticationError(OpenSpawnError):
    """Raised when HMAC authentication or JWT exchange fails."""


class RateLimitError(OpenSpawnError):
    """Raised when the API returns 429 Too Many Requests."""

    def __init__(self, message: str, retry_after: float | None = None, **kwargs: Any):
        super().__init__(message, **kwargs)
        self.retry_after = retry_after


class NotFoundError(OpenSpawnError):
    """Raised when the requested resource is not found (404)."""


class OpenSpawnClient:
    """HMAC-authenticated client for the OpenSpawn API.

    Usage::

        client = OpenSpawnClient(
            api_url="https://api.openspawn.ai",
            agent_id="my-agent",
            hmac_secret="hex-encoded-secret",
        )
        task = client.create_task(title="Do the thing")
    """

    def __init__(
        self,
        api_url: str,
        agent_id: str,
        hmac_secret: str,
        *,
        timeout: float = 30.0,
        max_retries: int = 3,
        jwt_refresh_margin: int = 60,
    ) -> None:
        self.api_url = api_url.rstrip("/")
        self.agent_id = agent_id
        self.hmac_secret = hmac_secret
        self.max_retries = max_retries
        self._jwt_refresh_margin = jwt_refresh_margin

        self._http = httpx.Client(base_url=self.api_url, timeout=timeout)
        self._jwt: str | None = None
        self._jwt_expires_at: float = 0.0

    # ── Authentication ────────────────────────────────────────────────────

    def _compute_signature(self, method: str, path: str, timestamp: str, nonce: str) -> str:
        """Compute HMAC-SHA256 signature matching the API's expected format."""
        message = f"{method}{path}{timestamp}{nonce}"
        return hmac.new(
            self.hmac_secret.encode("utf-8"),
            message.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

    def _get_jwt(self) -> str:
        """Get a valid JWT, refreshing if expired or about to expire."""
        now = time.time()
        if self._jwt and now < (self._jwt_expires_at - self._jwt_refresh_margin):
            return self._jwt

        ts = str(int(now))
        nonce = secrets.token_hex(16)
        path = "/auth/agent/token"
        sig = self._compute_signature("POST", path, ts, nonce)

        resp = self._http.post(
            path,
            headers={
                "x-agent-id": self.agent_id,
                "x-timestamp": ts,
                "x-nonce": nonce,
                "x-signature": sig,
            },
        )

        if resp.status_code == 401:
            raise AuthenticationError(
                "HMAC authentication failed. Check agent_id and hmac_secret.",
                status_code=401,
                response=resp.json() if resp.content else None,
            )
        if resp.status_code == 429:
            retry_after = resp.headers.get("retry-after")
            raise RateLimitError(
                "Rate limited during JWT exchange",
                retry_after=float(retry_after) if retry_after else None,
                status_code=429,
            )
        resp.raise_for_status()

        data = resp.json()
        self._jwt = data["access_token"]
        self._jwt_expires_at = now + data.get("expires_in", 300)

        logger.debug("JWT refreshed, expires_in=%s scopes=%s", data.get("expires_in"), data.get("scopes"))
        return self._jwt  # type: ignore[return-value]

    def _auth_headers(self) -> dict[str, str]:
        """Return Authorization header with a valid JWT."""
        return {"Authorization": f"Bearer {self._get_jwt()}"}

    # ── HTTP helpers ──────────────────────────────────────────────────────

    def _request(
        self,
        method: str,
        path: str,
        *,
        json: dict | None = None,
        params: dict | None = None,
    ) -> dict:
        """Make an authenticated request with retry logic."""
        last_exc: Exception | None = None
        for attempt in range(self.max_retries):
            try:
                resp = self._http.request(
                    method,
                    path,
                    json=json,
                    params=params,
                    headers=self._auth_headers(),
                )

                if resp.status_code == 401:
                    # JWT expired mid-request — force refresh and retry
                    self._jwt = None
                    continue

                if resp.status_code == 404:
                    raise NotFoundError(
                        f"Resource not found: {method} {path}",
                        status_code=404,
                        response=resp.json() if resp.content else None,
                    )

                if resp.status_code == 429:
                    retry_after = resp.headers.get("retry-after")
                    if retry_after and attempt < self.max_retries - 1:
                        time.sleep(float(retry_after))
                        continue
                    raise RateLimitError(
                        f"Rate limited: {method} {path}",
                        retry_after=float(retry_after) if retry_after else None,
                        status_code=429,
                    )

                resp.raise_for_status()
                return resp.json()

            except httpx.TimeoutException as exc:
                last_exc = exc
                if attempt < self.max_retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                raise OpenSpawnError(f"Request timed out after {self.max_retries} retries: {path}") from exc

        raise OpenSpawnError(f"Request failed after {self.max_retries} retries: {path}") from last_exc

    # ── Agent Operations ──────────────────────────────────────────────────

    def register_agent(
        self,
        agent_id: str,
        name: str,
        *,
        level: int = 1,
        model: str = "sonnet",
        role: AgentRole = AgentRole.WORKER,
        mode: AgentMode = AgentMode.WORKER,
        default_autonomy_level: int = 5,
        metadata: dict[str, Any] | None = None,
    ) -> AgentInfo:
        """Register a new agent in OpenSpawn.

        Returns the agent info including the HMAC secret (shown only once).
        """
        payload: dict[str, Any] = {
            "agent_id": agent_id,
            "name": name,
            "level": level,
            "model": model,
            "role": role.value,
            "mode": mode.value,
            "default_autonomy_level": default_autonomy_level,
        }
        if metadata:
            payload["metadata"] = metadata

        resp = self._request("POST", "/agents/register", json=payload)
        data = resp.get("data", resp)
        agent_data = data.get("agent", data)

        return AgentInfo(
            id=str(agent_data.get("id", "")),
            org_id=str(agent_data.get("org_id", "")),
            agent_id=agent_data.get("agent_id", agent_id),
            name=agent_data.get("name", name),
            level=agent_data.get("level", level),
            model=agent_data.get("model", model),
            status=AgentInfo.__dataclass_fields__["status"].default
            if "status" not in agent_data
            else agent_data["status"],
            role=AgentInfo.__dataclass_fields__["role"].default
            if "role" not in agent_data
            else agent_data["role"],
            mode=AgentInfo.__dataclass_fields__["mode"].default
            if "mode" not in agent_data
            else agent_data["mode"],
            trust_score=agent_data.get("trust_score", 50),
            hmac_secret=data.get("hmac_secret"),
        )

    def get_agent(self, agent_uuid: str) -> dict:
        """Get agent details by UUID."""
        resp = self._request("GET", f"/agents/{agent_uuid}")
        return resp.get("data", resp)

    def list_agents(self, *, limit: int = 50, offset: int = 0) -> list[dict]:
        """List agents in the org."""
        resp = self._request("GET", "/agents", params={"limit": limit, "offset": offset})
        return resp.get("data", resp)

    def update_agent(self, agent_uuid: str, **updates: Any) -> dict:
        """Update agent fields."""
        resp = self._request("PATCH", f"/agents/{agent_uuid}", json=updates)
        return resp.get("data", resp)

    # ── Task Operations ───────────────────────────────────────────────────

    def create_task(
        self,
        title: str,
        *,
        description: str | None = None,
        priority: TaskPriority = TaskPriority.NORMAL,
        assignee_id: str | None = None,
        tags: list[str] | None = None,
        metadata: dict[str, Any] | None = None,
        required_capabilities: list[str] | None = None,
    ) -> TaskInfo:
        """Create a new task."""
        payload: dict[str, Any] = {
            "title": title,
            "priority": priority.value,
        }
        if description:
            payload["description"] = description
        if assignee_id:
            payload["assignee_id"] = assignee_id
        if tags:
            payload["tags"] = tags
        if metadata:
            payload["metadata"] = metadata
        if required_capabilities:
            payload["required_capabilities"] = required_capabilities

        resp = self._request("POST", "/tasks", json=payload)
        data = resp.get("data", resp)

        return TaskInfo(
            id=str(data.get("id", "")),
            title=data.get("title", title),
            status=data.get("status", TaskStatus.BACKLOG.value),
            priority=data.get("priority", priority.value),
            assignee_id=str(data["assignee_id"]) if data.get("assignee_id") else None,
            description=data.get("description"),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
            tags=data.get("tags", []),
            metadata=data.get("metadata", {}),
        )

    def transition_task(self, task_id: str, status: TaskStatus, *, reason: str | None = None) -> dict:
        """Transition a task to a new status."""
        payload: dict[str, Any] = {"status": status.value}
        if reason:
            payload["reason"] = reason
        resp = self._request("POST", f"/tasks/{task_id}/transition", json=payload)
        return resp.get("data", resp)

    def get_task(self, task_id: str) -> dict:
        """Get task details."""
        resp = self._request("GET", f"/tasks/{task_id}")
        return resp.get("data", resp)

    def list_tasks(self, *, limit: int = 50, offset: int = 0, status: TaskStatus | None = None) -> list[dict]:
        """List tasks."""
        params: dict[str, Any] = {"limit": limit, "offset": offset}
        if status:
            params["status"] = status.value
        resp = self._request("GET", "/tasks", params=params)
        return resp.get("data", resp)

    def assign_task(self, task_id: str, assignee_id: str) -> dict:
        """Assign a task to an agent."""
        resp = self._request("POST", f"/tasks/{task_id}/assign", json={"assignee_id": assignee_id})
        return resp.get("data", resp)

    def add_task_comment(self, task_id: str, body: str) -> dict:
        """Add a comment to a task."""
        resp = self._request("POST", f"/tasks/{task_id}/comments", json={"body": body})
        return resp.get("data", resp)

    # ── Memory Operations ─────────────────────────────────────────────────

    def store_memory(
        self,
        content: str,
        *,
        memory_type: MemoryType = MemoryType.FACT,
        visibility: MemoryVisibility = MemoryVisibility.ORG,
        source: str = "agent",
        metadata: dict[str, Any] | None = None,
        ttl_seconds: int | None = None,
    ) -> MemoryInfo:
        """Store a memory entry."""
        payload: dict[str, Any] = {
            "content": content,
            "memory_type": memory_type.value,
            "visibility": visibility.value,
            "source": source,
        }
        if metadata:
            payload["metadata"] = metadata
        if ttl_seconds:
            payload["ttl_seconds"] = ttl_seconds

        resp = self._request("POST", "/memory", json=payload)
        data = resp.get("data", resp)

        return MemoryInfo(
            id=str(data.get("id", data.get("memory_id", ""))),
            content=content,
            memory_type=memory_type,
            visibility=visibility,
            source=source,
            created_at=data.get("created_at"),
        )

    def search_memory(self, query: str, *, limit: int = 10, similarity_threshold: float = 0.7) -> list[dict]:
        """Search memories by semantic similarity."""
        resp = self._request(
            "GET",
            "/memory/search",
            params={"query": query, "limit": limit, "similarity_threshold": similarity_threshold},
        )
        return resp.get("data", resp)

    # ── Coordination / Events ─────────────────────────────────────────────

    def emit_event(
        self,
        event_type: str,
        payload: dict[str, Any],
        *,
        target_agent_ids: list[str] | None = None,
    ) -> dict:
        """Emit a coordination event."""
        body: dict[str, Any] = {
            "event_type": event_type,
            "payload": payload,
        }
        if target_agent_ids:
            body["target_agent_ids"] = target_agent_ids
        resp = self._request("POST", "/coordination/emit", json=body)
        return resp.get("data", resp)

    # ── Lifecycle ─────────────────────────────────────────────────────────

    def close(self) -> None:
        """Close the underlying HTTP client."""
        self._http.close()

    def __enter__(self) -> OpenSpawnClient:
        return self

    def __exit__(self, *args: Any) -> None:
        self.close()
