"""SQLAlchemy models for Venues, Courts, Price Bands, and Open Matches."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def utc_now() -> datetime:
    return datetime.now(UTC)


class Venue(Base):
    __tablename__ = "venues"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    address: Mapped[str] = mapped_column(String(255), nullable=False)
    ghanapost_gps: Mapped[str] = mapped_column(String(32), default="", nullable=False)
    maps_url: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    booking_phone: Mapped[str] = mapped_column(String(32), default="", nullable=False)
    booking_whatsapp: Mapped[str] = mapped_column(
        String(255), default="", nullable=False
    )
    booking_url: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    base_rate_pesewas_per_hour: Mapped[int] = mapped_column(
        Integer, default=18000, nullable=False
    )
    indoor_courts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    outdoor_courts: Mapped[int] = mapped_column(Integer, default=2, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    courts: Mapped[list["Court"]] = relationship(
        "Court", back_populates="venue", cascade="all, delete-orphan"
    )
    open_matches: Mapped[list["OpenMatch"]] = relationship(
        "OpenMatch", back_populates="venue", cascade="all, delete-orphan"
    )


class Court(Base):
    __tablename__ = "courts"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    venue_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("venues.id", ondelete="CASCADE"), nullable=False
    )
    court_number: Mapped[int] = mapped_column(Integer, nullable=False)
    is_indoor: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    surface: Mapped[str] = mapped_column(String(64), default="Turf", nullable=False)
    notes: Mapped[str] = mapped_column(String(255), default="", nullable=False)

    venue: Mapped["Venue"] = relationship("Venue", back_populates="courts")


class OpenMatch(Base):
    __tablename__ = "open_matches"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    venue_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("venues.id", ondelete="CASCADE"), nullable=False
    )
    court_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    host_name: Mapped[str] = mapped_column(String(120), nullable=False)
    host_phone: Mapped[str] = mapped_column(String(32), nullable=False)
    level_band: Mapped[str] = mapped_column(
        String(64), default="3.0 – 4.0", nullable=False
    )
    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    court_cost_pesewas: Mapped[int] = mapped_column(Integer, nullable=False)
    platform_fee_pesewas: Mapped[int] = mapped_column(Integer, nullable=False)
    price_per_player_pesewas: Mapped[int] = mapped_column(Integer, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, default=4, nullable=False)
    open_seats: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    underfilled_policy: Mapped[str] = mapped_column(
        String(32), default="CANCEL_REFUND", nullable=False
    )
    status: Mapped[str] = mapped_column(String(32), default="OPEN", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    venue: Mapped["Venue"] = relationship("Venue", back_populates="open_matches")
    participants: Mapped[list["OpenMatchParticipant"]] = relationship(
        "OpenMatchParticipant",
        back_populates="open_match",
        cascade="all, delete-orphan",
    )


class OpenMatchParticipant(Base):
    __tablename__ = "open_match_participants"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    open_match_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("open_matches.id", ondelete="CASCADE"), nullable=False
    )
    player_name: Mapped[str] = mapped_column(String(120), nullable=False)
    player_phone: Mapped[str] = mapped_column(String(32), nullable=False)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    open_match: Mapped["OpenMatch"] = relationship(
        "OpenMatch", back_populates="participants"
    )
