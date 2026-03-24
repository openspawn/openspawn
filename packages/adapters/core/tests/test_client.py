"""Tests for the OpenSpawn Python client."""

from __future__ import annotations

import hashlib
import hmac as hmac_mod
import json
import time
from unittest.mock import patch

import httpx
import pytest

from openspawn.client import (
    AuthenticationError,
    NotFoundError,
    OpenSpawnClient,
    OpenSpawnError,
    RateLimitError,
)
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
)


# ── Fixtures ──────────────────────────────────────────────────────────────────

API_URL = "https://api.openspawn.test"
AGENT_ID = "test-agent"
HMAC_SECRET = "deadbeef" * 8


def _jwt_response(expires_in: int = 300) -> httpx.Response:
    return httpx.Response(
        200,
        json={
            "access_token": "test-jwt-token",
            "token_type": "bearer",
            "expires_in": expires_in,
            "scopes": ["tasks:read", "tasks:write"],
        },
    )


def _json_response(data: dict, status_code: int = 200) -> httpx.Response:
    return httpx.Response(status_code, json=data)


class MockTransport(httpx.BaseTransport):
    """Mock transport that records requests and returns configured responses."""

    def __init__(self) -> None:
        self.requests: list[httpx.Request] = []
        self.responses: dict[tuple[str, str], list[httpx.Response]] = {}
        # Always provide a default JWT response
        self.responses[("POST", "/auth/agent/token")] = [_jwt_response()]

    def add_response(self, method: str, path: str, response: httpx.Response) -> None:
        key = (method, path)
        if key not in self.responses:
            self.responses[key] = []
        self.responses[key].append(response)

    def handle_request(self, request: httpx.Request) -> httpx.Response:
        self.requests.append(request)
        path = request.url.raw_path.decode().split("?")[0]
        key = (request.method, path)

        if key in self.responses:
            responses = self.responses[key]
            if len(responses) == 1:
                return responses[0]
            return responses.pop(0)

        return httpx.Response(404, json={"detail": "Not found"})


@pytest.fixture
def transport() -> MockTransport:
    return MockTransport()


@pytest.fixture
def client(transport: MockTransport) -> OpenSpawnClient:
    c = OpenSpawnClient(
        api_url=API_URL,
        agent_id=AGENT_ID,
        hmac_secret=HMAC_SECRET,
        max_retries=2,
    )
    c._http = httpx.Client(base_url=API_URL, transport=transport)
    return c


# ── Authentication Tests ─────────────────────────────────────────────────────


class TestAuthentication:
    def test_jwt_exchange_sends_hmac_headers(self, client: OpenSpawnClient, transport: MockTransport) -> None:
        """JWT exchange must include x-agent-id, x-timestamp, x-nonce, x-signature."""
        transport.add_response(
            "GET",
            "/agents",
            _json_response({"data": []}),
        )
        client.list_agents()

        # First request should be the JWT exchange
        jwt_req = transport.requests[0]
        assert jwt_req.url.raw_path == b"/auth/agent/token"
        assert jwt_req.headers["x-agent-id"] == AGENT_ID
        assert "x-timestamp" in jwt_req.headers
        assert "x-nonce" in jwt_req.headers
        assert "x-signature" in jwt_req.headers

    def test_jwt_signature_computation(self, client: OpenSpawnClient) -> None:
        """Signature should be HMAC-SHA256 of method+path+timestamp+nonce."""
        sig = client._compute_signature("POST", "/auth/agent/token", "1234567890", "abc123")
        expected = hmac_mod.new(
            HMAC_SECRET.encode(),
            b"POST/auth/agent/token1234567890abc123",
            hashlib.sha256,
        ).hexdigest()
        assert sig == expected

    def test_jwt_caching(self, client: OpenSpawnClient, transport: MockTransport) -> None:
        """JWT should be cached and reused within expiry window."""
        transport.add_response("GET", "/agents", _json_response({"data": []}))
        transport.add_response("GET", "/agents", _json_response({"data": []}))

        client.list_agents()
        client.list_agents()

        jwt_requests = [r for r in transport.requests if r.url.raw_path == b"/auth/agent/token"]
        assert len(jwt_requests) == 1  # Only one JWT exchange

    def test_jwt_refresh_on_expiry(self, client: OpenSpawnClient, transport: MockTransport) -> None:
        """JWT should be refreshed when expired."""
        transport.responses[("POST", "/auth/agent/token")] = [_jwt_response(expires_in=1)]
        transport.add_response("GET", "/agents", _json_response({"data": []}))

        client.list_agents()

        # Force expire by manipulating internal state
        client._jwt_expires_at = time.time() - 100

        # Add another JWT response for the refresh
        transport.responses[("POST", "/auth/agent/token")] = [_jwt_response()]
        transport.add_response("GET", "/agents", _json_response({"data": []}))

        client.list_agents()

        jwt_requests = [r for r in transport.requests if r.url.raw_path == b"/auth/agent/token"]
        assert len(jwt_requests) == 2

    def test_auth_failure_raises(self, client: OpenSpawnClient, transport: MockTransport) -> None:
        """401 during JWT exchange should raise AuthenticationError."""
        transport.responses[("POST", "/auth/agent/token")] = [
            httpx.Response(401, json={"detail": "Invalid credentials"})
        ]

        with pytest.raises(AuthenticationError, match="HMAC authentication failed"):
            client._get_jwt()

    def test_rate_limit_during_jwt_raises(self, client: OpenSpawnClient, transport: MockTransport) -> None:
        """429 during JWT exchange should raise RateLimitError."""
        transport.responses[("POST", "/auth/agent/token")] = [
            httpx.Response(429, json={"detail": "Rate limited"}, headers={"retry-after": "5"})
        ]

        with pytest.raises(RateLimitError):
            client._get_jwt()


