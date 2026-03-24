"""OpenTelemetry metrics — counters and histograms for OpenSpawn operations."""

from __future__ import annotations

from typing import Any

from app.observability.config import (
    otel_enabled,
    otel_exporter_type,
    otel_otlp_endpoint,
    otel_service_name,
)

# ---------------------------------------------------------------------------
# Module-level singletons — created lazily on first call to get_meter()
# ---------------------------------------------------------------------------

_meter_provider_configured = False


def configure_meter_provider() -> None:
    """Create and register the global MeterProvider.  Idempotent."""
    global _meter_provider_configured
    if _meter_provider_configured or not otel_enabled():
        return

    from opentelemetry import metrics
    from opentelemetry.sdk.metrics import MeterProvider
    from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
    from opentelemetry.sdk.resources import Resource

    resource = Resource.create({"service.name": otel_service_name()})

    exporter_type = otel_exporter_type()
    if exporter_type == "console":
        from opentelemetry.sdk.metrics.export import ConsoleMetricExporter

        reader = PeriodicExportingMetricReader(ConsoleMetricExporter(), export_interval_millis=5000)
    else:
        from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import (
            OTLPMetricExporter,
        )

        reader = PeriodicExportingMetricReader(
            OTLPMetricExporter(endpoint=otel_otlp_endpoint()),
            export_interval_millis=10_000,
        )

    provider = MeterProvider(resource=resource, metric_readers=[reader])
    metrics.set_meter_provider(provider)
    _meter_provider_configured = True


def reset_meter_provider() -> None:
    """Reset global state — useful for tests."""
    global _meter_provider_configured
    _meter_provider_configured = False


def get_meter(name: str = "openspawn"):
    """Return a Meter, or a no-op stub when OTel is disabled."""
    if not otel_enabled():
        return _NoOpMeter()

    from opentelemetry import metrics

    return metrics.get_meter(name)


# ---------------------------------------------------------------------------
# Named metric accessors — thin wrappers that always return an instrument
# ---------------------------------------------------------------------------


def _counter(name: str, description: str = "", unit: str = "1"):
    return get_meter().create_counter(name, description=description, unit=unit)


def _histogram(name: str, description: str = "", unit: str = "s"):
    return get_meter().create_histogram(name, description=description, unit=unit)


# -- Counters --


def tasks_created_counter():
    return _counter("openspawn.tasks.created", "Tasks created")


def tasks_completed_counter():
    return _counter("openspawn.tasks.completed", "Tasks completed")


def tasks_escalated_counter():
    return _counter("openspawn.tasks.escalated", "Tasks escalated")


def memory_stored_counter():
    return _counter("openspawn.memory.stored", "Memories stored")


def auth_token_issued_counter():
    return _counter("openspawn.auth.token_issued", "JWT tokens issued")


def auth_token_failed_counter():
    return _counter("openspawn.auth.token_failed", "Auth failures")


# -- Histograms --


def task_duration_histogram():
    return _histogram("openspawn.task.duration_seconds", "Task lifecycle duration")


def api_request_duration_histogram():
    return _histogram("openspawn.api.request_duration_seconds", "API request latency")


def memory_search_duration_histogram():
    return _histogram("openspawn.memory.search_duration_seconds", "Memory search latency")


# ---------------------------------------------------------------------------
# No-op stubs
# ---------------------------------------------------------------------------


class _NoOpInstrument:
    """Stands in for Counter / Histogram when OTel is disabled."""

    def add(self, amount: float = 1, attributes: dict[str, Any] | None = None) -> None:
        pass

    def record(self, amount: float, attributes: dict[str, Any] | None = None) -> None:
        pass


class _NoOpMeter:
    """Stands in for opentelemetry.metrics.Meter."""

    def create_counter(self, name: str, **kwargs: Any) -> _NoOpInstrument:
        return _NoOpInstrument()

    def create_histogram(self, name: str, **kwargs: Any) -> _NoOpInstrument:
        return _NoOpInstrument()

    def create_up_down_counter(self, name: str, **kwargs: Any) -> _NoOpInstrument:
        return _NoOpInstrument()
