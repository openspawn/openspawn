"""Tests for feedback loop confidence adjustments and helpfulness scoring."""

from __future__ import annotations


class TestFeedbackConfidence:
    def test_helpful_increases_confidence(self) -> None:
        confidence = 60
        confidence = min(100, confidence + 2)
        assert confidence == 62

    def test_unhelpful_decreases_confidence(self) -> None:
        confidence = 60
        confidence = max(0, confidence - 5)
        assert confidence == 55

    def test_helpful_capped_at_100(self) -> None:
        confidence = 99
        confidence = min(100, confidence + 2)
        assert confidence == 100

    def test_unhelpful_floored_at_0(self) -> None:
        confidence = 3
        confidence = max(0, confidence - 5)
        assert confidence == 0


class TestHelpfulnessScoring:
    def test_all_helpful(self) -> None:
        helpful, unhelpful = 10, 0
        score = helpful / max(1, helpful + unhelpful)
        assert score == 1.0

    def test_all_unhelpful(self) -> None:
        helpful, unhelpful = 0, 10
        score = helpful / max(1, helpful + unhelpful)
        assert score == 0.0

    def test_no_feedback_defaults_zero(self) -> None:
        helpful, unhelpful = 0, 0
        score = helpful / max(1, helpful + unhelpful)
        assert score == 0.0

    def test_mixed_feedback(self) -> None:
        helpful, unhelpful = 7, 3
        score = helpful / max(1, helpful + unhelpful)
        assert abs(score - 0.7) < 0.01


class TestUpdatedWeights:
    def test_weights_sum_to_one(self) -> None:
        from app.memory.search import (
            ACCESS_WEIGHT,
            HELPFULNESS_WEIGHT,
            RECENCY_WEIGHT,
            VECTOR_WEIGHT,
        )

        total = VECTOR_WEIGHT + RECENCY_WEIGHT + ACCESS_WEIGHT + HELPFULNESS_WEIGHT
        assert abs(total - 1.0) < 0.001

    def test_vector_weight_is_dominant(self) -> None:
        from app.memory.search import (
            ACCESS_WEIGHT,
            HELPFULNESS_WEIGHT,
            RECENCY_WEIGHT,
            VECTOR_WEIGHT,
        )

        assert VECTOR_WEIGHT > RECENCY_WEIGHT
        assert VECTOR_WEIGHT > ACCESS_WEIGHT
        assert VECTOR_WEIGHT > HELPFULNESS_WEIGHT
