"""A2A WebSocket endpoint for real-time task delivery to agents."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Any

import structlog
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.models.agent import Agent

from . import service

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

    pass  # A2ATask used in type annotation via Any at runtime

logger = structlog.stdlib.get_logger()

router = APIRouter(prefix="/a2a", tags=["a2a-ws"])


class A2AConnectionManager:
    """Manages WebSocket connections for A2A agents."""

    def __init__(self) -> None:
        self.connections: dict[str, WebSocket] = {}  # agent_id → websocket

    async def connect(self, agent_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.connections[agent_id] = websocket
        await logger.ainfo("a2a_ws_connected", agent_id=agent_id)

    def disconnect(self, agent_id: str) -> None:
        self.connections.pop(agent_id, None)
        # Fire-and-forget log (sync is fine for disconnect)

    async def send_to_agent(self, agent_id: str, data: dict[str, Any]) -> bool:
        ws = self.connections.get(agent_id)
        if ws:
            try:
                await ws.send_json(data)
                return True
            except Exception:
                self.disconnect(agent_id)
                return False
        return False

    def is_online(self, agent_id: str) -> bool:
        return agent_id in self.connections

    @property
    def online_agents(self) -> list[str]:
        return list(self.connections.keys())


# Singleton connection manager
manager = A2AConnectionManager()


async def _validate_ws_token(token: str, agent_id: str, db: AsyncSession) -> bool:
    """Validate a WebSocket connection token.

    Accepts:
    - API key (osp_...)
    - Agent JWT bearer token
    """
    if not token:
        return False

    # API key
    if token.startswith("osp_"):
        from app.auth.dependencies import _authenticate_api_key

        try:
            await _authenticate_api_key(token, db)
            return True
        except Exception:
            return False

    # Try agent JWT
    from app.auth.dependencies import _try_agent_jwt

    agent_ctx = _try_agent_jwt(token)
    return bool(agent_ctx and agent_ctx.agent_id == agent_id)


@router.websocket("/ws")
async def a2a_websocket(
    websocket: WebSocket,
    agent_id: str = Query(...),
    token: str = Query(...),
) -> None:
    """WebSocket endpoint for real-time A2A task delivery.

    Connect with: ws://host/a2a/ws?agent_id=dennis&token=<api_key_or_jwt>

    On connect, any pending tasks (status=todo, source=a2a) are sent.
    New tasks assigned to this agent are pushed in real-time.
    Agent can send task completion messages back.
    """
    # Get a DB session for auth validation
    from app.database import async_session

    async with async_session() as db:
        is_valid = await _validate_ws_token(token, agent_id, db)
        if not is_valid:
            await websocket.close(code=4001, reason="Invalid token")
            return

        # Resolve agent to get org_id
        result = await db.execute(select(Agent).where(Agent.agent_id == agent_id))
        agent = result.scalar_one_or_none()
        if not agent:
            await websocket.close(code=4004, reason="Agent not found")
            return

        org_id = agent.org_id

    await manager.connect(agent_id, websocket)

    try:
        # Send pending tasks on connect
        async with async_session() as db:
            pending_tasks = await service.get_my_tasks(
                db=db,
                agent_id=agent_id,
                status_filter="todo",
                limit=50,
                offset=0,
                org_id=org_id,
            )
            for task in pending_tasks:
                await websocket.send_json(
                    {
                        "type": "task.assigned",
                        "task": task.model_dump(),
                    }
                )

        # Keep-alive loop
        while True:
            data = await websocket.receive_json()

            # Handle task completion messages
            if data.get("type") == "task.complete":
                task_id = data.get("taskId")
                status = data.get("status", "completed")
                result = data.get("result", "")

                if task_id:
                    async with async_session() as db:
                        try:
                            completed = await service.complete_task(
                                db=db,
                                task_id=uuid.UUID(task_id),
                                agent_id=agent_id,
                                completion_status=status,
                                result=result,
                                org_id=org_id,
                            )
                            await websocket.send_json(
                                {
                                    "type": "task.completed",
                                    "task": completed.model_dump(),
                                }
                            )
                        except Exception as e:
                            await websocket.send_json(
                                {
                                    "type": "error",
                                    "message": str(e),
                                }
                            )

            elif data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        await logger.awarning("a2a_ws_error", agent_id=agent_id, error=str(e))
    finally:
        manager.disconnect(agent_id)


async def notify_agent(agent_id: str, task: Any) -> bool:
    """Push a task to an agent via WebSocket if connected."""
    return await manager.send_to_agent(
        agent_id,
        {
            "type": "task.assigned",
            "task": task.model_dump(),
        },
    )
