from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.config import settings

if settings.is_sqlite:
    engine = create_async_engine(
        settings.database_url,
        echo=settings.debug,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_async_engine(
        settings.database_url,
        pool_size=settings.database_pool_size,
        max_overflow=settings.database_pool_max_overflow,
        echo=settings.debug,
    )

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession]:
    async with async_session() as session:
        yield session


async def create_tables() -> None:
    """Create all tables from SQLAlchemy metadata (used for SQLite/local mode)."""
    import app.models.artifact  # noqa: F401 — register Artifact tables
    from app.models.base import Base

    if settings.is_sqlite:
        _strip_pg_computed_columns(Base)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


def _strip_pg_computed_columns(base: type) -> None:
    """Remove Computed expressions that use PG-only functions (e.g. to_tsvector)."""
    for table in base.metadata.tables.values():
        for col in table.columns:
            if col.computed is not None:
                col.computed = None  # type: ignore[assignment]
                col.server_default = None
