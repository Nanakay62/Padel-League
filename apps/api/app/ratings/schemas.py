"""Pydantic schemas for ratings, history, and level bands."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class LevelBandResponse(BaseModel):
    name: str
    min_rating: float
    max_rating: float
    description: str


class RatingHistoryItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    match_id: str
    rating_before: float
    rating_after: float
    delta: float
    k_factor: float
    explanation: str
    created_at: datetime


class RatingHistoryResponse(BaseModel):
    user_id: str
    current_rating: float
    level_band: str
    is_provisional: bool
    history: list[RatingHistoryItemResponse]
