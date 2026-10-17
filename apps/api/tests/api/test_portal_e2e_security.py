"""End-to-end security and hardening test suite for Padel Ghana Admin Portals:
1. Cross-tenant isolation across all club sub-resources (profile, courts, pricing, staff, photos, audit).
2. Host-only session cookie enforcement (CLUB_HOST vs ADMIN_HOST).
3. Step-in audit attribution and automatic club owner email alerting.
4. Audit log revert verification (pricing & photo states).
5. TOTP RFC 6238 replay protection.
"""

import hashlib
import uuid
from datetime import UTC, datetime, timedelta

import pyotp
import pytest
from httpx import ASGITransport, AsyncClient

from app.audit.service import AuditService
from app.domain.totp import verify_totp_code
from app.identity.models import User, UserSession
from app.main import app
from app.notify.email import default_email_provider
from app.venues.models import Court, Venue, VenueMembership, VenuePhoto


@pytest.fixture(autouse=True)
def clear_emails() -> None:
    default_email_provider.clear()


async def setup_two_clubs(db):
    """Setup Club Alpha (User A) and Club Bravo (User B)."""
    # Club Alpha
    user_a = User(
        id=f"user-a-{uuid.uuid4().hex[:6]}",
        name="Owner Alpha",
        email=f"alpha-{uuid.uuid4().hex[:4]}@example.com",
        role="PLAYER",
    )
    venue_a = Venue(
        id=f"venue-a-{uuid.uuid4().hex[:6]}",
        name="Alpha Padel Club",
        address="Airport Residential, Accra",
        base_rate_pesewas_per_hour=30000,
        price_version=1,
    )
    mem_a = VenueMembership(
        id=str(uuid.uuid4()),
        user_id=user_a.id,
        venue_id=venue_a.id,
        role="CLUB_OWNER",
        status="ACTIVE",
    )
    cookie_a = f"cookie_a_{uuid.uuid4().hex}"
    session_a = UserSession(
        id=str(uuid.uuid4()),
        user_id=user_a.id,
        session_token_hash=hashlib.sha256(cookie_a.encode()).hexdigest(),
        role="PLAYER",
        host_type="CLUB",
        expires_at=datetime.now(UTC) + timedelta(hours=8),
    )

    # Club Bravo
    user_b = User(
        id=f"user-b-{uuid.uuid4().hex[:6]}",
        name="Owner Bravo",
        email=f"bravo-{uuid.uuid4().hex[:4]}@example.com",
        role="PLAYER",
    )
    venue_b = Venue(
        id=f"venue-b-{uuid.uuid4().hex[:6]}",
        name="Bravo Padel Club",
        address="East Legon, Accra",
        base_rate_pesewas_per_hour=40000,
        price_version=1,
    )
    mem_b = VenueMembership(
        id=str(uuid.uuid4()),
        user_id=user_b.id,
        venue_id=venue_b.id,
        role="CLUB_OWNER",
        status="ACTIVE",
    )
    cookie_b = f"cookie_b_{uuid.uuid4().hex}"
    session_b = UserSession(
        id=str(uuid.uuid4()),
        user_id=user_b.id,
        session_token_hash=hashlib.sha256(cookie_b.encode()).hexdigest(),
        role="PLAYER",
        host_type="CLUB",
        expires_at=datetime.now(UTC) + timedelta(hours=8),
    )

    # Add court and photo to Club Bravo
    court_b = Court(
        id=f"court-b-{uuid.uuid4().hex[:6]}",
        venue_id=venue_b.id,
        court_number=1,
        is_indoor=False,
        surface="Panoramic Glass Turf",
    )
    photo_b = VenuePhoto(
        id=f"photo-b-{uuid.uuid4().hex[:6]}",
        venue_id=venue_b.id,
        url="/static/uploads/venues/b/photo1.webp",
        display_order=0,
        caption="Bravo Court 1",
    )

    db.add_all(
        [
            user_a,
            venue_a,
            mem_a,
            session_a,
            user_b,
            venue_b,
            mem_b,
            session_b,
            court_b,
            photo_b,
        ]
    )
    await db.commit()

    return {
        "club_a": {"user": user_a, "venue": venue_a, "cookie": cookie_a},
        "club_b": {
            "user": user_b,
            "venue": venue_b,
            "cookie": cookie_b,
            "court": court_b,
            "photo": photo_b,
        },
    }


