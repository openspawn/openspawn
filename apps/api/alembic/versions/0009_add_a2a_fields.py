"""Add A2A fields to tasks and agents tables.

Revision ID: 0009_add_a2a_fields
Revises: 0008_add_usage_counters
Create Date: 2026-03-26
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = "0009_add_a2a_fields"
down_revision = "0008_add_usage_counters"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Task table — A2A fields
    op.add_column(
        "tasks",
        sa.Column("source", sa.String(20), nullable=False, server_default="manual"),
    )
    op.add_column(
        "tasks",
        sa.Column("a2a_context_id", sa.String(100), nullable=True),
    )
    op.add_column(
        "tasks",
        sa.Column(
            "a2a_messages",
            sa.JSON().with_variant(postgresql.JSONB(), "postgresql"),
            nullable=True,
        ),
    )

    # Agent table — A2A fields
    op.add_column(
        "agents",
        sa.Column("a2a_callback_url", sa.String(500), nullable=True),
    )
    op.add_column(
        "agents",
        sa.Column(
            "a2a_skills",
            sa.JSON().with_variant(postgresql.JSONB(), "postgresql"),
            nullable=True,
        ),
    )
    op.add_column(
        "agents",
        sa.Column("last_heartbeat", sa.DateTime(), nullable=True),
    )

    # Index for querying A2A tasks
    op.create_index("ix_tasks_source", "tasks", ["source"])
    op.create_index("ix_tasks_a2a_context_id", "tasks", ["a2a_context_id"])


def downgrade() -> None:
    op.drop_index("ix_tasks_a2a_context_id", table_name="tasks")
    op.drop_index("ix_tasks_source", table_name="tasks")

    op.drop_column("agents", "last_heartbeat")
    op.drop_column("agents", "a2a_skills")
    op.drop_column("agents", "a2a_callback_url")

    op.drop_column("tasks", "a2a_messages")
    op.drop_column("tasks", "a2a_context_id")
    op.drop_column("tasks", "source")
