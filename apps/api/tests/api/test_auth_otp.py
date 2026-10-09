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


@pytest.mark.asyncio
async def test_cookie_auth_and_logout_flow() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="https://test") as client:
        default_sms_provider.sent_messages.clear()
        phone = "0245550001"

        # 1. Request OTP
        req_res = await client.post("/auth/otp/request", json={"phone": phone})
        assert req_res.status_code == 200
        data = req_res.json()
        assert "expires_at" in data
        assert data["expires_in_seconds"] == 300

        # Extract OTP
        _, msg = default_sms_provider.sent_messages[-1]
        import re

        otp_code = re.search(r"\b\d{6}\b", msg).group(0)

        # 2. Verify OTP sets HttpOnly + SameSite cookie
        v_res = await client.post(
            "/auth/otp/verify",
            json={"phone": phone, "otp": otp_code, "name": "Kofi Mensah"},
        )
        assert v_res.status_code == 200
        cookie_header = v_res.headers.get("set-cookie", "")
        assert "padel_refresh_token" in cookie_header
        assert "HttpOnly" in cookie_header or "httponly" in cookie_header.lower()
        assert "samesite=lax" in cookie_header.lower()
        assert "secure" in cookie_header.lower()

        # 3. Refresh tokens using the cookie (no body refresh_token)
        ref_res = await client.post("/auth/refresh")
        assert ref_res.status_code == 200
        ref_data = ref_res.json()
        assert "access_token" in ref_data
        new_cookie_header = ref_res.headers.get("set-cookie", "")
        assert "padel_refresh_token" in new_cookie_header

        # 4. Logout revokes token and clears cookie
        logout_res = await client.post("/auth/logout")
        assert logout_res.status_code == 200
        del_cookie = logout_res.headers.get("set-cookie", "")
        assert "padel_refresh_token" in del_cookie
        # Cookie cleared with empty value or max-age=0
        assert (
            "max-age=0" in del_cookie.lower() or 'padel_refresh_token=""' in del_cookie
        )

        # 5. Refresh after logout must fail
        post_logout_ref = await client.post("/auth/refresh")
        assert post_logout_ref.status_code == 401


@pytest.mark.asyncio
async def test_phone_rate_limit_3_per_hour() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        phone = "0249991122"
        # 3 requests succeed
        for _ in range(3):
            res = await client.post("/auth/otp/request", json={"phone": phone})
            assert res.status_code == 200

        # 4th request within hour is rate-limited
        res_4 = await client.post("/auth/otp/request", json={"phone": phone})
        assert res_4.status_code == 429
        assert "Too many OTP requests for this phone number" in res_4.json()["detail"]


@pytest.mark.asyncio
async def test_ip_rate_limit_10_per_hour() -> None:
    from app.identity.service import clear_ip_rate_limits

    clear_ip_rate_limits()

    # Create client with specific IP
    test_ip = "192.168.10.50"
    transport = ASGITransport(app=app, client=(test_ip, 50000))
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 10 requests from different phones on the same IP succeed
        for i in range(10):
            phone = f"02488800{i:02d}"
            res = await client.post("/auth/otp/request", json={"phone": phone})
            assert res.status_code == 200

        # 11th request from same IP is rate-limited
        res_11 = await client.post("/auth/otp/request", json={"phone": "0248880099"})
        assert res_11.status_code == 429
        assert "Too many OTP requests from this IP address" in res_11.json()["detail"]

    clear_ip_rate_limits()


@pytest.mark.asyncio
async def test_sms_provider_production_security() -> None:
    from app.config import settings
    from app.notify.sms import (
        ProductionSmsProvider,
        TestMemorySmsProvider,
        get_sms_provider,
    )

    test_provider = TestMemorySmsProvider()
    await test_provider.send_sms("+233241234567", "Your code is 123456")

    # In test environment, get_last_code() succeeds
    original_env = settings.environment
    try:
        settings.environment = "test"
        assert test_provider.get_last_code() == "123456"

        # In production environment, reading OTP code is strictly blocked
        settings.environment = "production"
        with pytest.raises(
            RuntimeError, match="strictly disabled outside test environment"
        ):
            test_provider.get_last_code()

        # In production, get_sms_provider returns ProductionSmsProvider
        prod_provider = get_sms_provider()
        assert isinstance(prod_provider, ProductionSmsProvider)
        assert not hasattr(prod_provider, "get_last_code")
        assert not hasattr(prod_provider, "sent_messages")
    finally:
        settings.environment = original_env


@pytest.mark.asyncio
async def test_otp_request_privacy_response_identical() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Request for new phone
        res_new = await client.post("/auth/otp/request", json={"phone": "0247770001"})
        assert res_new.status_code == 200
        new_data = res_new.json()

        # Verify to create user
        _, msg = default_sms_provider.sent_messages[-1]
        import re

        code = re.search(r"\b\d{6}\b", msg).group(0)
        await client.post(
            "/auth/otp/verify",
            json={"phone": "0247770001", "otp": code, "name": "Existing User"},
        )

        # Request again for the now-existing user
        res_existing = await client.post(
            "/auth/otp/request", json={"phone": "0247770001"}
        )
        assert res_existing.status_code == 200
        existing_data = res_existing.json()

        # Responses must match in structure and message without leaking existence
        assert res_new.status_code == res_existing.status_code
        assert new_data["message"] == existing_data["message"]
        assert "expires_in_seconds" in existing_data
        assert "expires_at" in existing_data
