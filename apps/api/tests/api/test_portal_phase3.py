"""Test suite for Phase 3 hardening:
1. M6: price_hash recalculation in venues/models.py reflects staged/deleted courts.
2. M7: Chunked photo streaming with 5 MB limit and magic-byte inspection (JPEG, PNG, WebP).
"""

import hashlib
import io
import uuid
from datetime import UTC, datetime, timedelta

import pytest
from httpx import ASGITransport, AsyncClient

from app.config import settings
from app.identity.models import User, UserSession
from app.main import app
from app.venues.models import Court, Venue, VenueMembership, compute_venue_price_hash


async def setup_club_with_owner(db, venue_name="Phase 3 Club"):
    from app.domain.totp import encrypt_totp_secret

    enc_secret = encrypt_totp_secret("JBSWY3DPEHPK3PXP", settings.totp_encryption_key)

    owner = User(
        id=f"owner-{uuid.uuid4().hex[:6]}",
        name="Club Owner",
        email=f"owner-{uuid.uuid4().hex[:4]}@phase3.com",
        role="PLAYER",
        totp_secret_enc=enc_secret,
        totp_enabled_at=datetime.now(UTC),
    )
    venue = Venue(
        id=f"v-{uuid.uuid4().hex[:6]}",
        name=venue_name,
        address="Phase 3 Boulevard, Accra",
        base_rate_pesewas_per_hour=35000,
        price_version=1,
    )
    membership = VenueMembership(
        id=str(uuid.uuid4()),
        user_id=owner.id,
        venue_id=venue.id,
        role="CLUB_OWNER",
        status="ACTIVE",
    )
    cookie = f"cookie_{uuid.uuid4().hex}"
    session = UserSession(
        id=str(uuid.uuid4()),
        user_id=owner.id,
        session_token_hash=hashlib.sha256(cookie.encode()).hexdigest(),
        role="PLAYER",
        host_type="CLUB",
        expires_at=datetime.now(UTC) + timedelta(hours=8),
    )
    db.add_all([owner, venue, membership, session])
    await db.commit()
    return {"owner": owner, "venue": venue, "cookie": cookie, "membership": membership}


@pytest.mark.asyncio
async def test_price_hash_reflects_staged_and_deleted_courts(
    prepare_database: None,
) -> None:
    """When courts are added or deleted in a session, price_hash matches fresh recomputation."""
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        club = await setup_club_with_owner(db)
        venue_id = club["venue"].id

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
        cookies={"padel_club_session": club["cookie"]},
    ) as client:
        # 1. Add court 1
        res_c1 = await client.post(
            "/portal/club/courts",
            json={
                "court_number": 1,
                "is_indoor": False,
                "surface": "Turf",
                "base_rate_pesewas_per_hour": 40000,
            },
        )
        assert res_c1.status_code == 200
        c1_id = res_c1.json()["id"]

        # Check venue pricing hash matches fresh compute
        async with test_session_maker() as db:
            venue = await db.get(Venue, venue_id)
            assert venue is not None
            c1 = await db.get(Court, c1_id)
            expected_hash = compute_venue_price_hash(venue, [c1] if c1 else [])
            assert venue.price_hash == expected_hash

        # 2. Add court 2
        res_c2 = await client.post(
            "/portal/club/courts",
            json={
                "court_number": 2,
                "is_indoor": True,
                "surface": "Pro Turf",
                "base_rate_pesewas_per_hour": 45000,
            },
        )
        assert res_c2.status_code == 200
        c2_id = res_c2.json()["id"]

        async with test_session_maker() as db:
            venue = await db.get(Venue, venue_id)
            assert venue is not None
            c1 = await db.get(Court, c1_id)
            c2 = await db.get(Court, c2_id)
            expected_hash = compute_venue_price_hash(venue, [c1, c2])
            assert venue.price_hash == expected_hash

        # 3. Delete court 1
        res_del = await client.delete(f"/portal/club/courts/{c1_id}")
        assert res_del.status_code == 200

        async with test_session_maker() as db:
            venue = await db.get(Venue, venue_id)
            assert venue is not None
            c2 = await db.get(Court, c2_id)
            expected_hash = compute_venue_price_hash(venue, [c2] if c2 else [])
            assert venue.price_hash == expected_hash


@pytest.mark.asyncio
async def test_photo_upload_magic_byte_validation(prepare_database: None) -> None:
    """Non-image files disguised as JPEG/PNG/WebP are rejected via magic-byte inspection."""
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        club = await setup_club_with_owner(db)
        cookie = club["cookie"]

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
        cookies={"padel_club_session": cookie},
    ) as client:
        # Fake JPEG (text content)
        fake_jpeg = io.BytesIO(
            b"Hello world, this is an executable or text disguised as image"
        )
        res_fake = await client.post(
            "/portal/club/photos",
            files={"file": ("malicious.jpg", fake_jpeg, "image/jpeg")},
        )
        assert res_fake.status_code == 400
        assert (
            "magic" in res_fake.json()["detail"].lower()
            or "invalid" in res_fake.json()["detail"].lower()
        )


@pytest.mark.asyncio
async def test_photo_upload_valid_formats_succeed(prepare_database: None) -> None:
    """Valid JPEG, PNG, and WebP payloads with proper headers succeed."""
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        club = await setup_club_with_owner(db)
        cookie = club["cookie"]

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
        cookies={"padel_club_session": cookie},
    ) as client:
        # Valid JPEG header
        valid_jpeg = io.BytesIO(
            b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00"
            + b"\x00" * 100
        )
        res_jpg = await client.post(
            "/portal/club/photos",
            files={"file": ("court1.jpg", valid_jpeg, "image/jpeg")},
            data={"caption": "Main Court JPEG"},
        )
        assert res_jpg.status_code == 200
        assert res_jpg.json()["photo"]["caption"] == "Main Court JPEG"

        # Valid PNG header
        valid_png = io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR" + b"\x00" * 100)
        res_png = await client.post(
            "/portal/club/photos",
            files={"file": ("court2.png", valid_png, "image/png")},
            data={"caption": "Main Court PNG"},
        )
        assert res_png.status_code == 200
        assert res_png.json()["photo"]["caption"] == "Main Court PNG"

        # Valid WebP header
        valid_webp = io.BytesIO(b"RIFF\x20\x00\x00\x00WEBPVP8 " + b"\x00" * 100)
        res_webp = await client.post(
            "/portal/club/photos",
            files={"file": ("court3.webp", valid_webp, "image/webp")},
            data={"caption": "Main Court WebP"},
        )
        assert res_webp.status_code == 200
        assert res_webp.json()["photo"]["caption"] == "Main Court WebP"


@pytest.mark.asyncio
async def test_photo_upload_exceeds_size_limit(prepare_database: None) -> None:
    """Uploading photo larger than 5 MB is aborted with 400 Bad Request."""
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        club = await setup_club_with_owner(db)
        cookie = club["cookie"]

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
        cookies={"padel_club_session": cookie},
    ) as client:
        # 5 MB + 1 KB with valid JPEG start
        oversized = io.BytesIO(b"\xff\xd8\xff\xe0" + b"X" * (5 * 1024 * 1024 + 1024))
        res_over = await client.post(
            "/portal/club/photos",
            files={"file": ("huge.jpg", oversized, "image/jpeg")},
        )
        assert res_over.status_code == 400
        assert "5 mb" in res_over.json()["detail"].lower()