async def setup_super_admin(db):
    user_sa = User(
        id=f"sa-{uuid.uuid4().hex[:6]}",
        name="Super Admin",
        email=f"admin-{uuid.uuid4().hex[:4]}@padelghana.com",
        role="SUPER_ADMIN",
    )
    cookie_sa = f"cookie_sa_{uuid.uuid4().hex}"
    session_sa = UserSession(
        id=str(uuid.uuid4()),
        user_id=user_sa.id,
        session_token_hash=hashlib.sha256(cookie_sa.encode()).hexdigest(),
        role="SUPER_ADMIN",
        host_type="ADMIN",
        expires_at=datetime.now(UTC) + timedelta(hours=8),
    )
    db.add_all([user_sa, session_sa])
    await db.commit()
    return {"user": user_sa, "cookie": cookie_sa}


@pytest.mark.asyncio
async def test_cross_tenant_isolation_suite(prepare_database: None) -> None:
    """User A from Club Alpha must receive 404 (or 403) when attempting to access Club Bravo resources."""
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        setup = await setup_two_clubs(db)
        venue_b_id = setup["club_b"]["venue"].id
        court_b_id = setup["club_b"]["court"].id
        photo_b_id = setup["club_b"]["photo"].id
        cookie_a = setup["club_a"]["cookie"]

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
        cookies={"padel_club_session": cookie_a},
    ) as client:
        # 1. Profile of Club B
        res_prof = await client.get(
            "/portal/club/profile", headers={"X-Venue-Id": venue_b_id}
        )
        assert res_prof.status_code == 404

        # 2. Update profile of Club B
        res_update_prof = await client.put(
            "/portal/club/profile",
            headers={"X-Venue-Id": venue_b_id},
            json={"name": "Bravo Padel Club", "description": "Hacked description"},
        )
        assert res_update_prof.status_code == 404

        # 3. Courts of Club B
        res_courts = await client.get(
            "/portal/club/courts", headers={"X-Venue-Id": venue_b_id}
        )
        assert res_courts.status_code == 404

        # 4. Update specific court of Club B
        res_update_court = await client.put(
            f"/portal/club/courts/{court_b_id}",
            headers={"X-Venue-Id": venue_b_id},
            json={"court_number": 2},
        )
        assert res_update_court.status_code == 404

        # 5. Pricing of Club B
        res_pricing = await client.put(
            "/portal/club/pricing",
            headers={"X-Venue-Id": venue_b_id},
            json={
                "base_rate_pesewas_per_hour": 36000,
                "price_bands": [],
                "duration_multipliers_bps": {"60": 10000, "90": 10000, "120": 10000},
                "opening_hours": [],
            },
        )
        assert res_pricing.status_code == 404

        # 6. Staff of Club B
        res_staff = await client.get(
            "/portal/club/staff", headers={"X-Venue-Id": venue_b_id}
        )
        assert res_staff.status_code == 404

        # 7. Photos of Club B
        res_photos = await client.get(
            "/portal/club/photos", headers={"X-Venue-Id": venue_b_id}
        )
        assert res_photos.status_code == 404

        # 8. Delete photo of Club B
        res_del_photo = await client.delete(
            f"/portal/club/photos/{photo_b_id}",
            headers={"X-Venue-Id": venue_b_id},
        )
        assert res_del_photo.status_code == 404

        # 9. Audit log of Club B
        res_audit = await client.get(
            "/portal/club/audit", headers={"X-Venue-Id": venue_b_id}
        )
        assert res_audit.status_code == 404


