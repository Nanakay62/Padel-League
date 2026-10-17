"""Tests for club back-office core: profile, drafts, courts, pricing, staff, and audit."""

import hashlib
import uuid
from datetime import UTC, datetime, timedelta

import pytest
from httpx import ASGITransport, AsyncClient

from app.audit.models import AuditLog
from app.authz.policy import ClubRole
from app.identity.models import User, UserSession
from app.main import app
from app.notify.email import default_email_provider
from app.venues.models import Venue, VenueMembership


@pytest.fixture(autouse=True)
def clear_email_provider() -> None:
    default_email_provider.clear()


async def create_test_club_session(
    db,
    user_id: str,
    venue_id: str,
    role: str = "CLUB_OWNER",
    session_cookie: str = "test_club_sess",
) -> tuple[User, Venue, VenueMembership, UserSession]:
    user = User(
        id=user_id,
        name=f"User {user_id}",
        email=f"{user_id}@accrapadel.com",
        role="PLAYER",
    )
    venue = Venue(
        id=venue_id,
        name=f"Venue {venue_id}",
        address="Airport Residential",
        base_rate_pesewas_per_hour=10000,
        price_version=1,
    )
    membership = VenueMembership(
        id=str(uuid.uuid4()),
        user_id=user.id,
        venue_id=venue.id,
        role=role,
        status="ACTIVE",
    )
    token_hash = hashlib.sha256(session_cookie.encode("utf-8")).hexdigest()
    session = UserSession(
        id=str(uuid.uuid4()),
        user_id=user.id,
        session_token_hash=token_hash,
        venue_id=venue.id,
        role=role,
        host_type="CLUB",
        expires_at=datetime.now(UTC) + timedelta(hours=12),
    )
    db.add_all([user, venue, membership, session])
    await db.commit()
    return user, venue, membership, session


@pytest.mark.asyncio
async def test_club_profile_read_and_edit_with_audit(prepare_database: None) -> None:
    from tests.conftest import test_session_maker

    cookie = "sess_profile_test"
    async with test_session_maker() as db:
        await create_test_club_session(
            db, user_id="u-prof", venue_id="v-prof", session_cookie=cookie
        )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        client.cookies.set("padel_club_session", cookie)

        # 1. Read profile
        res_get = await client.get("/portal/club/venue")
        assert res_get.status_code == 200
        data = res_get.json()
        assert data["id"] == "v-prof"
        assert data["name"] == "Venue v-prof"

        # 2. Update profile
        res_put = await client.put(
            "/portal/club/venue/profile",
            json={
                "name": "Updated Accra Padel Club",
                "description": "Premium 4-court facility with night lighting.",
                "booking_phone": "+233241234567",
                "booking_whatsapp": "+233241234567",
                "ghanapost_gps": "GA-183-9021",
                "maps_url": "https://maps.google.com/?q=AccraPadel",
                "amenities": ["Parking", "Showers", "Pro Shop"],
            },
        )
        assert res_put.status_code == 200
        updated = res_put.json()
        assert updated["name"] == "Updated Accra Padel Club"
        assert updated["ghanapost_gps"] == "GA-183-9021"
        assert len(updated["amenities"]) == 3

    # Assert audit log was recorded
    async with test_session_maker() as db:
        v = await db.get(Venue, "v-prof")
        assert v is not None
        assert v.name == "Updated Accra Padel Club"

        from sqlalchemy import select

        audit_res = await db.execute(
            select(AuditLog).where(
                AuditLog.venue_id == "v-prof",
                AuditLog.action == "VENUE_PROFILE_EDIT",
            )
        )
        audit_log = audit_res.scalars().first()
        assert audit_log is not None
        assert audit_log.actor_id == "u-prof"
        assert audit_log.old_value["name"] == "Venue v-prof"
        assert audit_log.new_value["name"] == "Updated Accra Padel Club"


