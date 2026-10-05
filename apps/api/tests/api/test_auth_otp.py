"""Integration tests for Phone OTP auth, profiles, and account lifecycle."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.notify.sms import default_sms_provider


@pytest.mark.asyncio
async def test_request_and_verify_otp_flow() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Clear sent messages
        default_sms_provider.sent_messages.clear()

        # 1. Request OTP
        req_res = await client.post(
            "/auth/otp/request",
            json={"phone": "0241234567"},
        )
        assert req_res.status_code == 200
        data = req_res.json()
        assert data["phone_e164"] == "+233241234567"

        # Check console SMS provider captured code
        assert len(default_sms_provider.sent_messages) == 1
        _, msg = default_sms_provider.sent_messages[0]
        # Extract 6-digit code from message
        import re

        match = re.search(r"\b\d{6}\b", msg)
        assert match is not None
        otp_code = match.group(0)

        # 2. Verify OTP
        verify_res = await client.post(
            "/auth/otp/verify",
            json={
                "phone": "0241234567",
                "otp": otp_code,
                "name": "Kwame Mensah",
            },
        )
        assert verify_res.status_code == 200
        tokens = verify_res.json()
        assert "access_token" in tokens
        assert "refresh_token" in tokens
        assert tokens["is_new_user"] is True

        access_token = tokens["access_token"]
        refresh_token = tokens["refresh_token"]

        # 3. Access /me
        me_res = await client.get(
            "/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        assert me_res.status_code == 200
        profile = me_res.json()
        assert profile["name"] == "Kwame Mensah"
        assert profile["phone_e164"] == "+233241234567"
        assert profile["is_provisional"] is True

        # 4. Refresh token rotation
        ref_res = await client.post(
            "/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert ref_res.status_code == 200
        new_tokens = ref_res.json()
        assert new_tokens["access_token"] != access_token

        # Reusing old refresh token must fail (rotation)
        stale_ref = await client.post(
            "/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert stale_ref.status_code == 401


@pytest.mark.asyncio
async def test_brute_force_otp_protection() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Request OTP
        await client.post("/auth/otp/request", json={"phone": "0559876543"})

        # Submit wrong OTP 5 times
        for _ in range(5):
            res = await client.post(
                "/auth/otp/verify",
                json={"phone": "0559876543", "otp": "000000"},
            )
            assert res.status_code == 400 or res.status_code == 429

        # 6th attempt is locked
        locked_res = await client.post(
            "/auth/otp/verify",
            json={"phone": "0559876543", "otp": "000000"},
        )
        assert locked_res.status_code == 429


@pytest.mark.asyncio
async def test_level_onboarding_and_account_deletion() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        default_sms_provider.sent_messages.clear()
        await client.post("/auth/otp/request", json={"phone": "0201112233"})
        _, msg = default_sms_provider.sent_messages[0]
        import re

        otp_code = re.search(r"\b\d{6}\b", msg).group(0)

        v_res = await client.post(
            "/auth/otp/verify",
            json={"phone": "0201112233", "otp": otp_code, "name": "Akua Darko"},
        )
        token = v_res.json()["access_token"]

        # Level onboarding
        onboard_res = await client.post(
            "/me/onboarding",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "years_playing": "1_to_3",
                "match_experience": "regular",
                "uses_bandeja_vibora": True,
                "wall_confidence": "comfortable",
            },
        )
        assert onboard_res.status_code == 200
        level_data = onboard_res.json()
        assert level_data["level"] >= 3.0
        assert "Intermediate" in level_data["level_band"]

        # Partner search finds Akua Darko as "Akua D."
        partner_res = await client.get("/partners?min_level=2.0&max_level=4.0")
        assert partner_res.status_code == 200
        partners = partner_res.json()
        assert any(p["display_name"] == "Akua D." for p in partners)

        # Account deletion (Act 843 compliant)
        del_res = await client.delete(
            "/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert del_res.status_code == 204

        # Token is now invalid / profile anonymized
        me_res = await client.get(
            "/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me_res.status_code == 200
        assert me_res.json()["name"] == "Former player"
