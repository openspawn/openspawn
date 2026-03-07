"""OpenSpawn MCP Server — exposes agent tools via Model Context Protocol."""

from __future__ import annotations

import json

from fastmcp import FastMCP

from app.mcp_server.api_client import ApiClient

mcp = FastMCP("openspawn")
_client: ApiClient | None = None


def _get_client() -> ApiClient:
    global _client
    if _client is None:
        _client = ApiClient()
    return _client


def _format(data: object) -> str:
    return json.dumps(data, indent=2, default=str)


# ═══════════════════════════════════════════════
# Task Tools
# ═══════════════════════════════════════════════


@mcp.tool
async def task_list(status: str | None = None, assignee_id: str | None = None) -> str:
    """List tasks with optional filters."""
    params: dict[str, str] = {}
    if status:
        params["status"] = status
    if assignee_id:
        params["assigneeId"] = assignee_id
    result = await _get_client().get("/tasks", params=params or None)
    return _format(result)


@mcp.tool
async def task_create(
    title: str,
    description: str | None = None,
    priority: str = "normal",
    assignee_id: str | None = None,
) -> str:
    """Create a new task."""
    body: dict[str, object] = {"title": title, "priority": priority}
    if description:
        body["description"] = description
    if assignee_id:
        body["assigneeId"] = assignee_id
    result = await _get_client().post("/tasks", json=body)
    return _format(result)


@mcp.tool
async def task_get(id: str) -> str:
    """Get a task by ID."""
    result = await _get_client().get(f"/tasks/{id}")
    return _format(result)


@mcp.tool
async def task_transition(id: str, status: str, reason: str | None = None) -> str:
    """Transition task to a new status (backlog, todo, in_progress, review, done, blocked, cancelled)."""
    body: dict[str, str] = {"status": status}
    if reason:
        body["reason"] = reason
    result = await _get_client().post(f"/tasks/{id}/transition", json=body)
    return _format(result)


@mcp.tool
async def task_assign(id: str, assignee_id: str) -> str:
    """Assign a task to an agent."""
    result = await _get_client().post(f"/tasks/{id}/assign", json={"assigneeId": assignee_id})
    return _format(result)


@mcp.tool
async def task_comment(task_id: str, body: str) -> str:
    """Add a comment to a task."""
    result = await _get_client().post(f"/tasks/{task_id}/comments", json={"body": body})
    return _format(result)


# ═══════════════════════════════════════════════
# Credit Tools
# ═══════════════════════════════════════════════


@mcp.tool
async def credits_balance() -> str:
    """Get current credit balance."""
    result = await _get_client().get("/credits/balance")
    return _format(result)


@mcp.tool
async def credits_spend(amount: int, reason: str) -> str:
    """Spend credits for a purpose."""
    result = await _get_client().post("/credits/spend", json={"amount": amount, "reason": reason})
    return _format(result)


@mcp.tool
async def credits_history(limit: int = 50, offset: int = 0) -> str:
    """Get credit transaction history."""
    result = await _get_client().get(
        "/credits/history", params={"limit": str(limit), "offset": str(offset)}
    )
    return _format(result)


# ═══════════════════════════════════════════════
# Message Tools
# ═══════════════════════════════════════════════


@mcp.tool
async def message_channels() -> str:
    """List available messaging channels."""
    result = await _get_client().get("/channels")
    return _format(result)


@mcp.tool
async def message_send(channel_id: str, body: str, type: str = "text") -> str:
    """Send a message to a channel."""
    result = await _get_client().post(
        "/messages", json={"channelId": channel_id, "body": body, "type": type}
    )
    return _format(result)


@mcp.tool
async def message_read(channel_id: str, limit: int = 50) -> str:
    """Read messages from a channel."""
    result = await _get_client().get(
        "/messages", params={"channelId": channel_id, "limit": str(limit)}
    )
    return _format(result)


# ═══════════════════════════════════════════════
# Agent Tools
# ═══════════════════════════════════════════════


@mcp.tool
async def agent_list() -> str:
    """List all agents in the organization."""
    result = await _get_client().get("/agents")
    return _format(result)


@mcp.tool
async def agent_whoami() -> str:
    """Get current agent identity."""
    client = _get_client()
    agent_id = client.agent_id or "unknown"
    return _format({"agentId": agent_id})


# ═══════════════════════════════════════════════
# Trust & Reputation Tools
# ═══════════════════════════════════════════════


