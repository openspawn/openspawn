"""Search quality tests — validates hybrid search ranking and visibility.

Pure function tests run always. Integration tests gated behind MEMORY_QUALITY_TEST=1.
Issue: #616
"""

from __future__ import annotations

import uuid

from app.memory.search import (
    ACCESS_WEIGHT,
    HELPFULNESS_WEIGHT,
    RECENCY_WEIGHT,
    RRF_K,
    VECTOR_WEIGHT,
    _build_visibility_filter,
    _recency_decay,
    _rrf_fuse,
)

# ── Scoring weights validation ───────────────────────────────────────


class TestScoringWeights:
    """Verify scoring weights sum to 1.0 and match expected values."""

    def test_weights_sum_to_one(self):
        total = VECTOR_WEIGHT + RECENCY_WEIGHT + ACCESS_WEIGHT + HELPFULNESS_WEIGHT
        assert abs(total - 1.0) < 0.001, f"Weights sum to {total}, expected 1.0"

    def test_vector_weight_dominates(self):
        assert VECTOR_WEIGHT > RECENCY_WEIGHT
        assert VECTOR_WEIGHT > ACCESS_WEIGHT
        assert VECTOR_WEIGHT > HELPFULNESS_WEIGHT

    def test_expected_weight_values(self):
        assert VECTOR_WEIGHT == 0.50
        assert RECENCY_WEIGHT == 0.20
        assert ACCESS_WEIGHT == 0.15
        assert HELPFULNESS_WEIGHT == 0.15


# ── Recency decay ────────────────────────────────────────────────────


class TestRecencyDecayFunction:
    """Test the actual _recency_decay function from search.py."""

    def test_none_returns_zero(self):
        import pendulum

        assert _recency_decay(None, pendulum.now("UTC")) == 0.0

    def test_just_accessed_returns_near_one(self):
        import pendulum

        now = pendulum.now("UTC")
        assert _recency_decay(now, now) > 0.99

    def test_half_life_returns_half(self):
        import pendulum

        now = pendulum.now("UTC")
        past = now.subtract(days=30)
        decay = _recency_decay(past, now)
        assert abs(decay - 0.5) < 0.02, f"At 30 days (half-life), expected ~0.5, got {decay}"

    def test_double_half_life_returns_quarter(self):
        import pendulum

        now = pendulum.now("UTC")
        past = now.subtract(days=60)
        decay = _recency_decay(past, now)
        assert abs(decay - 0.25) < 0.02, f"At 60 days, expected ~0.25, got {decay}"

    def test_future_access_returns_one(self):
        import pendulum

        now = pendulum.now("UTC")
        future = now.add(hours=1)
        assert _recency_decay(future, now) == 1.0

    def test_monotonically_decreasing(self):
        import pendulum

        now = pendulum.now("UTC")
        values = [_recency_decay(now.subtract(days=d), now) for d in range(0, 91, 10)]
        # First value (0 days ago) should be highest
        for i in range(len(values) - 1):
            assert values[i] >= values[i + 1], (
                f"Decay not monotonically decreasing at day {i * 10}: {values[i]} < {values[i + 1]}"
            )


# ── RRF fusion ───────────────────────────────────────────────────────


class TestRRFFusion:
    """Test the actual _rrf_fuse function from search.py."""

    def test_single_source_ranking(self):
        id1 = uuid.uuid4()
        id2 = uuid.uuid4()
        scores = _rrf_fuse({id1: 1, id2: 2}, {})
        assert scores[id1] > scores[id2], "Rank 1 should score higher than rank 2"

    def test_dual_source_boost(self):
        """Item appearing in both rankings gets boosted."""
        id_both = uuid.uuid4()
        id_vector_only = uuid.uuid4()
        scores = _rrf_fuse(
            {id_both: 1, id_vector_only: 2},
            {id_both: 1},
        )
        assert scores[id_both] > scores[id_vector_only], "Item in both rankings should score higher"

    def test_rrf_score_formula(self):
        id1 = uuid.uuid4()
        scores = _rrf_fuse({id1: 1}, {id1: 3})
        expected = 1.0 / (RRF_K + 1) + 1.0 / (RRF_K + 3)
        assert abs(scores[id1] - expected) < 0.0001

    def test_empty_rankings(self):
        scores = _rrf_fuse({}, {})
        assert scores == {}

    def test_disjoint_rankings(self):
        id1 = uuid.uuid4()
        id2 = uuid.uuid4()
        scores = _rrf_fuse({id1: 1}, {id2: 1})
        # Same rank in different sources = same score
        assert abs(scores[id1] - scores[id2]) < 0.0001


# ── Visibility filter ────────────────────────────────────────────────


class TestVisibilityFilter:
    """Test the actual _build_visibility_filter from search.py."""

    def test_no_agent_shows_shared_only(self):
        filt = _build_visibility_filter(None)
        assert "shared" in filt
        assert "private" not in filt
        assert "targeted" not in filt

    def test_with_agent_includes_all_visibility_types(self):
        agent_id = uuid.uuid4()
        filt = _build_visibility_filter(agent_id)
        assert "shared" in filt
        assert "private" in filt
        assert "targeted" in filt
        assert str(agent_id) in filt

    def test_agent_id_embedded_in_filter(self):
        agent_id = uuid.uuid4()
        filt = _build_visibility_filter(agent_id)
        # Agent ID should appear in both private and targeted clauses
        assert filt.count(str(agent_id)) >= 2


# ── Scoring formula end-to-end ───────────────────────────────────────


class TestScoringFormula:
    """Validate the combined scoring formula produces correct rankings."""

    def _score(
        self,
        vector_sim: float = 0.0,
        recency: float = 0.0,
        access_norm: float = 0.0,
        helpfulness: float = 0.0,
    ) -> float:
        return (
            VECTOR_WEIGHT * vector_sim
            + RECENCY_WEIGHT * recency
            + ACCESS_WEIGHT * access_norm
            + HELPFULNESS_WEIGHT * helpfulness
        )

    def test_perfect_scores(self):
        assert abs(self._score(1.0, 1.0, 1.0, 1.0) - 1.0) < 0.001

    def test_zero_scores(self):
        assert self._score(0.0, 0.0, 0.0, 0.0) == 0.0

    def test_vector_similarity_dominates(self):
        """High vector similarity should outscore high recency."""
        high_vector = self._score(vector_sim=0.9, recency=0.1)
        high_recency = self._score(vector_sim=0.1, recency=0.9)
        assert high_vector > high_recency

    def test_recent_beats_old_same_similarity(self):
        """Same vector similarity — recent memory should rank higher."""
        recent = self._score(vector_sim=0.8, recency=0.9)
        old = self._score(vector_sim=0.8, recency=0.1)
        assert recent > old

    def test_frequently_accessed_beats_rarely_accessed(self):
        """Same similarity and recency — frequent access should rank higher."""
        frequent = self._score(vector_sim=0.8, recency=0.5, access_norm=0.9)
        rare = self._score(vector_sim=0.8, recency=0.5, access_norm=0.1)
        assert frequent > rare

    def test_helpful_beats_unhelpful(self):
        """Same everything else — helpful memory should rank higher."""
        helpful = self._score(vector_sim=0.8, recency=0.5, helpfulness=0.9)
        unhelpful = self._score(vector_sim=0.8, recency=0.5, helpfulness=0.1)
        assert helpful > unhelpful
