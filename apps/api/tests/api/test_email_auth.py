"""Integration tests for Email + Password authentication, Argon2 hashing, and password reset."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_register_with_email_and_password_success() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/auth/register",
            json={
                "email": "padel.player@example.com",
                "password": "SecurePassword123!",
                "name": "Kwaku Manu",
            },
        )
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["status"] == "pending_verification"
        assert "activation link" in data["message"].lower()

        # Login with newly registered credentials
        login_res = await client.post(
            "/auth/login",
            json={
                "email": "padel.player@example.com",
                "password": "SecurePassword123!",
            },
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]

        me_res = await client.get("/me", headers={"Authorization": f"Bearer {token}"})
        assert me_res.status_code == 200
        profile = me_res.json()
        assert profile["email"] == "padel.player@example.com"
        assert profile["name"] == "Kwaku Manu"
        assert profile["phone_e164"] is None
        assert profile["email_verified"] is False


@pytest.mark.asyncio
async def test_register_duplicate_email_returns_identical_response_without_409() -> (
    None
):
    """Handbook 8.1: Registration returns the same response whether or not email exists (no 409 leak)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # First registration
        res1 = await client.post(
            "/auth/register",
            json={
                "email": "duplicate.test@example.com",
                "password": "Password123!",
                "name": "First User",
            },
        )
        assert res1.status_code == 200
        data1 = res1.json()
        assert data1["status"] == "pending_verification"

        # Second registration with same email (case-insensitive) - MUST NOT leak 409!
        res2 = await client.post(
            "/auth/register",
            json={
                "email": "DUPLICATE.TEST@example.com",
                "password": "Password456!",
                "name": "Second User",
            },
        )
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2 == data1, (
            "Duplicate email response must be identical to new email response"
        )


@pytest.mark.asyncio
async def test_login_with_email_and_argon2_password() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register user
        reg_res = await client.post(
            "/auth/register",
            json={
                "email": "signin.test@example.com",
                "password": "CorrectPassword123",
                "name": "Sign In User",
            },
        )
        assert reg_res.status_code == 200

        # Successful login
        login_res = await client.post(
            "/auth/login",
            json={
                "email": "signin.test@example.com",
                "password": "CorrectPassword123",
            },
        )
        assert login_res.status_code == 200
        login_data = login_res.json()
        assert "access_token" in login_data
        assert "refresh_token" in login_data
        assert login_data["is_new_user"] is False

        # Verify access token works on /me
        me_res = await client.get(
            "/me",
            headers={"Authorization": f"Bearer {login_data['access_token']}"},
        )
        assert me_res.status_code == 200
        assert me_res.json()["email"] == "signin.test@example.com"


@pytest.mark.asyncio
async def test_login_with_invalid_credentials_returns_401() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register user
        reg_res = await client.post(
            "/auth/register",
            json={
                "email": "auth.fail@example.com",
                "password": "RealPassword123",
                "name": "Fail Tester",
            },
        )
        assert reg_res.status_code == 200

        # Incorrect password -> 401
        bad_pw_res = await client.post(
            "/auth/login",
            json={
                "email": "auth.fail@example.com",
                "password": "WrongPassword123",
            },
        )
        assert bad_pw_res.status_code == 401
        assert "invalid email or password" in bad_pw_res.json()["detail"].lower()

        # Non-existent email -> 401 (generic message, prevents enumeration)
        bad_email_res = await client.post(
            "/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "RealPassword123",
            },
        )
        assert bad_email_res.status_code == 401
        assert "invalid email or password" in bad_email_res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_register_validation_rules() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Password too short (< 8 chars)
        short_pw_res = await client.post(
            "/auth/register",
            json={
                "email": "short@example.com",
                "password": "short",
                "name": "Short",
            },
        )
        assert short_pw_res.status_code == 422

        # Invalid email
        invalid_email_res = await client.post(
            "/auth/register",
            json={
                "email": "not-an-email",
                "password": "ValidPassword123",
                "name": "Bad Email",
            },
        )
        assert invalid_email_res.status_code == 422


@pytest.mark.asyncio
async def test_password_reset_flow() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Register
        reg_res = await client.post(
            "/auth/register",
            json={
                "email": "reset.me@example.com",
                "password": "OldPassword123",
                "name": "Reset Tester",
            },
        )
        assert reg_res.status_code == 200

        # 2. Request reset
        req_res = await client.post(
            "/auth/password-reset/request",
            json={"email": "reset.me@example.com"},
        )
        assert req_res.status_code == 200
        # For security, API returns generic confirmation message
        assert "message" in req_res.json()

        # Retrieve the raw reset token from the dispatched email (simulating clicking email link)
        import re

        from app.notify.email import get_email_provider

        email_provider = get_email_provider()
        assert hasattr(email_provider, "sent_messages")
        assert len(email_provider.sent_messages) > 0
        last_email = email_provider.sent_messages[-1]
        match = re.search(r"token=([A-Za-z0-9_\-]+)", last_email.body_text)
        assert match is not None
        raw_token = match.group(1)

        # 3. Confirm reset using the raw token
        confirm_res = await client.post(
            "/auth/password-reset/confirm",
            json={
                "token": raw_token,
                "new_password": "BrandNewPassword456!",
            },
        )
        assert confirm_res.status_code == 200

        # 4. Old password fails
        old_login = await client.post(
            "/auth/login",
            json={
                "email": "reset.me@example.com",
                "password": "OldPassword123",
            },
        )
        assert old_login.status_code == 401

        # 5. New password succeeds
        new_login = await client.post(
            "/auth/login",
            json={
                "email": "reset.me@example.com",
                "password": "BrandNewPassword456!",
            },
        )
        assert new_login.status_code == 200
        assert "access_token" in new_login.json()
