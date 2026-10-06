"""Pydantic schemas for leagues, boxes, pairs, fixtures, and standings."""

from datetime import datetime

from pydantic import BaseModel, Field


class LeagueCreate(BaseModel):
    title: str = Field(..., max_length=120)
    season_name: str = Field(default="Season 1", max_length=64)
    promote_count: int = Field(default=1, ge=0)
    relegate_count: int = Field(default=1, ge=0)
    cycle_weeks: int = Field(default=4, ge=1)
    substitute_policy: str = Field(default="MAX_1_RATING_LE_REPLACED")


class BoxCreate(BaseModel):
    box_number: int = Field(..., ge=1)
    name: str = Field(..., max_length=120)
    min_rating: float = Field(default=1.0, ge=1.0, le=7.0)
    max_rating: float = Field(default=7.0, ge=1.0, le=7.0)
    cycle_deadline: datetime | None = None


class PairCreate(BaseModel):
    player1_id: str
    player2_id: str
    pair_name: str = Field(..., max_length=120)


class PairResponse(BaseModel):
    id: str
    box_id: str
    player1_id: str
    player2_id: str
    pair_name: str
    combined_rating: float
    status: str
    substitutes_used: int
    created_at: datetime


class BoxResponse(BaseModel):
    id: str
    league_id: str
    box_number: int
    name: str
    min_rating: float
    max_rating: float
    cycle_deadline: datetime | None
    created_at: datetime


class LeagueResponse(BaseModel):
    id: str
    title: str
    season_name: str
    status: str
    promote_count: int
    relegate_count: int
    cycle_weeks: int
    substitute_policy: str
    created_at: datetime
    boxes: list[BoxResponse] = []


class LeagueMatchScoreRequest(BaseModel):
    team_a_sets: int = 0
    team_b_sets: int = 0
    team_a_games: int = 0
    team_b_games: int = 0
    is_walkover: bool = False
    walkover_winner: str | None = None
    substitute_player_id: str | None = None
    venue_name: str | None = None
    venue_id: str | None = None
    result_id: str
    entered_by: str | None = None


class LeagueMatchResponse(BaseModel):
    id: str
    league_id: str | None
    box_id: str | None
    team_a_pair_id: str | None
    team_b_pair_id: str | None
    team_a_p1: str
    team_a_p2: str
    team_b_p1: str
    team_b_p2: str
    team_a_sets: int | None
    team_b_sets: int | None
    team_a_games: int | None
    team_b_games: int | None
    is_walkover: bool
    walkover_winner: str | None
    venue_name: str | None
    result_id: str | None
    status: str


class BoxStandingResponse(BaseModel):
    rank: int
    pair_id: str
    pair_name: str
    points: int
    matches_played: int
    sets_won: int
    sets_lost: int
    games_won: int
    games_lost: int
    set_difference: int
    game_difference: int
    walkovers_given: int
    zone: str  # "PROMOTION", "RELEGATION", "SAFE"
