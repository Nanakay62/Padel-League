"""Tests for multi-tenant data isolation and venue scoping."""

from sqlalchemy import select

from app.authz.policy import (
    Action,
    ClubRole,
    DecisionKind,
    Principal,
    ResourceRef,
    decide,
)
from app.authz.scoping import VENUE_OWNED_MODELS, scope_to_venue, visible_venue_ids
from app.events.models import Event
from app.venues.models import (
    Court,
    Venue,
)


def test_venue_owned_models_registry() -> None:
    """Invariant: Every model registered in VENUE_OWNED_MODELS has a venue association."""
    assert len(VENUE_OWNED_MODELS) >= 8

    for model in VENUE_OWNED_MODELS:
        if model is Venue:
            assert hasattr(model, "id")
        else:
            assert hasattr(model, "venue_id"), (
                f"Model {model.__name__} in VENUE_OWNED_MODELS lacks venue_id attribute"
            )


def test_scope_to_venue_filtering() -> None:
    """Test SQL query filtering logic across different venue-owned models."""
    # 1. Scoping Venue by id
    q_venue = scope_to_venue(select(Venue), Venue, "v-123")
    compiled_venue = str(q_venue)
    assert "venues.id = :id_1" in compiled_venue

    # 2. Scoping Court by venue_id
    q_court = scope_to_venue(select(Court), Court, "v-123")
    compiled_court = str(q_court)
    assert "courts.venue_id = :venue_id_1" in compiled_court

    # 3. Scoping Event by venue_id
    q_event = scope_to_venue(select(Event), Event, "v-123")
    compiled_event = str(q_event)
    assert "events.venue_id = :venue_id_1" in compiled_event

    # 4. Scoping with None does not add where clause
    q_unscoped = scope_to_venue(select(Venue), Venue, None)
    assert "WHERE" not in str(q_unscoped)


def test_visible_venue_ids() -> None:
    """Test visible venue set calculation for club staff vs super admin."""
    # Super Admin has unrestricted access (None)
    super_admin = Principal(
        user_id="sa-1",
        platform_role="SUPER_ADMIN",
        mfa_verified=True,
        memberships={"v1": ClubRole.CLUB_OWNER},
    )
    assert visible_venue_ids(super_admin) is None

    # Club Owner is strictly restricted to their own venue(s)
    club_owner = Principal(
        user_id="co-1",
        platform_role="PLAYER",
        mfa_verified=True,
        memberships={"v1": ClubRole.CLUB_OWNER},
    )
    assert visible_venue_ids(club_owner) == {"v1"}


def test_cross_tenant_access_returns_not_found() -> None:
    """Attempting to access another club's venue returns DENY_NOT_FOUND (not 403) to avoid leaking existence."""
    owner_a = Principal(
        user_id="co-a",
        platform_role="PLAYER",
        mfa_verified=True,
        memberships={"venue-a": ClubRole.CLUB_OWNER},
    )

    # Accessing Venue B
    decision = decide(
        owner_a,
        Action.VENUE_ADMIN_READ,
        ResourceRef(venue_id="venue-b"),
    )
    assert decision.kind == DecisionKind.DENY_NOT_FOUND
    assert decision.is_step_in is False


def test_super_admin_step_in_flag() -> None:
    """Super Admin accessing a venue triggers ALLOW_STEP_IN with step_in=True."""
    super_admin = Principal(
        user_id="sa-1",
        platform_role="SUPER_ADMIN",
        mfa_verified=True,
        memberships={},
    )

    decision = decide(
        super_admin,
        Action.VENUE_PROFILE_EDIT,
        ResourceRef(venue_id="venue-target"),
    )
    assert decision.kind == DecisionKind.ALLOW_STEP_IN
    assert decision.is_step_in is True