@pytest.mark.asyncio
async def test_club_draft_save_and_retrieve(prepare_database: None) -> None:
    from tests.conftest import test_session_maker

    cookie = "sess_draft_test"
    async with test_session_maker() as db:
        await create_test_club_session(
            db, user_id="u-draft", venue_id="v-draft", session_cookie=cookie
        )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        client.cookies.set("padel_club_session", cookie)

        # 1. Save draft
        put_res = await client.put(
            "/portal/club/drafts/profile",
            json={
                "draft_payload": {
                    "description": "Work in progress description...",
                    "notes": "Need to verify lighting hours",
                }
            },
        )
        assert put_res.status_code == 200
        assert put_res.json()["section"] == "profile"

        # 2. Retrieve draft
        get_res = await client.get("/portal/club/drafts/profile")
        assert get_res.status_code == 200
        data = get_res.json()
        assert data["draft_payload"]["description"] == "Work in progress description..."


@pytest.mark.asyncio
async def test_club_courts_crud_and_price_version_bump(prepare_database: None) -> None:
    from tests.conftest import test_session_maker

    cookie = "sess_courts_test"
    async with test_session_maker() as db:
        await create_test_club_session(
            db, user_id="u-court", venue_id="v-court", session_cookie=cookie
        )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        client.cookies.set("padel_club_session", cookie)

        # 1. Add court
        post_res = await client.post(
            "/portal/club/courts",
            json={
                "court_number": 1,
                "is_indoor": False,
                "surface": "Turf",
                "lighting": "LED 500 Lux",
                "notes": "Main showcase court",
            },
        )
        assert post_res.status_code == 200
        court_data = post_res.json()
        court_id = court_data["id"]
        assert court_data["court_number"] == 1

        # Check price_version bumped
        v_res = await client.get("/portal/club/venue")
        assert v_res.json()["price_version"] >= 2

        # 2. Edit court with custom court rate
        put_res = await client.put(
            f"/portal/club/courts/{court_id}",
            json={
                "court_number": 1,
                "is_indoor": False,
                "surface": "Turf",
                "lighting": "LED 500 Lux",
                "notes": "Updated notes",
                "base_rate_pesewas_per_hour": 14000,
            },
        )
        assert put_res.status_code == 200
        assert put_res.json()["base_rate_pesewas_per_hour"] == 14000

        # Check price_version bumped again
        v_res2 = await client.get("/portal/club/venue")
        assert v_res2.json()["price_version"] >= 3

        # 3. Delete court
        del_res = await client.delete(f"/portal/club/courts/{court_id}")
        assert del_res.status_code == 200

        # Check courts list is empty
        list_res = await client.get("/portal/club/courts")
        assert list_res.status_code == 200
        assert len(list_res.json()) == 0


