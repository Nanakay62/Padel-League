"""Integration tests for club and organiser back office operations."""

from datetime import UTC, datetime, timedelta

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from app.audit.models import AuditLog
from app.billing.models import Credit, Order
from app.events.models import Event, EventMatch, EventPlayer, EventRound, Registration
from app.identity.service import IdentityService
from app.main import app
from app.venues.models import Venue
from tests.conftest import db_session_maker


@pytest.mark.asyncio
async def test_duplicate_event_endpoint():
    async with db_session_maker() as db:
        identity_svc = IdentityService(db)
        organizer = await identity_svc.create_user(
            phone_e164="+233240011122", name="Kofi Organiser", role="ORGANIZER"
        )
        token = identity_svc.create_access_token(
            organizer.id, organizer.phone_e164, organizer.role
        )

        orig_time = datetime(2026, 10, 10, 18, 0, 0, tzinfo=UTC)
        orig_event = Event(
            title="Saturday Night Americano",
            venue_name="Airport Hills Padel",
            format="AMERICANO",
            courts=2,
            point_target=32,
            planned_rounds=6,
            price_pesewas=6000,
            court_rate_pesewas=5000,
            max_players=8,
            status="FINISHED",
            start_time=orig_time,
        )
        db.add(orig_event)
        await db.flush()

        # Add players/registrations to verify they are NOT duplicated
        player1 = await identity_svc.create_user(
            phone_e164="+233240011123", name="Player One", role="PLAYER"
        )
        reg = Registration(
            event_id=orig_event.id,
            user_id=player1.id,
            status="CONFIRMED",
            created_at=orig_time,
        )
        db.add(reg)
        await db.commit()

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                f"/events/{orig_event.id}/duplicate",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert resp.status_code == 200
            data = resp.json()

            assert data["id"] != orig_event.id
            assert data["title"] == orig_event.title
            assert data["venue_name"] == orig_event.venue_name
            assert data["format"] == "AMERICANO"
            assert data["courts"] == 2
            assert data["point_target"] == 32
            assert data["planned_rounds"] == 6
            assert data["price_pesewas"] == 6000
            assert data["max_players"] == 8
            assert data["status"] == "DRAFT"

            # Check that new start time is advanced by 7 days
            new_start = datetime.fromisoformat(data["start_time"])
            if new_start.tzinfo is None:
                new_start = new_start.replace(tzinfo=UTC)
            assert new_start == orig_time + timedelta(days=7)

            # Check fresh event has 0 registrations
            cloned_id = data["id"]
            reg_stmt = select(Registration).where(Registration.event_id == cloned_id)
            reg_res = await db.execute(reg_stmt)
            assert len(reg_res.scalars().all()) == 0


