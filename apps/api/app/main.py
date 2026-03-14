from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.agents.router import router as agents_router
from app.artifacts.router import router as artifacts_router
from app.config import settings
from app.coordination.rest import router as coordination_router
from app.credits.router import router as credits_router
from app.database import engine
from app.events.router import router as events_router
from app.events.sse_router import router as sse_router
from app.integrations.router import router as integrations_router
from app.logging import setup_logging
from app.memory.graph.router import router as graph_router
from app.memory.router import router as memory_router
from app.messages.router import router as messages_router
from app.observability import setup_logfire
from app.routers.auth import router as auth_router
from app.tasks.router import router as tasks_router

logger = structlog.stdlib.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    setup_logging(log_level=settings.log_level, log_format=settings.log_format)
    setup_logfire(app)
    await logger.ainfo("starting", app=settings.app_name)
    yield
    await engine.dispose()
    await logger.ainfo("shutdown", app=settings.app_name)


app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(agents_router)
app.include_router(tasks_router)
app.include_router(credits_router)
app.include_router(messages_router)
app.include_router(artifacts_router)
app.include_router(sse_router)  # before events_router so /stream matches before /{event_id}
app.include_router(events_router)
app.include_router(integrations_router)
app.include_router(memory_router)
app.include_router(graph_router)
app.include_router(coordination_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/db")
async def health_db() -> dict[str, str]:
    from sqlalchemy import text

    from app.database import async_session

    async with async_session() as session:
        await session.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}
