"""Tests for background jobs, seat hold expiration, SMS quotas, and frozen clock time travel."""

from datetime import UTC, datetime, timedelta

import pytest
import time_machine

from app.billing.models import Order
from app.events.models import Event, Registration
from app.identity.service import IdentityService
from app.jobs.tasks import (
    expire_seat_holds_task,
    send_event_reminders_task,
    send_sms_task,
)
from tests.conftest import db_session_maker


@pytest.mark.asyncio
async def test_expire_seat_holds_with_frozen_clock():
    base_time = datetime(2026, 10, 10, 10, 0, 0, tzinfo=UTC)

    with time_machine.travel(base_time, tick=False):
        async with db_session_maker() as db:
            identity_svc = IdentityService(db)
            player = await identity_svc.create_user(
                phone_e164="+233240099111", name="Kojo Mensah", role="PLAYER"
            )

            event = Event(
                title="Hold Test Event",
                venue_name="Airport Hills Padel",
                format="AMERICANO",
                courts=1,
                max_players=4,
                price_pesewas=5500,
                status="PUBLISHED",
                start_time=base_time + timedelta(days=2),
            )
            db.add(event)
            await db.flush()

            order = Order(
                user_id=player.id,
                event_id=event.id,
                amount_pesewas=5500,
                court_fee_pesewas=5000,
                platform_fee_pesewas=500,
                currency="GHS",
                method="CASH",
                status="PENDING",
                reference="padel_hold_test_01",
                created_at=base_time,
            )
            db.add(order)
            await db.flush()

            # Seat hold set to expire in 10 minutes (10:10:00)
            reg = Registration(
                event_id=event.id,
                user_id=player.id,
                order_id=order.id,
                status="PENDING_PAYMENT",
                hold_expires_at=base_time + timedelta(minutes=10),
                created_at=base_time,
            )
            db.add(reg)
            await db.commit()

            # At 10:05:00 (5 minutes in), hold is not expired
            with time_machine.travel(base_time + timedelta(minutes=5), tick=False):
                swept = await expire_seat_holds_task(db)
                assert swept == 0
                await db.refresh(reg)
                assert reg.status == "PENDING_PAYMENT"

            # At 10:11:00 (11 minutes in), hold has expired
            with time_machine.travel(base_time + timedelta(minutes=11), tick=False):
                swept = await expire_seat_holds_task(db)
                assert swept == 1
                await db.refresh(reg)
                assert reg.status == "EXPIRED"

                # Double-run safety: executing task again is idempotent
                swept_again = await expire_seat_holds_task(db)
                assert swept_again == 0


@pytest.mark.asyncio
async def test_send_sms_task_enforces_monthly_cap_and_quiet_hours():
    # 23:00 UTC = 23:00 Accra time (Quiet hours!)
    night_time = datetime(2026, 10, 10, 23, 0, 0, tzinfo=UTC)

    with time_machine.travel(night_time, tick=False):
        async with db_session_maker() as db:
            identity_svc = IdentityService(db)
            player = await identity_svc.create_user(
                phone_e164="+233240099222", name="Ama Serwaa", role="PLAYER"
            )

            # Non-critical SMS during quiet hours is dropped/suppressed
            res = await send_sms_task(
                db=db,
                user_id=player.id,
                phone_e164=player.phone_e164,
                message="Waitlist slot opened!",
                notification_type="WAITLIST_OFFER",
            )
            assert res["status"] == "DROPPED_QUIET_HOURS"

    # Active hours: 14:00 UTC
    day_time = datetime(2026, 10, 11, 14, 0, 0, tzinfo=UTC)
    with time_machine.travel(day_time, tick=False):
        async with db_session_maker() as db:
            identity_svc = IdentityService(db)
            player = await identity_svc.create_user(
                phone_e164="+233240099333", name="Yaw Boateng", role="PLAYER"
            )

            # Send 5 SMS messages successfully
            for i in range(5):
                res = await send_sms_task(
                    db=db,
                    user_id=player.id,
                    phone_e164=player.phone_e164,
                    message=f"Reminder #{i}",
                    notification_type="REMINDER",
                )
                assert res["status"] == "SENT"

            # 6th SMS in same month is capped
            capped_res = await send_sms_task(
                db=db,
                user_id=player.id,
                phone_e164=player.phone_e164,
                message="6th message",
                notification_type="REMINDER",
            )
            assert capped_res["status"] == "CAPPED"


@pytest.mark.asyncio
async def test_send_event_reminders_task_double_run_safe():
    start_time = datetime(2026, 10, 15, 18, 0, 0, tzinfo=UTC)
    two_hours_before = start_time - timedelta(hours=2)

    with time_machine.travel(two_hours_before, tick=False):
        async with db_session_maker() as db:
            identity_svc = IdentityService(db)
            player = await identity_svc.create_user(
                phone_e164="+233240099444", name="Kofi Poku", role="PLAYER"
            )

            event = Event(
                title="Thursday Night Americano",
                venue_name="Cantonments Padel Club",
                format="AMERICANO",
                courts=1,
                max_players=4,
                status="PUBLISHED",
                start_time=start_time,
            )
            db.add(event)
            await db.flush()

            reg = Registration(
                event_id=event.id,
                user_id=player.id,
                status="CONFIRMED",
                created_at=two_hours_before - timedelta(days=1),
            )
            db.add(reg)
            await db.commit()

            # First run sends 2-hour reminder
            sent_count = await send_event_reminders_task(
                db=db, event_id=event.id, reminder_window="2H"
            )
            assert sent_count == 1

            # Double-run: second run is idempotent and does not send again
            second_run = await send_event_reminders_task(
                db=db, event_id=event.id, reminder_window="2H"
            )
            assert second_run == 0
