from app.models import Base


def test_all_models_registered() -> None:
    table_names = set(Base.metadata.tables.keys())
    expected = {
        "organizations",
        "agents",
        "agent_capabilities",
        "tasks",
        "task_dependencies",
        "task_tags",
        "task_comments",
        "credit_transactions",
        "credit_rate_configs",
        "channels",
        "messages",
        "events",
        "users",
        "refresh_tokens",
        "api_keys",
        "nonces",
        "idempotency_keys",
        "consensus_requests",
        "consensus_votes",
        "escalations",
        "reputation_events",
        "webhooks",
        "inbound_webhook_keys",
        "github_connections",
        "linear_connections",
        "integration_links",
    }
    assert expected.issubset(table_names), f"Missing tables: {expected - table_names}"


def test_agent_check_constraints() -> None:
    table = Base.metadata.tables["agents"]
    constraint_names = {c.name for c in table.constraints if hasattr(c, "name") and c.name}
    assert "chk_agents_level" in constraint_names
    assert "chk_agents_management_fee_pct" in constraint_names


def test_credit_transaction_check_constraint() -> None:
    table = Base.metadata.tables["credit_transactions"]
    constraint_names = {c.name for c in table.constraints if hasattr(c, "name") and c.name}
    assert "chk_credit_transactions_amount" in constraint_names


def test_enum_values() -> None:
    from app.models.enums import AgentStatus, TaskStatus

    assert AgentStatus.ACTIVE.value == "active"
    assert TaskStatus.IN_PROGRESS.value == "in_progress"
