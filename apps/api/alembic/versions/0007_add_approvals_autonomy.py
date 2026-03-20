"""add approval_requests table and autonomy columns

Revision ID: 0007
Revises: 0006
Create Date: 2026-03-14
"""

import sqlalchemy as sa

from alembic import op

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add autonomy columns to existing tables (no check constraints — SQLite compat)
    op.add_column(
        "agents",
        sa.Column(
            "default_autonomy_level",
            sa.SmallInteger(),
            nullable=False,
            server_default="5",
        ),
    )

    op.add_column(
        "tasks",
        sa.Column("autonomy_level", sa.SmallInteger(), nullable=True),
    )

    # Create approval_requests table
    op.create_table(
        "approval_requests",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("org_id", sa.Text(), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("requested_by", sa.Text(), sa.ForeignKey("agents.id"), nullable=False),
        sa.Column("action_type", sa.String(50), nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", sa.Text(), nullable=False),
        sa.Column("risk_level", sa.SmallInteger(), nullable=False),
        sa.Column("autonomy_level", sa.SmallInteger(), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("resolved_by", sa.Text(), nullable=True),
        sa.Column("resolved_at", sa.DateTime(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("risk_level >= 0 AND risk_level <= 10", name="chk_approval_risk_level"),
        sa.CheckConstraint(
            "autonomy_level >= 0 AND autonomy_level <= 10",
            name="chk_approval_autonomy_level",
        ),
    )
    op.create_index(
        "ix_approval_requests_org_id_status",
        "approval_requests",
        ["org_id", "status"],
    )
    op.create_index(
        "ix_approval_requests_org_id_requested_by",
        "approval_requests",
        ["org_id", "requested_by"],
    )
    op.create_index(
        "ix_approval_requests_org_id_entity_id",
        "approval_requests",
        ["org_id", "entity_id"],
    )


def downgrade() -> None:
    op.drop_table("approval_requests")
    op.drop_column("tasks", "autonomy_level")
    op.drop_column("agents", "default_autonomy_level")