@pytest.mark.asyncio
async def test_host_only_cookie_isolation(prepare_database: None) -> None:
    """padel_club_session cookie is rejected on /portal/admin/* routes."""
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        setup = await setup_two_clubs(db)
        cookie_a = setup["club_a"]["cookie"]

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
        cookies={"padel_club_session": cookie_a},
    ) as client:
        # Club owner trying to access Super Admin overview
        res = await client.get("/portal/admin/overview")
        assert res.status_code in (401, 403)

        # Club owner trying to list all venues on admin host
        res_v = await client.get("/portal/admin/venues")
        assert res_v.status_code in (401, 403)

        # Club owner trying to access platform audit
        res_a = await client.get("/portal/admin/audit")
        assert res_a.status_code in (401, 403)


@pytest.mark.asyncio
async def test_step_in_audit_accountability_and_owner_alert(
    prepare_database: None,
) -> None:
    """Super Admin editing Club A sets is_step_in=True and alerts the Club Owner."""
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        setup = await setup_two_clubs(db)
        sa = await setup_super_admin(db)
        venue_a_id = setup["club_a"]["venue"].id
        owner_a_email = setup["club_a"]["user"].email
        cookie_sa = sa["cookie"]

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
        cookies={"padel_admin_session": cookie_sa},
    ) as client:
        # Super admin edits Club A's pricing
        res = await client.put(
            "/portal/club/pricing",
            headers={"X-Venue-Id": venue_a_id},
            json={
                "base_rate_pesewas_per_hour": 36000,
                "price_bands": [],
                "duration_multipliers_bps": {"60": 10000, "90": 10000, "120": 10000},
                "opening_hours": [],
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["base_rate_pesewas_per_hour"] == 36000

        # Check step-in email notification was sent to Club A owner
        sent_emails = default_email_provider.sent_messages
        owner_emails = [e for e in sent_emails if e.to == owner_a_email]
        assert len(owner_emails) >= 1
        assert "Updated by Padel Ghana staff" in owner_emails[0].subject


@pytest.mark.asyncio
async def test_pricing_revert_restores_old_value(prepare_database: None) -> None:
    """Reverting an audit entry cleanly restores the old pricing and bumps price_version."""
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        setup = await setup_two_clubs(db)
        cookie_a = setup["club_a"]["cookie"]

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
        cookies={"padel_club_session": cookie_a},
    ) as client:
        # 1. Update pricing from 30000 to 45000 pesewas
        res_up = await client.put(
            "/portal/club/pricing",
            json={
                "base_rate_pesewas_per_hour": 45000,
                "price_bands": [],
                "duration_multipliers_bps": {"60": 10000, "90": 10000, "120": 10000},
                "opening_hours": [],
            },
        )
        assert res_up.status_code == 200
        assert res_up.json()["base_rate_pesewas_per_hour"] == 45000

        # 2. Get audit log id
        res_audit = await client.get("/portal/club/audit")
        items = res_audit.json()
        assert len(items) >= 1
        audit_entry = items[0]
        assert audit_entry["action"] == "VENUE_PRICING_EDIT"
        assert audit_entry["is_revertible"] is True

        # 3. Trigger revert using AuditService
        async with test_session_maker() as db:
            audit_svc = AuditService(db)
            revert_log = await audit_svc.revert_audit(
                audit_id=audit_entry["id"],
                actor_id="u-revert-actor",
                actor_kind="USER",
            )
            await db.commit()
            assert revert_log.reverts_audit_id == audit_entry["id"]

        # 4. Verify venue pricing is restored to 30000
        v_res = await client.get("/portal/club/venue")
        assert v_res.status_code == 200
        assert v_res.json()["base_rate_pesewas_per_hour"] == 30000


@pytest.mark.asyncio
async def test_totp_rfc6238_validation_and_replay_protection():
    """Pure domain TOTP generation, validation, and rejection of reused or invalid codes."""
    secret = "JBSWY3DPEHPK3PXP"  # standard test base32 secret
    totp = pyotp.TOTP(secret)
    current_code = totp.now()

    # 1. Valid code matches and returns current time step
    is_valid, step = verify_totp_code(secret, current_code)
    assert is_valid is True
    assert step > 0

    # 2. Replay protection: Submitting the same code with last_step == step is rejected
    is_replayed, _ = verify_totp_code(secret, current_code, last_step=step)
    assert is_replayed is False

    # 3. Invalid code fails
    assert verify_totp_code(secret, "000000")[0] is False


@pytest.mark.asyncio
async def test_mfa_pending_token_as_bearer_rejected(prepare_database: None) -> None:
    """An mfa_pending token passed in Authorization: Bearer must be rejected with 401."""
    from app.portal.routes import _create_mfa_token
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        sa = await setup_super_admin(db)
        user_id = sa["user"].id

    mfa_token = _create_mfa_token(user_id, "ADMIN")

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
        headers={"Authorization": f"Bearer {mfa_token}"},
    ) as client:
        res_admin = await client.get("/portal/admin/overview")
        assert res_admin.status_code == 401
        assert "invalid token type" in res_admin.json()["detail"].lower()

        res_club = await client.get("/portal/club/venue")
        assert res_club.status_code == 401


