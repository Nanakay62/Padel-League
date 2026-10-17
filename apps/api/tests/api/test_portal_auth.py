"""Tests for back-office portal authentication, TOTP MFA, host separation, and invite acceptance."""

from datetime import UTC, datetime

import pyotp
import pytest
from httpx import ASGITransport, AsyncClient

from app.authz.policy import ClubRole
from app.config import settings
from app.identity.password_policy import hash_password
from app.main import app
from app.notify.email import default_email_provider
from app.venues.models import Venue, VenueInvite, VenueMembership


@pytest.fixture(autouse=True)
def clear_email_provider() -> None:
    default_email_provider.clear()


@pytest.mark.asyncio
async def test_portal_login_requires_mfa(prepare_database: None) -> None:
    from app.identity.models import User
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        user = User(
            id="club-user-1",
            name="Club Manager",
            email="manager@accrapadel.com",
            hashed_password=hash_password("SuperSecret12345!"),
            role="PLAYER",
        )
        venue = Venue(id="v-portal-1", name="Accra Padel", address="Airport")
        mem = VenueMembership(
            id="mem-p-1",
            user_id=user.id,
            venue_id=venue.id,
            role=ClubRole.CLUB_OWNER,
            status="ACTIVE",
        )
        db.add_all([user, venue, mem])
        await db.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Invalid password
        bad_res = await client.post(
            "/portal/auth/login",
            json={
                "email": "manager@accrapadel.com",
                "password": "WrongPassword123!",
                "host_type": "CLUB",
            },
        )
        assert bad_res.status_code == 401

        # Valid password -> Requires MFA setup (since no TOTP registered yet)
        res = await client.post(
            "/portal/auth/login",
            json={
                "email": "manager@accrapadel.com",
                "password": "SuperSecret12345!",
                "host_type": "CLUB",
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data.get("requires_mfa_setup") is True
        assert "mfa_token" in data


@pytest.mark.asyncio
async def test_portal_mfa_setup_and_confirm(prepare_database: None) -> None:
    from app.identity.models import User
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        user = User(
            id="club-user-setup",
            name="Setup Manager",
            email="setup@accrapadel.com",
            hashed_password=hash_password("SuperSecret12345!"),
            role="PLAYER",
        )
        venue = Venue(id="v-setup-1", name="Accra Padel", address="Airport")
        mem = VenueMembership(
            id="mem-setup-1",
            user_id=user.id,
            venue_id=venue.id,
            role=ClubRole.CLUB_OWNER,
            status="ACTIVE",
        )
        db.add_all([user, venue, mem])
        await db.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Login
        login_res = await client.post(
            "/portal/auth/login",
            json={
                "email": "setup@accrapadel.com",
                "password": "SuperSecret12345!",
                "host_type": "CLUB",
            },
        )
        mfa_token = login_res.json()["mfa_token"]

        # 2. Setup MFA
        setup_res = await client.post(
            "/portal/auth/mfa/setup",
            json={"mfa_token": mfa_token},
        )
        assert setup_res.status_code == 200
        setup_data = setup_res.json()
        secret = setup_data["secret"]
        recovery_codes = setup_data["recovery_codes"]
        assert len(recovery_codes) == 8
        assert "otpauth_url" in setup_data

        # 3. Confirm Setup with valid TOTP code
        totp = pyotp.TOTP(secret)
        valid_code = totp.now()

        confirm_res = await client.post(
            "/portal/auth/mfa/confirm-setup",
            json={
                "mfa_token": mfa_token,
                "code": valid_code,
                "host_type": "CLUB",
            },
        )
        assert confirm_res.status_code == 200
        confirm_data = confirm_res.json()
        assert confirm_data["user"]["email"] == "setup@accrapadel.com"
        assert len(confirm_data["venues"]) == 1
        assert "padel_club_session" in confirm_res.cookies


@pytest.mark.asyncio
async def test_portal_mfa_verify_replay_protection(prepare_database: None) -> None:
    from app.domain.totp import encrypt_totp_secret
    from app.identity.models import User
    from tests.conftest import test_session_maker

    secret = pyotp.random_base32()
    enc_secret = encrypt_totp_secret(secret, settings.totp_encryption_key)

    async with test_session_maker() as db:
        user = User(
            id="club-user-replay",
            name="Replay Manager",
            email="replay@accrapadel.com",
            hashed_password=hash_password("SuperSecret12345!"),
            role="PLAYER",
            totp_secret_enc=enc_secret,
            totp_enabled_at=datetime.now(UTC),
        )
        venue = Venue(id="v-replay-1", name="Accra Padel", address="Airport")
        mem = VenueMembership(
            id="mem-replay-1",
            user_id=user.id,
            venue_id=venue.id,
            role=ClubRole.CLUB_ADMIN,
            status="ACTIVE",
        )
        db.add_all([user, venue, mem])
        await db.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # First login gets requires_mfa=True
        login_res = await client.post(
            "/portal/auth/login",
            json={
                "email": "replay@accrapadel.com",
                "password": "SuperSecret12345!",
                "host_type": "CLUB",
            },
        )
        assert login_res.status_code == 200
        assert login_res.json()["requires_mfa"] is True
        mfa_token = login_res.json()["mfa_token"]

        totp = pyotp.TOTP(secret)
        code = totp.now()

        # First verification succeeds
        v1 = await client.post(
            "/portal/auth/mfa/verify",
            json={
                "mfa_token": mfa_token,
                "code": code,
                "host_type": "CLUB",
            },
        )
        assert v1.status_code == 200

        # Attempting to verify the exact same code again fails (replay prevention)
        login_res2 = await client.post(
            "/portal/auth/login",
            json={
                "email": "replay@accrapadel.com",
                "password": "SuperSecret12345!",
                "host_type": "CLUB",
            },
        )
        mfa_token2 = login_res2.json()["mfa_token"]

        v2 = await client.post(
            "/portal/auth/mfa/verify",
            json={
                "mfa_token": mfa_token2,
                "code": code,
                "host_type": "CLUB",
            },
        )
        assert v2.status_code == 400
        assert "already used" in v2.json()["detail"].lower()


@pytest.mark.asyncio
async def test_portal_recovery_code_single_use(prepare_database: None) -> None:
    from app.domain.totp import encrypt_totp_secret, hash_recovery_code
    from app.identity.models import RecoveryCode, User
    from tests.conftest import test_session_maker

    secret = pyotp.random_base32()
    enc_secret = encrypt_totp_secret(secret, settings.totp_encryption_key)
    raw_recovery_code = "ABCD-1234-EFGH"

    async with test_session_maker() as db:
        user = User(
            id="club-user-rec",
            name="Recovery Manager",
            email="recovery@accrapadel.com",
            hashed_password=hash_password("SuperSecret12345!"),
            role="PLAYER",
            totp_secret_enc=enc_secret,
        )
        venue = Venue(id="v-rec-1", name="Accra Padel", address="Airport")
        mem = VenueMembership(
            id="mem-rec-1",
            user_id=user.id,
            venue_id=venue.id,
            role=ClubRole.CLUB_ADMIN,
            status="ACTIVE",
        )
        rec = RecoveryCode(
            id="rec-1",
            user_id=user.id,
            code_hash=hash_recovery_code(raw_recovery_code),
        )
        db.add_all([user, venue, mem, rec])
        await db.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        login_res = await client.post(
            "/portal/auth/login",
            json={
                "email": "recovery@accrapadel.com",
                "password": "SuperSecret12345!",
                "host_type": "CLUB",
            },
        )
        mfa_token = login_res.json()["mfa_token"]

        # First use of recovery code succeeds
        rec_res = await client.post(
            "/portal/auth/mfa/verify",
            json={
                "mfa_token": mfa_token,
                "code": raw_recovery_code,
                "host_type": "CLUB",
            },
        )
        assert rec_res.status_code == 200

        # Second use of the same recovery code fails
        login_res2 = await client.post(
            "/portal/auth/login",
            json={
                "email": "recovery@accrapadel.com",
                "password": "SuperSecret12345!",
                "host_type": "CLUB",
            },
        )
        mfa_token2 = login_res2.json()["mfa_token"]

        rec_res2 = await client.post(
            "/portal/auth/mfa/verify",
            json={
                "mfa_token": mfa_token2,
                "code": raw_recovery_code,
                "host_type": "CLUB",
            },
        )
        assert rec_res2.status_code == 400


@pytest.mark.asyncio
async def test_portal_host_separation_super_admin_vs_club(
    prepare_database: None,
) -> None:
    from app.identity.models import User
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        # Regular player without club role
        player = User(
            id="regular-player",
            name="Regular Player",
            email="player@padel.com",
            hashed_password=hash_password("SuperSecret12345!"),
            role="PLAYER",
        )
        # Super admin
        super_admin = User(
            id="super-admin-sep",
            name="Super Admin",
            email="admin@padelghana.com",
            hashed_password=hash_password("SuperAdminSecret123!"),
            role="SUPER_ADMIN",
        )
        db.add_all([player, super_admin])
        await db.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Regular player trying to log into Club Portal -> 403 Forbidden
        club_res = await client.post(
            "/portal/auth/login",
            json={
                "email": "player@padel.com",
                "password": "SuperSecret12345!",
                "host_type": "CLUB",
            },
        )
        assert club_res.status_code == 403
        assert "club staff membership required" in club_res.json()["detail"].lower()

        # 2. Regular player trying to log into Admin Portal -> 403 Forbidden
        admin_res = await client.post(
            "/portal/auth/login",
            json={
                "email": "player@padel.com",
                "password": "SuperSecret12345!",
                "host_type": "ADMIN",
            },
        )
        assert admin_res.status_code == 403
        assert "admin privileges required" in admin_res.json()["detail"].lower()

        # 3. Super Admin can log into Admin Portal
        sa_res = await client.post(
            "/portal/auth/login",
            json={
                "email": "admin@padelghana.com",
                "password": "SuperAdminSecret123!",
                "host_type": "ADMIN",
            },
        )
        assert sa_res.status_code == 200


@pytest.mark.asyncio
async def test_portal_accept_invite_and_enforce_limit(prepare_database: None) -> None:
    import hashlib
    from datetime import UTC, datetime, timedelta

    from tests.conftest import test_session_maker

    raw_token_1 = "invite-secret-token-123"
    token_hash_1 = hashlib.sha256(raw_token_1.encode()).hexdigest()

    raw_token_2 = "invite-secret-token-456"
    token_hash_2 = hashlib.sha256(raw_token_2.encode()).hexdigest()

    async with test_session_maker() as db:
        v1 = Venue(id="v-inv-1", name="Club Alpha", address="Airport")
        v2 = Venue(id="v-inv-2", name="Club Beta", address="East Legon")
        inv1 = VenueInvite(
            id="inv-1",
            venue_id=v1.id,
            email="invited@club.com",
            role=ClubRole.CLUB_ADMIN,
            token_hash=token_hash_1,
            expires_at=datetime.now(UTC) + timedelta(days=2),
        )
        inv2 = VenueInvite(
            id="inv-2",
            venue_id=v2.id,
            email="invited@club.com",
            role=ClubRole.CLUB_ADMIN,
            token_hash=token_hash_2,
            expires_at=datetime.now(UTC) + timedelta(days=2),
        )
        db.add_all([v1, v2, inv1, inv2])
        await db.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Accept first invite -> creates user and first membership
        acc1 = await client.post(
            "/portal/invites/accept",
            json={
                "token": raw_token_1,
                "name": "Invited Admin",
                "password": "ValidPassword123!",
            },
        )
        assert acc1.status_code == 200
        assert acc1.json()["venue_id"] == "v-inv-1"

        # 2. Accept second invite when launch limit = 1 -> Rejected (HTTP 400)
        original_limit = settings.max_venues_per_club_user
        try:
            settings.max_venues_per_club_user = 1
            acc2 = await client.post(
                "/portal/invites/accept",
                json={
                    "token": raw_token_2,
                    "name": "Invited Admin",
                    "password": "ValidPassword123!",
                },
            )
            assert acc2.status_code == 400
            assert "maximum number of venues" in acc2.json()["detail"].lower()
        finally:
            settings.max_venues_per_club_user = original_limit


@pytest.mark.asyncio
async def test_portal_me_and_logout(prepare_database: None) -> None:
    import hashlib
    from datetime import UTC, datetime, timedelta

    from app.identity.models import User, UserSession
    from tests.conftest import test_session_maker

    session_cookie = "test_club_session_token_xyz"
    token_hash = hashlib.sha256(session_cookie.encode()).hexdigest()

    async with test_session_maker() as db:
        user = User(
            id="user-me-test",
            name="Me User",
            email="me@club.com",
            role="PLAYER",
        )
        venue = Venue(id="v-me-1", name="Club Me", address="Cantonments")
        mem = VenueMembership(
            id="mem-me-1",
            user_id=user.id,
            venue_id=venue.id,
            role=ClubRole.CLUB_OWNER,
            status="ACTIVE",
        )
        session = UserSession(
            id="sess-1",
            user_id=user.id,
            session_token_hash=token_hash,
            venue_id=venue.id,
            role="CLUB_OWNER",
            host_type="CLUB",
            expires_at=datetime.now(UTC) + timedelta(hours=12),
        )
        db.add_all([user, venue, mem, session])
        await db.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        client.cookies.set("padel_club_session", session_cookie)

        # GET /portal/auth/me
        me_res = await client.get("/portal/auth/me")
        assert me_res.status_code == 200
        me_data = me_res.json()
        assert me_data["user"]["id"] == "user-me-test"
        assert len(me_data["memberships"]) == 1
        assert me_data["memberships"][0]["venue_name"] == "Club Me"

        # POST /portal/auth/logout
        logout_res = await client.post("/portal/auth/logout")
        assert logout_res.status_code == 200

        # After logout, /portal/auth/me returns 401
        me_after = await client.get("/portal/auth/me")
        assert me_after.status_code == 401


@pytest.mark.asyncio
async def test_portal_mfa_dev_bypass_and_invalid_codes(prepare_database: None) -> None:
    from app.identity.models import User
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        user = User(
            id="user-dev-bypass",
            name="Dev Tester",
            email="devtest@accrapadel.com",
            hashed_password=hash_password("DevPass12345!"),
            role="PLAYER",
        )
        venue = Venue(id="v-dev-1", name="Dev Venue", address="Accra")
        mem = VenueMembership(
            id="mem-dev-1",
            user_id=user.id,
            venue_id=venue.id,
            role="CLUB_OWNER",
            status="ACTIVE",
        )
        db.add_all([user, venue, mem])
        await db.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Login
        login_res = await client.post(
            "/portal/auth/login",
            json={
                "email": "devtest@accrapadel.com",
                "password": "DevPass12345!",
                "host_type": "CLUB",
            },
        )
        assert login_res.status_code == 200
        mfa_token = login_res.json()["mfa_token"]

        # 2. Setup MFA
        setup_res = await client.post(
            "/portal/auth/mfa/setup",
            json={"mfa_token": mfa_token},
        )
        assert setup_res.status_code == 200

        # 3. Invalid code fails
        invalid_res = await client.post(
            "/portal/auth/mfa/confirm-setup",
            json={
                "mfa_token": mfa_token,
                "code": "999999",
                "host_type": "CLUB",
            },
        )
        assert invalid_res.status_code == 400
        assert "Invalid TOTP verification code" in invalid_res.json()["detail"]

        # 4. Dev code 123456 succeeds in dev/test env
        dev_res = await client.post(
            "/portal/auth/mfa/confirm-setup",
            json={
                "mfa_token": mfa_token,
                "code": "123456",
                "host_type": "CLUB",
            },
        )
        assert dev_res.status_code == 200
        assert dev_res.json()["success"] is True
        assert "padel_club_session" in dev_res.cookies
