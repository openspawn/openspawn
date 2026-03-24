"""Configurable status mapping between OpenSpawn task statuses and Linear workflow states."""

from __future__ import annotations

from app.models.enums import TaskStatus

# OpenSpawn status → Linear state name (default mapping).
# Users can override via sync_config.status_map on their LinearConnection.
DEFAULT_OPENSPAWN_TO_LINEAR: dict[str, str] = {
    TaskStatus.BACKLOG.value: "Backlog",
    TaskStatus.TODO.value: "Todo",
    TaskStatus.PENDING.value: "Todo",
    TaskStatus.ASSIGNED.value: "Todo",
    TaskStatus.IN_PROGRESS.value: "In Progress",
    TaskStatus.REVIEW.value: "In Review",
    TaskStatus.DONE.value: "Done",
    TaskStatus.CANCELLED.value: "Cancelled",
    TaskStatus.BLOCKED.value: "Blocked",
    TaskStatus.REJECTED.value: "Cancelled",
}

# Linear state name (lowercased) → OpenSpawn status.
DEFAULT_LINEAR_TO_OPENSPAWN: dict[str, str] = {
    "backlog": TaskStatus.BACKLOG.value,
    "triage": TaskStatus.BACKLOG.value,
    "unstarted": TaskStatus.TODO.value,
    "todo": TaskStatus.TODO.value,
    "started": TaskStatus.IN_PROGRESS.value,
    "in progress": TaskStatus.IN_PROGRESS.value,
    "in review": TaskStatus.REVIEW.value,
    "done": TaskStatus.DONE.value,
    "completed": TaskStatus.DONE.value,
    "cancelled": TaskStatus.CANCELLED.value,
    "canceled": TaskStatus.CANCELLED.value,
    "blocked": TaskStatus.BLOCKED.value,
}


def openspawn_to_linear(
    openspawn_status: str,
    custom_map: dict[str, str] | None = None,
) -> str | None:
    """Map an OpenSpawn task status to a Linear state name.

    Returns None if no mapping exists (caller should skip the update).
    """
    mapping = {**DEFAULT_OPENSPAWN_TO_LINEAR, **(custom_map or {})}
    return mapping.get(openspawn_status)


def linear_to_openspawn(
    linear_state_name: str,
    custom_map: dict[str, str] | None = None,
) -> str | None:
    """Map a Linear workflow state name to an OpenSpawn task status.

    Case-insensitive lookup. Returns None if unmapped.
    """
    mapping = {**DEFAULT_LINEAR_TO_OPENSPAWN, **(custom_map or {})}
    return mapping.get(linear_state_name.lower())
