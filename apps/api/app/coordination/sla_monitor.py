"""SLA Monitor — arq cron job that checks task deadlines.

Runs every 60 seconds. Emits warning events at threshold and triggers
automatic escalation on breach.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING

import structlog
from sqlalchemy import select

from app.config import settings

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession
from app.coordination.escalation import escalate_task_automatic
from app.database import async_session
from app.models.enums import TaskStatus
from app.models.event import Event
from app.models.task import Task

logger = structlog.get_logger()


def check_sla_thresholds(
    created_at: datetime,
    due_date: datetime | None,
    sla_warning_sent: bool,
    warning_pct: int = 80,
    breach_pct: int = 100,
) -> str | None:
    """Check SLA status for a single task.

    Returns: None (no deadline), "ok", "warning", or "breach".
    """
    if due_date is None:
        return None

    now = datetime.now(UTC)

    # Ensure timezone-aware
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=UTC)
    if due_date.tzinfo is None:
        due_date = due_date.replace(tzinfo=UTC)

    total_duration = (due_date - created_at).total_seconds()
    if total_duration <= 0:
        return "breach"

    elapsed = (now - created_at).total_seconds()
    elapsed_pct = (elapsed / total_duration) * 100

    if elapsed_pct >= breach_pct:
        return "breach"
    if elapsed_pct >= warning_pct and not sla_warning_sent:
        return "warning"

    return "ok"


async def monitor_sla(ctx: dict) -> int:
    """arq job: scan in-progress tasks with deadlines, warn or escalate."""
    async with async_session() as db:
        result = await db.execute(
            select(Task).where(
                Task.status == TaskStatus.IN_PROGRESS.value,
                Task.due_date.isnot(None),
                Task.deleted_at.is_(None),
            )
        )
        tasks = result.scalars().all()

        warnings = 0
        breaches = 0

        for task in tasks:
            status = check_sla_thresholds(
                created_at=task.created_at,
                due_date=task.due_date,
                sla_warning_sent=task.sla_warning_sent_at is not None,
                warning_pct=settings.sla_warning_pct,
                breach_pct=settings.sla_breach_pct,
            )

            if status == "warning":
                await _emit_warning(db, task)
                warnings += 1
            elif status == "breach":
                await escalate_task_automatic(db, task, reason="SLA_BREACH")
                breaches += 1

        await db.commit()
        logger.info(
            "sla_monitor.done",
            scanned=len(tasks),
            warnings=warnings,
            breaches=breaches,
        )
        return warnings + breaches


async def _emit_warning(db: AsyncSession, task: Task) -> None:
    """Mark task as warned and emit SLA warning event."""
    import pendulum

    task.sla_warning_sent_at = pendulum.now("UTC")

    if task.due_date is None:
        return
    total = (task.due_date - task.created_at).total_seconds()
    now = datetime.now(UTC)
    if task.created_at.tzinfo is None:
        created = task.created_at.replace(tzinfo=UTC)
    else:
        created = task.created_at
    elapsed = (now - created).total_seconds()
    elapsed_pct = round((elapsed / total) * 100, 1) if total > 0 else 100.0

    actor_id = task.assignee_id or task.creator_id
    event = Event(
        org_id=task.org_id,
        type="task.sla.warning",
        actor_id=actor_id,
        entity_type="task",
        entity_id=task.id,
        data={
            "deadline": str(task.due_date),
            "elapsed_pct": elapsed_pct,
        },
        severity="warning",
    )
    db.add(event)

    logger.info(
        "sla_monitor.warning",
        task_id=str(task.id),
        elapsed_pct=elapsed_pct,
    )
