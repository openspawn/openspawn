"""Tasks resource module."""

from typing import Optional

from openspawn.enums import TaskStatus
from openspawn.http_client import AsyncHTTPClient, SyncHTTPClient
from openspawn.models import CreateTaskRequest, Task, TransitionTaskRequest


class TasksResource:
    """Synchronous tasks resource."""

    def __init__(self, client: SyncHTTPClient) -> None:
        self._client = client

    def list(
        self,
        *,
        status: Optional[TaskStatus] = None,
        assignee_id: Optional[str] = None,
        creator_id: Optional[str] = None,
        parent_task_id: Optional[str] = None,
    ) -> list[Task]:
        """
        List tasks with optional filters.

        Args:
            status: Filter by task status
            assignee_id: Filter by assignee ID
            creator_id: Filter by creator ID
            parent_task_id: Filter by parent task ID

        Returns:
            List of tasks
        """
        params = {}
        if status:
            params["status"] = status.value
        if assignee_id:
            params["assigneeId"] = assignee_id
        if creator_id:
            params["creatorId"] = creator_id
        if parent_task_id:
            params["parentTaskId"] = parent_task_id

        response = self._client.request("GET", "/tasks", params=params)
        return [Task(**task) for task in response["data"]]

    def get(self, task_id: str) -> Task:
        """
        Get a specific task by ID.

        Args:
            task_id: Task ID

        Returns:
            Task instance
        """
        response = self._client.request("GET", f"/tasks/{task_id}")
        return Task(**response["data"])

    def create(self, request: CreateTaskRequest) -> Task:
        """
        Create a new task.

        Args:
            request: Task creation request

        Returns:
            Created task
        """
        response = self._client.request(
            "POST",
            "/tasks",
            json_data=request.model_dump(exclude_none=True, by_alias=True),
            idempotent=True,
        )
        return Task(**response["data"])

    def transition(self, task_id: str, request: TransitionTaskRequest) -> Task:
        """
        Transition a task to a new status.

        Args:
            task_id: Task ID
            request: Transition request

        Returns:
            Updated task
        """
        response = self._client.request(
            "POST",
            f"/tasks/{task_id}/transition",
            json_data=request.model_dump(exclude_none=True),
        )
        return Task(**response["data"])

    def assign(self, task_id: str, assignee_id: str) -> Task:
        """
        Assign a task to an agent.

        Args:
            task_id: Task ID
            assignee_id: Agent ID to assign to

        Returns:
            Updated task
        """
        response = self._client.request(
            "POST",
            f"/tasks/{task_id}/assign",
            json_data={"assigneeId": assignee_id},
        )
        return Task(**response["data"])

    def approve(self, task_id: str) -> Task:
        """
        Approve a task in review.

        Args:
            task_id: Task ID

        Returns:
            Updated task
        """
        response = self._client.request("POST", f"/tasks/{task_id}/approve")
        return Task(**response["data"])

    def claim(self, task_id: str) -> Task:
        """
        Claim an unassigned task.

        Args:
            task_id: Task ID

        Returns:
            Updated task (assigned to current agent)
        """
        # Get current agent's ID from context - for now, use assign with empty assigneeId
        # The API should assign to the authenticated agent
        response = self._client.request("POST", f"/tasks/{task_id}/assign", json_data={})
        return Task(**response["data"])


class AsyncTasksResource:
    """Asynchronous tasks resource."""

    def __init__(self, client: AsyncHTTPClient) -> None:
        self._client = client

    async def list(
        self,
        *,
        status: Optional[TaskStatus] = None,
        assignee_id: Optional[str] = None,
        creator_id: Optional[str] = None,
        parent_task_id: Optional[str] = None,
    ) -> list[Task]:
        """
        List tasks with optional filters.

        Args:
            status: Filter by task status
            assignee_id: Filter by assignee ID
            creator_id: Filter by creator ID
            parent_task_id: Filter by parent task ID

        Returns:
            List of tasks
        """
        params = {}
        if status:
            params["status"] = status.value
        if assignee_id:
            params["assigneeId"] = assignee_id
        if creator_id:
            params["creatorId"] = creator_id
        if parent_task_id:
            params["parentTaskId"] = parent_task_id

        response = await self._client.request("GET", "/tasks", params=params)
        return [Task(**task) for task in response["data"]]

    async def get(self, task_id: str) -> Task:
        """
        Get a specific task by ID.

        Args:
            task_id: Task ID

        Returns:
            Task instance
        """
        response = await self._client.request("GET", f"/tasks/{task_id}")
        return Task(**response["data"])

    async def create(self, request: CreateTaskRequest) -> Task:
        """
        Create a new task.

        Args:
            request: Task creation request

        Returns:
            Created task
        """
        response = await self._client.request(
            "POST",
            "/tasks",
            json_data=request.model_dump(exclude_none=True, by_alias=True),
            idempotent=True,
        )
        return Task(**response["data"])

    async def transition(self, task_id: str, request: TransitionTaskRequest) -> Task:
        """
        Transition a task to a new status.

        Args:
            task_id: Task ID
            request: Transition request

        Returns:
            Updated task
        """
        response = await self._client.request(
            "POST",
            f"/tasks/{task_id}/transition",
            json_data=request.model_dump(exclude_none=True),
        )
        return Task(**response["data"])

    async def assign(self, task_id: str, assignee_id: str) -> Task:
        """
        Assign a task to an agent.

        Args:
            task_id: Task ID
            assignee_id: Agent ID to assign to

        Returns:
            Updated task
        """
        response = await self._client.request(
            "POST",
            f"/tasks/{task_id}/assign",
            json_data={"assigneeId": assignee_id},
        )
        return Task(**response["data"])

    async def approve(self, task_id: str) -> Task:
        """
        Approve a task in review.

        Args:
            task_id: Task ID

        Returns:
            Updated task
        """
        response = await self._client.request("POST", f"/tasks/{task_id}/approve")
        return Task(**response["data"])

    async def claim(self, task_id: str) -> Task:
        """
        Claim an unassigned task.

        Args:
            task_id: Task ID

        Returns:
            Updated task (assigned to current agent)
        """
        response = await self._client.request("POST", f"/tasks/{task_id}/assign", json_data={})
        return Task(**response["data"])
