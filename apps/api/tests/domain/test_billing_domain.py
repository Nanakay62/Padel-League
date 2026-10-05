"""Pure domain tests for billing, payment HMAC validation, and cancellations."""

import hashlib
import hmac
from datetime import UTC, datetime, timedelta

import pytest

from app.domain.billing import (
    calculate_registration_cost,
    determine_cancellation_refund,
    verify_paystack_hmac,
)


def test_calculate_registration_cost_integer_pesewas():
    # Example: GH₵ 200 court cost split across 4 confirmed players = GH₵ 50 each (5000 pesewas)
    # Plus standard GH₵ 5.00 platform fee (500 pesewas)
    court_fee, platform_fee, total = calculate_registration_cost(
        court_rate_pesewas=20000,
        confirmed_player_count=4,
        platform_fee_pesewas=500,
    )
    assert court_fee == 5000
    assert platform_fee == 500
    assert total == 5500


def test_calculate_registration_cost_rounds_up_to_nearest_cedi():
    # GH₵ 105 (10500 pesewas) split among 4 players = 2625 pesewas
    # Ceil rounded to nearest 100 pesewas (1 cedi) = 2700 pesewas (GH₵ 27.00)
    # Total collected = 4 * 2700 = 10800 pesewas (GH₵ 108.00 >= GH₵ 105.00)
    court_fee, platform_fee, total = calculate_registration_cost(
        court_rate_pesewas=10500,
        confirmed_player_count=4,
        platform_fee_pesewas=500,
        rounding_unit_pesewas=100,
    )
    assert court_fee == 2700
    assert platform_fee == 500
    assert total == 3200


def test_calculate_registration_cost_zero_players_raises():
    with pytest.raises(ValueError, match="at least 1 player"):
        calculate_registration_cost(court_rate_pesewas=20000, confirmed_player_count=0)


def test_verify_paystack_hmac_valid_and_invalid():
    secret = "sk_test_mock_secret_key_12345"
    payload = b'{"event":"charge.success","data":{"reference":"ref_123"}}'

    expected_sig = hmac.new(secret.encode("utf-8"), payload, hashlib.sha512).hexdigest()

    # Valid signature
    assert verify_paystack_hmac(payload, expected_sig, secret) is True

    # Forged signature
    assert verify_paystack_hmac(payload, "forged_signature_hex", secret) is False

    # Tampered payload
    assert verify_paystack_hmac(payload + b"tamper", expected_sig, secret) is False


def test_determine_cancellation_refund_policy():
    event_start = datetime(2026, 10, 10, 18, 0, tzinfo=UTC)

    # 48 hours before event -> FREE refund
    now_48h_before = event_start - timedelta(hours=48)
    assert (
        determine_cancellation_refund(event_start, now_48h_before, free_cancel_hours=24)
        == "FREE"
    )

    # 12 hours before event -> LATE (no refund)
    now_12h_before = event_start - timedelta(hours=12)
    assert (
        determine_cancellation_refund(event_start, now_12h_before, free_cancel_hours=24)
        == "LATE"
    )

    # After event started -> LATE
    now_after = event_start + timedelta(hours=1)
    assert (
        determine_cancellation_refund(event_start, now_after, free_cancel_hours=24)
        == "LATE"
    )
