"""Unit tests for GhanaPostGPS digital address validation."""

from app.venues.validation import validate_ghanapost_gps


def test_valid_standard_ghanapost_gps() -> None:
    # Standard 2 letters, 3 or 4 digits, 4 digits
    assert validate_ghanapost_gps("GA-123-4567") == "GA-123-4567"
    assert (
        validate_ghanapost_gps("ga-123-4567") == "GA-123-4567"
    )  # normalizes to uppercase
    assert validate_ghanapost_gps("AK-045-8790") == "AK-045-8790"
    assert validate_ghanapost_gps("WS-1234-5678") == "WS-1234-5678"


def test_loose_validation_on_informal_or_empty() -> None:
    # Loose validation per handbook rules: do not reject unknown formats hard
    assert validate_ghanapost_gps("") == ""
    assert validate_ghanapost_gps("   ") == ""
    # Informal / alternative formats accepted gracefully
    assert validate_ghanapost_gps("GA1234567") == "GA1234567"
    assert validate_ghanapost_gps("Near Accra Mall") == "Near Accra Mall"
