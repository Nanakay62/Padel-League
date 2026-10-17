"""Tests for Super Admin platform core: overview KPIs, venues directory & registration,
step-in alerts to club owners, global audit trail, and platform settings.
"""

import hashlib
import uuid
from datetime import UTC, datetime, timedelta

import pytest
from httpx import ASGITransport, AsyncClient

from app.audit.models import AuditLog
from app.identity.models import User, UserSession
from app.main import app
from app.notify.email import default_email_provider
from app.venues.models import Court, Venue, VenueMembership


@pytest.fixture(autouse=True)
def clear_email_provider() -> None:
    default_email_provider.clear()


async def create_test_super_admin_session(
    db,
    admin_id: str = "sa-test-1",
    session_cookie: str = "test_sa_cookie",
) -> tuple[User, UserSession]:
    user = User(
        id=admin_id,
        name="Platform Administrator",
        email="superadmin@padelghana.com",
        role="SUPER_ADMIN",
    )
    token_hash = hashlib.sha256(session_cookie.encode("utf-8")).hexdigest()
    session = UserSession(
        id=str(uuid.uuid4()),
        user_id=user.id,
        session_token_hash=token_hash,
        role="SUPER_ADMIN",
        host_type="ADMIN",
        expires_at=datetime.now(UTC) + timedelta(hours=12),
    )
    db.add_all([user, session])
    await db.commit()
    return user, session


async def create_test_club_owner_session(
    db,
    user_id: str = "owner-test-1",
    venue_id: str = "v-test-owner",
    session_cookie: str = "test_owner_cookie",
) -> tuple[User, Venue, VenueMembership, UserSession]:
    user = User(
        id=user_id,
        name="Club Owner Alpha",
        email="owner@alphapadel.com",
        role="PLAYER",
    )
    venue = Venue(
        id=venue_id,
        name="Alpha Padel Club",
        address="Cantonments, Accra",
        base_rate_pesewas_per_hour=35000,
        price_version=1,
    )
    membership = VenueMembership(
        id=str(uuid.uuid4()),
        user_id=user.id,
        venue_id=venue.id,
        role="CLUB_OWNER",
        status="ACTIVE",
    )
    token_hash = hashlib.sha256(session_cookie.encode("utf-8")).hexdigest()
    session = UserSession(
        id=str(uuid.uuid4()),
        user_id=user.id,
        session_token_hash=token_hash,
        venue_id=venue.id,
        role="CLUB_OWNER",
        host_type="CLUB",
        expires_at=datetime.now(UTC) + timedelta(hours=12),
    )
    db.add_all([user, venue, membership, session])
    await db.commit()
    return user, venue, membership, session


@pytest.mark.asyncio
async def test_super_admin_auth_guard(prepare_database: None) -> None:
    """Non-super-admin users must be strictly rejected from /portal/admin/*."""
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        await create_test_super_admin_session(db, "sa-guard", "sa_guard_cookie")
        await create_test_club_owner_session(
            db, "owner-guard", "v-guard", "owner_guard_cookie"
        )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Unauthenticated request -> 401
        unauth_res = await client.get("/portal/admin/overview")
        assert unauth_res.status_code in (401, 403)

        # 2. Club Owner trying to access admin overview -> 401 Unauthorized / 403 Forbidden
        client.cookies.set("padel_club_session", "owner_guard_cookie")
        owner_res = await client.get("/portal/admin/overview")
        assert owner_res.status_code in (401, 403)

        # 3. Super Admin with admin cookie -> 200 OK
        client.cookies.delete("padel_club_session")
        client.cookies.set("padel_admin_session", "sa_guard_cookie")
        admin_res = await client.get("/portal/admin/overview")
        assert admin_res.status_code == 200


@pytest.mark.asyncio
async def test_super_admin_overview_metrics(prepare_database: None) -> None:
    """Overview endpoint must return real KPIs for venues, courts, and users."""
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        await create_test_super_admin_session(db, "sa-overview", "sa_overview_cookie")
        _, venue, _, _ = await create_test_club_owner_session(
            db, "owner-ov", "v-ov", "owner_ov_cookie"
        )
        c1 = Court(id="c-ov-1", venue_id=venue.id, court_number=1, is_indoor=False)
        c2 = Court(id="c-ov-2", venue_id=venue.id, court_number=2, is_indoor=True)
        db.add_all([c1, c2])
        await db.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        client.cookies.set("padel_admin_session", "sa_overview_cookie")
        res = await client.get("/portal/admin/overview")
        assert res.status_code == 200
        data = res.json()
        assert data["total_venues"] >= 1
        assert data["total_courts"] >= 2
        assert "total_users" in data
        assert "total_audit_events" in data


