"""Ghana phone number parsing, validation, and E.164 normalization."""

import phonenumbers


def normalize_ghana_phone(raw_phone: str) -> str:
    """Validate and normalize a phone number to canonical E.164 format for Ghana (+233)."""
    cleaned = raw_phone.strip()
    if not cleaned:
        raise ValueError("Invalid Ghana phone number: empty string")

    # If entered as 9 digits without leading 0 or + (e.g. 241234567)
    if len(cleaned) == 9 and cleaned.isdigit():
        cleaned = "0" + cleaned

    try:
        parsed = phonenumbers.parse(cleaned, "GH")
    except phonenumbers.NumberParseException as e:
        raise ValueError(f"Invalid Ghana phone number: {e}") from e

    if not phonenumbers.is_valid_number(parsed):
        raise ValueError(f"Invalid Ghana phone number: {raw_phone}")

    # Ensure region is Ghana (+233)
    if parsed.country_code != 233:
        raise ValueError(
            f"Only Ghana phone numbers (+233) are supported. Got country code: {parsed.country_code}"
        )

    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)


def mask_phone_number(phone_e164: str) -> str:
    """Mask a phone number for privacy-compliant logging (e.g. +23324****567)."""
    if len(phone_e164) <= 6:
        return "***"
    return f"{phone_e164[:6]}****{phone_e164[-3:]}"
