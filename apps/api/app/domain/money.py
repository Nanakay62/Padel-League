"""Money handling, pricing bands, duration math, and stateless HMAC quote tokens.

Ghana Padel Platform: pure Python domain functions (no FastAPI, no SQLAlchemy, no floats).
Operates strictly in integer pesewas (1 GH₵ = 100 pesewas) and basis points (100 bps = 1%).
Timezone is Africa/Accra (UTC+0, no daylight saving).
"""

import base64
import hashlib
import hmac
import json
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

ACCRA_TZ = ZoneInfo("Africa/Accra")


@dataclass(frozen=True)
class PriceBand:
    days: tuple[int, ...]  # 0=Mon, 1=Tue, ..., 6=Sun
    start_minute: int  # Minutes from midnight (e.g. 17:00 -> 1020)
    end_minute: (
        int  # Minutes from midnight (e.g. 01:00 -> 60). If <= start, spans overnight.
    )
    hourly_rate_pesewas: int
    name: str


@dataclass(frozen=True)
class OpeningHoursSpan:
    day: int  # 0=Mon, ..., 6=Sun
    opens_minute: int  # e.g. 06:00 -> 360
    closes_minute: int  # If <= opens, spans overnight past midnight


@dataclass(frozen=True)
class QuoteLine:
    label: str
    amount_pesewas: int
    line_type: str  # "court_fee", "platform_fee", "add_on", "tax"


@dataclass(frozen=True)
class QuoteResult:
    quote_id: str
    lines: list[QuoteLine]
    court_fee_pesewas: int
    platform_fee_pesewas: int
    add_ons_pesewas: int
    tax_pesewas: int
    total_pesewas: int
    is_priced: bool


