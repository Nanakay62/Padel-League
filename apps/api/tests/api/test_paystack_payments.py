"""Tests for Paystack online payment initialization, webhook HMAC verification, idempotency, and async MoMo polling."""

import hashlib
import hmac
import json
from datetime import UTC, datetime, timedelta

import pytest
from httpx import ASGITransport, AsyncClient

from app.config import settings
from app.events.models import Event
from app.identity.service import IdentityService
from app.main import app
from tests.conftest import db_session_maker


@pytest.mark.asyncio
async def test_paystack_checkout_and_webhook_idempotency():
    settings.paystack_secret_key = "sk_test_mock_secret_key_ghana"

    async with db_session_maker() as db:
        identity_svc = IdentityService(db)
        player = await identity_svc.create_user(
            phone_e164="+233201234567", name="Kofi Annan", role="PLAYER"
        )
        player_token = identity_svc.create_access_token(
            player.id, player.phone_e164, player.role
        )

        event = Event(
            title="Friday Sunset Mexicano",
            venue_name="Cantonments Padel Club",
            format="MEXICANO",
            courts=2,
            max_players=8,
            price_pesewas=6000,
            court_rate_pesewas=44000,
            status="PUBLISHED",
            start_time=datetime.now(UTC) + timedelta(days=3),
        )
        db.add(event)
        await db.commit()
        await db.refresh(event)

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # 1. Initialize Paystack checkout session
            checkout_resp = await client.post(
                f"/events/{event.id}/join",
                json={"method": "PAYSTACK"},
                headers={"Authorization": f"Bearer {player_token}"},
            )
            assert checkout_resp.status_code == 201
            data = checkout_resp.json()
            assert data["status"] == "PENDING_PAYMENT"
            order = data["order"]
            assert order["method"] == "PAYSTACK"
            assert order["amount_pesewas"] == 6000
            assert order["reference"].startswith("padel_")
            assert "paystack.co" in order["paystack_authorization_url"]

            reg_id = data["id"]
            order_id = order["id"]
            reference = order["reference"]

            # 2. Asynchronous MoMo polling check: initially PENDING
            poll_resp = await client.get(
                f"/orders/{order_id}",
                headers={"Authorization": f"Bearer {player_token}"},
            )
            assert poll_resp.status_code == 200
            assert poll_resp.json()["status"] == "PENDING"

            # 3. Webhook with invalid signature returns 400
            webhook_body = {
                "event": "charge.success",
                "data": {
                    "reference": reference,
                    "amount": 6000,
                    "currency": "GHS",
                    "channel": "mobile_money",
                    "status": "success",
                },
            }
            body_bytes = json.dumps(webhook_body).encode("utf-8")

            bad_sig_resp = await client.post(
                "/webhooks/paystack",
                content=body_bytes,
                headers={"x-paystack-signature": "bogus_signature_hash"},
            )
            assert bad_sig_resp.status_code == 400

            # 4. Webhook with valid HMAC-SHA512 confirms payment
            valid_sig = hmac.new(
                settings.paystack_secret_key.encode("utf-8"),
                body_bytes,
                hashlib.sha512,
            ).hexdigest()

            good_webhook_resp = await client.post(
                "/webhooks/paystack",
                content=body_bytes,
                headers={"x-paystack-signature": valid_sig},
            )
            assert good_webhook_resp.status_code == 200

            # Verify order is PAID and registration is CONFIRMED
            poll_after = await client.get(
                f"/orders/{order_id}",
                headers={"Authorization": f"Bearer {player_token}"},
            )
            assert poll_after.json()["status"] == "PAID"

            reg_after = await client.get(
                f"/registrations/{reg_id}",
                headers={"Authorization": f"Bearer {player_token}"},
            )
            assert reg_after.json()["status"] == "CONFIRMED"

            # 5. Replay of same webhook is idempotent
            replay_resp = await client.post(
                "/webhooks/paystack",
                content=body_bytes,
                headers={"x-paystack-signature": valid_sig},
            )
            assert replay_resp.status_code == 200
            assert replay_resp.json()["status"] == "already_processed"


