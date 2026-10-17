"""Identity, OTP generation, verification, and player profile management."""

import hashlib
import random
import secrets
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.identity.models import (
    EmailVerificationToken,
    PasswordResetToken,
    PhoneOtp,
    PlayerProfile,
    RefreshToken,
    User,
)
from app.identity.password_policy import pwd_context, validate_password_policy
from app.identity.phone import normalize_ghana_phone
from app.identity.rate_limiter import auth_rate_limiter
from app.identity.schemas import (
    LevelOnboardingQuestions,
    LevelOnboardingResponse,
    RegisterResponse,
    TokenResponse,
    UserProfileResponse,
    UserProfileUpdate,
)
from app.notify.email import (
    EmailMessage,
    get_email_provider,
    render_duplicate_registration_alert_template,
    render_email_verification_template,
    render_password_changed_template,
    render_password_reset_template,
)
from app.notify.sms import get_sms_provider


def _utc_now() -> datetime:
    return datetime.now(UTC)


def _as_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def compute_level_band(level: float) -> str:
    """Return descriptive band string based on Ghana rating level."""
    if level < 2.0:
        return "1.0 – 2.0 (Beginner)"
    elif level < 3.0:
        return "2.0 – 3.0 (Improver)"
    elif level < 4.0:
        return "3.0 – 4.0 (Intermediate)"
    elif level < 5.5:
        return "4.0 – 5.5 (Advanced)"
    else:
        return "5.5 – 7.0 (Expert)"


def format_display_name(full_name: str) -> str:
    """Format full name as privacy-conscious first name + initial (e.g. Nana K.)."""
    parts = full_name.strip().split()
    if not parts:
        return "Player"
    if len(parts) == 1:
        return parts[0]
    return f"{parts[0]} {parts[-1][0]}."


_ip_otp_history: dict[str, list[datetime]] = {}


def clear_ip_rate_limits() -> None:
    _ip_otp_history.clear()


