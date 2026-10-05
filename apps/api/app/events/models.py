"""SQLAlchemy models for events, players, rounds, and matches."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def utc_now() -> datetime:
    return datetime.now(UTC)


class Event(Base):
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    venue_name: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    format: Mapped[str] = mapped_column(String(32), nullable=False, default="AMERICANO")
    courts: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    point_target: Mapped[int] = mapped_column(Integer, nullable=False, default=24)
    planned_rounds: Mapped[int] = mapped_column(Integer, nullable=False, default=8)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="DRAFT")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    players: Mapped[list["EventPlayer"]] = relationship(
        "EventPlayer", back_populates="event", cascade="all, delete-orphan"
    )
    rounds: Mapped[list["EventRound"]] = relationship(
        "EventRound", back_populates="event", cascade="all, delete-orphan"
    )


class EventPlayer(Base):
    __tablename__ = "event_players"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    event: Mapped["Event"] = relationship("Event", back_populates="players")


class EventRound(Base):
    __tablename__ = "event_rounds"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False
    )
    round_number: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="IN_PROGRESS"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    event: Mapped["Event"] = relationship("Event", back_populates="rounds")
    matches: Mapped[list["EventMatch"]] = relationship(
        "EventMatch", back_populates="round", cascade="all, delete-orphan"
    )


class EventMatch(Base):
    __tablename__ = "event_matches"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    round_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("event_rounds.id", ondelete="CASCADE"), nullable=False
    )
    court_number: Mapped[int] = mapped_column(Integer, nullable=False)
    team_a_p1: Mapped[str] = mapped_column(String(120), nullable=False)
    team_a_p2: Mapped[str] = mapped_column(String(120), nullable=False)
    team_b_p1: Mapped[str] = mapped_column(String(120), nullable=False)
    team_b_p2: Mapped[str] = mapped_column(String(120), nullable=False)

    team_a_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    team_b_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    result_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    entered_by: Mapped[str | None] = mapped_column(String(120), nullable=True)
    entered_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="SCHEDULED")

    round: Mapped["EventRound"] = relationship("EventRound", back_populates="matches")
