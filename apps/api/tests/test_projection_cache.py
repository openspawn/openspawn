"""Tests for the projection cache layer."""

from __future__ import annotations

import pytest

from app.coordination.cache import ProjectionCache


@pytest.fixture
def cache() -> ProjectionCache:
    return ProjectionCache()


TASK_A = "aaaa-aaaa"
TASK_B = "bbbb-bbbb"


class TestProjectionCache:
    """Unit tests for ProjectionCache."""

    def test_cache_miss_returns_none(self, cache: ProjectionCache) -> None:
        assert cache.get(TASK_A, "component_registry", 5) is None

    def test_cache_hit_returns_data(self, cache: ProjectionCache) -> None:
        data = {"components": {}, "count": 0}
        cache.set(TASK_A, "component_registry", data, event_count=5)
        assert cache.get(TASK_A, "component_registry", 5) == data

    def test_stale_event_count_returns_none(self, cache: ProjectionCache) -> None:
        data = {"components": {}, "count": 0}
        cache.set(TASK_A, "component_registry", data, event_count=5)
        # Event count changed → cache miss
        assert cache.get(TASK_A, "component_registry", 6) is None

    def test_invalidate_removes_all_projections_for_task(self, cache: ProjectionCache) -> None:
        cache.set(TASK_A, "component_registry", {"a": 1}, event_count=3)
        cache.set(TASK_A, "test_coverage", {"b": 2}, event_count=3)
        cache.invalidate(TASK_A)
        assert cache.get(TASK_A, "component_registry", 3) is None
        assert cache.get(TASK_A, "test_coverage", 3) is None

    def test_different_task_ids_are_independent(self, cache: ProjectionCache) -> None:
        cache.set(TASK_A, "component_registry", {"a": 1}, event_count=3)
        cache.set(TASK_B, "component_registry", {"b": 2}, event_count=5)
        # Invalidate A, B should remain
        cache.invalidate(TASK_A)
        assert cache.get(TASK_A, "component_registry", 3) is None
        assert cache.get(TASK_B, "component_registry", 5) == {"b": 2}

    def test_different_projection_types_are_independent(self, cache: ProjectionCache) -> None:
        cache.set(TASK_A, "component_registry", {"cr": 1}, event_count=3)
        cache.set(TASK_A, "test_coverage", {"tc": 2}, event_count=3)
        assert cache.get(TASK_A, "component_registry", 3) == {"cr": 1}
        assert cache.get(TASK_A, "test_coverage", 3) == {"tc": 2}

    def test_set_overwrites_previous_entry(self, cache: ProjectionCache) -> None:
        cache.set(TASK_A, "component_registry", {"v": 1}, event_count=1)
        cache.set(TASK_A, "component_registry", {"v": 2}, event_count=2)
        assert cache.get(TASK_A, "component_registry", 1) is None
        assert cache.get(TASK_A, "component_registry", 2) == {"v": 2}

    def test_clear_drops_everything(self, cache: ProjectionCache) -> None:
        cache.set(TASK_A, "component_registry", {"a": 1}, event_count=1)
        cache.set(TASK_B, "test_coverage", {"b": 2}, event_count=2)
        cache.clear()
        assert cache.get(TASK_A, "component_registry", 1) is None
        assert cache.get(TASK_B, "test_coverage", 2) is None

    def test_cached_projection_stores_metadata(self, cache: ProjectionCache) -> None:
        cache.set(TASK_A, "component_registry", {"x": 1}, event_count=7)
        key = cache._key(TASK_A, "component_registry")
        entry = cache._cache[key]
        assert entry.event_count == 7
        assert entry.computed_at is not None
        assert entry.data == {"x": 1}