@pytest.mark.asyncio
async def test_paystack_webhook_rejects_amount_and_currency_mismatch():
    settings.paystack_secret_key = "sk_test_mock_secret_key_ghana"

    async with db_session_maker() as db:
        identity_svc = IdentityService(db)
        player = await identity_svc.create_user(
            phone_e164="+233201999888", name="Kwesi Pratt", role="PLAYER"
        )
        player_token = identity_svc.create_access_token(
            player.id, player.phone_e164, player.role
        )

        event = Event(
            title="Saturday Americano",
            venue_name="East Legon Padel Center",
            format="AMERICANO",
            courts=1,
            max_players=4,
            price_pesewas=5500,
            status="PUBLISHED",
            start_time=datetime.now(UTC) + timedelta(days=2),
        )
        db.add(event)
        await db.commit()

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            checkout_resp = await client.post(
                f"/events/{event.id}/join",
                json={"method": "PAYSTACK"},
                headers={"Authorization": f"Bearer {player_token}"},
            )
            assert checkout_resp.status_code == 201
            order = checkout_resp.json()["order"]
            reference = order["reference"]

            # 1. Amount mismatch (e.g. attacker sends 100 pesewas instead of 5500)
            mismatch_amount_payload = {
                "event": "charge.success",
                "data": {
                    "reference": reference,
                    "amount": 100,
                    "currency": "GHS",
                    "channel": "mobile_money",
                    "status": "success",
                },
            }
            body_bytes = json.dumps(mismatch_amount_payload).encode("utf-8")
            sig = hmac.new(
                settings.paystack_secret_key.encode("utf-8"),
                body_bytes,
                hashlib.sha512,
            ).hexdigest()

            bad_amount_resp = await client.post(
                "/webhooks/paystack",
                content=body_bytes,
                headers={"x-paystack-signature": sig},
            )
            assert bad_amount_resp.status_code == 400
            assert "amount mismatch" in bad_amount_resp.json()["detail"].lower()

            # 2. Currency mismatch (e.g. USD instead of GHS)
            mismatch_currency_payload = {
                "event": "charge.success",
                "data": {
                    "reference": reference,
                    "amount": 5500,
                    "currency": "USD",
                    "channel": "card",
                    "status": "success",
                },
            }
            body_bytes = json.dumps(mismatch_currency_payload).encode("utf-8")
            sig = hmac.new(
                settings.paystack_secret_key.encode("utf-8"),
                body_bytes,
                hashlib.sha512,
            ).hexdigest()

            bad_curr_resp = await client.post(
                "/webhooks/paystack",
                content=body_bytes,
                headers={"x-paystack-signature": sig},
            )
            assert bad_curr_resp.status_code == 400
            assert "currency mismatch" in bad_curr_resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_paystack_gateway_raises_in_production_if_missing_key():
    from app.billing.paystack import PaystackGateway

    old_env = settings.environment
    try:
        settings.environment = "production"
        gateway = PaystackGateway(secret_key="")
        with pytest.raises(RuntimeError, match="production"):
            await gateway.initialize_transaction(5000, "test@padel.gh", "ref_test")
    finally:
        settings.environment = old_env


