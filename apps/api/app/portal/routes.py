import asyncio
import hashlib
import secrets
import time
from datetime import UTC, datetime, timedelta
from typing import Annotated, Any, NoReturn

import jwt
import pyotp
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.authz.deps import get_principal
from app.authz.policy import Principal
from app.config import settings
from app.db import get_db
from app.domain.totp import (
    decrypt_totp_secret,
    encrypt_totp_secret,
    generate_recovery_codes,
    generate_totp_uri,
    hash_recovery_code,
    verify_totp_code,
)
from app.identity.models import RecoveryCode, User, UserSession
from app.identity.password_policy import (
    hash_password,
    validate_admin_password_policy,
    verify_password,
)
from app.identity.rate_limiter import auth_rate_limiter
from app.portal.schemas import (
    InviteAcceptRequest,
    InviteAcceptResponse,
    MfaConfirmSetupRequest,
    MfaSetupRequest,
    MfaSetupResponse,
    MfaVerifyRequest,
    PortalLoginRequest,
    PortalLoginResponse,
    PortalMeResponse,
    PortalUserResponse,
    PortalVenueMembershipResponse,
)
from app.venues.models import Venue, VenueInvite, VenueMembership
from app.venues.service import VenueService

portal_router = APIRouter(prefix="/portal", tags=["Portal"])


def _utc_now() -> datetime:
    return datetime.now(UTC)


def _create_mfa_token(user_id: str, host_type: str) -> str:
    payload = {
        "sub": user_id,
        "type": "mfa_pending",
        "host_type": host_type,
        "exp": _utc_now() + timedelta(minutes=5),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def _verify_mfa_token(token: str) -> dict[str, str]:
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.jwt_algorithm]
        )
        if payload.get("type") != "mfa_pending":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid MFA token type",
            )
        return payload
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"MFA token expired or invalid: {e}",
        ) from e


def _set_portal_cookie(response: Response, host_type: str, session_token: str) -> None:
    cookie_name = (
        "padel_admin_session" if host_type == "ADMIN" else "padel_club_session"
    )
    response.set_cookie(
        key=cookie_name,
        value=session_token,
        httponly=True,
        samesite="strict",
        secure=settings.environment == "production",
        max_age=43200,  # 12 hours
        path="/",
    )


@portal_router.post("/auth/login", response_model=PortalLoginResponse)
async def portal_login(
    data: PortalLoginRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PortalLoginResponse:
    """Authenticate club manager or super admin and challenge for MFA."""
    client_ip = request.client.host if request.client else None
    await auth_rate_limiter.check_and_record(
        action="portal_login",
        client_ip=client_ip,
        account_identifier=data.email,
    )

    # Lookup user by normalized email
    stmt = (
        select(User)
        .options(selectinload(User.sessions))
        .where(func.lower(User.email) == data.email.lower().strip())
    )
    res = await db.execute(stmt)
    user = res.scalars().first()

    if not user or not user.is_active or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Host separation verification
    if data.host_type == "ADMIN":
        if user.role not in ("SUPER_ADMIN", "ADMIN"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin privileges required. Player credentials are not permitted.",
            )
    else:  # CLUB
        is_super_admin = user.role in ("SUPER_ADMIN", "ADMIN")
        # Check if user has active club memberships
        mem_stmt = select(VenueMembership).where(
            VenueMembership.user_id == user.id,
            VenueMembership.status == "ACTIVE",
        )
        mem_res = await db.execute(mem_stmt)
        has_membership = mem_res.scalars().first() is not None

        if not is_super_admin and not has_membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Club staff membership required. Player accounts cannot access the club back office.",
            )

    mfa_token = _create_mfa_token(user.id, data.host_type)

    # Check if TOTP is configured
    if not user.totp_secret_enc or not user.totp_enabled_at:
        return PortalLoginResponse(
            requires_mfa_setup=True,
            mfa_token=mfa_token,
        )

    return PortalLoginResponse(
        requires_mfa=True,
        mfa_token=mfa_token,
    )


@portal_router.post("/auth/mfa/setup", response_model=MfaSetupResponse)
async def portal_mfa_setup(
    data: MfaSetupRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MfaSetupResponse:
    """Generate new TOTP secret and recovery codes for initial 2FA registration."""
    payload = _verify_mfa_token(data.mfa_token)
    user_id = payload["sub"]

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.totp_enabled_at is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="MFA already enabled for this account",
        )

    raw_secret = pyotp.random_base32()
    enc_secret = encrypt_totp_secret(raw_secret, settings.totp_encryption_key)
    user.totp_secret_enc = enc_secret

    # Generate 8 recovery codes
    recovery_codes = generate_recovery_codes(8)
    for code in recovery_codes:
        rec_row = RecoveryCode(
            id=str(secrets.token_hex(16)),
            user_id=user.id,
            code_hash=hash_recovery_code(code),
        )
        db.add(rec_row)

    await db.commit()

    otpauth_url = generate_totp_uri(raw_secret, user.email or user.name, "Padel Ghana")
    return MfaSetupResponse(
        secret=raw_secret,
        otpauth_url=otpauth_url,
        recovery_codes=recovery_codes,
    )


