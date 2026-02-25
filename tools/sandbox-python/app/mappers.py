"""Map internal simulation types to dashboard-compatible API responses."""

from __future__ import annotations

import time
from typing import Any

from .types import ACPMessage, SandboxAgent, SandboxEvent, SandboxTask


# ── Domain → Team mapping ────────────────────────────────────────────────────

DOMAIN_TEAM_MAP: dict[str, str] = {
    "operations": "team-operations",
    "engineering": "team-engineering",
    "backend": "team-backend",
    "frontend": "team-frontend",
    "testing": "team-testing",
    "marketing": "team-marketing",
    "finance": "team-finance",
    "sales": "team-sales",
    "support": "team-support",
    "hr": "team-hr",
}


def _domain_to_team_id(domain: str) -> str:
    return DOMAIN_TEAM_MAP.get(domain.lower(), f"team-{domain.lower()}")


def _reputation_level(level: int) -> str:
    if level >= 9:
        return "ELITE"
    if level >= 6:
        return "VETERAN"
    if level >= 3:
        return "TRUSTED"
    if level >= 2:
        return "PROBATION"
    return "NEW"


TASK_STATUS_MAP: dict[str, str] = {
    "backlog": "BACKLOG",
    "pending": "TODO",
    "assigned": "TODO",
    "in_progress": "IN_PROGRESS",
    "review": "REVIEW",
    "done": "DONE",
    "rejected": "REVIEW",
    "blocked": "BLOCKED",
}

ACP_ICON: dict[str, str] = {
    "ack": "👍",
    "completion": "✅",
    "escalation": "🚨",
    "delegation": "📋",
    "progress": "📊",
    "status_request": "💬",
}


# ── Agent mapper ─────────────────────────────────────────────────────────────


def map_agent(agent: SandboxAgent, all_agents: list[SandboxAgent]) -> dict[str, Any]:
    trust_score = min(100, 30 + agent.level * 7 + agent.stats.tasks_completed * 2)
    now_iso = _iso_now()
    thirty_days_ago = _iso(time.time() - 30 * 86400)

    return {
        "id": agent.id,
        "agentId": agent.id,
        "name": agent.name,
        "role": (agent.domain or "WORKER").upper(),
        "mode": "ORCHESTRATOR" if agent.level >= 7 else "WORKER",
        "status": "ACTIVE" if agent.status.value == "busy" else agent.status.value.upper(),
        "level": agent.level,
        "model": "deterministic",
        "currentBalance": max(0, agent.stats.credits_earned - agent.stats.credits_spent),
        "lifetimeEarnings": agent.stats.credits_earned,
        "budgetPeriodLimit": 10000,
        "budgetPeriodSpent": agent.stats.credits_spent,
        "managementFeePct": 5 if agent.level >= 9 else 10,
        "createdAt": thirty_days_ago,
        "updatedAt": now_iso,
        "parentId": None if agent.parent_id == "human-principal" else agent.parent_id,
        "domain": agent.domain,
        "trustScore": trust_score,
        "reputationLevel": _reputation_level(agent.level),
        "tasksCompleted": agent.stats.tasks_completed,
        "tasksSuccessful": agent.stats.tasks_completed,
        "lastActivityAt": now_iso,
        "lastPromotionAt": None,
        "teamId": _domain_to_team_id(agent.domain),
        "avatar": agent.avatar,
        "avatarColor": agent.avatar_color,
        "avatarUrl": agent.avatar_url,
        "systemPrompt": agent.system_prompt,
        "trigger": agent.trigger.value,
        "triggerOn": [t.value for t in agent.trigger_on] if agent.trigger_on else None,
        "inboxSize": len(agent.inbox),
    }


# ── Task mapper ──────────────────────────────────────────────────────────────


def map_task(task: SandboxTask, agents: list[SandboxAgent]) -> dict[str, Any]:
    assignee = next((a for a in agents if a.id == task.assignee_id), None) if task.assignee_id else None
    return {
        "id": task.id,
        "identifier": task.id,
        "title": task.title,
        "description": task.description,
        "status": TASK_STATUS_MAP.get(task.status.value, task.status.value.upper()),
        "priority": task.priority.value.upper(),
        "assigneeId": task.assignee_id,
        "assignee": {"id": assignee.id, "name": assignee.name} if assignee else None,
        "creatorId": task.creator_id,
        "approvalRequired": False,
        "dueDate": None,
        "createdAt": _iso_ms(task.created_at),
        "updatedAt": _iso_ms(task.updated_at),
        "completedAt": _iso_ms(task.updated_at) if task.status.value == "done" else None,
        "rejection": None,
    }


