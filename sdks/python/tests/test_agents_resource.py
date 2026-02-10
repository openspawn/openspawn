"""Tests for agents resource."""

from datetime import datetime

import pytest
import respx
from httpx import Response

from openspawn import OpenSpawnClient, AsyncOpenSpawnClient
from openspawn.enums import AgentRole, AgentStatus
from openspawn.models import Agent, CreateAgentRequest


@respx.mock
def test_list_agents() -> None:
    """Test listing agents."""
    respx.get("https://api.test/agents").mock(
        return_value=Response(
            200,
            json={
                "data": [
                    {
                        "id": "1",
                        "agentId": "agent_1",
                        "name": "Test Agent",
                        "role": "worker",
                        "level": 1,
                        "model": "gpt-4",
                        "status": "active",
                        "currentBalance": 1000,
                        "createdAt": "2024-01-01T00:00:00Z",
                    }
                ]
            },
        )
    )

    with OpenSpawnClient(base_url="https://api.test", api_key="test") as client:
        agents = client.agents.list()

    assert len(agents) == 1
    assert agents[0].name == "Test Agent"
    assert agents[0].role == AgentRole.WORKER
    assert agents[0].status == AgentStatus.ACTIVE


@respx.mock
def test_get_agent() -> None:
    """Test getting a single agent."""
    respx.get("https://api.test/agents/1").mock(
        return_value=Response(
            200,
            json={
                "data": {
                    "id": "1",
                    "agentId": "agent_1",
                    "name": "Test Agent",
                    "role": "worker",
                    "level": 1,
                    "model": "gpt-4",
                    "status": "active",
                    "currentBalance": 1000,
                    "createdAt": "2024-01-01T00:00:00Z",
                }
            },
        )
    )

    with OpenSpawnClient(base_url="https://api.test", api_key="test") as client:
        agent = client.agents.get("1")

    assert agent.id == "1"
    assert agent.name == "Test Agent"


@respx.mock
def test_create_agent() -> None:
    """Test creating an agent."""
    respx.post("https://api.test/agents/register").mock(
        return_value=Response(
            200,
            json={
                "data": {
                    "id": "1",
                    "agentId": "agent_1",
                    "name": "New Agent",
                    "role": "worker",
                    "level": 1,
                    "model": "gpt-4",
                },
                "secret": "secret123",
                "message": "IMPORTANT: Save this secret securely.",
            },
        )
    )

    with OpenSpawnClient(base_url="https://api.test", api_key="test") as client:
        request = CreateAgentRequest(
            name="New Agent",
            role=AgentRole.WORKER,
            level=1,
            model="gpt-4",
        )
        response = client.agents.create(request)

    assert response["data"]["name"] == "New Agent"
    assert response["secret"] == "secret123"


@pytest.mark.asyncio
@respx.mock
async def test_async_list_agents() -> None:
    """Test async listing agents."""
    respx.get("https://api.test/agents").mock(
        return_value=Response(
            200,
            json={
                "data": [
                    {
                        "id": "1",
                        "agentId": "agent_1",
                        "name": "Test Agent",
                        "role": "worker",
                        "level": 1,
                        "model": "gpt-4",
                        "status": "active",
                        "currentBalance": 1000,
                        "createdAt": "2024-01-01T00:00:00Z",
                    }
                ]
            },
        )
    )

    async with AsyncOpenSpawnClient(base_url="https://api.test", api_key="test") as client:
        agents = await client.agents.list()

    assert len(agents) == 1
    assert agents[0].name == "Test Agent"
