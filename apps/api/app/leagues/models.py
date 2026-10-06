"""SQLAlchemy models for leagues, divisions/boxes, and pairs."""

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

if TYPE_CHECKING:
    from app.events.models import EventMatch
    from app.identity.models import User


def utc_now() -> datetime:
    return datetime.now(UTC)


class League(Base):
    __tablename__ = "leagues"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    season_name: Mapped[str] = mapped_column(
        String(64), nullable=False, default="Season 1"
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="ACTIVE")
    promote_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    relegate_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    cycle_weeks: Mapped[int] = mapped_column(Integer, nullable=False, default=4)
    substitute_policy: Mapped[str] = mapped_column(
        String(255), nullable=False, default="MAX_1_RATING_LE_REPLACED"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    boxes: Mapped[list["LeagueBox"]] = relationship(
        "LeagueBox", back_populates="league", cascade="all, delete-orphan"
    )
    matches: Mapped[list["EventMatch"]] = relationship(
        "EventMatch", back_populates="league"
    )


class LeagueBox(Base):
    __tablename__ = "league_boxes"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    league_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("leagues.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    box_number: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    min_rating: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    max_rating: Mapped[float] = mapped_column(Float, nullable=False, default=7.0)
    cycle_deadline: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    league: Mapped["League"] = relationship("League", back_populates="boxes")
    pairs: Mapped[list["LeaguePair"]] = relationship(
        "LeaguePair", back_populates="box", cascade="all, delete-orphan"
    )
    matches: Mapped[list["EventMatch"]] = relationship(
        "EventMatch", back_populates="box"
    )


class LeaguePair(Base):
    __tablename__ = "league_pairs"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    box_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("league_boxes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    player1_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    player2_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    pair_name: Mapped[str] = mapped_column(String(120), nullable=False)
    combined_rating: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="ACTIVE")
    substitutes_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    box: Mapped["LeagueBox"] = relationship("LeagueBox", back_populates="pairs")
    player1: Mapped["User"] = relationship("User", foreign_keys=[player1_id])
    player2: Mapped["User"] = relationship("User", foreign_keys=[player2_id])
