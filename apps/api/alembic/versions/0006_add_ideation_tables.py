"""add ideation_sessions and ideation_briefs tables

Revision ID: 0006
Revises: 0005
Create Date: 2026-03-19
"""

import sqlalchemy as sa

from alembic import op
from app.models.compat import CompatJSONB, CompatUUID

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ideation_sessions",
        sa.Column("id", CompatUUID(), primary_key=True),
        sa.Column(
            "org_id",
            CompatUUID(),
            sa.ForeignKey("organizations.id"),
            nullable=False,
        ),
        sa.Column(
            "task_id",
            CompatUUID(),
            sa.ForeignKey("tasks.id"),
            nullable=False,
        ),
        sa.Column("participants", CompatJSONB(), nullable=False, server_default="[]"),
        sa.Column("current_round", sa.SmallInteger, nullable=False, server_default="1"),
        sa.Column("status", sa.String(30), nullable=False, server_default="pending"),
        sa.Column("autonomy_level", sa.SmallInteger, nullable=False, server_default="5"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_ideation_sessions_org_id_status",
        "ideation_sessions",
        ["org_id", "status"],
    )
    op.create_index(
        "ix_ideation_sessions_task_id",
        "ideation_sessions",
        ["task_id"],
    )

    op.create_table(
        "ideation_briefs",
        sa.Column("id", CompatUUID(), primary_key=True),
        sa.Column(
            "session_id",
            CompatUUID(),
            sa.ForeignKey("ideation_sessions.id"),
            nullable=False,
        ),
        sa.Column(
            "agent_id",
            CompatUUID(),
            sa.ForeignKey("agents.id"),
            nullable=False,
        ),
        sa.Column("round", sa.SmallInteger, nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("content", CompatJSONB(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint(
            "session_id", "agent_id", "round",
            name="uq_brief_session_agent_round",
        ),
    )
    op.create_index(
        "ix_ideation_briefs_session_round",
        "ideation_briefs",
        ["session_id", "round"],
    )
    op.create_index(
        "ix_ideation_briefs_agent_id",
        "ideation_briefs",
        ["agent_id"],
    )


def downgrade() -> None:
    op.drop_table("ideation_briefs")
    op.drop_table("ideation_sessions")
