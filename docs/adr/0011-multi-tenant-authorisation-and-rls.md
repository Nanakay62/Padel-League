# ADR 0011: Multi-Tenant Authorization and Scoping

## Status
Accepted

## Context
Padel Ghana provides club back-office management for distinct venues across Ghana alongside platform-level administration. Clubs must operate with strict data isolation: a club user must only ever see and modify their own venue's data (profile, courts, pricing, staff, photos, activity). Super administrators operate at the platform level and may step into club venues to assist with onboarding or troubleshooting, but every step-in action must be visibly attributed, logged, and audited.

## Decision
1. **Venue Membership Table:** Multi-tenancy is modeled via `VenueMembership` (`user_id`, `venue_id`, `role`, `is_active`) supporting roles `CLUB_OWNER` and `CLUB_ADMIN`. The user table does not contain a single `venue_id` column, allowing validation for at most one venue at launch while supporting multi-venue memberships in the future.
2. **Centralized Pure Authorization Policy:** All permission logic lives in `app/authz/policy.py` as pure functions evaluating `(Principal, Action, ResourceRef) -> Decision`, decoupled from database frameworks.
3. **Venue-Scoped Query Helpers:** All database queries for venue-owned resources use centralized scoping helpers in `app/authz/scoping.py`. Cross-tenant queries return 404 (Not Found) rather than 403 (Forbidden) to prevent resource enumeration.
4. **Step-In Accountability:** Super administrator actions on club resources require explicit logging where `is_step_in=True` and `actor_kind="SUPER_ADMIN"`. The UI displays *"Updated by Padel Ghana staff"*, and an alert email is dispatched to the club owner.
5. **Optimistic Concurrency & Audit Integrity:** Venue profile and pricing updates enforce optimistic concurrency checks (`expected_updated_at` and `expected_price_version`), returning HTTP 409 Conflict upon mid-air collision. Audit logs validate target IDs against the active venue partition, staff deletions are soft-deleted (`status="REMOVED"`), and emails apply `html.escape`.
6. **Pricing Hash Invariance & Upload Streaming:** Venue pricing hashes recompute deterministically in the SQLAlchemy `before_flush` lifecycle (including pending courts with pre-generated UUIDs and excluding session-deleted courts). Photo uploads stream in 64 KB chunks capped at 5 MB with binary magic-byte inspection in pure domain logic (`app/domain/photos.py`).

## Consequences
- Zero tenant data leakage across clubs.
- Pure authorization functions are unit-testable without database mocking.
- Club owners retain complete visibility over platform operator modifications.
- Silent overwrites are eliminated; simultaneous portal sessions are protected by 409 Conflict reload feedback.
- Server memory cannot be exhausted by unbounded file upload buffering.
