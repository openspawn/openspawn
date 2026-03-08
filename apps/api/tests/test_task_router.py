"""Tests for capability-based task routing."""

import pytest

from app.coordination.router import PROFICIENCY_WEIGHTS, score_candidate


def test_proficiency_weights_are_ordered() -> None:
    assert PROFICIENCY_WEIGHTS["basic"] < PROFICIENCY_WEIGHTS["standard"]
    assert PROFICIENCY_WEIGHTS["standard"] < PROFICIENCY_WEIGHTS["expert"]


def test_score_candidate_single_capability_expert() -> None:
    score = score_candidate(
        agent_proficiencies={"python": "expert"},
        required_capabilities=["python"],
        active_task_count=0,
    )
    assert score == pytest.approx(3.0)


def test_score_candidate_multiple_capabilities() -> None:
    score = score_candidate(
        agent_proficiencies={"python": "expert", "testing": "standard"},
        required_capabilities=["python", "testing"],
        active_task_count=0,
    )
    assert score == pytest.approx(5.0)


def test_score_candidate_missing_capability_returns_zero() -> None:
    score = score_candidate(
        agent_proficiencies={"python": "expert"},
        required_capabilities=["python", "rust"],
        active_task_count=0,
    )
    assert score == 0.0


def test_score_candidate_availability_reduces_score() -> None:
    score_idle = score_candidate(
        agent_proficiencies={"python": "standard"},
        required_capabilities=["python"],
        active_task_count=0,
    )
    score_busy = score_candidate(
        agent_proficiencies={"python": "standard"},
        required_capabilities=["python"],
        active_task_count=4,
    )
    assert score_idle > score_busy
    assert score_busy == pytest.approx(2.0 / 5.0)


def test_score_candidate_empty_required_capabilities() -> None:
    score = score_candidate(
        agent_proficiencies={"python": "expert"},
        required_capabilities=[],
        active_task_count=0,
    )
    assert score == pytest.approx(1.0)
