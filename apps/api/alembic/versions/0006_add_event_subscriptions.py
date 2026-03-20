"""add event_subscriptions table

Revision ID: 0006
Revises: 0005
Create Date: 2026-03-14
"""

import sqlalchemy as sa

from alembic import op

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "event_subscriptions",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("org_id", sa.Text(), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("agent_id", sa.Text(), sa.ForeignKey("agents.id"), nullable=False),
        sa.Column("event_pattern", sa.String(100), nullable=False),
        sa.Column("task_id", sa.Text(), sa.ForeignKey("tasks.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint(
            "org_id", "agent_id", "event_pattern", name="uq_event_sub_agent_pattern"
        ),
    )


def downgrade() -> None:
    op.drop_table("event_subscriptions")
