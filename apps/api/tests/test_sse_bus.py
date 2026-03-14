"""Unit tests for the SSE EventBus and emit() helper."""

from __future__ import annotations

import asyncio
import contextlib
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pendulum
import pytest

from app.events.bus import _MAX_QUEUE_SIZE, EventBus, InMemoryBackend
from app.events.schemas import SSEEvent
from app.models.enums import EventSeverity, SSEEventType


def _make_sse_event(**overrides: object) -> SSEEvent:
    defaults: dict[str, object] = {
        "sequence": 1,
        "type": SSEEventType.TASK_TRANSITIONED.value,
        "org_id": uuid.uuid4(),
        "actor_id": uuid.uuid4(),
        "entity_type": "task",
        "entity_id": uuid.uuid4(),
        "data": {"key": "value"},
        "created_at": pendulum.now("UTC"),
    }
    defaults.update(overrides)
    return SSEEvent(**defaults)


# ---------------------------------------------------------------------------
# InMemoryBackend
# ---------------------------------------------------------------------------


class TestInMemoryBackend:
    @pytest.mark.asyncio
    async def test_publish_subscribe_roundtrip(self):
        backend = InMemoryBackend()
        received: list[str] = []

        async def _consume():
            async for payload in backend.subscribe("agent-1"):
                received.append(payload)
                if len(received) >= 2:
                    break

        consumer = asyncio.create_task(_consume())
        await asyncio.sleep(0.01)

        await backend.publish("agent-1", '{"a":1}')
        await backend.publish("agent-1", '{"a":2}')

        await asyncio.wait_for(consumer, timeout=1.0)
        assert received == ['{"a":1}', '{"a":2}']

    @pytest.mark.asyncio
    async def test_unsubscribe_removes_queue(self):
        backend = InMemoryBackend()
        backend._queues["agent-1"] = asyncio.Queue()
        assert "agent-1" in backend._queues

        await backend.unsubscribe("agent-1")
        assert "agent-1" not in backend._queues

    @pytest.mark.asyncio
    async def test_backpressure_drops_oldest(self):
        backend = InMemoryBackend()
        queue: asyncio.Queue[str] = asyncio.Queue(maxsize=_MAX_QUEUE_SIZE)
        backend._queues["agent-1"] = queue

        for i in range(_MAX_QUEUE_SIZE):
            queue.put_nowait(f"msg-{i}")

        assert queue.full()

        await backend.publish("agent-1", "new-msg")

        assert queue.full()
        items = []
        while not queue.empty():
            items.append(queue.get_nowait())
        assert items[-1] == "new-msg"
        assert items[0] == "msg-1"  # msg-0 was dropped


# ---------------------------------------------------------------------------
# EventBus
# ---------------------------------------------------------------------------


class TestEventBus:
    @pytest.mark.asyncio
    async def test_publish_and_subscribe(self):
        bus = EventBus(backend=InMemoryBackend())
        event = _make_sse_event()
        received: list[SSEEvent] = []

        async def _consume():
            async for e in bus.subscribe("sub-1"):
                received.append(e)
                break

        consumer = asyncio.create_task(_consume())
        await asyncio.sleep(0.01)

        await bus.publish(event)
        await asyncio.wait_for(consumer, timeout=1.0)

        assert len(received) == 1
        assert received[0].type == event.type
        assert received[0].entity_id == event.entity_id

    @pytest.mark.asyncio
    async def test_targeted_publish_delivers_to_target_only(self):
        backend = InMemoryBackend()
        bus = EventBus(backend=backend)
        event = _make_sse_event()
        received: list[SSEEvent] = []

        async def _consume():
            async for e in bus.subscribe("sub-1"):
                received.append(e)
                break

        consumer = asyncio.create_task(_consume())
        await asyncio.sleep(0.01)

        # Publish only to sub-1
        await bus.publish(event, target_ids=["sub-1"])
        await asyncio.wait_for(consumer, timeout=1.0)

        assert len(received) == 1

        # Verify sub-2 never got a queue entry
        assert "sub-2" not in backend._queues

    @pytest.mark.asyncio
    async def test_disconnect(self):
        backend = InMemoryBackend()
        bus = EventBus(backend=backend)

        # Start a subscriber to register a queue
        async def _consume():
            async for _ in bus.subscribe("sub-1"):
                break

        task = asyncio.create_task(_consume())
        await asyncio.sleep(0.01)
        assert "sub-1" in backend._queues

        await bus.disconnect("sub-1")
        assert "sub-1" not in backend._queues

        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task


