"""Ghana-specific venue validations including GhanaPostGPS digital addresses."""

import re

GHANAPOST_REGEX = re.compile(r"^([A-Za-z]{2})-(\d{3,4})-(\d{4})$")


def validate_ghanapost_gps(raw_code: str | None) -> str:
    """Validate and loosely normalize a GhanaPostGPS code.
    Standard pattern: AA-NNN-NNNN (e.g. GA-123-4567).
    Per platform rules: do not reject unknown formats hard.
    """
    if not raw_code:
        return ""
    cleaned = raw_code.strip()
    if not cleaned:
        return ""

    match = GHANAPOST_REGEX.match(cleaned)
    if match:
        region, district, post = match.groups()
        return f"{region.upper()}-{district}-{post}"

    # Return cleaned without failing hard on unformatted inputs
    return cleaned
