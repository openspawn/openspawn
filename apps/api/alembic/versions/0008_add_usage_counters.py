"""Add usage_counters table for hosted mode.

Revision ID: 0008
Revises: 0007_add_approvals_autonomy
Create Date: 2026-03-20
"""

import sqlalchemy as sa
from alembic import op
from app.models.compat import CompatUUID

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "usage_counters",
        sa.Column("id", CompatUUID(), nullable=False),
        sa.Column("user_id", CompatUUID(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("call_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_call_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_usage_counters_user_id", "usage_counters", ["user_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_usage_counters_user_id", table_name="usage_counters")
    op.drop_table("usage_counters")
