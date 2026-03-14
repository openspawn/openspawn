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
# Memory Tools
# ═══════════════════════════════════════════════


@mcp.tool
async def memory_store(
    content: str,
    source: str = "observation",
    type: str = "episodic",
    visibility: str = "shared",
) -> str:
    """Store a memory. Content is compressed and embedded for later retrieval."""
    result = await _get_client().post(
        "/memory",
        json={"content": content, "source": source, "type": type, "visibility": visibility},
    )
    return _format(result)


@mcp.tool
async def memory_search(query: str, limit: int = 10, type: str | None = None) -> str:
    """Search memories using hybrid semantic + keyword search."""
    params: dict[str, str] = {"query": query, "limit": str(limit)}
    if type:
        params["type"] = type
    result = await _get_client().get("/memory/search", params=params)
    return _format(result)


@mcp.tool
async def memory_list(
    agent_id: str | None = None,
    type: str | None = None,
    limit: int = 50,
) -> str:
    """List memories with optional filters."""
    params: dict[str, str] = {"limit": str(limit)}
    if agent_id:
        params["agent_id"] = agent_id
    if type:
        params["type"] = type
    result = await _get_client().get("/memory", params=params)
    return _format(result)


@mcp.tool
async def memory_feedback(memory_id: str, helpful: bool) -> str:
    """Provide helpful/unhelpful feedback on a retrieved memory."""
    result = await _get_client().post(
        f"/memory/{memory_id}/feedback",
        json={"helpful": helpful},
    )
    return _format(result)


# ═══════════════════════════════════════════════
# Knowledge Graph Tools
# ═══════════════════════════════════════════════


@mcp.tool
async def memory_graph_entities(
    entity_type: str | None = None,
    limit: int = 100,
) -> str:
    """List knowledge graph entities the calling agent knows about."""
    params: dict[str, str] = {"limit": str(limit)}
    if entity_type:
        params["entity_type"] = entity_type
    result = await _get_client().get("/memory/graph/entities", params=params)
    return _format(result)


@mcp.tool
async def memory_graph_related(entity_id: str, hops: int = 1) -> str:
    """Find entities related to a given entity (by ID) within N hops."""
    result = await _get_client().get(
        f"/memory/graph/entities/{entity_id}/neighbors",
        params={"hops": str(hops)},
    )
    return _format(result)


@mcp.tool
async def memory_graph_who_knows(entity_id: str) -> str:
    """Find which agents know about a given entity."""
    result = await _get_client().get(f"/memory/graph/entities/{entity_id}/agents")
    return _format(result)


@mcp.tool
async def memory_graph_gaps() -> str:
    """Find knowledge gaps -- entities known by only one agent."""
    result = await _get_client().get("/memory/graph/gaps")
    return _format(result)


# ═══════════════════════════════════════════════
# Artifact Tools
# ═══════════════════════════════════════════════


@mcp.tool
async def artifact_publish(
    artifact_type: str,
    name: str,
    content_json: str,
    task_id: str,
    source_artifact_ids: str | None = None,
    metadata_json: str | None = None,
) -> str:
    """Publish an artifact. Auto-versions if name already exists."""
    body: dict[str, object] = {
        "artifact_type": artifact_type,
        "name": name,
        "content": json.loads(content_json),
        "task_id": task_id,
    }
    if source_artifact_ids:
        body["source_artifact_ids"] = json.loads(source_artifact_ids)
    if metadata_json:
        body["metadata"] = json.loads(metadata_json)
    result = await _get_client().post("/artifacts", json=body)
    return _format(result)


@mcp.tool
async def artifact_get(
    artifact_id: str | None = None,
    name: str | None = None,
) -> str:
    """Get artifact by ID, or latest published version by name."""
    if artifact_id:
        result = await _get_client().get(f"/artifacts/{artifact_id}")
    elif name:
        result = await _get_client().get("/artifacts/latest", params={"name": name})
    else:
        return '{"error": "Provide artifact_id or name"}'
    return _format(result)


@mcp.tool
async def artifact_list(
    task_id: str | None = None,
    artifact_type: str | None = None,
    status: str | None = None,
    producer_agent_id: str | None = None,
) -> str:
    """List artifacts with optional filters."""
    params: dict[str, str] = {}
    if task_id:
        params["task_id"] = task_id
    if artifact_type:
        params["artifact_type"] = artifact_type
    if status:
        params["status"] = status
    if producer_agent_id:
        params["producer_agent_id"] = producer_agent_id
    result = await _get_client().get("/artifacts", params=params or None)
    return _format(result)


