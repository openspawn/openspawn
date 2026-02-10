"""Messages resource module."""

from typing import Optional

from openspawn.http_client import AsyncHTTPClient, SyncHTTPClient
from openspawn.models import Message, SendMessageRequest


class MessagesResource:
    """Synchronous messages resource."""

    def __init__(self, client: SyncHTTPClient) -> None:
        self._client = client

    def send(self, request: SendMessageRequest) -> Message:
        """
        Send a message to a channel.

        Args:
            request: Message send request

        Returns:
            Created message
        """
        response = self._client.request(
            "POST",
            "/messages",
            json_data=request.model_dump(exclude_none=True, by_alias=True),
            idempotent=True,
        )
        return Message(**response["data"])

    def list(
        self,
        channel_id: str,
        *,
        limit: int = 50,
        before: Optional[str] = None,
    ) -> list[Message]:
        """
        List messages in a channel.

        Args:
            channel_id: Channel ID
            limit: Maximum number of messages to return
            before: Get messages before this message ID (for pagination)

        Returns:
            List of messages
        """
        params = {"channelId": channel_id, "limit": str(limit)}
        if before:
            params["before"] = before

        response = self._client.request("GET", "/messages", params=params)
        return [Message(**msg) for msg in response["data"]]

    def get(self, message_id: str) -> Message:
        """
        Get a specific message by ID.

        Args:
            message_id: Message ID

        Returns:
            Message instance
        """
        response = self._client.request("GET", f"/messages/{message_id}")
        return Message(**response["data"])

    def get_thread(self, message_id: str) -> list[Message]:
        """
        Get all replies in a message thread.

        Args:
            message_id: Parent message ID

        Returns:
            List of thread messages
        """
        response = self._client.request("GET", f"/messages/{message_id}/thread")
        return [Message(**msg) for msg in response["data"]]


class AsyncMessagesResource:
    """Asynchronous messages resource."""

    def __init__(self, client: AsyncHTTPClient) -> None:
        self._client = client

    async def send(self, request: SendMessageRequest) -> Message:
        """
        Send a message to a channel.

        Args:
            request: Message send request

        Returns:
            Created message
        """
        response = await self._client.request(
            "POST",
            "/messages",
            json_data=request.model_dump(exclude_none=True, by_alias=True),
            idempotent=True,
        )
        return Message(**response["data"])

    async def list(
        self,
        channel_id: str,
        *,
        limit: int = 50,
        before: Optional[str] = None,
    ) -> list[Message]:
        """
        List messages in a channel.

        Args:
            channel_id: Channel ID
            limit: Maximum number of messages to return
            before: Get messages before this message ID (for pagination)

        Returns:
            List of messages
        """
        params = {"channelId": channel_id, "limit": str(limit)}
        if before:
            params["before"] = before

        response = await self._client.request("GET", "/messages", params=params)
        return [Message(**msg) for msg in response["data"]]

    async def get(self, message_id: str) -> Message:
        """
        Get a specific message by ID.

        Args:
            message_id: Message ID

        Returns:
            Message instance
        """
        response = await self._client.request("GET", f"/messages/{message_id}")
        return Message(**response["data"])

    async def get_thread(self, message_id: str) -> list[Message]:
        """
        Get all replies in a message thread.

        Args:
            message_id: Parent message ID

        Returns:
            List of thread messages
        """
        response = await self._client.request("GET", f"/messages/{message_id}/thread")
        return [Message(**msg) for msg in response["data"]]
