"""Integration tests for quote engine, pricing freshness, rate limiting, and checkout verification."""

import time
import uuid
from datetime import UTC, datetime, timedelta

import pytest
from httpx import ASGITransport, AsyncClient

from app.config import settings
from app.db import Base
from app.domain.money import sign_quote_token
from app.identity.models import User
from app.identity.service import IdentityService
from app.main import app
from app.venues.models import Court, Venue
from app.venues.rate_limit import get_client_ip, quote_limiter
from tests.conftest import db_session_maker, test_engine


@pytest.fixture(autouse=True)
async def setup_test_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.mark.asyncio
async def test_rate_limiter_spoofed_proxy_header_from_untrusted_peer_ignored():
    """Spoofed CF-Connecting-IP and X-Forwarded-For from an untrusted peer are ignored."""
    from types import SimpleNamespace

    fake_request = SimpleNamespace(
        client=SimpleNamespace(host="198.51.100.42"),
        headers={
            "cf-connecting-ip": "1.1.1.1",
            "x-forwarded-for": "1.1.1.1, 10.0.0.1",
        },
    )

    # Direct peer 198.51.100.42 is NOT in trusted_proxies
    client_ip = get_client_ip(fake_request, trusted_proxies=["127.0.0.1", "10.0.0.1"])
    assert client_ip == "198.51.100.42"  # Spoofed headers completely ignored!


@pytest.mark.asyncio
async def test_rate_limiter_trusted_proxy_header_selects_rightmost_untrusted():
    """When direct peer is trusted, selects CF-Connecting-IP, or right-most untrusted in XFF."""
    from types import SimpleNamespace

    # 1. CF-Connecting-IP has priority
    req_with_cf = SimpleNamespace(
        client=SimpleNamespace(host="127.0.0.1"),
        headers={"cf-connecting-ip": "102.176.65.10"},
    )
    assert get_client_ip(req_with_cf, trusted_proxies=["127.0.0.1"]) == "102.176.65.10"

    # 2. XFF walks backwards from right to find right-most untrusted
    req_with_xff = SimpleNamespace(
        client=SimpleNamespace(host="127.0.0.1"),
        headers={"x-forwarded-for": "203.0.113.195, 10.0.0.5, 10.0.0.6"},
    )

    # 10.0.0.5 and 10.0.0.6 are trusted proxies; 203.0.113.195 is untrusted client
    client_ip = get_client_ip(
        req_with_xff,
        trusted_proxies=["127.0.0.1", "10.0.0.5", "10.0.0.6"],
    )
    assert client_ip == "203.0.113.195"


@pytest.mark.asyncio
async def test_rate_limiter_idle_eviction_and_threshold():
    """Rate limiter evicts idle IP entries and raises 429 when limit is exceeded."""
    limiter = quote_limiter
    test_ip = "192.0.2.99"
    limiter._history.clear()

    # Hit 5 times with limit of 5
    for _ in range(5):
        limiter.check(test_ip, limit=5, window_seconds=60)

    # 6th hit should raise 429
    with pytest.raises(Exception) as exc_info:
        limiter.check(test_ip, limit=5, window_seconds=60)
    assert exc_info.value.status_code == 429

    # Fast forward idle eviction (timestamp is 70s in the past)
    now = time.time()
    limiter._history[test_ip] = [now - 70 for _ in limiter._history[test_ip]]
    limiter._evict_idle(now=now, window_seconds=60)
    assert test_ip not in limiter._history  # Evicted!


@pytest.mark.asyncio
async def test_price_version_hook_bumps_on_venue_and_court_edits():
    """Session before_flush hook bumps price_version and recalculates price_hash on pricing edits."""
    async with db_session_maker() as session:
        venue = Venue(
            id=str(uuid.uuid4()),
            name="Cantonments Padel Club",
            address="Cantonments, Accra",
            base_rate_pesewas_per_hour=15000,
            price_version=1,
        )
        session.add(venue)
        await session.flush()
        initial_version = venue.price_version
        initial_hash = venue.price_hash
        assert initial_hash != ""

        court = Court(
            id=str(uuid.uuid4()),
            venue_id=venue.id,
            court_number=1,
            base_rate_pesewas_per_hour=None,
        )
        session.add(court)
        await session.flush()

        # Adding a court with price override or modifying court price bumps venue version
        court.base_rate_pesewas_per_hour = 18000
        await session.flush()
        assert venue.price_version > initial_version
        assert venue.price_hash != initial_hash

        # Venue price band modification bumps version again
        old_version = venue.price_version
        venue.price_bands = [
            {
                "name": "Peak",
                "days": [0],
                "start_minute": 1000,
                "end_minute": 1200,
                "hourly_rate_pesewas": 20000,
            }
        ]
        await session.flush()
        assert venue.price_version > old_version


