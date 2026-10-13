"""Password policy validation for Padel Ghana.

Policy Rules (NIST SP 800-63B compliant):
- Length: Minimum 8 characters, maximum 128 characters.
- Breached / common password check: Checked against local common passwords list (frozenset).
- Composition rules: None (no arbitrary uppercase/digit/symbol mandates).
- Paste allowed: Fully permitted without restriction.
"""

from fastapi import HTTPException

COMMON_PASSWORDS: frozenset[str] = frozenset(
    {
        "password",
        "password123",
        "12345678",
        "123456789",
        "1234567890",
        "11111111",
        "00000000",
        "qwertyuiop",
        "qwerty123",
        "admin123",
        "padel123",
        "padel2024",
        "padel2025",
        "padel2026",
        "accrapadel",
        "ghana2026",
        "ghana123",
        "welcome1",
        "welcome123",
        "ilovepadel",
        "iloveyou",
        "tennis123",
        "football1",
        "football",
        "secret123",
        "changeme",
        "monkey123",
        "dragon123",
        "master123",
        "sunshine1",
        "princess",
        "trustno1",
        "password1",
        "pass1234",
        "letmein1",
        "letmein123",
        "testing1",
        "player123",
        "champions",
        "starwars",
        "superman",
    }
)


def validate_password_policy(password: str) -> None:
    """Validate password against NIST SP 800-63B standards and common blacklist."""
    if len(password) < 8:
        raise HTTPException(
            status_code=422,
            detail="Password must be at least 8 characters long.",
        )
    if len(password) > 128:
        raise HTTPException(
            status_code=422,
            detail="Password must not exceed 128 characters.",
        )
    if password.lower() in COMMON_PASSWORDS:
        raise HTTPException(
            status_code=422,
            detail="This password is too common or easily guessed. Please choose a more secure password.",
        )
