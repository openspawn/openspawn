"""FastAPI server — serves simulation state to the BikiniBottom dashboard."""

from __future__ import annotations

import asyncio
import json
import os
import re
from pathlib import Path
from typing import Any

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from sse_starlette.sse import EventSourceResponse

from .agents import create_all_agents
from .mappers import (
    collect_all_messages,
    generate_credits,
    map_agent,
    map_event,
    map_message,
    map_task,
)
from .simulation import Simulation, _make_acp, _now_ms, _push_message
from .types import ACPType, SandboxEvent

# ── App setup ────────────────────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    global sim
    agents = create_all_agents()
    tick_ms = int(os.environ.get("TICK_INTERVAL_MS", "5000"))
    sim = Simulation(agents, tick_interval_ms=tick_ms)
    asyncio.create_task(sim.run())
    print(f"\n🌐 BikiniBottom Sandbox (FastAPI): http://0.0.0.0:{PORT}")

    if SERVE_DASHBOARD and Path(DASHBOARD_DIR).is_dir():
        app.mount("/", StaticFiles(directory=DASHBOARD_DIR, html=True), name="dashboard")
        print(f"   Serving dashboard from {DASHBOARD_DIR}")

    yield


app = FastAPI(title="BikiniBottom Sandbox", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

PORT = int(os.environ.get("SANDBOX_PORT", "3333"))
DASHBOARD_DIR = os.environ.get("DASHBOARD_DIR", str(Path(__file__).parent.parent.parent / "apps" / "dashboard" / "dist"))
SERVE_DASHBOARD = os.environ.get("SERVE_DASHBOARD", "0") == "1"

# ── Simulation singleton ────────────────────────────────────────────────────

sim: Simulation | None = None


def get_sim() -> Simulation:
    assert sim is not None, "Simulation not initialized"
    return sim


# ── GraphQL-compatible endpoint ──────────────────────────────────────────────


@app.post("/graphql")
async def graphql(request: Request) -> JSONResponse:
    body = await request.json()
    query = body.get("query", "")
    variables = body.get("variables", {})
    op_match = re.search(r"(?:query|mutation)\s+(\w+)", query)
    op = op_match.group(1) if op_match else ""
    result = handle_graphql(op, variables, get_sim())
    return JSONResponse({"data": result})


def handle_graphql(op: str, variables: dict, sim: Simulation) -> dict[str, Any]:
    agents = sim.agents
    tasks = sim.tasks
    events = sim.events

    if op == "Agents":
        return {"agents": [map_agent(a, agents) for a in agents]}

    if op == "Agent":
        agent = next((a for a in agents if a.id == variables.get("id")), None)
        return {"agent": map_agent(agent, agents) if agent else None}

    if op == "Tasks":
        return {"tasks": [map_task(t, agents) for t in tasks]}

    if op == "Task":
        task = next((t for t in tasks if t.id == variables.get("id")), None)
        return {"task": map_task(task, agents) if task else None}

    if op in ("CreditHistory", "Credits"):
        credits = generate_credits(sim)
        agent_id = variables.get("agentId")
        if agent_id:
            credits = [c for c in credits if c["agentId"] == agent_id]
        credits.sort(key=lambda c: c["createdAt"], reverse=True)
        offset = variables.get("offset", 0)
        limit = variables.get("limit", 50)
        return {"creditHistory": credits[offset : offset + limit]}

    if op == "Events":
        limit = variables.get("limit", 50)
        mapped = [map_event(e, agents) for e in events[-limit:]]
        mapped.reverse()
        return {"events": mapped}

    if op == "Messages":
        limit = variables.get("limit", 50)
        all_msgs = collect_all_messages(agents)
        mapped = [map_message(m, agents) for m in all_msgs]
        mapped.sort(key=lambda m: m["createdAt"], reverse=True)
        return {"messages": mapped[:limit]}

    if op == "AgentReputation":
        agent = next((a for a in agents if a.id == variables.get("id")), None)
        if not agent:
            return {"agentReputation": None}
        ts = min(100, 30 + agent.level * 7 + agent.stats.tasks_completed * 2)
        return {
            "agentReputation": {
                "trustScore": ts,
                "reputationLevel": "ELITE" if ts >= 86 else "VETERAN" if ts >= 71 else "TRUSTED" if ts >= 41 else "PROBATION",
                "tasksCompleted": agent.stats.tasks_completed,
                "tasksSuccessful": agent.stats.tasks_completed,
                "successRate": 100,
                "lastActivityAt": _iso_now(),
                "promotionProgress": None,
            }
        }

    if op == "TrustLeaderboard":
        mapped = sorted([map_agent(a, agents) for a in agents], key=lambda a: a["trustScore"], reverse=True)
        return {"trustLeaderboard": mapped[:10]}

    if op == "Conversations":
        all_msgs = collect_all_messages(agents)
        pairs: dict[str, list] = {}
        for m in all_msgs:
            key = "::".join(sorted([m.from_agent, m.to]))
            pairs.setdefault(key, []).append(m)
        convos = []
        for key, msgs in pairs.items():
            a_id, b_id = key.split("::")
            agent_a = next((a for a in agents if a.id == a_id), None)
            agent_b = next((a for a in agents if a.id == b_id), None)
            last = msgs[-1]
            convos.append({
                "id": f"conv-{key}",
                "participants": [
                    {"id": agent_a.id, "name": agent_a.name} if agent_a else {"id": a_id, "name": a_id},
                    {"id": agent_b.id, "name": agent_b.name} if agent_b else {"id": b_id, "name": b_id},
                ],
                "lastMessage": last.body or last.summary or last.type.value,
                "lastMessageAt": _iso_ms(last.timestamp),
                "messageCount": len(msgs),
            })
        convos.sort(key=lambda c: c["lastMessageAt"], reverse=True)
        return {"conversations": convos}

    return {}


# ── SSE stream ───────────────────────────────────────────────────────────────


@app.get("/api/stream")
async def sse_stream(request: Request, task: str | None = None, agent: str | None = None):
    s = get_sim()
    queue: asyncio.Queue[SandboxEvent] = asyncio.Queue()

    def listener(event: SandboxEvent):
        if task and event.task_id != task:
            return
        if agent and event.agent_id != agent:
            return
        queue.put_nowait(event)

    unsub = s.on_event(listener)

    async def event_generator():
        yield {"data": json.dumps({"type": "connected", "message": "Stream connected"})}
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=30)
                    yield {
                        "data": json.dumps({
                            "type": event.type,
                            "agentId": event.agent_id,
                            "taskId": event.task_id,
                            "message": event.message,
                            "timestamp": event.timestamp,
                            "agentName": next((a.name for a in s.agents if a.id == event.agent_id), None) if event.agent_id else None,
                        })
                    }
                except asyncio.TimeoutError:
                    yield {"data": json.dumps({"type": "heartbeat"})}
        finally:
            unsub()

    return EventSourceResponse(event_generator())


