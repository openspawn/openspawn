"""Tests for MCP server tool registration and memory stubs."""

import json

from app.mcp_server.server import mcp


def test_mcp_server_name() -> None:
    assert mcp.name == "openspawn"


async def test_all_tools_registered() -> None:
    """Verify all 29 tools are registered."""
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
        # Memory stubs (4)
        "memory_store",
        "memory_search",
        "memory_list",
        "memory_feedback",
    }
    tools = await mcp.list_tools()
    registered = {tool.name for tool in tools}
    assert expected_tools == registered, (
        f"Missing: {expected_tools - registered}, Extra: {registered - expected_tools}"
    )


async def test_memory_store_stub() -> None:
    from app.mcp_server.server import memory_store

    result = json.loads(await memory_store(key="test", value="hello"))
    assert result["status"] == "stub"


async def test_memory_search_stub() -> None:
    from app.mcp_server.server import memory_search

    result = json.loads(await memory_search(query="test"))
    assert result["status"] == "stub"
    assert result["results"] == []


async def test_memory_list_stub() -> None:
    from app.mcp_server.server import memory_list

    result = json.loads(await memory_list())
    assert result["status"] == "stub"


async def test_memory_feedback_stub() -> None:
    from app.mcp_server.server import memory_feedback

    result = json.loads(await memory_feedback(memory_id="test-id", helpful=True))
    assert result["status"] == "stub"


async def test_agent_whoami() -> None:
    from app.mcp_server.server import agent_whoami

    result = json.loads(await agent_whoami())
    assert "agentId" in result
