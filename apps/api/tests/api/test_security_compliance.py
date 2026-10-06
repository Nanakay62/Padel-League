"""Security, privacy, RBAC authorization, and compliance tests."""

import re
import uuid

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.notify.sms import default_sms_provider


@pytest.mark.asyncio
async def test_security_headers_present() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        headers = res.headers
        assert headers.get("x-content-type-options") == "nosniff"
        assert headers.get("x-frame-options") == "DENY"
        assert headers.get("referrer-policy") == "strict-origin-when-cross-origin"


@pytest.mark.asyncio
async def test_otp_request_rate_limiting() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        phone = f"024{uuid.uuid4().int % 10000000:07d}"

        # First 3 requests should succeed
        for _ in range(3):
            res = await client.post("/auth/otp/request", json={"phone": phone})
            assert res.status_code == 200

        # 4th request within 10-min window must be rate-limited
        res_rate_limited = await client.post("/auth/otp/request", json={"phone": phone})
        assert res_rate_limited.status_code == 429
        assert "Too many OTP requests" in res_rate_limited.json()["detail"]


@pytest.mark.asyncio
async def test_score_submission_authorization() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create an event with 4 players
        c_res = await client.post(
            "/events",
            json={
                "title": "Auth Security Test Americano",
                "format": "AMERICANO",
                "point_target": 24,
                "courts": 1,
            },
        )
        assert c_res.status_code == 201
        event_id = c_res.json()["id"]

        p_res = await client.post(
            f"/events/{event_id}/players",
            json={"names": ["Kofi A", "Ama B", "Kwame C", "Abena D"]},
        )
        assert p_res.status_code == 200

        # Generate round 1
        r_res = await client.post(f"/events/{event_id}/rounds:next")
        assert r_res.status_code == 200
        match_id = r_res.json()["matches"][0]["id"]

        # An unauthorized stranger attempts to submit score -> 403 Forbidden
        bad_score = {
            "result_id": str(uuid.uuid4()),
            "team_a_score": 14,
            "team_b_score": 10,
            "entered_by": "Stranger Danger",
        }
        res_unauth = await client.post(
            f"/events/{event_id}/matches/{match_id}/score",
            json=bad_score,
        )
        assert res_unauth.status_code == 403

        # A participant submits score -> 200 OK
        good_score = {
            "result_id": str(uuid.uuid4()),
            "team_a_score": 14,
            "team_b_score": 10,
            "entered_by": "Kofi A",
        }
        res_auth = await client.post(
            f"/events/{event_id}/matches/{match_id}/score",
            json=good_score,
        )
        assert res_auth.status_code == 200


@pytest.mark.asyncio
async def test_gdpr_data_export_and_deletion() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        default_sms_provider.sent_messages.clear()
        phone = f"054{uuid.uuid4().int % 10000000:07d}"

        # Request & verify OTP
        await client.post("/auth/otp/request", json={"phone": phone})
        _, msg = default_sms_provider.sent_messages[-1]
        otp_code = re.search(r"\b\d{6}\b", msg).group(0)

        v_res = await client.post(
            "/auth/otp/verify",
            json={"phone": phone, "otp": otp_code, "name": "Kojo Privacy"},
        )
        token = v_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Data Export (Act 843 & GDPR Article 20)
        export_res = await client.get("/me/export", headers=headers)
        assert export_res.status_code == 200
        export_data = export_res.json()
        assert export_data["user"]["name"] == "Kojo Privacy"
        assert "profile" in export_data
        assert "registrations" in export_data

        # Account Deletion (Apple App Store & GDPR Article 17)
        del_res = await client.delete("/me", headers=headers)
        assert del_res.status_code == 204

        # Accessing /me after deletion confirms anonymization
        post_del_res = await client.get("/me", headers=headers)
        assert post_del_res.status_code == 200
        assert post_del_res.json()["name"] == "Former player"
