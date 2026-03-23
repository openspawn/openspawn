"""Tests for the guardrails module — schema parsing, evaluation engine, and API routes."""

from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.guardrails.engine import evaluate_guardrail, evaluate_guardrails
from app.guardrails.schema import (
    EvaluateResponse,
    GuardrailAction,
    GuardrailDefinition,
    GuardrailEvent,
    GuardrailResult,
)

# ── Schema Tests ──────────────────────────────────────────────────────────────


class TestGuardrailSchema:
    def test_create_guardrail_definition(self) -> None:
        g = GuardrailDefinition(
            name="no-friday-deploys",
            trigger="task.transition",
            condition="day_of_week != friday",
            action=GuardrailAction.BLOCK,
            message="Deploys are not allowed on Fridays.",
        )
        assert g.name == "no-friday-deploys"
        assert g.action == GuardrailAction.BLOCK
        assert g.condition == "day_of_week != friday"

    def test_guardrail_defaults(self) -> None:
        g = GuardrailDefinition(
            name="test",
            trigger="task.created",
            message="Test guardrail",
        )
        assert g.action == GuardrailAction.LOG
        assert g.condition is None
        assert g.match is None
        assert g.escalate_to is None

    def test_guardrail_event(self) -> None:
        e = GuardrailEvent(
            trigger="task.transition",
            content="Deploy v2.0 to production",
            agent_id="agent-1",
            agent_level=5,
            metadata={"status": "done"},
        )
        assert e.trigger == "task.transition"
        assert e.agent_level == 5

    def test_guardrail_event_defaults(self) -> None:
        e = GuardrailEvent(trigger="task.created")
        assert e.content == ""
        assert e.agent_id is None
        assert e.agent_level is None
        assert e.metadata == {}

    def test_guardrail_result(self) -> None:
        r = GuardrailResult(
            guardrail_name="test",
            triggered=True,
            action=GuardrailAction.BLOCK,
            message="Blocked!",
        )
        assert r.triggered is True
        assert r.escalate_to is None

    def test_all_actions(self) -> None:
        for action in ["block", "escalate", "require_approval", "warn", "log"]:
            a = GuardrailAction(action)
            assert a.value == action


# ── Engine Tests ──────────────────────────────────────────────────────────────


