"""Comprehensive test suite for Email Verification, Identity Rules, Rate Limiting,
Password Reset, Token Reuse Detection, Role Separation, and Privacy Logging.
"""

import asyncio
import logging
import re
from datetime import UTC, datetime, timedelta

import pytest
from fastapi import HTTPException
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from app.config import settings
from app.events.models import Event
from app.identity.logging_utils import SensitiveDataFilter
from app.identity.models import (
    EmailVerificationToken,
    User,
)
from app.identity.password_policy import validate_password_policy
from app.identity.rate_limiter import auth_rate_limiter
from app.identity.service import IdentityService
from app.main import app
from app.notify.email import get_email_provider
from tests.conftest import test_session_maker as session_maker


@pytest.fixture(autouse=True)
def clean_rate_limiter_and_email() -> None:
    auth_rate_limiter.clear()
    provider = get_email_provider()
    if hasattr(provider, "clear"):
        provider.clear()


@pytest.mark.asyncio
async def test_email_verification_single_use_and_expiring() -> None:
    """1. Single-use, expiring, hashed email verification token."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register user
        reg_res = await client.post(
            "/auth/register",
            json={
                "email": "verify.token@example.com",
                "password": "ValidPassword123!",
                "name": "Verify Player",
            },
        )
        assert reg_res.status_code == 200

        # Retrieve raw verification token from dispatched email
        provider = get_email_provider()
        assert len(provider.sent_messages) > 0
        last_email = provider.sent_messages[-1]
        match = re.search(r"token=([A-Za-z0-9_\-]+)", last_email.body_text)
        assert match is not None
        raw_token = match.group(1)

        # Verify DB stores hashed token, NOT raw token
        async with session_maker() as session:
            stmt = (
                select(EmailVerificationToken)
                .join(User)
                .where(User.email == "verify.token@example.com")
            )
            token_rec = (await session.execute(stmt)).scalars().first()
            assert token_rec is not None
            assert token_rec.token_hash != raw_token
            assert token_rec.used is False

        # First verification succeeds
        verify_res = await client.post(
            "/auth/verify-email",
            json={"token": raw_token},
        )
        assert verify_res.status_code == 200
        assert "verified successfully" in verify_res.json()["message"].lower()

        # Check DB state
        async with session_maker() as session:
            stmt = select(User).where(User.email == "verify.token@example.com")
            user = (await session.execute(stmt)).scalar_one()
            assert user.email_verified is True

        # Second verification fails (Single-use token)
        verify_res2 = await client.post(
            "/auth/verify-email",
            json={"token": raw_token},
        )
        assert verify_res2.status_code == 400
        assert "invalid or expired" in verify_res2.json()["detail"].lower()


@pytest.mark.asyncio
async def test_unverified_account_can_browse_but_cannot_join_events() -> None:
    """1. Unverified accounts may browse but cannot join events until email or phone is verified."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register new account (unverified)
        await client.post(
            "/auth/register",
            json={
                "email": "browse.only@example.com",
                "password": "SecurePassword123!",
                "name": "Unverified Browser",
            },
        )

        login_res = await client.post(
            "/auth/login",
            json={
                "email": "browse.only@example.com",
                "password": "SecurePassword123!",
            },
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Unverified user CAN browse venues and profile
        venues_res = await client.get("/venues", headers=headers)
        assert venues_res.status_code == 200

        profile_res = await client.get("/me", headers=headers)
        assert profile_res.status_code == 200
        assert profile_res.json()["email_verified"] is False
        assert profile_res.json()["phone_verified"] is False

        # Create dummy event for testing event join gate
        async with session_maker() as session:
            event = Event(
                id="test-unverified-event-1",
                venue_name="Accra City Padel",
                title="Weekly Americano",
                format="AMERICANO",
                status="REGISTRATION_OPEN",
                courts=2,
                point_target=21,
                planned_rounds=8,
                max_players=8,
                price_pesewas=5000,
                court_rate_pesewas=2000,
                start_time=datetime.now(UTC) + timedelta(days=2),
            )
            session.add(event)
            await session.commit()

        # 2. Unverified user CANNOT join event -> HTTP 403
        join_res = await client.post(
            f"/events/{event.id}/join",
            headers=headers,
            json={"method": "PAYSTACK"},
        )
        assert join_res.status_code == 403
        assert "verify your email" in join_res.json()["detail"].lower()

        # 3. Now verify email via link
        provider = get_email_provider()
        last_email = provider.sent_messages[-1]
        raw_token = re.search(r"token=([A-Za-z0-9_\-]+)", last_email.body_text).group(1)
        v_res = await client.post("/auth/verify-email", json={"token": raw_token})
        assert v_res.status_code == 200

        # 4. Now join attempt proceeds past unverified check
        join_res2 = await client.post(
            f"/events/{event.id}/join",
            headers=headers,
            json={"method": "PAYSTACK"},
        )
        assert join_res2.status_code != 403 or "verify" not in join_res2.text.lower()


@pytest.mark.asyncio
async def test_registration_identical_response_no_409_leak_and_owner_notified() -> None:
    """1. Registration returns identical response for existing email and notifies owner."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Initial registration
        res1 = await client.post(
            "/auth/register",
            json={
                "email": "owner.alert@example.com",
                "password": "FirstPassword123!",
                "name": "Owner User",
            },
        )
        assert res1.status_code == 200
        data1 = res1.json()

        provider = get_email_provider()
        provider.clear()

        # Second registration with same email
        res2 = await client.post(
            "/auth/register",
            json={
                "email": "owner.alert@example.com",
                "password": "AttemptPassword456!",
                "name": "Imposter User",
            },
        )
        assert res2.status_code == 200
        data2 = res2.json()
        assert data1 == data2, "Response must not leak account existence"

        # Owner received notice email
        assert len(provider.sent_messages) == 1
        alert_email = provider.sent_messages[0]
        assert alert_email.to == "owner.alert@example.com"
        assert "Account Notice" in alert_email.subject
        assert "Not you? You can safely ignore this email" in alert_email.body_text


@pytest.mark.asyncio
async def test_adding_phone_to_email_account_and_collision_handling() -> None:
    """2. Adding phone to email account (OTP) and handling verified collisions (offer merge)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register email user
        await client.post(
            "/auth/register",
            json={"email": "player.with.phone@example.com", "password": "Password123!"},
        )
        login_res = await client.post(
            "/auth/login",
            json={"email": "player.with.phone@example.com", "password": "Password123!"},
        )
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Request adding phone
        req_phone_res = await client.post(
            "/me/phone/request",
            headers=headers,
            json={"phone": "0244111222"},
        )
        assert req_phone_res.status_code == 200

        # Retrieve last OTP from test endpoint
        otp_res = await client.get("/auth/test/last-otp")
        otp_code = otp_res.json()["code"]
        assert otp_code is not None

        # Verify phone with OTP
        verify_phone_res = await client.post(
            "/me/phone/verify",
            headers=headers,
            json={"phone": "0244111222", "otp": otp_code},
        )
        assert verify_phone_res.status_code == 200
        profile = verify_phone_res.json()
        assert profile["phone_verified"] is True
        assert profile["phone_e164"] == "+233244111222"

        # Now, a second user tries to add the SAME verified phone -> collision 409!
        await client.post(
            "/auth/register",
            json={"email": "other.user@example.com", "password": "Password123!"},
        )
        login2 = await client.post(
            "/auth/login",
            json={"email": "other.user@example.com", "password": "Password123!"},
        )
        headers2 = {"Authorization": f"Bearer {login2.json()['access_token']}"}

        collision_res = await client.post(
            "/me/phone/request",
            headers=headers2,
            json={"phone": "0244111222"},
        )
        assert collision_res.status_code == 409
        assert "already verified" in collision_res.json()["detail"].lower()
        assert "merge" in collision_res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_guest_profile_claim_by_email_user_and_collision_merge_offer() -> None:
    """2. Guest-profile claim by email user, and collision detection (offers merge, never auto-merges)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create a guest player as organizer
        guest_res = await client.post(
            "/players/guest",
            json={"name": "Guest Kweku", "phone": "0244998877"},
        )
        assert guest_res.status_code == 200
        claim_link = guest_res.json()["claim_link"]
        claim_token = claim_link.split("/")[-1]

        # Register an email user
        await client.post(
            "/auth/register",
            json={
                "email": "claimant@example.com",
                "password": "Password123!",
                "name": "Kweku Claimant",
            },
        )
        login_res = await client.post(
            "/auth/login",
            json={"email": "claimant@example.com", "password": "Password123!"},
        )
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Case A: Successful claim when no collision
        claim_res = await client.post(
            "/me/claim-guest",
            headers=headers,
            json={"claim_token": claim_token},
        )
        assert claim_res.status_code == 200
        assert "successfully claimed" in claim_res.json()["message"].lower()

        # Case B: Collision detection when claiming user already has conflicting verified phone
        guest2_res = await client.post(
            "/players/guest",
            json={"name": "Guest Two", "phone": "0244333444"},
        )
        claim_token2 = guest2_res.json()["claim_link"].split("/")[-1]

        # Register user with verified conflicting phone
        async with session_maker() as session:
            conflict_user = User(
                id="verified-phone-user-id",
                email="conflict@example.com",
                phone_e164="+233201234567",
                phone_verified=True,
                name="Conflict User",
                role="PLAYER",
                is_active=True,
            )
            session.add(conflict_user)
            await session.commit()

        service = IdentityService(None)  # type: ignore[arg-type]
        conflict_token = service.create_access_token("verified-phone-user-id")

        collision_claim = await client.post(
            "/me/claim-guest",
            headers={"Authorization": f"Bearer {conflict_token}"},
            json={"claim_token": claim_token2},
        )
        assert collision_claim.status_code == 409
        assert "collision" in collision_claim.json()["detail"].lower()
        assert "merge" in collision_claim.json()["detail"].lower()


@pytest.mark.asyncio
async def test_rate_limits_progressive_backoff_on_login_and_register() -> None:
    """3. Rate limits and progressive delay on login/register without hard lockout of accounts."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Multiple rapid logins for account
        delays: list[float] = []
        for i in range(5):
            t0 = asyncio.get_event_loop().time()
            res = await client.post(
                "/auth/login",
                json={"email": "victim@example.com", "password": f"WrongAttempt{i}!"},
            )
            t1 = asyncio.get_event_loop().time()
            delays.append(t1 - t0)
            assert res.status_code == 401

        # Verify backoff introduced progressive delay without locking out the account
        assert delays[-1] > delays[0]

        # Real user with correct password is NOT locked out by account spam
        reg_res = await client.post(
            "/auth/register",
            json={"email": "victim@example.com", "password": "RealCorrectPassword123!"},
        )
        assert reg_res.status_code == 200  # Not hard-locked!


@pytest.mark.asyncio
async def test_resend_verification_cooldown() -> None:
    """3. Verification resend has progressive cooldown."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Registration dispatches initial verification email
        await client.post(
            "/auth/register",
            json={"email": "resend.test@example.com", "password": "Password123!"},
        )

        # Immediate resend within cooldown window -> 429 Too Many Requests
        r1 = await client.post(
            "/auth/verify-email/resend",
            json={"email": "resend.test@example.com"},
        )
        assert r1.status_code == 429
        assert "retry-after" in [k.lower() for k in r1.headers]

        # Simulate cooldown expiration by setting token creation timestamp back in DB
        async with session_maker() as session:
            stmt = (
                select(EmailVerificationToken)
                .join(User)
                .where(User.email == "resend.test@example.com")
            )
            tok = (await session.execute(stmt)).scalars().first()
            assert tok is not None
            tok.created_at = datetime.now(UTC) - timedelta(seconds=120)
            await session.commit()

        # Resend after cooldown window -> 200 OK
        r2 = await client.post(
            "/auth/verify-email/resend",
            json={"email": "resend.test@example.com"},
        )
        assert r2.status_code == 200


@pytest.mark.asyncio
async def test_password_reset_revokes_all_sessions_and_family() -> None:
    """4 & 7. Password reset revokes ALL sessions; refresh token reuse revokes family."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register and login session 1
        await client.post(
            "/auth/register",
            json={
                "email": "session.user@example.com",
                "password": "InitialPassword123!",
            },
        )
        s1 = await client.post(
            "/auth/login",
            json={
                "email": "session.user@example.com",
                "password": "InitialPassword123!",
            },
        )
        assert s1.status_code == 200
        ref1 = s1.json()["refresh_token"]

        # Login session 2
        s2 = await client.post(
            "/auth/login",
            json={
                "email": "session.user@example.com",
                "password": "InitialPassword123!",
            },
        )
        assert s2.status_code == 200
        ref2 = s2.json()["refresh_token"]

        # Request and confirm password reset
        await client.post(
            "/auth/password-reset/request", json={"email": "session.user@example.com"}
        )
        provider = get_email_provider()
        reset_token = re.search(
            r"token=([A-Za-z0-9_\-]+)", provider.sent_messages[-1].body_text
        ).group(1)

        confirm_res = await client.post(
            "/auth/password-reset/confirm",
            json={"token": reset_token, "new_password": "NewUpdatedPassword123!"},
        )
        assert confirm_res.status_code == 200

        # Both sessions' refresh tokens are now revoked!
        r_ref1 = await client.post("/auth/refresh", json={"refresh_token": ref1})
        assert r_ref1.status_code == 401

        r_ref2 = await client.post("/auth/refresh", json={"refresh_token": ref2})
        assert r_ref2.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token_reuse_detection_revokes_family() -> None:
    """7. Refresh-token reuse detection: replaying rotated token revokes entire token family."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register and login
        await client.post(
            "/auth/register",
            json={"email": "reuse.family@example.com", "password": "Password123!"},
        )
        login_res = await client.post(
            "/auth/login",
            json={"email": "reuse.family@example.com", "password": "Password123!"},
        )
        token1 = login_res.json()["refresh_token"]

        # Legitimate rotation 1: token1 -> token2
        rot1 = await client.post("/auth/refresh", json={"refresh_token": token1})
        assert rot1.status_code == 200
        token2 = rot1.json()["refresh_token"]

        # Attacker replays already-rotated token1!
        replay_res = await client.post("/auth/refresh", json={"refresh_token": token1})
        assert replay_res.status_code == 401
        assert "reuse detected" in replay_res.json()["detail"].lower()

        # Legitimate client trying to use token2 now also gets 401 (family revoked!)
        rot2 = await client.post("/auth/refresh", json={"refresh_token": token2})
        assert rot2.status_code == 401
        assert any(
            msg in rot2.json()["detail"].lower()
            for msg in ["reuse detected", "revoked", "invalid or expired"]
        )


@pytest.mark.asyncio
async def test_production_config_cannot_use_console_email_provider() -> None:
    """5. In production, console email adapter is strictly blocked."""
    old_env = settings.environment
    old_provider = settings.email_provider
    try:
        settings.environment = "production"
        settings.email_provider = "console"
        with pytest.raises(RuntimeError, match="cannot be used in production"):
            get_email_provider()
    finally:
        settings.environment = old_env
        settings.email_provider = old_provider


@pytest.mark.asyncio
async def test_password_policy_validation() -> None:
    """6. Password policy: 8-128 chars, rejects common/breached passwords, no composition rules."""
    # Min length
    with pytest.raises(HTTPException):
        validate_password_policy("short")

    # Max length
    with pytest.raises(HTTPException):
        validate_password_policy("a" * 129)

    # Common password rejected
    with pytest.raises(HTTPException):
        validate_password_policy("password123")
    with pytest.raises(HTTPException):
        validate_password_policy("admin123")

    # No composition rules: 8-char lowercase valid
    validate_password_policy("supersecretpass")


@pytest.mark.asyncio
async def test_role_separation_player_and_admin_not_interchangeable() -> None:
    """8. Player tokens cannot access admin routes; admin tokens cannot access player routes."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        service = IdentityService(session_maker())
        player_token = service.create_access_token(user_id="player-id-1", role="PLAYER")
        admin_token = service.create_access_token(user_id="admin-id-1", role="ADMIN")

        # 1. Player token on admin route -> 403 Forbidden
        p_on_admin = await client.get(
            "/admin/verify-access",
            headers={"Authorization": f"Bearer {player_token}"},
        )
        assert p_on_admin.status_code == 403
        assert "admin privileges required" in p_on_admin.json()["detail"].lower()

        # 2. Admin token on player route -> 403 Forbidden
        a_on_player = await client.get(
            "/me",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert a_on_player.status_code == 403
        assert (
            "admin tokens cannot access player endpoints"
            in a_on_player.json()["detail"].lower()
        )

        # 3. Admin token on admin route -> 200 OK
        a_on_admin = await client.get(
            "/admin/verify-access",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert a_on_admin.status_code == 200


@pytest.mark.asyncio
async def test_auth_logs_redact_passwords_tokens_and_full_emails() -> None:
    """9. Logs scrub raw passwords, tokens, reset links, and full emails."""
    flt = SensitiveDataFilter()

    # Test raw email masking
    rec1 = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg="Login attempt for user kwame.mensah@example.com",
        args=(),
        exc_info=None,
    )
    flt.filter(rec1)
    assert "kwame.mensah@example.com" not in rec1.msg
    assert "kw***h@example.com" in rec1.msg

    # Test raw password & token redaction
    rec2 = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg="Auth with password='SuperSecretPassword123!' and token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        args=(),
        exc_info=None,
    )
    flt.filter(rec2)
    assert "SuperSecretPassword123!" not in rec2.msg
    assert "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" not in rec2.msg
    assert "[REDACTED_SECRET]" in rec2.msg

    # Test reset link redaction
    rec3 = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg="Reset link: https://app.padelghana.com/auth/password-reset?token=abcdef1234567890",
        args=(),
        exc_info=None,
    )
    flt.filter(rec3)
    assert "abcdef1234567890" not in rec3.msg
    assert "[REDACTED_LINK]" in rec3.msg