# ── Agent Tests ───────────────────────────────────────────────────────────────


class TestAgentOperations:
    def test_register_agent(self, client: OpenSpawnClient, transport: MockTransport) -> None:
        transport.add_response(
            "POST",
            "/agents/register",
            _json_response(
                {
                    "data": {
                        "agent": {
                            "id": "uuid-1",
                            "org_id": "org-1",
                            "agent_id": "new-agent",
                            "name": "New Agent",
                            "level": 3,
                            "model": "sonnet",
                            "status": "active",
                            "role": "worker",
                            "mode": "worker",
                            "trust_score": 50,
                        },
                        "hmac_secret": "secret-hex",
                    }
                },
                status_code=201,
            ),
        )

        result = client.register_agent("new-agent", "New Agent", level=3)
        assert isinstance(result, AgentInfo)
        assert result.agent_id == "new-agent"
        assert result.name == "New Agent"
        assert result.level == 3
        assert result.hmac_secret == "secret-hex"

    def test_register_agent_request_body(self, client: OpenSpawnClient, transport: MockTransport) -> None:
        transport.add_response(
            "POST",
            "/agents/register",
            _json_response(
                {"data": {"agent": {"id": "u", "org_id": "o", "agent_id": "a", "name": "A", "level": 1, "model": "sonnet", "status": "active", "role": "worker", "mode": "worker"}, "hmac_secret": "s"}},
                status_code=201,
            ),
        )

        client.register_agent(
            "my-agent",
            "My Agent",
            level=5,
            role=AgentRole.LEAD,
            mode=AgentMode.ORCHESTRATOR,
            metadata={"source": "crewai"},
        )

        reg_req = [r for r in transport.requests if b"/agents/register" in r.url.raw_path][0]
        body = json.loads(reg_req.content)
        assert body["agent_id"] == "my-agent"
        assert body["name"] == "My Agent"
        assert body["level"] == 5
        assert body["role"] == "lead"
        assert body["mode"] == "orchestrator"
        assert body["metadata"] == {"source": "crewai"}

    def test_list_agents(self, client: OpenSpawnClient, transport: MockTransport) -> None:
        transport.add_response(
            "GET",
            "/agents",
            _json_response({"data": [{"agent_id": "a1"}, {"agent_id": "a2"}]}),
        )
        result = client.list_agents(limit=10)
        assert len(result) == 2

    def test_get_agent(self, client: OpenSpawnClient, transport: MockTransport) -> None:
        transport.add_response(
            "GET",
            "/agents/uuid-1",
            _json_response({"data": {"agent_id": "a1", "name": "Agent One"}}),
        )
        result = client.get_agent("uuid-1")
        assert result["agent_id"] == "a1"

    def test_update_agent(self, client: OpenSpawnClient, transport: MockTransport) -> None:
        transport.add_response(
            "PATCH",
            "/agents/uuid-1",
            _json_response({"data": {"agent_id": "a1", "name": "Updated"}}),
        )
        result = client.update_agent("uuid-1", name="Updated")
        assert result["name"] == "Updated"


# ── Task Tests ────────────────────────────────────────────────────────────────


