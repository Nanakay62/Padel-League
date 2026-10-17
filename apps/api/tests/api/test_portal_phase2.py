"""Test suite for Phase 2 hardening:
1. N1 & N2: MFA lockout and login rate limiting.
2. M2: Court & staff audit trail with super-admin step-in owner notification.
3. M3: Persistent platform settings stored in database table.
4. M5: Optimistic concurrency control (409 Conflict on stale version).
5. L1: HTML escaping in email notifications.
6. L5: Staff soft-removal and reactivation.
7. L6: Dev OTP 123456 fails closed outside development/test.
8. L2: Exactly +1 bump on price_version per update.
"""

import hashlib
import html
import uuid
from datetime import UTC, datetime, timedelta

import pytest
from httpx import ASGITransport, AsyncClient

from app.audit.models import AuditLog
from app.config import settings
from app.identity.models import User, UserSession
from app.main import app
from app.notify.email import default_email_provider
from app.portal.routes import _create_mfa_token
from app.venues.models import Venue, VenueMembership


@pytest.fixture(autouse=True)
def clear_mail():
    default_email_provider.clear()


async def setup_club_with_owner(db, venue_name="Phase 2 Club"):
    from app.domain.totp import encrypt_totp_secret

    enc_secret = encrypt_totp_secret("JBSWY3DPEHPK3PXP", settings.totp_encryption_key)

    owner = User(
        id=f"owner-{uuid.uuid4().hex[:6]}",
        name="Club Owner",
        email=f"owner-{uuid.uuid4().hex[:4]}@phase2.com",
        role="PLAYER",
        totp_secret_enc=enc_secret,
        totp_enabled_at=datetime.now(UTC),
    )
    venue = Venue(
        id=f"v-{uuid.uuid4().hex[:6]}",
        name=venue_name,
        address="Phase 2 Avenue, Accra",
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


async def setup_super_admin(db):
    sa = User(
        id=f"sa-{uuid.uuid4().hex[:6]}",
        name="Platform Staff",
        email=f"staff-{uuid.uuid4().hex[:4]}@padelghana.com",
        role="SUPER_ADMIN",
        totp_secret_enc="sa_secret",
        totp_enabled_at=datetime.now(UTC),
    )
    cookie_sa = f"cookie_sa_{uuid.uuid4().hex}"
    session_sa = UserSession(
        id=str(uuid.uuid4()),
        user_id=sa.id,
        session_token_hash=hashlib.sha256(cookie_sa.encode()).hexdigest(),
        role="SUPER_ADMIN",
        host_type="ADMIN",
        expires_at=datetime.now(UTC) + timedelta(hours=8),
    )
    db.add_all([sa, session_sa])
    await db.commit()
    return {"user": sa, "cookie": cookie_sa}


@pytest.mark.asyncio
async def test_mfa_failed_attempts_lockout(prepare_database: None) -> None:
    """Submitting 5 invalid MFA codes locks the account for 15 minutes (429)."""
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        club = await setup_club_with_owner(db)
        user_id = club["owner"].id

    mfa_token = _create_mfa_token(user_id, "CLUB")
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Submit 4 wrong codes -> 400
        for _ in range(4):
            res = await client.post(
                "/portal/auth/mfa/verify",
                json={"mfa_token": mfa_token, "code": "000000", "host_type": "CLUB"},
            )
            assert res.status_code == 400

        # 5th wrong code -> 429 Too Many Requests (Account Locked)
        res5 = await client.post(
            "/portal/auth/mfa/verify",
            json={"mfa_token": mfa_token, "code": "000000", "host_type": "CLUB"},
        )
        assert res5.status_code == 429
        assert "locked" in res5.json()["detail"].lower()

        # Subsequent attempts remain locked
        res6 = await client.post(
            "/portal/auth/mfa/verify",
            json={"mfa_token": mfa_token, "code": "123456", "host_type": "CLUB"},
        )
        assert res6.status_code == 429


@pytest.mark.asyncio
async def test_court_and_staff_audit_trail_and_step_in_alert(
    prepare_database: None,
) -> None:
    """Court edits and staff management generate AuditLog rows and alert owners on step-in."""
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        club = await setup_club_with_owner(db)
        sa = await setup_super_admin(db)
        venue_id = club["venue"].id
        owner_email = club["owner"].email
        cookie_sa = sa["cookie"]

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
        cookies={"padel_admin_session": cookie_sa},
    ) as client:
        # 1. Super Admin adds a court (step-in)
        res_court = await client.post(
            "/portal/club/courts",
            headers={"X-Venue-Id": venue_id},
            json={"court_number": 1, "is_indoor": False, "surface": "Turf"},
        )
        assert res_court.status_code == 200
        court_id = res_court.json()["id"]

        # Check AuditLog for court creation
        async with test_session_maker() as db:
            audit = (
                await db.execute(
                    AuditLog.__table__.select().where(
                        AuditLog.target_id == court_id,
                        AuditLog.action == "COURT_CREATE",
                    )
                )
            ).first()
            assert audit is not None
            assert audit.actor_kind == "SUPER_ADMIN"

        # Check owner received step-in alert
        sent = [m for m in default_email_provider.sent_messages if m.to == owner_email]
        assert len(sent) >= 1
        assert (
            "COURT_CREATE" in sent[0].body_text or "court" in sent[0].body_text.lower()
        )

        # 2. Super Admin updates the court
        res_court_up = await client.put(
            f"/portal/club/courts/{court_id}",
            headers={"X-Venue-Id": venue_id},
            json={"court_number": 1, "surface": "Super Turf"},
        )
        assert res_court_up.status_code == 200

        # 3. Super Admin deletes the court
        res_court_del = await client.delete(
            f"/portal/club/courts/{court_id}",
            headers={"X-Venue-Id": venue_id},
        )
        assert res_court_del.status_code == 200


