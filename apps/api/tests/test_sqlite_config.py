"""Tests for SQLite backend configuration."""

import os
from importlib import reload
from unittest.mock import patch


def test_sqlite_url_not_rewritten():
    """SQLite URLs should not be rewritten to asyncpg."""
    with patch.dict(os.environ, {"DATABASE_URL": "sqlite+aiosqlite:///test.db"}, clear=False):
        import app.config as cfg

        reload(cfg)
        assert "asyncpg" not in cfg.settings.database_url
        assert "sqlite" in cfg.settings.database_url


def test_is_sqlite_true_for_sqlite():
    """is_sqlite should be True for SQLite URLs."""
    with patch.dict(os.environ, {"DATABASE_URL": "sqlite+aiosqlite:///test.db"}, clear=False):
        import app.config as cfg

        reload(cfg)
        assert cfg.settings.is_sqlite is True


def test_is_sqlite_false_for_postgres():
    """is_sqlite should be False for PostgreSQL URLs."""
    with patch.dict(os.environ, {"DATABASE_URL": "postgresql://localhost/test"}, clear=False):
        import app.config as cfg

        reload(cfg)
        assert cfg.settings.is_sqlite is False
