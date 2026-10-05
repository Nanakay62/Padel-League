"""Pydantic schemas for billing, orders, checkout, and registrations."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class JoinEventRequest(BaseModel):
    method: Literal["MANUAL_MOMO", "CASH", "PAYSTACK"]
    callback_url: str | None = None


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    event_id: str
    amount_pesewas: int
    court_fee_pesewas: int
    platform_fee_pesewas: int
    currency: str
    method: str
    status: str
    reference: str
    paystack_authorization_url: str | None = None
    paid_at: datetime | None = None
    created_at: datetime


class RegistrationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    event_id: str
    user_id: str
    status: str
    hold_expires_at: datetime | None = None
    waitlist_position: int | None = None
    order: OrderResponse | None = None
    created_at: datetime


class MarkPaidRequest(BaseModel):
    reference: str
    note: str | None = None


class CancelRegistrationResponse(BaseModel):
    id: str
    status: str
    credit_issued_pesewas: int = 0


class CancelEventRequest(BaseModel):
    reason: str = "Event cancelled by organiser"


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    actor_id: str
    action: str
    target_type: str
    target_id: str
    amount_pesewas: int | None = None
    reference: str | None = None
    details: str | None = None
    created_at: datetime
