"""Pure domain functions for RFC 6238 TOTP, Fernet encryption, and recovery codes."""

import hashlib
import secrets
import time

import pyotp
from cryptography.fernet import Fernet


def generate_totp_secret() -> str:
    """Generate a random 32-character base32 secret."""
    return pyotp.random_base32(length=32)


def encrypt_totp_secret(secret: str, fernet_key: str) -> str:
    """Encrypt a TOTP secret at rest using Fernet symmetric encryption."""
    f = Fernet(
        fernet_key.encode("utf-8") if isinstance(fernet_key, str) else fernet_key
    )
    return f.encrypt(secret.encode("utf-8")).decode("utf-8")


def decrypt_totp_secret(encrypted_secret: str, fernet_key: str) -> str:
    """Decrypt a Fernet-encrypted TOTP secret."""
    f = Fernet(
        fernet_key.encode("utf-8") if isinstance(fernet_key, str) else fernet_key
    )
    return f.decrypt(encrypted_secret.encode("utf-8")).decode("utf-8")


def generate_totp_uri(
    secret: str, account_name: str, issuer: str = "Padel Ghana"
) -> str:
    """Generate the standard otpauth:// URI for QR code generation."""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=account_name, issuer_name=issuer)


def verify_totp_code(
    secret: str,
    code: str,
    last_step: int | None = None,
    valid_window: int = 1,
) -> tuple[bool, int]:
    """Verify a 6-digit TOTP code with replay protection.

    Returns (is_valid, current_step).
    If code is valid but step <= last_step, returns (False, step) to prevent code reuse.
    """
    clean_code = code.strip().replace(" ", "")
    if len(clean_code) != 6 or not clean_code.isdigit():
        return False, 0

    totp = pyotp.TOTP(secret)
    now = time.time()
    current_step = int(now // totp.interval)

    # Check window [-valid_window, +valid_window]
    for offset in range(-valid_window, valid_window + 1):
        step = current_step + offset
        expected_code = totp.generate_otp(step)
        if secrets.compare_digest(clean_code, expected_code):
            if last_step is not None and step <= last_step:
                return False, step  # Replay attempt
            return True, step

    return False, 0


def generate_recovery_codes(count: int = 8) -> list[str]:
    """Generate single-use alphanumeric recovery codes formatted as 'xxxx-xxxx'."""
    alphabet = "23456789abcdefghjkmnpqrstuvwxyz"  # Base32 without ambiguous 0/O, 1/I/L
    codes: list[str] = []
    for _ in range(count):
        part1 = "".join(secrets.choice(alphabet) for _ in range(4))
        part2 = "".join(secrets.choice(alphabet) for _ in range(4))
        codes.append(f"{part1}-{part2}")
    return codes


def hash_recovery_code(code: str) -> str:
    """Deterministically hash recovery code for storage using SHA-256."""
    normalized = code.strip().lower().replace("-", "").replace(" ", "")
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def verify_recovery_code(code: str, hashed_code: str) -> bool:
    """Verify input recovery code matches stored hash in constant time."""
    computed_hash = hash_recovery_code(code)
    return secrets.compare_digest(computed_hash, hashed_code)