class IdentityService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def request_otp(
        self, raw_phone: str, client_ip: str | None = None
    ) -> tuple[str, str, datetime]:
        """Validate phone, generate 6-digit OTP, rate limit by phone & IP, and dispatch SMS."""
        try:
            phone_e164 = normalize_ghana_phone(raw_phone)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        now = _utc_now()
        one_hour_ago = now - timedelta(hours=1)

        # 1. IP rate limiting: max requests per IP per hour
        if client_ip:
            recent_ip_reqs = [
                t for t in _ip_otp_history.get(client_ip, []) if t >= one_hour_ago
            ]
            if len(recent_ip_reqs) >= settings.otp_rate_limit_per_ip_per_hour:
                raise HTTPException(
                    status_code=429,
                    detail="Too many OTP requests from this IP address. Please wait before trying again.",
                )
            recent_ip_reqs.append(now)
            _ip_otp_history[client_ip] = recent_ip_reqs

        # 2. Phone rate limit: max 3 requests per phone per hour (SMS budget & toll fraud protection)
        count_stmt = (
            select(func.count())
            .select_from(PhoneOtp)
            .where(
                PhoneOtp.phone_e164 == phone_e164,
                PhoneOtp.created_at >= one_hour_ago,
            )
        )
        count_res = await self.db.execute(count_stmt)
        recent_requests = count_res.scalar() or 0
        if recent_requests >= settings.otp_rate_limit_per_phone_per_hour:
            raise HTTPException(
                status_code=429,
                detail="Too many OTP requests for this phone number. Please wait before trying again.",
            )

        # Generate 6-digit numeric OTP
        code = f"{random.randint(100000, 999999)}"
        otp_hash = _hash_token(code)
        expires_at = now + timedelta(minutes=settings.otp_expire_minutes)

        otp_record = PhoneOtp(
            id=str(uuid.uuid4()),
            phone_e164=phone_e164,
            otp_hash=otp_hash,
            expires_at=expires_at,
            attempts_remaining=settings.otp_max_attempts,
            is_verified=False,
            created_at=now,
        )
        self.db.add(otp_record)
        await self.db.commit()

        # Dispatch SMS
        sms = get_sms_provider()
        message = f"Your Padel Ghana login code is: {code}. Valid for 5 minutes. Do not share."
        await sms.send_sms(phone_e164, message)

        return phone_e164, code, expires_at

    async def verify_otp(
        self, raw_phone: str, code: str, name: str | None = None
    ) -> TokenResponse:
        """Verify OTP with brute-force protection and return auth tokens."""
        try:
            phone_e164 = normalize_ghana_phone(raw_phone)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        now = _utc_now()
        # Find latest pending OTP
        stmt = (
            select(PhoneOtp)
            .where(
                PhoneOtp.phone_e164 == phone_e164,
                PhoneOtp.is_verified == False,
            )
            .order_by(PhoneOtp.created_at.desc())
        )
        res = await self.db.execute(stmt)
        otp_record = res.scalars().first()

        if not otp_record:
            raise HTTPException(
                status_code=400,
                detail="No pending OTP found. Please request a new code.",
            )

        if _as_utc(otp_record.expires_at) < now:
            raise HTTPException(
                status_code=400, detail="OTP has expired. Please request a new code."
            )

        if otp_record.attempts_remaining <= 0:
            raise HTTPException(
                status_code=429,
                detail="Too many incorrect attempts. This code is locked. Please request a new code.",
            )

        provided_hash = _hash_token(code)
        if otp_record.otp_hash != provided_hash:
            otp_record.attempts_remaining -= 1
            await self.db.commit()
            raise HTTPException(
                status_code=400,
                detail=f"Invalid OTP code. {otp_record.attempts_remaining} attempts remaining.",
            )

        # Mark OTP verified
        otp_record.is_verified = True

        # Find or create user
        user_stmt = (
            select(User)
            .where(User.phone_e164 == phone_e164)
            .options(selectinload(User.profile))
        )
        user_res = await self.db.execute(user_stmt)
        user = user_res.scalar_one_or_none()
        is_new_user = False

        if not user:
            is_new_user = True
            user_name = name.strip() if name and name.strip() else "Padel Player"
            user = User(
                id=str(uuid.uuid4()),
                phone_e164=phone_e164,
                name=user_name,
                role="PLAYER",
                is_active=True,
                is_guest=False,
                phone_verified=True,
                email_verified=False,
            )
            self.db.add(user)
            await self.db.flush()

            profile = PlayerProfile(
                id=str(uuid.uuid4()),
                user_id=user.id,
                level=2.5,
                reliability=0.5,
                is_provisional=True,
                preferred_side="EITHER",
            )
            self.db.add(profile)
        else:
            user.phone_verified = True
            if name and name.strip() and user.name == "Padel Player":
                user.name = name.strip()

        return await self._issue_tokens_for_user(user, is_new_user=is_new_user)

    async def _issue_tokens_for_user(
        self,
        user: User,
        is_new_user: bool = False,
        family_id: str | None = None,
    ) -> TokenResponse:
        now = _utc_now()
        access_token = self._create_access_token(user.id, user.role)
        raw_refresh_token = secrets.token_urlsafe(32)
        refresh_hash = _hash_token(raw_refresh_token)

        active_family = family_id or str(uuid.uuid4())
        refresh_record = RefreshToken(
            id=str(uuid.uuid4()),
            user_id=user.id,
            family_id=active_family,
            token_hash=refresh_hash,
            expires_at=now + timedelta(days=settings.refresh_token_expire_days),
            revoked=False,
        )
        self.db.add(refresh_record)
        await self.db.commit()

        return TokenResponse(
            access_token=access_token,
            refresh_token=raw_refresh_token,
            is_new_user=is_new_user,
        )

    async def register_with_email(
        self,
        email: str,
        password: str,
        name: str | None = None,
        phone: str | None = None,
        client_ip: str | None = None,
    ) -> RegisterResponse:
        """Register a new player with email, hashed Argon2 password, and send verification link."""
        await auth_rate_limiter.check_and_record(
            "register", client_ip=client_ip, account_identifier=email
        )
        validate_password_policy(password)
        clean_email = email.strip().lower()

        # Check existing email - DO NOT leak existence via 409!
        stmt = select(User).where(func.lower(User.email) == clean_email)
        existing = (await self.db.execute(stmt)).scalar_one_or_none()
        if existing:
            email_provider = get_email_provider()
            login_url = "https://app.padelghana.com/login"
            text_body, html_body = render_duplicate_registration_alert_template(
                login_url=login_url, app_name=settings.app_name
            )
            await email_provider.send_email(
                EmailMessage(
                    to=clean_email,
                    subject=f"Account Notice - {settings.app_name}",
                    body_text=text_body,
                    body_html=html_body,
                )
            )
            return RegisterResponse(
                message="If this email is not registered, an activation link has been sent. Please check your inbox.",
                status="pending_verification",
            )

        hashed_password = pwd_context.hash(password)
        display_name = name.strip() if name and name.strip() else "Padel Player"

        user = User(
            id=str(uuid.uuid4()),
            email=clean_email,
            hashed_password=hashed_password,
            phone_e164=None,
            name=display_name,
            role="PLAYER",
            is_active=True,
            is_guest=False,
            email_verified=False,
            phone_verified=False,
        )
        self.db.add(user)
        try:
            await self.db.flush()
        except IntegrityError:
            # Handle concurrent registration race gracefully
            await self.db.rollback()
            return RegisterResponse(
                message="If this email is not registered, an activation link has been sent. Please check your inbox.",
                status="pending_verification",
            )

        profile = PlayerProfile(
            id=str(uuid.uuid4()),
            user_id=user.id,
            level=2.5,
            reliability=0.5,
            is_provisional=True,
            preferred_side="EITHER",
            competitiveness="BOTH",
        )
        self.db.add(profile)

        # Issue single-use email verification token
        raw_verify_token = secrets.token_urlsafe(32)
        verify_record = EmailVerificationToken(
            id=str(uuid.uuid4()),
            user_id=user.id,
            token_hash=_hash_token(raw_verify_token),
            expires_at=_utc_now()
            + timedelta(hours=settings.email_verification_expire_hours),
            used=False,
            created_at=_utc_now(),
        )
        self.db.add(verify_record)
        await self.db.commit()

        # Send verification email
        email_provider = get_email_provider()
        verify_url = (
            f"https://app.padelghana.com/auth/verify-email?token={raw_verify_token}"
        )
        text_body, html_body = render_email_verification_template(
            verify_url=verify_url, app_name=settings.app_name
        )
        await email_provider.send_email(
            EmailMessage(
                to=clean_email,
                subject=f"Verify your email address - {settings.app_name}",
                body_text=text_body,
                body_html=html_body,
            )
        )

        return RegisterResponse(
            message="If this email is not registered, an activation link has been sent. Please check your inbox.",
            status="pending_verification",
        )

    async def verify_email(self, raw_token: str) -> User:
        """Verify single-use email token, mark token used, and activate email_verified."""
        now = _utc_now()
        token_hash = _hash_token(raw_token)

        stmt = (
            select(EmailVerificationToken)
            .where(
                EmailVerificationToken.token_hash == token_hash,
                EmailVerificationToken.used.is_(False),
            )
            .options(selectinload(EmailVerificationToken.user))
        )
        record = (await self.db.execute(stmt)).scalars().first()

        if not record or _as_utc(record.expires_at) < now:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired verification token.",
            )

        user = record.user
        if not user or not user.is_active:
            raise HTTPException(
                status_code=400,
                detail="User account is inactive or not found.",
            )

        # Collision detection: only VERIFIED emails identify an account.
        # An unverified email must never block or take over a verified one.
        if user.email:
            clean_email = user.email.lower()
            other_stmt = select(User).where(
                func.lower(User.email) == clean_email,
                User.id != user.id,
            )
            other_users = (await self.db.execute(other_stmt)).scalars().all()
            for other in other_users:
                if other.email_verified:
                    raise HTTPException(
                        status_code=409,
                        detail="Collision detected: This email is already verified on another account. Would you like to request an account merge?",
                    )
                else:
                    # Unverified email on other account cannot block or take over
                    other.email = None
                    other.email_verified = False

        record.used = True
        user.email_verified = True
        await self.db.commit()
        return user

    async def resend_email_verification(
        self, email: str, client_ip: str | None = None
    ) -> None:
        """Resend email verification link with rate limit and cooldown."""
        await auth_rate_limiter.check_and_record(
            "resend_verification", client_ip=client_ip, account_identifier=email
        )
        clean_email = email.strip().lower()
        stmt = (
            select(User)
            .where(func.lower(User.email) == clean_email)
            .options(selectinload(User.verification_tokens))
        )
        user = (await self.db.execute(stmt)).scalar_one_or_none()
        if not user or not user.is_active or user.email_verified:
            return  # Prevent leaking registration state

        now = _utc_now()
        # Cooldown check
        recent_cutoff = now - timedelta(
            seconds=settings.email_verification_cooldown_seconds
        )
        for tok in user.verification_tokens:
            if _as_utc(tok.created_at) >= recent_cutoff:
                raise HTTPException(
                    status_code=429,
                    detail=f"Please wait {settings.email_verification_cooldown_seconds} seconds before requesting another verification email.",
                    headers={
                        "Retry-After": str(settings.email_verification_cooldown_seconds)
                    },
                )

        raw_verify_token = secrets.token_urlsafe(32)
        verify_record = EmailVerificationToken(
            id=str(uuid.uuid4()),
            user_id=user.id,
            token_hash=_hash_token(raw_verify_token),
            expires_at=now + timedelta(hours=settings.email_verification_expire_hours),
            used=False,
            created_at=now,
        )
        self.db.add(verify_record)
        await self.db.commit()

        email_provider = get_email_provider()
        verify_url = (
            f"https://app.padelghana.com/auth/verify-email?token={raw_verify_token}"
        )
        text_body, html_body = render_email_verification_template(
            verify_url=verify_url, app_name=settings.app_name
        )
        await email_provider.send_email(
            EmailMessage(
                to=clean_email,
                subject=f"Verify your email address - {settings.app_name}",
                body_text=text_body,
                body_html=html_body,
            )
        )

    async def authenticate_with_email(
        self, email: str, password: str, client_ip: str | None = None
    ) -> TokenResponse:
        """Authenticate user with email and password via Argon2 with progressive delay."""
        await auth_rate_limiter.check_and_record(
            "login", client_ip=client_ip, account_identifier=email
        )
        clean_email = email.strip().lower()

        stmt = (
            select(User)
            .where(func.lower(User.email) == clean_email)
            .options(selectinload(User.profile))
        )
        user = (await self.db.execute(stmt)).scalar_one_or_none()

        dummy_hash = "$argon2id$v=19$m=65536,t=3,p=1$c29tZXNhbHQ$dGVzdGhhc2hkdW1teQ"
        if not user or not user.is_active or not user.hashed_password:
            pwd_context.verify(password, dummy_hash)
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password.",
            )

        if not pwd_context.verify(password, user.hashed_password):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password.",
            )

        return await self._issue_tokens_for_user(user, is_new_user=False)

    async def refresh_tokens(self, raw_refresh_token: str) -> TokenResponse:
        """Rotate refresh token with reuse detection across token families."""
        token_hash = _hash_token(raw_refresh_token)
        now = _utc_now()

        stmt = (
            select(RefreshToken)
            .where(RefreshToken.token_hash == token_hash)
            .options(selectinload(RefreshToken.user))
        )
        record = (await self.db.execute(stmt)).scalar_one_or_none()

        if not record:
            raise HTTPException(
                status_code=401, detail="Invalid or expired refresh token"
            )

        # REUSE DETECTION: if token is already revoked, revoke its entire family!
        if record.revoked:
            fam_stmt = select(RefreshToken).where(
                RefreshToken.family_id == record.family_id,
                RefreshToken.revoked.is_(False),
            )
            family_tokens = (await self.db.execute(fam_stmt)).scalars().all()
            for tok in family_tokens:
                tok.revoked = True
            await self.db.commit()
            raise HTTPException(
                status_code=401,
                detail="Refresh token reuse detected. All sessions in this family revoked.",
            )

        if _as_utc(record.expires_at) < now:
            raise HTTPException(
                status_code=401, detail="Invalid or expired refresh token"
            )

        # Rotate token within the same family
        record.revoked = True

        access_token = self._create_access_token(record.user.id, record.user.role)
        new_raw_refresh = secrets.token_urlsafe(32)
        new_record = RefreshToken(
            id=str(uuid.uuid4()),
            user_id=record.user.id,
            family_id=record.family_id,
            token_hash=_hash_token(new_raw_refresh),
            expires_at=now + timedelta(days=settings.refresh_token_expire_days),
            revoked=False,
        )
        self.db.add(new_record)
        await self.db.commit()

        return TokenResponse(
            access_token=access_token,
            refresh_token=new_raw_refresh,
            is_new_user=False,
        )

    async def request_password_reset(
        self, email: str, client_ip: str | None = None
    ) -> None:
        """Issue single-use password reset token; identical timing/response for unknown emails."""
        await auth_rate_limiter.check_and_record(
            "password_reset", client_ip=client_ip, account_identifier=email
        )
        clean_email = email.strip().lower()
        stmt = select(User).where(func.lower(User.email) == clean_email)
        user = (await self.db.execute(stmt)).scalar_one_or_none()

        dummy_hash = "$argon2id$v=19$m=65536,t=3,p=1$c29tZXNhbHQ$dGVzdGhhc2hkdW1teQ"
        if not user or not user.is_active:
            pwd_context.verify("dummy_password", dummy_hash)
            return

        raw_token = secrets.token_urlsafe(32)
        token_hash = _hash_token(raw_token)
        now = _utc_now()
        expires_at = now + timedelta(minutes=settings.password_reset_expire_minutes)

        reset_record = PasswordResetToken(
            id=str(uuid.uuid4()),
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
            used=False,
            created_at=now,
        )
        self.db.add(reset_record)
        await self.db.commit()

        email_provider = get_email_provider()
        reset_url = f"https://app.padelghana.com/auth/password-reset?token={raw_token}"
        text_body, html_body = render_password_reset_template(
            reset_url=reset_url, app_name=settings.app_name
        )
        await email_provider.send_email(
            EmailMessage(
                to=clean_email,
                subject=f"Reset your password - {settings.app_name}",
                body_text=text_body,
                body_html=html_body,
            )
        )

    async def confirm_password_reset(self, raw_token: str, new_password: str) -> None:
        """Verify token hash and expiry, update password, revoke all sessions, and send alert email."""
        validate_password_policy(new_password)
        now = _utc_now()
        token_hash = _hash_token(raw_token)

        stmt = (
            select(PasswordResetToken)
            .where(
                PasswordResetToken.token_hash == token_hash,
                PasswordResetToken.used.is_(False),
            )
            .options(selectinload(PasswordResetToken.user))
        )
        reset_record = (await self.db.execute(stmt)).scalars().first()

        if not reset_record or _as_utc(reset_record.expires_at) < now:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired password reset token.",
            )

        user = reset_record.user
        if not user or not user.is_active:
            raise HTTPException(
                status_code=400,
                detail="User account is inactive or not found.",
            )

        reset_record.used = True
        user.hashed_password = pwd_context.hash(new_password)

        # REVOKE ALL REFRESH TOKENS / SESSIONS FOR THIS USER
        refresh_stmt = select(RefreshToken).where(
            RefreshToken.user_id == user.id, RefreshToken.revoked.is_(False)
        )
        active_tokens = (await self.db.execute(refresh_stmt)).scalars().all()
        for tok in active_tokens:
            tok.revoked = True

        await self.db.commit()

        # Send security notification email
        if user.email:
            email_provider = get_email_provider()
            text_body, html_body = render_password_changed_template(
                app_name=settings.app_name
            )
            await email_provider.send_email(
                EmailMessage(
                    to=user.email,
                    subject=f"Security Alert: Password Changed - {settings.app_name}",
                    body_text=text_body,
                    body_html=html_body,
                )
            )

    async def request_add_phone(
        self, user_id: str, phone: str
    ) -> tuple[str, str, datetime]:
        """Request adding a phone number to an account; verify collision first."""
        normalized_phone = normalize_ghana_phone(phone)
        stmt = select(User).where(
            User.phone_e164 == normalized_phone,
            User.phone_verified.is_(True),
            User.id != user_id,
        )
        existing = (await self.db.execute(stmt)).scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=409,
                detail="This phone number is already verified on another account. Please sign in with that account or request an account merge.",
            )
        return await self.request_otp(raw_phone=phone)

    async def verify_add_phone(self, user_id: str, phone: str, otp_code: str) -> User:
        """Verify OTP and link phone to user account."""
        normalized_phone = normalize_ghana_phone(phone)
        stmt = select(User).where(
            User.phone_e164 == normalized_phone,
            User.phone_verified.is_(True),
            User.id != user_id,
        )
        existing = (await self.db.execute(stmt)).scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=409,
                detail="This phone number is already verified on another account.",
            )

        otp_hash = _hash_token(otp_code)
        now = _utc_now()
        otp_stmt = (
            select(PhoneOtp)
            .where(
                PhoneOtp.phone_e164 == normalized_phone,
                PhoneOtp.is_verified.is_(False),
                PhoneOtp.expires_at >= now,
            )
            .order_by(PhoneOtp.created_at.desc())
        )
        otp_record = (await self.db.execute(otp_stmt)).scalars().first()
        if not otp_record or otp_record.otp_hash != otp_hash:
            raise HTTPException(status_code=400, detail="Invalid or expired OTP.")

        otp_record.is_verified = True
        user = await self.db.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")

        # Clean up unverified instances of this phone on any other account
        other_stmt = select(User).where(
            User.phone_e164 == normalized_phone,
            User.id != user_id,
        )
        other_users = (await self.db.execute(other_stmt)).scalars().all()
        for other in other_users:
            if other.phone_verified:
                raise HTTPException(
                    status_code=409,
                    detail="Collision detected: This phone number is already verified on another account. Would you like to request an account merge?",
                )
            else:
                other.phone_e164 = None
                other.phone_verified = False

        user.phone_e164 = normalized_phone
        user.phone_verified = True
        await self.db.commit()
        return user

    async def request_add_email(self, user_id: str, email: str) -> None:
        """Request adding an email to an account; verify collision first."""
        clean_email = email.strip().lower()
        stmt = select(User).where(
            func.lower(User.email) == clean_email,
            User.email_verified.is_(True),
            User.id != user_id,
        )
        existing = (await self.db.execute(stmt)).scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=409,
                detail="This email address is already verified on another account. Please sign in with that account or request an account merge.",
            )

        user = await self.db.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")

        user.email = clean_email
        user.email_verified = False

        raw_verify_token = secrets.token_urlsafe(32)
        verify_record = EmailVerificationToken(
            id=str(uuid.uuid4()),
            user_id=user.id,
            token_hash=_hash_token(raw_verify_token),
            expires_at=_utc_now()
            + timedelta(hours=settings.email_verification_expire_hours),
            used=False,
            created_at=_utc_now(),
        )
        self.db.add(verify_record)
        await self.db.commit()

        email_provider = get_email_provider()
        verify_url = (
            f"https://app.padelghana.com/auth/verify-email?token={raw_verify_token}"
        )
        text_body, html_body = render_email_verification_template(
            verify_url=verify_url, app_name=settings.app_name
        )
        await email_provider.send_email(
            EmailMessage(
                to=clean_email,
                subject=f"Verify your email address - {settings.app_name}",
                body_text=text_body,
                body_html=html_body,
            )
        )

    def create_access_token(
        self, user_id: str, phone: str = "", role: str = "PLAYER"
    ) -> str:
        return self._create_access_token(user_id, role)

    def _create_access_token(self, user_id: str, role: str) -> str:
        now = _utc_now()
        payload = {
            "sub": user_id,
            "role": role,
            "type": "access",
            "iat": now,
            "exp": now + timedelta(minutes=settings.access_token_expire_minutes),
            "jti": secrets.token_hex(8),
        }
        return jwt.encode(
            payload, settings.secret_key, algorithm=settings.jwt_algorithm
        )

    async def create_user(
        self,
        phone_e164: str,
        name: str,
        role: str = "PLAYER",
        phone_verified: bool = True,
        email_verified: bool = False,
    ) -> User:
        """Create a user and default profile directly (for testing and administrative setup)."""
        normalized_phone = normalize_ghana_phone(phone_e164)
        user = User(
            id=str(uuid.uuid4()),
            phone_e164=normalized_phone,
            name=name.strip(),
            role=role,
            is_active=True,
            is_guest=False,
            phone_verified=phone_verified,
            email_verified=email_verified,
        )
        self.db.add(user)
        await self.db.flush()

        profile = PlayerProfile(
            id=str(uuid.uuid4()),
            user_id=user.id,
            level=2.5,
            reliability=0.5,
            is_provisional=True,
            preferred_side="EITHER",
            competitiveness="BOTH",
        )
        self.db.add(profile)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def revoke_refresh_token(self, raw_refresh_token: str) -> None:
        """Revoke a refresh token on logout."""
        token_hash = _hash_token(raw_refresh_token)
        stmt = select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked == False,
        )
        res = await self.db.execute(stmt)
        record = res.scalar_one_or_none()
        if record:
            record.revoked = True
            await self.db.commit()

    async def get_user_profile(self, user_id: str) -> UserProfileResponse:
        stmt = (
            select(User).where(User.id == user_id).options(selectinload(User.profile))
        )
        res = await self.db.execute(stmt)
        user = res.scalar_one_or_none()
        if not user or not user.profile:
            raise HTTPException(status_code=404, detail="User not found")

        level_band = compute_level_band(user.profile.level)
        return UserProfileResponse(
            id=user.id,
            phone_e164=user.phone_e164,
            name=user.name,
            email=user.email,
            role=user.role,
            is_guest=user.is_guest,
            email_verified=user.email_verified,
            phone_verified=user.phone_verified,
            level=user.profile.level,
            level_band=level_band,
            reliability=user.profile.reliability,
            is_provisional=user.profile.is_provisional,
            preferred_side=user.profile.preferred_side,
            home_venue_id=user.profile.home_venue_id,
            competitiveness=user.profile.competitiveness,
        )

    async def update_user_profile(
        self, user_id: str, data: UserProfileUpdate
    ) -> UserProfileResponse:
        stmt = (
            select(User).where(User.id == user_id).options(selectinload(User.profile))
        )
        res = await self.db.execute(stmt)
        user = res.scalar_one_or_none()
        if not user or not user.profile:
            raise HTTPException(status_code=404, detail="User not found")

        if data.name is not None:
            user.name = data.name.strip()
        if data.email is not None:
            user.email = data.email.strip().lower() if data.email else None
        if data.preferred_side is not None:
            user.profile.preferred_side = data.preferred_side
        if data.home_venue_id is not None:
            user.profile.home_venue_id = data.home_venue_id
        if data.competitiveness is not None:
            user.profile.competitiveness = data.competitiveness
        if data.usual_play_times is not None:
            user.profile.usual_play_times = data.usual_play_times
        if data.external_level_note is not None:
            user.profile.external_level_note = data.external_level_note

        await self.db.commit()
        return await self.get_user_profile(user_id)

    def calculate_onboarding_level(
        self, answers: LevelOnboardingQuestions
    ) -> LevelOnboardingResponse:
        """Calculate starting provisional level band based on 4 plain questions."""
        score = 1.5

        # Question 1: Years playing
        if answers.years_playing == "1_to_3":
            score += 0.5
        elif answers.years_playing == "more_than_3":
            score += 1.0

        # Question 2: Match experience
        if answers.match_experience == "regular":
            score += 0.5
        elif answers.match_experience == "tournament":
            score += 1.0

        # Question 3: Bandeja / Vibora
        if answers.uses_bandeja_vibora:
            score += 0.5

        # Question 4: Wall confidence
        if answers.wall_confidence == "comfortable":
            score += 0.3
        elif answers.wall_confidence == "advanced":
            score += 0.7

        final_level = round(min(7.0, max(1.0, score)), 2)
        band = compute_level_band(final_level)

        return LevelOnboardingResponse(
            level=final_level,
            level_band=band,
            is_provisional=True,
            explanation=f"Based on your responses, we've set your starting level to {band}. This is provisional and will calibrate after your first recorded matches.",
        )

    async def create_guest_player(self, name: str, phone: str) -> tuple[str, str, str]:
        """Organiser adds a guest player; generates claim token for WhatsApp invite."""
        phone_e164 = normalize_ghana_phone(phone)
        claim_token = secrets.token_urlsafe(16)

        user = User(
            id=str(uuid.uuid4()),
            phone_e164=phone_e164,
            name=name.strip(),
            role="PLAYER",
            is_active=True,
            is_guest=True,
            claim_token=claim_token,
        )
        self.db.add(user)
        await self.db.flush()

        profile = PlayerProfile(
            id=str(uuid.uuid4()),
            user_id=user.id,
            level=2.5,
            reliability=0.5,
            is_provisional=True,
        )
        self.db.add(profile)
        await self.db.commit()

        claim_link = f"https://padelghana.com/claim/{claim_token}"
        return user.id, phone_e164, claim_link

    async def claim_guest_profile(
        self, user_id: str, claim_token: str
    ) -> dict[str, str]:
        """Claim a guest profile created by an organizer.

        Detects collisions and offers merge; NEVER auto-merges conflicting accounts.
        """
        user = await self.db.get(User, user_id)
        if not user or not user.is_active:
            raise HTTPException(status_code=404, detail="User account not found.")

        stmt = (
            select(User)
            .where(User.claim_token == claim_token, User.is_guest.is_(True))
            .options(selectinload(User.profile))
        )
        guest_user = (await self.db.execute(stmt)).scalar_one_or_none()
        if not guest_user:
            raise HTTPException(
                status_code=404, detail="Guest profile not found or already claimed."
            )

        # Collision detection:
        # 1. Does the guest have a phone number?
        if guest_user.phone_e164:
            # Check if this phone number is already verified on another distinct user
            phone_stmt = select(User).where(
                User.phone_e164 == guest_user.phone_e164,
                User.phone_verified.is_(True),
                User.id != user.id,
            )
            existing_phone_user = (
                await self.db.execute(phone_stmt)
            ).scalar_one_or_none()
            if existing_phone_user:
                raise HTTPException(
                    status_code=409,
                    detail="Collision detected: The phone number on this guest profile is already verified by another account. Would you like to request an account merge?",
                )

            # Check if the claiming user already has a DIFFERENT verified phone number
            if (
                user.phone_verified
                and user.phone_e164
                and user.phone_e164 != guest_user.phone_e164
            ):
                raise HTTPException(
                    status_code=409,
                    detail="Collision detected: You already have a verified phone number that differs from this guest profile. Would you like to request an account merge?",
                )

        # Transfer event registrations from guest user to claiming user
        from app.billing.models import Credit
        from app.events.models import Registration

        reg_stmt = select(Registration).where(Registration.user_id == guest_user.id)
        guest_registrations = (await self.db.execute(reg_stmt)).scalars().all()
        for reg in guest_registrations:
            reg.user_id = user.id

        credit_stmt = select(Credit).where(Credit.user_id == guest_user.id)
        guest_credits = (await self.db.execute(credit_stmt)).scalars().all()
        for cr in guest_credits:
            cr.user_id = user.id

        # If claiming user does not have a phone, link guest's phone as unverified (needs OTP)
        if not user.phone_e164 and guest_user.phone_e164:
            guest_phone = guest_user.phone_e164
            guest_user.phone_e164 = None
            await self.db.flush()
            user.phone_e164 = guest_phone
            user.phone_verified = False

        # Mark guest user claimed and deactivate
        guest_user.claim_token = None
        guest_user.is_guest = False
        guest_user.is_active = False

        await self.db.commit()
        return {
            "message": "Guest profile successfully claimed and linked to your account."
        }

    async def delete_user_account(self, user_id: str) -> None:
        """GDPR/Act 843 compliant account deletion: anonymise name, wipe PII, cancel pending registrations, keep matches intact."""
        from app.events.models import Registration

        stmt = (
            select(User)
            .where(User.id == user_id)
            .options(selectinload(User.refresh_tokens))
        )
        res = await self.db.execute(stmt)
        user = res.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Anonymise personal fields
        user.name = "Former player"
        user.email = None
        # Replace phone with deleted placeholder so unique constraint remains satisfied
        user.phone_e164 = f"+233000{uuid.uuid4().hex[:8]}"
        user.is_active = False

        # Revoke all tokens
        for t in user.refresh_tokens:
            t.revoked = True

        # Cancel any pending / held registrations
        reg_stmt = select(Registration).where(Registration.user_id == user_id)
        reg_res = await self.db.execute(reg_stmt)
        registrations = reg_res.scalars().all()
        for reg in registrations:
            if reg.status in ["HELD", "REGISTERED"]:
                reg.status = "CANCELLED"

        await self.db.commit()

    async def export_user_data(self, user_id: str) -> dict[str, Any]:
        """GDPR/Act 843 data portability export: returns all user data, profile, and registrations."""
        from app.events.models import Registration

        stmt = (
            select(User).where(User.id == user_id).options(selectinload(User.profile))
        )
        res = await self.db.execute(stmt)
        user = res.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        reg_stmt = select(Registration).where(Registration.user_id == user_id)
        reg_res = await self.db.execute(reg_stmt)
        registrations = reg_res.scalars().all()

        regs_data = []
        for reg in registrations:
            regs_data.append(
                {
                    "id": reg.id,
                    "event_id": reg.event_id,
                    "status": reg.status,
                    "created_at": reg.created_at.isoformat()
                    if reg.created_at
                    else None,
                }
            )

        profile_data: dict[str, Any] = {}
        if user.profile:
            profile_data = {
                "level": user.profile.level,
                "level_band": compute_level_band(user.profile.level),
                "reliability": user.profile.reliability,
                "preferred_side": user.profile.preferred_side,
                "home_venue_id": user.profile.home_venue_id,
            }

        return {
            "user": {
                "id": user.id,
                "name": user.name,
                "phone_e164": user.phone_e164,
                "email": user.email,
                "role": user.role,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat() if user.created_at else None,
            },
            "profile": profile_data,
            "registrations": regs_data,
        }
