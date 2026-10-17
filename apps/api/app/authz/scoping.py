"""Venue scoping helpers and model classification for multi-tenant isolation."""

from typing import Any, TypeVar

from sqlalchemy import Select
from sqlalchemy.orm import DeclarativeBase

from app.authz.policy import Principal
from app.events.models import Event
from app.venues.models import (
    Court,
    OpenMatch,
    Venue,
    VenueDraft,
    VenueInvite,
    VenueMembership,
    VenuePhoto,
)

T = TypeVar("T", bound=DeclarativeBase)

# Registry of models owned by a venue
VENUE_OWNED_MODELS: tuple[type[DeclarativeBase], ...] = (
    Venue,
    Court,
    VenueMembership,
    VenueInvite,
    VenueDraft,
    VenuePhoto,
    OpenMatch,
    Event,
)


def visible_venue_ids(principal: Principal) -> set[str] | None:
    """Return set of venue IDs visible to the principal, or None if unrestricted (Super Admin)."""
    if principal.platform_role in ("SUPER_ADMIN", "ADMIN"):
        return None
    return set(principal.memberships.keys())


def scope_to_venue(
    query: Select[Any],
    model: type[DeclarativeBase],
    venue_id: str | None,
) -> Select[Any]:
    """Apply venue filter to an existing SQLAlchemy Select query.

    If venue_id is provided, filters directly.
    If model is Venue, filters on model.id.
    If model has venue_id attribute, filters on model.venue_id.
    """
    if venue_id is None:
        return query

    if issubclass(model, Venue):
        return query.where(Venue.id == venue_id)

    if hasattr(model, "venue_id"):
        return query.where(model.venue_id == venue_id)

    return query
