"""add memories table with pgvector and tsvector

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-06
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "memories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "org_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
        ),
        sa.Column(
            "agent_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("agents.id"),
            nullable=False,
        ),
        sa.Column("type", sa.String(20), nullable=False, server_default="episodic"),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("raw_content", sa.Text, nullable=False),
        sa.Column("summary", sa.Text, nullable=True),
        sa.Column("content_hash", sa.String(64), nullable=False),
        sa.Column("visibility", sa.String(20), nullable=False, server_default="shared"),
        sa.Column(
            "target_agent_ids",
            postgresql.ARRAY(postgresql.UUID(as_uuid=True)),
            nullable=True,
        ),
        sa.Column("confidence", sa.SmallInteger, nullable=False, server_default="50"),
        sa.Column("strength", sa.SmallInteger, nullable=False, server_default="50"),
        sa.Column("source", sa.String(50), nullable=False, server_default="unknown"),
        sa.Column("access_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("helpful_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("unhelpful_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column(
            "occurred_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_accessed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("retrieval_context", postgresql.JSONB, nullable=True),
        sa.Column("metadata", postgresql.JSONB, nullable=False, server_default="{}"),
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

    # Vector column (pgvector) — added via raw SQL since Alembic doesn't natively support vector type
    op.execute("ALTER TABLE memories ADD COLUMN embedding vector(1024)")

    # Generated tsvector column for full-text search
    op.execute(
        "ALTER TABLE memories ADD COLUMN content_tsv tsvector "
        "GENERATED ALWAYS AS (to_tsvector('english', content)) STORED"
    )

    # Composite indexes
    op.create_unique_constraint(
        "uq_memories_org_agent_hash", "memories", ["org_id", "agent_id", "content_hash"]
    )
    op.create_index("ix_memories_org_id_created_at", "memories", ["org_id", "created_at"])
    op.create_index(
        "ix_memories_org_id_agent_id_created_at",
        "memories",
        ["org_id", "agent_id", "created_at"],
    )
    op.create_index("ix_memories_org_id_type", "memories", ["org_id", "type"])

    # HNSW index for vector similarity search (cosine distance)
    op.execute(
        "CREATE INDEX ix_memories_embedding_hnsw ON memories "
        "USING hnsw (embedding vector_cosine_ops)"
    )

    # GIN index for full-text search
    op.execute("CREATE INDEX ix_memories_content_tsv ON memories USING gin (content_tsv)")


def downgrade() -> None:
    op.drop_index("ix_memories_content_tsv", table_name="memories")
    op.drop_index("ix_memories_embedding_hnsw", table_name="memories")
    op.drop_index("ix_memories_org_id_type", table_name="memories")
    op.drop_index("ix_memories_org_id_agent_id_created_at", table_name="memories")
    op.drop_index("ix_memories_org_id_created_at", table_name="memories")
    op.drop_constraint("uq_memories_org_agent_hash", "memories")
    op.drop_table("memories")
