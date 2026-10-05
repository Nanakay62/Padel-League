"""FastAPI router for billing, orders, checkout, Paystack webhooks, and manual confirmations."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.audit.models import AuditLog
from app.billing.models import Order
from app.billing.schemas import (
    AuditLogResponse,
    CancelEventRequest,
    CancelRegistrationResponse,
    JoinEventRequest,
    MarkPaidRequest,
    OrderResponse,
    RegistrationResponse,
)
from app.billing.service import BillingService
from app.db import get_db
from app.events.models import Registration
from app.identity.deps import get_current_user, get_current_user_id
from app.identity.models import User

router = APIRouter(tags=["Billing & Payments"])

DatabaseSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
CurrentUserId = Annotated[str, Depends(get_current_user_id)]


@router.post(
    "/events/{event_id}/join",
    response_model=RegistrationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def join_event(
    event_id: str,
    payload: JoinEventRequest,
    user: CurrentUser,
    db: DatabaseSession,
) -> RegistrationResponse:
    service = BillingService(db)
    registration = await service.join_event(
        user_id=user.id,
        event_id=event_id,
        method=payload.method,
        callback_url=payload.callback_url,
    )
    return RegistrationResponse.model_validate(registration)


@router.post(
    "/registrations/{registration_id}/mark-paid",
    response_model=RegistrationResponse,
)
async def mark_paid_manual(
    registration_id: str,
    payload: MarkPaidRequest,
    user: CurrentUser,
    db: DatabaseSession,
) -> RegistrationResponse:
    service = BillingService(db)
    registration = await service.mark_paid_manual(
        actor=user,
        registration_id=registration_id,
        reference=payload.reference,
        note=payload.note,
    )
    return RegistrationResponse.model_validate(registration)


@router.post("/webhooks/paystack")
async def paystack_webhook(
    request: Request,
    db: DatabaseSession,
    x_paystack_signature: Annotated[str | None, Header()] = None,
) -> dict[str, str]:
    if not x_paystack_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing x-paystack-signature header",
        )
    body_bytes = await request.body()
    service = BillingService(db)
    return await service.handle_paystack_webhook(body_bytes, x_paystack_signature)


@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    user: CurrentUser,
    db: DatabaseSession,
) -> OrderResponse:
    stmt = select(Order).where(Order.id == order_id)
    res = await db.execute(stmt)
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != user.id and user.role not in ["ORGANISER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    return OrderResponse.model_validate(order)


@router.get("/registrations/{registration_id}", response_model=RegistrationResponse)
async def get_registration(
    registration_id: str,
    user: CurrentUser,
    db: DatabaseSession,
) -> RegistrationResponse:
    stmt = (
        select(Registration)
        .where(Registration.id == registration_id)
        .options(selectinload(Registration.order))
    )
    res = await db.execute(stmt)
    reg = res.scalar_one_or_none()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    if reg.user_id != user.id and user.role not in ["ORGANISER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    return RegistrationResponse.model_validate(reg)


@router.post(
    "/registrations/{registration_id}/cancel",
    response_model=CancelRegistrationResponse,
)
async def cancel_registration(
    registration_id: str,
    user: CurrentUser,
    db: DatabaseSession,
) -> CancelRegistrationResponse:
    service = BillingService(db)
    res = await service.cancel_registration(user.id, registration_id)
    return CancelRegistrationResponse(**res)


@router.post("/events/{event_id}/cancel")
async def cancel_event(
    event_id: str,
    payload: CancelEventRequest,
    user: CurrentUser,
    db: DatabaseSession,
) -> dict[str, Any]:
    service = BillingService(db)
    event = await service.cancel_event(event_id, user, payload.reason)
    return {"id": event.id, "status": event.status, "title": event.title}


@router.post("/billing/sweep-holds")
async def sweep_holds(
    user: CurrentUser,
    db: DatabaseSession,
) -> dict[str, int]:
    service = BillingService(db)
    count = await service.sweep_expired_holds()
    return {"swept_count": count}


@router.get("/audit-logs", response_model=list[AuditLogResponse])
async def list_audit_logs(
    user: CurrentUser,
    db: DatabaseSession,
    target_id: str | None = Query(None),
) -> list[AuditLogResponse]:
    if user.role not in ["ORGANISER", "ADMIN"]:
        raise HTTPException(
            status_code=403, detail="Only organisers and admins can view audit logs"
        )
    stmt = select(AuditLog)
    if target_id:
        stmt = stmt.where(AuditLog.target_id == target_id)
    stmt = stmt.order_by(AuditLog.created_at.desc())
    res = await db.execute(stmt)
    records = res.scalars().all()
    return [AuditLogResponse.model_validate(r) for r in records]


@router.get("/events/{event_id}/waitlist", response_model=list[RegistrationResponse])
async def get_event_waitlist(
    event_id: str,
    db: DatabaseSession,
) -> list[RegistrationResponse]:
    stmt = (
        select(Registration)
        .where(
            Registration.event_id == event_id,
            Registration.status == "WAITLISTED",
        )
        .order_by(Registration.waitlist_position.asc())
        .options(selectinload(Registration.order))
    )
    res = await db.execute(stmt)
    registrations = res.scalars().all()
    return [RegistrationResponse.model_validate(r) for r in registrations]
