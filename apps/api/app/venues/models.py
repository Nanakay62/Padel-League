"""SQLAlchemy models for Venues, Courts, Price Bands, and Open Matches."""

import hashlib
import json
import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    event,
    inspect,
)
from sqlalchemy.orm import Mapped, Session, mapped_column, relationship

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

    # Pricing & Hours: No invented prices! base_rate is nullable (unpriced until set)
    base_rate_pesewas_per_hour: Mapped[int | None] = mapped_column(
        Integer, default=None, nullable=True
    )
    indoor_courts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    outdoor_courts: Mapped[int] = mapped_column(Integer, default=2, nullable=False)

    # Rich Club Profile Content
    description: Mapped[str] = mapped_column(String(1000), default="", nullable=False)
    photos: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON, default=list, nullable=False
    )
    amenities: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    opening_hours: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON, default=list, nullable=False
    )

    # Dynamic Pricing Engine Config
    price_bands: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON, default=list, nullable=False
    )
    # Duration multipliers in basis points (10000 = 1.0x / 100%) applied on top of pro-rata pricing
    duration_multipliers_bps: Mapped[dict[str, int]] = mapped_column(
        JSON,
        default=lambda: {"60": 10000, "90": 10000, "120": 10000},
        nullable=False,
    )
    add_ons_config: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON, default=list, nullable=False
    )

    # Cache invalidation & stale quote detection
    price_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    price_hash: Mapped[str] = mapped_column(String(64), default="", nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
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
    # Lighting defaults to empty string ("Ask the club" in UI), never an invented default
    lighting: Mapped[str] = mapped_column(String(64), default="", nullable=False)
    photos: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON, default=list, nullable=False
    )
    notes: Mapped[str] = mapped_column(String(255), default="", nullable=False)

    # Optional court-level pricing overrides
    base_rate_pesewas_per_hour: Mapped[int | None] = mapped_column(
        Integer, default=None, nullable=True
    )
    price_bands: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON, default=list, nullable=False
    )
    duration_multipliers_bps: Mapped[dict[str, int] | None] = mapped_column(
        JSON, default=None, nullable=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    venue: Mapped["Venue"] = relationship("Venue", back_populates="courts")


def compute_venue_price_hash(venue: Venue) -> str:
    """Computes a deterministic SHA256 hash of all price-affecting configuration.

    Includes venue base rate, venue price bands, duration multipliers, add-ons config,
    and all associated courts' pricing overrides (base rate, bands, multipliers).
    """
    courts_data: list[dict[str, Any]] = []
    if hasattr(venue, "courts") and venue.courts:
        for c in sorted(venue.courts, key=lambda x: str(x.id)):
            courts_data.append(
                {
                    "court_id": c.id,
                    "court_number": c.court_number,
                    "base_rate": c.base_rate_pesewas_per_hour,
                    "bands": c.price_bands or [],
                    "multipliers": c.duration_multipliers_bps,
                }
            )
    payload = {
        "venue_id": venue.id,
        "base_rate": venue.base_rate_pesewas_per_hour,
        "price_bands": venue.price_bands or [],
        "duration_multipliers": venue.duration_multipliers_bps,
        "add_ons_config": venue.add_ons_config or [],
        "courts": courts_data,
    }
    canonical = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


VENUE_PRICE_ATTRS = {
    "base_rate_pesewas_per_hour",
    "price_bands",
    "duration_multipliers_bps",
    "add_ons_config",
}
COURT_PRICE_ATTRS = {
    "base_rate_pesewas_per_hour",
    "price_bands",
    "duration_multipliers_bps",
}


@event.listens_for(Session, "before_flush")
def on_session_before_flush_bump_price_version(
    session: Session, flush_context: Any, instances: Any
) -> None:
    """Session before_flush hook to bump venue price_version and recalculate price_hash.

    IMPORTANT ARCHITECTURAL NOTICE:
    Bulk UPDATEs (e.g. `update(Venue)...`), raw SQL statements (`conn.execute(...)`),
    and Alembic/database migrations bypass this ORM session hook entirely.
    Consequently, checkout correctness and monetary integrity do NOT rely solely on
    `price_version` integers. The checkout verification endpoint always recomputes
    the full quote from the active pricing state, returning HTTP 409 Conflict if
    the price has changed, regardless of the version counter.

    This hook detects changes to Venue pricing and Court price overrides (including
    new courts, deleted courts, or modified court rates), bumps `venue.price_version += 1`,
    updates `venue.updated_at`, and generates a deterministic `price_hash`.
    """
    venues_to_bump: set[Venue] = set()

    for obj in session.new | session.dirty:
        if isinstance(obj, Venue):
            insp = inspect(obj)
            if insp is not None:
                if any(
                    attr in insp.attrs and insp.attrs[attr].history.has_changes()
                    for attr in VENUE_PRICE_ATTRS
                ):
                    venues_to_bump.add(obj)
                elif not obj.price_hash:
                    # New venue initialization
                    obj.price_hash = compute_venue_price_hash(obj)
        elif isinstance(obj, Court):
            insp = inspect(obj)
            if insp is not None and (
                obj in session.new
                or any(
                    attr in insp.attrs and insp.attrs[attr].history.has_changes()
                    for attr in COURT_PRICE_ATTRS
                )
            ):
                if obj.venue is not None:
                    venues_to_bump.add(obj.venue)
                elif obj.venue_id:
                    venue = session.get(Venue, obj.venue_id)
                    if venue:
                        venues_to_bump.add(venue)

    for obj in session.deleted:
        if isinstance(obj, Court):
            if obj.venue is not None:
                venues_to_bump.add(obj.venue)
            elif obj.venue_id:
                venue = session.get(Venue, obj.venue_id)
                if venue:
                    venues_to_bump.add(venue)

    for venue in venues_to_bump:
        venue.price_version = (venue.price_version or 1) + 1
        venue.updated_at = utc_now()
        venue.price_hash = compute_venue_price_hash(venue)


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
