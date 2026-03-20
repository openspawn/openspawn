"""In-memory projection cache with event-count-based invalidation."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass
class CachedProjection:
    data: dict
    computed_at: datetime
    event_count: int  # number of events at computation time


class ProjectionCache:
    """In-memory projection cache with event-count invalidation.

    The cache key is ``{task_id}:{projection_type}``.  A cached entry is
    considered valid only when the caller-supplied *current_event_count*
    matches the count stored at cache-write time.  Any new event for a
    task bumps the count, so stale entries are never returned.

    Explicit :meth:`invalidate` is also provided for use after event
    emission so that concurrent readers don't race against the DB count.
    """

    def __init__(self) -> None:
        self._cache: dict[str, CachedProjection] = {}

    def _key(self, task_id: str, projection_type: str) -> str:
        return f"{task_id}:{projection_type}"

    def get(self, task_id: str, projection_type: str, current_event_count: int) -> dict | None:
        """Return cached projection if event count hasn't changed."""
        cached = self._cache.get(self._key(task_id, projection_type))
        if cached and cached.event_count == current_event_count:
            return cached.data
        return None

    def set(
        self,
        task_id: str,
        projection_type: str,
        data: dict,
        event_count: int,
    ) -> None:
        self._cache[self._key(task_id, projection_type)] = CachedProjection(
            data=data,
            computed_at=datetime.utcnow(),
            event_count=event_count,
        )

    def invalidate(self, task_id: str) -> None:
        """Invalidate all projections for a task."""
        prefix = f"{task_id}:"
        keys_to_delete = [k for k in self._cache if k.startswith(prefix)]
        for k in keys_to_delete:
            del self._cache[k]

    def clear(self) -> None:
        """Drop all cached entries (useful for testing)."""
        self._cache.clear()


# Singleton used across the application.
projection_cache = ProjectionCache()
