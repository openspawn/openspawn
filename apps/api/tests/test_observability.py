"""Tests for the OpenTelemetry observability module.

Coverage:
- setup_telemetry is a no-op when OTEL_ENABLED is not set
- setup_telemetry configures providers when OTEL_ENABLED=true
- @traced decorator creates spans and records exceptions
- Metric helpers return no-op instruments when disabled
- Metric helpers return real instruments when enabled
- Span helpers return no-op context managers when disabled
- Span helpers create real spans when enabled
"""

from __future__ import annotations

import os
from unittest.mock import MagicMock, patch

import pytest

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _with_otel_env(enabled: bool = True, exporter: str = "console"):
    """Return a dict suitable for ``patch.dict(os.environ, ...)``."""
    env = {
        "OTEL_ENABLED": "true" if enabled else "",
        "OTEL_EXPORTER_TYPE": exporter,
        "OTEL_SERVICE_NAME": "openspawn-api-test",
    }
    return env


# ---------------------------------------------------------------------------
# setup_telemetry — disabled (no-op)
# ---------------------------------------------------------------------------


class TestSetupTelemetryDisabled:
    def test_noop_when_disabled(self):
        """setup_telemetry should do nothing when OTEL_ENABLED is not set."""
        with patch.dict(os.environ, {"OTEL_ENABLED": ""}, clear=False):
            from app.observability.setup import setup_telemetry

            app = MagicMock()
            # Should not raise or call any SDK functions
            setup_telemetry(app)
            # Middleware should NOT be added
            app.add_middleware.assert_not_called()


# ---------------------------------------------------------------------------
# setup_telemetry — enabled (console exporter so no network)
# ---------------------------------------------------------------------------


class TestSetupTelemetryEnabled:
    def test_configures_providers(self):
        """When enabled, setup_telemetry should configure tracer + meter providers."""
        with patch.dict(os.environ, _with_otel_env(enabled=True, exporter="console"), clear=False):
            from app.observability.metrics import reset_meter_provider
            from app.observability.tracing import reset_tracer_provider

            reset_tracer_provider()
            reset_meter_provider()

            from app.observability.setup import setup_telemetry

            app = MagicMock()
            app.title = "test"
            setup_telemetry(app)

            # FastAPI middleware should be added
            app.add_middleware.assert_called_once()

    def test_idempotent(self):
        """Calling setup_telemetry twice should not fail."""
        with patch.dict(os.environ, _with_otel_env(enabled=True, exporter="console"), clear=False):
            from app.observability.metrics import reset_meter_provider
            from app.observability.tracing import reset_tracer_provider

            reset_tracer_provider()
            reset_meter_provider()

            from app.observability.setup import setup_telemetry

            app = MagicMock()
            app.title = "test"
            setup_telemetry(app)
            setup_telemetry(app)  # second call — should not raise


# ---------------------------------------------------------------------------
# @traced decorator
# ---------------------------------------------------------------------------


class TestTracedDecorator:
    @pytest.mark.asyncio
    async def test_noop_when_disabled(self):
        """@traced should passthrough when OTel is off."""
        with patch.dict(os.environ, {"OTEL_ENABLED": ""}, clear=False):
            from app.observability.tracing import traced

            @traced("test.op")
            async def my_func(x: int) -> int:
                return x * 2

            result = await my_func(5)
            assert result == 10

    @pytest.mark.asyncio
    async def test_creates_span_when_enabled(self):
        """@traced should create a span when OTel is on."""
        with patch.dict(os.environ, _with_otel_env(enabled=True, exporter="console"), clear=False):
            from app.observability.tracing import (
                configure_tracer_provider,
                reset_tracer_provider,
                traced,
            )

            reset_tracer_provider()
            configure_tracer_provider()

            @traced("test.op")
            async def my_func(x: int) -> int:
                return x * 2

            result = await my_func(5)
            assert result == 10

    @pytest.mark.asyncio
    async def test_records_exception(self):
        """@traced should record exceptions and re-raise them."""
        with patch.dict(os.environ, _with_otel_env(enabled=True, exporter="console"), clear=False):
            from app.observability.tracing import (
                configure_tracer_provider,
                reset_tracer_provider,
                traced,
            )

            reset_tracer_provider()
            configure_tracer_provider()

            @traced("test.fail")
            async def failing_func() -> None:
                raise ValueError("boom")

            with pytest.raises(ValueError, match="boom"):
                await failing_func()

    @pytest.mark.asyncio
    async def test_extracts_auth_attributes(self):
        """@traced should extract org_id/agent_id from auth kwarg."""
        with patch.dict(os.environ, _with_otel_env(enabled=True, exporter="console"), clear=False):
            from app.observability.tracing import (
                configure_tracer_provider,
                reset_tracer_provider,
                traced,
            )

            reset_tracer_provider()
            configure_tracer_provider()

            class FakeAuth:
                org_id = "org-123"
                id = "agent-456"

            @traced("test.auth")
            async def authed_func(auth=None) -> str:
                return "ok"

            result = await authed_func(auth=FakeAuth())
            assert result == "ok"


# ---------------------------------------------------------------------------
# Metrics — disabled
# ---------------------------------------------------------------------------


