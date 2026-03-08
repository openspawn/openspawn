"""Tests for parent task status sync logic."""

from app.coordination.status_sync import compute_parent_status
from app.models.enums import TaskStatus


def test_all_done_completes_parent() -> None:
    statuses = [TaskStatus.DONE, TaskStatus.DONE, TaskStatus.DONE]
    assert compute_parent_status(statuses) == TaskStatus.DONE


def test_any_blocked_blocks_parent() -> None:
    statuses = [TaskStatus.DONE, TaskStatus.BLOCKED, TaskStatus.IN_PROGRESS]
    assert compute_parent_status(statuses) == TaskStatus.BLOCKED


def test_any_cancelled_with_rest_done_completes_parent() -> None:
    statuses = [TaskStatus.DONE, TaskStatus.CANCELLED, TaskStatus.DONE]
    assert compute_parent_status(statuses) == TaskStatus.DONE


def test_mixed_in_progress_stays_in_progress() -> None:
    statuses = [TaskStatus.DONE, TaskStatus.IN_PROGRESS]
    assert compute_parent_status(statuses) == TaskStatus.IN_PROGRESS


def test_empty_children_returns_none() -> None:
    assert compute_parent_status([]) is None


def test_all_cancelled_returns_cancelled() -> None:
    statuses = [TaskStatus.CANCELLED, TaskStatus.CANCELLED]
    assert compute_parent_status(statuses) == TaskStatus.CANCELLED