# ── REST endpoints ───────────────────────────────────────────────────────────


@app.get("/api/state")
async def state():
    s = get_sim()
    return {
        "tick": s.tick,
        "agentCount": len(s.agents),
        "taskCount": len(s.tasks),
        "eventCount": len(s.events),
        "tasksDone": sum(1 for t in s.tasks if t.status.value == "done"),
    }


@app.get("/api/agents")
async def agents_list():
    s = get_sim()
    return [map_agent(a, s.agents) for a in s.agents]


@app.get("/api/tasks")
async def tasks_list():
    s = get_sim()
    return [map_task(t, s.agents) for t in s.tasks]


@app.get("/api/events")
async def events_list():
    s = get_sim()
    return [map_event(e, s.agents) for e in s.events[-100:]]


@app.get("/api/metrics")
async def metrics():
    return get_sim().metrics_history


@app.get("/api/metrics/acp")
async def acp_metrics():
    s = get_sim()
    all_msgs = collect_all_messages(s.agents)

    total_acks = total_escalations = total_completions = total_delegations = 0
    delegation_ts: dict[str, int] = {}
    ack_latencies: list[int] = []
    escalations_by_reason: dict[str, int] = {}

    for msg in all_msgs:
        t = msg.type.value
        if t == "ack":
            total_acks += 1
            key = f"{msg.task_id}::{msg.from_agent}"
            if key in delegation_ts:
                ack_latencies.append(msg.timestamp - delegation_ts[key])
        elif t == "delegation":
            total_delegations += 1
            delegation_ts[f"{msg.task_id}::{msg.to}"] = msg.timestamp
        elif t == "escalation":
            total_escalations += 1
            if msg.reason:
                escalations_by_reason[msg.reason] = escalations_by_reason.get(msg.reason, 0) + 1
        elif t == "completion":
            total_completions += 1

    task_delegation_counts: dict[str, int] = {}
    for msg in all_msgs:
        if msg.type.value == "delegation" and msg.task_id:
            task_delegation_counts[msg.task_id] = task_delegation_counts.get(msg.task_id, 0) + 1

    depths = list(task_delegation_counts.values())
    avg_depth = sum(depths) / len(depths) if depths else 0

    non_backlog = [t for t in s.tasks if t.status.value != "backlog"]
    done_tasks = [t for t in s.tasks if t.status.value == "done"]
    completion_rate = len(done_tasks) / len(non_backlog) if non_backlog else 0
    escalation_rate = total_escalations / len(s.tasks) if s.tasks else 0
    avg_ack_latency = sum(ack_latencies) // len(ack_latencies) if ack_latencies else 0

    return {
        "ackLatencyMs": avg_ack_latency,
        "escalationRate": round(escalation_rate, 2),
        "avgDelegationDepth": round(avg_depth, 1),
        "completionRate": round(completion_rate, 2),
        "totalAcks": total_acks,
        "totalEscalations": total_escalations,
        "totalCompletions": total_completions,
        "totalDelegations": total_delegations,
        "escalationsByReason": escalations_by_reason,
    }