@pytest.mark.asyncio
async def test_correct_score_endpoint_requires_reason_and_audits():
    async with db_session_maker() as db:
        identity_svc = IdentityService(db)
        organizer = await identity_svc.create_user(
            phone_e164="+233240022233", name="Ama Official", role="ORGANIZER"
        )
        token = identity_svc.create_access_token(
            organizer.id, organizer.phone_e164, organizer.role
        )

        event = Event(
            title="Score Correction Event",
            format="AMERICANO",
            point_target=24,
            status="LIVE",
        )
        db.add(event)
        await db.flush()

        # Add players
        p1 = EventPlayer(event_id=event.id, name="Kwame")
        p2 = EventPlayer(event_id=event.id, name="Yaw")
        p3 = EventPlayer(event_id=event.id, name="Kofi")
        p4 = EventPlayer(event_id=event.id, name="Akua")
        db.add_all([p1, p2, p3, p4])
        await db.flush()

        round_1 = EventRound(event_id=event.id, round_number=1, status="COMPLETED")
        db.add(round_1)
        await db.flush()

        match = EventMatch(
            round_id=round_1.id,
            court_number=1,
            team_a_p1="Kwame",
            team_a_p2="Yaw",
            team_b_p1="Kofi",
            team_b_p2="Akua",
            team_a_score=14,
            team_b_score=10,
            status="CONFIRMED",
        )
        db.add(match)
        await db.commit()

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # 1. Missing reason must fail (400 or 422)
            fail_resp = await client.post(
                f"/events/{event.id}/matches/{match.id}/correct-score",
                json={
                    "team_a_score": 16,
                    "team_b_score": 8,
                    "reason": "",
                },
                headers={"Authorization": f"Bearer {token}"},
            )
            assert fail_resp.status_code in (400, 422)

            # 2. Scores not summing to point_target (24) must fail (400)
            invalid_sum_resp = await client.post(
                f"/events/{event.id}/matches/{match.id}/correct-score",
                json={
                    "team_a_score": 16,
                    "team_b_score": 9,  # 25 != 24
                    "reason": "Mistake on paper sheet",
                },
                headers={"Authorization": f"Bearer {token}"},
            )
            assert invalid_sum_resp.status_code == 400

            # 3. Valid correction succeeds
            ok_resp = await client.post(
                f"/events/{event.id}/matches/{match.id}/correct-score",
                json={
                    "team_a_score": 16,
                    "team_b_score": 8,  # sums to 24
                    "reason": "Team B conceded 2 points incorrectly entered",
                },
                headers={"Authorization": f"Bearer {token}"},
            )
            assert ok_resp.status_code == 200
            data = ok_resp.json()
            assert data["team_a_score"] == 16
            assert data["team_b_score"] == 8
            assert data["status"] == "CORRECTED"

            # 4. Verify immutable AuditLog row was written
            audit_stmt = select(AuditLog).where(
                AuditLog.action == "SCORE_CORRECTION",
                AuditLog.target_id == match.id,
            )
            audit_res = await db.execute(audit_stmt)
            log = audit_res.scalar_one_or_none()
            assert log is not None
            assert log.actor_id == organizer.id
            assert "Team B conceded 2 points" in (log.details or "")


@pytest.mark.asyncio
async def test_cancel_event_issues_credits_and_audits():
    async with db_session_maker() as db:
        identity_svc = IdentityService(db)
        organizer = await identity_svc.create_user(
            phone_e164="+233240033344", name="Organiser Boss", role="ORGANIZER"
        )
        token = identity_svc.create_access_token(
            organizer.id, organizer.phone_e164, organizer.role
        )

        player = await identity_svc.create_user(
            phone_e164="+233240033355", name="Player Paid", role="PLAYER"
        )

        event = Event(
            title="Rain-Out Friday Americano",
            status="PUBLISHED",
            price_pesewas=5000,
        )
        db.add(event)
        await db.flush()

        order = Order(
            user_id=player.id,
            event_id=event.id,
            amount_pesewas=5000,
            court_fee_pesewas=4500,
            platform_fee_pesewas=500,
            currency="GHS",
            method="PAYSTACK",
            status="PAID",
            reference="padel_order_cancel_01",
        )
        db.add(order)
        await db.flush()

        reg = Registration(
            event_id=event.id,
            user_id=player.id,
            order_id=order.id,
            status="CONFIRMED",
        )
        db.add(reg)
        await db.commit()

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                f"/events/{event.id}/cancel",
                json={"reason": "Heavy tropical thunderstorm flooding outdoor courts"},
                headers={"Authorization": f"Bearer {token}"},
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "CANCELLED"

            # Registration status is CANCELLED_FREE
            await db.refresh(reg)
            assert reg.status == "CANCELLED_FREE"

            # Player received 100% platform credit
            credit_stmt = select(Credit).where(Credit.user_id == player.id)
            credit_res = await db.execute(credit_stmt)
            credit = credit_res.scalar_one_or_none()
            assert credit is not None
            assert credit.amount_pesewas == 5000
            assert "Heavy tropical thunderstorm" in credit.reason

            # AuditLog was recorded
            audit_stmt = select(AuditLog).where(
                AuditLog.action == "EVENT_CANCELLED",
                AuditLog.target_id == event.id,
            )
            audit_res = await db.execute(audit_stmt)
            audit_log = audit_res.scalar_one_or_none()
            assert audit_log is not None
            assert audit_log.actor_id == organizer.id


