"""High-level setup_telemetry() entry point."""

from __future__ import annotations

from typing import TYPE_CHECKING

import structlog

from app.observability.config import otel_enabled

if TYPE_CHECKING:
    from fastapi import FastAPI

logger = structlog.get_logger()


def setup_telemetry(app: FastAPI) -> None:
    """Wire OpenTelemetry into the FastAPI application.

    Complete no-op when ``OTEL_ENABLED`` is not truthy, ensuring zero
    performance impact for deployments that don't use OTel.
    """
    if not otel_enabled():
        logger.info("otel disabled (OTEL_ENABLED not set)")
        return

    # --- providers --------------------------------------------------------
    from app.observability.metrics import configure_meter_provider
    from app.observability.tracing import configure_tracer_provider

    configure_tracer_provider()
    configure_meter_provider()

    # --- auto-instrumentation ---------------------------------------------
    try:
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

        FastAPIInstrumentor.instrument_app(app)
    except ImportError:
        logger.warning("opentelemetry-instrumentation-fastapi not installed")

    try:
        from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor

        SQLAlchemyInstrumentor().instrument()
    except ImportError:
        logger.warning("opentelemetry-instrumentation-sqlalchemy not installed")

    try:
        from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor

        HTTPXClientInstrumentor().instrument()
    except ImportError:
        logger.warning("opentelemetry-instrumentation-httpx not installed")

    # --- custom middleware -------------------------------------------------
    from app.observability.middleware import OTelRequestMiddleware

    app.add_middleware(OTelRequestMiddleware)

    logger.info("otel enabled", service=app.title)
