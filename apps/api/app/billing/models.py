"""SQLAlchemy models for orders, payments, refunds, and platform credits."""

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

if TYPE_CHECKING:
    from app.events.models import Event, Registration
    from app.identity.models import User


def utc_now() -> datetime:
    return datetime.now(UTC)


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    event_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False
    )
    amount_pesewas: Mapped[int] = mapped_column(Integer, nullable=False)
    court_fee_pesewas: Mapped[int] = mapped_column(Integer, nullable=False)
    platform_fee_pesewas: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="GHS", nullable=False)
    method: Mapped[str] = mapped_column(
        String(32), nullable=False
    )  # MANUAL_MOMO, CASH, PAYSTACK
    status: Mapped[str] = mapped_column(
        String(32), default="PENDING", nullable=False
    )  # PENDING, PAID, CANCELLED, EXPIRED, REFUNDED
    reference: Mapped[str] = mapped_column(
        String(120), unique=True, index=True, nullable=False
    )
    paystack_reference: Mapped[str | None] = mapped_column(
        String(120), nullable=True, index=True
    )
    paystack_authorization_url: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    paid_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    user: Mapped["User"] = relationship("User")
    event: Mapped["Event"] = relationship("Event")
    registrations: Mapped[list["Registration"]] = relationship(
        "Registration", back_populates="order"
    )


class Credit(Base):
    __tablename__ = "credits"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    amount_pesewas: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(String(120), nullable=False)
    source_registration_id: Mapped[str | None] = mapped_column(
        String(36), nullable=True
    )
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    user: Mapped["User"] = relationship("User")
