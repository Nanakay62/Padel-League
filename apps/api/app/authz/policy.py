"""Pure domain authorization policy (Role + Venue + Ownership).

This module contains zero FastAPI or SQLAlchemy dependencies and can be evaluated
purely in memory for fast, deterministic unit testing.
"""

from collections.abc import Mapping
from dataclasses import dataclass
from enum import StrEnum, auto


class Action(StrEnum):
    # Venue Back-Office Actions
    VENUE_ADMIN_READ = auto()
    VENUE_PROFILE_EDIT = auto()
    COURT_EDIT = auto()
    PRICE_EDIT = auto()
    PHOTO_EDIT = auto()
    HOURS_EDIT = auto()
    STAFF_MANAGE = auto()
    AUDIT_READ = auto()
    AUDIT_REVERT = auto()

    # Event Actions
    EVENT_CREATE_AT_VENUE = auto()
    EVENT_MANAGE = auto()
    EVENT_FINANCE_READ = auto()

    # Platform Actions (Super Admin Only)
    PLATFORM_VENUE_CREATE = auto()
    PLATFORM_OWNER_INVITE = auto()
    MODERATION_MANAGE = auto()
    SETTINGS_MANAGE = auto()


class ClubRole(StrEnum):
    CLUB_OWNER = "CLUB_OWNER"
    CLUB_ADMIN = "CLUB_ADMIN"


class DecisionKind(StrEnum):
    ALLOW = "ALLOW"
    ALLOW_STEP_IN = "ALLOW_STEP_IN"
    DENY_NOT_FOUND = "DENY_NOT_FOUND"
    DENY_FORBIDDEN = "DENY_FORBIDDEN"
    DENY_MFA_REQUIRED = "DENY_MFA_REQUIRED"


@dataclass(frozen=True)
class Decision:
    kind: DecisionKind
    is_step_in: bool = False
    reason: str = ""


@dataclass(frozen=True)
class Principal:
    user_id: str
    platform_role: str  # PLAYER, ORGANISER, SUPER_ADMIN
    mfa_verified: bool
    memberships: Mapping[
        str, ClubRole
    ]  # venue_id -> ClubRole (only active memberships)


@dataclass(frozen=True)
class ResourceRef:
    venue_id: str | None = None
    owner_id: str | None = None


def decide(principal: Principal, action: Action, resource: ResourceRef) -> Decision:
    """Evaluate whether principal is authorized to perform action on resource."""
    is_super_admin = principal.platform_role in ("SUPER_ADMIN", "ADMIN")

    # 1. Platform-Only Actions
    if action in (
        Action.PLATFORM_VENUE_CREATE,
        Action.PLATFORM_OWNER_INVITE,
        Action.MODERATION_MANAGE,
        Action.SETTINGS_MANAGE,
    ):
        if not is_super_admin:
            return Decision(
                DecisionKind.DENY_FORBIDDEN, reason="Super Admin privileges required"
            )
        if not principal.mfa_verified:
            return Decision(
                DecisionKind.DENY_MFA_REQUIRED, reason="MFA verification required"
            )
        return Decision(DecisionKind.ALLOW)

    # 2. Super Admin Step-In on Any Venue
    if is_super_admin:
        if not principal.mfa_verified:
            return Decision(
                DecisionKind.DENY_MFA_REQUIRED, reason="MFA verification required"
            )
        # If super admin is explicitly an owner/admin of this venue, it is a regular allow
        if resource.venue_id and resource.venue_id in principal.memberships:
            return Decision(DecisionKind.ALLOW, is_step_in=False)
        return Decision(
            DecisionKind.ALLOW_STEP_IN, is_step_in=True, reason="Platform staff step-in"
        )

    # 3. Event Management Actions (Event Owner OR Venue Staff)
    if action in (Action.EVENT_MANAGE, Action.EVENT_FINANCE_READ):
        # A. Event Owner has rights regardless of venue
        if resource.owner_id and resource.owner_id == principal.user_id:
            return Decision(DecisionKind.ALLOW)

        # B. Venue Staff can manage events hosted at their venue
        if resource.venue_id and resource.venue_id in principal.memberships:
            if not principal.mfa_verified:
                return Decision(
                    DecisionKind.DENY_MFA_REQUIRED, reason="MFA verification required"
                )
            return Decision(DecisionKind.ALLOW)

        # C. If principal has no relation to the venue
        if resource.venue_id and resource.venue_id not in principal.memberships:
            # If they are just another organiser, deny forbidden
            if principal.platform_role in ("ORGANISER", "ORGANIZER"):
                return Decision(
                    DecisionKind.DENY_FORBIDDEN, reason="Not the event owner"
                )
            return Decision(DecisionKind.DENY_NOT_FOUND, reason="Venue not accessible")

        return Decision(
            DecisionKind.DENY_FORBIDDEN, reason="Not permitted on this event"
        )

    # 4. Venue-Scoped Back-Office Actions
    if not resource.venue_id:
        return Decision(
            DecisionKind.DENY_NOT_FOUND, reason="Resource has no associated venue"
        )

    # Check venue membership
    user_club_role = principal.memberships.get(resource.venue_id)
    if not user_club_role:
        # User has no membership at this venue -> 404 Not Found to prevent leaking venue IDs
        return Decision(
            DecisionKind.DENY_NOT_FOUND, reason="Venue not found or not a member"
        )

    # MFA is required for all club administrative actions
    if not principal.mfa_verified:
        return Decision(
            DecisionKind.DENY_MFA_REQUIRED, reason="MFA verification required"
        )

    # Staff Management (Inviting, promoting, removing staff) is CLUB_OWNER only
    if action == Action.STAFF_MANAGE:
        if user_club_role != ClubRole.CLUB_OWNER:
            return Decision(
                DecisionKind.DENY_FORBIDDEN, reason="Only Club Owners can manage staff"
            )
        return Decision(DecisionKind.ALLOW)

    # All other venue management actions are permitted for CLUB_OWNER and CLUB_ADMIN
    return Decision(DecisionKind.ALLOW)
