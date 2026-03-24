"""Two-way sync logic between Linear issues and OpenSpawn tasks.

Linear → OpenSpawn:  Driven by webhook events.
OpenSpawn → Linear:  Called after task mutations when sync is enabled.
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any

import structlog
from sqlalchemy import select

from app.integrations.linear.client import LinearClient
from app.integrations.linear.status_map import (
    linear_to_openspawn,
    openspawn_to_linear,
)
from app.models.enums import TaskStatus
from app.models.integration import IntegrationLink, LinearConnection
from app.models.task import Task, TaskComment

if TYPE_CHECKING:
    import uuid

    from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.stdlib.get_logger()

PROVIDER = "linear"
SOURCE_TYPE_ISSUE = "linear_issue"
SOURCE_TYPE_COMMENT = "linear_comment"
TARGET_TYPE_TASK = "task"
TARGET_TYPE_COMMENT = "task_comment"


# ═══════════════════════════════════════════════
# Linear → OpenSpawn  (webhook handlers)
# ═══════════════════════════════════════════════


async def handle_webhook_event(
    db: AsyncSession,
    connection: LinearConnection,
    payload: dict[str, Any],
) -> dict[str, Any]:
    """Dispatch a Linear webhook payload to the appropriate handler.

    Returns a summary dict for the response body.
    """
    event_type = payload.get("type", "")
    action = payload.get("action", "")
    data = payload.get("data", {})

    custom_status_map = (connection.sync_config or {}).get("status_map")

    handler_key = f"{event_type}.{action}"
    handlers = {
        "Issue.create": _handle_issue_created,
        "Issue.update": _handle_issue_updated,
        "Issue.remove": _handle_issue_removed,
        "Comment.create": _handle_comment_created,
    }

    handler = handlers.get(handler_key)
    if handler is None:
        await logger.ainfo("linear_webhook_unhandled", handler_key=handler_key)
        return {"handled": False, "reason": f"unhandled event: {handler_key}"}

    return await handler(db, connection, data, custom_status_map)


async def _handle_issue_created(
    db: AsyncSession,
    connection: LinearConnection,
    data: dict[str, Any],
    custom_status_map: dict[str, str] | None,
) -> dict[str, Any]:
    """Linear issue created → create OpenSpawn task (idempotent)."""
    issue_id = data.get("id", "")
    if not issue_id:
        return {"handled": False, "reason": "missing issue id"}

    # Idempotency: check if link already exists
    existing = await _find_link_by_source(db, connection.org_id, SOURCE_TYPE_ISSUE, issue_id)
    if existing:
        await logger.ainfo("linear_issue_already_linked", issue_id=issue_id)
        return {"handled": True, "action": "already_linked", "task_id": str(existing.target_id)}

    # Resolve status
    linear_state = (data.get("state", {}) or {}).get("name", "Backlog")
    os_status = linear_to_openspawn(linear_state, custom_status_map) or TaskStatus.BACKLOG.value

    # We need a creator agent — use a system/integration agent
    creator_id = await _get_or_create_system_agent(db, connection.org_id)

    # Create task
    from app.models.organization import Organization

    org = await db.get(Organization, connection.org_id)
    if not org:
        return {"handled": False, "reason": "organization not found"}

    identifier = f"{org.task_prefix}-{org.next_task_number}"
    org.next_task_number += 1

    task = Task(
        org_id=connection.org_id,
        identifier=identifier,
        title=data.get("title", "Untitled Linear Issue"),
        description=data.get("description"),
        status=os_status,
        priority="normal",
        creator_id=creator_id,
        metadata_={
            "linear_issue_id": issue_id,
            "linear_identifier": data.get("identifier"),
            "linear_url": data.get("url"),
            "source": "linear_webhook",
        },
    )
    db.add(task)
    await db.flush()

    # Create integration link
    link = IntegrationLink(
        org_id=connection.org_id,
        provider=PROVIDER,
        source_type=SOURCE_TYPE_ISSUE,
        source_id=issue_id,
        target_type=TARGET_TYPE_TASK,
        target_id=task.id,
        metadata_={
            "linear_identifier": data.get("identifier"),
            "linear_url": data.get("url"),
            "connection_id": str(connection.id),
        },
    )
    db.add(link)
    await db.commit()

    await logger.ainfo(
        "linear_issue_synced_to_task",
        issue_id=issue_id,
        task_id=str(task.id),
        identifier=identifier,
    )
    return {"handled": True, "action": "task_created", "task_id": str(task.id)}


async def _handle_issue_updated(
    db: AsyncSession,
    connection: LinearConnection,
    data: dict[str, Any],
    custom_status_map: dict[str, str] | None,
) -> dict[str, Any]:
    """Linear issue updated → update linked OpenSpawn task."""
    issue_id = data.get("id", "")
    link = await _find_link_by_source(db, connection.org_id, SOURCE_TYPE_ISSUE, issue_id)
    if not link:
        # Not linked — treat as create if sync_config allows auto-link
        if (connection.sync_config or {}).get("auto_link_updates", True):
            return await _handle_issue_created(db, connection, data, custom_status_map)
        return {"handled": False, "reason": "issue not linked"}

    task = await db.get(Task, link.target_id)
    if not task or task.deleted_at is not None:
        return {"handled": False, "reason": "linked task not found or deleted"}

    updated_fields: list[str] = []

    # Title
    if "title" in data and data["title"] != task.title:
        task.title = data["title"]
        updated_fields.append("title")

    # Description
    if "description" in data and data["description"] != task.description:
        task.description = data["description"]
        updated_fields.append("description")

    # Status
    if "state" in data:
        linear_state = (data["state"] or {}).get("name")
        if linear_state:
            new_status = linear_to_openspawn(linear_state, custom_status_map)
            if new_status and new_status != task.status:
                task.status = new_status
                if new_status == TaskStatus.DONE.value:
                    task.completed_at = datetime.utcnow()
                updated_fields.append("status")

    # Assignee
    if "assignee" in data:
        assignee_data = data.get("assignee")
        if assignee_data:
            agent_id = await _resolve_linear_user_to_agent(
                db, connection.org_id, assignee_data.get("id", "")
            )
            if agent_id and agent_id != task.assignee_id:
                task.assignee_id = agent_id
                updated_fields.append("assignee")
        elif task.assignee_id is not None:
            task.assignee_id = None
            updated_fields.append("assignee")

    if updated_fields:
        await db.commit()
        await logger.ainfo(
            "linear_issue_update_synced",
            issue_id=issue_id,
            task_id=str(task.id),
            fields=updated_fields,
        )

    return {"handled": True, "action": "task_updated", "fields": updated_fields}


async def _handle_issue_removed(
    db: AsyncSession,
    connection: LinearConnection,
    data: dict[str, Any],
    custom_status_map: dict[str, str] | None,
) -> dict[str, Any]:
    """Linear issue removed → cancel linked OpenSpawn task (soft)."""
    issue_id = data.get("id", "")
    link = await _find_link_by_source(db, connection.org_id, SOURCE_TYPE_ISSUE, issue_id)
    if not link:
        return {"handled": False, "reason": "issue not linked"}

    task = await db.get(Task, link.target_id)
    if not task or task.deleted_at is not None:
        return {"handled": False, "reason": "linked task not found"}

    if task.status != TaskStatus.CANCELLED.value:
        task.status = TaskStatus.CANCELLED.value
        meta = dict(task.metadata_ or {})
        meta["cancelled_reason"] = "linear_issue_removed"
        task.metadata_ = meta
        await db.commit()

    await logger.ainfo(
        "linear_issue_removed_task_cancelled", issue_id=issue_id, task_id=str(task.id)
    )
    return {"handled": True, "action": "task_cancelled"}


async def _handle_comment_created(
    db: AsyncSession,
    connection: LinearConnection,
    data: dict[str, Any],
    custom_status_map: dict[str, str] | None,
) -> dict[str, Any]:
    """Linear comment created → add comment to linked OpenSpawn task."""
    issue_id = (data.get("issue", {}) or {}).get("id", "")
    comment_id = data.get("id", "")
    body = data.get("body", "")

    if not issue_id or not body:
        return {"handled": False, "reason": "missing issue id or body"}

    # Idempotency: check if comment already linked
    existing = await _find_link_by_source(db, connection.org_id, SOURCE_TYPE_COMMENT, comment_id)
    if existing:
        return {"handled": True, "action": "comment_already_linked"}

    link = await _find_link_by_source(db, connection.org_id, SOURCE_TYPE_ISSUE, issue_id)
    if not link:
        return {"handled": False, "reason": "issue not linked — skipping comment"}

    author_id = await _get_or_create_system_agent(db, connection.org_id)

    comment = TaskComment(
        org_id=connection.org_id,
        task_id=link.target_id,
        author_id=author_id,
        body=f"[Linear] {body}",
    )
    db.add(comment)
    await db.flush()

    comment_link = IntegrationLink(
        org_id=connection.org_id,
        provider=PROVIDER,
        source_type=SOURCE_TYPE_COMMENT,
        source_id=comment_id,
        target_type=TARGET_TYPE_COMMENT,
        target_id=comment.id,
        metadata_={"connection_id": str(connection.id)},
    )
    db.add(comment_link)
    await db.commit()

    await logger.ainfo(
        "linear_comment_synced",
        comment_id=comment_id,
        task_id=str(link.target_id),
    )
    return {"handled": True, "action": "comment_created"}


# ═══════════════════════════════════════════════
# OpenSpawn → Linear  (push changes)
# ═══════════════════════════════════════════════


async def push_task_created(
    db: AsyncSession,
    task: Task,
    connection: LinearConnection,
) -> dict[str, Any] | None:
    """Push a newly created OpenSpawn task to Linear as an issue."""
    if not connection.api_key:
        await logger.awarning("linear_push_skipped_no_api_key", connection_id=str(connection.id))
        return None

    # Don't push back tasks that originated from Linear
    if (task.metadata_ or {}).get("source") == "linear_webhook":
        return None

    custom_map = (connection.sync_config or {}).get("status_map")
    linear_state = openspawn_to_linear(task.status, custom_map)

    client = LinearClient(connection.api_key)
    issue = await client.create_issue(
        team_id=connection.team_id,
        title=task.title,
        description=task.description,
        state_name=linear_state,
    )

    # Create integration link
    link = IntegrationLink(
        org_id=task.org_id,
        provider=PROVIDER,
        source_type=SOURCE_TYPE_ISSUE,
        source_id=issue["id"],
        target_type=TARGET_TYPE_TASK,
        target_id=task.id,
        metadata_={
            "linear_identifier": issue.get("identifier"),
            "linear_url": issue.get("url"),
            "connection_id": str(connection.id),
            "direction": "openspawn_to_linear",
        },
    )
    db.add(link)
    await db.commit()

    await logger.ainfo(
        "task_pushed_to_linear",
        task_id=str(task.id),
        issue_id=issue["id"],
    )
    return issue


async def push_task_transition(
    db: AsyncSession,
    task: Task,
    new_status: str,
    connection: LinearConnection,
) -> dict[str, Any] | None:
    """Push a task status change to the linked Linear issue."""
    if not connection.api_key:
        return None

    link = await _find_link_by_target(db, task.org_id, TARGET_TYPE_TASK, task.id)
    if not link:
        return None

    custom_map = (connection.sync_config or {}).get("status_map")
    linear_state = openspawn_to_linear(new_status, custom_map)
    if not linear_state:
        return None

    client = LinearClient(connection.api_key)
    issue = await client.update_issue(
        issue_id=link.source_id,
        state_name=linear_state,
        team_id=connection.team_id,
    )

    await logger.ainfo(
        "task_transition_pushed_to_linear",
        task_id=str(task.id),
        issue_id=link.source_id,
        new_state=linear_state,
    )
    return issue


async def push_task_comment(
    db: AsyncSession,
    task: Task,
    comment: TaskComment,
    connection: LinearConnection,
) -> dict[str, Any] | None:
    """Push a task comment to the linked Linear issue."""
    if not connection.api_key:
        return None

    # Don't push back comments that originated from Linear
    if comment.body.startswith("[Linear]"):
        return None

    link = await _find_link_by_target(db, task.org_id, TARGET_TYPE_TASK, task.id)
    if not link:
        return None

    client = LinearClient(connection.api_key)
    result = await client.create_comment(
        issue_id=link.source_id,
        body=f"[OpenSpawn] {comment.body}",
    )

    # Track the comment link
    comment_link = IntegrationLink(
        org_id=task.org_id,
        provider=PROVIDER,
        source_type=SOURCE_TYPE_COMMENT,
        source_id=result["id"],
        target_type=TARGET_TYPE_COMMENT,
        target_id=comment.id,
        metadata_={"connection_id": str(connection.id), "direction": "openspawn_to_linear"},
    )
    db.add(comment_link)
    await db.commit()

    return result


async def push_task_assignee(
    db: AsyncSession,
    task: Task,
    connection: LinearConnection,
) -> dict[str, Any] | None:
    """Push a task assignee change to the linked Linear issue."""
    if not connection.api_key:
        return None

    link = await _find_link_by_target(db, task.org_id, TARGET_TYPE_TASK, task.id)
    if not link:
        return None

    # Try to resolve OpenSpawn agent → Linear user
    linear_user_id = None
    if task.assignee_id:
        linear_user_id = await _resolve_agent_to_linear_user(db, task.org_id, task.assignee_id)

    client = LinearClient(connection.api_key)
    issue = await client.update_issue(
        issue_id=link.source_id,
        assignee_id=linear_user_id or "",
    )
    return issue


# ═══════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════


async def _find_link_by_source(
    db: AsyncSession,
    org_id: uuid.UUID,
    source_type: str,
    source_id: str,
) -> IntegrationLink | None:
    result = await db.execute(
        select(IntegrationLink).where(
            IntegrationLink.org_id == org_id,
            IntegrationLink.provider == PROVIDER,
            IntegrationLink.source_type == source_type,
            IntegrationLink.source_id == source_id,
        )
    )
    return result.scalar_one_or_none()


async def _find_link_by_target(
    db: AsyncSession,
    org_id: uuid.UUID,
    target_type: str,
    target_id: uuid.UUID,
) -> IntegrationLink | None:
    result = await db.execute(
        select(IntegrationLink).where(
            IntegrationLink.org_id == org_id,
            IntegrationLink.provider == PROVIDER,
            IntegrationLink.target_type == target_type,
            IntegrationLink.target_id == target_id,
        )
    )
    return result.scalar_one_or_none()


async def _get_or_create_system_agent(
    db: AsyncSession,
    org_id: uuid.UUID,
) -> uuid.UUID:
    """Get or create a system/integration agent for creating synced tasks."""
    from app.models.agent import Agent

    result = await db.execute(
        select(Agent).where(
            Agent.org_id == org_id,
            Agent.agent_id == "linear-integration",
        )
    )
    agent = result.scalar_one_or_none()
    if agent:
        return agent.id

    import os

    agent = Agent(
        org_id=org_id,
        agent_id="linear-integration",
        name="Linear Integration",
        role="worker",
        status="active",
        hmac_secret_enc=os.urandom(32),
        metadata_={"is_system_agent": True, "provider": "linear"},
    )
    db.add(agent)
    await db.flush()
    return agent.id


async def _resolve_linear_user_to_agent(
    db: AsyncSession,
    org_id: uuid.UUID,
    linear_user_id: str,
) -> uuid.UUID | None:
    """Try to find an OpenSpawn agent linked to a Linear user.

    Looks up integration_links where source_type=linear_user.
    Falls back to matching agent metadata.
    """
    # Check integration links first
    link = await _find_link_by_source(db, org_id, "linear_user", linear_user_id)
    if link:
        return link.target_id

    # Fallback: check agent metadata for linear_user_id
    from app.models.agent import Agent

    result = await db.execute(select(Agent).where(Agent.org_id == org_id))
    for agent in result.scalars().all():
        meta = agent.metadata_ or {}
        if meta.get("linear_user_id") == linear_user_id:
            return agent.id

    return None


async def _resolve_agent_to_linear_user(
    db: AsyncSession,
    org_id: uuid.UUID,
    agent_id: uuid.UUID,
) -> str | None:
    """Try to find a Linear user id for an OpenSpawn agent."""
    from app.models.agent import Agent

    agent = await db.get(Agent, agent_id)
    if agent:
        meta = agent.metadata_ or {}
        if meta.get("linear_user_id"):
            return meta["linear_user_id"]

    # Check integration links
    link = await _find_link_by_target(db, org_id, "agent", agent_id)
    if link and link.source_type == "linear_user":
        return link.source_id

    return None


async def get_active_linear_connections(
    db: AsyncSession,
    org_id: uuid.UUID,
) -> list[LinearConnection]:
    """Get all enabled Linear connections for an org."""
    result = await db.execute(
        select(LinearConnection).where(
            LinearConnection.org_id == org_id,
            LinearConnection.enabled.is_(True),
        )
    )
    return list(result.scalars().all())