class TestMetricsDisabled:
    def test_counters_noop(self):
        """Counters should return no-op instruments when disabled."""
        with patch.dict(os.environ, {"OTEL_ENABLED": ""}, clear=False):
            from app.observability.metrics import (
                auth_token_failed_counter,
                auth_token_issued_counter,
                memory_stored_counter,
                tasks_completed_counter,
                tasks_created_counter,
                tasks_escalated_counter,
            )

            # These should not raise
            tasks_created_counter().add(1)
            tasks_completed_counter().add(1)
            tasks_escalated_counter().add(1)
            memory_stored_counter().add(1)
            auth_token_issued_counter().add(1)
            auth_token_failed_counter().add(1)

    def test_histograms_noop(self):
        """Histograms should return no-op instruments when disabled."""
        with patch.dict(os.environ, {"OTEL_ENABLED": ""}, clear=False):
            from app.observability.metrics import (
                api_request_duration_histogram,
                memory_search_duration_histogram,
                task_duration_histogram,
            )

            task_duration_histogram().record(1.5)
            api_request_duration_histogram().record(0.05)
            memory_search_duration_histogram().record(0.3)


# ---------------------------------------------------------------------------
# Metrics — enabled
# ---------------------------------------------------------------------------


class TestMetricsEnabled:
    def test_counters_real(self):
        """Counters should create real OTel instruments when enabled."""
        with patch.dict(os.environ, _with_otel_env(enabled=True, exporter="console"), clear=False):
            from app.observability.metrics import (
                configure_meter_provider,
                reset_meter_provider,
                tasks_created_counter,
            )

            reset_meter_provider()
            configure_meter_provider()

            counter = tasks_created_counter()
            # Should have an 'add' method from the real SDK
            assert hasattr(counter, "add")
            counter.add(1, {"agent": "test"})

    def test_histograms_real(self):
        """Histograms should create real OTel instruments when enabled."""
        with patch.dict(os.environ, _with_otel_env(enabled=True, exporter="console"), clear=False):
            from app.observability.metrics import (
                api_request_duration_histogram,
                configure_meter_provider,
                reset_meter_provider,
            )

            reset_meter_provider()
            configure_meter_provider()

            histogram = api_request_duration_histogram()
            assert hasattr(histogram, "record")
            histogram.record(0.123, {"http.method": "GET"})


# ---------------------------------------------------------------------------
# Span helpers — disabled
# ---------------------------------------------------------------------------


class TestSpansDisabled:
    def test_all_span_helpers_noop(self):
        """All span helpers should return no-op context managers when disabled."""
        with patch.dict(os.environ, {"OTEL_ENABLED": ""}, clear=False):
            from app.observability.spans import (
                agent_authenticate_span,
                agent_register_span,
                coordination_emit_span,
                memory_search_span,
                memory_store_span,
                task_assign_span,
                task_complete_span,
                task_create_span,
                task_escalate_span,
                task_transition_span,
            )

            # None of these should raise
            with task_create_span(org_id="o", agent_id="a"):
                pass
            with task_transition_span(org_id="o", task_id="t", new_status="done"):
                pass
            with task_assign_span(org_id="o", task_id="t"):
                pass
            with task_complete_span(org_id="o", task_id="t"):
                pass
            with task_escalate_span(org_id="o", task_id="t"):
                pass
            with agent_register_span(org_id="o"):
                pass
            with agent_authenticate_span(agent_id="a"):
                pass
            with memory_store_span(org_id="o", agent_id="a"):
                pass
            with memory_search_span(org_id="o"):
                pass
            with coordination_emit_span(org_id="o", event_type="test"):
                pass


# ---------------------------------------------------------------------------
# Span helpers — enabled
# ---------------------------------------------------------------------------


class TestSpansEnabled:
    def test_span_helpers_create_spans(self):
        """When enabled, span helpers should create real spans."""
        with patch.dict(os.environ, _with_otel_env(enabled=True, exporter="console"), clear=False):
            from app.observability.spans import task_create_span
            from app.observability.tracing import configure_tracer_provider, reset_tracer_provider

            reset_tracer_provider()
            configure_tracer_provider()

            with task_create_span(org_id="org-1", agent_id="agent-1") as span:
                span.set_attribute("openspawn.extra", "value")
                # Should not raise

    def test_span_records_exception(self):
        """Spans should record exceptions when code inside raises."""
        with patch.dict(os.environ, _with_otel_env(enabled=True, exporter="console"), clear=False):
            from app.observability.spans import task_create_span
            from app.observability.tracing import configure_tracer_provider, reset_tracer_provider

            reset_tracer_provider()
            configure_tracer_provider()

            with pytest.raises(RuntimeError, match="test error"), task_create_span(org_id="org-1"):
                raise RuntimeError("test error")


# ---------------------------------------------------------------------------
# Config helpers
# ---------------------------------------------------------------------------


class TestConfig:
    def test_otel_enabled_false_by_default(self):
        with patch.dict(os.environ, {"OTEL_ENABLED": ""}, clear=False):
            from app.observability.config import otel_enabled

            assert otel_enabled() is False

    def test_otel_enabled_true(self):
        with patch.dict(os.environ, {"OTEL_ENABLED": "true"}, clear=False):
            from app.observability.config import otel_enabled

            assert otel_enabled() is True

    def test_otel_enabled_accepts_1(self):
        with patch.dict(os.environ, {"OTEL_ENABLED": "1"}, clear=False):
            from app.observability.config import otel_enabled

            assert otel_enabled() is True

    def test_service_name_default(self):
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop("OTEL_SERVICE_NAME", None)
            from app.observability.config import otel_service_name

            assert otel_service_name() == "openspawn-api"

    def test_service_name_override(self):
        with patch.dict(os.environ, {"OTEL_SERVICE_NAME": "custom"}, clear=False):
            from app.observability.config import otel_service_name

            assert otel_service_name() == "custom"
