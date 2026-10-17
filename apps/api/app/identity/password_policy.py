"""Password policy validation for Padel Ghana.

Policy Rules (NIST SP 800-63B compliant):
- Length: Minimum 8 characters, maximum 128 characters.
- Breached / common password check: Checked against local common passwords list (frozenset).
- Composition rules: None (no arbitrary uppercase/digit/symbol mandates).
- Paste allowed: Fully permitted without restriction.
"""

from fastapi import HTTPException
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher

from app.config import settings

pwd_context = PasswordHash(
    (
        Argon2Hasher(
            time_cost=settings.argon2_time_cost,
            memory_cost=settings.argon2_memory_cost,
            parallelism=settings.argon2_parallelism,
            hash_len=settings.argon2_hash_len,
        ),
    )
)


def hash_password(password: str) -> str:
    """Hash password using Argon2id."""
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against Argon2id hash."""
    return pwd_context.verify(password, hashed)


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


def validate_admin_password_policy(password: str) -> None:
    """Validate administrative passwords: min 12 chars, no composition rules, breach check."""
    if len(password) < 12:
        raise HTTPException(
            status_code=422,
            detail="Admin passwords must be at least 12 characters long.",
        )
    if len(password) > 128:
        raise HTTPException(
            status_code=422,
            detail="Password must not exceed 128 characters.",
        )
    if password.lower() in COMMON_PASSWORDS:
        raise HTTPException(
            status_code=422,
            detail="This password appears in common breach lists. Please choose a more secure passphrase.",
        )
