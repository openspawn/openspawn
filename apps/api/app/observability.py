"""Optional observability setup — no-op when tokens not configured."""

from __future__ import annotations

import os
from typing import TYPE_CHECKING

import structlog

if TYPE_CHECKING:
    from langfuse import Langfuse

logger = structlog.get_logger()


def setup_logfire(app: object) -> None:
    """Instrument FastAPI with logfire if LOGFIRE_TOKEN is set."""
    if not os.getenv("LOGFIRE_TOKEN"):
        logger.info("logfire disabled (no LOGFIRE_TOKEN)")
        return
    import logfire

    logfire.configure()
    logfire.instrument_fastapi(app)  # type: ignore[arg-type]
    logfire.instrument_sqlalchemy()
    logfire.instrument_httpx()
    logger.info("logfire enabled")


def get_langfuse() -> Langfuse | None:
    """Return Langfuse client if keys configured, else None."""
    pub = os.getenv("LANGFUSE_PUBLIC_KEY")
    sec = os.getenv("LANGFUSE_SECRET_KEY")
    if not pub or not sec:
        return None
    from langfuse import Langfuse

    client = Langfuse(public_key=pub, secret_key=sec)
    logger.info("langfuse enabled")
    return client
