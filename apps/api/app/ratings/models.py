"""SQLAlchemy models for immutable rating events."""

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

if TYPE_CHECKING:
    from app.identity.models import User


def utc_now() -> datetime:
    return datetime.now(UTC)


class RatingEvent(Base):
    """Immutable record of every rating change. Ratings never change in place."""

    __tablename__ = "rating_events"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    match_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    rating_before: Mapped[float] = mapped_column(Float, nullable=False)
    rating_after: Mapped[float] = mapped_column(Float, nullable=False)
    delta: Mapped[float] = mapped_column(Float, nullable=False)
    k_factor: Mapped[float] = mapped_column(Float, nullable=False)
    explanation: Mapped[str] = mapped_column(String(255), nullable=False)
    requires_review: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, index=True, nullable=False
    )

    user: Mapped["User"] = relationship("User")
