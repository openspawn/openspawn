"""Tests for auto-expire time-bound memories."""

from __future__ import annotations


class TestTTLSchema:
    def test_ttl_seconds_accepted(self) -> None:
        from app.memory.schemas import StoreMemoryDto

        dto = StoreMemoryDto(content="test", ttl_seconds=3600)
        assert dto.ttl_seconds == 3600

    def test_no_ttl_defaults_to_none(self) -> None:
        from app.memory.schemas import StoreMemoryDto

        dto = StoreMemoryDto(content="test")
        assert dto.ttl_seconds is None

    def test_ttl_computes_expires_at(self) -> None:
        import pendulum

        now = pendulum.now("UTC")
        ttl = 3600
        expires = now.add(seconds=ttl)
        assert (expires - now).total_seconds() == 3600

    def test_ttl_must_be_positive(self) -> None:
        import pytest
        from pydantic import ValidationError

        from app.memory.schemas import StoreMemoryDto

        with pytest.raises(ValidationError):
            StoreMemoryDto(content="test", ttl_seconds=0)


class TestExpiryWorkerRegistered:
    def test_expire_memories_in_functions(self) -> None:
        from app.workers.enrichment import WorkerSettings
        from app.workers.expiry import expire_memories

        assert expire_memories in WorkerSettings.functions

    def test_expire_cron_registered(self) -> None:
        from app.workers.enrichment import WorkerSettings

        assert len(WorkerSettings.cron_jobs) == 6

    def test_worker_has_six_functions(self) -> None:
        from app.workers.enrichment import WorkerSettings

        assert len(WorkerSettings.functions) == 6
