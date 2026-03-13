"""In-process event bus for SSE real-time push.

Singleton EventBus backed by a BusBackend protocol. The default InMemoryBackend
uses asyncio.Queue per subscriber — zero external dependencies, suitable for
single-worker uvicorn. Swap to PgNotifyBackend or RedisPubSubBackend later
for multi-worker deployments.
"""

from __future__ import annotations

import asyncio
import contextlib
from collections.abc import AsyncGenerator
from typing import Protocol, runtime_checkable

import structlog

from app.events.schemas import SSEEvent

logger = structlog.stdlib.get_logger()

_MAX_QUEUE_SIZE = 1000


@runtime_checkable
class BusBackend(Protocol):
    """Abstraction over the pub/sub transport."""

    async def publish(self, channel: str, payload: str) -> None: ...

    def subscribe(self, channel: str) -> AsyncGenerator[str, None]: ...

    async def unsubscribe(self, channel: str) -> None: ...


class InMemoryBackend:
    """Single-process pub/sub via asyncio.Queue."""

    def __init__(self) -> None:
        self._queues: dict[str, asyncio.Queue[str]] = {}

    async def publish(self, channel: str, payload: str) -> None:
        for sub_id, queue in self._queues.items():
            if queue.full():
                # Drop oldest to prevent unbounded growth
                with contextlib.suppress(asyncio.QueueEmpty):
                    queue.get_nowait()
                await logger.awarning("sse_backpressure", subscriber=sub_id)
            queue.put_nowait(payload)

    async def subscribe(self, channel: str) -> AsyncGenerator[str, None]:
        queue: asyncio.Queue[str] = asyncio.Queue(maxsize=_MAX_QUEUE_SIZE)
        self._queues[channel] = queue
        try:
            while True:
                payload = await queue.get()
                yield payload
        finally:
            self._queues.pop(channel, None)

    async def unsubscribe(self, channel: str) -> None:
        self._queues.pop(channel, None)


class EventBus:
    """High-level pub/sub for SSE events."""

    def __init__(self, backend: BusBackend | None = None) -> None:
        self._backend: BusBackend = backend or InMemoryBackend()

    async def publish(self, event: SSEEvent, target_ids: list[str] | None = None) -> None:
        """Broadcast event to all subscribers, or to specific targets."""
        payload = event.model_dump_json()

        if target_ids is not None:
            for target in target_ids:
                await self._backend.publish(target, payload)
        else:
            # Broadcast — publish to the global channel, picked up by all
            await self._backend.publish("__broadcast__", payload)

    async def subscribe(self, subscriber_id: str) -> AsyncGenerator[SSEEvent, None]:
        """Yield SSEEvents for a subscriber. Merges broadcast + targeted channels."""
        # For InMemoryBackend, each subscriber gets its own queue via the channel name.
        # Broadcast events are published to ALL queues in publish().
        async for payload in self._backend.subscribe(subscriber_id):
            yield SSEEvent.model_validate_json(payload)

    async def disconnect(self, subscriber_id: str) -> None:
        await self._backend.unsubscribe(subscriber_id)


# Module-level singleton
event_bus = EventBus()
