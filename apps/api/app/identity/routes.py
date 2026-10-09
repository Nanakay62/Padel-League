"""FastAPI router for phone OTP auth, profile onboarding, and partner search."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.db import get_db
from app.identity.deps import get_current_user_id
from app.identity.models import PlayerProfile, User
from app.identity.schemas import (
    GuestCreateRequest,
    GuestCreateResponse,
    LevelOnboardingQuestions,
    LevelOnboardingResponse,
    LogoutRequest,
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
from app.notify.sms import get_sms_provider

router = APIRouter(tags=["Authentication & Players"])

DatabaseSession = Annotated[AsyncSession, Depends(get_db)]


def _set_refresh_cookie(
    response: Response, refresh_token: str, request: Request
) -> None:
    secure = settings.environment != "development" or request.url.scheme == "https"
    response.set_cookie(
        key="padel_refresh_token",
        value=refresh_token,
        max_age=settings.refresh_token_expire_days * 24 * 3600,
        httponly=True,
        secure=secure,
        samesite="lax",
        path="/",
    )


def _clear_refresh_cookie(response: Response, request: Request) -> None:
    secure = settings.environment != "development" or request.url.scheme == "https"
    response.delete_cookie(
        key="padel_refresh_token",
        httponly=True,
        secure=secure,
        samesite="lax",
        path="/",
    )


@router.post("/auth/otp/request", response_model=OtpResponse)
async def request_phone_otp(
    payload: OtpRequest,
    request: Request,
    db: DatabaseSession,
) -> OtpResponse:
    service = IdentityService(db)
    client_ip = request.client.host if request.client else None
    phone_e164, _, expires_at = await service.request_otp(
        payload.phone, client_ip=client_ip
    )
    return OtpResponse(
        message="Verification code sent via SMS",
        phone_e164=phone_e164,
        expires_in_seconds=settings.otp_expire_minutes * 60,
        expires_at=expires_at,
    )


@router.post("/auth/otp/verify", response_model=TokenResponse)
async def verify_phone_otp(
    payload: OtpVerifyRequest,
    response: Response,
    request: Request,
    db: DatabaseSession,
) -> TokenResponse:
    service = IdentityService(db)
    token_resp = await service.verify_otp(payload.phone, payload.otp, payload.name)
    _set_refresh_cookie(response, token_resp.refresh_token, request)
    return token_resp


@router.post("/auth/refresh", response_model=TokenResponse)
async def refresh_tokens(
    response: Response,
    request: Request,
    db: DatabaseSession,
    payload: RefreshTokenRequest | None = None,
) -> TokenResponse:
    refresh_token = (
        payload.refresh_token if (payload and payload.refresh_token) else None
    ) or request.cookies.get("padel_refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token required in body or cookie",
        )
    service = IdentityService(db)
    token_resp = await service.refresh_tokens(refresh_token)
    _set_refresh_cookie(response, token_resp.refresh_token, request)
    return token_resp


@router.post("/auth/logout")
async def logout(
    response: Response,
    request: Request,
    db: DatabaseSession,
    payload: LogoutRequest | None = None,
) -> dict[str, str]:
    refresh_token = (
        payload.refresh_token if (payload and payload.refresh_token) else None
    ) or request.cookies.get("padel_refresh_token")
    if refresh_token:
        service = IdentityService(db)
        await service.revoke_refresh_token(refresh_token)
    _clear_refresh_cookie(response, request)
    return {"message": "Logged out successfully"}


@router.get("/auth/test/last-otp")
async def get_test_last_otp() -> dict[str, str | None]:
    """Test-only endpoint: returns last generated OTP code strictly when ENVIRONMENT == 'test'."""
    if settings.environment != "test":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test endpoint only available in test environment",
        )
    sms = get_sms_provider()
    if hasattr(sms, "get_last_code"):
        return {"code": sms.get_last_code()}
    return {"code": None}


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


@router.get("/me/export")
async def export_my_data(
    user_id: Annotated[str, Depends(get_current_user_id)],
    db: DatabaseSession,
) -> dict[str, Any]:
    service = IdentityService(db)
    return await service.export_user_data(user_id)


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
