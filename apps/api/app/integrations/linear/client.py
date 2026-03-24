"""Async Linear GraphQL API client using httpx."""

from __future__ import annotations

from typing import Any

import httpx
import structlog

logger = structlog.stdlib.get_logger()

LINEAR_API_URL = "https://api.linear.app/graphql"
_TIMEOUT = 30.0


class LinearClient:
    """Thin async wrapper around Linear's GraphQL API."""

    def __init__(self, api_key: str) -> None:
        self._api_key = api_key

    async def _request(self, query: str, variables: dict[str, Any] | None = None) -> dict:
        headers = {
            "Authorization": self._api_key,
            "Content-Type": "application/json",
        }
        payload: dict[str, Any] = {"query": query}
        if variables:
            payload["variables"] = variables

        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.post(LINEAR_API_URL, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        if "errors" in data:
            await logger.aerror("linear_graphql_errors", errors=data["errors"])
            raise LinearAPIError(data["errors"])
        return data.get("data", {})

    # ── Issue operations ────────────────────────────

    async def create_issue(
        self,
        team_id: str,
        title: str,
        description: str | None = None,
        state_name: str | None = None,
        assignee_id: str | None = None,
    ) -> dict:
        """Create a Linear issue. Returns the created issue dict."""
        mutation = """
        mutation CreateIssue($input: IssueCreateInput!) {
            issueCreate(input: $input) {
                success
                issue {
                    id
                    identifier
                    title
                    url
                    state { name }
                    assignee { id displayName email }
                }
            }
        }
        """
        input_vars: dict[str, Any] = {"teamId": team_id, "title": title}
        if description:
            input_vars["description"] = description
        if state_name:
            # Resolve state id first
            state_id = await self._resolve_state_id(team_id, state_name)
            if state_id:
                input_vars["stateId"] = state_id
        if assignee_id:
            input_vars["assigneeId"] = assignee_id

        data = await self._request(mutation, {"input": input_vars})
        result = data.get("issueCreate", {})
        if not result.get("success"):
            raise LinearAPIError(f"issueCreate failed: {result}")
        return result["issue"]

    async def update_issue(
        self,
        issue_id: str,
        title: str | None = None,
        description: str | None = None,
        state_name: str | None = None,
        team_id: str | None = None,
        assignee_id: str | None = None,
    ) -> dict:
        """Update a Linear issue. Only provided fields are changed."""
        mutation = """
        mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
            issueUpdate(id: $id, input: $input) {
                success
                issue {
                    id
                    identifier
                    title
                    url
                    state { name }
                    assignee { id displayName email }
                }
            }
        }
        """
        input_vars: dict[str, Any] = {}
        if title is not None:
            input_vars["title"] = title
        if description is not None:
            input_vars["description"] = description
        if state_name and team_id:
            state_id = await self._resolve_state_id(team_id, state_name)
            if state_id:
                input_vars["stateId"] = state_id
        if assignee_id is not None:
            input_vars["assigneeId"] = assignee_id if assignee_id else None

        if not input_vars:
            return {}

        data = await self._request(mutation, {"id": issue_id, "input": input_vars})
        result = data.get("issueUpdate", {})
        if not result.get("success"):
            raise LinearAPIError(f"issueUpdate failed: {result}")
        return result["issue"]

    async def create_comment(self, issue_id: str, body: str) -> dict:
        """Add a comment to a Linear issue."""
        mutation = """
        mutation CreateComment($input: CommentCreateInput!) {
            commentCreate(input: $input) {
                success
                comment {
                    id
                    body
                    user { id displayName }
                }
            }
        }
        """
        data = await self._request(
            mutation, {"input": {"issueId": issue_id, "body": body}}
        )
        result = data.get("commentCreate", {})
        if not result.get("success"):
            raise LinearAPIError(f"commentCreate failed: {result}")
        return result["comment"]

    async def get_issue(self, issue_id: str) -> dict:
        """Fetch a single issue by id."""
        query = """
        query GetIssue($id: String!) {
            issue(id: $id) {
                id
                identifier
                title
                description
                url
                state { id name }
                assignee { id displayName email }
                team { id name }
            }
        }
        """
        data = await self._request(query, {"id": issue_id})
        return data.get("issue", {})

    # ── Helpers ─────────────────────────────────────

    async def _resolve_state_id(self, team_id: str, state_name: str) -> str | None:
        """Resolve a workflow state name to its id for a given team."""
        query = """
        query TeamStates($teamId: String!) {
            team(id: $teamId) {
                states { nodes { id name } }
            }
        }
        """
        data = await self._request(query, {"teamId": team_id})
        nodes = data.get("team", {}).get("states", {}).get("nodes", [])
        for node in nodes:
            if node["name"].lower() == state_name.lower():
                return node["id"]
        return None

    async def get_user(self, user_id: str) -> dict:
        """Fetch a Linear user by id."""
        query = """
        query GetUser($id: String!) {
            user(id: $id) {
                id
                displayName
                email
            }
        }
        """
        data = await self._request(query, {"id": user_id})
        return data.get("user", {})

    async def test_connection(self) -> dict:
        """Test the API key by fetching the authenticated user's info."""
        query = """
        query Me {
            viewer {
                id
                displayName
                email
            }
        }
        """
        return await self._request(query)


class LinearAPIError(Exception):
    """Raised when the Linear API returns an error."""
