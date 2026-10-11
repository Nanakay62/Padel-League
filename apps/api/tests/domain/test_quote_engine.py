"""Unit tests for Quote Engine pure domain logic (apps/api/app/domain/money.py).

Tests all invariants, boundary crossings, overnight spans, rounding rules,
and HMAC token mechanics. Pure Python tests without database or FastAPI dependencies.
"""

from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

import pytest

from app.domain.money import (
    OpeningHoursSpan,
    PriceBand,
    calculate_boundary_court_fee,
    calculate_stateless_quote,
    is_within_opening_hours,
    sign_quote_token,
    validate_price_bands,
    validate_quote_start_time,
    verify_quote_token,
)


def test_zoneinfo_africa_accra_loads() -> None:
    """Check that Africa/Accra timezone loads cleanly on Windows using tzdata."""
    tz = ZoneInfo("Africa/Accra")
    assert tz.key == "Africa/Accra"
    now_accra = datetime.now(tz)
    # Africa/Accra is always UTC+0 (no DST)
    assert now_accra.utcoffset() == timedelta(0)


def test_duration_pro_rata_pricing_no_double_count() -> None:
    """Assert pro-rata accumulation: 90 min at 12000 pesewas/hr = 18000; 120 min = 24000.

    Duration multiplier of 10000 bps (1.0x) does not alter pro-rata price.
    """
    bands: list[PriceBand] = []
    hourly_rate = 12000

    start = datetime(2026, 10, 16, 10, 0, tzinfo=UTC)  # Friday 10:00

    fee_60 = calculate_boundary_court_fee(
        start=start,
        duration_min=60,
        bands=bands,
        fallback_hourly_rate=hourly_rate,
        duration_multiplier_bps=10000,
    )
    assert fee_60 == 12000

    fee_90 = calculate_boundary_court_fee(
        start=start,
        duration_min=90,
        bands=bands,
        fallback_hourly_rate=hourly_rate,
        duration_multiplier_bps=10000,
    )
    assert fee_90 == 18000

    fee_120 = calculate_boundary_court_fee(
        start=start,
        duration_min=120,
        bands=bands,
        fallback_hourly_rate=hourly_rate,
        duration_multiplier_bps=10000,
    )
    assert fee_120 == 24000


def test_single_division_ceil_rounding_odd_rate() -> None:
    """Accumulate rate * minutes across segments and divide by 60 once using ceil.

    Odd rate 12555 pesewas/hr for 90 min:
    total_minute_pesewas = 12555 * 90 = 1,129,950
    1,129,950 / 60 = 18,832.5 -> Ceil = 18,833 pesewas.
    """
    start = datetime(2026, 10, 16, 10, 0, tzinfo=UTC)
    fee_90 = calculate_boundary_court_fee(
        start=start,
        duration_min=90,
        bands=[],
        fallback_hourly_rate=12555,
        duration_multiplier_bps=10000,
    )
    assert fee_90 == 18833


def test_duration_multiplier_adjustment_and_identity() -> None:
    """A multiplier of 10000 bps returns exact base fee; 9500 applies 5% discount."""
    start = datetime(2026, 10, 16, 10, 0, tzinfo=UTC)
    base_fee = calculate_boundary_court_fee(
        start=start,
        duration_min=90,
        bands=[],
        fallback_hourly_rate=12000,
        duration_multiplier_bps=10000,
    )
    assert base_fee == 18000

    discounted_fee = calculate_boundary_court_fee(
        start=start,
        duration_min=90,
        bands=[],
        fallback_hourly_rate=12000,
        duration_multiplier_bps=9500,  # 5% discount
    )
    # 18000 * 9500 // 10000 = 17100
    assert discounted_fee == 17100


