"""Unit tests for Ghana phone number validation and normalization."""

import pytest

from app.identity.phone import normalize_ghana_phone


def test_normalize_valid_local_format() -> None:
    # Standard 10-digit Ghana number
    assert normalize_ghana_phone("0241234567") == "+233241234567"
    assert normalize_ghana_phone("055 987 6543") == "+233559876543"
    assert normalize_ghana_phone("020-111-2233") == "+233201112233"


def test_normalize_valid_international_format() -> None:
    assert normalize_ghana_phone("+233241234567") == "+233241234567"
    assert normalize_ghana_phone("+233 50 123 4567") == "+233501234567"


def test_normalize_without_leading_zero() -> None:
    assert normalize_ghana_phone("241234567") == "+233241234567"


def test_normalize_invalid_numbers() -> None:
    with pytest.raises(ValueError, match="Invalid Ghana phone number"):
        normalize_ghana_phone("12345")

    with pytest.raises(ValueError, match="Invalid Ghana phone number"):
        normalize_ghana_phone("not-a-number")

    with pytest.raises(ValueError, match="Invalid Ghana phone number"):
        normalize_ghana_phone("0241234567890123")  # too long
