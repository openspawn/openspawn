"""Verify observability setup is no-op without tokens."""

from app.observability import get_langfuse, setup_logfire


class TestObservabilityNoOp:
    def test_logfire_noop_without_token(self) -> None:
        """setup_logfire should not raise when LOGFIRE_TOKEN unset."""
        setup_logfire(object())

    def test_langfuse_returns_none_without_keys(self) -> None:
        assert get_langfuse() is None
