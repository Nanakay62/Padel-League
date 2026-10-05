"""Pydantic schemas for events and courtside scoring."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class EventCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=120)
    venue_name: str = Field(default="", max_length=120)
    format: str = Field(default="AMERICANO")
    courts: int = Field(default=2, ge=1, le=16)
    point_target: int = Field(default=24, ge=1)
    planned_rounds: int = Field(default=8, ge=1, le=32)


class EventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    venue_name: str
    format: str
    courts: int
    point_target: int
    planned_rounds: int
    status: str
    created_at: datetime


class AddPlayersRequest(BaseModel):
    names: list[str] = Field(..., min_length=1)


class AddPlayersResponse(BaseModel):
    players: list[str]


class ScoreSubmissionRequest(BaseModel):
    result_id: str
    team_a_score: int = Field(..., ge=0)
    team_b_score: int = Field(..., ge=0)
    entered_by: str | None = None


class MatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    court_number: int
    team_a_p1: str
    team_a_p2: str
    team_b_p1: str
    team_b_p2: str
    team_a_score: int | None = None
    team_b_score: int | None = None
    result_id: str | None = None
    status: str


class RoundResponse(BaseModel):
    round_number: int
    status: str
    matches: list[MatchResponse]
    sit_outs: list[str] = Field(default_factory=list)


class LeaderboardEntryResponse(BaseModel):
    rank: int
    name: str
    points: int
    point_difference: int
    matches_played: int
    sit_outs: int


class LiveEventResponse(BaseModel):
    event: EventResponse
    current_round: int
    round: RoundResponse | None = None
    leaderboard: list[LeaderboardEntryResponse]
