"""OpenTelemetry-aware FastAPI middleware for request-level spans & metrics."""

from __future__ import annotations

import time
from typing import TYPE_CHECKING

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request  # noqa: TC002
from starlette.responses import Response  # noqa: TC002

from app.observability.config import otel_enabled

if TYPE_CHECKING:
    from collections.abc import Callable


class OTelRequestMiddleware(BaseHTTPMiddleware):
    """Record per-request latency histogram and enrich the current span.

    This supplements the auto-instrumented spans from
    ``opentelemetry-instrumentation-fastapi`` with OpenSpawn-specific
    attributes (org_id, agent_id) pulled from the request state that
    downstream auth middleware populates.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:  # type: ignore[type-arg]
        if not otel_enabled():
            return await call_next(request)

        from opentelemetry import trace

        from app.observability.metrics import api_request_duration_histogram

        start = time.perf_counter()
        span = trace.get_current_span()

        # Try to enrich with auth context (set by auth middleware)
        auth = getattr(request.state, "auth", None) if hasattr(request, "state") else None
        if auth is not None:
            if hasattr(auth, "org_id") and auth.org_id:
                span.set_attribute("openspawn.org_id", str(auth.org_id))
            if hasattr(auth, "id") and auth.id:
                span.set_attribute("openspawn.agent_id", str(auth.id))

        response: Response = await call_next(request)

        duration = time.perf_counter() - start
        histogram = api_request_duration_histogram()
        histogram.record(
            duration,
            attributes={
                "http.method": request.method,
                "http.route": request.url.path,
                "http.status_code": response.status_code,
            },
        )

        return response