class TestGuardrailEngine:
    def test_trigger_match_exact(self) -> None:
        g = GuardrailDefinition(
            name="test",
            trigger="task.created",
            action=GuardrailAction.LOG,
            message="Logged",
        )
        event = GuardrailEvent(trigger="task.created")
        result = evaluate_guardrail(g, event)
        assert result.triggered is True

    def test_trigger_no_match(self) -> None:
        g = GuardrailDefinition(
            name="test",
            trigger="task.created",
            action=GuardrailAction.LOG,
            message="Logged",
        )
        event = GuardrailEvent(trigger="memory.stored")
        result = evaluate_guardrail(g, event)
        assert result.triggered is False

    def test_trigger_prefix_match(self) -> None:
        g = GuardrailDefinition(
            name="test",
            trigger="task.transition",
            action=GuardrailAction.WARN,
            message="Warning",
        )
        event = GuardrailEvent(trigger="task.transition.done")
        result = evaluate_guardrail(g, event)
        assert result.triggered is True

    def test_trigger_wildcard(self) -> None:
        g = GuardrailDefinition(
            name="test",
            trigger="task.*",
            action=GuardrailAction.LOG,
            message="All task events",
        )
        event = GuardrailEvent(trigger="task.created")
        result = evaluate_guardrail(g, event)
        assert result.triggered is True

    def test_match_pattern(self) -> None:
        g = GuardrailDefinition(
            name="billing-escalation",
            trigger="task.created",
            match="billing|invoice|pricing",
            action=GuardrailAction.ESCALATE,
            escalate_to="cfo",
            message="Billing tasks require CFO review.",
        )
        event = GuardrailEvent(trigger="task.created", content="Update billing address")
        result = evaluate_guardrail(g, event)
        assert result.triggered is True
        assert result.escalate_to == "cfo"

    def test_match_pattern_no_match(self) -> None:
        g = GuardrailDefinition(
            name="billing-escalation",
            trigger="task.created",
            match="billing|invoice|pricing",
            action=GuardrailAction.ESCALATE,
            escalate_to="cfo",
            message="Billing tasks require CFO review.",
        )
        event = GuardrailEvent(trigger="task.created", content="Fix CSS bug")
        result = evaluate_guardrail(g, event)
        assert result.triggered is False

    def test_condition_always(self) -> None:
        g = GuardrailDefinition(
            name="test",
            trigger="task.created",
            condition="always",
            action=GuardrailAction.WARN,
            message="Always warn",
        )
        event = GuardrailEvent(trigger="task.created")
        result = evaluate_guardrail(g, event)
        assert result.triggered is True

    def test_condition_agent_level(self) -> None:
        g = GuardrailDefinition(
            name="level-gate",
            trigger="memory.stored",
            condition="agent.level < 7",
            action=GuardrailAction.REQUIRE_APPROVAL,
            message="Low-level agent needs approval",
        )
        # Agent level 5 — should trigger (5 < 7 is true)
        event_low = GuardrailEvent(trigger="memory.stored", agent_level=5)
        result = evaluate_guardrail(g, event_low)
        assert result.triggered is True

        # Agent level 8 — should not trigger (8 < 7 is false)
        event_high = GuardrailEvent(trigger="memory.stored", agent_level=8)
        result = evaluate_guardrail(g, event_high)
        assert result.triggered is False

    def test_evaluate_multiple_guardrails(self) -> None:
        guardrails = [
            GuardrailDefinition(
                name="warn-all",
                trigger="task.created",
                action=GuardrailAction.WARN,
                message="Warning 1",
            ),
            GuardrailDefinition(
                name="log-all",
                trigger="task.created",
                action=GuardrailAction.LOG,
                message="Log 1",
            ),
            GuardrailDefinition(
                name="unrelated",
                trigger="memory.stored",
                action=GuardrailAction.BLOCK,
                message="Should not trigger",
            ),
        ]
        event = GuardrailEvent(trigger="task.created")
        response = evaluate_guardrails(guardrails, event)
        assert isinstance(response, EvaluateResponse)
        assert response.blocked is False
        assert len(response.warnings) == 1
        assert response.warnings[0] == "Warning 1"

    def test_evaluate_blocked(self) -> None:
        guardrails = [
            GuardrailDefinition(
                name="blocker",
                trigger="task.transition",
                action=GuardrailAction.BLOCK,
                message="Blocked!",
            ),
        ]
        event = GuardrailEvent(trigger="task.transition")
        response = evaluate_guardrails(guardrails, event)
        assert response.blocked is True

    def test_evaluate_empty_guardrails(self) -> None:
        event = GuardrailEvent(trigger="task.created")
        response = evaluate_guardrails([], event)
        assert response.blocked is False
        assert response.results == []
        assert response.warnings == []


# ── Route Tests ───────────────────────────────────────────────────────────────


class TestGuardrailRoutes:
    @pytest.mark.anyio
    async def test_list_guardrails_requires_auth(self, client: AsyncClient) -> None:
        r = await client.get("/guardrails")
        assert r.status_code == 401

    @pytest.mark.anyio
    async def test_evaluate_requires_auth(self, client: AsyncClient) -> None:
        r = await client.post(
            "/guardrails/evaluate",
            json={
                "event": {"trigger": "task.created", "content": "test"},
                "guardrails": [],
            },
        )
        assert r.status_code == 401

    @pytest.mark.anyio
    async def test_set_guardrails_requires_auth(self, client: AsyncClient) -> None:
        r = await client.post(
            "/guardrails",
            json=[
                {
                    "name": "test",
                    "trigger": "task.created",
                    "action": "log",
                    "message": "Test",
                }
            ],
        )
        assert r.status_code == 401
