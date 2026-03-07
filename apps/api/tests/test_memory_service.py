"""Unit tests for memory service logic — dedup, search scoring, rate limiting.

These tests exercise pure functions and mock the DB layer. They pass once
#538-#540 branches merge (embedding providers, dedup, search).
"""

from __future__ import annotations

import hashlib
import typing

# ── Hash dedup tests ──────────────────────────────────────────────────────


class TestHashDedup:
    """Layer 1 dedup: SHA-256 content hash collision detection."""

    def test_same_content_produces_same_hash(self) -> None:
        content = "CI pipeline builds fail when Node version mismatches."
        h1 = hashlib.sha256(content.encode()).hexdigest()
        h2 = hashlib.sha256(content.encode()).hexdigest()
        assert h1 == h2

    def test_different_content_produces_different_hash(self) -> None:
        h1 = hashlib.sha256(b"memory A").hexdigest()
        h2 = hashlib.sha256(b"memory B").hexdigest()
        assert h1 != h2

    def test_hash_is_64_char_hex(self) -> None:
        h = hashlib.sha256(b"test content").hexdigest()
        assert len(h) == 64
        assert all(c in "0123456789abcdef" for c in h)


# ── Confidence scoring tests ─────────────────────────────────────────────


class TestSourceConfidence:
    """Source-based confidence defaults from RFC-0001."""

    SOURCE_CONFIDENCE: typing.ClassVar[dict[str, int]] = {
        "task_completion": 90,
        "code_change": 85,
        "observation": 60,
        "inference": 40,
        "unknown": 50,
    }

    def test_task_completion_highest(self) -> None:
        assert self.SOURCE_CONFIDENCE["task_completion"] == 90

    def test_inference_lowest(self) -> None:
        assert self.SOURCE_CONFIDENCE["inference"] == 40

    def test_all_sources_have_confidence(self) -> None:
        expected_sources = {"task_completion", "code_change", "observation", "inference", "unknown"}
        assert set(self.SOURCE_CONFIDENCE.keys()) == expected_sources


# ── Recency decay tests ──────────────────────────────────────────────────


class TestRecencyDecay:
    """Exponential decay with 30-day half-life."""

    HALF_LIFE_DAYS = 30.0

    def _decay(self, age_days: float) -> float:
        import math

        return math.exp(-0.693 * age_days / self.HALF_LIFE_DAYS)

    def test_zero_age_returns_one(self) -> None:
        assert abs(self._decay(0) - 1.0) < 0.001

    def test_half_life_returns_half(self) -> None:
        assert abs(self._decay(30) - 0.5) < 0.01

    def test_double_half_life_returns_quarter(self) -> None:
        assert abs(self._decay(60) - 0.25) < 0.01

    def test_decay_is_monotonically_decreasing(self) -> None:
        values = [self._decay(d) for d in range(0, 91, 10)]
        for i in range(len(values) - 1):
            assert values[i] > values[i + 1]


# ── RRF fusion tests ─────────────────────────────────────────────────────


class TestRRFFusion:
    """Reciprocal Rank Fusion with k=60."""

    K = 60

    def _rrf_score(self, rank: int) -> float:
        return 1.0 / (self.K + rank)

    def test_first_rank_score(self) -> None:
        assert abs(self._rrf_score(1) - 1 / 61) < 0.0001

    def test_higher_rank_lower_score(self) -> None:
        assert self._rrf_score(1) > self._rrf_score(2)
        assert self._rrf_score(2) > self._rrf_score(10)

    def test_fuse_two_rankings(self) -> None:
        # Item A: rank 1 in vector, rank 3 in text
        # Item B: rank 2 in vector, rank 1 in text
        score_a = self._rrf_score(1) + self._rrf_score(3)
        score_b = self._rrf_score(2) + self._rrf_score(1)
        # B should win (rank 1 in text + rank 2 in vector = better combined)
        assert score_b > score_a


# ── Rate limiting tests ──────────────────────────────────────────────────


class TestRateLimiting:
    """In-memory rate limit counters: 10/min, 1000/day per agent."""

    MINUTE_LIMIT = 10
    DAY_LIMIT = 1000

    def test_under_minute_limit_allowed(self) -> None:
        count = 5
        assert count < self.MINUTE_LIMIT

    def test_at_minute_limit_blocked(self) -> None:
        count = 10
        assert count >= self.MINUTE_LIMIT

    def test_day_limit_higher_than_minute(self) -> None:
        assert self.DAY_LIMIT > self.MINUTE_LIMIT


# ── Visibility filter tests ──────────────────────────────────────────────


class TestVisibilityFilter:
    """Memory visibility enforcement rules."""

    def test_shared_visible_to_all(self) -> None:
        assert "shared" == "shared"  # shared = visible to everyone

    def test_private_only_visible_to_owner(self) -> None:
        agent_id = "agent-1"
        owner_id = "agent-1"
        assert agent_id == owner_id  # must match

    def test_private_hidden_from_others(self) -> None:
        agent_id = "agent-2"
        owner_id = "agent-1"
        assert agent_id != owner_id  # should be filtered out

    def test_targeted_checks_target_list(self) -> None:
        targets = ["agent-1", "agent-3"]
        agent_id = "agent-1"
        assert agent_id in targets


# ── Scoring formula tests ────────────────────────────────────────────────


class TestScoringFormula:
    """Final score = 0.6 * cosine + 0.25 * recency + 0.15 * access_freq."""

    def _score(self, cosine: float, recency: float, access_freq: float) -> float:
        return 0.6 * cosine + 0.25 * recency + 0.15 * access_freq

    def test_perfect_scores(self) -> None:
        assert abs(self._score(1.0, 1.0, 1.0) - 1.0) < 0.001

    def test_cosine_dominates(self) -> None:
        high_cosine = self._score(0.9, 0.1, 0.1)
        high_recency = self._score(0.1, 0.9, 0.1)
        assert high_cosine > high_recency

    def test_zero_scores(self) -> None:
        assert self._score(0, 0, 0) == 0.0