@app.post("/api/order")
async def send_order(request: Request):
    body = await request.json()
    message = body.get("message")
    if not message:
        return {"error": "message required"}

    s = get_sim()
    coo = next((a for a in s.agents if a.role.value == "coo" or a.level >= 10), None)
    if not coo:
        return {"error": "COO not found"}

    order_msg = _make_acp(ACPType.DELEGATION, "human-principal", coo.id, body=f"[PRIORITY ORDER FROM HUMAN PRINCIPAL]: {message}")
    coo.recent_messages.append(order_msg)
    coo.inbox.append(order_msg)

    s.events.append(SandboxEvent(type="human_order", agent_id=coo.id, message=f"📢 Human Principal: {message}"))
    s.process_order(message)

    return {"ok": True, "message": f"Order delivered to {coo.name}"}


@app.post("/api/restart")
async def restart(mode: str = "organic"):
    await get_sim().restart(mode)
    s = get_sim()
    return {"ok": True, "agentCount": len(s.agents), "mode": mode}


@app.post("/api/agents/spawn")
async def spawn_agent(request: Request):
    body = await request.json()
    name = body.get("name")
    if not name:
        return {"error": "name required"}

    s = get_sim()
    from .agents import make_agent
    from .types import AgentRole

    aid = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    if any(a.id == aid for a in s.agents):
        return {"error": f'Agent "{aid}" already exists'}

    role = body.get("role", "worker")
    domain = body.get("domain", "Engineering")
    level = body.get("level", 4)

    coo = next((a for a in s.agents if a.role.value == "coo" or a.level >= 10), None)
    if role == "lead":
        parent_id = coo.id if coo else None
    else:
        domain_lead = next((a for a in s.agents if a.role.value == "lead" and a.domain.lower() == domain.lower()), None)
        parent_id = (domain_lead.id if domain_lead else coo.id) if (domain_lead or coo) else None

    new_agent = make_agent(aid, name, AgentRole(role), level, domain, parent_id)
    new_agent.avatar = body.get("avatar")
    new_agent.avatar_color = body.get("avatarColor")
    s.agents.append(new_agent)

    event = SandboxEvent(type="agent_spawned", agent_id=new_agent.id, message=f"🐣 {new_agent.name} has joined the team!")
    s.events.append(event)
    s._emit(event)

    return {"ok": True, "agent": map_agent(new_agent, s.agents)}


@app.get("/api/speed")
async def get_speed():
    return {"tickIntervalMs": get_sim().tick_interval_ms}


@app.put("/api/speed")
async def set_speed(request: Request):
    body = await request.json()
    s = get_sim()
    if "tickIntervalMs" in body:
        s.tick_interval_ms = max(100, min(10000, int(body["tickIntervalMs"])))
    elif "speed" in body:
        base = 800 if hasattr(s, "scenario_engine") else 5000
        s.tick_interval_ms = max(100, round(base / float(body["speed"])))
    return {"ok": True, "tickIntervalMs": s.tick_interval_ms}


@app.get("/api/models")
async def models():
    return {
        "provider": "deterministic",
        "providerInfo": "Rule-based simulation (no LLM)",
        "currentModel": "deterministic",
        "locked": True,
        "availableModels": [],
    }


@app.get("/api/task/{task_id}/activity")
async def task_activity(task_id: str):
    s = get_sim()
    task = next((t for t in s.tasks if t.id == task_id), None)
    if task:
        return [
            {
                "id": m.id,
                "type": m.type.value,
                "from": m.from_agent,
                "fromName": next((a.name for a in s.agents if a.id == m.from_agent), m.from_agent),
                "to": m.to,
                "toName": next((a.name for a in s.agents if a.id == m.to), m.to),
                "body": m.body,
                "reason": m.reason,
                "summary": m.summary,
                "pct": m.pct,
                "timestamp": m.timestamp,
            }
            for m in task.activity_log
        ]
    return []


@app.get("/api/agent/{agent_id}/messages")
async def agent_messages(agent_id: str):
    s = get_sim()
    all_msgs = collect_all_messages(s.agents)
    return [
        m.model_dump(by_alias=True)
        for m in all_msgs
        if m.from_agent == agent_id or m.to == agent_id
    ]


# ── Dashboard static file serving ───────────────────────────────────────────


# Dashboard static serving is handled in lifespan


# ── Helpers ──────────────────────────────────────────────────────────────────


def _iso_now() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()


def _iso_ms(ts_ms: int) -> str:
    from datetime import datetime, timezone
    return datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc).isoformat()