@portal_router.post("/auth/mfa/confirm-setup")
async def portal_mfa_confirm_setup(
    data: MfaConfirmSetupRequest,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """Verify initial TOTP token, mark MFA enabled, and issue session cookie."""
    payload = _verify_mfa_token(data.mfa_token)
    user_id = payload["sub"]
    token_host_type = payload.get("host_type")
    if token_host_type and token_host_type != data.host_type:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Host type mismatch",
        )
    host_type = data.host_type

    user = await db.get(User, user_id)
    if not user or not user.totp_secret_enc:
        raise HTTPException(status_code=400, detail="MFA setup was not initiated")
    if user.totp_enabled_at is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="MFA already enabled for this account",
        )

    secret = decrypt_totp_secret(user.totp_secret_enc, settings.totp_encryption_key)
    is_valid, step = verify_totp_code(secret, data.code)
    # Allow 123456 only in development/test environments for automated and manual dev testing
    if (
        not is_valid
        and settings.environment in ("development", "test")
        and data.code.strip() == "123456"
    ):
        is_valid = True
        step = int(time.time() // 30)

    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid TOTP verification code")

    user.totp_enabled_at = _utc_now()
    user.totp_last_step = step

    # Create session
    session_token = secrets.token_urlsafe(32)
    session_hash = hashlib.sha256(session_token.encode("utf-8")).hexdigest()
    user_session = UserSession(
        user_id=user.id,
        session_token_hash=session_hash,
        role=user.role,
        host_type=host_type,
        expires_at=_utc_now() + timedelta(hours=12),
    )
    db.add(user_session)
    await db.commit()

    _set_portal_cookie(response, host_type, session_token)

    # Fetch venues
    stmt_v = (
        select(Venue)
        .join(VenueMembership, VenueMembership.venue_id == Venue.id)
        .where(
            VenueMembership.user_id == user.id,
            VenueMembership.status == "ACTIVE",
        )
    )
    res_v = await db.execute(stmt_v)
    venues = res_v.scalars().all()

    return {
        "success": True,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
        },
        "venues": [{"id": v.id, "name": v.name} for v in venues],
    }


@portal_router.post("/auth/mfa/verify")
async def portal_mfa_verify(
    data: MfaVerifyRequest,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """Validate TOTP code or single-use recovery code and issue session cookie."""
    payload = _verify_mfa_token(data.mfa_token)
    user_id = payload["sub"]
    token_host_type = payload.get("host_type")
    if token_host_type and token_host_type != data.host_type:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Host type mismatch",
        )
    host_type = data.host_type

    user = await db.get(User, user_id)
    if not user or not user.totp_secret_enc:
        raise HTTPException(status_code=400, detail="MFA is not enabled for this user")

    now = _utc_now()
    locked_until = user.mfa_locked_until
    if locked_until is not None:
        if locked_until.tzinfo is None:
            locked_until = locked_until.replace(tzinfo=UTC)
        if locked_until > now:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Account temporarily locked due to too many failed MFA attempts. Please try again after 15 minutes.",
            )

    code_clean = data.code.strip()

    async def record_failed_attempt(detail: str) -> NoReturn:
        user.failed_mfa_attempts = (user.failed_mfa_attempts or 0) + 1
        if user.failed_mfa_attempts >= 5:
            user.mfa_locked_until = now + timedelta(minutes=15)
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Account temporarily locked due to too many failed MFA attempts. Please try again after 15 minutes.",
            )
        await db.commit()
        raise HTTPException(status_code=400, detail=detail)

    # 1. 6-digit numeric TOTP code
    if len(code_clean) == 6 and code_clean.isdigit():
        secret = decrypt_totp_secret(user.totp_secret_enc, settings.totp_encryption_key)
        is_valid, step = verify_totp_code(secret, code_clean, user.totp_last_step)
        # Allow 123456 only in development/test environments for automated and manual dev testing
        if (
            not is_valid
            and settings.environment in ("development", "test")
            and code_clean == "123456"
        ):
            is_valid = True
            step = int(time.time() // 30)

        if not is_valid:
            if step <= (user.totp_last_step or -1):
                await record_failed_attempt(
                    "TOTP code already used. Please wait for the next 30-second token."
                )
            await record_failed_attempt("Invalid TOTP code")
        user.totp_last_step = step
    else:
        # 2. Recovery code verification
        code_hash = hash_recovery_code(code_clean)
        stmt_rec = select(RecoveryCode).where(
            RecoveryCode.user_id == user.id,
            RecoveryCode.code_hash == code_hash,
            RecoveryCode.used_at.is_(None),
        )
        res_rec = await db.execute(stmt_rec)
        rec_record = res_rec.scalars().first()
        if not rec_record:
            await record_failed_attempt("Invalid or already used recovery code")
        rec_record.used_at = now

    # Reset failed attempts on success
    user.failed_mfa_attempts = 0
    user.mfa_locked_until = None

    # Create session
    session_token = secrets.token_urlsafe(32)
    session_hash = hashlib.sha256(session_token.encode("utf-8")).hexdigest()
    user_session = UserSession(
        user_id=user.id,
        session_token_hash=session_hash,
        role=user.role,
        host_type=host_type,
        expires_at=_utc_now() + timedelta(hours=12),
    )
    db.add(user_session)
    await db.commit()

    _set_portal_cookie(response, host_type, session_token)

    # Fetch venues
    stmt_v = (
        select(Venue)
        .join(VenueMembership, VenueMembership.venue_id == Venue.id)
        .where(
            VenueMembership.user_id == user.id,
            VenueMembership.status == "ACTIVE",
        )
    )
    res_v = await db.execute(stmt_v)
    venues = res_v.scalars().all()

    return {
        "success": True,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
        },
        "venues": [{"id": v.id, "name": v.name} for v in venues],
    }


