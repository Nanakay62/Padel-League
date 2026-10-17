"""Tests for Club Portal Photo Storage and Media Pipeline."""

import hashlib
import io
import uuid
from datetime import UTC, datetime, timedelta

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from app.audit.models import AuditLog
from app.identity.models import User, UserSession
from app.main import app
from app.venues.models import Venue, VenueMembership, VenuePhoto


async def create_club_session_for_photos(
    db,
    user_id: str,
    venue_id: str,
    role: str = "CLUB_OWNER",
    session_cookie: str = "photo_sess_cookie",
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
        address="Airport Residential, Accra",
        base_rate_pesewas_per_hour=30000,
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


# A minimal 1x1 valid PNG in bytes
TINY_PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc\xf8\xff\xff"
    b"?'\x05\xfe\x02\xfe\x01\x00\x00\x00/\x00\x01\x8c\x83\x05\x9f\x00\x00"
    b"\x00\x00IEND\xaeB`\x82"
)


@pytest.mark.asyncio
async def test_photo_upload_rejects_unsupported_format(prepare_database: None) -> None:
    """Uploads with unsupported MIME types must be rejected with 400 Bad Request."""
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        await create_club_session_for_photos(
            db, "u-photo-1", "v-photo-1", session_cookie="ck_unsupported"
        )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        client.cookies.set("padel_club_session", "ck_unsupported")

        # Attempt to upload PDF file
        files = {
            "file": (
                "rules.pdf",
                io.BytesIO(b"%PDF-1.4 Fake PDF Content"),
                "application/pdf",
            )
        }
        res = await client.post("/portal/club/photos/upload", files=files)
        assert res.status_code == 400
        assert "only jpeg, png, and webp are allowed" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_photo_upload_rejects_oversized_file(prepare_database: None) -> None:
    """Uploads exceeding 5 MB must be rejected with 400 Bad Request."""
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        await create_club_session_for_photos(
            db, "u-photo-2", "v-photo-2", session_cookie="ck_oversized"
        )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        client.cookies.set("padel_club_session", "ck_oversized")

        # 5 MB + 1 byte
        oversized_data = b"0" * (5 * 1024 * 1024 + 10)
        files = {"file": ("huge.jpg", io.BytesIO(oversized_data), "image/jpeg")}
        res = await client.post("/portal/club/photos/upload", files=files)
        assert res.status_code == 400
        assert "exceeds maximum limit of 5 mb" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_photo_upload_success_and_listing(prepare_database: None) -> None:
    """Uploading a valid PNG creates a VenuePhoto record and appears in list."""
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        await create_club_session_for_photos(
            db, "u-photo-3", "v-photo-3", session_cookie="ck_success"
        )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        client.cookies.set("padel_club_session", "ck_success")

        # Upload valid PNG
        files = {"file": ("court_view.png", io.BytesIO(TINY_PNG_BYTES), "image/png")}
        data = {
            "caption": "Panoramic Court 1 view",
            "display_order": 1,
        }
        res = await client.post("/portal/club/photos/upload", files=files, data=data)
        assert res.status_code == 201
        photo_info = res.json()["photo"]
        photo_id = photo_info["id"]
        assert photo_info["caption"] == "Panoramic Court 1 view"
        assert photo_info["display_order"] == 1
        assert photo_info["url"].startswith("/static/uploads/")

        # List photos
        list_res = await client.get("/portal/club/photos")
        assert list_res.status_code == 200
        photos = list_res.json()["photos"]
        assert len(photos) == 1
        assert photos[0]["id"] == photo_id
        assert photos[0]["caption"] == "Panoramic Court 1 view"

        # Verify AuditLog row
        async with test_session_maker() as db:
            audit = (
                await db.scalars(select(AuditLog).where(AuditLog.target_id == photo_id))
            ).first()
            assert audit is not None
            assert audit.action == "VENUE_PHOTO_UPLOAD"
            assert audit.actor_id == "u-photo-3"