@pytest.mark.asyncio
async def test_super_admin_register_venue_and_invite_owner(
    prepare_database: None,
) -> None:
    """Super Admin can register a new club and send an invite to the club owner."""
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        await create_test_super_admin_session(db, "sa-reg", "sa_reg_cookie")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        client.cookies.set("padel_admin_session", "sa_reg_cookie")

        # 1. Register a new venue
        res = await client.post(
            "/portal/admin/venues",
            json={
                "name": "Osu Padel Club",
                "address": "Oxford Street, Osu, Accra",
                "ghana_gps": "GA-042-8891",
                "owner_email": "founder@osupadel.com",
                "initial_courts_count": 3,
                "base_rate_pesewas": 30000,
            },
        )
        assert res.status_code == 201
        data = res.json()
        venue_id = data["venue"]["id"]
        assert data["venue"]["name"] == "Osu Padel Club"
        assert data["venue"]["base_rate_pesewas"] == 30000
        assert data["invite"]["email"] == "founder@osupadel.com"
        assert data["invite"]["role"] == "CLUB_OWNER"

        # 2. Email was dispatched to owner
        sent_emails = default_email_provider.sent_messages
        owner_emails = [m for m in sent_emails if m.to == "founder@osupadel.com"]
        assert len(owner_emails) >= 1
        assert "invitation" in owner_emails[0].subject.lower()
        assert "token=" in owner_emails[0].body_text

        # 3. Check AuditLog entry
        async with test_session_maker() as db:
            venue_db = await db.get(Venue, venue_id)
            assert venue_db is not None
            assert venue_db.name == "Osu Padel Club"

            # Check courts created
            from sqlalchemy import select

            courts = (
                await db.scalars(select(Court).where(Court.venue_id == venue_id))
            ).all()
            assert len(courts) == 3

            # Check audit log
            audit = (
                await db.scalars(select(AuditLog).where(AuditLog.target_id == venue_id))
            ).first()
            assert audit is not None
            assert audit.action == "VENUE_REGISTER"
            assert audit.actor_id == "sa-reg"


@pytest.mark.asyncio
async def test_super_admin_step_in_alerts_club_owner(prepare_database: None) -> None:
    """When a super admin steps in and edits a club venue, the club owner receives an alert."""
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        await create_test_super_admin_session(db, "sa-stepin", "sa_stepin_cookie")
        owner, venue, _, _ = await create_test_club_owner_session(
            db, "owner-stepin", "v-stepin", "owner_stepin_cookie"
        )
        owner_email = owner.email
        venue_id = venue.id

    default_email_provider.clear()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Super admin performs step-in edit on venue
        client.cookies.set("padel_admin_session", "sa_stepin_cookie")
        res = await client.put(
            "/portal/club/profile",
            headers={"X-Venue-Id": venue_id},
            json={
                "name": "Alpha Padel Club (Updated by Admin)",
                "phone": "+233240001111",
            },
        )
        assert res.status_code == 200
        assert res.json().get("is_step_in") is True

        # Owner must receive alert email
        sent_emails = default_email_provider.sent_messages
        alert_emails = [m for m in sent_emails if m.to == owner_email]
        assert len(alert_emails) >= 1
        assert "updated by padel ghana staff" in alert_emails[0].subject.lower()
        assert "Padel Ghana platform staff" in alert_emails[0].body_text


@pytest.mark.asyncio
async def test_super_admin_global_audit_trail(prepare_database: None) -> None:
    """Super Admin can search and filter the global audit trail."""
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        await create_test_super_admin_session(db, "sa-audit", "sa_audit_cookie")
        log1 = AuditLog(
            id=str(uuid.uuid4()),
            action="VENUE_UPDATE",
            target_type="venue",
            target_id="v-audit-1",
            actor_id="sa-audit",
            created_at=datetime.now(UTC),
        )
        log2 = AuditLog(
            id=str(uuid.uuid4()),
            action="PAYMENT_OVERRIDE",
            target_type="registration",
            target_id="reg-123",
            actor_id="sa-audit",
            created_at=datetime.now(UTC),
        )
        db.add_all([log1, log2])
        await db.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        client.cookies.set("padel_admin_session", "sa_audit_cookie")
        res = await client.get("/portal/admin/audit")
        assert res.status_code == 200
        data = res.json()
        assert "items" in data
        assert len(data["items"]) >= 2

        # Filter by action
        res_filter = await client.get("/portal/admin/audit?action=PAYMENT_OVERRIDE")
        assert res_filter.status_code == 200
        filtered = res_filter.json()["items"]
        assert all(item["action"] == "PAYMENT_OVERRIDE" for item in filtered)


@pytest.mark.asyncio
async def test_super_admin_platform_settings(prepare_database: None) -> None:
    """Super Admin can retrieve and update global system configuration."""
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        await create_test_super_admin_session(db, "sa-settings", "sa_settings_cookie")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        client.cookies.set("padel_admin_session", "sa_settings_cookie")

        # 1. Read settings
        res = await client.get("/portal/admin/settings")
        assert res.status_code == 200
        data = res.json()
        assert "allow_multi_venue_per_user" in data
        assert data["currency"] == "GHS"
        assert data["timezone"] == "Africa/Accra"

        # 2. Update settings
        put_res = await client.put(
            "/portal/admin/settings",
            json={
                "allow_multi_venue_per_user": True,
                "platform_announcement": "Welcome to Padel Ghana!",
            },
        )
        assert put_res.status_code == 200
        updated = put_res.json()["settings"]
        assert updated["allow_multi_venue_per_user"] is True
        assert updated["platform_announcement"] == "Welcome to Padel Ghana!"
