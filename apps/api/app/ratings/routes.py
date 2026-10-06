"""FastAPI routes for rating history and level band reference."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.identity.deps import get_current_user_id
from app.ratings.schemas import LevelBandResponse, RatingHistoryResponse
from app.ratings.service import RatingService

router = APIRouter(tags=["Ratings"])

DatabaseSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUserId = Annotated[str, Depends(get_current_user_id)]


@router.get("/ratings/level-bands", response_model=list[LevelBandResponse])
async def get_level_bands(
    db: DatabaseSession,
) -> list[LevelBandResponse]:
    """Retrieve canonical Ghana Padel level band mapping (Beginner to Expert)."""
    service = RatingService(db)
    return service.get_level_bands()


@router.get("/me/rating-history", response_model=RatingHistoryResponse)
async def get_my_rating_history(
    current_user_id: CurrentUserId,
    db: DatabaseSession,
) -> RatingHistoryResponse:
    """Retrieve chronological RatingEvent progression and level band status for authenticated player."""
    service = RatingService(db)
    return await service.get_user_rating_history(current_user_id)
