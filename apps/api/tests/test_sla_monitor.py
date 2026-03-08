"""Tests for SLA monitor threshold calculations."""

from datetime import UTC, datetime, timedelta

from app.coordination.sla_monitor import check_sla_thresholds


def test_no_deadline_returns_none() -> None:
    result = check_sla_thresholds(
        created_at=datetime.now(UTC),
        due_date=None,
        sla_warning_sent=False,
        warning_pct=80,
        breach_pct=100,
    )
    assert result is None


def test_within_threshold_returns_ok() -> None:
    now = datetime.now(UTC)
    created_at = now - timedelta(hours=1)
    due_date = now + timedelta(hours=9)  # 10h total, 1h elapsed = 10%
    result = check_sla_thresholds(
        created_at=created_at,
        due_date=due_date,
        sla_warning_sent=False,
        warning_pct=80,
        breach_pct=100,
    )
    assert result == "ok"


def test_warning_threshold_returns_warning() -> None:
    now = datetime.now(UTC)
    created_at = now - timedelta(hours=9)
    due_date = now + timedelta(hours=1)  # 10h total, 9h elapsed = 90%
    result = check_sla_thresholds(
        created_at=created_at,
        due_date=due_date,
        sla_warning_sent=False,
        warning_pct=80,
        breach_pct=100,
    )
    assert result == "warning"


def test_warning_already_sent_returns_ok() -> None:
    now = datetime.now(UTC)
    created_at = now - timedelta(hours=9)
    due_date = now + timedelta(hours=1)  # 90% elapsed
    result = check_sla_thresholds(
        created_at=created_at,
        due_date=due_date,
        sla_warning_sent=True,
        warning_pct=80,
        breach_pct=100,
    )
    assert result == "ok"


def test_breach_threshold_returns_breach() -> None:
    now = datetime.now(UTC)
    created_at = now - timedelta(hours=11)
    due_date = now - timedelta(hours=1)  # past deadline = 110%
    result = check_sla_thresholds(
        created_at=created_at,
        due_date=due_date,
        sla_warning_sent=True,
        warning_pct=80,
        breach_pct=100,
    )
    assert result == "breach"


def test_settings_has_sla_config() -> None:
    from app.config import settings

    assert hasattr(settings, "sla_warning_pct")
    assert hasattr(settings, "sla_breach_pct")
    assert settings.sla_warning_pct == 80
    assert settings.sla_breach_pct == 100
