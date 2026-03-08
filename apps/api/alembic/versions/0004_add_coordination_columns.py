"""add coordination columns to tasks table

Revision ID: 0004
Revises: 0003
Create Date: 2026-03-08
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "tasks",
        sa.Column(
            "required_capabilities",
            postgresql.JSONB,
            nullable=False,
            server_default="[]",
        ),
    )
    op.add_column(
        "tasks",
        sa.Column("sla_warning_sent_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "tasks",
        sa.Column("needs_attention", sa.Boolean, nullable=False, server_default="false"),
    )
    op.create_index(
        "ix_tasks_status_due_date",
        "tasks",
        ["status", "due_date"],
        postgresql_where=sa.text("due_date IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("ix_tasks_status_due_date", table_name="tasks")
    op.drop_column("tasks", "needs_attention")
    op.drop_column("tasks", "sla_warning_sent_at")
    op.drop_column("tasks", "required_capabilities")
