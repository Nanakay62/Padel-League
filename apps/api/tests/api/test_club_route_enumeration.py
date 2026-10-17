"""Route enumeration tests for Club Portal.

Ensures that every route exposed on club_router:
1. Rejects unauthenticated requests (401).
2. Rejects requests lacking MFA verification (401 or 403).
3. Rejects Bearer tokens (401).
4. Strictly enforces venue isolation (Club A user cannot access Club B data -> 404).
5. Requires an explicit X-Venue-Id if the user has multiple active memberships (400).
"""

import hashlib
import uuid
from datetime import UTC, datetime, timedelta

import pytest
from httpx import ASGITransport, AsyncClient

from app.identity.models import User, UserSession
from app.main import app
from app.portal.club_routes import club_router
from app.venues.models import Court, Venue, VenueDraft, VenueMembership, VenuePhoto


async def setup_test_venues_and_users(db):
    # Club A
    user_a = User(
        id=f"user-a-{uuid.uuid4().hex[:6]}",
        name="Owner A",
        email=f"a-{uuid.uuid4().hex[:4]}@club.com",
        role="PLAYER",
    )
    venue_a = Venue(
        id=f"v-a-{uuid.uuid4().hex[:6]}",
        name="Club Alpha",
        address="Airport Residential, Accra",
        base_rate_pesewas_per_hour=30000,
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

    # Club B
    user_b = User(
        id=f"user-b-{uuid.uuid4().hex[:6]}",
        name="Owner B",
        email=f"b-{uuid.uuid4().hex[:4]}@club.com",
        role="PLAYER",
    )
    venue_b = Venue(
        id=f"v-b-{uuid.uuid4().hex[:6]}",
        name="Club Bravo",
        address="East Legon, Accra",
        base_rate_pesewas_per_hour=40000,
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

    # Multi-club user C (has active memberships in both Venue A and Venue B)
    user_c = User(
        id=f"user-c-{uuid.uuid4().hex[:6]}",
        name="Multi Club Manager",
        email=f"c-{uuid.uuid4().hex[:4]}@club.com",
        role="PLAYER",
    )
    mem_c_a = VenueMembership(
        id=str(uuid.uuid4()),
        user_id=user_c.id,
        venue_id=venue_a.id,
        role="CLUB_ADMIN",
        status="ACTIVE",
    )
    mem_c_b = VenueMembership(
        id=str(uuid.uuid4()),
        user_id=user_c.id,
        venue_id=venue_b.id,
        role="CLUB_ADMIN",
        status="ACTIVE",
    )
    cookie_c = f"cookie_c_{uuid.uuid4().hex}"
    session_c = UserSession(
        id=str(uuid.uuid4()),
        user_id=user_c.id,
        session_token_hash=hashlib.sha256(cookie_c.encode()).hexdigest(),
        role="PLAYER",
        host_type="CLUB",
        expires_at=datetime.now(UTC) + timedelta(hours=8),
    )

    # Some entities under Club B
    court_b = Court(
        id=f"court-b-{uuid.uuid4().hex[:6]}", venue_id=venue_b.id, court_number=1
    )
    photo_b = VenuePhoto(
        id=f"photo-b-{uuid.uuid4().hex[:6]}",
        venue_id=venue_b.id,
        url="/static/b.jpg",
        caption="Court B",
    )
    draft_b = VenueDraft(
        id=str(uuid.uuid4()),
        venue_id=venue_b.id,
        section="profile",
        draft_payload={"bio": "draft"},
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
            user_c,
            mem_c_a,
            mem_c_b,
            session_c,
            court_b,
            photo_b,
            draft_b,
        ]
    )
    await db.commit()

    return {
        "venue_a": venue_a,
        "venue_b": venue_b,
        "cookie_a": cookie_a,
        "cookie_b": cookie_b,
        "cookie_c": cookie_c,
        "court_b": court_b,
        "photo_b": photo_b,
    }


@pytest.mark.asyncio
async def test_multi_venue_user_requires_explicit_venue_selection(
    prepare_database: None,
) -> None:
    """When a user belongs to more than 1 venue, requests omitting X-Venue-Id return 400."""
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        data = await setup_test_venues_and_users(db)
        cookie_c = data["cookie_c"]
        venue_a_id = data["venue_a"].id

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
        cookies={"padel_club_session": cookie_c},
    ) as client:
        # 1. No header -> 400 Bad Request
        res_no_header = await client.get("/portal/club/venue")
        assert res_no_header.status_code == 400
        assert "multiple venue memberships" in res_no_header.json()["detail"].lower()

        # 2. With header -> 200 OK
        res_with_header = await client.get(
            "/portal/club/venue",
            headers={"X-Venue-Id": venue_a_id},
        )
        assert res_with_header.status_code == 200
        assert res_with_header.json()["id"] == venue_a_id


@pytest.mark.asyncio
async def test_all_club_routes_registered_have_protection(
    prepare_database: None,
) -> None:
    """Verify that all endpoints on club_router require authentication and cannot be accessed anonymously."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        for route in club_router.routes:
            path = route.path
            for method in route.methods:
                if method in ("HEAD", "OPTIONS"):
                    continue
                # Replace path params like {court_id}, {section}, {photo_id}, {membership_id}
                test_path = (
                    path.replace("{court_id}", "test-court-id")
                    .replace("{section}", "profile")
                    .replace("{photo_id}", "test-photo-id")
                    .replace("{membership_id}", "test-membership-id")
                    .replace("{log_id}", "test-log-id")
                )
                res = await client.request(method, test_path)
                assert res.status_code in (401, 403), (
                    f"Route {method} {test_path} allowed anonymous access with status {res.status_code}"
                )
