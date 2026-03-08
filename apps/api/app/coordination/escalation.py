"""Automatic escalation handler.

Called by the SLA Monitor when a task breaches its deadline.
Escalates to the assignee's parent agent, or marks as needs_attention.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

import structlog

from app.models.agent import Agent
from app.models.escalation import Escalation
from app.models.event import Event

if TYPE_CHECKING:
    import uuid

    from sqlalchemy.ext.asyncio import AsyncSession

    from app.models.task import Task

logger = structlog.get_logger()


def _build_escalation_event(
    org_id: uuid.UUID,
    task_id: uuid.UUID,
    from_agent_id: uuid.UUID,
    to_agent_id: uuid.UUID,
    reason: str,
) -> Event:
    return Event(
        org_id=org_id,
        type="task.escalated",
        actor_id=from_agent_id,
        entity_type="task",
        entity_id=task_id,
        data={
            "from_agent": str(from_agent_id),
            "to_agent": str(to_agent_id),
            "reason": reason,
        },
        severity="warning",
    )


def _build_unresolvable_event(
    org_id: uuid.UUID,
    task_id: uuid.UUID,
    agent_id: uuid.UUID,
) -> Event:
    return Event(
        org_id=org_id,
        type="task.escalation.unresolvable",
        actor_id=agent_id,
        entity_type="task",
        entity_id=task_id,
        data={"agent_id": str(agent_id)},
        severity="error",
    )


async def escalate_task_automatic(
    db: AsyncSession,
    task: Task,
    reason: str = "SLA_BREACH",
) -> bool:
    """Escalate a task to its assignee's parent agent.

    Returns True if escalation succeeded, False if unresolvable.
    """
    if not task.assignee_id:
        logger.warning("escalate.no_assignee", task_id=str(task.id))
        task.needs_attention = True
        db.add(
            _build_unresolvable_event(
                org_id=task.org_id,
                task_id=task.id,
                agent_id=task.creator_id,
            )
        )
        return False

    assignee = await db.get(Agent, task.assignee_id)
    if not assignee:
        logger.error("escalate.assignee_not_found", task_id=str(task.id))
        return False

    if assignee.parent_id:
        parent = await db.get(Agent, assignee.parent_id)
        if not parent:
            logger.error("escalate.parent_not_found", agent_id=str(assignee.id))
            return False

        old_assignee_id = task.assignee_id
        task.assignee_id = parent.id

        escalation = Escalation(
            org_id=task.org_id,
            task_id=task.id,
            from_agent_id=old_assignee_id,
            to_agent_id=parent.id,
            reason=reason,
            is_automatic=True,
        )
        db.add(escalation)

        db.add(
            _build_escalation_event(
                org_id=task.org_id,
                task_id=task.id,
                from_agent_id=old_assignee_id,
                to_agent_id=parent.id,
                reason=reason,
            )
        )

        logger.info(
            "escalate.success",
            task_id=str(task.id),
            from_agent=str(old_assignee_id),
            to_agent=str(parent.id),
        )
        return True
    else:
        task.needs_attention = True
        db.add(
            _build_unresolvable_event(
                org_id=task.org_id,
                task_id=task.id,
                agent_id=assignee.id,
            )
        )
        logger.warning(
            "escalate.unresolvable",
            task_id=str(task.id),
            agent_id=str(assignee.id),
        )
        return False
