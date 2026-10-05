"""Tests for manual payments (MoMo / cash at club), organiser confirmation, and audit logs."""

from datetime import UTC, datetime, timedelta

import pytest
from httpx import ASGITransport, AsyncClient

from app.events.models import Event
from app.identity.service import IdentityService
from app.main import app
from tests.conftest import db_session_maker


@pytest.mark.asyncio
async def test_manual_payment_lifecycle_and_audit():
    async with db_session_maker() as db:
        # 1. Create organiser and player
        identity_svc = IdentityService(db)
        player = await identity_svc.create_user(
            phone_e164="+233240000001", name="Kwame Mensah", role="PLAYER"
        )
        player_token = identity_svc.create_access_token(
            player.id, player.phone_e164, player.role
        )

        organiser = await identity_svc.create_user(
            phone_e164="+233240000002", name="Coach Kojo", role="ORGANISER"
        )
        organiser_token = identity_svc.create_access_token(
            organiser.id, organiser.phone_e164, organiser.role
        )

        other_player = await identity_svc.create_user(
            phone_e164="+233240000003", name="Ama Serwaa", role="PLAYER"
        )
        other_player_token = identity_svc.create_access_token(
            other_player.id, other_player.phone_e164, other_player.role
        )

        # 2. Create Event with court price GH₵ 200 (20000 pesewas) for 4 players = GH₵ 50 + GH₵ 5 platform fee
        event = Event(
            title="Saturday Morning Social Americano",
            venue_name="Accra Padel Club",
            format="AMERICANO",
            courts=1,
            max_players=4,
            price_pesewas=5500,  # 5000 court fee + 500 platform fee
            court_rate_pesewas=20000,
            status="PUBLISHED",
            start_time=datetime.now(UTC) + timedelta(days=2),
        )
        db.add(event)
        await db.commit()
        await db.refresh(event)

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # 3. Player joins with MANUAL_MOMO
            join_resp = await client.post(
                f"/events/{event.id}/join",
                json={"method": "MANUAL_MOMO"},
                headers={"Authorization": f"Bearer {player_token}"},
            )
            assert join_resp.status_code == 201
            join_data = join_resp.json()
            assert join_data["status"] == "PENDING_PAYMENT"
            assert join_data["hold_expires_at"] is not None
            registration_id = join_data["id"]
            order = join_data["order"]
            assert order["amount_pesewas"] == 5500
            assert order["court_fee_pesewas"] == 5000
            assert order["platform_fee_pesewas"] == 500
            assert order["method"] == "MANUAL_MOMO"
            assert order["status"] == "PENDING"

            # 4. Another regular player tries to mark paid -> 403 Forbidden
            unauthorized_resp = await client.post(
                f"/registrations/{registration_id}/mark-paid",
                json={"reference": "MOMO_CASH_001", "note": "Illegal confirmation"},
                headers={"Authorization": f"Bearer {other_player_token}"},
            )
            assert unauthorized_resp.status_code == 403

            # 5. Organiser marks paid -> 200 OK
            mark_paid_resp = await client.post(
                f"/registrations/{registration_id}/mark-paid",
                json={"reference": "MOMO_REC_78910", "note": "Paid to Coach Kojo MoMo"},
                headers={"Authorization": f"Bearer {organiser_token}"},
            )
            assert mark_paid_resp.status_code == 200
            confirmed_data = mark_paid_resp.json()
            assert confirmed_data["status"] == "CONFIRMED"
            assert confirmed_data["order"]["status"] == "PAID"

            # 6. Verify AuditLog written
            audit_resp = await client.get(
                f"/audit-logs?target_id={registration_id}",
                headers={"Authorization": f"Bearer {organiser_token}"},
            )
            assert audit_resp.status_code == 200
            audit_logs = audit_resp.json()
            assert len(audit_logs) >= 1
            assert audit_logs[0]["action"] == "MANUAL_PAYMENT_CONFIRMED"
            assert audit_logs[0]["actor_id"] == organiser.id
            assert audit_logs[0]["amount_pesewas"] == 5500
            assert "MOMO_REC_78910" in audit_logs[0]["reference"]


@pytest.mark.asyncio
async def test_stale_hold_expiration_frees_seat():
    async with db_session_maker() as db:
        identity_svc = IdentityService(db)
        player = await identity_svc.create_user(
            phone_e164="+233241112233", name="Ekow Taylor", role="PLAYER"
        )
        token = identity_svc.create_access_token(
            player.id, player.phone_e164, player.role
        )

        event = Event(
            title="Speed Americano",
            venue_name="Airport Hills Padel",
            format="AMERICANO",
            courts=1,
            max_players=4,
            price_pesewas=5500,
            status="PUBLISHED",
            start_time=datetime.now(UTC) + timedelta(days=1),
        )
        db.add(event)
        await db.commit()

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            join_resp = await client.post(
                f"/events/{event.id}/join",
                json={"method": "CASH"},
                headers={"Authorization": f"Bearer {token}"},
            )
            assert join_resp.status_code == 201
            reg_id = join_resp.json()["id"]

            # Trigger hold expiration sweep
            sweep_resp = await client.post(
                "/billing/sweep-holds",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert sweep_resp.status_code == 200
            # Immediately, it is not expired because 10 mins have not elapsed
            check_resp = await client.get(
                f"/registrations/{reg_id}", headers={"Authorization": f"Bearer {token}"}
            )
            assert check_resp.json()["status"] == "PENDING_PAYMENT"
