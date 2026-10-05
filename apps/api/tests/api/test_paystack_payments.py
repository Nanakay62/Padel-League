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
