"""Unit tests for pure domain authorization policy (Role + Venue + Ownership)."""

from app.authz.policy import (
    Action,
    ClubRole,
    DecisionKind,
    Principal,
    ResourceRef,
    decide,
)


def test_club_owner_has_full_venue_permissions() -> None:
    """Club Owner has rights on own venue, including STAFF_MANAGE and AUDIT_REVERT."""
    owner = Principal(
        user_id="user-owner-1",
        platform_role="PLAYER",
        mfa_verified=True,
        memberships={"venue-1": ClubRole.CLUB_OWNER},
    )
    venue_res = ResourceRef(venue_id="venue-1")

    # Allowed actions
    allowed_actions = [
        Action.VENUE_ADMIN_READ,
        Action.VENUE_PROFILE_EDIT,
        Action.COURT_EDIT,
        Action.PRICE_EDIT,
        Action.PHOTO_EDIT,
        Action.HOURS_EDIT,
        Action.STAFF_MANAGE,
        Action.AUDIT_READ,
        Action.AUDIT_REVERT,
    ]
    for action in allowed_actions:
        decision = decide(owner, action, venue_res)
        assert decision.kind == DecisionKind.ALLOW, f"Failed on {action}"


def test_club_admin_cannot_manage_staff() -> None:
    """Club Admin has venue rights except STAFF_MANAGE."""
    admin = Principal(
        user_id="user-admin-1",
        platform_role="PLAYER",
        mfa_verified=True,
        memberships={"venue-1": ClubRole.CLUB_ADMIN},
    )
    venue_res = ResourceRef(venue_id="venue-1")

    # Allowed on venue profile and pricing
    assert (
        decide(admin, Action.VENUE_PROFILE_EDIT, venue_res).kind == DecisionKind.ALLOW
    )
    assert decide(admin, Action.PRICE_EDIT, venue_res).kind == DecisionKind.ALLOW

    # FORBIDDEN on staff management
    decision_staff = decide(admin, Action.STAFF_MANAGE, venue_res)
    assert decision_staff.kind == DecisionKind.DENY_FORBIDDEN


def test_cross_venue_access_is_not_found() -> None:
    """Club Owner of Venue 1 attempting action on Venue 2 gets DENY_NOT_FOUND to prevent ID probing."""
    owner_1 = Principal(
        user_id="user-owner-1",
        platform_role="PLAYER",
        mfa_verified=True,
        memberships={"venue-1": ClubRole.CLUB_OWNER},
    )
    venue_2_res = ResourceRef(venue_id="venue-2")

    decision = decide(owner_1, Action.VENUE_ADMIN_READ, venue_2_res)
    assert decision.kind == DecisionKind.DENY_NOT_FOUND


def test_super_admin_step_in_on_any_venue() -> None:
    """Super Admin can act on any venue as ALLOW_STEP_IN when not a member."""
    super_admin = Principal(
        user_id="sa-1",
        platform_role="SUPER_ADMIN",
        mfa_verified=True,
        memberships={},
    )
    venue_res = ResourceRef(venue_id="venue-random")

    decision = decide(super_admin, Action.VENUE_PROFILE_EDIT, venue_res)
    assert decision.kind == DecisionKind.ALLOW_STEP_IN
    assert decision.is_step_in is True


def test_organiser_rights_follow_event_ownership() -> None:
    """Event owner can manage event across any venue, but foreign organiser cannot."""
    organiser = Principal(
        user_id="org-1",
        platform_role="ORGANISER",
        mfa_verified=False,
        memberships={},
    )
    own_event = ResourceRef(venue_id="venue-any", owner_id="org-1")
    foreign_event = ResourceRef(venue_id="venue-any", owner_id="org-other")

    # Can manage own event
    assert decide(organiser, Action.EVENT_MANAGE, own_event).kind == DecisionKind.ALLOW

    # Cannot manage foreign event
    assert (
        decide(organiser, Action.EVENT_MANAGE, foreign_event).kind
        == DecisionKind.DENY_FORBIDDEN
    )


def test_club_role_can_manage_events_at_their_venue() -> None:
    """Club Admin can manage events hosted at their venue even if created by another organiser."""
    club_admin = Principal(
        user_id="club-admin-1",
        platform_role="PLAYER",
        mfa_verified=True,
        memberships={"venue-1": ClubRole.CLUB_ADMIN},
    )
    hosted_event = ResourceRef(venue_id="venue-1", owner_id="external-org")
    unhosted_event = ResourceRef(venue_id="venue-2", owner_id="external-org")

    assert (
        decide(club_admin, Action.EVENT_MANAGE, hosted_event).kind == DecisionKind.ALLOW
    )
    assert (
        decide(club_admin, Action.EVENT_MANAGE, unhosted_event).kind
        == DecisionKind.DENY_NOT_FOUND
    )


def test_back_office_requires_mfa() -> None:
    """Accessing club management without MFA is denied with DENY_MFA_REQUIRED."""
    no_mfa_owner = Principal(
        user_id="owner-no-mfa",
        platform_role="PLAYER",
        mfa_verified=False,
        memberships={"venue-1": ClubRole.CLUB_OWNER},
    )
    venue_res = ResourceRef(venue_id="venue-1")

    decision = decide(no_mfa_owner, Action.VENUE_PROFILE_EDIT, venue_res)
    assert decision.kind == DecisionKind.DENY_MFA_REQUIRED
