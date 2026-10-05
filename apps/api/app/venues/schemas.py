"""Pydantic schemas for Venues, Courts, and Open Matches."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class VenueCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    address: str = Field(..., min_length=2, max_length=255)
    ghanapost_gps: str | None = None
    maps_url: str | None = None
    booking_phone: str | None = None
    booking_whatsapp: str | None = None
    booking_url: str | None = None
    court_count: int = Field(default=2, ge=1, le=32)
    base_rate_pesewas_per_hour: int = Field(default=18000, ge=0)


class CourtResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    court_number: int
    is_indoor: bool
    surface: str
    notes: str


class VenueResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    address: str
    ghanapost_gps: str
    maps_url: str
    booking_phone: str
    booking_whatsapp: str
    booking_url: str
    court_count: int
    base_rate_pesewas_per_hour: int
    base_rate_formatted: str


class VenueDetailResponse(VenueResponse):
    courts: list[CourtResponse]


class OpenMatchCreate(BaseModel):
    venue_id: str
    court_number: int = Field(default=1, ge=1)
    host_name: str = Field(..., min_length=2, max_length=120)
    host_phone: str = Field(..., min_length=9, max_length=20)
    level_band: str = Field(default="3.0 – 4.0")
    start_time: datetime
    end_time: datetime
    court_cost_pesewas: int = Field(..., ge=0)
    platform_fee_pesewas: int = Field(default=2000, ge=0)
    capacity: int = Field(default=4, ge=2, le=8)
    underfilled_policy: str = Field(default="CANCEL_REFUND")


class OpenMatchJoinRequest(BaseModel):
    player_name: str = Field(..., min_length=2, max_length=120)
    player_phone: str = Field(..., min_length=9, max_length=20)


class OpenMatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    venue_id: str
    venue_name: str
    court_number: int
    host_name: str
    level_band: str
    start_time: datetime
    end_time: datetime
    court_cost_pesewas: int
    platform_fee_pesewas: int
    price_per_player_pesewas: int
    price_per_player_formatted: str
    capacity: int
    open_seats: int
    status: str
    confirmed_players: list[str]