@pytest.mark.asyncio
async def test_club_pricing_update_enforces_integer_pesewas(
    prepare_database: None,
) -> None:
    from tests.conftest import test_session_maker

    cookie = "sess_pricing_test"
    async with test_session_maker() as db:
        await create_test_club_session(
            db, user_id="u-price", venue_id="v-price", session_cookie=cookie
        )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        client.cookies.set("padel_club_session", cookie)

        # Valid pricing update in integer pesewas
        res = await client.put(
            "/portal/club/pricing",
            json={
                "base_rate_pesewas_per_hour": 16000,
                "price_bands": [
                    {
                        "name": "Peak Evening",
                        "rate_pesewas_per_hour": 20000,
                        "days": ["mon", "tue", "wed", "thu", "fri"],
                        "start_time": "17:00",
                        "end_time": "22:00",
                    }
                ],
                "duration_multipliers_bps": {
                    "60": 10000,
                    "90": 10000,
                    "120": 10000,
                },
                "opening_hours": [
                    {
                        "day": "mon",
                        "spans": [{"start_time": "06:00", "end_time": "23:00"}],
                    }
                ],
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["base_rate_pesewas_per_hour"] == 16000
        assert len(data["price_bands"]) == 1
        assert data["price_bands"][0]["rate_pesewas_per_hour"] == 20000


@pytest.mark.asyncio
async def test_club_staff_invite_and_role_permissions(prepare_database: None) -> None:
    from tests.conftest import test_session_maker

    cookie_owner = "sess_owner"
    cookie_admin = "sess_admin"

    async with test_session_maker() as db:
        await create_test_club_session(
            db,
            user_id="u-owner",
            venue_id="v-staff",
            role=ClubRole.CLUB_OWNER,
            session_cookie=cookie_owner,
        )
        # Add another user as CLUB_ADMIN to the same venue
        admin_user = User(
            id="u-admin",
            name="Club Admin",
            email="admin@accrapadel.com",
            role="PLAYER",
        )
        admin_mem = VenueMembership(
            id="mem-admin-1",
            user_id=admin_user.id,
            venue_id="v-staff",
            role=ClubRole.CLUB_ADMIN,
            status="ACTIVE",
        )
        admin_token_hash = hashlib.sha256(cookie_admin.encode()).hexdigest()
        admin_sess = UserSession(
            id="sess-admin-row",
            user_id=admin_user.id,
            session_token_hash=admin_token_hash,
            venue_id="v-staff",
            role=ClubRole.CLUB_ADMIN,
            host_type="CLUB",
            expires_at=datetime.now(UTC) + timedelta(hours=12),
        )
        db.add_all([admin_user, admin_mem, admin_sess])
        await db.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. CLUB_ADMIN cannot invite staff -> 403 Forbidden
        client.cookies.set("padel_club_session", cookie_admin)
        admin_invite_res = await client.post(
            "/portal/club/staff/invite",
            json={
                "email": "coach@accrapadel.com",
                "role": "CLUB_ADMIN",
            },
        )
        assert admin_invite_res.status_code == 403
        assert "club owner" in admin_invite_res.json()["detail"].lower()

        # 2. CLUB_OWNER can invite staff -> 200 OK
        client.cookies.set("padel_club_session", cookie_owner)
        owner_invite_res = await client.post(
            "/portal/club/staff/invite",
            json={
                "email": "coach@accrapadel.com",
                "role": "CLUB_ADMIN",
            },
        )
        assert owner_invite_res.status_code == 200
        assert owner_invite_res.json()["email"] == "coach@accrapadel.com"

        # Check invite email was sent
        assert len(default_email_provider.sent_messages) == 1
        assert default_email_provider.sent_messages[0].to == "coach@accrapadel.com"


@pytest.mark.asyncio
async def test_club_audit_scoping(prepare_database: None) -> None:
    from tests.conftest import test_session_maker

    cookie_a = "sess_audit_a"
    cookie_b = "sess_audit_b"

    async with test_session_maker() as db:
        await create_test_club_session(
            db, user_id="u-aud-a", venue_id="v-aud-a", session_cookie=cookie_a
        )
        await create_test_club_session(
            db, user_id="u-aud-b", venue_id="v-aud-b", session_cookie=cookie_b
        )

        # Create audit logs
        log_a = AuditLog(
            id=str(uuid.uuid4()),
            actor_id="u-aud-a",
            actor_kind="USER",
            venue_id="v-aud-a",
            action="VENUE_PROFILE_EDIT",
            target_type="venue",
            target_id="v-aud-a",
            details="Changed club bio for A",
        )
        log_b = AuditLog(
            id=str(uuid.uuid4()),
            actor_id="u-aud-b",
            actor_kind="USER",
            venue_id="v-aud-b",
            action="VENUE_PROFILE_EDIT",
            target_type="venue",
            target_id="v-aud-b",
            details="Changed club bio for B",
        )
        db.add_all([log_a, log_b])
        await db.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        client.cookies.set("padel_club_session", cookie_a)

        res = await client.get("/portal/club/audit")
        assert res.status_code == 200
        logs = res.json()
        assert len(logs) == 1
        assert logs[0]["venue_id"] == "v-aud-a"
        assert logs[0]["details"] == "Changed club bio for A"


@pytest.mark.asyncio
async def test_club_pricing_get_endpoint(prepare_database: None) -> None:
    from tests.conftest import test_session_maker

    cookie = "sess_pricing_get_test"
    async with test_session_maker() as db:
        await create_test_club_session(
            db, user_id="u-price-get", venue_id="v-price-get", session_cookie=cookie
        )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        client.cookies.set("padel_club_session", cookie)

        res = await client.get("/portal/club/pricing")
        assert res.status_code == 200
        data = res.json()
        assert data["venue_id"] == "v-price-get"
        assert data["base_rate_pesewas"] == 10000
        assert data["currency"] == "GHS"
        assert "GH₵" in data["formatted_base_rate"]
        assert data["price_version"] >= 1
        assert "duration_multipliers" in data
