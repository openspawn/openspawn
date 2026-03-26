"""A2A service layer — business logic for agent-to-agent communication."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

import pendulum
from fastapi import HTTPException, status
from sqlalchemy import select

from app.models.agent import Agent
from app.models.enums import TaskStatus
from app.models.organization import Organization
from app.models.task import Task

from .types import A2AMessage, A2ATask, A2ATaskStatus

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession


# ---------------------------------------------------------------------------
# State mapping helpers
# ---------------------------------------------------------------------------

_OPENSPAWN_TO_A2A: dict[str, str] = {
    TaskStatus.BACKLOG.value: "submitted",
    TaskStatus.TODO.value: "submitted",
    TaskStatus.IN_PROGRESS.value: "working",
    TaskStatus.REVIEW.value: "working",
    TaskStatus.DONE.value: "completed",
    TaskStatus.CANCELLED.value: "failed",
    TaskStatus.BLOCKED.value: "input-required",
}


def _to_a2a_state(openspawn_status: str) -> str:
    return _OPENSPAWN_TO_A2A.get(openspawn_status, "submitted")


def _task_to_a2a(task: Task) -> A2ATask:
    """Convert an OpenSpawn Task to an A2A task view."""
    messages: list[A2AMessage] = []
    if task.a2a_messages:
        raw = task.a2a_messages if isinstance(task.a2a_messages, list) else []
        for m in raw:
            try:
                messages.append(A2AMessage.model_validate(m))
            except Exception:
                continue

    return A2ATask(
        id=str(task.id),
        contextId=task.a2a_context_id,
        status=A2ATaskStatus(
            state=_to_a2a_state(task.status),
            message=task.title,
            timestamp=task.updated_at.isoformat() if task.updated_at else pendulum.now("UTC").isoformat(),
        ),
        messages=messages,
    )


# ---------------------------------------------------------------------------
# Service functions
# ---------------------------------------------------------------------------


async def send_message(
    db: AsyncSession,
    sender_id: str,
    target_agent_id: str,
    message: A2AMessage,
    context_id: str | None,
    org_id: uuid.UUID,
) -> A2ATask:
    """Create a task from an A2A message and assign to target agent."""
    # Verify sender exists
    sender_result = await db.execute(
        select(Agent).where(Agent.agent_id == sender_id, Agent.org_id == org_id)
    )
    sender = sender_result.scalar_one_or_none()
    if not sender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sender agent '{sender_id}' not found",
        )

    # Verify target exists
    target_result = await db.execute(
        select(Agent).where(Agent.agent_id == target_agent_id, Agent.org_id == org_id)
    )
    target = target_result.scalar_one_or_none()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target agent '{target_agent_id}' not found",
        )

    # Get org for task identifier
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found"
        )

    identifier = f"{org.task_prefix}-{org.next_task_number}"
    org.next_task_number += 1

    # Extract title from message parts
    title = "A2A message"
    for part in message.parts:
        if part.kind == "text" and part.text:
            title = part.text[:500]
            break

    task = Task(
        org_id=org_id,
        identifier=identifier,
        title=title,
        description=f"A2A message from {sender_id} to {target_agent_id}",
        status=TaskStatus.TODO.value,
        assignee_id=target.id,
        creator_id=sender.id,
        source="a2a",
        a2a_context_id=context_id,
        a2a_messages=[message.model_dump()],
    )

    db.add(task)
    await db.flush()
    await db.refresh(task)
    await db.commit()

    return _task_to_a2a(task)


async def complete_task(
    db: AsyncSession,
    task_id: uuid.UUID,
    agent_id: str,
    completion_status: str,
    result: str,
    org_id: uuid.UUID,
) -> A2ATask:
    """Mark a task as completed or failed."""
    task = await _get_a2a_task(db, task_id, org_id)

    # Verify agent is the assignee
    if task.assignee:
        if task.assignee.agent_id != agent_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the assigned agent can complete this task",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task has no assignee",
        )

    # Transition state
    new_status = TaskStatus.DONE.value if completion_status == "completed" else TaskStatus.CANCELLED.value
    task.status = new_status
    if new_status == TaskStatus.DONE.value:
        task.completed_at = pendulum.now("UTC")

    # Append result as agent message
    result_message = A2AMessage(
        kind="message",
        messageId=str(uuid.uuid4()),
        role="agent",
        parts=[{"kind": "text", "text": result}],  # type: ignore[arg-type]
        contextId=task.a2a_context_id,
    )

    existing_messages = task.a2a_messages or []
    if not isinstance(existing_messages, list):
        existing_messages = []
    existing_messages.append(result_message.model_dump())
    task.a2a_messages = existing_messages

    await db.flush()
    await db.refresh(task)
    await db.commit()

    return _task_to_a2a(task)


async def get_my_tasks(
    db: AsyncSession,
    agent_id: str,
    status_filter: str | None,
    limit: int,
    offset: int,
    org_id: uuid.UUID,
) -> list[A2ATask]:
    """Get tasks assigned to agent with source='a2a'."""
    # Resolve agent UUID from agent_id string
    agent_result = await db.execute(
        select(Agent).where(Agent.agent_id == agent_id, Agent.org_id == org_id)
    )
    agent = agent_result.scalar_one_or_none()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent '{agent_id}' not found",
        )

    query = select(Task).where(
        Task.assignee_id == agent.id,
        Task.org_id == org_id,
        Task.source == "a2a",
        Task.deleted_at.is_(None),
    )

    if status_filter:
        query = query.where(Task.status == status_filter)

    query = query.order_by(Task.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    tasks = result.scalars().all()

    return [_task_to_a2a(t) for t in tasks]


async def claim_task(
    db: AsyncSession,
    task_id: uuid.UUID,
    agent_id: str,
    org_id: uuid.UUID,
) -> A2ATask:
    """Claim an unassigned A2A task."""
    task = await _get_a2a_task(db, task_id, org_id)

    if task.assignee_id is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Task is already assigned",
        )

    # Resolve agent
    agent_result = await db.execute(
        select(Agent).where(Agent.agent_id == agent_id, Agent.org_id == org_id)
    )
    agent = agent_result.scalar_one_or_none()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent '{agent_id}' not found",
        )

    task.assignee_id = agent.id
    task.status = TaskStatus.IN_PROGRESS.value

    await db.flush()
    await db.refresh(task)
    await db.commit()

    return _task_to_a2a(task)


async def heartbeat(
    db: AsyncSession,
    agent_id: str,
    org_id: uuid.UUID,
) -> bool:
    """Update agent's last heartbeat timestamp."""
    result = await db.execute(
        select(Agent).where(Agent.agent_id == agent_id, Agent.org_id == org_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent '{agent_id}' not found",
        )

    agent.last_heartbeat = pendulum.now("UTC")
    agent.last_activity_at = pendulum.now("UTC")
    await db.flush()
    await db.commit()
    return True


async def get_task(
    db: AsyncSession,
    task_id: uuid.UUID,
    org_id: uuid.UUID,
) -> A2ATask:
    """Get a single A2A task by ID."""
    task = await _get_a2a_task(db, task_id, org_id)
    return _task_to_a2a(task)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


async def _get_a2a_task(db: AsyncSession, task_id: uuid.UUID, org_id: uuid.UUID) -> Task:
    """Fetch a task or raise 404."""
    result = await db.execute(
        select(Task).where(
            Task.id == task_id,
            Task.org_id == org_id,
            Task.deleted_at.is_(None),
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task
