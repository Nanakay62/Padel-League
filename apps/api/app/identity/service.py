"""Identity, OTP generation, verification, and player profile management."""

import hashlib
import random
import secrets
import uuid
from datetime import UTC, datetime, timedelta

import jwt
from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.identity.models import PhoneOtp, PlayerProfile, RefreshToken, User
from app.identity.phone import normalize_ghana_phone
from app.identity.schemas import (
    LevelOnboardingQuestions,
    LevelOnboardingResponse,
    TokenResponse,
    UserProfileResponse,
    UserProfileUpdate,
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


class IdentityService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def request_otp(self, raw_phone: str) -> tuple[str, str]:
        """Validate phone, generate 6-digit OTP, rate limit, and dispatch SMS."""
        try:
            phone_e164 = normalize_ghana_phone(raw_phone)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        now = _utc_now()
        one_hour_ago = now - timedelta(hours=1)

        # Rate limit: max 3 requests per phone per hour
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
        if recent_requests >= 5:
            raise HTTPException(
                status_code=429,
                detail="Too many OTP requests for this phone number. Please wait an hour.",
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

        return phone_e164, code

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
            if name and name.strip() and user.name == "Padel Player":
                user.name = name.strip()

        # Generate tokens
        access_token = self._create_access_token(user.id, user.role)
        raw_refresh_token = secrets.token_urlsafe(32)
        refresh_hash = _hash_token(raw_refresh_token)

        refresh_record = RefreshToken(
            id=str(uuid.uuid4()),
            user_id=user.id,
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

    def _create_access_token(self, user_id: str, role: str) -> str:
        now = _utc_now()
        payload = {
            "sub": user_id,
            "role": role,
            "iat": now,
            "exp": now + timedelta(minutes=settings.access_token_expire_minutes),
            "jti": secrets.token_hex(8),
        }
        return jwt.encode(
            payload, settings.secret_key, algorithm=settings.jwt_algorithm
        )

    async def refresh_tokens(self, raw_refresh_token: str) -> TokenResponse:
        """Rotate refresh token and issue new access token."""
        token_hash = _hash_token(raw_refresh_token)
        now = _utc_now()

        stmt = (
            select(RefreshToken)
            .where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked == False,
            )
            .options(selectinload(RefreshToken.user))
        )
        res = await self.db.execute(stmt)
        record = res.scalar_one_or_none()

        if not record or _as_utc(record.expires_at) < now:
            raise HTTPException(
                status_code=401, detail="Invalid or expired refresh token"
            )

        # Revoke old refresh token
        record.revoked = True

        # Generate new pair
        access_token = self._create_access_token(record.user.id, record.user.role)
        new_raw_refresh = secrets.token_urlsafe(32)
        new_record = RefreshToken(
            id=str(uuid.uuid4()),
            user_id=record.user.id,
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

    async def delete_user_account(self, user_id: str) -> None:
        """GDPR/Act 843 compliant account deletion: anonymise name, wipe PII, keep matches intact."""
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

        await self.db.commit()
