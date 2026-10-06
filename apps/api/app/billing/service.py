"""Service handling payments, orders, manual confirmations, waitlists, and cancellations."""

import json
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.audit.models import AuditLog
from app.billing.models import Credit, Order
from app.billing.paystack import PaystackGateway
from app.config import settings
from app.domain.billing import (
    calculate_registration_cost,
    determine_cancellation_refund,
    verify_paystack_hmac,
)
from app.events.models import Event, Registration
from app.identity.models import User


def _utc_now() -> datetime:
    return datetime.now(UTC)


def _as_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt


class BillingService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.paystack = PaystackGateway()

    async def join_event(
        self,
        user_id: str,
        event_id: str,
        method: str,
        callback_url: str | None = None,
    ) -> Registration:
        """Register a player for an event.

        - If slots are available, reserves a seat with a 10-minute hold (PENDING_PAYMENT)
          and creates an Order.
        - If the event is full, places the player on the ordered WAITLIST.
        """
        now = _utc_now()

        event_stmt = select(Event).where(Event.id == event_id)
        res = await self.db.execute(event_stmt)
        event = res.scalar_one_or_none()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        # Check existing active registrations for this user
        existing_stmt = select(Registration).where(
            Registration.event_id == event_id,
            Registration.user_id == user_id,
            Registration.status.in_(["PENDING_PAYMENT", "CONFIRMED", "WAITLISTED"]),
        )
        existing_res = await self.db.execute(existing_stmt)
        if existing_res.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="You already have an active registration for this event.",
            )

        # Count confirmed and pending seats
        active_count_stmt = (
            select(func.count())
            .select_from(Registration)
            .where(
                Registration.event_id == event_id,
                Registration.status.in_(["PENDING_PAYMENT", "CONFIRMED"]),
            )
        )
        active_count_res = await self.db.execute(active_count_stmt)
        active_count = active_count_res.scalar() or 0

        # Waitlist check
        if active_count >= event.max_players:
            waitlist_count_stmt = (
                select(func.count())
                .select_from(Registration)
                .where(
                    Registration.event_id == event_id,
                    Registration.status == "WAITLISTED",
                )
            )
            wl_res = await self.db.execute(waitlist_count_stmt)
            next_pos = (wl_res.scalar() or 0) + 1

            registration = Registration(
                id=str(uuid.uuid4()),
                event_id=event_id,
                user_id=user_id,
                status="WAITLISTED",
                waitlist_position=next_pos,
                hold_expires_at=None,
                created_at=now,
            )
            self.db.add(registration)
            await self.db.commit()
            await self.db.refresh(registration)
            return registration

        # Calculate fees (pesewas)
        if event.court_rate_pesewas > 0:
            court_fee, platform_fee, total_payable = calculate_registration_cost(
                court_rate_pesewas=event.court_rate_pesewas,
                confirmed_player_count=event.max_players,
                platform_fee_pesewas=500,
                rounding_unit_pesewas=settings.rounding_unit_pesewas,
            )
        elif event.price_pesewas > 0:
            total_payable = event.price_pesewas
            platform_fee = min(500, total_payable)
            court_fee = max(0, total_payable - platform_fee)
        else:
            court_fee = 5000
            platform_fee = 500
            total_payable = 5500

        hold_expires_at = now + timedelta(minutes=settings.seat_hold_minutes)
        reference = f"padel_{uuid.uuid4().hex[:12]}"

        # Initialize Paystack checkout if online payment
        paystack_auth_url: str | None = None
        if method == "PAYSTACK":
            # Fetch user email or fallback to simulated phone email
            user = await self.db.get(User, user_id)
            email = (
                user.email
                if user and user.email
                else f"player_{user_id[:8]}@padelghana.com"
            )
            checkout_info = await self.paystack.initialize_transaction(
                amount_pesewas=total_payable,
                email=email,
                reference=reference,
                callback_url=callback_url,
                metadata={"event_id": event_id, "user_id": user_id},
            )
            paystack_auth_url = checkout_info.get("authorization_url")

        order = Order(
            id=str(uuid.uuid4()),
            user_id=user_id,
            event_id=event_id,
            amount_pesewas=total_payable,
            court_fee_pesewas=court_fee,
            platform_fee_pesewas=platform_fee,
            currency="GHS",
            method=method,
            status="PENDING",
            reference=reference,
            paystack_authorization_url=paystack_auth_url,
            created_at=now,
        )
        self.db.add(order)
        await self.db.flush()

        registration = Registration(
            id=str(uuid.uuid4()),
            event_id=event_id,
            user_id=user_id,
            order_id=order.id,
            status="PENDING_PAYMENT",
            hold_expires_at=hold_expires_at,
            created_at=now,
        )
        self.db.add(registration)
        await self.db.commit()

        # Reload with order relationship
        loaded_stmt = (
            select(Registration)
            .where(Registration.id == registration.id)
            .options(selectinload(Registration.order))
        )
        loaded_res = await self.db.execute(loaded_stmt)
        return loaded_res.scalar_one()

    async def mark_paid_manual(
        self,
        actor: User,
        registration_id: str,
        reference: str,
        note: str | None = None,
    ) -> Registration:
        """Mark an order paid manually (MoMo / Cash), strictly accessible to organisers and admins."""
        if actor.role not in ["ORGANISER", "ORGANIZER", "ADMIN"]:
            raise HTTPException(
                status_code=403,
                detail="Only organizers and admins can manually mark payments as confirmed.",
            )

        stmt = (
            select(Registration)
            .where(Registration.id == registration_id)
            .options(selectinload(Registration.order))
        )
        res = await self.db.execute(stmt)
        reg = res.scalar_one_or_none()
        if not reg:
            raise HTTPException(status_code=404, detail="Registration not found")

        if not reg.order:
            raise HTTPException(
                status_code=400, detail="Registration has no associated order"
            )

        now = _utc_now()
        reg.order.status = "PAID"
        reg.order.paid_at = now
        reg.status = "CONFIRMED"
        reg.hold_expires_at = None

        # Write immutable AuditLog
        audit = AuditLog(
            actor_id=actor.id,
            action="MANUAL_PAYMENT_CONFIRMED",
            target_type="registration",
            target_id=reg.id,
            amount_pesewas=reg.order.amount_pesewas,
            reference=reference,
            details=json.dumps(
                {"note": note or "Manual confirmation", "method": reg.order.method}
            ),
            created_at=now,
        )
        self.db.add(audit)
        await self.db.commit()
        await self.db.refresh(reg)
        return reg

    async def handle_paystack_webhook(
        self,
        payload_bytes: bytes,
        signature_header: str,
    ) -> dict[str, str]:
        """Handle incoming Paystack webhook with HMAC verification and idempotency."""
        if not verify_paystack_hmac(
            payload_bytes, signature_header, settings.paystack_secret_key
        ):
            raise HTTPException(status_code=400, detail="Invalid HMAC signature")

        payload = json.loads(payload_bytes.decode("utf-8"))
        if payload.get("event") != "charge.success":
            return {"status": "ignored"}

        data = payload.get("data", {})
        reference = data.get("reference")
        if not reference:
            raise HTTPException(status_code=400, detail="Missing reference in payload")

        order_stmt = (
            select(Order)
            .where(Order.reference == reference)
            .options(selectinload(Order.registrations))
        )
        res = await self.db.execute(order_stmt)
        order = res.scalar_one_or_none()
        if not order:
            raise HTTPException(status_code=404, detail="Order reference not found")

        # Idempotency check: replay does not double-charge or double-apply
        if order.status == "PAID":
            return {"status": "already_processed"}

        # Server-verify transaction with Paystack API before confirming
        verification = await self.paystack.verify_transaction(reference)
        if verification.get("status") != "success":
            raise HTTPException(
                status_code=400, detail="Paystack transaction verification failed"
            )

        now = _utc_now()
        order.status = "PAID"
        order.paid_at = now

        for reg in order.registrations:
            reg.status = "CONFIRMED"
            reg.hold_expires_at = None

        # Audit log
        audit = AuditLog(
            actor_id="SYSTEM",
            action="PAYSTACK_PAYMENT_CONFIRMED",
            target_type="order",
            target_id=order.id,
            amount_pesewas=order.amount_pesewas,
            reference=reference,
            details=json.dumps({"channel": data.get("channel", "unknown")}),
            created_at=now,
        )
        self.db.add(audit)
        await self.db.commit()
        return {"status": "success"}

    async def cancel_registration(
        self,
        user_id: str,
        registration_id: str,
    ) -> dict[str, Any]:
        """Cancel registration, handle automated refund or platform credit, and promote waitlist."""
        stmt = (
            select(Registration)
            .where(Registration.id == registration_id)
            .options(selectinload(Registration.order), selectinload(Registration.event))
        )
        res = await self.db.execute(stmt)
        reg = res.scalar_one_or_none()
        if not reg:
            raise HTTPException(status_code=404, detail="Registration not found")

        now = _utc_now()
        start = (
            _as_utc(reg.event.start_time)
            if reg.event.start_time
            else now + timedelta(days=2)
        )
        policy = determine_cancellation_refund(start, now, settings.free_cancel_hours)

        credit_amount = 0
        if policy == "FREE" and reg.order and reg.order.status == "PAID":
            credit_amount = reg.order.amount_pesewas
            # Issue platform credit row
            credit = Credit(
                id=str(uuid.uuid4()),
                user_id=reg.user_id,
                amount_pesewas=credit_amount,
                reason=f"Free cancellation for event: {reg.event.title}",
                source_registration_id=reg.id,
                created_at=now,
            )
            self.db.add(credit)

            audit = AuditLog(
                actor_id=user_id,
                action="CREDIT_ISSUED",
                target_type="registration",
                target_id=reg.id,
                amount_pesewas=credit_amount,
                reference=f"credit_{reg.id[:8]}",
                details=json.dumps({"policy": "FREE_CANCELLATION"}),
                created_at=now,
            )
            self.db.add(audit)
            reg.status = "CANCELLED_FREE"
        else:
            reg.status = "CANCELLED_LATE" if policy == "LATE" else "CANCELLED_FREE"

        await self.db.flush()

        # Promote next waitlisted player
        await self._promote_next_waitlisted_player(reg.event_id)

        await self.db.commit()
        return {
            "id": reg.id,
            "status": reg.status,
            "credit_issued_pesewas": credit_amount,
        }

    async def _promote_next_waitlisted_player(self, event_id: str) -> None:
        """Promote top waitlisted player to PENDING_PAYMENT with fresh hold."""
        wl_stmt = (
            select(Registration)
            .where(
                Registration.event_id == event_id,
                Registration.status == "WAITLISTED",
            )
            .order_by(Registration.waitlist_position.asc())
        )
        wl_res = await self.db.execute(wl_stmt)
        next_waitlisted = wl_res.scalars().first()
        if next_waitlisted:
            now = _utc_now()
            next_waitlisted.status = "PENDING_PAYMENT"
            next_waitlisted.waitlist_position = None
            next_waitlisted.hold_expires_at = now + timedelta(
                minutes=settings.seat_hold_minutes
            )

    async def sweep_expired_holds(self) -> int:
        """Find stale seat holds, release them, and promote the next waitlisted player."""
        now = _utc_now()
        stmt = (
            select(Registration)
            .where(
                Registration.status == "PENDING_PAYMENT",
                Registration.hold_expires_at != None,
                Registration.hold_expires_at < now,
            )
            .options(selectinload(Registration.order))
        )
        res = await self.db.execute(stmt)
        expired_regs = res.scalars().all()
        count = 0

        for reg in expired_regs:
            reg.status = "EXPIRED"
            if reg.order and reg.order.status == "PENDING":
                reg.order.status = "EXPIRED"
            count += 1
            await self._promote_next_waitlisted_player(reg.event_id)

        if count > 0:
            await self.db.commit()
        return count

    async def cancel_event(
        self,
        event_id: str,
        actor: User,
        reason: str = "Cancelled by organiser",
    ) -> Event:
        """Cancel an entire event, refunding/crediting each confirmed player exactly once."""
        if actor.role not in ["ORGANISER", "ORGANIZER", "ADMIN"]:
            raise HTTPException(
                status_code=403, detail="Only organisers can cancel events"
            )

        event = await self.db.get(Event, event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        now = _utc_now()
        event.status = "CANCELLED"
        event.cancellation_reason = reason

        stmt = (
            select(Registration)
            .where(
                Registration.event_id == event_id,
                Registration.status == "CONFIRMED",
            )
            .options(selectinload(Registration.order))
        )
        res = await self.db.execute(stmt)
        confirmed_regs = res.scalars().all()

        for reg in confirmed_regs:
            reg.status = "CANCELLED_FREE"
            amount = reg.order.amount_pesewas if reg.order else event.price_pesewas
            if amount > 0:
                credit = Credit(
                    id=str(uuid.uuid4()),
                    user_id=reg.user_id,
                    amount_pesewas=amount,
                    reason=f"Event cancellation: {reason}",
                    source_registration_id=reg.id,
                    created_at=now,
                )
                self.db.add(credit)

                audit = AuditLog(
                    actor_id=actor.id,
                    action="CREDIT_ISSUED",
                    target_type="registration",
                    target_id=reg.id,
                    amount_pesewas=amount,
                    reference=f"event_cancel_{event.id[:8]}",
                    details=json.dumps({"reason": reason}),
                    created_at=now,
                )
                self.db.add(audit)

        event_audit = AuditLog(
            actor_id=actor.id,
            action="EVENT_CANCELLED",
            target_type="EVENT",
            target_id=event.id,
            details=f"Event cancelled. Reason: {reason}",
            created_at=now,
        )
        self.db.add(event_audit)

        await self.db.commit()
        await self.db.refresh(event)
        return event
