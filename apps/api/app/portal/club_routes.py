"""FastAPI routes for Club Back-Office operations: profile, drafts, courts, pricing, staff, audit."""

import hashlib
import html
import secrets
import uuid
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Annotated, Any

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.audit.models import AuditLog
from app.audit.service import AuditService
from app.authz.deps import ClubContext, club_context
from app.authz.policy import Action, ClubRole
from app.config import settings
from app.db import get_db
from app.domain.photos import (
    ALLOWED_PHOTO_MIME_TYPES,
    MAX_PHOTO_SIZE_BYTES,
    validate_photo_magic_bytes,
)
from app.identity.models import User
from app.notify.email import EmailMessage, get_email_provider
from app.venues.models import (
    Court,
    Venue,
    VenueDraft,
    VenueInvite,
    VenueMembership,
    VenuePhoto,
)

club_router = APIRouter(prefix="/portal/club", tags=["Club Portal"])


def _utc_now() -> datetime:
    return datetime.now(UTC)


# --- Schemas ---


class ClubProfileUpdateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=1000)
    booking_phone: str = Field(default="", max_length=32)
    booking_whatsapp: str = Field(default="", max_length=255)
    ghanapost_gps: str = Field(default="", max_length=32)
    maps_url: str = Field(default="", max_length=255)
    amenities: list[str] = Field(default_factory=list)
    expected_updated_at: datetime | str | None = None


class DraftPayloadRequest(BaseModel):
    draft_payload: dict[str, Any] = Field(default_factory=dict)


class CourtCreateOrUpdateRequest(BaseModel):
    court_number: int = Field(ge=1, le=50)
    is_indoor: bool = False
    surface: str = Field(default="Turf", max_length=64)
    lighting: str = Field(default="", max_length=64)
    notes: str = Field(default="", max_length=255)
    base_rate_pesewas_per_hour: int | None = Field(default=None, ge=0)
    price_bands: list[dict[str, Any]] = Field(default_factory=list)
    duration_multipliers_bps: dict[str, int] | None = None


class ClubPricingUpdateRequest(BaseModel):
    base_rate_pesewas_per_hour: int = Field(ge=0)
    price_bands: list[dict[str, Any]] = Field(default_factory=list)
    duration_multipliers_bps: dict[str, int] = Field(
        default_factory=lambda: {"60": 10000, "90": 10000, "120": 10000}
    )
    opening_hours: list[dict[str, Any]] = Field(default_factory=list)
    expected_price_version: int | None = None


class StaffInviteRequest(BaseModel):
    email: EmailStr
    role: str = Field(default="CLUB_ADMIN", pattern="^(CLUB_ADMIN|CLUB_OWNER)$")


class PhotoUpdateRequest(BaseModel):
    caption: str | None = None
    display_order: int | None = None


# --- Endpoints ---


