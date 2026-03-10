"""baseline: create all core tables

Revision ID: 0001
Revises:
Create Date: 2026-03-06

Creates all 26 base tables for the OpenSpawn platform.
Tables added by later migrations (memories, graph_entities, graph_relationships,
memory_entity_links) are NOT included here.
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. organizations (root table, no FKs) ────────────────────────────────
    op.create_table(
        "organizations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False, unique=True),
        sa.Column("task_prefix", sa.String(20), nullable=False, server_default="TASK"),
        sa.Column("next_task_number", sa.Integer, nullable=False, server_default="1"),
        sa.Column("settings", postgresql.JSONB, nullable=False, server_default="{}"),
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

    # ── 2. agents (→ organizations, self-ref parent_id) ───────────────────────
    op.create_table(
        "agents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "org_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
        ),
        sa.Column("agent_id", sa.String(100), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("level", sa.SmallInteger, nullable=False, server_default="1"),
        sa.Column("model", sa.String(100), nullable=False, server_default="sonnet"),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("role", sa.String(50), nullable=False, server_default="worker"),
        sa.Column("mode", sa.String(20), nullable=False, server_default="worker"),
        sa.Column("management_fee_pct", sa.SmallInteger, nullable=False, server_default="0"),
        sa.Column("current_balance", sa.Integer, nullable=False, server_default="0"),
        sa.Column("budget_period_limit", sa.Integer, nullable=True),
        sa.Column("budget_period_spent", sa.Integer, nullable=False, server_default="0"),
        sa.Column("budget_period_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("hmac_secret_enc", sa.LargeBinary, nullable=False),
        sa.Column(
            "parent_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("agents.id"),
            nullable=True,
        ),
        sa.Column("max_children", sa.SmallInteger, nullable=False, server_default="0"),
        sa.Column("metadata", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("trust_score", sa.SmallInteger, nullable=False, server_default="50"),
        sa.Column("tasks_completed", sa.Integer, nullable=False, server_default="0"),
        sa.Column("tasks_successful", sa.Integer, nullable=False, server_default="0"),
        sa.Column("last_activity_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_promotion_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("lifetime_earnings", sa.Integer, nullable=False, server_default="0"),
        sa.Column("domain", sa.String(100), nullable=True),
        sa.Column("avatar", sa.String(500), nullable=True),
        sa.Column("avatar_color", sa.String(20), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.CheckConstraint("level >= 1 AND level <= 10", name="chk_agents_level"),
        sa.CheckConstraint(
            "management_fee_pct >= 0 AND management_fee_pct <= 50",
            name="chk_agents_management_fee_pct",
        ),
    )
    op.create_index("ix_agents_org_id_agent_id", "agents", ["org_id", "agent_id"], unique=True)
    op.create_index("ix_agents_org_id_status", "agents", ["org_id", "status"])
    op.create_index("ix_agents_org_id_role", "agents", ["org_id", "role"])

    # ── 3. agent_capabilities (→ organizations, agents) ───────────────────────
    op.create_table(
        "agent_capabilities",
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
        sa.Column("capability", sa.String(100), nullable=False),
        sa.Column("proficiency", sa.String(20), nullable=False, server_default="standard"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_agent_capabilities_agent_id_capability",
        "agent_capabilities",
        ["agent_id", "capability"],
        unique=True,
    )
    op.create_index(
        "ix_agent_capabilities_org_id_capability",
        "agent_capabilities",
        ["org_id", "capability"],
    )

    # ── 4. events (→ organizations, agents) ───────────────────────────────────
    op.create_table(
        "events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "org_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
        ),
        sa.Column("type", sa.String(100), nullable=False),
        sa.Column(
            "actor_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("agents.id"),
            nullable=False,
        ),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("data", postgresql.JSONB, nullable=False),
        sa.Column("severity", sa.String(10), nullable=False, server_default="info"),
        sa.Column("reasoning", sa.String(500), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_events_org_id_type_created_at", "events", ["org_id", "type", "created_at"])
    op.create_index(
        "ix_events_org_id_entity_type_entity_id",
        "events",
        ["org_id", "entity_type", "entity_id"],
    )
    op.create_index(
        "ix_events_org_id_actor_id_created_at", "events", ["org_id", "actor_id", "created_at"]
    )
    op.create_index("ix_events_org_id_created_at", "events", ["org_id", "created_at"])

    # ── 5. tasks (→ organizations, agents x2, self-ref) ──────────────────────
    # NOTE: required_capabilities, sla_warning_sent_at, needs_attention added by 0004
    op.create_table(
        "tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "org_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
        ),
        sa.Column("identifier", sa.String(20), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="backlog"),
        sa.Column("priority", sa.String(10), nullable=False, server_default="normal"),
        sa.Column(
            "assignee_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("agents.id"),
            nullable=True,
        ),
        sa.Column(
            "creator_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("agents.id"),
            nullable=False,
        ),
        sa.Column(
            "parent_task_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id"),
            nullable=True,
        ),
        sa.Column("approval_required", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("approved_by", sa.String(255), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
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
    op.create_index("ix_tasks_org_id_identifier", "tasks", ["org_id", "identifier"], unique=True)
    op.create_index("ix_tasks_org_id_status", "tasks", ["org_id", "status"])
    op.create_index("ix_tasks_org_id_assignee_id", "tasks", ["org_id", "assignee_id"])
    op.create_index("ix_tasks_org_id_priority", "tasks", ["org_id", "priority"])
    op.create_index(
        "ix_tasks_org_id_status_assignee_id", "tasks", ["org_id", "status", "assignee_id"]
    )
    op.create_index("ix_tasks_parent_task_id", "tasks", ["parent_task_id"])

    # ── 6. task_dependencies (→ organizations, tasks x2) ─────────────────────
    op.create_table(
        "task_dependencies",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "org_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
        ),
        sa.Column(
            "task_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id"),
            nullable=False,
        ),
        sa.Column(
            "depends_on_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id"),
            nullable=False,
        ),
        sa.Column("blocking", sa.Boolean, nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_task_dependencies_task_id_depends_on_id",
        "task_dependencies",
        ["task_id", "depends_on_id"],
        unique=True,
    )
    op.create_index("ix_task_dependencies_task_id", "task_dependencies", ["task_id"])
    op.create_index("ix_task_dependencies_depends_on_id", "task_dependencies", ["depends_on_id"])

    # ── 7. task_tags (→ organizations, tasks) ─────────────────────────────────
    op.create_table(
        "task_tags",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "org_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
        ),
        sa.Column(
            "task_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id"),
            nullable=False,
        ),
        sa.Column("tag", sa.String(100), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_task_tags_task_id_tag", "task_tags", ["task_id", "tag"], unique=True)
    op.create_index("ix_task_tags_org_id_tag", "task_tags", ["org_id", "tag"])

    # ── 8. task_comments (→ organizations, tasks, agents, self-ref) ──────────
    op.create_table(
        "task_comments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "org_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
        ),
        sa.Column(
            "task_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id"),
            nullable=False,
        ),
        sa.Column(
            "author_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("agents.id"),
            nullable=False,
        ),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column(
            "parent_comment_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("task_comments.id"),
            nullable=True,
        ),
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
        "ix_task_comments_task_id_created_at", "task_comments", ["task_id", "created_at"]
    )
    op.create_index(
        "ix_task_comments_parent_comment_id", "task_comments", ["parent_comment_id"]
    )

    # ── 9. channels (→ organizations, tasks) ─────────────────────────────────
    op.create_table(
        "channels",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "org_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("type", sa.String(20), nullable=False),
        sa.Column(
            "task_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id"),
            nullable=True,
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
    op.create_index("ix_channels_org_id_name", "channels", ["org_id", "name"], unique=True)
    op.create_index("ix_channels_org_id_type", "channels", ["org_id", "type"])
    op.create_index("ix_channels_task_id", "channels", ["task_id"])

    # ── 10. messages (→ organizations, channels, agents x2, self-ref) ────────
    op.create_table(
        "messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "org_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
        ),
        sa.Column(
            "channel_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("channels.id"),
            nullable=False,
        ),
        sa.Column(
            "sender_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("agents.id"),
            nullable=False,
        ),
        sa.Column(
            "recipient_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("agents.id"),
            nullable=True,
        ),
        sa.Column("type", sa.String(20), nullable=False, server_default="text"),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column(
            "parent_message_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("messages.id"),
            nullable=True,
        ),
        sa.Column("metadata", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_messages_channel_id_created_at", "messages", ["channel_id", "created_at"]
    )
    op.create_index("ix_messages_org_id_sender_id", "messages", ["org_id", "sender_id"])
    op.create_index("ix_messages_org_id_recipient_id", "messages", ["org_id", "recipient_id"])
    op.create_index("ix_messages_parent_message_id", "messages", ["parent_message_id"])

    # ── 11. users (→ organizations) ──────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "org_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
        ),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), nullable=False, server_default="viewer"),
        sa.Column("google_id", sa.String(255), nullable=True),
        sa.Column("totp_secret_enc", sa.LargeBinary, nullable=True),
        sa.Column("totp_enabled", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("recovery_codes_enc", sa.LargeBinary, nullable=True),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("email_verified", sa.Boolean, nullable=False, server_default="false"),
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
    op.create_index("ix_users_org_id_email", "users", ["org_id", "email"], unique=True)

    # ── 12. refresh_tokens (→ users) ─────────────────────────────────────────
    op.create_table(
        "refresh_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("token_hash", sa.String(255), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("user_agent", sa.String(500), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"])
    op.create_index("ix_refresh_tokens_expires_at", "refresh_tokens", ["expires_at"])

    # ── 13. api_keys (→ organizations, users) ────────────────────────────────
    op.create_table(
        "api_keys",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "org_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("key_prefix", sa.String(12), nullable=False),
        sa.Column("key_hash", sa.String(255), nullable=False, unique=True),
        sa.Column("scopes", postgresql.JSONB, nullable=False, server_default='["read"]'),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_api_keys_org_id", "api_keys", ["org_id"])
    op.create_index("ix_api_keys_key_prefix", "api_keys", ["key_prefix"])

    # ── 14. nonces (no FKs) ──────────────────────────────────────────────────
    op.create_table(
        "nonces",
        sa.Column("nonce", sa.String(64), primary_key=True),
        sa.Column("agent_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_nonces_expires_at", "nonces", ["expires_at"])

    # ── 15. idempotency_keys (→ organizations, agents) ───────────────────────
    op.create_table(
        "idempotency_keys",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("key", postgresql.UUID(as_uuid=True), nullable=False, unique=True),
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
        sa.Column("method", sa.String(10), nullable=False),
        sa.Column("path", sa.String(500), nullable=False),
        sa.Column("status_code", sa.Integer, nullable=False),
        sa.Column("response_body", postgresql.JSONB, nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_idempotency_keys_expires_at", "idempotency_keys", ["expires_at"])

    # ── 16. credit_transactions (→ organizations, agents x2, events, tasks) ──
    op.create_table(
        "credit_transactions",
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
        sa.Column("type", sa.String(10), nullable=False),
        sa.Column("amount", sa.Integer, nullable=False),
        sa.Column("balance_after", sa.Integer, nullable=False),
        sa.Column("reason", sa.String(500), nullable=False),
        sa.Column("trigger_type", sa.String(100), nullable=True),
        sa.Column(
            "trigger_event_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("events.id"),
            nullable=True,
        ),
        sa.Column(
            "source_task_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id"),
            nullable=True,
        ),
        sa.Column(
            "source_agent_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("agents.id"),
            nullable=True,
        ),
        sa.Column("litellm_cost_usd", sa.Numeric(10, 6), nullable=True),
        sa.Column("idempotency_key", postgresql.UUID(as_uuid=True), nullable=True, unique=True),
        sa.Column("metadata", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.CheckConstraint("amount > 0", name="chk_credit_transactions_amount"),
    )
    op.create_index(
        "ix_credit_transactions_org_id_agent_id_created_at",
        "credit_transactions",
        ["org_id", "agent_id", "created_at"],
    )
    op.create_index(
        "ix_credit_transactions_org_id_created_at",
        "credit_transactions",
        ["org_id", "created_at"],
    )
    op.create_index(
        "ix_credit_transactions_trigger_event_id", "credit_transactions", ["trigger_event_id"]
    )
    op.create_index(
        "ix_credit_transactions_source_task_id", "credit_transactions", ["source_task_id"]
    )

    # ── 17. credit_rate_configs (→ organizations) ────────────────────────────
    op.create_table(
        "credit_rate_configs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "org_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
        ),
        sa.Column("trigger_type", sa.String(100), nullable=False),
        sa.Column("direction", sa.String(10), nullable=False),
        sa.Column("amount", sa.Integer, nullable=True),
        sa.Column("amount_mode", sa.String(20), nullable=False, server_default="fixed"),
        sa.Column("usd_to_credits_rate", sa.Numeric(10, 4), nullable=True),
        sa.Column("description", sa.String(255), nullable=True),
        sa.Column("active", sa.Boolean, nullable=False, server_default="true"),
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
        "ix_credit_rate_configs_org_id_trigger_type_direction",
        "credit_rate_configs",
        ["org_id", "trigger_type", "direction"],
        unique=True,
    )
    op.create_index(
        "ix_credit_rate_configs_org_id_active", "credit_rate_configs", ["org_id", "active"]
    )

    # ── 18. escalations (→ organizations, tasks, agents x2) ──────────────────
    op.create_table(
        "escalations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "org_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
        ),
        sa.Column(
            "task_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id"),
            nullable=False,
        ),
        sa.Column(
            "from_agent_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("agents.id"),
            nullable=False,
        ),
        sa.Column(
            "to_agent_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("agents.id"),
            nullable=False,
        ),
        sa.Column("reason", sa.String(50), nullable=False),
        sa.Column("levels_escalated", sa.SmallInteger, nullable=False, server_default="1"),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("is_automatic", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_escalations_org_id_task_id", "escalations", ["org_id", "task_id"])
    op.create_index(
        "ix_escalations_org_id_from_agent_id", "escalations", ["org_id", "from_agent_id"]
    )
    op.create_index(
        "ix_escalations_org_id_to_agent_id", "escalations", ["org_id", "to_agent_id"]
    )
    op.create_index("ix_escalations_org_id_created_at", "escalations", ["org_id", "created_at"])

    # ── 19. reputation_events (→ organizations, agents x2, tasks) ────────────
    op.create_table(
        "reputation_events",
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
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("impact", sa.SmallInteger, nullable=False),
        sa.Column("previous_score", sa.SmallInteger, nullable=False),
        sa.Column("new_score", sa.SmallInteger, nullable=False),
        sa.Column(
            "task_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id"),
            nullable=True,
        ),
        sa.Column(
            "triggered_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("agents.id"),
            nullable=True,
        ),
        sa.Column("reason", sa.String(500), nullable=True),
        sa.Column("metadata", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_reputation_events_org_id_agent_id", "reputation_events", ["org_id", "agent_id"]
    )
    op.create_index(
        "ix_reputation_events_org_id_created_at", "reputation_events", ["org_id", "created_at"]
    )
    op.create_index(
        "ix_reputation_events_agent_id_type", "reputation_events", ["agent_id", "type"]
    )

    # ── 20. consensus_requests (→ organizations, agents) ─────────────────────
    op.create_table(
        "consensus_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "org_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
        ),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="pending"),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column(
            "requester_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("agents.id"),
            nullable=False,
        ),
        sa.Column("subject_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("subject_type", sa.String(50), nullable=True),
        sa.Column("quorum_required", sa.SmallInteger, nullable=False, server_default="2"),
        sa.Column("approval_threshold", sa.SmallInteger, nullable=False, server_default="50"),
        sa.Column("votes_approve", sa.SmallInteger, nullable=False, server_default="0"),
        sa.Column("votes_reject", sa.SmallInteger, nullable=False, server_default="0"),
        sa.Column("votes_abstain", sa.SmallInteger, nullable=False, server_default="0"),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
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
        "ix_consensus_requests_org_id_status", "consensus_requests", ["org_id", "status"]
    )
    op.create_index(
        "ix_consensus_requests_org_id_type", "consensus_requests", ["org_id", "type"]
    )
    op.create_index(
        "ix_consensus_requests_org_id_requester_id",
        "consensus_requests",
        ["org_id", "requester_id"],
    )
    op.create_index(
        "ix_consensus_requests_org_id_expires_at",
        "consensus_requests",
        ["org_id", "expires_at"],
    )

    # ── 21. consensus_votes (→ organizations, consensus_requests, agents) ────
    op.create_table(
        "consensus_votes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "org_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
        ),
        sa.Column(
            "request_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("consensus_requests.id"),
            nullable=False,
        ),
        sa.Column(
            "voter_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("agents.id"),
            nullable=False,
        ),
        sa.Column("vote", sa.String(20), nullable=False),
        sa.Column("reason", sa.Text, nullable=True),
        sa.Column("voter_level", sa.SmallInteger, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_consensus_votes_request_id_voter_id",
        "consensus_votes",
        ["request_id", "voter_id"],
        unique=True,
    )
    op.create_index(
        "ix_consensus_votes_org_id_request_id", "consensus_votes", ["org_id", "request_id"]
    )
    op.create_index("ix_consensus_votes_voter_id", "consensus_votes", ["voter_id"])

    # ── 22. github_connections (→ organizations) ─────────────────────────────
    op.create_table(
        "github_connections",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "org_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
        ),
        sa.Column("installation_id", sa.Integer, nullable=False, unique=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("webhook_secret", sa.String(255), nullable=False),
        sa.Column("access_token", sa.String(500), nullable=True),
        sa.Column("repo_filter", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("sync_config", postgresql.JSONB, nullable=False),
        sa.Column("enabled", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("last_sync_at", sa.String, nullable=True),
        sa.Column("last_error", sa.String(1000), nullable=True),
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
        "ix_github_connections_org_id_enabled", "github_connections", ["org_id", "enabled"]
    )

    # ── 23. linear_connections (→ organizations) ─────────────────────────────
    op.create_table(
        "linear_connections",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "org_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
        ),
        sa.Column("team_id", sa.String(255), nullable=False, unique=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("webhook_secret", sa.String(255), nullable=False),
        sa.Column("api_key", sa.String(500), nullable=True),
        sa.Column("team_filter", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("sync_config", postgresql.JSONB, nullable=False),
        sa.Column("enabled", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("last_sync_at", sa.String, nullable=True),
        sa.Column("last_error", sa.String(1000), nullable=True),
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
        "ix_linear_connections_org_id_enabled", "linear_connections", ["org_id", "enabled"]
    )

    # ── 24. integration_links (→ organizations) ─────────────────────────────
    op.create_table(
        "integration_links",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "org_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
        ),
        sa.Column("provider", sa.String(50), nullable=False, server_default="github"),
        sa.Column("source_type", sa.String(50), nullable=False),
        sa.Column("source_id", sa.String(255), nullable=False),
        sa.Column("target_type", sa.String(50), nullable=False),
        sa.Column("target_id", postgresql.UUID(as_uuid=True), nullable=False),
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
        "ix_integration_links_org_id_source_type_source_id",
        "integration_links",
        ["org_id", "source_type", "source_id"],
        unique=True,
    )
    op.create_index(
        "ix_integration_links_org_id_target_type_target_id",
        "integration_links",
        ["org_id", "target_type", "target_id"],
    )
    op.create_index(
        "ix_integration_links_org_id_provider", "integration_links", ["org_id", "provider"]
    )

    # ── 25. webhooks (→ organizations) ───────────────────────────────────────
    op.create_table(
        "webhooks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "org_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("url", sa.String(2048), nullable=False),
        sa.Column("secret", sa.String(255), nullable=True),
        sa.Column("events", sa.Text, nullable=False, server_default=""),
        sa.Column("enabled", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("hook_type", sa.String(10), nullable=False, server_default="post"),
        sa.Column("can_block", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("timeout_ms", sa.Integer, nullable=False, server_default="5000"),
        sa.Column("failure_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("last_triggered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error", sa.String(1000), nullable=True),
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
        "ix_webhooks_org_id_hook_type_enabled", "webhooks", ["org_id", "hook_type", "enabled"]
    )

    # ── 26. inbound_webhook_keys (→ organizations, agents) ───────────────────
    op.create_table(
        "inbound_webhook_keys",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "org_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("key", sa.String(64), nullable=False, unique=True),
        sa.Column("secret", sa.String(64), nullable=False),
        sa.Column(
            "default_agent_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("agents.id"),
            nullable=True,
        ),
        sa.Column("default_priority", sa.String(10), nullable=True),
        sa.Column("default_tags", sa.Text, nullable=False, server_default=""),
        sa.Column("enabled", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
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
        "ix_inbound_webhook_keys_org_id_enabled",
        "inbound_webhook_keys",
        ["org_id", "enabled"],
    )


def downgrade() -> None:
    # Drop in reverse FK dependency order
    op.drop_table("inbound_webhook_keys")
    op.drop_table("webhooks")
    op.drop_table("integration_links")
    op.drop_table("linear_connections")
    op.drop_table("github_connections")
    op.drop_table("consensus_votes")
    op.drop_table("consensus_requests")
    op.drop_table("reputation_events")
    op.drop_table("escalations")
    op.drop_table("credit_rate_configs")
    op.drop_table("credit_transactions")
    op.drop_table("idempotency_keys")
    op.drop_table("nonces")
    op.drop_table("api_keys")
    op.drop_table("refresh_tokens")
    op.drop_table("users")
    op.drop_table("messages")
    op.drop_table("channels")
    op.drop_table("task_comments")
    op.drop_table("task_tags")
    op.drop_table("task_dependencies")
    op.drop_table("tasks")
    op.drop_table("events")
    op.drop_table("agent_capabilities")
    op.drop_table("agents")
    op.drop_table("organizations")