def test_overnight_span_belongs_to_previous_day() -> None:
    """The portion of an overnight span after midnight belongs to the PREVIOUS day.

    Tests:
    - Fri -> Sat
    - Sat -> Sun
    - Sun -> Mon
    - A session starting at Sat 00:30 under Friday's span
    - A session ending exactly at closing time (allowed) vs one minute later (rejected)
    """
    # 1. Friday overnight: 17:00 (1020) to 01:00 (60)
    friday_hours = [OpeningHoursSpan(day=4, opens_minute=1020, closes_minute=60)]
    # Sat 00:30 starting (30 min -> ends 01:00) falls under Friday's span
    sat_0030 = datetime(2026, 10, 17, 0, 30, tzinfo=UTC)
    assert is_within_opening_hours(sat_0030, 30, friday_hours) is True

    # Exactly at closing time (Sat 00:00 to 01:00, 60 min -> ends at 01:00) is ALLOWED
    sat_exact_closing = datetime(2026, 10, 17, 0, 0, tzinfo=UTC)
    assert is_within_opening_hours(sat_exact_closing, 60, friday_hours) is True

    # One minute later (Sat 00:01 to 01:01, 60 min) is REJECTED
    sat_one_min_late = datetime(2026, 10, 17, 0, 1, tzinfo=UTC)
    assert is_within_opening_hours(sat_one_min_late, 60, friday_hours) is False

    # 2. Sat -> Sun overnight: Sat (day 5) 20:00 (1200) to Sun 02:00 (120)
    sat_hours = [OpeningHoursSpan(day=5, opens_minute=1200, closes_minute=120)]
    sun_0100 = datetime(
        2026, 10, 18, 1, 0, tzinfo=UTC
    )  # Sunday 01:00 (60 min -> ends 02:00)
    assert is_within_opening_hours(sun_0100, 60, sat_hours) is True
    sun_one_min_late = datetime(2026, 10, 18, 1, 1, tzinfo=UTC)  # ends 02:01
    assert is_within_opening_hours(sun_one_min_late, 60, sat_hours) is False

    # 3. Sun -> Mon overnight: Sun (day 6) 22:00 (1320) to Mon 03:00 (180)
    sun_hours = [OpeningHoursSpan(day=6, opens_minute=1320, closes_minute=180)]
    mon_0130 = datetime(
        2026, 10, 19, 1, 30, tzinfo=UTC
    )  # Mon 01:30 (90 min -> ends 03:00)
    assert is_within_opening_hours(mon_0130, 90, sun_hours) is True
    mon_one_min_late = datetime(2026, 10, 19, 1, 31, tzinfo=UTC)  # ends 03:01
    assert is_within_opening_hours(mon_one_min_late, 90, sun_hours) is False


def test_overnight_price_band_applies_to_post_midnight_session() -> None:
    """A Friday overnight price band 17:00 to 02:00 prices Saturday 00:30 (60m) session."""
    friday_peak = [
        PriceBand(
            days=(4,),  # Friday
            start_minute=1020,  # 17:00
            end_minute=120,  # 02:00 Sat
            hourly_rate_pesewas=20000,
            name="Friday Night Peak",
        )
    ]

    # Sat 00:30 (60 min session runs 00:30 to 01:30, entirely within Friday's 17:00-02:00 band)
    sat_0030 = datetime(2026, 10, 17, 0, 30, tzinfo=UTC)
    fee = calculate_boundary_court_fee(
        start=sat_0030,
        duration_min=60,
        bands=friday_peak,
        fallback_hourly_rate=None,
    )
    assert fee == 20000

    # Also test Sat -> Sun overnight band
    sat_peak = [
        PriceBand(
            days=(5,),  # Saturday
            start_minute=1200,  # 20:00 Sat
            end_minute=120,  # 02:00 Sun
            hourly_rate_pesewas=25000,
            name="Saturday Night Peak",
        )
    ]
    sun_0030 = datetime(2026, 10, 18, 0, 30, tzinfo=UTC)
    assert (
        calculate_boundary_court_fee(
            start=sun_0030,
            duration_min=60,
            bands=sat_peak,
            fallback_hourly_rate=None,
        )
        == 25000
    )

    # And Sun -> Mon overnight band
    sun_peak = [
        PriceBand(
            days=(6,),  # Sunday
            start_minute=1200,  # 20:00 Sun
            end_minute=120,  # 02:00 Mon
            hourly_rate_pesewas=22000,
            name="Sunday Night Peak",
        )
    ]
    mon_0030 = datetime(2026, 10, 19, 0, 30, tzinfo=UTC)
    assert (
        calculate_boundary_court_fee(
            start=mon_0030,
            duration_min=60,
            bands=sun_peak,
            fallback_hourly_rate=None,
        )
        == 22000
    )


