"""Cross-dialect type helpers for SQLite + PostgreSQL."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import JSON, Text, TypeDecorator

if TYPE_CHECKING:
    from sqlalchemy.types import TypeEngine

try:
    from pgvector.sqlalchemy import Vector as PGVector
except ImportError:
    PGVector = None

try:
    from sqlalchemy.dialects.postgresql import ARRAY as PG_ARRAY
except ImportError:
    PG_ARRAY = None

try:
    from sqlalchemy.dialects.postgresql import JSONB as PG_JSONB
except ImportError:
    PG_JSONB = None


class CompatJSONB(TypeDecorator[dict]):
    """JSONB on Postgres, plain JSON on SQLite."""

    impl = JSON
    cache_ok = True

    def load_dialect_impl(self, dialect: object) -> TypeEngine[dict]:
        if dialect.name == "postgresql" and PG_JSONB:  # type: ignore[union-attr]
            return dialect.type_descriptor(PG_JSONB())  # type: ignore[union-attr]
        return dialect.type_descriptor(JSON())  # type: ignore[union-attr]


class CompatVector(TypeDecorator[list[float]]):
    """Vector column: pgvector on Postgres, JSON on SQLite."""

    impl = JSON
    cache_ok = True

    def __init__(self, dimensions: int = 1024):
        super().__init__()
        self.dimensions = dimensions

    def load_dialect_impl(self, dialect: object) -> TypeEngine[list[float]]:
        if dialect.name == "postgresql" and PGVector:  # type: ignore[union-attr]
            return dialect.type_descriptor(PGVector(self.dimensions))  # type: ignore[union-attr]
        return dialect.type_descriptor(JSON())  # type: ignore[union-attr]


class CompatArray(TypeDecorator[list[object]]):
    """Array column: ARRAY(inner) on Postgres, JSON on SQLite."""

    impl = JSON
    cache_ok = True

    def __init__(self, inner: TypeEngine[object] | None = None):
        super().__init__()
        self._inner = inner or Text()

    def load_dialect_impl(self, dialect: object) -> TypeEngine[list[object]]:
        if dialect.name == "postgresql" and PG_ARRAY:  # type: ignore[union-attr]
            return dialect.type_descriptor(PG_ARRAY(self._inner))  # type: ignore[union-attr]
        return dialect.type_descriptor(JSON())  # type: ignore[union-attr]


class CompatTSVector(TypeDecorator[str]):
    """TSVector on Postgres, Text on SQLite (FTS5 handled separately)."""

    impl = Text
    cache_ok = True

    def load_dialect_impl(self, dialect: object) -> TypeEngine[str]:
        if dialect.name == "postgresql":  # type: ignore[union-attr]
            from sqlalchemy.dialects.postgresql import TSVECTOR

            return dialect.type_descriptor(TSVECTOR())  # type: ignore[union-attr]
        return dialect.type_descriptor(Text())  # type: ignore[union-attr]
