"""Background jobs for seat hold expiration, SMS notifications, and event reminders."""

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.billing.service import BillingService
from app.domain.notify import (
    check_monthly_sms_cap,
    format_reminder_message,
    is_quiet_hours,
)
from app.events.models import Event, Registration
from app.jobs.app import app
from app.notify.models import NotificationLog
from app.notify.sms import get_sms_provider


def _utc_now() -> datetime:
    return datetime.now(UTC)


@app.task
async def expire_seat_holds_task(db: AsyncSession) -> int:
    """Sweep and release expired seat holds, auto-promoting waitlisted players.

    Double-run safe and idempotent.
    """
    billing_svc = BillingService(db)
    return await billing_svc.sweep_expired_holds()


@app.task
async def send_sms_task(
    db: AsyncSession,
    user_id: str,
    phone_e164: str,
    message: str,
    notification_type: str = "REMINDER",
) -> dict[str, Any]:
    """Dispatch SMS while strictly enforcing Ghana quiet hours and monthly budget caps."""
    now = _utc_now()

    # 1. Quiet Hours check (22:00 - 06:00 Africa/Accra)
    # OTP is the only exception allowed during quiet hours
    if is_quiet_hours(now) and notification_type != "OTP":
        log = NotificationLog(
            id=str(uuid.uuid4()),
            user_id=user_id,
            channel="SMS",
            notification_type=notification_type,
            recipient=phone_e164,
            message=message,
            status="DROPPED_QUIET_HOURS",
            created_at=now,
        )
        db.add(log)
        await db.commit()
        return {"status": "DROPPED_QUIET_HOURS"}

    # 2. Monthly quota check
    month_start = datetime(now.year, now.month, 1, tzinfo=UTC)
    count_stmt = (
        select(func.count())
        .select_from(NotificationLog)
        .where(
            NotificationLog.user_id == user_id,
            NotificationLog.channel == "SMS",
            NotificationLog.status == "SENT",
            NotificationLog.created_at >= month_start,
        )
    )
    res = await db.execute(count_stmt)
    sent_this_month = res.scalar() or 0

    if not check_monthly_sms_cap(sent_this_month, max_cap=5):
        log = NotificationLog(
            id=str(uuid.uuid4()),
            user_id=user_id,
            channel="SMS",
            notification_type=notification_type,
            recipient=phone_e164,
            message=message,
            status="CAPPED",
            created_at=now,
        )
        db.add(log)
        await db.commit()
        return {"status": "CAPPED"}

    # 3. Deliver SMS via provider
    provider = get_sms_provider()
    delivered = await provider.send_sms(phone_e164, message)
    delivery_status = "SENT" if delivered else "FAILED"

    log = NotificationLog(
        id=str(uuid.uuid4()),
        user_id=user_id,
        channel="SMS",
        notification_type=notification_type,
        recipient=phone_e164,
        message=message,
        status=delivery_status,
        created_at=now,
    )
    db.add(log)
    await db.commit()
    return {"status": delivery_status}


@app.task
async def send_event_reminders_task(
    db: AsyncSession,
    event_id: str,
    reminder_window: str,  # "24H" or "2H"
) -> int:
    """Send 24-hour or 2-hour event reminders containing digital addresses and map links.

    Idempotent: double-run safe, never double-delivers reminders for the same event window.
    """
    event = await db.get(Event, event_id)
    if not event or not event.start_time:
        return 0

    stmt = (
        select(Registration)
        .where(
            Registration.event_id == event_id,
            Registration.status == "CONFIRMED",
        )
        .options(selectinload(Registration.user))
    )
    res = await db.execute(stmt)
    confirmed_regs = res.scalars().all()

    sent_count = 0
    notif_type = f"REMINDER_{reminder_window}"

    for reg in confirmed_regs:
        user = reg.user
        if not user:
            continue

        # Check idempotency: did we already send this reminder to this user?
        check_stmt = select(NotificationLog).where(
            NotificationLog.user_id == user.id,
            NotificationLog.notification_type == notif_type,
            NotificationLog.message.like(f"%{event.title}%"),
            NotificationLog.status == "SENT",
        )
        check_res = await db.execute(check_stmt)
        if check_res.scalar_one_or_none():
            continue  # Already sent, skip

        # Build message with Ghana digital address and Google Maps link
        message = format_reminder_message(
            event_title=event.title,
            start_time=event.start_time,
            venue_name=event.venue_name or "Club Padel",
            court_number=1,
            maps_url="https://maps.google.com/?q=accra_padel",
            ghanapost_gps="GL-045-8901",
        )

        sms_result = await send_sms_task(
            db=db,
            user_id=user.id,
            phone_e164=user.phone_e164,
            message=message,
            notification_type=notif_type,
        )
        if sms_result.get("status") == "SENT":
            sent_count += 1

    return sent_count
