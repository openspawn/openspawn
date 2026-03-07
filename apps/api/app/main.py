from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine
from app.logging import setup_logging

logger = structlog.stdlib.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    setup_logging(log_level=settings.log_level, log_format=settings.log_format)
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