@pytest.mark.asyncio
async def test_late_momo_webhook_on_full_event_issues_credit_without_overbooking():
    settings.paystack_secret_key = "sk_test_mock_secret_key_ghana"

    async with db_session_maker() as db:
        identity_svc = IdentityService(db)
        p1 = await identity_svc.create_user(
            phone_e164="+233240001111", name="Player One", role="PLAYER"
        )
        p2 = await identity_svc.create_user(
            phone_e164="+233240002222", name="Player Two", role="PLAYER"
        )
        t1 = identity_svc.create_access_token(p1.id, p1.phone_e164, p1.role)
        t2 = identity_svc.create_access_token(p2.id, p2.phone_e164, p2.role)

        # 1-player capacity event to test overflow
        event = Event(
            title="Solo Showcase",
            venue_name="Accra Padel Club",
            format="AMERICANO",
            courts=1,
            max_players=1,
            price_pesewas=5000,
            status="PUBLISHED",
            start_time=datetime.now(UTC) + timedelta(days=2),
        )
        db.add(event)
        await db.commit()

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # P1 joins -> PENDING_PAYMENT
            join1 = await client.post(
                f"/events/{event.id}/join",
                json={"method": "PAYSTACK"},
                headers={"Authorization": f"Bearer {t1}"},
            )
            assert join1.status_code == 201
            p1_ref = join1.json()["order"]["reference"]
            p1_reg_id = join1.json()["id"]

            # Hold expires, P1 marked EXPIRED
            from app.billing.service import BillingService

            billing_svc = BillingService(db)
            # Simulate expired hold by updating hold_expires_at to past
            from app.events.models import Registration

            reg1 = await db.get(Registration, p1_reg_id)
            assert reg1 is not None
            reg1.hold_expires_at = datetime.now(UTC) - timedelta(minutes=1)
            await db.commit()
            await billing_svc.sweep_expired_holds()

            # Now P2 joins the newly freed seat and confirms immediately with CASH
            join2 = await client.post(
                f"/events/{event.id}/join",
                json={"method": "CASH"},
                headers={"Authorization": f"Bearer {t2}"},
            )
            assert join2.status_code == 201
            p2_reg_id = join2.json()["id"]
            # Organiser confirms P2
            organiser = await identity_svc.create_user(
                phone_e164="+233240009999", name="Coach", role="ORGANISER"
            )
            org_token = identity_svc.create_access_token(
                organiser.id, organiser.phone_e164, organiser.role
            )
            await client.post(
                f"/registrations/{p2_reg_id}/mark-paid",
                json={"reference": "CASH_001"},
                headers={"Authorization": f"Bearer {org_token}"},
            )

            # Event is now 100% FULL (1/1 confirmed).
            # Now, delayed Paystack webhook for P1 arrives!
            webhook_body = {
                "event": "charge.success",
                "data": {
                    "reference": p1_ref,
                    "amount": 5000,
                    "currency": "GHS",
                    "channel": "mobile_money",
                    "status": "success",
                },
            }
            body_bytes = json.dumps(webhook_body).encode("utf-8")
            sig = hmac.new(
                settings.paystack_secret_key.encode("utf-8"),
                body_bytes,
                hashlib.sha512,
            ).hexdigest()

            late_webhook_resp = await client.post(
                "/webhooks/paystack",
                content=body_bytes,
                headers={"x-paystack-signature": sig},
            )
            assert late_webhook_resp.status_code == 200
            assert late_webhook_resp.json()["status"] == "overflow_credited"

            # Verify P1 was NOT placed on court, but given 100% platform credit
            credits_resp = await client.get(
                "/me/credits",
                headers={"Authorization": f"Bearer {t1}"},
            )
            assert credits_resp.status_code == 200
            assert credits_resp.json()["balance_pesewas"] == 5000


@pytest.mark.asyncio
async def test_credit_balance_and_redemption_in_checkout():
    settings.paystack_secret_key = "sk_test_mock_secret_key_ghana"

    async with db_session_maker() as db:
        identity_svc = IdentityService(db)
        player = await identity_svc.create_user(
            phone_e164="+233245556677", name="Abena Poku", role="PLAYER"
        )
        token = identity_svc.create_access_token(
            player.id, player.phone_e164, player.role
        )

        # Seed 3000 pesewas platform credit
        from app.billing.models import Credit

        credit = Credit(
            user_id=player.id,
            amount_pesewas=3000,
            reason="Goodwill credit",
        )
        db.add(credit)
        await db.commit()

        event = Event(
            title="Evening Social Americano",
            venue_name="Accra Padel Club",
            format="AMERICANO",
            courts=1,
            max_players=4,
            price_pesewas=5500,
            status="PUBLISHED",
            start_time=datetime.now(UTC) + timedelta(days=2),
        )
        db.add(event)
        await db.commit()

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # 1. Check balance endpoint
            cred_resp = await client.get(
                "/me/credits", headers={"Authorization": f"Bearer {token}"}
            )
            assert cred_resp.status_code == 200
            assert cred_resp.json()["balance_pesewas"] == 3000

            # 2. Join event using credit redemption (total 5500 - 3000 = 2500 remaining)
            join_resp = await client.post(
                f"/events/{event.id}/join",
                json={"method": "PAYSTACK", "use_credits": True},
                headers={"Authorization": f"Bearer {token}"},
            )
            assert join_resp.status_code == 201
            order = join_resp.json()["order"]
            # Amount to pay on Paystack is reduced to 2500
            assert order["amount_pesewas"] == 2500

            # Remaining credit balance is now 0
            cred_after = await client.get(
                "/me/credits", headers={"Authorization": f"Bearer {token}"}
            )
            assert cred_after.json()["balance_pesewas"] == 0
