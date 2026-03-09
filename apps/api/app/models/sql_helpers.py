"""Cross-dialect SQL expression helpers."""

from __future__ import annotations


def ago(interval: str, dialect: str = "postgresql") -> str:
    """Return dialect-appropriate 'now minus interval' expression.

    Usage: ago("24 hours"), ago("60 days")
    """
    if dialect == "sqlite":
        return f"datetime('now', '-{interval}')"
    return f"NOW() - INTERVAL '{interval}'"


def json_extract(column: str, key: str, dialect: str = "postgresql") -> str:
    """Return dialect-appropriate JSON field access.

    Usage: json_extract("retrieval_context", "query")
    """
    if dialect == "sqlite":
        return f"json_extract({column}, '$.{key}')"
    return f"{column}->>'{key}'"


def now_expr(dialect: str = "postgresql") -> str:
    """Return dialect-appropriate current timestamp."""
    if dialect == "sqlite":
        return "datetime('now')"
    return "NOW()"


def json_set_fn(dialect: str = "postgresql") -> str:
    """Return dialect-appropriate JSON set function name."""
    if dialect == "sqlite":
        return "json_set"
    return "jsonb_set"