@portal_router.get("/auth/me", response_model=PortalMeResponse)
async def portal_me(
    principal: Annotated[Principal, Depends(get_principal)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PortalMeResponse:
    """Return profile, platform role, MFA status, and venue memberships for authenticated user."""
    user = await db.get(User, principal.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Fetch venue details for memberships
    stmt_mems = (
        select(VenueMembership, Venue.name)
        .join(Venue, Venue.id == VenueMembership.venue_id)
        .where(
            VenueMembership.user_id == user.id,
            VenueMembership.status == "ACTIVE",
        )
    )
    res = await db.execute(stmt_mems)
    rows = res.all()

    memberships: list[PortalVenueMembershipResponse] = []
    for mem, venue_name in rows:
        memberships.append(
            PortalVenueMembershipResponse(
                venue_id=mem.venue_id,
                venue_name=venue_name,
                role=mem.role,
            )
        )

    return PortalMeResponse(
        user=PortalUserResponse(
            id=user.id,
            name=user.name,
            email=user.email or "",
            role=user.role,
        ),
        platform_role=principal.platform_role,
        mfa_verified=principal.mfa_verified,
        memberships=memberships,
    )


@portal_router.post("/auth/logout")
async def portal_logout(
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
    padel_club_session: Annotated[str | None, Cookie()] = None,
    padel_admin_session: Annotated[str | None, Cookie()] = None,
) -> dict[str, bool]:
    """Revoke portal session and clear host-only cookies."""
    for cookie_val in (padel_club_session, padel_admin_session):
        if cookie_val:
            token_hash = hashlib.sha256(cookie_val.encode("utf-8")).hexdigest()
            stmt = select(UserSession).where(
                UserSession.session_token_hash == token_hash
            )
            res = await db.execute(stmt)
            for sess in res.scalars().all():
                sess.revoked_at = _utc_now()
    await db.commit()

    response.delete_cookie("padel_club_session", path="/")
    response.delete_cookie("padel_admin_session", path="/")
    return {"success": True}


_invite_accept_lock = asyncio.Lock()


@portal_router.post("/invites/accept", response_model=InviteAcceptResponse)
async def portal_accept_invite(
    data: InviteAcceptRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> InviteAcceptResponse:
    """Accept a club staff invite, validate membership limit, and configure user account."""
    async with _invite_accept_lock:
        token_hash = hashlib.sha256(data.token.encode("utf-8")).hexdigest()
        stmt_inv = (
            select(VenueInvite)
            .where(
                VenueInvite.token_hash == token_hash,
                VenueInvite.expires_at > _utc_now(),
                VenueInvite.accepted_at.is_(None),
            )
            .with_for_update()
        )
        res_inv = await db.execute(stmt_inv)
        invite = res_inv.scalars().first()

        if not invite:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired invite token",
            )

        # Find or create user
        email_clean = invite.email.lower().strip()
        stmt_u = select(User).where(func.lower(User.email) == email_clean)
        res_u = await db.execute(stmt_u)
        user = res_u.scalars().first()

        if not user:
            validate_admin_password_policy(data.password)
            user = User(
                email=email_clean,
                name=data.name.strip(),
                hashed_password=hash_password(data.password),
                role="PLAYER",
                email_verified=True,
            )
            db.add(user)
            await db.flush()

        # Enforce venue membership limit
        venue_service = VenueService(db)
        can_join = await venue_service.can_user_join_venue(user.id, invite.venue_id)
        if not can_join:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User has reached the maximum number of venues allowed.",
            )

        # Check if membership already exists
        stmt_mem = select(VenueMembership).where(
            VenueMembership.user_id == user.id,
            VenueMembership.venue_id == invite.venue_id,
        )
        res_mem = await db.execute(stmt_mem)
        existing_mem = res_mem.scalars().first()

        if existing_mem:
            existing_mem.role = invite.role
            existing_mem.status = "ACTIVE"
        else:
            membership = VenueMembership(
                user_id=user.id,
                venue_id=invite.venue_id,
                role=invite.role,
                status="ACTIVE",
            )
            db.add(membership)

        invite.accepted_at = _utc_now()
        await db.commit()

        return InviteAcceptResponse(
            success=True,
            venue_id=invite.venue_id,
            email=invite.email,
        )
