"""Tests verifying venue membership multi-tenancy limits and schema invariants."""

import pytest

from app.config import settings
from app.db import Base
from app.identity.models import User
from app.venues.models import Venue, VenueMembership
from app.venues.service import VenueService


@pytest.mark.asyncio
async def test_no_unique_index_on_venue_memberships_user_id() -> None:
    """Invariant: venue_memberships MUST NOT have a single-column unique constraint on user_id."""
    table = Base.metadata.tables["venue_memberships"]

    # Assert user_id column is not marked unique
    user_col = table.columns["user_id"]
    assert user_col.unique is not True

    # Assert no single-column unique index on user_id exists
    for idx in table.indexes:
        if len(idx.columns) == 1 and idx.columns[0].name == "user_id":
            assert not idx.unique, "Found forbidden unique index on user_id alone"


@pytest.mark.asyncio
async def test_second_venue_rejected_at_launch_and_liftable_via_config(
    prepare_database: None,
) -> None:
    """Launch enforces max 1 venue per user via settings, which can be lifted without migration."""
    from tests.conftest import test_session_maker

    async with test_session_maker() as db:
        user = User(
            id="test-user-limit-1",
            name="Club Manager",
            email="manager@club.com",
            role="PLAYER",
        )
        venue1 = Venue(id="v1", name="Club Alpha", address="Airport Residential")
        venue2 = Venue(id="v2", name="Club Beta", address="East Legon")
        db.add_all([user, venue1, venue2])
        await db.commit()

        # Add first membership
        m1 = VenueMembership(
            id="m1",
            user_id=user.id,
            venue_id=venue1.id,
            role="CLUB_OWNER",
            status="ACTIVE",
        )
        db.add(m1)
        await db.commit()

        # Service validation when max_venues_per_club_user = 1
        service = VenueService(db)
        original_limit = settings.max_venues_per_club_user
        try:
            settings.max_venues_per_club_user = 1
            can_add = await service.can_user_join_venue(user.id, venue2.id)
            assert can_add is False

            # Lift limit via config only (NO database migration)
            settings.max_venues_per_club_user = 2
            can_add_after = await service.can_user_join_venue(user.id, venue2.id)
            assert can_add_after is True

            # Adding second membership succeeds in DB
            m2 = VenueMembership(
                id="m2",
                user_id=user.id,
                venue_id=venue2.id,
                role="CLUB_ADMIN",
                status="ACTIVE",
            )
            db.add(m2)
            await db.commit()

        finally:
            settings.max_venues_per_club_user = original_limit