@pytest.mark.asyncio
async def test_stateless_quote_flow_and_unpriced_behavior():
    """POST /quotes computes valid quote without DB rows; unpriced courts return is_priced=false."""
    async with db_session_maker() as session:
        venue = Venue(
            id=str(uuid.uuid4()),
            name="Labone Club",
            address="Labone, Accra",
            base_rate_pesewas_per_hour=16000,
            add_ons_config=[
                {"id": "racket", "name": "Racket Rental", "price_pesewas": 3500}
            ],
        )
        court = Court(
            id=str(uuid.uuid4()),
            venue_id=venue.id,
            court_number=1,
        )
        unpriced_court = Court(
            id=str(uuid.uuid4()),
            venue_id=venue.id,
            court_number=2,
            price_bands=[
                {
                    "name": "Night",
                    "days": [0],
                    "start_minute": 1200,
                    "end_minute": 1320,
                    "hourly_rate_pesewas": 20000,
                }
            ],
            base_rate_pesewas_per_hour=None,  # Gaps unpriced!
        )
        session.add_all([venue, court, unpriced_court])
        await session.commit()
        v_id, c_id, unc_id = venue.id, court.id, unpriced_court.id

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Valid quote for court 1
        now = datetime.now(UTC)
        start_time = (now + timedelta(days=2)).replace(
            hour=14, minute=0, second=0, microsecond=0
        )
        res = await client.post(
            "/quotes",
            json={
                "venue_id": v_id,
                "court_id": c_id,
                "start": start_time.isoformat(),
                "duration_min": 60,
                "add_ons": ["racket"],
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["is_priced"] is True
        assert data["court_fee_pesewas"] == 16000
        assert data["platform_fee_pesewas"] == 500
        assert data["add_ons_pesewas"] == 3500
        assert data["total_pesewas"] == 20000
        assert data["token"] != ""

        # 2. Unpriced court (midday gap with no fallback rate)
        res_unpriced = await client.post(
            "/quotes",
            json={
                "venue_id": v_id,
                "court_id": unc_id,
                "start": start_time.isoformat(),
                "duration_min": 60,
                "add_ons": [],
            },
        )
        assert res_unpriced.status_code == 200
        data_unpriced = res_unpriced.json()
        assert data_unpriced["is_priced"] is False
        assert data_unpriced["token"] == ""


@pytest.mark.asyncio
async def test_malformed_stored_price_json_returns_is_priced_false_never_500():
    """Corrupted stored DB data safely returns is_priced=false ('Ask the club'), never HTTP 500."""
    async with db_session_maker() as session:
        venue = Venue(
            id=str(uuid.uuid4()),
            name="Glitch Club",
            address="Airport, Accra",
            base_rate_pesewas_per_hour=16000,
            # Corrupted price_bands structure (strings instead of ints, missing keys)
            price_bands=[{"invalid_key": "not an int"}],
        )
        court = Court(
            id=str(uuid.uuid4()),
            venue_id=venue.id,
            court_number=1,
            # Corrupted court multipliers
            duration_multipliers_bps={"60": "not_an_int"},  # type: ignore
        )
        session.add_all([venue, court])
        await session.commit()
        v_id, c_id = venue.id, court.id

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        start_time = (datetime.now(UTC) + timedelta(days=1)).replace(
            hour=10, minute=0, second=0, microsecond=0
        )
        res = await client.post(
            "/quotes",
            json={
                "venue_id": v_id,
                "court_id": c_id,
                "start": start_time.isoformat(),
                "duration_min": 60,
                "add_ons": [],
            },
        )
        assert res.status_code == 200  # Never a 500!
        data = res.json()
        assert data["is_priced"] is False
        assert data["token"] == ""


@pytest.mark.asyncio
async def test_add_ons_validation_rejects_unknown_ids():
    """Requested add-on id not configured on venue returns 422."""
    async with db_session_maker() as session:
        venue = Venue(
            id=str(uuid.uuid4()),
            name="East Legon Padel",
            address="East Legon, Accra",
            base_rate_pesewas_per_hour=15000,
            add_ons_config=[{"id": "racket", "name": "Racket", "price_pesewas": 3000}],
        )
        court = Court(id=str(uuid.uuid4()), venue_id=venue.id, court_number=1)
        session.add_all([venue, court])
        await session.commit()
        v_id, c_id = venue.id, court.id

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        start_time = (datetime.now(UTC) + timedelta(days=1)).replace(
            hour=11, minute=0, second=0, microsecond=0
        )
        res = await client.post(
            "/quotes",
            json={
                "venue_id": v_id,
                "court_id": c_id,
                "start": start_time.isoformat(),
                "duration_min": 60,
                "add_ons": ["non_existent_addon"],
            },
        )
        assert res.status_code == 422
        assert "Unknown add-on ID" in res.json()["detail"]


@pytest.mark.asyncio
async def test_checkout_verify_quote_auth_and_freshness_409():
    """verify-quote requires login; expired quote recomputes and returns 409 if price changed."""
    async with db_session_maker() as session:
        user = User(
            id=str(uuid.uuid4()),
            phone_e164="+233241234567",
            name="Kofi Mensah",
            role="PLAYER",
            is_active=True,
        )
        venue = Venue(
            id=str(uuid.uuid4()),
            name="Spintex Padel",
            address="Spintex, Accra",
            base_rate_pesewas_per_hour=15000,
        )
        court = Court(id=str(uuid.uuid4()), venue_id=venue.id, court_number=1)
        session.add_all([user, venue, court])
        await session.commit()
        u_id, v_id, c_id = user.id, venue.id, court.id
        auth_token = IdentityService(session).create_access_token(
            user_id=u_id, role="PLAYER"
        )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Unauthenticated request to verify-quote is rejected (401)
        res_no_auth = await client.post(
            "/checkout/verify-quote", json={"token": "some.token"}
        )
        assert res_no_auth.status_code == 401

        # 2. Expired token where price has NOT changed -> recomputed=True, returns 200
        start_dt = (datetime.now(UTC) + timedelta(days=2)).replace(
            hour=15, minute=0, second=0, microsecond=0
        )
        # 15000 court fee + 500 platform fee = 15500
        expired_token_payload = {
            "key_id": "v1",
            "venue_id": v_id,
            "court_id": c_id,
            "start": start_dt.isoformat(),
            "duration_min": 60,
            "add_ons": [],
            "total_pesewas": 15500,
            "price_version": 1,
            "expires_at": (
                datetime.now(UTC) - timedelta(minutes=5)
            ).isoformat(),  # Expired
            "created_at": (datetime.now(UTC) - timedelta(minutes=20)).isoformat(),
        }
        expired_token = sign_quote_token(
            expired_token_payload, keyring=settings.quote_keyring
        )

        res_verify_unchanged = await client.post(
            "/checkout/verify-quote",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"token": expired_token},
        )
        assert res_verify_unchanged.status_code == 200
        data_unchanged = res_verify_unchanged.json()
        assert data_unchanged["valid"] is True
        assert data_unchanged["recomputed"] is True
        assert data_unchanged["total_pesewas"] == 15500
        assert data_unchanged["new_token"] != expired_token

        # 3. Expired token where price HAS changed -> 409 Conflict!
        expired_with_old_price_payload = dict(
            expired_token_payload,
            total_pesewas=12000,  # Old total was 12000, current recomputed is 15500
        )
        expired_old_token = sign_quote_token(
            expired_with_old_price_payload, keyring=settings.quote_keyring
        )

        res_conflict = await client.post(
            "/checkout/verify-quote",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"token": expired_old_token},
        )
        assert res_conflict.status_code == 409
        assert "Price has changed" in res_conflict.json()["detail"]["message"]
