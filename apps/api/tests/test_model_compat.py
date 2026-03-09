"""Tests for cross-dialect column type compatibility."""

from app.models.compat import CompatArray, CompatTSVector, CompatVector


def test_compat_vector_creates():
    col_type = CompatVector(1024)
    assert col_type is not None
    assert col_type.dimensions == 1024


def test_compat_vector_default_dimensions():
    col_type = CompatVector()
    assert col_type.dimensions == 1024


def test_compat_array_creates():
    col_type = CompatArray()
    assert col_type is not None


def test_compat_tsvector_creates():
    col_type = CompatTSVector()
    assert col_type is not None