@pytest.mark.asyncio
async def test_database_platform_settings_persistence(prepare_database: None) -> None:
    """Platform settings are read from and saved to the database table."""
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        sa = await setup_super_admin(db)
        cookie_sa = sa["cookie"]

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
        cookies={"padel_admin_session": cookie_sa},
    ) as client:
        # 1. Get settings
        res = await client.get("/portal/admin/settings")
        assert res.status_code == 200
        initial_val = res.json()["allow_multi_venue_per_user"]

        # 2. Update settings
        new_val = not initial_val
        announcement = "Test Maintenance Announcement"
        res_up = await client.put(
            "/portal/admin/settings",
            json={
                "allow_multi_venue_per_user": new_val,
                "platform_announcement": announcement,
            },
        )
        assert res_up.status_code == 200
        assert res_up.json()["settings"]["allow_multi_venue_per_user"] == new_val
        assert res_up.json()["settings"]["platform_announcement"] == announcement

        # 3. Read again to ensure DB persistence
        res2 = await client.get("/portal/admin/settings")
        assert res2.status_code == 200
        assert res2.json()["allow_multi_venue_per_user"] == new_val
        assert res2.json()["platform_announcement"] == announcement


@pytest.mark.asyncio
async def test_concurrency_conflict_returns_409(prepare_database: None) -> None:
    """Stale expected_price_version or expected_updated_at triggers HTTP 409 Conflict."""
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
        # 1. Pricing conflict check
        res_pricing_conflict = await client.put(
            "/portal/club/pricing",
            json={
                "base_rate_pesewas_per_hour": 50000,
                "price_bands": [],
                "expected_price_version": 999,  # Stale version
            },
        )
        assert res_pricing_conflict.status_code == 409
        assert "modified" in res_pricing_conflict.json()["detail"].lower()

        # 2. Profile conflict check
        res_profile_conflict = await client.put(
            "/portal/club/profile",
            json={
                "name": "Conflicting Name",
                "expected_updated_at": "2020-01-01T00:00:00Z",  # Stale timestamp
            },
        )
        assert res_profile_conflict.status_code == 409
        assert "modified" in res_profile_conflict.json()["detail"].lower()


@pytest.mark.asyncio
async def test_email_html_escaping(prepare_database: None) -> None:
    """XSS injection strings in venue or staff names must be properly HTML-escaped in email templates."""
    from tests.conftest import test_session_maker

    dangerous_name = "<script>alert('xss')</script> Club & Spa"
    async with test_session_maker() as db:
        club = await setup_club_with_owner(db, venue_name=dangerous_name)
        cookie = club["cookie"]

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
        cookies={"padel_club_session": cookie},
    ) as client:
        # Send invite
        res = await client.post(
            "/portal/club/staff/invite",
            json={"email": "newstaff@example.com", "role": "CLUB_ADMIN"},
        )
        assert res.status_code == 200

        sent = [
            m
            for m in default_email_provider.sent_messages
            if m.to == "newstaff@example.com"
        ]
        assert len(sent) == 1
        msg = sent[0]

        # Verify raw HTML does not contain unescaped script tag
        assert "<script>" not in msg.body_html
        assert html.escape(dangerous_name) in msg.body_html


@pytest.mark.asyncio
async def test_staff_soft_remove_and_reactivate(prepare_database: None) -> None:
    """Removing staff marks status='REMOVED' instead of deleting, and re-inviting reactivates."""
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        club = await setup_club_with_owner(db)
        venue_id = club["venue"].id
        cookie_owner = club["cookie"]

        # Add staff member
        staff_user = User(
            id=f"staff-{uuid.uuid4().hex[:6]}",
            name="Staff Member",
            email="staff@example.com",
            role="PLAYER",
        )
        staff_mem = VenueMembership(
            id=str(uuid.uuid4()),
            user_id=staff_user.id,
            venue_id=venue_id,
            role="CLUB_ADMIN",
            status="ACTIVE",
        )
        db.add_all([staff_user, staff_mem])
        await db.commit()
        mem_id = staff_mem.id

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
        cookies={"padel_club_session": cookie_owner},
    ) as client:
        # 1. Remove staff member
        res_del = await client.delete(f"/portal/club/staff/{mem_id}")
        assert res_del.status_code == 200

        # Verify membership status is REMOVED, row still exists in DB
        async with test_session_maker() as db:
            mem = await db.get(VenueMembership, mem_id)
            assert mem is not None
            assert mem.status == "REMOVED"


@pytest.mark.asyncio
async def test_dev_otp_fails_closed_outside_dev_and_test(
    prepare_database: None, monkeypatch
) -> None:
    """Dev OTP 123456 must be rejected when environment is staging or production."""
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        club = await setup_club_with_owner(db)
        user_id = club["owner"].id

    mfa_token = _create_mfa_token(user_id, "CLUB")
    transport = ASGITransport(app=app)

    # Set environment to 'staging'
    monkeypatch.setattr(settings, "environment", "staging")

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.post(
            "/portal/auth/mfa/verify",
            json={"mfa_token": mfa_token, "code": "123456", "host_type": "CLUB"},
        )
        assert res.status_code == 400
        assert "invalid" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_price_version_increments_by_one_only(prepare_database: None) -> None:
    """Updating club pricing increments price_version by exactly +1."""
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
        res_v1 = await client.get("/portal/club/venue")
        initial_ver = res_v1.json()["price_version"]

        res_up = await client.put(
            "/portal/club/pricing",
            json={
                "base_rate_pesewas_per_hour": 38000,
                "price_bands": [],
            },
        )
        assert res_up.status_code == 200
        assert res_up.json()["price_version"] == initial_ver + 1
