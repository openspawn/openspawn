"""Parent task status sync.

Computes parent status from children and updates when subtask transitions.
Called after status transitions in the tasks router.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

import structlog
from sqlalchemy import select

from app.models.enums import TaskStatus
from app.models.event import Event
from app.models.task import Task

if TYPE_CHECKING:
    import uuid

    from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger()


def compute_parent_status(child_statuses: list[TaskStatus]) -> TaskStatus | None:
    """Determine what a parent's status should be based on its children.

    Rules:
    - Empty children -> None (no change)
    - Any BLOCKED -> BLOCKED
    - All DONE or CANCELLED (at least one DONE) -> DONE
    - All CANCELLED -> CANCELLED
    - Otherwise -> IN_PROGRESS
    """
    if not child_statuses:
        return None

    has_blocked = any(s == TaskStatus.BLOCKED for s in child_statuses)
    if has_blocked:
        return TaskStatus.BLOCKED

    non_cancelled = [s for s in child_statuses if s != TaskStatus.CANCELLED]

    if not non_cancelled:
        return TaskStatus.CANCELLED

    all_done = all(s == TaskStatus.DONE for s in non_cancelled)
    if all_done:
        return TaskStatus.DONE

    return TaskStatus.IN_PROGRESS


async def sync_parent_status(
    db: AsyncSession,
    task: Task,
    actor_id: uuid.UUID,
) -> bool:
    """Check if this task's parent needs a status update.

    Returns True if parent status was changed.
    """
    if not task.parent_task_id:
        return False

    parent = await db.get(Task, task.parent_task_id)
    if not parent:
        return False

    # Fetch all sibling subtasks (including this one)
    result = await db.execute(
        select(Task.status).where(
            Task.parent_task_id == parent.id,
            Task.deleted_at.is_(None),
        )
    )
    child_statuses = [TaskStatus(row[0]) for row in result.all()]

    new_status = compute_parent_status(child_statuses)
    if new_status is None or new_status.value == parent.status:
        return False

    old_status = parent.status
    parent.status = new_status.value

    if new_status == TaskStatus.DONE:
        import pendulum

        parent.completed_at = pendulum.now("UTC")

    # Emit event
    event = Event(
        org_id=parent.org_id,
        type="task.parent.status_synced",
        actor_id=actor_id,
        entity_type="task",
        entity_id=parent.id,
        data={
            "old_status": old_status,
            "new_status": new_status.value,
            "trigger_task_id": str(task.id),
            "children_count": len(child_statuses),
        },
    )
    db.add(event)

    logger.info(
        "status_sync.parent_updated",
        parent_id=str(parent.id),
        old_status=old_status,
        new_status=new_status.value,
    )

    # Recurse: if parent also has a parent, sync upward
    if parent.parent_task_id:
        await sync_parent_status(db, parent, actor_id)

    return True
