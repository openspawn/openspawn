"""OTel configuration resolved from environment variables."""

from __future__ import annotations

import os


def otel_enabled() -> bool:
    """Return True when OpenTelemetry instrumentation is requested."""
    return os.getenv("OTEL_ENABLED", "").lower() in ("1", "true", "yes")


def otel_service_name() -> str:
    return os.getenv("OTEL_SERVICE_NAME", "openspawn-api")


def otel_exporter_type() -> str:
    """Return 'otlp' or 'console'."""
    return os.getenv("OTEL_EXPORTER_TYPE", "otlp")


def otel_otlp_endpoint() -> str:
    return os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317")