# ---------------------------------------------------------------------------
# emit()
# ---------------------------------------------------------------------------


class TestEmit:
    @pytest.mark.asyncio
    async def test_emit_inserts_event_and_publishes(self):
        db = AsyncMock()
        db.add = MagicMock()

        org_id = uuid.uuid4()
        actor_id = uuid.uuid4()
        entity_id = uuid.uuid4()

        with patch("app.events.emit.event_bus") as mock_bus:
            mock_bus.publish = AsyncMock()

            from app.events.emit import emit

            await emit(
                db=db,
                type=SSEEventType.TASK_TRANSITIONED,
                org_id=org_id,
                actor_id=actor_id,
                entity_type="task",
                entity_id=entity_id,
                data={"from_status": "todo", "to_status": "in_progress"},
            )

            # Verify Event row was added to DB
            db.add.assert_called_once()
            event_obj = db.add.call_args[0][0]
            assert event_obj.type == "task.transitioned"
            assert event_obj.org_id == org_id

            # Verify flush was called (before commit)
            db.flush.assert_awaited_once()

            # Verify SSE event was published
            mock_bus.publish.assert_awaited_once()
            published_event = mock_bus.publish.call_args[0][0]
            assert published_event.type == SSEEventType.TASK_TRANSITIONED.value
            assert published_event.entity_id == entity_id

    @pytest.mark.asyncio
    async def test_emit_with_custom_severity(self):
        db = AsyncMock()
        db.add = MagicMock()

        with patch("app.events.emit.event_bus") as mock_bus:
            mock_bus.publish = AsyncMock()

            from app.events.emit import emit

            await emit(
                db=db,
                type=SSEEventType.ESCALATION_CREATED,
                org_id=uuid.uuid4(),
                actor_id=uuid.uuid4(),
                entity_type="escalation",
                entity_id=uuid.uuid4(),
                data={},
                severity=EventSeverity.WARNING,
                reasoning="Agent blocked for 10 minutes",
            )

            event_obj = db.add.call_args[0][0]
            assert event_obj.severity == "warning"
            assert event_obj.reasoning == "Agent blocked for 10 minutes"

    @pytest.mark.asyncio
    async def test_emit_targeted(self):
        db = AsyncMock()
        db.add = MagicMock()

        with patch("app.events.emit.event_bus") as mock_bus:
            mock_bus.publish = AsyncMock()

            from app.events.emit import emit

            await emit(
                db=db,
                type=SSEEventType.MESSAGE_SENT,
                org_id=uuid.uuid4(),
                actor_id=uuid.uuid4(),
                entity_type="message",
                entity_id=uuid.uuid4(),
                data={},
                target_agents=["agent-a", "agent-b"],
            )

            call_kwargs = mock_bus.publish.call_args[1]
            assert call_kwargs["target_ids"] == ["agent-a", "agent-b"]

    @pytest.mark.asyncio
    async def test_emit_sequence_increments(self):
        db = AsyncMock()
        db.add = MagicMock()

        with patch("app.events.emit.event_bus") as mock_bus:
            mock_bus.publish = AsyncMock()

            from app.events.emit import emit

            await emit(
                db=db,
                type=SSEEventType.TASK_CREATED,
                org_id=uuid.uuid4(),
                actor_id=uuid.uuid4(),
                entity_type="task",
                entity_id=uuid.uuid4(),
                data={},
            )
            seq1 = mock_bus.publish.call_args[0][0].sequence

            await emit(
                db=db,
                type=SSEEventType.TASK_CREATED,
                org_id=uuid.uuid4(),
                actor_id=uuid.uuid4(),
                entity_type="task",
                entity_id=uuid.uuid4(),
                data={},
            )
            seq2 = mock_bus.publish.call_args[0][0].sequence

            assert seq2 > seq1
