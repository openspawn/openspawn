"""Unit tests for autonomy gate logic (no DB, pure functions)."""

from app.autonomy.gate import (
    get_risk_level,
    get_risk_level_with_overrides,
    is_gated,
    resolve_effective_autonomy,
)


class TestIsGated:
    def test_risk_below_autonomy(self):
        assert is_gated(5, 3) is False

    def test_risk_equals_autonomy(self):
        assert is_gated(5, 5) is False

    def test_risk_above_autonomy(self):
        assert is_gated(5, 6) is True

    def test_zero_autonomy_gates_everything(self):
        assert is_gated(0, 1) is True

    def test_max_autonomy_gates_nothing(self):
        assert is_gated(10, 10) is False


class TestResolveEffectiveAutonomy:
    def test_inherit_from_agent(self):
        assert resolve_effective_autonomy(None, 5) == 5

    def test_task_override_lower(self):
        assert resolve_effective_autonomy(3, 5) == 3

    def test_task_override_higher(self):
        assert resolve_effective_autonomy(8, 5) == 8


class TestGetRiskLevel:
    def test_known_task_transition(self):
        assert get_risk_level("task_transition", "done") == 3

    def test_known_artifact_type(self):
        assert get_risk_level("artifact_publish", "migration") == 9

    def test_unknown_defaults_to_medium(self):
        assert get_risk_level("unknown", "action") == 5

    def test_zero_risk_transitions(self):
        assert get_risk_level("task_transition", "in_progress") == 0
        assert get_risk_level("task_transition", "backlog") == 0


class TestGetRiskLevelWithOverrides:
    def test_no_overrides_falls_back(self):
        assert get_risk_level_with_overrides("task_transition", "done") == 3

    def test_none_overrides_falls_back(self):
        assert get_risk_level_with_overrides("artifact_publish", "migration", None) == 9

    def test_empty_overrides_falls_back(self):
        assert get_risk_level_with_overrides("task_transition", "done", {}) == 3

    def test_override_replaces_registry(self):
        overrides = {"artifact_publish/migration": 4}
        assert get_risk_level_with_overrides("artifact_publish", "migration", overrides) == 4

    def test_override_missing_key_falls_back(self):
        overrides = {"artifact_publish/migration": 4}
        assert get_risk_level_with_overrides("task_transition", "done", overrides) == 3

    def test_override_unknown_action(self):
        overrides = {"custom/action": 7}
        assert get_risk_level_with_overrides("custom", "action", overrides) == 7
