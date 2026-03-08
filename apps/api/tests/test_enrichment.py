"""Unit tests for enrichment worker jobs and configuration."""

from __future__ import annotations


class TestWorkerSettings:
    def test_functions_registered(self) -> None:
        from app.workers.enrichment import WorkerSettings

        assert len(WorkerSettings.functions) == 6

    def test_cron_jobs_registered(self) -> None:
        from app.workers.enrichment import WorkerSettings

        assert len(WorkerSettings.cron_jobs) == 6

    def test_functions_are_callable(self) -> None:
        from app.workers.enrichment import WorkerSettings

        for fn in WorkerSettings.functions:
            assert callable(fn)


class TestStaleThresholds:
    def test_confidence_threshold(self) -> None:
        from app.workers.enrichment import STALE_CONFIDENCE_THRESHOLD

        assert STALE_CONFIDENCE_THRESHOLD == 30

    def test_access_threshold(self) -> None:
        from app.workers.enrichment import STALE_ACCESS_THRESHOLD

        assert STALE_ACCESS_THRESHOLD == 3

    def test_age_days(self) -> None:
        from app.workers.enrichment import STALE_AGE_DAYS

        assert STALE_AGE_DAYS == 60


class TestRedisConfig:
    def test_redis_url_default(self) -> None:
        from app.config import settings

        assert settings.redis_url == "redis://localhost:6379"

    def test_get_redis_settings_returns_settings(self) -> None:
        from arq.connections import RedisSettings

        from app.workers.config import get_redis_settings

        result = get_redis_settings()
        assert isinstance(result, RedisSettings)


class TestTwoTierResilience:
    async def test_enqueue_enrichment_does_not_raise_on_failure(self) -> None:
        """_enqueue_enrichment swallows connection errors (best-effort)."""
        import uuid

        from app.memory.service import _enqueue_enrichment

        # Should not raise even when Redis is unavailable
        await _enqueue_enrichment(uuid.uuid4())
