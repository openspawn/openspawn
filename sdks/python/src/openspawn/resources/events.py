"""Events resource module."""

from datetime import datetime
from typing import Optional

from openspawn.enums import EventSeverity
from openspawn.http_client import AsyncHTTPClient, SyncHTTPClient
from openspawn.models import Event


class EventsResource:
    """Synchronous events resource."""

    def __init__(self, client: SyncHTTPClient) -> None:
        self._client = client

    def list(
        self,
        *,
        type: Optional[str] = None,
        actor_id: Optional[str] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        severity: Optional[EventSeverity] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        page: int = 1,
        limit: int = 50,
    ) -> tuple[list[Event], dict[str, int]]:
        """
        List events with optional filters.

        Args:
            type: Filter by event type
            actor_id: Filter by actor ID
            entity_type: Filter by entity type
            entity_id: Filter by entity ID
            severity: Filter by severity
            start_date: Filter by start date
            end_date: Filter by end date
            page: Page number (1-indexed)
            limit: Number of events per page

        Returns:
            Tuple of (events list, pagination metadata)
        """
        params = {"page": str(page), "limit": str(limit)}
        if type:
            params["type"] = type
        if actor_id:
            params["actorId"] = actor_id
        if entity_type:
            params["entityType"] = entity_type
        if entity_id:
            params["entityId"] = entity_id
        if severity:
            params["severity"] = severity.value
        if start_date:
            params["startDate"] = start_date.isoformat()
        if end_date:
            params["endDate"] = end_date.isoformat()

        response = self._client.request("GET", "/events", params=params)
        events = [Event(**event) for event in response["data"]]
        return events, response.get("meta", {})

    def get(self, event_id: str) -> Event:
        """
        Get a specific event by ID.

        Args:
            event_id: Event ID

        Returns:
            Event instance
        """
        response = self._client.request("GET", f"/events/{event_id}")
        return Event(**response["data"])


class AsyncEventsResource:
    """Asynchronous events resource."""

    def __init__(self, client: AsyncHTTPClient) -> None:
        self._client = client

    async def list(
        self,
        *,
        type: Optional[str] = None,
        actor_id: Optional[str] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        severity: Optional[EventSeverity] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        page: int = 1,
        limit: int = 50,
    ) -> tuple[list[Event], dict[str, int]]:
        """
        List events with optional filters.

        Args:
            type: Filter by event type
            actor_id: Filter by actor ID
            entity_type: Filter by entity type
            entity_id: Filter by entity ID
            severity: Filter by severity
            start_date: Filter by start date
            end_date: Filter by end date
            page: Page number (1-indexed)
            limit: Number of events per page

        Returns:
            Tuple of (events list, pagination metadata)
        """
        params = {"page": str(page), "limit": str(limit)}
        if type:
            params["type"] = type
        if actor_id:
            params["actorId"] = actor_id
        if entity_type:
            params["entityType"] = entity_type
        if entity_id:
            params["entityId"] = entity_id
        if severity:
            params["severity"] = severity.value
        if start_date:
            params["startDate"] = start_date.isoformat()
        if end_date:
            params["endDate"] = end_date.isoformat()

        response = await self._client.request("GET", "/events", params=params)
        events = [Event(**event) for event in response["data"]]
        return events, response.get("meta", {})

    async def get(self, event_id: str) -> Event:
        """
        Get a specific event by ID.

        Args:
            event_id: Event ID

        Returns:
            Event instance
        """
        response = await self._client.request("GET", f"/events/{event_id}")
        return Event(**response["data"])