@pytest.mark.asyncio
async def test_export_csv_endpoints():
    async with db_session_maker() as db:
        identity_svc = IdentityService(db)
        organizer = await identity_svc.create_user(
            phone_e164="+233240044455", name="CSV Organiser", role="ORGANIZER"
        )
        token = identity_svc.create_access_token(
            organizer.id, organizer.phone_e164, organizer.role
        )

        player = await identity_svc.create_user(
            phone_e164="+233240044466", name="Kwesi Appiah", role="PLAYER"
        )

        event = Event(
            title="CSV Export Event",
            format="AMERICANO",
            point_target=24,
            status="FINISHED",
        )
        db.add(event)
        await db.flush()

        order = Order(
            user_id=player.id,
            event_id=event.id,
            amount_pesewas=6000,
            court_fee_pesewas=5500,
            platform_fee_pesewas=500,
            currency="GHS",
            method="MANUAL_MOMO",
            status="PAID",
            reference="padel_csv_test_ref",
        )
        db.add(order)
        await db.flush()

        reg = Registration(
            event_id=event.id,
            user_id=player.id,
            order_id=order.id,
            status="CONFIRMED",
        )
        db.add(reg)

        round_1 = EventRound(event_id=event.id, round_number=1, status="COMPLETED")
        db.add(round_1)
        await db.flush()

        match = EventMatch(
            round_id=round_1.id,
            court_number=1,
            team_a_p1="Kwesi Appiah",
            team_a_p2="Partner A",
            team_b_p1="Opponent 1",
            team_b_p2="Opponent 2",
            team_a_score=14,
            team_b_score=10,
            status="CONFIRMED",
        )
        db.add(match)
        await db.commit()

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # 1. Registrations CSV
            reg_csv = await client.get(
                f"/events/{event.id}/export/registrations.csv",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert reg_csv.status_code == 200
            assert "text/csv" in reg_csv.headers["content-type"]
            csv_text = reg_csv.text
            assert "Kwesi Appiah" in csv_text
            assert "+233240044466" in csv_text
            assert "CONFIRMED" in csv_text
            assert "60.00" in csv_text  # GH₵ 60.00

            # 2. Results CSV
            res_csv = await client.get(
                f"/events/{event.id}/export/results.csv",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert res_csv.status_code == 200
            assert "text/csv" in res_csv.headers["content-type"]
            assert "Kwesi Appiah & Partner A" in res_csv.text
            assert "14" in res_csv.text
            assert "10" in res_csv.text

            # 3. Settlement CSV
            set_csv = await client.get(
                f"/events/{event.id}/export/settlement.csv",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert set_csv.status_code == 200
            assert "text/csv" in set_csv.headers["content-type"]
            assert "60.00" in set_csv.text


@pytest.mark.asyncio
async def test_club_dashboard_metrics_endpoint():
    async with db_session_maker() as db:
        identity_svc = IdentityService(db)
        organizer = await identity_svc.create_user(
            phone_e164="+233240055566", name="Manager K", role="ORGANIZER"
        )
        token = identity_svc.create_access_token(
            organizer.id, organizer.phone_e164, organizer.role
        )

        venue = Venue(
            name="Labone Padel Arena",
            address="14 Ringway Estate, Osu, Accra",
            indoor_courts=1,
            outdoor_courts=3,
        )
        db.add(venue)
        await db.flush()

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get(
                f"/venues/{venue.id}/dashboard",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["venue_id"] == venue.id
            assert data["venue_name"] == "Labone Padel Arena"
            assert "court_hours_used" in data
            assert "fill_rate_percent" in data
            assert "whatsapp_summary" in data
            assert "Labone Padel Arena" in data["whatsapp_summary"]