class TestTaskOperations:
    def test_create_task(self, client: OpenSpawnClient, transport: MockTransport) -> None:
        transport.add_response(
            "POST",
            "/tasks",
            _json_response(
                {
                    "data": {
                        "id": "task-1",
                        "title": "Test Task",
                        "status": "backlog",
                        "priority": "normal",
                        "tags": [],
                        "metadata": {},
                    }
                },
                status_code=201,
            ),
        )

        result = client.create_task("Test Task", priority=TaskPriority.HIGH, tags=["urgent"])
        assert isinstance(result, TaskInfo)
        assert result.title == "Test Task"
        assert result.id == "task-1"

    def test_create_task_with_all_fields(self, client: OpenSpawnClient, transport: MockTransport) -> None:
        transport.add_response(
            "POST",
            "/tasks",
            _json_response(
                {"data": {"id": "t2", "title": "Full", "status": "backlog", "priority": "high", "tags": ["a"], "metadata": {"k": "v"}}},
                status_code=201,
            ),
        )

        client.create_task(
            "Full",
            description="desc",
            priority=TaskPriority.HIGH,
            assignee_id="agent-uuid",
            tags=["a"],
            metadata={"k": "v"},
            required_capabilities=["python"],
        )

        req = [r for r in transport.requests if b"/tasks" == r.url.raw_path.split(b"?")[0] and r.method == "POST"][0]
        body = json.loads(req.content)
        assert body["title"] == "Full"
        assert body["description"] == "desc"
        assert body["priority"] == "high"
        assert body["assignee_id"] == "agent-uuid"
        assert body["tags"] == ["a"]
        assert body["required_capabilities"] == ["python"]

    def test_transition_task(self, client: OpenSpawnClient, transport: MockTransport) -> None:
        transport.add_response(
            "POST",
            "/tasks/task-1/transition",
            _json_response({"data": {"id": "task-1", "status": "in_progress"}}),
        )

        result = client.transition_task("task-1", TaskStatus.IN_PROGRESS, reason="Starting work")
        assert result["status"] == "in_progress"

    def test_get_task(self, client: OpenSpawnClient, transport: MockTransport) -> None:
        transport.add_response(
            "GET",
            "/tasks/task-1",
            _json_response({"data": {"id": "task-1", "title": "My Task"}}),
        )
        result = client.get_task("task-1")
        assert result["title"] == "My Task"

    def test_list_tasks(self, client: OpenSpawnClient, transport: MockTransport) -> None:
        transport.add_response(
            "GET",
            "/tasks",
            _json_response({"data": [{"id": "t1"}, {"id": "t2"}]}),
        )
        result = client.list_tasks(limit=20)
        assert len(result) == 2

    def test_assign_task(self, client: OpenSpawnClient, transport: MockTransport) -> None:
        transport.add_response(
            "POST",
            "/tasks/task-1/assign",
            _json_response({"data": {"id": "task-1", "assignee_id": "agent-uuid"}}),
        )
        result = client.assign_task("task-1", "agent-uuid")
        assert result["assignee_id"] == "agent-uuid"

    def test_add_task_comment(self, client: OpenSpawnClient, transport: MockTransport) -> None:
        transport.add_response(
            "POST",
            "/tasks/task-1/comments",
            _json_response({"data": {"id": "c1", "body": "Progress update"}}),
        )
        result = client.add_task_comment("task-1", "Progress update")
        assert result["body"] == "Progress update"


# ── Memory Tests ──────────────────────────────────────────────────────────────


class TestMemoryOperations:
    def test_store_memory(self, client: OpenSpawnClient, transport: MockTransport) -> None:
        transport.add_response(
            "POST",
            "/memory",
            _json_response(
                {"data": {"memory_id": "mem-1", "created_at": "2024-01-01T00:00:00Z"}},
                status_code=201,
            ),
        )

        result = client.store_memory(
            "Python 3.12 supports better type hints",
            memory_type=MemoryType.FACT,
            visibility=MemoryVisibility.ORG,
        )
        assert isinstance(result, MemoryInfo)
        assert result.id == "mem-1"
        assert result.content == "Python 3.12 supports better type hints"

    def test_store_memory_with_ttl(self, client: OpenSpawnClient, transport: MockTransport) -> None:
        transport.add_response(
            "POST",
            "/memory",
            _json_response({"data": {"memory_id": "mem-2"}}, status_code=201),
        )

        client.store_memory("Temporary info", ttl_seconds=3600)

        req = [r for r in transport.requests if b"/memory" == r.url.raw_path and r.method == "POST"][0]
        body = json.loads(req.content)
        assert body["ttl_seconds"] == 3600

    def test_search_memory(self, client: OpenSpawnClient, transport: MockTransport) -> None:
        transport.add_response(
            "GET",
            "/memory/search",
            _json_response({"data": [{"content": "Python fact", "similarity": 0.95}]}),
        )

        result = client.search_memory("python tips", limit=5)
        assert len(result) == 1
        assert result[0]["content"] == "Python fact"


# ── Event Tests ───────────────────────────────────────────────────────────────


