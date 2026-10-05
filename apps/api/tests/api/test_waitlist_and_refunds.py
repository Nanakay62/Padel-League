"""Tests for waitlist ordering, seat hold promotion, cancellation refunds/credits, and event cancellation."""

from datetime import UTC, datetime, timedelta

import pytest
from httpx import ASGITransport, AsyncClient

from app.events.models import Event
from app.identity.service import IdentityService
from app.main import app
from tests.conftest import db_session_maker


@pytest.mark.asyncio
async def test_waitlist_queue_and_promotion_lifecycle():
    async with db_session_maker() as db:
        identity_svc = IdentityService(db)
        # Create 3 players for an event with capacity 2
        p1 = await identity_svc.create_user(
            phone_e164="+233240001001", name="Player One", role="PLAYER"
        )
        t1 = identity_svc.create_access_token(p1.id, p1.phone_e164, p1.role)

        p2 = await identity_svc.create_user(
            phone_e164="+233240001002", name="Player Two", role="PLAYER"
        )
        t2 = identity_svc.create_access_token(p2.id, p2.phone_e164, p2.role)

        p3 = await identity_svc.create_user(
            phone_e164="+233240001003", name="Waitlist Player", role="PLAYER"
        )
        t3 = identity_svc.create_access_token(p3.id, p3.phone_e164, p3.role)

        organiser = await identity_svc.create_user(
            phone_e164="+233240001009", name="Organiser", role="ORGANISER"
        )
        org_token = identity_svc.create_access_token(
            organiser.id, organiser.phone_e164, organiser.role
        )

        event = Event(
            title="Mini 2-Player Showcase",
            venue_name="East Legon Padel",
            format="AMERICANO",
            courts=1,
            max_players=2,
            price_pesewas=5000,
            status="PUBLISHED",
            start_time=datetime.now(UTC) + timedelta(days=5),
        )
        db.add(event)
        await db.commit()

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # P1 joins and is confirmed
            r1 = await client.post(
                f"/events/{event.id}/join",
                json={"method": "CASH"},
                headers={"Authorization": f"Bearer {t1}"},
            )
            assert r1.status_code == 201
            reg1_id = r1.json()["id"]
            await client.post(
                f"/registrations/{reg1_id}/mark-paid",
                json={"reference": "CASH_1"},
                headers={"Authorization": f"Bearer {org_token}"},
            )

            # P2 joins and is confirmed
            r2 = await client.post(
                f"/events/{event.id}/join",
                json={"method": "CASH"},
                headers={"Authorization": f"Bearer {t2}"},
            )
            assert r2.status_code == 201
            reg2_id = r2.json()["id"]
            await client.post(
                f"/registrations/{reg2_id}/mark-paid",
                json={"reference": "CASH_2"},
                headers={"Authorization": f"Bearer {org_token}"},
            )

            # P3 joins full event -> gets WAITLISTED
            r3 = await client.post(
                f"/events/{event.id}/join",
                json={"method": "CASH"},
                headers={"Authorization": f"Bearer {t3}"},
            )
            assert r3.status_code == 201
            data3 = r3.json()
            assert data3["status"] == "WAITLISTED"
            assert data3["waitlist_position"] == 1
            reg3_id = data3["id"]

            # P1 cancels > 24h before event -> FREE cancellation, receives platform Credit row
            cancel_resp = await client.post(
                f"/registrations/{reg1_id}/cancel",
                headers={"Authorization": f"Bearer {t1}"},
            )
            assert cancel_resp.status_code == 200
            cancel_data = cancel_resp.json()
            assert cancel_data["status"] == "CANCELLED_FREE"
            assert cancel_data["credit_issued_pesewas"] == 5000

            # Waitlist player P3 should now be automatically promoted to PENDING_PAYMENT
            reg3_check = await client.get(
                f"/registrations/{reg3_id}",
                headers={"Authorization": f"Bearer {t3}"},
            )
            assert reg3_check.json()["status"] == "PENDING_PAYMENT"
            assert reg3_check.json()["hold_expires_at"] is not None


@pytest.mark.asyncio
async def test_event_cancellation_refunds_all_confirmed_players():
    async with db_session_maker() as db:
        identity_svc = IdentityService(db)
        p1 = await identity_svc.create_user(
            phone_e164="+233240002001", name="Player One", role="PLAYER"
        )
        t1 = identity_svc.create_access_token(p1.id, p1.phone_e164, p1.role)

        organiser = await identity_svc.create_user(
            phone_e164="+233240002009", name="Organiser", role="ORGANISER"
        )
        org_token = identity_svc.create_access_token(
            organiser.id, organiser.phone_e164, organiser.role
        )

        event = Event(
            title="Rain Canceled Event",
            venue_name="Labone Padel",
            format="AMERICANO",
            courts=1,
            max_players=4,
            price_pesewas=4000,
            status="PUBLISHED",
            start_time=datetime.now(UTC) + timedelta(days=2),
        )
        db.add(event)
        await db.commit()

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            join = await client.post(
                f"/events/{event.id}/join",
                json={"method": "CASH"},
                headers={"Authorization": f"Bearer {t1}"},
            )
            reg_id = join.json()["id"]
            await client.post(
                f"/registrations/{reg_id}/mark-paid",
                json={"reference": "CASH_PAID"},
                headers={"Authorization": f"Bearer {org_token}"},
            )

            # Organiser cancels event
            cancel_event_resp = await client.post(
                f"/events/{event.id}/cancel",
                json={"reason": "Heavy tropical storm"},
                headers={"Authorization": f"Bearer {org_token}"},
            )
            assert cancel_event_resp.status_code == 200
            assert cancel_event_resp.json()["status"] == "CANCELLED"

            # Check registration was credited
            reg_check = await client.get(
                f"/registrations/{reg_id}",
                headers={"Authorization": f"Bearer {t1}"},
            )
            assert reg_check.json()["status"] == "CANCELLED_FREE"