@pytest.mark.asyncio
async def test_photo_update_caption_and_reorder(prepare_database: None) -> None:
    """Updating photo details updates caption and display order."""
    from tests.conftest import test_session_maker

    photo_id = "p-update-1"
    async with test_session_maker() as db:
        _, venue, _, _ = await create_club_session_for_photos(
            db, "u-photo-4", "v-photo-4", session_cookie="ck_update"
        )
        photo = VenuePhoto(
            id=photo_id,
            venue_id=venue.id,
            url="/static/uploads/venues/v-photo-4/sample.png",
            thumbnail_url="/static/uploads/venues/v-photo-4/sample.png",
            caption="Original Caption",
            display_order=5,
        )
        db.add(photo)
        await db.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        client.cookies.set("padel_club_session", "ck_update")

        res = await client.put(
            f"/portal/club/photos/{photo_id}",
            json={
                "caption": "Updated Sunset Court Caption",
                "display_order": 0,
            },
        )
        assert res.status_code == 200
        updated = res.json()["photo"]
        assert updated["caption"] == "Updated Sunset Court Caption"
        assert updated["display_order"] == 0

        # Verify DB update
        async with test_session_maker() as db:
            db_photo = await db.get(VenuePhoto, photo_id)
            assert db_photo is not None
            assert db_photo.caption == "Updated Sunset Court Caption"
            assert db_photo.display_order == 0


@pytest.mark.asyncio
async def test_photo_delete_and_audit(prepare_database: None) -> None:
    """Deleting a photo removes the database entry and writes an audit log."""
    from tests.conftest import test_session_maker

    photo_id = "p-del-1"
    async with test_session_maker() as db:
        _, venue, _, _ = await create_club_session_for_photos(
            db, "u-photo-5", "v-photo-5", session_cookie="ck_delete"
        )
        photo = VenuePhoto(
            id=photo_id,
            venue_id=venue.id,
            url="/static/uploads/venues/v-photo-5/del.png",
            thumbnail_url="/static/uploads/venues/v-photo-5/del.png",
            caption="To Be Deleted",
            display_order=1,
        )
        db.add(photo)
        await db.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        client.cookies.set("padel_club_session", "ck_delete")

        res = await client.delete(f"/portal/club/photos/{photo_id}")
        assert res.status_code == 200
        assert res.json()["deleted_photo_id"] == photo_id

        # Verify DB deletion
        async with test_session_maker() as db:
            assert await db.get(VenuePhoto, photo_id) is None

            # Verify audit log
            audit = (
                await db.scalars(select(AuditLog).where(AuditLog.target_id == photo_id))
            ).first()
            assert audit is not None
            assert audit.action == "VENUE_PHOTO_DELETE"


@pytest.mark.asyncio
async def test_photo_tenant_isolation(prepare_database: None) -> None:
    """Club A user cannot update or delete Club B's photo."""
    from tests.conftest import test_session_maker

    photo_b_id = "p-b-1"
    async with test_session_maker() as db:
        await create_club_session_for_photos(
            db, "u-club-a", "v-club-a", session_cookie="ck_club_a"
        )
        _, venue_b, _, _ = await create_club_session_for_photos(
            db, "u-club-b", "v-club-b", session_cookie="ck_club_b"
        )
        photo_b = VenuePhoto(
            id=photo_b_id,
            venue_id=venue_b.id,
            url="/static/uploads/venues/v-club-b/p.png",
            thumbnail_url="/static/uploads/venues/v-club-b/p.png",
            caption="Club B Photo",
            display_order=1,
        )
        db.add(photo_b)
        await db.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        client.cookies.set("padel_club_session", "ck_club_a")

        # Club A trying to edit Club B's photo -> 404
        edit_res = await client.put(
            f"/portal/club/photos/{photo_b_id}",
            json={"caption": "Hacked caption"},
        )
        assert edit_res.status_code == 404

        # Club A trying to delete Club B's photo -> 404
        del_res = await client.delete(f"/portal/club/photos/{photo_b_id}")
        assert del_res.status_code == 404