@mcp.tool
async def artifact_subscribe(
    artifact_type: str,
    task_id: str | None = None,
) -> str:
    """Subscribe to artifact type notifications. Use '*' for all types."""
    body: dict[str, object] = {"artifact_type": artifact_type}
    if task_id:
        body["task_id"] = task_id
    result = await _get_client().post("/artifacts/subscribe", json=body)
    return _format(result)


@mcp.tool
async def artifact_history(name: str) -> str:
    """Get all versions of an artifact by name."""
    latest = await _get_client().get("/artifacts/latest", params={"name": name})
    if "data" in latest and "id" in latest["data"]:
        artifact_id = latest["data"]["id"]
        result = await _get_client().get(f"/artifacts/{artifact_id}/history")
        return _format(result)
    return _format(latest)


# ═══════════════════════════════════════════════
# Coordination Event Mesh Tools
# ═══════════════════════════════════════════════


@mcp.tool
async def coordination_emit(
    event_type: str,
    payload_json: str,
    task_id: str,
    entity_name: str | None = None,
) -> str:
    """Emit a typed coordination event (e.g., component.created, test.written)."""
    body: dict[str, object] = {
        "event_type": event_type,
        "payload": json.loads(payload_json),
        "task_id": task_id,
    }
    if entity_name:
        body["entity_name"] = entity_name
    result = await _get_client().post("/coordination/emit", json=body)
    return _format(result)


@mcp.tool
async def coordination_subscribe(
    event_pattern: str,
    task_id: str | None = None,
) -> str:
    """Subscribe to coordination events. Pattern: exact (component.created), wildcard (component.*), or all (*)."""
    body: dict[str, object] = {"event_pattern": event_pattern}
    if task_id:
        body["task_id"] = task_id
    result = await _get_client().post("/coordination/subscribe", json=body)
    return _format(result)


@mcp.tool
async def coordination_replay(
    task_id: str,
    event_types: str | None = None,
    limit: int = 500,
) -> str:
    """Replay coordination events for a task. Catch up to current state after joining mid-stream."""
    body: dict[str, object] = {"task_id": task_id, "limit": limit}
    if event_types:
        body["event_types"] = [t.strip() for t in event_types.split(",")]
    result = await _get_client().post("/coordination/replay", json=body)
    return _format(result)


@mcp.tool
async def coordination_project(
    task_id: str,
    projection_type: str,
) -> str:
    """Get derived state from coordination events. Types: component_registry, test_coverage, artifact_view."""
    result = await _get_client().get(
        "/coordination/project", params={"task_id": task_id, "projection_type": projection_type}
    )
    return _format(result)


# ═══════════════════════════════════════════════
# Autonomy Dial Tools
# ═══════════════════════════════════════════════


@mcp.tool
async def approval_request(
    action_type: str,
    entity_type: str,
    entity_id: str,
    risk_level: int,
    payload_json: str,
) -> str:
    """Create an approval request when an action exceeds autonomy level."""
    body: dict[str, object] = {
        "action_type": action_type,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "risk_level": risk_level,
        "payload": json.loads(payload_json),
    }
    result = await _get_client().post("/approvals", json=body)
    return _format(result)


@mcp.tool
async def approval_respond(
    approval_id: str,
    decision: str,
    notes: str | None = None,
) -> str:
    """Approve or reject a pending approval request. Decision must be 'approve' or 'reject'."""
    if decision not in ("approve", "reject"):
        return json.dumps({"error": "decision must be 'approve' or 'reject'"})
    body: dict[str, str] = {}
    if notes:
        body["notes"] = notes
    result = await _get_client().post(f"/approvals/{approval_id}/{decision}", json=body or None)
    return _format(result)


@mcp.tool
async def approval_list(
    status: str | None = None,
    action_type: str | None = None,
) -> str:
    """List approval requests. Filter by status (pending/approved/rejected) or action_type."""
    params: dict[str, str] = {}
    if status:
        params["status"] = status
    if action_type:
        params["action_type"] = action_type
    result = await _get_client().get("/approvals", params=params or None)
    return _format(result)
