"""Pre-defined span helpers for OpenSpawn domain operations.

These functions create explicit spans for key business operations,
complementing the auto-instrumented HTTP-level spans from FastAPI.
Each function is safe to call regardless of whether OTel is enabled.
"""

from __future__ import annotations

from typing import Any

from app.observability.config import otel_enabled


def _get_span_context(name: str, attributes: dict[str, Any] | None = None):
    """Start a span and return it as a context manager."""
    if not otel_enabled():
        return _NoOpContextManager()

    from opentelemetry import trace

    tracer = trace.get_tracer("openspawn")
    span = tracer.start_span(name)
    if attributes:
        for k, v in attributes.items():
            if v is not None:
                span.set_attribute(k, str(v))
    return _SpanContextManager(span)


class _SpanContextManager:
    """Wraps a span as a context manager that ends it on exit."""

    def __init__(self, span: Any) -> None:
        self._span = span

    def set_attribute(self, key: str, value: Any) -> None:
        if value is not None:
            self._span.set_attribute(key, str(value))

    def __enter__(self) -> _SpanContextManager:
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        if exc_val is not None:
            from opentelemetry.trace import StatusCode

            self._span.set_status(StatusCode.ERROR, str(exc_val))
            self._span.record_exception(exc_val)
        else:
            from opentelemetry.trace import StatusCode

            self._span.set_status(StatusCode.OK)
        self._span.end()


class _NoOpContextManager:
    def set_attribute(self, key: str, value: Any) -> None:
        pass

    def __enter__(self) -> _NoOpContextManager:
        return self

    def __exit__(self, *args: Any) -> None:
        pass


# ---------------------------------------------------------------------------
# Domain-specific span starters
# ---------------------------------------------------------------------------


def task_create_span(*, org_id: Any = None, agent_id: Any = None) -> Any:
    return _get_span_context(
        "task.create",
        {"openspawn.org_id": org_id, "openspawn.agent_id": agent_id},
    )


def task_transition_span(
    *, org_id: Any = None, agent_id: Any = None, task_id: Any = None, new_status: str | None = None
) -> Any:
    return _get_span_context(
        "task.transition",
        {
            "openspawn.org_id": org_id,
            "openspawn.agent_id": agent_id,
            "openspawn.task_id": task_id,
            "openspawn.task_status": new_status,
        },
    )


def task_assign_span(*, org_id: Any = None, agent_id: Any = None, task_id: Any = None) -> Any:
    return _get_span_context(
        "task.assign",
        {
            "openspawn.org_id": org_id,
            "openspawn.agent_id": agent_id,
            "openspawn.task_id": task_id,
        },
    )


def task_complete_span(*, org_id: Any = None, agent_id: Any = None, task_id: Any = None) -> Any:
    return _get_span_context(
        "task.complete",
        {
            "openspawn.org_id": org_id,
            "openspawn.agent_id": agent_id,
            "openspawn.task_id": task_id,
        },
    )


def task_escalate_span(*, org_id: Any = None, agent_id: Any = None, task_id: Any = None) -> Any:
    return _get_span_context(
        "task.escalate",
        {
            "openspawn.org_id": org_id,
            "openspawn.agent_id": agent_id,
            "openspawn.task_id": task_id,
        },
    )


def agent_register_span(*, org_id: Any = None) -> Any:
    return _get_span_context("agent.register", {"openspawn.org_id": org_id})


def agent_authenticate_span(*, agent_id: Any = None) -> Any:
    return _get_span_context("agent.authenticate", {"openspawn.agent_id": agent_id})


def memory_store_span(
    *, org_id: Any = None, agent_id: Any = None, memory_type: str | None = None
) -> Any:
    return _get_span_context(
        "memory.store",
        {
            "openspawn.org_id": org_id,
            "openspawn.agent_id": agent_id,
            "openspawn.memory_type": memory_type,
        },
    )


def memory_search_span(*, org_id: Any = None, agent_id: Any = None) -> Any:
    return _get_span_context(
        "memory.search",
        {"openspawn.org_id": org_id, "openspawn.agent_id": agent_id},
    )


def coordination_emit_span(
    *, org_id: Any = None, agent_id: Any = None, event_type: str | None = None
) -> Any:
    return _get_span_context(
        "coordination.emit",
        {
            "openspawn.org_id": org_id,
            "openspawn.agent_id": agent_id,
            "openspawn.event_type": event_type,
        },
    )