@club_router.get("/venue")
@club_router.get("/profile")
async def get_club_venue(
    ctx: Annotated[ClubContext, Depends(club_context(Action.VENUE_ADMIN_READ))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """Retrieve full venue details for the authorized club."""
    stmt = (
        select(Venue)
        .options(selectinload(Venue.courts))
        .where(Venue.id == ctx.venue_id)
    )
    res = await db.execute(stmt)
    venue = res.scalars().first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")

    return {
        "id": venue.id,
        "name": venue.name,
        "address": venue.address,
        "description": venue.description,
        "booking_phone": venue.booking_phone,
        "booking_whatsapp": venue.booking_whatsapp,
        "booking_url": venue.booking_url,
        "ghanapost_gps": venue.ghanapost_gps,
        "maps_url": venue.maps_url,
        "amenities": venue.amenities or [],
        "opening_hours": venue.opening_hours or [],
        "base_rate_pesewas_per_hour": venue.base_rate_pesewas_per_hour,
        "price_bands": venue.price_bands or [],
        "duration_multipliers_bps": venue.duration_multipliers_bps,
        "add_ons_config": venue.add_ons_config or [],
        "price_version": venue.price_version,
        "price_hash": venue.price_hash,
        "is_active": venue.is_active,
        "updated_at": venue.updated_at.isoformat() if venue.updated_at else None,
        "courts": [
            {
                "id": c.id,
                "court_number": c.court_number,
                "is_indoor": c.is_indoor,
                "surface": c.surface,
                "lighting": c.lighting,
                "notes": c.notes,
                "base_rate_pesewas_per_hour": c.base_rate_pesewas_per_hour,
                "price_bands": c.price_bands or [],
            }
            for c in sorted(venue.courts or [], key=lambda x: x.court_number)
        ],
    }


@club_router.put("/venue/profile")
@club_router.put("/profile")
async def update_club_profile(
    data: ClubProfileUpdateRequest,
    ctx: Annotated[ClubContext, Depends(club_context(Action.VENUE_PROFILE_EDIT))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """Update club profile and record audit entry."""
    venue = await db.get(Venue, ctx.venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")

    if data.expected_updated_at is not None:
        exp_dt = data.expected_updated_at
        if isinstance(exp_dt, str):
            try:
                exp_dt = datetime.fromisoformat(exp_dt)
            except ValueError:
                pass
        if isinstance(exp_dt, datetime):
            if exp_dt.tzinfo is None:
                exp_dt = exp_dt.replace(tzinfo=UTC)
            v_updated = venue.updated_at
            if v_updated is not None:
                if v_updated.tzinfo is None:
                    v_updated = v_updated.replace(tzinfo=UTC)
                if abs((v_updated - exp_dt).total_seconds()) > 1.0:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Venue profile has been modified by another session. Please reload latest changes.",
                    )

    old_value = {
        "name": venue.name,
        "description": venue.description,
        "booking_phone": venue.booking_phone,
        "booking_whatsapp": venue.booking_whatsapp,
        "ghanapost_gps": venue.ghanapost_gps,
        "maps_url": venue.maps_url,
        "amenities": venue.amenities,
    }

    venue.name = data.name.strip()
    venue.description = data.description.strip()
    venue.booking_phone = data.booking_phone.strip()
    venue.booking_whatsapp = data.booking_whatsapp.strip()
    venue.ghanapost_gps = data.ghanapost_gps.strip()
    venue.maps_url = data.maps_url.strip()
    venue.amenities = data.amenities
    venue.updated_at = _utc_now()

    new_value = {
        "name": venue.name,
        "description": venue.description,
        "booking_phone": venue.booking_phone,
        "booking_whatsapp": venue.booking_whatsapp,
        "ghanapost_gps": venue.ghanapost_gps,
        "maps_url": venue.maps_url,
        "amenities": venue.amenities,
    }

    audit_service = AuditService(db)
    is_step_in = ctx.decision.is_step_in
    actor_kind = "SUPER_ADMIN" if is_step_in else "USER"
    await audit_service.record_audit(
        actor_id=ctx.principal.user_id,
        actor_kind=actor_kind,
        action="VENUE_PROFILE_EDIT",
        target_type="venue",
        target_id=venue.id,
        venue_id=venue.id,
        details="Updated club profile information"
        + (" (Platform Step-In)" if is_step_in else ""),
        old_value=old_value,
        new_value=new_value,
        is_revertible=True,
    )
    await db.commit()

    return {
        "id": venue.id,
        "name": venue.name,
        "description": venue.description,
        "booking_phone": venue.booking_phone,
        "booking_whatsapp": venue.booking_whatsapp,
        "ghanapost_gps": venue.ghanapost_gps,
        "maps_url": venue.maps_url,
        "amenities": venue.amenities,
        "is_step_in": is_step_in,
        "updated_at": venue.updated_at.isoformat() if venue.updated_at else None,
    }


@club_router.get("/drafts/{section}")
async def get_club_draft(
    section: str,
    ctx: Annotated[ClubContext, Depends(club_context(Action.VENUE_ADMIN_READ))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """Retrieve auto-saved draft for a section."""
    stmt = select(VenueDraft).where(
        VenueDraft.venue_id == ctx.venue_id,
        VenueDraft.section == section,
    )
    res = await db.execute(stmt)
    draft = res.scalars().first()
    return {
        "section": section,
        "draft_payload": draft.draft_payload if draft else {},
    }


@club_router.put("/drafts/{section}")
async def save_club_draft(
    section: str,
    data: DraftPayloadRequest,
    ctx: Annotated[ClubContext, Depends(club_context(Action.VENUE_PROFILE_EDIT))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """Upsert auto-saved draft for a section."""
    stmt = select(VenueDraft).where(
        VenueDraft.venue_id == ctx.venue_id,
        VenueDraft.section == section,
    )
    res = await db.execute(stmt)
    draft = res.scalars().first()

    if draft:
        draft.draft_payload = data.draft_payload
        draft.updated_by_id = ctx.principal.user_id
        draft.updated_at = _utc_now()
    else:
        draft = VenueDraft(
            venue_id=ctx.venue_id,
            section=section,
            draft_payload=data.draft_payload,
            updated_by_id=ctx.principal.user_id,
        )
        db.add(draft)

    await db.commit()
    return {
        "section": section,
        "draft_payload": draft.draft_payload,
    }


@club_router.get("/courts")
async def list_club_courts(
    ctx: Annotated[ClubContext, Depends(club_context(Action.VENUE_ADMIN_READ))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[dict[str, Any]]:
    """List all courts for authorized venue."""
    stmt = (
        select(Court).where(Court.venue_id == ctx.venue_id).order_by(Court.court_number)
    )
    res = await db.execute(stmt)
    courts = res.scalars().all()
    return [
        {
            "id": c.id,
            "court_number": c.court_number,
            "is_indoor": c.is_indoor,
            "surface": c.surface,
            "lighting": c.lighting,
            "notes": c.notes,
            "base_rate_pesewas_per_hour": c.base_rate_pesewas_per_hour,
            "price_bands": c.price_bands or [],
        }
        for c in courts
    ]


@club_router.post("/courts")
async def create_club_court(
    data: CourtCreateOrUpdateRequest,
    ctx: Annotated[ClubContext, Depends(club_context(Action.COURT_EDIT))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """Add a new court to the venue and bump price_version."""
    court = Court(
        venue_id=ctx.venue_id,
        court_number=data.court_number,
        is_indoor=data.is_indoor,
        surface=data.surface,
        lighting=data.lighting,
        notes=data.notes,
        base_rate_pesewas_per_hour=data.base_rate_pesewas_per_hour,
        price_bands=data.price_bands,
        duration_multipliers_bps=data.duration_multipliers_bps,
    )
    db.add(court)
    await db.flush()

    audit_service = AuditService(db)
    is_step_in = ctx.decision.is_step_in
    actor_kind = "SUPER_ADMIN" if is_step_in else "USER"
    await audit_service.record_audit(
        actor_id=ctx.principal.user_id,
        actor_kind=actor_kind,
        action="COURT_CREATE",
        target_type="court",
        target_id=court.id,
        venue_id=ctx.venue_id,
        details=f"Created court {court.court_number}"
        + (" (Platform Step-In)" if is_step_in else ""),
        new_value={
            "court_number": court.court_number,
            "is_indoor": court.is_indoor,
            "surface": court.surface,
            "lighting": court.lighting,
            "base_rate_pesewas_per_hour": court.base_rate_pesewas_per_hour,
        },
        is_revertible=False,
    )

    await db.commit()
    await db.refresh(court)

    return {
        "id": court.id,
        "court_number": court.court_number,
        "is_indoor": court.is_indoor,
        "surface": court.surface,
        "lighting": court.lighting,
        "notes": court.notes,
        "base_rate_pesewas_per_hour": court.base_rate_pesewas_per_hour,
    }


@club_router.put("/courts/{court_id}")
async def update_club_court(
    court_id: str,
    data: CourtCreateOrUpdateRequest,
    ctx: Annotated[ClubContext, Depends(club_context(Action.COURT_EDIT))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """Update court specs and pricing overrides."""
    court = await db.get(Court, court_id)
    if not court or court.venue_id != ctx.venue_id:
        raise HTTPException(status_code=404, detail="Court not found")

    old_value = {
        "court_number": court.court_number,
        "is_indoor": court.is_indoor,
        "surface": court.surface,
        "lighting": court.lighting,
        "notes": court.notes,
        "base_rate_pesewas_per_hour": court.base_rate_pesewas_per_hour,
        "price_bands": court.price_bands,
        "duration_multipliers_bps": court.duration_multipliers_bps,
    }

    court.court_number = data.court_number
    court.is_indoor = data.is_indoor
    court.surface = data.surface
    court.lighting = data.lighting
    court.notes = data.notes
    court.base_rate_pesewas_per_hour = data.base_rate_pesewas_per_hour
    court.price_bands = data.price_bands
    court.duration_multipliers_bps = data.duration_multipliers_bps
    court.updated_at = _utc_now()

    new_value = {
        "court_number": court.court_number,
        "is_indoor": court.is_indoor,
        "surface": court.surface,
        "lighting": court.lighting,
        "notes": court.notes,
        "base_rate_pesewas_per_hour": court.base_rate_pesewas_per_hour,
        "price_bands": court.price_bands,
        "duration_multipliers_bps": court.duration_multipliers_bps,
    }

    audit_service = AuditService(db)
    is_step_in = ctx.decision.is_step_in
    actor_kind = "SUPER_ADMIN" if is_step_in else "USER"
    await audit_service.record_audit(
        actor_id=ctx.principal.user_id,
        actor_kind=actor_kind,
        action="COURT_EDIT",
        target_type="court",
        target_id=court.id,
        venue_id=ctx.venue_id,
        details=f"Updated court {court.court_number}"
        + (" (Platform Step-In)" if is_step_in else ""),
        old_value=old_value,
        new_value=new_value,
        is_revertible=False,
    )

    await db.commit()
    await db.refresh(court)

    return {
        "id": court.id,
        "court_number": court.court_number,
        "is_indoor": court.is_indoor,
        "surface": court.surface,
        "lighting": court.lighting,
        "notes": court.notes,
        "base_rate_pesewas_per_hour": court.base_rate_pesewas_per_hour,
    }


@club_router.delete("/courts/{court_id}")
async def delete_club_court(
    court_id: str,
    ctx: Annotated[ClubContext, Depends(club_context(Action.COURT_EDIT))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, bool]:
    """Delete a court from the venue."""
    court = await db.get(Court, court_id)
    if not court or court.venue_id != ctx.venue_id:
        raise HTTPException(status_code=404, detail="Court not found")

    old_value = {
        "court_number": court.court_number,
        "is_indoor": court.is_indoor,
        "surface": court.surface,
    }

    audit_service = AuditService(db)
    is_step_in = ctx.decision.is_step_in
    actor_kind = "SUPER_ADMIN" if is_step_in else "USER"
    await audit_service.record_audit(
        actor_id=ctx.principal.user_id,
        actor_kind=actor_kind,
        action="COURT_DELETE",
        target_type="court",
        target_id=court.id,
        venue_id=ctx.venue_id,
        details=f"Deleted court {court.court_number}"
        + (" (Platform Step-In)" if is_step_in else ""),
        old_value=old_value,
        is_revertible=False,
    )

    await db.delete(court)
    await db.commit()
    return {"success": True}


@club_router.get("/pricing")
async def get_club_pricing(
    ctx: Annotated[ClubContext, Depends(club_context(Action.VENUE_ADMIN_READ))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """Retrieve dynamic pricing engine parameters and opening hours."""
    venue = await db.get(Venue, ctx.venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")

    is_step_in = ctx.decision.is_step_in
    base_rate = venue.base_rate_pesewas_per_hour or 0
    formatted_rate = f"GH₵ {base_rate / 100:.2f}"

    return {
        "venue_id": venue.id,
        "base_rate_pesewas": base_rate,
        "base_rate_pesewas_per_hour": base_rate,
        "currency": "GHS",
        "formatted_base_rate": formatted_rate,
        "price_version": venue.price_version or 1,
        "price_hash": venue.price_hash,
        "duration_multipliers": venue.duration_multipliers_bps
        or {"60": 1.0, "90": 1.5, "120": 2.0},
        "duration_multipliers_bps": venue.duration_multipliers_bps
        or {"60": 10000, "90": 10000, "120": 10000},
        "price_bands": venue.price_bands or [],
        "opening_hours": venue.opening_hours or {},
        "step_in_actor": ctx.principal.user_id if is_step_in else None,
    }


@club_router.put("/pricing")
async def update_club_pricing(
    data: ClubPricingUpdateRequest,
    ctx: Annotated[ClubContext, Depends(club_context(Action.PRICE_EDIT))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """Update dynamic pricing engine parameters and opening hours."""
    venue = await db.get(Venue, ctx.venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")

    if (
        data.expected_price_version is not None
        and (venue.price_version or 1) != data.expected_price_version
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Venue pricing has been modified by another session. Please reload latest changes.",
        )

    old_value = {
        "base_rate_pesewas_per_hour": venue.base_rate_pesewas_per_hour,
        "price_bands": venue.price_bands,
        "duration_multipliers_bps": venue.duration_multipliers_bps,
        "opening_hours": venue.opening_hours,
    }

    venue.base_rate_pesewas_per_hour = data.base_rate_pesewas_per_hour
    venue.price_bands = data.price_bands
    venue.duration_multipliers_bps = data.duration_multipliers_bps
    venue.opening_hours = data.opening_hours
    venue.updated_at = _utc_now()

    new_value = {
        "base_rate_pesewas_per_hour": venue.base_rate_pesewas_per_hour,
        "price_bands": venue.price_bands,
        "duration_multipliers_bps": venue.duration_multipliers_bps,
        "opening_hours": venue.opening_hours,
    }

    audit_service = AuditService(db)
    is_step_in = ctx.decision.is_step_in
    actor_kind = "SUPER_ADMIN" if is_step_in else "USER"
    await audit_service.record_audit(
        actor_id=ctx.principal.user_id,
        actor_kind=actor_kind,
        action="VENUE_PRICING_EDIT",
        target_type="venue",
        target_id=venue.id,
        venue_id=venue.id,
        details="Updated pricing engine rates and hours"
        + (" (Platform Step-In)" if is_step_in else ""),
        old_value=old_value,
        new_value=new_value,
        is_revertible=True,
    )

    await db.commit()
    await db.refresh(venue)

    return {
        "base_rate_pesewas_per_hour": venue.base_rate_pesewas_per_hour,
        "price_bands": venue.price_bands,
        "duration_multipliers_bps": venue.duration_multipliers_bps,
        "opening_hours": venue.opening_hours,
        "price_version": venue.price_version,
        "price_hash": venue.price_hash,
    }


@club_router.get("/staff")
async def list_club_staff(
    ctx: Annotated[ClubContext, Depends(club_context(Action.VENUE_ADMIN_READ))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """List staff members and pending invites for the venue."""
    # Active memberships
    stmt_mems = (
        select(VenueMembership, User)
        .join(User, User.id == VenueMembership.user_id)
        .where(
            VenueMembership.venue_id == ctx.venue_id,
            VenueMembership.status == "ACTIVE",
        )
    )
    res_mems = await db.execute(stmt_mems)
    mems = [
        {
            "id": mem.id,
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "role": mem.role,
            "joined_at": mem.created_at,
        }
        for mem, user in res_mems.all()
    ]

    # Pending invites
    stmt_inv = select(VenueInvite).where(
        VenueInvite.venue_id == ctx.venue_id,
        VenueInvite.accepted_at.is_(None),
        VenueInvite.expires_at > _utc_now(),
    )
    res_inv = await db.execute(stmt_inv)
    invites = [
        {
            "id": inv.id,
            "email": inv.email,
            "role": inv.role,
            "expires_at": inv.expires_at,
        }
        for inv in res_inv.scalars().all()
    ]

    return {
        "members": mems,
        "invites": invites,
    }


@club_router.post("/staff/invite")
async def invite_club_staff(
    data: StaffInviteRequest,
    ctx: Annotated[ClubContext, Depends(club_context(Action.STAFF_MANAGE))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """Invite staff member to the club (CLUB_OWNER only)."""
    venue = await db.get(Venue, ctx.venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")

    email_clean = data.email.lower().strip()

    # Create invite token
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

    invite = VenueInvite(
        venue_id=ctx.venue_id,
        email=email_clean,
        role=data.role,
        token_hash=token_hash,
        invited_by_id=ctx.principal.user_id,
        expires_at=_utc_now() + timedelta(days=2),
    )
    db.add(invite)
    await db.commit()

    # Dispatch invite email
    email_provider = get_email_provider()
    invite_link = f"https://{settings.club_host}/invite?token={raw_token}"
    msg = EmailMessage(
        to=email_clean,
        subject=f"[Padel Ghana] Invitation to join {venue.name} staff",
        body_text=(
            f"You have been invited to join {venue.name} as a {data.role}.\n\n"
            f"Accept your invitation here: {invite_link}\n\n"
            f"This link expires in 48 hours."
        ),
        body_html=(
            f"<p>You have been invited to join <strong>{html.escape(venue.name)}</strong> as a <strong>{html.escape(data.role)}</strong>.</p>"
            f"<p><a href='{invite_link}'>Click here to accept your invitation</a></p>"
            f"<p>This link expires in 48 hours.</p>"
        ),
    )
    try:
        await email_provider.send_email(msg)
    except Exception:  # noqa: BLE001, S110
        pass

    audit_service = AuditService(db)
    is_step_in = ctx.decision.is_step_in
    actor_kind = "SUPER_ADMIN" if is_step_in else "USER"
    await audit_service.record_audit(
        actor_id=ctx.principal.user_id,
        actor_kind=actor_kind,
        action="STAFF_INVITE",
        target_type="venue_invite",
        target_id=invite.id,
        venue_id=ctx.venue_id,
        details=f"Invited {email_clean} as {data.role}"
        + (" (Platform Step-In)" if is_step_in else ""),
        new_value={"email": email_clean, "role": data.role},
        is_revertible=False,
    )
    await db.commit()

    return {
        "id": invite.id,
        "email": invite.email,
        "role": invite.role,
        "expires_at": invite.expires_at,
    }


@club_router.delete("/staff/{membership_id}")
async def remove_club_staff(
    membership_id: str,
    ctx: Annotated[ClubContext, Depends(club_context(Action.STAFF_MANAGE))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, bool]:
    """Remove a staff member from the club (CLUB_OWNER only)."""
    mem = await db.get(VenueMembership, membership_id)
    if not mem or mem.venue_id != ctx.venue_id:
        raise HTTPException(status_code=404, detail="Staff membership not found")

    if mem.user_id == ctx.principal.user_id and mem.role == ClubRole.CLUB_OWNER:
        raise HTTPException(
            status_code=400,
            detail="Club owners cannot remove their own ownership role.",
        )

    mem.status = "REMOVED"
    mem.updated_at = _utc_now()

    audit_service = AuditService(db)
    is_step_in = ctx.decision.is_step_in
    actor_kind = "SUPER_ADMIN" if is_step_in else "USER"
    await audit_service.record_audit(
        actor_id=ctx.principal.user_id,
        actor_kind=actor_kind,
        action="STAFF_REMOVE",
        target_type="venue_membership",
        target_id=mem.id,
        venue_id=ctx.venue_id,
        details=f"Removed staff membership {mem.id}"
        + (" (Platform Step-In)" if is_step_in else ""),
        old_value={"user_id": mem.user_id, "role": mem.role, "status": "ACTIVE"},
        new_value={"status": "REMOVED"},
        is_revertible=False,
    )

    await db.commit()
    return {"success": True}


@club_router.get("/audit")
async def list_club_audit_logs(
    ctx: Annotated[ClubContext, Depends(club_context(Action.AUDIT_READ))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[dict[str, Any]]:
    """List audit log history scoped strictly to the authorized club."""
    stmt = (
        select(AuditLog)
        .where(AuditLog.venue_id == ctx.venue_id)
        .order_by(AuditLog.created_at.desc())
        .limit(100)
    )
    res = await db.execute(stmt)
    logs = res.scalars().all()
    return [
        {
            "id": l.id,
            "actor_id": l.actor_id,
            "actor_kind": l.actor_kind,
            "actor_role": l.actor_role,
            "venue_id": l.venue_id,
            "action": l.action,
            "target_type": l.target_type,
            "target_id": l.target_id,
            "details": l.details,
            "old_value": l.old_value,
            "new_value": l.new_value,
            "is_revertible": l.is_revertible,
            "reverted_at": l.reverted_at,
            "created_at": l.created_at,
        }
        for l in logs
    ]


@club_router.post("/audit/{log_id}/revert")
async def revert_club_audit_log(
    log_id: str,
    ctx: Annotated[ClubContext, Depends(club_context(Action.AUDIT_REVERT))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """Revert an audit log entry for the authorized club."""
    audit = await db.get(AuditLog, log_id)
    if not audit or audit.venue_id != ctx.venue_id:
        raise HTTPException(status_code=404, detail="Audit log entry not found")

    if not audit.is_revertible:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This action is not revertible",
        )
    if audit.reverted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This action has already been reverted",
        )

    audit_service = AuditService(db)
    actor_kind = "SUPER_ADMIN" if ctx.decision.is_step_in else "USER"
    try:
        revert_log = await audit_service.revert_audit(
            audit_id=log_id,
            actor_id=ctx.principal.user_id,
            actor_kind=actor_kind,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    await db.commit()
    return {
        "success": True,
        "original_action": audit.action,
        "revert_log_id": revert_log.id,
        "reverted_at": revert_log.created_at.isoformat(),
    }


@club_router.post("/photos")
@club_router.post("/photos/upload", status_code=status.HTTP_201_CREATED)
async def upload_venue_photo(
    file: Annotated[UploadFile, File(...)],
    ctx: Annotated[ClubContext, Depends(club_context(Action.PHOTO_EDIT))],
    db: Annotated[AsyncSession, Depends(get_db)],
    caption: Annotated[str, Form()] = "",
    display_order: Annotated[int, Form()] = 0,
) -> dict[str, Any]:
    """Upload a photo for the venue, validating MIME type, magic bytes, and 5 MB size limit via streaming."""
    # Validate declared MIME type
    content_type = file.content_type or ""
    if content_type.lower() not in ALLOWED_PHOTO_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid photo format. Only JPEG, PNG, and WebP are allowed.",
        )

    # Chunked read to prevent memory exhaustion
    total_size = 0
    chunks: list[bytes] = []
    chunk_size = 64 * 1024  # 64 KB
    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        total_size += len(chunk)
        if total_size > MAX_PHOTO_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Photo file size exceeds maximum limit of 5 MB.",
            )
        chunks.append(chunk)

    content = b"".join(chunks)

    # Inspect binary magic bytes
    try:
        ext = validate_photo_magic_bytes(content, content_type)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid photo file content. {e}",
        )

    photo_id = str(uuid.uuid4())
    upload_dir = Path("uploads/venues") / ctx.venue_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / f"{photo_id}{ext}"
    file_path.write_bytes(content)

    url = f"/static/uploads/venues/{ctx.venue_id}/{photo_id}{ext}"
    photo = VenuePhoto(
        id=photo_id,
        venue_id=ctx.venue_id,
        url=url,
        thumbnail_url=url,
        caption=caption.strip(),
        display_order=display_order,
        uploaded_by_id=ctx.principal.user_id,
    )
    db.add(photo)

    audit_service = AuditService(db)
    is_step_in = ctx.decision.is_step_in
    await audit_service.record_audit(
        actor_id=ctx.principal.user_id,
        actor_kind="SUPER_ADMIN" if is_step_in else "USER",
        action="VENUE_PHOTO_UPLOAD",
        target_type="venue_photo",
        target_id=photo.id,
        venue_id=ctx.venue_id,
        details=f"Uploaded photo {file.filename or photo_id}",
        new_value={"url": url, "caption": caption, "display_order": display_order},
        is_revertible=False,
    )
    await db.commit()

    return {
        "success": True,
        "photo": {
            "id": photo.id,
            "url": photo.url,
            "thumbnail_url": photo.thumbnail_url,
            "caption": photo.caption,
            "display_order": photo.display_order,
            "created_at": photo.created_at.isoformat() if photo.created_at else None,
        },
    }


@club_router.get("/photos")
async def list_venue_photos(
    ctx: Annotated[ClubContext, Depends(club_context(Action.VENUE_ADMIN_READ))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """Retrieve all photos for the club venue ordered by display order."""
    stmt = (
        select(VenuePhoto)
        .where(VenuePhoto.venue_id == ctx.venue_id)
        .order_by(VenuePhoto.display_order.asc(), VenuePhoto.created_at.asc())
    )
    res = await db.execute(stmt)
    photos = res.scalars().all()
    return {
        "photos": [
            {
                "id": p.id,
                "url": p.url,
                "thumbnail_url": p.thumbnail_url,
                "caption": p.caption,
                "display_order": p.display_order,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in photos
        ]
    }


@club_router.put("/photos/{photo_id}")
async def update_venue_photo(
    photo_id: str,
    data: PhotoUpdateRequest,
    ctx: Annotated[ClubContext, Depends(club_context(Action.PHOTO_EDIT))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """Update caption or display order for a club photo."""
    photo = await db.get(VenuePhoto, photo_id)
    if not photo or photo.venue_id != ctx.venue_id:
        raise HTTPException(status_code=404, detail="Photo not found")

    old_val = {"caption": photo.caption, "display_order": photo.display_order}
    if data.caption is not None:
        photo.caption = data.caption.strip()
    if data.display_order is not None:
        photo.display_order = data.display_order

    audit_service = AuditService(db)
    is_step_in = ctx.decision.is_step_in
    await audit_service.record_audit(
        actor_id=ctx.principal.user_id,
        actor_kind="SUPER_ADMIN" if is_step_in else "USER",
        action="VENUE_PHOTO_UPDATE",
        target_type="venue_photo",
        target_id=photo.id,
        venue_id=ctx.venue_id,
        details="Updated photo caption or ordering",
        old_value=old_val,
        new_value={"caption": photo.caption, "display_order": photo.display_order},
        is_revertible=False,
    )
    await db.commit()

    return {
        "success": True,
        "photo": {
            "id": photo.id,
            "url": photo.url,
            "thumbnail_url": photo.thumbnail_url,
            "caption": photo.caption,
            "display_order": photo.display_order,
            "created_at": photo.created_at.isoformat() if photo.created_at else None,
        },
    }


@club_router.delete("/photos/{photo_id}")
async def delete_venue_photo(
    photo_id: str,
    ctx: Annotated[ClubContext, Depends(club_context(Action.PHOTO_EDIT))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """Delete a photo record and its stored file."""
    photo = await db.get(VenuePhoto, photo_id)
    if not photo or photo.venue_id != ctx.venue_id:
        raise HTTPException(status_code=404, detail="Photo not found")

    old_val = {
        "url": photo.url,
        "thumbnail_url": photo.thumbnail_url,
        "caption": photo.caption,
        "display_order": photo.display_order,
    }

    # Remove physical file if in local uploads
    if photo.url.startswith("/static/uploads/"):
        rel_path = photo.url.removeprefix("/static/uploads/")
        local_file = Path("uploads") / rel_path
        if local_file.exists():
            try:
                local_file.unlink()
            except OSError:
                pass

    await db.delete(photo)

    audit_service = AuditService(db)
    is_step_in = ctx.decision.is_step_in
    await audit_service.record_audit(
        actor_id=ctx.principal.user_id,
        actor_kind="SUPER_ADMIN" if is_step_in else "USER",
        action="VENUE_PHOTO_DELETE",
        target_type="venue_photo",
        target_id=photo_id,
        venue_id=ctx.venue_id,
        details="Deleted club photo",
        old_value=old_val,
        is_revertible=False,
    )
    await db.commit()

    return {"success": True, "deleted_photo_id": photo_id}
