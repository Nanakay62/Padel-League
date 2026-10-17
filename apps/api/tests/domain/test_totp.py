"""Unit tests for RFC 6238 TOTP, encryption, replay prevention, and recovery codes."""

import pyotp

from app.domain.totp import (
    decrypt_totp_secret,
    encrypt_totp_secret,
    generate_recovery_codes,
    generate_totp_secret,
    generate_totp_uri,
    hash_recovery_code,
    verify_recovery_code,
    verify_totp_code,
)

SAMPLE_FERNET_KEY = "dGVzdC10b3RwLWVuY3J5cHRpb24ta2V5LTMyYnl0ZXM="


def test_totp_secret_generation_and_encryption() -> None:
    secret = generate_totp_secret()
    assert len(secret) == 32
    assert secret.isalnum()

    encrypted = encrypt_totp_secret(secret, SAMPLE_FERNET_KEY)
    assert encrypted != secret
    decrypted = decrypt_totp_secret(encrypted, SAMPLE_FERNET_KEY)
    assert decrypted == secret


def test_totp_uri_generation() -> None:
    secret = "JBSWY3DPEHPK3PXP"
    uri = generate_totp_uri(secret, "owner@padelclub.com", "Padel Ghana")
    assert "otpauth://totp/Padel%20Ghana:owner%40padelclub.com" in uri
    assert f"secret={secret}" in uri
    assert "issuer=Padel%20Ghana" in uri


def test_totp_verification_valid_and_invalid() -> None:
    secret = generate_totp_secret()
    totp = pyotp.TOTP(secret)
    current_code = totp.now()

    # Valid code
    is_valid, step = verify_totp_code(secret, current_code)
    assert is_valid is True
    assert step > 0

    # Invalid code
    bad_code = "000000" if current_code != "000000" else "111111"
    is_valid_bad, _ = verify_totp_code(secret, bad_code)
    assert is_valid_bad is False


def test_totp_replay_protection() -> None:
    secret = generate_totp_secret()
    totp = pyotp.TOTP(secret)
    current_code = totp.now()

    # First verification succeeds and gives step
    is_valid, step = verify_totp_code(secret, current_code, last_step=None)
    assert is_valid is True

    # Immediate replay with the same or older step is rejected
    is_valid_replay, _ = verify_totp_code(secret, current_code, last_step=step)
    assert is_valid_replay is False


def test_recovery_codes_generation_and_verification() -> None:
    codes = generate_recovery_codes(8)
    assert len(codes) == 8
    assert len(set(codes)) == 8

    for code in codes:
        assert len(code) == 9  # format xxxx-xxxx
        assert code[4] == "-"
        h = hash_recovery_code(code)
        assert verify_recovery_code(code, h) is True
        assert verify_recovery_code("0000-0000", h) is False
