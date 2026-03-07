"""add knowledge graph tables (graph_entities, graph_relationships, memory_entity_links)

Revision ID: 0003
Revises: 0002
Create Date: 2026-03-07
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- graph_entities ---
    op.create_table(
        "graph_entities",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "org_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("description", sa.Text, nullable=False, server_default=""),
        sa.Column("mention_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("confidence", sa.Float, nullable=False, server_default="50.0"),
        sa.Column(
            "last_seen_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
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

    # Vector column (pgvector)
    op.execute("ALTER TABLE graph_entities ADD COLUMN embedding vector(1024)")

    # Unique constraint: one entity per (org, name, type)
    op.create_unique_constraint(
        "uq_graph_entity_org_name_type",
        "graph_entities",
        ["org_id", "name", "entity_type"],
    )

    # HNSW index for entity embedding similarity
    op.execute(
        "CREATE INDEX ix_graph_entities_embedding_hnsw ON graph_entities "
        "USING hnsw (embedding vector_cosine_ops)"
    )

    # --- graph_relationships ---
    op.create_table(
        "graph_relationships",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "org_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
        ),
        sa.Column(
            "source_entity_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("graph_entities.id"),
            nullable=False,
        ),
        sa.Column(
            "target_entity_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("graph_entities.id"),
            nullable=False,
        ),
        sa.Column("relationship_type", sa.String(100), nullable=False),
        sa.Column("weight", sa.Float, nullable=False, server_default="0.5"),
        sa.Column(
            "last_seen_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("evidence_count", sa.Integer, nullable=False, server_default="1"),
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

    op.create_index(
        "ix_graph_relationships_source_entity_id",
        "graph_relationships",
        ["source_entity_id"],
    )
    op.create_index(
        "ix_graph_relationships_target_entity_id",
        "graph_relationships",
        ["target_entity_id"],
    )

    # --- memory_entity_links ---
    op.create_table(
        "memory_entity_links",
        sa.Column(
            "memory_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("memories.id"),
            primary_key=True,
        ),
        sa.Column(
            "entity_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("graph_entities.id"),
            primary_key=True,
        ),
        sa.Column(
            "agent_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("agents.id"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    op.create_index(
        "ix_memory_entity_links_entity_id",
        "memory_entity_links",
        ["entity_id"],
    )
    op.create_index(
        "ix_memory_entity_links_agent_id",
        "memory_entity_links",
        ["agent_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_memory_entity_links_agent_id", table_name="memory_entity_links")
    op.drop_index("ix_memory_entity_links_entity_id", table_name="memory_entity_links")
    op.drop_table("memory_entity_links")

    op.drop_index("ix_graph_relationships_target_entity_id", table_name="graph_relationships")
    op.drop_index("ix_graph_relationships_source_entity_id", table_name="graph_relationships")
    op.drop_table("graph_relationships")

    op.drop_index("ix_graph_entities_embedding_hnsw", table_name="graph_entities")
    op.drop_constraint("uq_graph_entity_org_name_type", "graph_entities")
    op.drop_table("graph_entities")