def test_validate_price_bands_detects_midnight_wrap_overlap() -> None:
    """validate_price_bands rejects overlaps crossing midnight (e.g. Fri 17:00-01:00 vs Sat 00:00-06:00)."""
    overlapping = [
        PriceBand(
            days=(4,),
            start_minute=1020,
            end_minute=60,
            hourly_rate_pesewas=20000,
            name="Fri Overnight",
        ),
        PriceBand(
            days=(5,),
            start_minute=0,
            end_minute=360,
            hourly_rate_pesewas=15000,
            name="Sat Early",
        ),
    ]
    with pytest.raises(ValueError, match="[Oo]verlap"):
        validate_price_bands(overlapping)


def test_session_crossing_1700_boundary_prices_each_30min_segment() -> None:
    """Session 16:30 - 17:30 (60 min) has 30m off-peak (10000/hr) + 30m peak (20000/hr).

    Minute-pesewas: (10000 * 30) + (20000 * 30) = 300,000 + 600,000 = 900,000.
    Divided by 60 = 15,000 pesewas.
    """
    bands = [
        PriceBand(
            days=(4,),
            start_minute=1020,
            end_minute=1320,
            hourly_rate_pesewas=20000,
            name="Peak",
        )  # 17:00-22:00
    ]
    start = datetime(2026, 10, 16, 16, 30, tzinfo=UTC)  # Fri 16:30
    fee = calculate_boundary_court_fee(
        start=start,
        duration_min=60,
        bands=bands,
        fallback_hourly_rate=10000,
    )
    assert fee == 15000


def test_missing_price_returns_none() -> None:
    """Venue or court without any price band and no fallback rate returns None (unpriced)."""
    start = datetime(2026, 10, 16, 10, 0, tzinfo=UTC)
    fee = calculate_boundary_court_fee(
        start=start,
        duration_min=60,
        bands=[],
        fallback_hourly_rate=None,
    )
    assert fee is None


def test_court_override_rules() -> None:
    """Court with base rate and no bands uses court rate for all hours;

    Court with bands and no base rate leaves non-band gaps unpriced.
    """
    start_midday = datetime(2026, 10, 16, 12, 0, tzinfo=UTC)

    # 1. Court with base rate 15000 and no bands -> uses 15000 for all hours
    fee_court_flat = calculate_boundary_court_fee(
        start=start_midday,
        duration_min=60,
        bands=[],
        fallback_hourly_rate=15000,
    )
    assert fee_court_flat == 15000

    # 2. Court with only a peak band 17:00-22:00 and NO fallback rate -> midday is unpriced (None)
    court_bands = [
        PriceBand(
            days=(4,),
            start_minute=1020,
            end_minute=1320,
            hourly_rate_pesewas=25000,
            name="Court Peak",
        )
    ]
    fee_gap = calculate_boundary_court_fee(
        start=start_midday,
        duration_min=60,
        bands=court_bands,
        fallback_hourly_rate=None,
    )
    assert fee_gap is None


def test_stateless_quote_add_ons_and_platform_fee() -> None:
    """Platform fee is its own line, add-ons come from venue config, tax is OFF by default."""
    venue_add_ons = [
        {"id": "rackets", "name": "Racket Rental", "price_pesewas": 3000},
        {"id": "balls", "name": "Can of 3 Balls", "price_pesewas": 4500},
    ]

    start = datetime(2026, 10, 16, 10, 0, tzinfo=UTC)
    result = calculate_stateless_quote(
        venue_id="v1",
        court_id="c1",
        start=start,
        duration_min=60,
        bands=[],
        fallback_hourly_rate=12000,
        duration_multiplier_bps=10000,
        venue_add_ons_config=venue_add_ons,
        requested_add_ons=["rackets", "balls"],
        platform_fee_pesewas=500,
        tax_enabled=False,
        tax_rate_bps=0,
    )

    assert result.is_priced is True
    assert result.court_fee_pesewas == 12000
    assert result.platform_fee_pesewas == 500
    assert result.add_ons_pesewas == 7500
    assert result.tax_pesewas == 0
    assert result.total_pesewas == 20000  # 12000 + 500 + 7500

    # Check lines
    assert len(result.lines) == 4
    types = [line.line_type for line in result.lines]
    assert types == ["court_fee", "platform_fee", "add_on", "add_on"]


