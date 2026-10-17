"""FastAPI routes for Super Admin Platform operations on ADMIN_HOST."""

import hashlib
import html
import secrets
import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.audit.models import AuditLog
from app.audit.service import AuditService
from app.authz.deps import get_principal
from app.authz.policy import Principal
from app.config import settings
from app.db import get_db
from app.events.models import Event
from app.identity.models import PlatformSetting, User
from app.notify.email import EmailMessage, get_email_provider
from app.venues.models import Court, Venue, VenueInvite, VenueMembership

admin_router = APIRouter(prefix="/portal/admin", tags=["Super Admin Portal"])


def _utc_now() -> datetime:
    return datetime.now(UTC)


async def _get_or_create_platform_setting(db: AsyncSession) -> PlatformSetting:
    setting = await db.get(PlatformSetting, "default")
    if not setting:
        setting = PlatformSetting(
            id="default",
            allow_multi_venue_per_user=settings.max_venues_per_club_user > 1,
            platform_announcement=None,
        )
        db.add(setting)
        await db.flush()
    return setting


def require_super_admin(
    principal: Annotated[Principal, Depends(get_principal)],
) -> Principal:
    """Ensure authenticated principal holds platform-level SUPER_ADMIN or ADMIN role and is MFA verified."""
    if principal.platform_role not in ("SUPER_ADMIN", "ADMIN"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required. Player or club staff credentials are not permitted.",
        )
    if not principal.mfa_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "MFA_REQUIRED",
                "message": "Two-factor authentication required for this action",
            },
        )
    return principal


# --- Request & Response Models ---


class VenueRegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    address: str = Field(default="", max_length=255)
    ghana_gps: str = Field(default="", max_length=32)
    owner_email: EmailStr
    initial_courts_count: int = Field(default=1, ge=1, le=50)
    base_rate_pesewas: int = Field(default=30000, ge=100)


class SettingsUpdateRequest(BaseModel):
    allow_multi_venue_per_user: bool | None = None
    platform_announcement: str | None = None


# --- Routes ---