class TestEventOperations:
    def test_emit_event(self, client: OpenSpawnClient, transport: MockTransport) -> None:
        transport.add_response(
            "POST",
            "/coordination/emit",
            _json_response({"data": {"event_id": "evt-1"}}),
        )

        result = client.emit_event(
            "task.completed",
            {"task_id": "t1", "result": "success"},
            target_agent_ids=["agent-1"],
        )
        assert result["event_id"] == "evt-1"

    def test_emit_event_request_body(self, client: OpenSpawnClient, transport: MockTransport) -> None:
        transport.add_response(
            "POST",
            "/coordination/emit",
            _json_response({"data": {}}),
        )

        client.emit_event("custom.event", {"key": "value"}, target_agent_ids=["a1", "a2"])

        req = [r for r in transport.requests if b"/coordination/emit" in r.url.raw_path][0]
        body = json.loads(req.content)
        assert body["event_type"] == "custom.event"
        assert body["payload"] == {"key": "value"}
        assert body["target_agent_ids"] == ["a1", "a2"]


# ── Error Handling Tests ──────────────────────────────────────────────────────


class TestErrorHandling:
    def test_404_raises_not_found(self, client: OpenSpawnClient, transport: MockTransport) -> None:
        transport.add_response(
            "GET",
            "/tasks/nonexistent",
            httpx.Response(404, json={"detail": "Not found"}),
        )

        with pytest.raises(NotFoundError):
            client.get_task("nonexistent")

    def test_401_triggers_jwt_refresh(self, client: OpenSpawnClient, transport: MockTransport) -> None:
        """On 401 the client should invalidate JWT and retry."""
        # Pre-fill JWT
        client._jwt = "old-token"
        client._jwt_expires_at = time.time() + 1000

        transport.add_response(
            "GET",
            "/tasks/t1",
            httpx.Response(401, json={"detail": "Unauthorized"}),
        )
        transport.add_response(
            "GET",
            "/tasks/t1",
            _json_response({"data": {"id": "t1", "title": "Retry Success"}}),
        )

        result = client.get_task("t1")
        assert result["title"] == "Retry Success"
        assert client._jwt == "test-jwt-token"  # Refreshed

    def test_rate_limit_with_retry_after(self, client: OpenSpawnClient, transport: MockTransport) -> None:
        """429 with retry-after should sleep and retry."""
        transport.add_response(
            "GET",
            "/tasks",
            httpx.Response(429, json={"detail": "Rate limited"}, headers={"retry-after": "0.01"}),
        )
        transport.add_response(
            "GET",
            "/tasks",
            _json_response({"data": []}),
        )

        result = client.list_tasks()
        assert result == []

    def test_rate_limit_exhausted_raises(self, client: OpenSpawnClient, transport: MockTransport) -> None:
        """429 on all retries should raise RateLimitError."""
        for _ in range(3):
            transport.add_response(
                "GET",
                "/tasks",
                httpx.Response(429, json={"detail": "Rate limited"}),
            )

        with pytest.raises(RateLimitError):
            client.list_tasks()

    def test_server_error_raises(self, client: OpenSpawnClient, transport: MockTransport) -> None:
        """5xx should raise after retries."""
        transport.add_response(
            "GET",
            "/agents",
            httpx.Response(500, json={"detail": "Internal Server Error"}),
        )

        with pytest.raises(httpx.HTTPStatusError):
            client.list_agents()


# ── Context Manager Tests ─────────────────────────────────────────────────────


class TestContextManager:
    def test_context_manager(self) -> None:
        with OpenSpawnClient(API_URL, AGENT_ID, HMAC_SECRET) as client:
            assert client.api_url == API_URL
        # Should not raise

    def test_close(self) -> None:
        client = OpenSpawnClient(API_URL, AGENT_ID, HMAC_SECRET)
        client.close()  # Should not raise


# ── Type Tests ────────────────────────────────────────────────────────────────


class TestTypes:
    def test_task_priority_values(self) -> None:
        assert TaskPriority.CRITICAL.value == "critical"
        assert TaskPriority.HIGH.value == "high"
        assert TaskPriority.NORMAL.value == "normal"
        assert TaskPriority.LOW.value == "low"

    def test_task_status_values(self) -> None:
        assert TaskStatus.BACKLOG.value == "backlog"
        assert TaskStatus.IN_PROGRESS.value == "in_progress"
        assert TaskStatus.DONE.value == "done"

    def test_agent_role_values(self) -> None:
        assert AgentRole.WORKER.value == "worker"
        assert AgentRole.LEAD.value == "lead"
        assert AgentRole.FOUNDER.value == "founder"

    def test_memory_type_values(self) -> None:
        assert MemoryType.FACT.value == "fact"
        assert MemoryType.LESSON.value == "lesson"
        assert MemoryType.DECISION.value == "decision"

    def test_task_info_defaults(self) -> None:
        task = TaskInfo(id="1", title="T", status="backlog", priority="normal")
        assert task.tags == []
        assert task.metadata == {}
        assert task.assignee_id is None
