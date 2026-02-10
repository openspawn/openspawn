"""Tests for tasks resource."""

import pytest
import respx
from httpx import Response

from openspawn import OpenSpawnClient, AsyncOpenSpawnClient
from openspawn.enums import TaskPriority, TaskStatus
from openspawn.models import CreateTaskRequest, TransitionTaskRequest


@respx.mock
def test_list_tasks() -> None:
    """Test listing tasks."""
    respx.get("https://api.test/tasks").mock(
        return_value=Response(
            200,
            json={
                "data": [
                    {
                        "id": "1",
                        "title": "Test Task",
                        "description": "A test task",
                        "status": "todo",
                        "priority": "normal",
                        "creatorId": "agent_1",
                        "createdAt": "2024-01-01T00:00:00Z",
                    }
                ]
            },
        )
    )

    with OpenSpawnClient(base_url="https://api.test", api_key="test") as client:
        tasks = client.tasks.list()

    assert len(tasks) == 1
    assert tasks[0].title == "Test Task"
    assert tasks[0].status == TaskStatus.TODO


@respx.mock
def test_create_task() -> None:
    """Test creating a task."""
    respx.post("https://api.test/tasks").mock(
        return_value=Response(
            200,
            json={
                "data": {
                    "id": "1",
                    "title": "New Task",
                    "description": "Task description",
                    "status": "backlog",
                    "priority": "high",
                    "creatorId": "agent_1",
                    "createdAt": "2024-01-01T00:00:00Z",
                }
            },
        )
    )

    with OpenSpawnClient(base_url="https://api.test", api_key="test") as client:
        request = CreateTaskRequest(
            title="New Task",
            description="Task description",
            priority=TaskPriority.HIGH,
        )
        task = client.tasks.create(request)

    assert task.title == "New Task"
    assert task.priority == TaskPriority.HIGH


@respx.mock
def test_transition_task() -> None:
    """Test transitioning a task."""
    respx.post("https://api.test/tasks/1/transition").mock(
        return_value=Response(
            200,
            json={
                "data": {
                    "id": "1",
                    "title": "Test Task",
                    "status": "in_progress",
                    "priority": "normal",
                    "creatorId": "agent_1",
                    "createdAt": "2024-01-01T00:00:00Z",
                }
            },
        )
    )

    with OpenSpawnClient(base_url="https://api.test", api_key="test") as client:
        request = TransitionTaskRequest(
            status=TaskStatus.IN_PROGRESS,
            notes="Starting work",
        )
        task = client.tasks.transition("1", request)

    assert task.status == TaskStatus.IN_PROGRESS


@pytest.mark.asyncio
@respx.mock
async def test_async_list_tasks() -> None:
    """Test async listing tasks."""
    respx.get("https://api.test/tasks?status=todo").mock(
        return_value=Response(
            200,
            json={
                "data": [
                    {
                        "id": "1",
                        "title": "Test Task",
                        "status": "todo",
                        "priority": "normal",
                        "creatorId": "agent_1",
                        "createdAt": "2024-01-01T00:00:00Z",
                    }
                ]
            },
        )
    )

    async with AsyncOpenSpawnClient(base_url="https://api.test", api_key="test") as client:
        tasks = await client.tasks.list(status=TaskStatus.TODO)

    assert len(tasks) == 1
    assert tasks[0].status == TaskStatus.TODO