def test_stateless_quote_rejects_unknown_or_negative_add_ons() -> None:
    """Unknown add-on ID or negative price raises ValueError."""
    start = datetime(2026, 10, 16, 10, 0, tzinfo=UTC)
    with pytest.raises(ValueError, match="unknown add-on"):
        calculate_stateless_quote(
            venue_id="v1",
            court_id="c1",
            start=start,
            duration_min=60,
            bands=[],
            fallback_hourly_rate=12000,
            duration_multiplier_bps=10000,
            venue_add_ons_config=[],
            requested_add_ons=["unknown_id"],
            platform_fee_pesewas=500,
        )


def test_hmac_quote_token_sign_verify_tamper_and_expiry() -> None:
    """Sign canonical JSON token with key_id; verify with hmac.compare_digest; reject tampering."""
    keyring = {"v1": "test-secret-key-32chars-min-padel"}
    payload = {
        "venue_id": "v1",
        "court_id": "c1",
        "start": "2026-10-16T10:00:00Z",
        "duration_min": 60,
        "add_ons": ["rackets"],
        "total_pesewas": 15500,
        "issued_at": "2026-10-16T09:50:00Z",
        "expires_at": "2026-10-16T10:00:00Z",
        "key_id": "v1",
    }

    token = sign_quote_token(payload, keyring=keyring)
    assert isinstance(token, str)

    # 1. Valid token verifies
    now = datetime(2026, 10, 16, 9, 55, tzinfo=UTC)
    verified = verify_quote_token(token, keyring=keyring, now=now)
    assert verified is not None
    assert verified["total_pesewas"] == 15500

    # 2. Tampered token rejected
    tampered = token[:-4] + "xxxx"
    assert verify_quote_token(tampered, keyring=keyring, now=now) is None

    # 3. Unknown key_id rejected
    unknown_key_payload = dict(payload, key_id="v99")
    with pytest.raises(KeyError):
        sign_quote_token(unknown_key_payload, keyring=keyring)

    # 4. Expired token flagged as expired
    later = datetime(2026, 10, 16, 10, 5, tzinfo=UTC)
    verified_later = verify_quote_token(token, keyring=keyring, now=later)
    assert verified_later is not None
    assert verified_later["is_expired"] is True


def test_zoneinfo_africa_accra_loads_with_tzdata() -> None:
    """Verify that tzdata is installed and Africa/Accra loads without error on Windows."""
    tz = ZoneInfo("Africa/Accra")
    assert tz.key == "Africa/Accra"
    now_accra = datetime.now(tz)
    # Africa/Accra has UTC offset 0 and no daylight saving time
    assert now_accra.utcoffset() == timedelta(0)


def test_validate_quote_start_time_future_and_clock_skew() -> None:
    """Start time >90 days rejected, past time rejected, clock skew <=300s allowed."""
    now = datetime(2026, 10, 10, 12, 0, tzinfo=UTC)

    # 1. 10 days ahead is valid
    valid_start = now + timedelta(days=10)
    validate_quote_start_time(valid_start, now=now)

    # 2. 90 days ahead exactly is valid
    max_valid = now + timedelta(days=90)
    validate_quote_start_time(max_valid, now=now)

    # 3. 91 days ahead is rejected
    too_far = now + timedelta(days=91)
    with pytest.raises(ValueError, match="90 days"):
        validate_quote_start_time(too_far, now=now)

    # 4. 2 minutes in the past is allowed under clock-skew tolerance (300s)
    slight_past = now - timedelta(minutes=2)
    validate_quote_start_time(slight_past, now=now, clock_skew_seconds=300)

    # 5. 10 minutes in the past is rejected
    way_past = now - timedelta(minutes=10)
    with pytest.raises(ValueError, match="in the past"):
        validate_quote_start_time(way_past, now=now, clock_skew_seconds=300)
