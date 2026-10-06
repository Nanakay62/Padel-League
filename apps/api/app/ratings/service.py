"""Service for managing rating events, history, and level bands."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.rating import get_level_band
from app.identity.models import PlayerProfile
from app.ratings.models import RatingEvent
from app.ratings.schemas import (
    LevelBandResponse,
    RatingHistoryItemResponse,
    RatingHistoryResponse,
)

CANONICAL_LEVEL_BANDS = [
    LevelBandResponse(
        name="Beginner",
        min_rating=1.0,
        max_rating=2.0,
        description="Learning court walls, basic strokes, and padel rules.",
    ),
    LevelBandResponse(
        name="Improver",
        min_rating=2.0,
        max_rating=3.0,
        description="Consistent baseline rallies and understanding glass rebounds.",
    ),
    LevelBandResponse(
        name="Intermediate",
        min_rating=3.0,
        max_rating=4.0,
        description="Tactical lobs, consistent bandeha, and solid net positioning.",
    ),
    LevelBandResponse(
        name="Advanced",
        min_rating=4.0,
        max_rating=5.5,
        description="Offensive vibora, fast-paced transitions, and high tournament consistency.",
    ),
    LevelBandResponse(
        name="Expert",
        min_rating=5.5,
        max_rating=7.0,
        description="National and elite tier padel competitor.",
    ),
]


class RatingService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    def get_level_bands(self) -> list[LevelBandResponse]:
        return CANONICAL_LEVEL_BANDS

    async def get_user_rating_history(self, user_id: str) -> RatingHistoryResponse:
        stmt = (
            select(RatingEvent)
            .where(RatingEvent.user_id == user_id)
            .order_by(RatingEvent.created_at.asc())
        )
        res = await self.db.execute(stmt)
        events = res.scalars().all()

        profile_stmt = select(PlayerProfile).where(PlayerProfile.user_id == user_id)
        p_res = await self.db.execute(profile_stmt)
        profile = p_res.scalar_one_or_none()

        if events:
            current_rating = events[-1].rating_after
        elif profile and profile.level:
            current_rating = profile.level
        else:
            current_rating = 2.50

        matches_count = len(events)
        is_provisional = matches_count < 10
        band = get_level_band(current_rating)

        history_items = [RatingHistoryItemResponse.model_validate(ev) for ev in events]

        return RatingHistoryResponse(
            user_id=user_id,
            current_rating=round(current_rating, 2),
            level_band=band,
            is_provisional=is_provisional,
            history=history_items,
        )
