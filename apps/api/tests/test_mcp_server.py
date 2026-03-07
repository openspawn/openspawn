"""Tests for MCP server tool registration and graph tools."""

from __future__ import annotations

import json
from unittest.mock import AsyncMock, patch

from app.mcp_server.server import mcp


def test_mcp_server_name() -> None:
    assert mcp.name == "openspawn"


async def test_all_tools_registered() -> None:
    """Verify all 33 tools are registered."""
    expected_tools = {
        # Tasks (6)
        "task_list",
        "task_create",
        "task_get",
        "task_transition",
        "task_assign",
        "task_comment",
        # Credits (3)
        "credits_balance",
        "credits_spend",
        "credits_history",
        # Messages (3)
        "message_channels",
        "message_send",
        "message_read",
        # Agents (2)
        "agent_list",
        "agent_whoami",
        # Trust (5)
        "trust_get_reputation",
        "trust_get_history",
        "trust_leaderboard",
        "trust_bonus",
        "trust_penalty",
        # Escalation & Consensus (6)
        "escalation_create",
        "escalation_list",
        "escalation_resolve",
        "consensus_request",
        "consensus_vote",
        "consensus_status",
        # Memory (4)
        "memory_store",
        "memory_search",
        "memory_list",
        "memory_feedback",
        # Knowledge Graph (4)
        "memory_graph_entities",
        "memory_graph_related",
        "memory_graph_who_knows",
        "memory_graph_gaps",
    }
    tools = await mcp.list_tools()
    registered = {tool.name for tool in tools}
    assert expected_tools == registered, (
        f"Missing: {expected_tools - registered}, Extra: {registered - expected_tools}"
    )


async def test_agent_whoami() -> None:
    from app.mcp_server.server import agent_whoami

    result = json.loads(await agent_whoami())
    assert "agentId" in result


async def test_memory_graph_entities() -> None:
    from app.mcp_server.server import memory_graph_entities

    mock_response = {"data": [{"name": "deploy-pipeline", "entity_type": "process"}]}
    with patch("app.mcp_server.server._get_client") as mock_get:
        client = AsyncMock()
        client.get.return_value = mock_response
        mock_get.return_value = client

        result = json.loads(await memory_graph_entities())
        client.get.assert_called_once_with("/memory/graph/entities", params={"limit": "100"})
        assert result["data"][0]["name"] == "deploy-pipeline"


async def test_memory_graph_entities_with_type_filter() -> None:
    from app.mcp_server.server import memory_graph_entities

    mock_response = {"data": []}
    with patch("app.mcp_server.server._get_client") as mock_get:
        client = AsyncMock()
        client.get.return_value = mock_response
        mock_get.return_value = client

        await memory_graph_entities(entity_type="concept", limit=10)
        client.get.assert_called_once_with(
            "/memory/graph/entities",
            params={"limit": "10", "entity_type": "concept"},
        )


async def test_memory_graph_related() -> None:
    from app.mcp_server.server import memory_graph_related

    entity_id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    mock_response = {"data": {"entities": [], "relationships": []}}
    with patch("app.mcp_server.server._get_client") as mock_get:
        client = AsyncMock()
        client.get.return_value = mock_response
        mock_get.return_value = client

        result = json.loads(await memory_graph_related(entity_id=entity_id))
        client.get.assert_called_once_with(
            f"/memory/graph/entities/{entity_id}/neighbors",
            params={"hops": "1"},
        )
        assert "data" in result


async def test_memory_graph_related_with_hops() -> None:
    from app.mcp_server.server import memory_graph_related

    entity_id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    mock_response = {"data": {"entities": [], "relationships": []}}
    with patch("app.mcp_server.server._get_client") as mock_get:
        client = AsyncMock()
        client.get.return_value = mock_response
        mock_get.return_value = client

        await memory_graph_related(entity_id=entity_id, hops=2)
        client.get.assert_called_once_with(
            f"/memory/graph/entities/{entity_id}/neighbors",
            params={"hops": "2"},
        )


async def test_memory_graph_who_knows() -> None:
    from app.mcp_server.server import memory_graph_who_knows

    entity_id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    mock_response = {"data": ["agent-1", "agent-2"]}
    with patch("app.mcp_server.server._get_client") as mock_get:
        client = AsyncMock()
        client.get.return_value = mock_response
        mock_get.return_value = client

        result = json.loads(await memory_graph_who_knows(entity_id=entity_id))
        client.get.assert_called_once_with(f"/memory/graph/entities/{entity_id}/agents")
        assert result["data"] == ["agent-1", "agent-2"]


async def test_memory_graph_gaps() -> None:
    from app.mcp_server.server import memory_graph_gaps

    mock_response = {
        "data": [
            {
                "entity_name": "deploy-pipeline",
                "entity_type": "process",
                "agent_count": 1,
                "risk": "high",
            }
        ]
    }
    with patch("app.mcp_server.server._get_client") as mock_get:
        client = AsyncMock()
        client.get.return_value = mock_response
        mock_get.return_value = client

        result = json.loads(await memory_graph_gaps())
        client.get.assert_called_once_with("/memory/graph/gaps")
        assert result["data"][0]["risk"] == "high"
