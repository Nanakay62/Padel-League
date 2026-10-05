"""Pure domain logic for billing, payment splitting, Paystack HMAC verification, and cancellation policies."""

import hashlib
import hmac
import math
from datetime import datetime


def calculate_registration_cost(
    court_rate_pesewas: int,
    confirmed_player_count: int,
    platform_fee_pesewas: int = 500,
    rounding_unit_pesewas: int = 100,
) -> tuple[int, int, int]:
    """Calculate the split court cost per confirmed player, platform fee, and total payable in pesewas.

    - Money is strictly integer pesewas.
    - Uses ceiling arithmetic rounded up to rounding_unit_pesewas (100 = 1 GH₵).
    - Platform fee is always maintained as a transparent separate line item.
    - Guaranteed invariant: (confirmed_player_count * court_fee_per_player) >= court_rate_pesewas.

    Returns:
        tuple[court_fee_per_player, platform_fee, total_payable_pesewas]
    """
    if confirmed_player_count <= 0:
        raise ValueError("Cost splitting requires at least 1 player.")

    if court_rate_pesewas < 0 or platform_fee_pesewas < 0:
        raise ValueError("Rates and fees must be non-negative.")

    raw_split = court_rate_pesewas / confirmed_player_count
    unit = max(1, rounding_unit_pesewas)
    court_fee_per_player = math.ceil(raw_split / unit) * unit

    total_payable_pesewas = court_fee_per_player + platform_fee_pesewas
    return court_fee_per_player, platform_fee_pesewas, total_payable_pesewas


def verify_paystack_hmac(
    payload_bytes: bytes,
    signature_header: str,
    secret_key: str,
) -> bool:
    """Verify Paystack HMAC-SHA512 webhook signature.

    Compares the calculated hex digest against the signature provided in x-paystack-signature.
    Uses hmac.compare_digest for constant-time comparison.
    """
    if not secret_key or not signature_header:
        return False

    computed = hmac.new(
        secret_key.encode("utf-8"),
        payload_bytes,
        hashlib.sha512,
    ).hexdigest()

    return hmac.compare_digest(computed.lower(), signature_header.lower())


def determine_cancellation_refund(
    event_start: datetime,
    now: datetime,
    free_cancel_hours: int = 24,
) -> str:
    """Determine whether cancellation is inside the free window or late.

    Returns:
        'FREE' if cancelled >= free_cancel_hours before event start,
        'LATE' otherwise (no refund).
    """
    hours_until_event = (event_start - now).total_seconds() / 3600.0
    if hours_until_event >= free_cancel_hours:
        return "FREE"
    return "LATE"