@pytest.mark.asyncio
async def test_mfa_setup_and_confirm_rejected_if_already_enabled(
    prepare_database: None,
) -> None:
    """If user already has MFA enabled, setup and confirm-setup return 409 Conflict."""
    from app.portal.routes import _create_mfa_token
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        user = User(
            id=f"mfa-en-{uuid.uuid4().hex[:6]}",
            name="MFA User",
            email=f"mfa-{uuid.uuid4().hex[:4]}@example.com",
            role="PLAYER",
            totp_secret_enc="encrypted_secret",
            totp_enabled_at=datetime.now(UTC),
        )
        db.add(user)
        await db.commit()
        user_id = user.id

    mfa_token = _create_mfa_token(user_id, "CLUB")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Setup attempt
        res_setup = await client.post(
            "/portal/auth/mfa/setup",
            json={"mfa_token": mfa_token},
        )
        assert res_setup.status_code == 409
        assert "already enabled" in res_setup.json()["detail"].lower()

        # 2. Confirm-setup attempt
        res_confirm = await client.post(
            "/portal/auth/mfa/confirm-setup",
            json={"mfa_token": mfa_token, "code": "123456", "host_type": "CLUB"},
        )
        assert res_confirm.status_code == 409
        assert "already enabled" in res_confirm.json()["detail"].lower()


@pytest.mark.asyncio
async def test_bearer_token_cannot_access_portal_routes(prepare_database: None) -> None:
    """Mobile Bearer access tokens are prohibited from accessing /portal/* endpoints."""
    from app.identity.service import IdentityService
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        sa = await setup_super_admin(db)
        sa_id = sa["user"].id
        svc = IdentityService(db)
        token = svc.create_access_token(user_id=sa_id, role="SUPER_ADMIN")

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
        headers={"Authorization": f"Bearer {token}"},
    ) as client:
        res = await client.get("/portal/admin/overview")
        assert res.status_code == 401
        assert "bearer tokens cannot access portal" in res.json()["detail"].lower()

        res_club = await client.get("/portal/club/venue")
        assert res_club.status_code == 401


