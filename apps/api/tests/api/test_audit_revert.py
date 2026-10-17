"""Tests for audit logging, super admin step-in owner notification, and revert engine."""

import pytest

from app.audit.service import AuditService
from app.identity.models import User
from app.notify.email import default_email_provider
from app.venues.models import Venue, VenueMembership


@pytest.mark.asyncio
async def test_audit_record_super_admin_step_in_alerts_owner(
    prepare_database: None,
) -> None:
    from tests.conftest import test_session_maker

    default_email_provider.clear()

    async with test_session_maker() as db:
        # Create club owner
        owner = User(
            id="owner-alert-1",
            name="Kofi Owner",
            email="kofi@accrapadel.com",
            role="PLAYER",
        )
        venue = Venue(
            id="v-alert-1",
            name="Accra Padel Club",
            address="Airport Residential",
        )
        membership = VenueMembership(
            id="m-alert-1",
            user_id=owner.id,
            venue_id=venue.id,
            role="CLUB_OWNER",
            status="ACTIVE",
        )
        db.add_all([owner, venue, membership])
        await db.commit()

        # Super admin performs edit
        audit_service = AuditService(db)
        audit = await audit_service.record_audit(
            actor_id="super-admin-1",
            actor_kind="SUPER_ADMIN",
            action="VENUE_PROFILE_EDIT",
            target_type="venue",
            target_id=venue.id,
            venue_id=venue.id,
            details="Updated opening hours and bio",
            old_value={"description": "Old bio"},
            new_value={"description": "New bio"},
            is_revertible=True,
        )
        await db.commit()

        assert audit.id is not None
        assert audit.actor_kind == "SUPER_ADMIN"
        assert audit.is_revertible is True

        # Assert notification sent to club owner
        assert len(default_email_provider.sent_messages) == 1
        msg = default_email_provider.sent_messages[0]
        assert msg.to == "kofi@accrapadel.com"
        assert (
            "Updated by Padel Ghana staff" in msg.body_text
            or "Padel Ghana staff" in msg.subject
        )


@pytest.mark.asyncio
async def test_audit_revert_restores_old_value(
    prepare_database: None,
) -> None:
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        venue = Venue(
            id="v-revert-1",
            name="Staff Edited Club",
            address="East Legon",
        )
        db.add(venue)
        await db.commit()

        audit_service = AuditService(db)
        audit = await audit_service.record_audit(
            actor_id="staff-1",
            actor_kind="SUPER_ADMIN",
            action="VENUE_PROFILE_EDIT",
            target_type="venue",
            target_id=venue.id,
            venue_id=venue.id,
            old_value={"name": "Original Club"},
            new_value={"name": "Staff Edited Club"},
            is_revertible=True,
        )
        await db.commit()

        # Execute revert
        revert_log = await audit_service.revert_audit(
            audit_id=audit.id,
            actor_id="super-admin-2",
            actor_kind="SUPER_ADMIN",
        )
        await db.commit()

        # Check venue is restored
        await db.refresh(venue)
        assert venue.name == "Original Club"

        # Check original audit row is marked reverted
        await db.refresh(audit)
        assert audit.reverted_at is not None

        # Check new revert audit log links to original
        assert revert_log.reverts_audit_id == audit.id
        assert revert_log.action == "REVERT_VENUE_PROFILE_EDIT"


@pytest.mark.asyncio
async def test_audit_revert_invariants(
    prepare_database: None,
) -> None:
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        venue = Venue(
            id="v-revert-inv",
            name="Club Inv",
            address="Cantonments",
        )
        db.add(venue)
        await db.commit()

        audit_service = AuditService(db)
        audit_non_rev = await audit_service.record_audit(
            actor_id="user-1",
            actor_kind="USER",
            action="SCORE_EDIT",
            target_type="match",
            target_id="m-1",
            is_revertible=False,
        )
        await db.commit()

        # Cannot revert non-revertible log
        with pytest.raises(ValueError, match="not revertible"):
            await audit_service.revert_audit(
                audit_id=audit_non_rev.id,
                actor_id="sa-1",
            )

        # Cannot revert unsupported target type
        audit_bad_target = await audit_service.record_audit(
            actor_id="user-1",
            actor_kind="USER",
            action="UNSUPPORTED_ACTION",
            target_type="unsupported_entity",
            target_id="ent-1",
            old_value={"foo": "bar"},
            new_value={"foo": "baz"},
            is_revertible=True,
        )
        await db.commit()

        with pytest.raises(ValueError, match="not revertible"):
            await audit_service.revert_audit(
                audit_id=audit_bad_target.id,
                actor_id="sa-1",
            )


