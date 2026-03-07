"""arq worker configuration."""

from __future__ import annotations

from arq.connections import RedisSettings

from app.config import settings


def get_redis_settings() -> RedisSettings:
    """Parse REDIS_URL into arq RedisSettings."""
    return RedisSettings.from_dsn(settings.redis_url)