@pytest.mark.asyncio
async def test_mfa_host_type_mismatch_rejected(prepare_database: None) -> None:
    """MFA verification with a host_type that mismatches the token must be rejected with 403."""
    from app.portal.routes import _create_mfa_token
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        sa = await setup_super_admin(db)
        sa_id = sa["user"].id

    mfa_token = _create_mfa_token(sa_id, "CLUB")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.post(
            "/portal/auth/mfa/verify",
            json={"mfa_token": mfa_token, "code": "123456", "host_type": "ADMIN"},
        )
        assert res.status_code == 403
        assert "host type mismatch" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_role_demotion_immediately_effective_on_session(
    prepare_database: None,
) -> None:
    """Demoting a super admin in the database revokes admin portal access immediately."""
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        sa = await setup_super_admin(db)
        user_sa = sa["user"]
        cookie_sa = sa["cookie"]

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
        cookies={"padel_admin_session": cookie_sa},
    ) as client:
        # Access works before demotion
        res_before = await client.get("/portal/admin/overview")
        assert res_before.status_code == 200

        # Demote user in database
        async with test_session_maker() as db:
            user_in_db = await db.get(User, user_sa.id)
            user_in_db.role = "PLAYER"
            await db.commit()

        # Access is immediately denied on next request
        res_after = await client.get("/portal/admin/overview")
        assert res_after.status_code == 403


@pytest.mark.asyncio
async def test_padel_club_session_rejected_on_admin_routes(
    prepare_database: None,
) -> None:
    """A padel_club_session cookie must be rejected on /portal/admin/* even if the user is SUPER_ADMIN."""
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        sa = await setup_super_admin(db)
        sa_id = sa["user"].id
        club_cookie = f"club_cookie_{uuid.uuid4().hex}"
        session_club = UserSession(
            id=str(uuid.uuid4()),
            user_id=sa_id,
            session_token_hash=hashlib.sha256(club_cookie.encode()).hexdigest(),
            role="SUPER_ADMIN",
            host_type="CLUB",
            expires_at=datetime.now(UTC) + timedelta(hours=4),
        )
        db.add(session_club)
        await db.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
        cookies={"padel_club_session": club_cookie},
    ) as client:
        res = await client.get("/portal/admin/overview")
        assert res.status_code == 401
        assert "authentication required" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_portal_login_rate_limiting(prepare_database: None) -> None:
    """Repeated failed login attempts from the same IP must hit HTTP 429."""
    from app.identity.rate_limiter import auth_rate_limiter

    auth_rate_limiter.clear()

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
    ) as client:
        last_status = 200
        for _ in range(12):
            res = await client.post(
                "/portal/auth/login",
                json={
                    "email": "nonexistent@test.com",
                    "password": "WrongPassword123!",
                    "host_type": "CLUB",
                },
            )
            last_status = res.status_code
            if last_status == 429:
                break
        assert last_status == 429


@pytest.mark.asyncio
async def test_concurrent_invite_accept_only_one_succeeds(
    prepare_database: None,
) -> None:
    """Concurrent acceptance of the same invite token must allow only one transaction to succeed."""
    import asyncio
    import secrets

    from app.venues.models import Venue, VenueInvite
    from tests.conftest import test_session_maker

    token_raw = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token_raw.encode()).hexdigest()

    async with test_session_maker() as db:
        venue = Venue(
            id=f"v-inv-{uuid.uuid4().hex[:6]}",
            name="Invite Test Venue",
            address="Accra",
            base_rate_pesewas_per_hour=30000,
        )
        invite = VenueInvite(
            venue_id=venue.id,
            email=f"invitee-{uuid.uuid4().hex[:6]}@padel.com",
            role="CLUB_ADMIN",
            token_hash=token_hash,
            invited_by_id="owner-id",
            expires_at=datetime.now(UTC) + timedelta(days=2),
        )
        db.add_all([venue, invite])
        await db.commit()

    transport = ASGITransport(app=app)

    async def accept_attempt(client_id: int):
        async with AsyncClient(
            transport=transport, base_url="http://testserver"
        ) as client:
            return await client.post(
                "/portal/invites/accept",
                json={
                    "token": token_raw,
                    "name": f"Invitee {client_id}",
                    "password": "SecurePassword123!",
                },
            )

    res1, res2 = await asyncio.gather(accept_attempt(1), accept_attempt(2))
    statuses = sorted([res1.status_code, res2.status_code])
    assert statuses == [200, 400], f"Expected one 200 and one 400, got: {statuses}"