@mcp.tool
async def trust_get_reputation(agent_id: str) -> str:
    """Get trust score and reputation for an agent."""
    result = await _get_client().get(f"/agents/{agent_id}/reputation")
    return _format(result)


@mcp.tool
async def trust_get_history(agent_id: str, limit: int = 20) -> str:
    """Get reputation change history for an agent."""
    result = await _get_client().get(
        f"/agents/{agent_id}/reputation/history", params={"limit": str(limit)}
    )
    return _format(result)


@mcp.tool
async def trust_leaderboard(limit: int = 10) -> str:
    """Get top agents by trust score."""
    result = await _get_client().get("/agents/leaderboard/trust", params={"limit": str(limit)})
    return _format(result)


@mcp.tool
async def trust_bonus(agent_id: str, amount: int, reason: str) -> str:
    """Award reputation bonus to an agent (L7+ or HR required)."""
    result = await _get_client().post(
        f"/agents/{agent_id}/reputation/bonus", json={"impact": amount, "reason": reason}
    )
    return _format(result)


@mcp.tool
async def trust_penalty(agent_id: str, amount: int, reason: str) -> str:
    """Apply reputation penalty to an agent (L7+ or HR required)."""
    result = await _get_client().post(
        f"/agents/{agent_id}/reputation/penalty", json={"impact": amount, "reason": reason}
    )
    return _format(result)


# ═══════════════════════════════════════════════
# Escalation & Consensus Tools
# ═══════════════════════════════════════════════


@mcp.tool
async def escalation_create(task_id: str, reason: str, notes: str | None = None) -> str:
    """Escalate a task to a higher-level agent."""
    body: dict[str, str] = {"reason": reason}
    if notes:
        body["notes"] = notes
    result = await _get_client().post(f"/tasks/{task_id}/escalate", json=body)
    return _format(result)


@mcp.tool
async def escalation_list(task_id: str | None = None) -> str:
    """List escalations, optionally filtered by task."""
    if task_id:
        result = await _get_client().get(f"/tasks/{task_id}/escalations")
    else:
        result = await _get_client().get("/tasks/escalations/open")
    return _format(result)


@mcp.tool
async def escalation_resolve(escalation_id: str, notes: str | None = None) -> str:
    """Resolve an escalation."""
    body: dict[str, str] = {}
    if notes:
        body["notes"] = notes
    result = await _get_client().post(
        f"/tasks/escalations/{escalation_id}/resolve", json=body or None
    )
    return _format(result)


@mcp.tool
async def consensus_request(
    type: str,
    title: str,
    description: str | None = None,
    quorum_required: int = 2,
) -> str:
    """Create a consensus request for voting."""
    body: dict[str, object] = {
        "type": type,
        "title": title,
        "quorumRequired": quorum_required,
    }
    if description:
        body["description"] = description
    result = await _get_client().post("/tasks/consensus", json=body)
    return _format(result)


@mcp.tool
async def consensus_vote(consensus_id: str, vote: str, reason: str | None = None) -> str:
    """Submit a vote on a consensus request (APPROVE, REJECT, ABSTAIN)."""
    body: dict[str, str] = {"vote": vote}
    if reason:
        body["reason"] = reason
    result = await _get_client().post(f"/tasks/consensus/{consensus_id}/vote", json=body)
    return _format(result)


@mcp.tool
async def consensus_status(consensus_id: str) -> str:
    """Check the status of a consensus request."""
    result = await _get_client().get(f"/tasks/consensus/{consensus_id}")
    return _format(result)


# ═══════════════════════════════════════════════
# Memory Tools (stubs — depends on #536)
# ═══════════════════════════════════════════════


@mcp.tool
async def memory_store(key: str, value: str, tags: list[str] | None = None) -> str:
    """Store a memory entry. (Stub — memory API not yet implemented)"""
    return _format({"status": "stub", "message": "Memory API not yet available", "key": key})


@mcp.tool
async def memory_search(query: str, limit: int = 10) -> str:
    """Search stored memories. (Stub — memory API not yet implemented)"""
    return _format({"status": "stub", "message": "Memory API not yet available", "results": []})


@mcp.tool
async def memory_list(tags: list[str] | None = None, limit: int = 50) -> str:
    """List stored memories. (Stub — memory API not yet implemented)"""
    return _format({"status": "stub", "message": "Memory API not yet available", "results": []})


@mcp.tool
async def memory_feedback(memory_id: str, helpful: bool) -> str:
    """Provide feedback on a memory entry. (Stub — memory API not yet implemented)"""
    return _format({"status": "stub", "message": "Memory API not yet available"})
