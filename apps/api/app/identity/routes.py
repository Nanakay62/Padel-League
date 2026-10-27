"""FastAPI router for phone OTP auth, profile onboarding, and partner search."""

from pathlib import Path
from typing import Annotated, Any

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    Request,
    Response,
    UploadFile,
    status,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.db import get_db
from app.domain.photos import (
    ALLOWED_PHOTO_MIME_TYPES,
    MAX_PHOTO_SIZE_BYTES,
    validate_photo_magic_bytes,
)
from app.identity.deps import get_current_admin_user_id, get_current_user_id
from app.identity.models import PlayerProfile, User
from app.identity.schemas import (
    AddEmailRequest,
    AddPhoneRequest,
    ClaimGuestRequest,
    EmailLoginRequest,
    EmailRegisterRequest,
    EmailVerificationRequest,
    GuestCreateRequest,
    GuestCreateResponse,
    LevelOnboardingQuestions,
    LevelOnboardingResponse,
    LogoutRequest,
    OtpRequest,
    OtpResponse,
    OtpVerifyRequest,
    PartnerItemResponse,
    PasswordResetConfirmRequest,
    PasswordResetRequest,
    RefreshTokenRequest,
    RegisterResponse,
    ResendEmailVerificationRequest,
    TokenResponse,
    UserProfileResponse,
    UserProfileUpdate,
    VerifyPhoneRequest,
)
from app.identity.service import (
    IdentityService,
    compute_level_band,
    format_display_name,
)
from app.notify.email import get_email_provider
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


@router.post("/auth/register", response_model=RegisterResponse)
async def register_with_email(
    payload: EmailRegisterRequest,
    request: Request,
    db: DatabaseSession,
) -> RegisterResponse:
    service = IdentityService(db)
    client_ip = request.client.host if request.client else None
    return await service.register_with_email(
        email=str(payload.email),
        password=payload.password,
        name=payload.name,
        phone=payload.phone,
        client_ip=client_ip,
    )


@router.get("/auth/verify-email")
async def verify_email_link(
    token: str,
    db: DatabaseSession,
) -> Response:
    service = IdentityService(db)
    await service.verify_email(token)
    html_content = """<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Email Verified - Padel Ghana</title></head>
<body style="font-family: system-ui; text-align: center; padding: 48px; background: #0B0F0E; color: #FFFFFF;">
  <h1 style="color: #00C853;">Email Verified!</h1>
  <p>Your email address has been successfully verified.</p>
  <a href="/login" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #00C853; color: #0B0F0E; text-decoration: none; font-weight: bold; border-radius: 6px;">Sign In to Padel Ghana</a>
</body>
</html>"""
    return Response(content=html_content, media_type="text/html")


@router.post("/auth/verify-email")
async def verify_email_api(
    payload: EmailVerificationRequest,
    db: DatabaseSession,
) -> dict[str, str]:
    service = IdentityService(db)
    await service.verify_email(payload.token)
    return {"message": "Email verified successfully."}


@router.post("/auth/verify-email/resend")
async def resend_email_verification(
    payload: ResendEmailVerificationRequest,
    request: Request,
    db: DatabaseSession,
) -> dict[str, str]:
    service = IdentityService(db)
    client_ip = request.client.host if request.client else None
    await service.resend_email_verification(str(payload.email), client_ip=client_ip)
    return {
        "message": "If an unverified account matches, verification instructions have been dispatched."
    }


@router.post("/auth/login", response_model=TokenResponse)
async def login_with_email(
    payload: EmailLoginRequest,
    response: Response,
    request: Request,
    db: DatabaseSession,
) -> TokenResponse:
    service = IdentityService(db)
    client_ip = request.client.host if request.client else None
    token_resp = await service.authenticate_with_email(
        email=str(payload.email),
        password=payload.password,
        client_ip=client_ip,
    )
    _set_refresh_cookie(response, token_resp.refresh_token, request)
    return token_resp


@router.post("/auth/password-reset/request")
async def request_password_reset(
    payload: PasswordResetRequest,
    request: Request,
    db: DatabaseSession,
) -> dict[str, str]:
    service = IdentityService(db)
    client_ip = request.client.host if request.client else None
    await service.request_password_reset(str(payload.email), client_ip=client_ip)
    return {
        "message": "If that email is registered, password reset instructions have been generated."
    }