@pytest.mark.asyncio
async def test_audit_revert_via_portal_api_endpoint(prepare_database: None) -> None:
    """POST /portal/club/audit/{log_id}/revert endpoint checks."""
    import hashlib
    import uuid
    from datetime import UTC, datetime, timedelta

    from httpx import ASGITransport, AsyncClient

    from app.identity.models import UserSession
    from app.main import app
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        # Club A
        user_a = User(
            id=f"u-a-{uuid.uuid4().hex[:6]}",
            name="Owner A",
            email="owner-a@padel.com",
            role="PLAYER",
        )
        venue_a = Venue(
            id=f"v-a-{uuid.uuid4().hex[:6]}",
            name="Original Venue A",
            address="Airport Residential",
            base_rate_pesewas_per_hour=30000,
        )
        mem_a = VenueMembership(
            id=str(uuid.uuid4()),
            user_id=user_a.id,
            venue_id=venue_a.id,
            role="CLUB_OWNER",
            status="ACTIVE",
        )
        cookie_a = f"cookie_{uuid.uuid4().hex}"
        session_a = UserSession(
            id=str(uuid.uuid4()),
            user_id=user_a.id,
            session_token_hash=hashlib.sha256(cookie_a.encode()).hexdigest(),
            role="PLAYER",
            host_type="CLUB",
            expires_at=datetime.now(UTC) + timedelta(hours=4),
        )

        # Club B
        user_b = User(
            id=f"u-b-{uuid.uuid4().hex[:6]}",
            name="Owner B",
            email="owner-b@padel.com",
            role="PLAYER",
        )
        venue_b = Venue(
            id=f"v-b-{uuid.uuid4().hex[:6]}",
            name="Venue B",
            address="East Legon",
            base_rate_pesewas_per_hour=40000,
        )

        mem_b = VenueMembership(
            id=str(uuid.uuid4()),
            user_id=user_b.id,
            venue_id=venue_b.id,
            role="CLUB_OWNER",
            status="ACTIVE",
        )
        cookie_b = f"cookie_{uuid.uuid4().hex}"
        session_b = UserSession(
            id=str(uuid.uuid4()),
            user_id=user_b.id,
            session_token_hash=hashlib.sha256(cookie_b.encode()).hexdigest(),
            role="PLAYER",
            host_type="CLUB",
            expires_at=datetime.now(UTC) + timedelta(hours=4),
        )

        db.add_all(
            [user_a, venue_a, mem_a, session_a, user_b, venue_b, mem_b, session_b]
        )
        await db.commit()

        # Create an audit log entry on Venue A
        audit_svc = AuditService(db)
        log_a = await audit_svc.record_audit(
            actor_id=user_a.id,
            actor_kind="USER",
            action="VENUE_PROFILE_EDIT",
            target_type="venue",
            target_id=venue_a.id,
            venue_id=venue_a.id,
            old_value={"name": "Original Venue A"},
            new_value={"name": "Updated Venue A"},
            is_revertible=True,
        )
        # Create non-revertible log
        log_non_rev = await audit_svc.record_audit(
            actor_id=user_a.id,
            actor_kind="USER",
            action="PHOTO_UPLOAD",
            target_type="venue_photo",
            target_id="photo-1",
            venue_id=venue_a.id,
            is_revertible=False,
        )
        await db.commit()
        log_a_id = log_a.id
        log_non_rev_id = log_non_rev.id

    transport = ASGITransport(app=app)

    # 1. User B attempts to revert User A's audit log -> 404
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
        cookies={"padel_club_session": cookie_b},
    ) as client_b:
        res_cross = await client_b.post(f"/portal/club/audit/{log_a_id}/revert")
        assert res_cross.status_code == 404

    # 2. User A attempts to revert non-revertible log -> 400
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
        cookies={"padel_club_session": cookie_a},
    ) as client_a:
        res_bad = await client_a.post(f"/portal/club/audit/{log_non_rev_id}/revert")
        assert res_bad.status_code == 400
        assert "not revertible" in res_bad.json()["detail"].lower()

        # 3. User A successfully reverts log_a -> 200
        res_ok = await client_a.post(f"/portal/club/audit/{log_a_id}/revert")
        assert res_ok.status_code == 200
        data = res_ok.json()
        assert data["success"] is True
        assert data["original_action"] == "VENUE_PROFILE_EDIT"

        # 4. Attempting to revert again returns 400
        res_repeat = await client_a.post(f"/portal/club/audit/{log_a_id}/revert")
        assert res_repeat.status_code == 400
        assert "already been reverted" in res_repeat.json()["detail"].lower()
