"""baseline stamp of existing schema

Revision ID: 0001
Revises:
Create Date: 2026-03-06

This is a baseline migration. It does NOT create or modify any tables.
The existing Postgres schema (created by TypeORM) is stamped as the starting
point for Alembic. All future schema changes go through Alembic migrations.

Usage:
    alembic stamp 0001  # Mark DB as at this revision without running SQL
"""

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
