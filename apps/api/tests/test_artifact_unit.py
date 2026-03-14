"""Unit tests for artifact schemas, hashing, and enum validation."""

from __future__ import annotations

from app.artifacts.schemas import compute_content_hash
from app.models.enums import ArtifactStatus, ArtifactType


class TestContentHash:
    def test_deterministic(self):
        content = {"name": "SubmitButton", "test_ids": ["btn-1"]}
        assert compute_content_hash(content) == compute_content_hash(content)

    def test_key_order_independent(self):
        a = {"b": 2, "a": 1}
        b = {"a": 1, "b": 2}
        assert compute_content_hash(a) == compute_content_hash(b)

    def test_nested_key_order_independent(self):
        a = {"outer": {"z": 3, "a": 1}, "name": "X"}
        b = {"name": "X", "outer": {"a": 1, "z": 3}}
        assert compute_content_hash(a) == compute_content_hash(b)

    def test_different_content_different_hash(self):
        a = {"name": "A"}
        b = {"name": "B"}
        assert compute_content_hash(a) != compute_content_hash(b)

    def test_hash_is_sha256_hex(self):
        h = compute_content_hash({"x": 1})
        assert len(h) == 64
        assert all(c in "0123456789abcdef" for c in h)


class TestStatusTransitions:
    def test_valid_transitions(self):
        from app.artifacts.router import VALID_STATUS_TRANSITIONS

        assert (
            ArtifactStatus.PUBLISHED.value in VALID_STATUS_TRANSITIONS[ArtifactStatus.DRAFT.value]
        )
        assert (
            ArtifactStatus.SUPERSEDED.value in VALID_STATUS_TRANSITIONS[ArtifactStatus.DRAFT.value]
        )
        assert (
            ArtifactStatus.SUPERSEDED.value
            in VALID_STATUS_TRANSITIONS[ArtifactStatus.PUBLISHED.value]
        )

    def test_superseded_has_no_transitions(self):
        from app.artifacts.router import VALID_STATUS_TRANSITIONS

        assert ArtifactStatus.SUPERSEDED.value not in VALID_STATUS_TRANSITIONS

    def test_published_cannot_go_to_draft(self):
        from app.artifacts.router import VALID_STATUS_TRANSITIONS

        assert (
            ArtifactStatus.DRAFT.value
            not in VALID_STATUS_TRANSITIONS[ArtifactStatus.PUBLISHED.value]
        )


class TestArtifactTypeEnum:
    def test_all_lowercase(self):
        for member in ArtifactType:
            assert member.value == member.value.lower(), f"{member.name} not lowercase"

    def test_no_spaces(self):
        for member in ArtifactType:
            assert " " not in member.value, f"{member.name} has spaces"

    def test_count(self):
        assert len(ArtifactType) == 7


class TestArtifactStatusEnum:
    def test_all_lowercase(self):
        for member in ArtifactStatus:
            assert member.value == member.value.lower()

    def test_count(self):
        assert len(ArtifactStatus) == 3
