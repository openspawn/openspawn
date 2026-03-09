"""Tests for cross-dialect SQL helpers."""

from app.models.sql_helpers import ago, json_extract, json_set_fn, now_expr


def test_ago_postgres():
    result = ago("24 hours", dialect="postgresql")
    assert "INTERVAL" in result
    assert "24 hours" in result


def test_ago_sqlite():
    result = ago("24 hours", dialect="sqlite")
    assert "datetime" in result
    assert "-24 hours" in result


def test_ago_default_is_postgres():
    assert ago("1 day") == ago("1 day", dialect="postgresql")


def test_json_extract_postgres():
    result = json_extract("retrieval_context", "query", dialect="postgresql")
    assert "->>" in result


def test_json_extract_sqlite():
    result = json_extract("retrieval_context", "query", dialect="sqlite")
    assert "json_extract" in result
    assert "$.query" in result


def test_now_postgres():
    assert now_expr("postgresql") == "NOW()"


def test_now_sqlite():
    assert "datetime" in now_expr("sqlite")


def test_json_set_fn_postgres():
    assert json_set_fn("postgresql") == "jsonb_set"


def test_json_set_fn_sqlite():
    assert json_set_fn("sqlite") == "json_set"
