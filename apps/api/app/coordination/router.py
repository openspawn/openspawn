"""Capability-based task routing.

Scores agents by capability match * availability and assigns the best candidate.
Called synchronously during task creation when no assignee is specified.
"""

from __future__ import annotations

import uuid

import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent, AgentCapability
from app.models.enums import AgentStatus, TaskStatus
from app.models.event import Event
from app.models.task import Task

logger = structlog.get_logger()

PROFICIENCY_WEIGHTS: dict[str, float] = {
    "basic": 1.0,
    "standard": 2.0,
    "expert": 3.0,
}


def score_candidate(
    agent_proficiencies: dict[str, str],
    required_capabilities: list[str],
    active_task_count: int,
) -> float:
    """Score an agent candidate for a task.

    Returns 0.0 if the agent is missing any required capability.
    Otherwise: sum(proficiency_weight) * availability_weight.
    """
    availability = 1.0 / (1.0 + active_task_count)

    if not required_capabilities:
        return availability

    total_proficiency = 0.0
    for cap in required_capabilities:
        prof = agent_proficiencies.get(cap)
        if prof is None:
            return 0.0
        total_proficiency += PROFICIENCY_WEIGHTS.get(prof, 1.0)

    return total_proficiency * availability


async def route_task(
    db: AsyncSession,
    task: Task,
    org_id: uuid.UUID,
    actor_id: uuid.UUID,
) -> uuid.UUID | None:
    """Find the best agent for a task based on required_capabilities.

    Returns the assigned agent's ID, or None if no match found.
    """
    required = task.required_capabilities or []

    # Query active agents with their capabilities
    agents_result = await db.execute(
        select(Agent).where(
            Agent.org_id == org_id,
            Agent.status == AgentStatus.ACTIVE.value,
            Agent.deleted_at.is_(None),
        )
    )
    agents = agents_result.scalars().all()

    if not agents:
        logger.warning("route_task.no_agents", task_id=str(task.id))
        return None

    best_agent_id: uuid.UUID | None = None
    best_score = 0.0

    for agent in agents:
        # Build proficiency map for this agent
        caps_result = await db.execute(
            select(AgentCapability).where(AgentCapability.agent_id == agent.id)
        )
        caps = caps_result.scalars().all()
        proficiencies = {c.capability: c.proficiency for c in caps}

        # Count active tasks
        active_count_result = await db.scalar(
            select(func.count())
            .select_from(Task)
            .where(
                Task.assignee_id == agent.id,
                Task.status.in_([TaskStatus.IN_PROGRESS.value, TaskStatus.TODO.value]),
            )
        )
        active_count = active_count_result or 0

        score = score_candidate(proficiencies, required, active_count)

        if score > best_score:
            best_score = score
            best_agent_id = agent.id

    if best_agent_id is None:
        logger.info("route_task.no_match", task_id=str(task.id), required=required)
        return None

    # Assign task
    task.assignee_id = best_agent_id

    # Emit event
    event = Event(
        org_id=org_id,
        type="task.routed",
        actor_id=actor_id,
        entity_type="task",
        entity_id=task.id,
        data={"agent_id": str(best_agent_id), "score": best_score},
    )
    db.add(event)

    logger.info(
        "route_task.assigned",
        task_id=str(task.id),
        agent_id=str(best_agent_id),
        score=best_score,
    )
    return best_agent_id
