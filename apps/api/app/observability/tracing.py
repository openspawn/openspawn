"""Tracer provider setup and the ``@traced`` decorator."""

from __future__ import annotations

import functools
from collections.abc import Callable
from typing import Any, TypeVar

from app.observability.config import (
    otel_enabled,
    otel_exporter_type,
    otel_otlp_endpoint,
    otel_service_name,
)

# Re-export a thin wrapper so callers don't import OTel SDK directly.
_tracer_provider_configured = False

F = TypeVar("F", bound=Callable[..., Any])


def _get_tracer(name: str = "openspawn"):
    """Return the global tracer, or a no-op stub when OTel is off."""
    if not otel_enabled():
        return _NoOpTracer()

    from opentelemetry import trace

    return trace.get_tracer(name)


def configure_tracer_provider() -> None:
    """Create and register the global TracerProvider.  Idempotent."""
    global _tracer_provider_configured
    if _tracer_provider_configured or not otel_enabled():
        return

    from opentelemetry import trace
    from opentelemetry.sdk.resources import Resource
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor

    resource = Resource.create({"service.name": otel_service_name()})
    provider = TracerProvider(resource=resource)

    exporter_type = otel_exporter_type()
    if exporter_type == "console":
        from opentelemetry.sdk.trace.export import ConsoleSpanExporter

        provider.add_span_processor(BatchSpanProcessor(ConsoleSpanExporter()))
    else:
        from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import (
            OTLPSpanExporter,
        )

        provider.add_span_processor(
            BatchSpanProcessor(OTLPSpanExporter(endpoint=otel_otlp_endpoint()))
        )

    trace.set_tracer_provider(provider)
    _tracer_provider_configured = True


def reset_tracer_provider() -> None:
    """Reset global state — useful for tests."""
    global _tracer_provider_configured
    _tracer_provider_configured = False


# ---------------------------------------------------------------------------
# @traced decorator
# ---------------------------------------------------------------------------


def traced(span_name: str) -> Callable[[F], F]:
    """Decorator that wraps an async function in an OTel span.

    When OTel is disabled the wrapper is essentially free — it calls the
    original function directly with no SDK overhead.

    Span attributes ``openspawn.org_id`` and ``openspawn.agent_id`` are
    extracted opportunistically from common keyword arguments (``auth``).
    """

    def decorator(fn: F) -> F:
        @functools.wraps(fn)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            if not otel_enabled():
                return await fn(*args, **kwargs)

            from opentelemetry import trace
            from opentelemetry.trace import StatusCode

            tracer = trace.get_tracer("openspawn")
            with tracer.start_as_current_span(span_name) as span:
                # Extract common attributes from auth context
                auth = kwargs.get("auth")
                if auth is not None:
                    if hasattr(auth, "org_id") and auth.org_id:
                        span.set_attribute("openspawn.org_id", str(auth.org_id))
                    if hasattr(auth, "id") and auth.id:
                        span.set_attribute("openspawn.agent_id", str(auth.id))

                # Extract task_id if present
                task_id = kwargs.get("task_id")
                if task_id is not None:
                    span.set_attribute("openspawn.task_id", str(task_id))

                try:
                    result = await fn(*args, **kwargs)
                    span.set_status(StatusCode.OK)
                    return result
                except Exception as exc:
                    span.set_status(StatusCode.ERROR, str(exc))
                    span.record_exception(exc)
                    raise

        return wrapper  # type: ignore[return-value]

    return decorator


# ---------------------------------------------------------------------------
# No-op stub for when OTel is disabled
# ---------------------------------------------------------------------------


class _NoOpSpan:
    """Minimal stand-in for opentelemetry.trace.Span."""

    def set_attribute(self, key: str, value: Any) -> None:
        pass

    def set_status(self, *args: Any, **kwargs: Any) -> None:
        pass

    def record_exception(self, exc: BaseException) -> None:
        pass

    def __enter__(self) -> _NoOpSpan:
        return self

    def __exit__(self, *args: Any) -> None:
        pass


class _NoOpTracer:
    """Minimal stand-in for opentelemetry.trace.Tracer."""

    def start_as_current_span(self, name: str, **kwargs: Any) -> _NoOpSpan:
        return _NoOpSpan()
