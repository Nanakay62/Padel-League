"""FastAPI router for phone OTP auth, profile onboarding, and partner search."""

from typing import Annotated

import jwt
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.db import get_db
from app.identity.models import PlayerProfile, User
from app.identity.schemas import (
    GuestCreateRequest,
    GuestCreateResponse,
    LevelOnboardingQuestions,
    LevelOnboardingResponse,
    OtpRequest,
    OtpResponse,
    OtpVerifyRequest,
    PartnerItemResponse,
    RefreshTokenRequest,
    TokenResponse,
    UserProfileResponse,
    UserProfileUpdate,
)
from app.identity.service import (
    IdentityService,
    compute_level_band,
    format_display_name,
)

router = APIRouter(tags=["Authentication & Players"])

DatabaseSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user_id(
    authorization: Annotated[str | None, Header()] = None,
) -> str:
    """Dependency verifying Bearer access token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.jwt_algorithm]
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject"
            )
        return str(user_id)
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation error: {e}",
        ) from e


@router.post("/auth/otp/request", response_model=OtpResponse)
async def request_phone_otp(
    payload: OtpRequest,
    db: DatabaseSession,
) -> OtpResponse:
    service = IdentityService(db)
    phone_e164, _ = await service.request_otp(payload.phone)
    return OtpResponse(
        message="Verification code sent via SMS",
        phone_e164=phone_e164,
        expires_in_seconds=settings.otp_expire_minutes * 60,
    )


@router.post("/auth/otp/verify", response_model=TokenResponse)
async def verify_phone_otp(
    payload: OtpVerifyRequest,
    db: DatabaseSession,
) -> TokenResponse:
    service = IdentityService(db)
    return await service.verify_otp(payload.phone, payload.otp, payload.name)


@router.post("/auth/refresh", response_model=TokenResponse)
async def refresh_tokens(
    payload: RefreshTokenRequest,
    db: DatabaseSession,
) -> TokenResponse:
    service = IdentityService(db)
    return await service.refresh_tokens(payload.refresh_token)


@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(
    user_id: Annotated[str, Depends(get_current_user_id)],
    db: DatabaseSession,
) -> UserProfileResponse:
    service = IdentityService(db)
    return await service.get_user_profile(user_id)


@router.patch("/me", response_model=UserProfileResponse)
async def update_my_profile(
    payload: UserProfileUpdate,
    user_id: Annotated[str, Depends(get_current_user_id)],
    db: DatabaseSession,
) -> UserProfileResponse:
    service = IdentityService(db)
    return await service.update_user_profile(user_id, payload)


@router.post("/me/onboarding", response_model=LevelOnboardingResponse)
async def onboard_player_level(
    payload: LevelOnboardingQuestions,
    user_id: Annotated[str, Depends(get_current_user_id)],
    db: DatabaseSession,
) -> LevelOnboardingResponse:
    service = IdentityService(db)
    onboarding_res = service.calculate_onboarding_level(payload)
    # Save computed level onto profile
    await service.update_user_profile(
        user_id,
        UserProfileUpdate(
            external_level_note=f"Onboarded level: {onboarding_res.level}"
        ),
    )
    return onboarding_res


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_account(
    user_id: Annotated[str, Depends(get_current_user_id)],
    db: DatabaseSession,
) -> None:
    service = IdentityService(db)
    await service.delete_user_account(user_id)


@router.post("/players/guest", response_model=GuestCreateResponse)
async def create_guest_player(
    payload: GuestCreateRequest,
    db: DatabaseSession,
) -> GuestCreateResponse:
    service = IdentityService(db)
    guest_id, phone_e164, claim_link = await service.create_guest_player(
        payload.name, payload.phone
    )
    return GuestCreateResponse(
        id=guest_id,
        name=payload.name,
        phone_e164=phone_e164,
        claim_link=claim_link,
    )


@router.get("/partners", response_model=list[PartnerItemResponse])
async def find_partners(
    db: DatabaseSession,
    min_level: float = Query(default=1.0, ge=1.0, le=7.0),
    max_level: float = Query(default=7.0, ge=1.0, le=7.0),
    preferred_side: str | None = Query(default=None),
    venue_id: str | None = Query(default=None),
) -> list[PartnerItemResponse]:
    """Find players within rating level band, showing privacy-conscious display name."""
    stmt = (
        select(User)
        .join(PlayerProfile)
        .where(
            User.is_active == True,
            PlayerProfile.level >= min_level,
            PlayerProfile.level <= max_level,
        )
        .options(selectinload(User.profile))
    )
    if preferred_side and preferred_side != "EITHER":
        stmt = stmt.where(PlayerProfile.preferred_side.in_([preferred_side, "EITHER"]))
    if venue_id:
        stmt = stmt.where(PlayerProfile.home_venue_id == venue_id)

    res = await db.execute(stmt)
    users = res.scalars().all()

    partners: list[PartnerItemResponse] = []
    for u in users:
        if u.profile:
            partners.append(
                PartnerItemResponse(
                    id=u.id,
                    display_name=format_display_name(u.name),
                    level=u.profile.level,
                    level_band=compute_level_band(u.profile.level),
                    preferred_side=u.profile.preferred_side,
                    home_venue_id=u.profile.home_venue_id,
                )
            )

    return partners