def round_up(value: int, unit: int) -> int:
    """Round up integer value to the nearest multiple of unit (e.g. 100 for whole Cedis)."""
    if unit <= 0:
        raise ValueError("unit must be positive")
    return -(-value // unit) * unit


def price_per_player(
    court_cost: int,
    platform_fee: int,
    capacity: int,
    rounding_unit: int = 100,
) -> int:
    """All integers in pesewas (1 GHS = 100 pesewas).

    Whole-cedi rounding applies ONLY to per-seat shares in open matches / splits.
    """
    if capacity <= 0:
        raise ValueError("capacity must be positive")
    if court_cost < 0 or platform_fee < 0:
        raise ValueError("costs cannot be negative")

    total = court_cost + platform_fee
    per = -(-total // capacity)  # Ceil division
    return round_up(per, rounding_unit)  # Round up to whole pesewas/cedis unit


def format_ghs(pesewas: int) -> str:
    """Format pesewas as GH₵ X.XX display string."""
    sign = "-" if pesewas < 0 else ""
    abs_val = abs(pesewas)
    cedis = abs_val // 100
    pes = abs_val % 100
    return f"{sign}GH₵ {cedis:,}.{pes:02d}"


def _minute_of_week(day: int, minute: int) -> int:
    """Returns absolute minute of the week from 0 to 10079 (Mon 00:00 to Sun 23:59)."""
    return (day % 7) * 1440 + minute


def validate_price_bands(bands: list[PriceBand]) -> None:
    """Validate price bands.

    Detects overlaps across midnight (e.g. Fri 17:00-01:00 vs Sat 00:00-06:00).
    Rejects overlapping bands covering the same minute of the week.
    """
    # 7 days * 1440 minutes = 10080 minutes in a week
    minute_owner: dict[int, str] = {}

    for band in bands:
        if band.hourly_rate_pesewas <= 0:
            raise ValueError(f"Price band '{band.name}' must have positive rate")

        for day in band.days:
            start_m = band.start_minute
            end_m = band.end_minute

            if start_m < end_m:
                # Same day span
                for m in range(start_m, end_m):
                    abs_m = _minute_of_week(day, m)
                    if abs_m in minute_owner:
                        raise ValueError(
                            f"Overlapping price bands: '{band.name}' overlaps with '{minute_owner[abs_m]}'"
                        )
                    minute_owner[abs_m] = band.name
            else:
                # Overnight span: covers [start_m, 1440) on day, and [0, end_m) on day+1
                for m in range(start_m, 1440):
                    abs_m = _minute_of_week(day, m)
                    if abs_m in minute_owner:
                        raise ValueError(
                            f"Overlapping price bands: '{band.name}' overlaps with '{minute_owner[abs_m]}'"
                        )
                    minute_owner[abs_m] = band.name

                next_day = (day + 1) % 7
                for m in range(end_m):
                    abs_m = _minute_of_week(next_day, m)
                    if abs_m in minute_owner:
                        raise ValueError(
                            f"Overlapping price bands: '{band.name}' overlaps with '{minute_owner[abs_m]}'"
                        )
                    minute_owner[abs_m] = band.name


def is_within_opening_hours(
    start: datetime,
    duration_min: int,
    opening_hours: list[OpeningHoursSpan],
    tz_name: str = "Africa/Accra",
) -> bool:
    """Checks whether the requested session is fully within venue opening hours.

    Overnight rule: the part of an overnight span after midnight belongs to the
    PREVIOUS day.
    A session ending exactly at closing time is allowed; ending 1 minute later is rejected.
    """
    if not opening_hours:
        return False

    tz = ZoneInfo(tz_name)
    local_start = start.astimezone(tz)
    local_end = (start + timedelta(minutes=duration_min)).astimezone(tz)

    # Check every minute from start up to (exclusive) end
    curr = local_start
    while curr < local_end:
        day = curr.weekday()  # 0=Mon, ..., 6=Sun
        minute = curr.hour * 60 + curr.minute
        prev_day = (day - 1) % 7

        is_open_minute = False
        for span in opening_hours:
            if span.opens_minute < span.closes_minute:
                # Normal same-day span
                if span.day == day and span.opens_minute <= minute < span.closes_minute:
                    is_open_minute = True
                    break
            else:
                # Overnight span:
                # 1) Part on start day: [opens_minute, 1440)
                if span.day == day and minute >= span.opens_minute:
                    is_open_minute = True
                    break
                # 2) Part after midnight: [0, closes_minute) belonging to PREVIOUS day
                if span.day == prev_day and minute < span.closes_minute:
                    is_open_minute = True
                    break

        if not is_open_minute:
            return False

        curr += timedelta(minutes=1)

    return True


def get_active_rate_for_chunk(
    chunk_start: datetime,
    bands: list[PriceBand],
    fallback_hourly_rate: int | None,
    tz_name: str = "Africa/Accra",
) -> int | None:
    """Resolves hourly rate for a 30-minute segment starting at chunk_start in Africa/Accra.

    Overnight rule applies: minutes after midnight belong to the previous day's overnight span.
    """
    tz = ZoneInfo(tz_name)
    local_dt = chunk_start.astimezone(tz)
    day = local_dt.weekday()
    minute = local_dt.hour * 60 + local_dt.minute
    prev_day = (day - 1) % 7

    for band in bands:
        if band.start_minute < band.end_minute:
            # Same day band
            if day in band.days and band.start_minute <= minute < band.end_minute:
                return band.hourly_rate_pesewas
        else:
            # Overnight band:
            if day in band.days and minute >= band.start_minute:
                return band.hourly_rate_pesewas
            if prev_day in band.days and minute < band.end_minute:
                return band.hourly_rate_pesewas

    return fallback_hourly_rate


def calculate_boundary_court_fee(
    start: datetime,
    duration_min: int,
    bands: list[PriceBand],
    fallback_hourly_rate: int | None,
    duration_multiplier_bps: int = 10000,
    tz_name: str = "Africa/Accra",
) -> int | None:
    """Calculates court fee across 30-minute segments using single-division ceil rounding.

    Rules:
    1. Duration must be strictly 60, 90, or 120 minutes.
    2. Start must be on a 30-minute boundary (:00 or :30).
    3. Accumulate `segment_rate * 30` across all 30-min segments into total minute-pesewas.
    4. Divide by 60 once with ceil division: `base_fee = -(-accumulated // 60)`.
    5. Duration multiplier adjustment: `adjusted_fee = -(- (base_fee * duration_multiplier_bps) // 10000)`.
       Multiplier of 10000 bps returns exact base fee.
    If any segment has no price configured, returns None (unpriced).
    """
    if duration_min not in (60, 90, 120):
        raise ValueError("Duration must be strictly 60, 90, or 120 minutes")

    if start.minute not in (0, 30) or start.second != 0 or start.microsecond != 0:
        raise ValueError("Session start must be on a 30-minute boundary (:00 or :30)")

    chunks_count = duration_min // 30
    total_minute_pesewas = 0

    for i in range(chunks_count):
        chunk_start = start + timedelta(minutes=i * 30)
        rate = get_active_rate_for_chunk(
            chunk_start=chunk_start,
            bands=bands,
            fallback_hourly_rate=fallback_hourly_rate,
            tz_name=tz_name,
        )
        if rate is None or rate <= 0:
            return None  # Unpriced
        total_minute_pesewas += rate * 30

    # Single-division ceil rounding
    base_court_fee = -(-total_minute_pesewas // 60)

    # Multiplier adjustment on top of pro-rata pricing
    if duration_multiplier_bps <= 0:
        raise ValueError("Duration multiplier bps must be positive")

    adjusted_court_fee = -(-(base_court_fee * duration_multiplier_bps) // 10000)
    return adjusted_court_fee


def validate_quote_start_time(
    start: datetime,
    now: datetime | None = None,
    clock_skew_seconds: int = 300,
    max_future_days: int = 90,
) -> None:
    """Validate quote start time.

    - Rejects start times in the past, allowing clock_skew_seconds tolerance (default 5 min).
    - Rejects start times more than max_future_days (default 90 days) in the future.
    """
    if now is None:
        now = datetime.now(UTC)
    if start.tzinfo is None:
        raise ValueError("start time must be timezone-aware")

    # Past time check with clock skew tolerance
    if start < now - timedelta(seconds=clock_skew_seconds):
        raise ValueError("Cannot request a quote for a start time in the past")

    # Max future days check
    if start > now + timedelta(days=max_future_days):
        raise ValueError(
            f"Cannot request a quote more than {max_future_days} days in advance"
        )


def calculate_stateless_quote(
    venue_id: str,
    court_id: str,
    start: datetime,
    duration_min: int,
    bands: list[PriceBand],
    fallback_hourly_rate: int | None,
    duration_multiplier_bps: int = 10000,
    venue_add_ons_config: list[dict[str, Any]] | None = None,
    requested_add_ons: list[str] | None = None,
    platform_fee_pesewas: int = 500,
    tax_enabled: bool = False,
    tax_rate_bps: int = 0,
    taxable_lines: list[str] | None = None,
    tax_label: str = "VAT & NHIL",
    tz_name: str = "Africa/Accra",
    quote_id: str = "quote_preview",
) -> QuoteResult:
    """Pure domain function to compute a stateless quote.

    Returns QuoteResult with is_priced=False if unpriced.
    """
    court_fee = calculate_boundary_court_fee(
        start=start,
        duration_min=duration_min,
        bands=bands,
        fallback_hourly_rate=fallback_hourly_rate,
        duration_multiplier_bps=duration_multiplier_bps,
        tz_name=tz_name,
    )

    if court_fee is None:
        return QuoteResult(
            quote_id=quote_id,
            lines=[],
            court_fee_pesewas=0,
            platform_fee_pesewas=0,
            add_ons_pesewas=0,
            tax_pesewas=0,
            total_pesewas=0,
            is_priced=False,
        )

    lines: list[QuoteLine] = [
        QuoteLine(
            label=f"Court Session ({duration_min} min)",
            amount_pesewas=court_fee,
            line_type="court_fee",
        ),
        QuoteLine(
            label="Platform Fee",
            amount_pesewas=platform_fee_pesewas,
            line_type="platform_fee",
        ),
    ]

    # Process add-ons
    add_ons_pesewas = 0
    venue_add_ons = {item["id"]: item for item in (venue_add_ons_config or [])}

    for add_on_id in requested_add_ons or []:
        if add_on_id not in venue_add_ons:
            raise ValueError(f"unknown add-on '{add_on_id}'")
        item = venue_add_ons[add_on_id]
        price = item.get("price_pesewas", 0)
        if price < 0:
            raise ValueError(f"Negative price for add-on '{add_on_id}'")
        add_ons_pesewas += price
        lines.append(
            QuoteLine(
                label=item.get("name", add_on_id),
                amount_pesewas=price,
                line_type="add_on",
            )
        )

    # Tax computation (taxable lines default to court_fee and add_on; platform fee excluded)
    tax_pesewas = 0
    if tax_enabled and tax_rate_bps > 0:
        tax_filter = set(taxable_lines or ["court_fee", "add_on"])
        taxable_total = sum(
            line.amount_pesewas for line in lines if line.line_type in tax_filter
        )
        tax_pesewas = (taxable_total * tax_rate_bps) // 10000
        if tax_pesewas > 0:
            lines.append(
                QuoteLine(
                    label=tax_label,
                    amount_pesewas=tax_pesewas,
                    line_type="tax",
                )
            )

    total_pesewas = court_fee + platform_fee_pesewas + add_ons_pesewas + tax_pesewas

    return QuoteResult(
        quote_id=quote_id,
        lines=lines,
        court_fee_pesewas=court_fee,
        platform_fee_pesewas=platform_fee_pesewas,
        add_ons_pesewas=add_ons_pesewas,
        tax_pesewas=tax_pesewas,
        total_pesewas=total_pesewas,
        is_priced=True,
    )


def sign_quote_token(payload: dict[str, Any], keyring: dict[str, str]) -> str:
    """Signs canonical JSON quote token using HMAC-SHA256 with key_id lookup."""
    key_id = payload.get("key_id", "v1")
    if key_id not in keyring:
        raise KeyError(f"Unknown key_id '{key_id}' in keyring")
    secret = keyring[key_id]

    # Canonical JSON string: sorted keys, compact separators
    canonical_json = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    payload_b64 = (
        base64.urlsafe_b64encode(canonical_json.encode("utf-8"))
        .decode("utf-8")
        .rstrip("=")
    )
    sig = hmac.new(
        secret.encode("utf-8"), canonical_json.encode("utf-8"), hashlib.sha256
    ).hexdigest()
    return f"{payload_b64}.{sig}"


def verify_quote_token(
    token: str,
    keyring: dict[str, str],
    now: datetime | None = None,
    max_age_seconds: int = 86400,  # 24h absolute max token age
) -> dict[str, Any] | None:
    """Verifies HMAC signature, key_id, 24h absolute max age, and expiry.

    Returns payload dict if signature is valid.
    Includes "is_expired": True/False.
    Returns None if signature is invalid, key_id unknown, or max token age exceeded.
    """
    now_utc = now or datetime.now(UTC)
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        payload_b64, sig = parts

        # Add base64 padding if needed
        padding = "=" * (-len(payload_b64) % 4)
        raw_json = base64.urlsafe_b64decode(payload_b64 + padding).decode("utf-8")
        payload = json.loads(raw_json)

        key_id = payload.get("key_id", "v1")
        if key_id not in keyring:
            return None
        secret = keyring[key_id]

        # Canonical JSON comparison
        canonical_json = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        expected_sig = hmac.new(
            secret.encode("utf-8"), canonical_json.encode("utf-8"), hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(sig, expected_sig):
            return None

        # Check absolute max token age (24h)
        issued_at_str = payload.get("issued_at") or payload.get("created_at")
        if issued_at_str:
            issued_at = datetime.fromisoformat(issued_at_str)
            if (now_utc - issued_at).total_seconds() > max_age_seconds:
                return None  # Token exceeded absolute max age

        # Check expiry
        expires_at_str = payload.get("expires_at")
        is_expired = False
        if expires_at_str:
            expires_at = datetime.fromisoformat(expires_at_str)
            if now_utc > expires_at:
                is_expired = True

        result = dict(payload)
        result["is_expired"] = is_expired
        return result
    except (ValueError, KeyError, json.JSONDecodeError, UnicodeDecodeError):
        return None