@router.post("/auth/password-reset/confirm")
async def confirm_password_reset(
    payload: PasswordResetConfirmRequest,
    db: DatabaseSession,
) -> dict[str, str]:
    service = IdentityService(db)
    await service.confirm_password_reset(
        raw_token=payload.token,
        new_password=payload.new_password,
    )
    return {"message": "Password has been successfully updated. You may now sign in."}


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


@router.get("/auth/test/last-email")
async def get_test_last_email() -> dict[str, Any]:
    """Test-only endpoint: returns last dispatched email strictly when ENVIRONMENT == 'test'."""
    if settings.environment != "test":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test endpoint only available in test environment",
        )
    provider = get_email_provider()
    if hasattr(provider, "sent_messages") and provider.sent_messages:
        last = provider.sent_messages[-1]
        return {
            "to": last.to,
            "subject": last.subject,
            "body_text": last.body_text,
            "body_html": last.body_html,
        }
    return {"to": None, "subject": None, "body_text": None, "body_html": None}


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


@router.post("/me/avatar", response_model=UserProfileResponse)
async def upload_my_avatar(
    file: Annotated[UploadFile, File(...)],
    user_id: Annotated[str, Depends(get_current_user_id)],
    db: DatabaseSession,
) -> UserProfileResponse:
    """Upload a player profile picture, validating MIME type, magic bytes, and 5 MB size limit."""
    content_type = file.content_type or ""
    if content_type.lower() not in ALLOWED_PHOTO_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid photo format. Only JPEG, PNG, and WebP are allowed.",
        )

    total_size = 0
    chunks: list[bytes] = []
    chunk_size = 64 * 1024
    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        total_size += len(chunk)
        if total_size > MAX_PHOTO_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail="Photo file size exceeds maximum limit of 5 MB.",
            )
        chunks.append(chunk)

    content = b"".join(chunks)

    try:
        ext = validate_photo_magic_bytes(content, content_type)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid photo file content. {e}",
        )

    upload_dir = Path("uploads/avatars")
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / f"{user_id}{ext}"
    file_path.write_bytes(content)

    url = f"/static/uploads/avatars/{user_id}{ext}"
    service = IdentityService(db)
    return await service.update_user_profile(user_id, UserProfileUpdate(avatar_url=url))


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


@router.post("/me/phone/request", response_model=OtpResponse)
async def request_add_phone(
    payload: AddPhoneRequest,
    user_id: Annotated[str, Depends(get_current_user_id)],
    db: DatabaseSession,
) -> OtpResponse:
    service = IdentityService(db)
    phone_e164, _, expires_at = await service.request_add_phone(
        user_id=user_id, phone=payload.phone
    )
    return OtpResponse(
        message="Verification code sent via SMS",
        phone_e164=phone_e164,
        expires_in_seconds=settings.otp_expire_minutes * 60,
        expires_at=expires_at,
    )


@router.post("/me/phone/verify", response_model=UserProfileResponse)
async def verify_add_phone(
    payload: VerifyPhoneRequest,
    user_id: Annotated[str, Depends(get_current_user_id)],
    db: DatabaseSession,
) -> UserProfileResponse:
    service = IdentityService(db)
    await service.verify_add_phone(
        user_id=user_id, phone=payload.phone, otp_code=payload.otp
    )
    return await service.get_user_profile(user_id)


@router.post("/me/email/request")
async def request_add_email(
    payload: AddEmailRequest,
    user_id: Annotated[str, Depends(get_current_user_id)],
    db: DatabaseSession,
) -> dict[str, str]:
    service = IdentityService(db)
    await service.request_add_email(user_id=user_id, email=str(payload.email))
    return {
        "message": "Verification link dispatched. Please check your inbox to confirm."
    }


@router.post("/me/claim-guest")
async def claim_guest_profile(
    payload: ClaimGuestRequest,
    user_id: Annotated[str, Depends(get_current_user_id)],
    db: DatabaseSession,
) -> dict[str, str]:
    service = IdentityService(db)
    return await service.claim_guest_profile(
        user_id=user_id, claim_token=payload.claim_token
    )


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


@router.get("/admin/verify-access")
async def verify_admin_access(
    admin_user_id: Annotated[str, Depends(get_current_admin_user_id)],
) -> dict[str, str]:
    """Admin-only endpoint for verifying administrative credentials."""
    return {"message": "Admin access granted", "admin_id": admin_user_id}