@admin_router.get("/overview")
async def get_platform_overview(
    principal: Annotated[Principal, Depends(require_super_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """Retrieve platform-wide operational KPIs and system metrics."""
    venues_count = await db.scalar(select(func.count(Venue.id))) or 0
    courts_count = await db.scalar(select(func.count(Court.id))) or 0
    users_count = await db.scalar(select(func.count(User.id))) or 0
    events_count = await db.scalar(select(func.count(Event.id))) or 0
    audit_count = await db.scalar(select(func.count(AuditLog.id))) or 0

    return {
        "total_venues": venues_count,
        "total_courts": courts_count,
        "total_users": users_count,
        "total_events": events_count,
        "total_audit_events": audit_count,
        "currency": settings.currency,
        "timezone": settings.timezone,
        "admin_user_id": principal.user_id,
    }


@admin_router.get("/venues")
async def list_admin_venues(
    principal: Annotated[Principal, Depends(require_super_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """List all registered clubs with court counts, owner information, and status."""
    stmt = (
        select(Venue)
        .options(
            selectinload(Venue.courts),
            selectinload(Venue.memberships).selectinload(VenueMembership.user),
        )
        .order_by(Venue.name.asc())
    )
    res = await db.execute(stmt)
    venues = res.scalars().all()

    items = []
    for v in venues:
        # Find owner
        owner_name = "Unassigned"
        owner_email = "None"
        for m in v.memberships:
            if m.role == "CLUB_OWNER" and m.user:
                owner_name = m.user.name
                owner_email = m.user.email or "None"
                break

        base_rate = v.base_rate_pesewas_per_hour or 0
        items.append(
            {
                "id": v.id,
                "name": v.name,
                "address": v.address,
                "ghana_gps": v.ghanapost_gps,
                "courts_count": len(v.courts or []),
                "base_rate_pesewas": v.base_rate_pesewas_per_hour,
                "formatted_base_rate": f"GH₵ {(base_rate / 100):.2f}",
                "price_version": v.price_version,
                "owner_name": owner_name,
                "owner_email": owner_email,
                "created_at": v.created_at.isoformat()
                if hasattr(v, "created_at") and v.created_at
                else None,
            }
        )

    return {"venues": items, "total": len(items)}


@admin_router.post("/venues", status_code=status.HTTP_201_CREATED)
async def register_club_venue(
    data: VenueRegisterRequest,
    principal: Annotated[Principal, Depends(require_super_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """Register a new club venue and dispatch initial CLUB_OWNER invitation."""
    venue_id = str(uuid.uuid4())

    venue = Venue(
        id=venue_id,
        name=data.name.strip(),
        address=data.address.strip(),
        ghanapost_gps=data.ghana_gps.strip(),
        base_rate_pesewas_per_hour=data.base_rate_pesewas,
        price_version=1,
    )
    db.add(venue)

    # Create initial courts
    for i in range(1, data.initial_courts_count + 1):
        court = Court(
            id=str(uuid.uuid4()),
            venue_id=venue_id,
            court_number=i,
            is_indoor=False,
            surface="Blue Mondo Turf",
            lighting="",
            notes="",
        )
        db.add(court)

    # Create CLUB_OWNER invite
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    invite = VenueInvite(
        id=str(uuid.uuid4()),
        venue_id=venue_id,
        email=data.owner_email.lower().strip(),
        role="CLUB_OWNER",
        token_hash=token_hash,
        invited_by_id=principal.user_id,
        expires_at=_utc_now() + timedelta(hours=settings.venue_invite_ttl_hours),
    )
    db.add(invite)

    # Record audit log
    audit_service = AuditService(db)
    await audit_service.record_audit(
        actor_id=principal.user_id,
        actor_kind="SUPER_ADMIN",
        action="VENUE_REGISTER",
        target_type="venue",
        target_id=venue_id,
        venue_id=venue_id,
        details=f"Registered club {data.name} with {data.initial_courts_count} courts and invited owner {data.owner_email}",
        new_value={
            "name": data.name,
            "address": data.address,
            "owner_email": data.owner_email,
            "courts_count": data.initial_courts_count,
            "base_rate_pesewas": data.base_rate_pesewas,
        },
        is_revertible=False,
    )
    await db.commit()

    # Send invitation email
    email_provider = get_email_provider()
    invite_link = f"https://{settings.club_host}/invite?token={raw_token}"
    msg = EmailMessage(
        to=data.owner_email.lower().strip(),
        subject=f"[Padel Ghana] Invitation to set up {data.name} on Club Back Office",
        body_text=(
            f"Hello,\n\n"
            f"You have been invited by Padel Ghana to manage {data.name} as Club Owner.\n\n"
            f"Activate your account and configure your club portal here: {invite_link}\n\n"
            f"This invitation link expires in {settings.venue_invite_ttl_hours} hours."
        ),
        body_html=(
            f"<p>Hello,</p>"
            f"<p>You have been invited by Padel Ghana to manage <strong>{html.escape(data.name)}</strong> as <strong>Club Owner</strong>.</p>"
            f"<p><a href='{invite_link}'>Click here to activate your account and set up your club</a></p>"
            f"<p>This invitation link expires in {settings.venue_invite_ttl_hours} hours.</p>"
        ),
    )
    try:
        await email_provider.send_email(msg)
    except Exception:  # noqa: BLE001, S110
        pass

    return {
        "venue": {
            "id": venue.id,
            "name": venue.name,
            "address": venue.address,
            "base_rate_pesewas": venue.base_rate_pesewas_per_hour,
            "courts_count": data.initial_courts_count,
        },
        "invite": {
            "id": invite.id,
            "email": invite.email,
            "role": invite.role,
            "expires_at": invite.expires_at.isoformat(),
        },
    }


@admin_router.get("/audit")
async def get_global_audit_trail(
    principal: Annotated[Principal, Depends(require_super_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    venue_id: str | None = None,
    action: str | None = None,
    actor_id: str | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> dict[str, Any]:
    """Retrieve platform-wide audit log with filtering across all venues and operations."""
    stmt = select(AuditLog)
    if venue_id:
        stmt = stmt.where(AuditLog.venue_id == venue_id)
    if action:
        stmt = stmt.where(AuditLog.action == action)
    if actor_id:
        stmt = stmt.where(AuditLog.actor_id == actor_id)

    total = await db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    stmt = stmt.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit)
    res = await db.execute(stmt)
    logs = res.scalars().all()

    # Pre-fetch actor names
    actor_ids = {log.actor_id for log in logs if log.actor_id}
    users_stmt = select(User).where(User.id.in_(actor_ids))
    users_res = await db.execute(users_stmt)
    users_by_id = {u.id: u for u in users_res.scalars().all()}

    items = []
    for log in logs:
        user = users_by_id.get(log.actor_id)
        actor_name = user.name if user else "System"
        actor_role = user.role if user else (log.actor_role or "SYSTEM")
        is_step_in = log.actor_kind == "SUPER_ADMIN" and log.venue_id is not None

        items.append(
            {
                "id": log.id,
                "action": log.action,
                "entity_name": log.target_type,
                "entity_id": log.target_id,
                "venue_id": log.venue_id,
                "actor_id": log.actor_id,
                "actor_name": actor_name,
                "actor_role": actor_role,
                "actor_kind": log.actor_kind,
                "is_step_in": is_step_in,
                "details": log.details,
                "changes": {
                    "previous": log.old_value,
                    "updated": log.new_value,
                }
                if log.old_value or log.new_value
                else None,
                "is_revertible": log.is_revertible,
                "reverted_at": log.reverted_at.isoformat() if log.reverted_at else None,
                "created_at": log.created_at.isoformat(),
            }
        )

    return {"items": items, "total": total}


@admin_router.get("/settings")
async def get_platform_settings(
    principal: Annotated[Principal, Depends(require_super_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """Retrieve global platform configuration from database."""
    setting = await _get_or_create_platform_setting(db)
    return {
        "allow_multi_venue_per_user": setting.allow_multi_venue_per_user,
        "platform_announcement": setting.platform_announcement or "",
        "currency": settings.currency,
        "timezone": settings.timezone,
        "club_host": settings.club_host,
        "admin_host": settings.admin_host,
        "max_venues_per_club_user": 999 if setting.allow_multi_venue_per_user else 1,
    }


@admin_router.put("/settings")
async def update_platform_settings(
    data: SettingsUpdateRequest,
    principal: Annotated[Principal, Depends(require_super_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """Update global platform configuration in database and record an audit log."""
    setting = await _get_or_create_platform_setting(db)
    old_value = {
        "allow_multi_venue_per_user": setting.allow_multi_venue_per_user,
        "platform_announcement": setting.platform_announcement or "",
    }

    if data.allow_multi_venue_per_user is not None:
        setting.allow_multi_venue_per_user = data.allow_multi_venue_per_user
        # Keep config in sync
        settings.max_venues_per_club_user = (
            999 if data.allow_multi_venue_per_user else 1
        )

    if data.platform_announcement is not None:
        setting.platform_announcement = data.platform_announcement.strip()

    setting.updated_at = _utc_now()
    new_value = {
        "allow_multi_venue_per_user": setting.allow_multi_venue_per_user,
        "platform_announcement": setting.platform_announcement or "",
    }

    audit_service = AuditService(db)
    await audit_service.record_audit(
        actor_id=principal.user_id,
        actor_kind="SUPER_ADMIN",
        action="PLATFORM_SETTINGS_UPDATE",
        target_type="system_settings",
        target_id="global",
        details="Updated platform settings",
        old_value=old_value,
        new_value=new_value,
        is_revertible=False,
    )
    await db.commit()
    await db.refresh(setting)

    return {
        "success": True,
        "settings": {
            "allow_multi_venue_per_user": setting.allow_multi_venue_per_user,
            "platform_announcement": setting.platform_announcement or "",
            "currency": settings.currency,
            "timezone": settings.timezone,
        },
    }
