"""FastAPI dependencies for authorization and principal resolution."""

import hashlib
from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Annotated, Any

import jwt
from fastapi import Cookie, Depends, Header, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.authz.policy import (
    Action,
    ClubRole,
    Decision,
    DecisionKind,
    Principal,
    ResourceRef,
    decide,
)
from app.config import settings
from app.db import get_db
from app.identity.models import User, UserSession
from app.venues.models import VenueMembership


def _utc_now() -> datetime:
    return datetime.now(UTC)


@dataclass(frozen=True)
class ClubContext:
    principal: Principal
    venue_id: str
    decision: Decision


async def get_principal(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    authorization: Annotated[str | None, Header()] = None,
    padel_club_session: Annotated[str | None, Cookie()] = None,
    padel_admin_session: Annotated[str | None, Cookie()] = None,
    padel_session: Annotated[str | None, Cookie()] = None,
) -> Principal:
    """Resolve authenticated Principal with platform role, MFA state, and venue memberships."""
    user_id: str | None = None
    mfa_verified: bool = False
    platform_role: str = "PLAYER"
    is_bearer: bool = False

    # 1. Check Bearer Authorization header
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            payload = jwt.decode(
                token, settings.secret_key, algorithms=[settings.jwt_algorithm]
            )
            token_type = payload.get("type")
            if token_type is not None and token_type != "access":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type",
                )
            if request.url.path.startswith("/portal/"):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Bearer tokens cannot access portal endpoints",
                )
            user_id = payload.get("sub")
            is_bearer = True
        except jwt.PyJWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token validation error: {e}",
            ) from e

    # 2. Check portal session cookies if no Bearer token
    if not user_id:
        path = request.url.path
        portal_header = request.headers.get("x-portal-host", "").upper()

        if path.startswith("/portal/admin") or portal_header == "ADMIN":
            cookie_val = padel_admin_session
            required_host = "ADMIN"
        else:
            cookie_val = padel_club_session or padel_admin_session or padel_session
            required_host = None

        if cookie_val:
            token_hash = hashlib.sha256(cookie_val.encode("utf-8")).hexdigest()
            stmt = select(UserSession).where(
                UserSession.session_token_hash == token_hash,
                UserSession.expires_at > _utc_now(),
                UserSession.revoked_at.is_(None),
            )
            if required_host:
                stmt = stmt.where(UserSession.host_type == required_host)
            result = await db.execute(stmt)
            session = result.scalars().first()
            if session:
                user_id = session.user_id
                mfa_verified = (
                    True  # Portal sessions are only issued after successful MFA
                )
                session.last_seen_at = _utc_now()

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    # 3. Load user & memberships
    user = await db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    # For Bearer mobile tokens: always restricted to PLAYER role without venue memberships
    if is_bearer:
        return Principal(
            user_id=user.id,
            platform_role="PLAYER",
            mfa_verified=False,
            memberships={},
        )

    # For Portal cookie sessions: fresh role directly from user table
    platform_role = user.role

    # Query active venue memberships
    stmt_mem = select(VenueMembership).where(
        VenueMembership.user_id == user_id,
        VenueMembership.status == "ACTIVE",
    )
    res_mem = await db.execute(stmt_mem)
    memberships_list = res_mem.scalars().all()

    memberships: dict[str, ClubRole] = {}
    for m in memberships_list:
        try:
            memberships[m.venue_id] = ClubRole(m.role)
        except ValueError:
            pass

    return Principal(
        user_id=user.id,
        platform_role=platform_role,
        mfa_verified=mfa_verified,
        memberships=memberships,
    )


def require_authz(
    action: Action,
    resource_extractor: Callable[[Request], ResourceRef | None] | None = None,
) -> Callable[..., Any]:
    """Dependency factory checking that the current principal is authorized for an action."""

    async def _dependency(
        request: Request,
        principal: Annotated[Principal, Depends(get_principal)],
    ) -> Decision:
        resource = resource_extractor(request) if resource_extractor else ResourceRef()
        if resource is None:
            resource = ResourceRef()

        decision = decide(principal, action, resource)

        if decision.kind in (DecisionKind.ALLOW, DecisionKind.ALLOW_STEP_IN):
            # Store on request state so downstream handlers know if this is a step-in
            request.state.authz_decision = decision
            request.state.is_step_in = decision.is_step_in
            return decision

        if decision.kind == DecisionKind.DENY_NOT_FOUND:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=decision.reason or "Resource not found",
            )
        if decision.kind == DecisionKind.DENY_MFA_REQUIRED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "MFA_REQUIRED",
                    "message": "Two-factor authentication required for this action",
                },
            )
        # Default DENY_FORBIDDEN
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=decision.reason or "Access denied",
        )

    return _dependency


def club_context(action: Action) -> Callable[..., Any]:
    """Central dependency for all club back-office routes: resolves venue, checks authz, enforces MFA."""

    async def _dependency(
        request: Request,
        principal: Annotated[Principal, Depends(get_principal)],
        x_venue_id: Annotated[str | None, Header()] = None,
        venue_id: Annotated[str | None, Query()] = None,
    ) -> ClubContext:
        requested_id = x_venue_id or venue_id
        is_super_admin = principal.platform_role in ("SUPER_ADMIN", "ADMIN")

        if requested_id:
            if requested_id in principal.memberships or is_super_admin:
                active_venue_id = requested_id
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Venue not found or access denied",
                )
        else:
            if len(principal.memberships) == 1:
                active_venue_id = next(iter(principal.memberships.keys()))
            elif len(principal.memberships) > 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Multiple venue memberships found. X-Venue-Id header or venue_id query parameter is required.",
                )
            elif is_super_admin:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Venue ID required for super admin step-in",
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No club venue associated with this user",
                )

        decision = decide(principal, action, ResourceRef(venue_id=active_venue_id))

        if decision.kind in (DecisionKind.ALLOW, DecisionKind.ALLOW_STEP_IN):
            request.state.authz_decision = decision
            request.state.is_step_in = decision.is_step_in
            return ClubContext(
                principal=principal,
                venue_id=active_venue_id,
                decision=decision,
            )

        if decision.kind == DecisionKind.DENY_NOT_FOUND:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=decision.reason or "Venue not found",
            )
        if decision.kind == DecisionKind.DENY_MFA_REQUIRED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "MFA_REQUIRED",
                    "message": "Two-factor authentication required for this action",
                },
            )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=decision.reason or "Access denied",
        )

    return _dependency