# ── Event mapper ─────────────────────────────────────────────────────────────


def map_event(event: SandboxEvent, agents: list[SandboxAgent]) -> dict[str, Any]:
    actor = next((a for a in agents if a.id == event.agent_id), None) if event.agent_id else None
    severity_map = {"system": "INFO", "agent_action": "INFO", "error": "ERROR"}
    return {
        "id": f"evt-{event.timestamp}-{id(event)}",
        "type": event.type,
        "actorId": event.agent_id,
        "actor": {"id": actor.id, "name": actor.name} if actor else None,
        "entityType": "task" if event.task_id else ("agent" if event.agent_id else "system"),
        "entityId": event.task_id or event.agent_id or "system",
        "severity": severity_map.get(event.type, "INFO"),
        "reasoning": event.message,
        "createdAt": _iso_ms(event.timestamp),
    }


# ── Message mapper ───────────────────────────────────────────────────────────


def collect_all_messages(agents: list[SandboxAgent]) -> list[ACPMessage]:
    seen: set[str] = set()
    result: list[ACPMessage] = []
    for agent in agents:
        for msg in agent.recent_messages:
            if msg.id not in seen:
                seen.add(msg.id)
                result.append(msg)
    result.sort(key=lambda m: m.timestamp)
    return result


def map_message(msg: ACPMessage, agents: list[SandboxAgent]) -> dict[str, Any]:
    from_agent = next((a for a in agents if a.id == msg.from_agent), None)
    to_agent = next((a for a in agents if a.id == msg.to), None)
    icon = ACP_ICON.get(msg.type.value, "💬")
    return {
        "id": msg.id,
        "fromAgentId": msg.from_agent,
        "toAgentId": msg.to,
        "fromAgent": {"id": from_agent.id, "name": from_agent.name, "level": from_agent.level} if from_agent else None,
        "toAgent": {"id": to_agent.id, "name": to_agent.name, "level": to_agent.level} if to_agent else None,
        "content": f"{icon} {msg.body or msg.summary or msg.type.value}",
        "type": msg.type.value.upper(),
        "acpType": msg.type.value,
        "taskRef": msg.task_id or None,
        "reason": msg.reason,
        "pct": msg.pct,
        "summary": msg.summary,
        "read": True,
        "createdAt": _iso_ms(msg.timestamp),
    }


# ── Credits generator ────────────────────────────────────────────────────────


def generate_credits(sim) -> list[dict[str, Any]]:
    from .simulation import Simulation

    sim: Simulation = sim
    credits: list[dict] = []
    running = 0.0
    for snap in sim.metrics_history[-100:]:
        earned = snap.total_credits_earned
        spent = snap.total_credits_spent
        running = earned - spent
        credits.append({
            "id": f"credit-tick-{snap.tick}",
            "agentId": "system",
            "type": "CREDIT" if earned > spent else "DEBIT",
            "amount": abs(earned - spent),
            "reason": f"Tick {snap.tick} activity",
            "balanceAfter": running,
            "createdAt": _iso_ms(snap.timestamp),
            "sourceTaskId": None,
            "triggerType": "system",
        })
    for agent in sim.agents:
        if agent.stats.credits_earned > 0:
            credits.append({
                "id": f"credit-{agent.id}-earn",
                "agentId": agent.id,
                "type": "CREDIT",
                "amount": agent.stats.credits_earned,
                "reason": "Task completion rewards",
                "balanceAfter": agent.stats.credits_earned - agent.stats.credits_spent,
                "createdAt": _iso_now(),
                "sourceTaskId": None,
                "triggerType": "task_completion",
            })
        if agent.stats.credits_spent > 0:
            credits.append({
                "id": f"credit-{agent.id}-spend",
                "agentId": agent.id,
                "type": "DEBIT",
                "amount": agent.stats.credits_spent,
                "reason": "Model inference tokens",
                "balanceAfter": agent.stats.credits_earned - agent.stats.credits_spent,
                "createdAt": _iso_now(),
                "sourceTaskId": None,
                "triggerType": "model_usage",
            })
    return credits


# ── Helpers ──────────────────────────────────────────────────────────────────


def _iso_now() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()


def _iso(ts: float) -> str:
    from datetime import datetime, timezone
    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()


def _iso_ms(ts_ms: int) -> str:
    from datetime import datetime, timezone
    return datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc).isoformat()
