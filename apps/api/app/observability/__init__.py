"""Observability module — OpenTelemetry + Logfire + Langfuse.

Public API:
    setup_telemetry(app)  — wire OTel into a FastAPI app (no-op when disabled)
    setup_logfire(app)     — legacy logfire setup (kept for backward compat)
    get_langfuse()         — Langfuse client factory
"""

from __future__ import annotations

from app.observability._logfire import get_langfuse, setup_logfire
from app.observability.setup import setup_telemetry

__all__ = [
    "get_langfuse",
    "setup_logfire",
    "setup_telemetry",
]
