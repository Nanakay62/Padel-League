"""Pydantic schemas for Venues, Courts, Dynamic Price Quotes, and Open Matches."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class PhotoItem(BaseModel):
    url: str = Field(..., min_length=1)
    alt: str = Field(..., min_length=1)


class OpeningHoursSpanSchema(BaseModel):
    day: int = Field(..., ge=0, le=6, description="0=Mon, ..., 6=Sun")
    opens_minute: int = Field(..., ge=0, le=1439, description="0 to 1439 minute of day")
    closes_minute: int = Field(
        ..., ge=0, le=1439, description="0 to 1439 minute of day"
    )


class PriceBandSchema(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    days: list[int] = Field(..., min_length=1)
    start_minute: int = Field(..., ge=0, le=1439)
    end_minute: int = Field(..., ge=0, le=1439)
    hourly_rate_pesewas: int = Field(
        ..., gt=0, description="Strictly positive hourly rate"
    )

    @field_validator("days")
    @classmethod
    def validate_days(cls, v: list[int]) -> list[int]:
        for d in v:
            if d < 0 or d > 6:
                raise ValueError("Day must be between 0 (Monday) and 6 (Sunday)")
        return v


class AddOnItemSchema(BaseModel):
    id: str = Field(..., min_length=1, max_length=64)
    name: str = Field(..., min_length=1, max_length=120)
    price_pesewas: int = Field(
        ..., ge=0, description="Price in pesewas, cannot be negative"
    )


class VenueCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    address: str = Field(..., min_length=2, max_length=255)
    ghanapost_gps: str | None = None
    maps_url: str | None = None
    booking_phone: str | None = None
    booking_whatsapp: str | None = None
    booking_url: str | None = None
    court_count: int = Field(default=2, ge=1, le=32)
    base_rate_pesewas_per_hour: int | None = Field(default=None, ge=1)
    description: str = Field(default="", max_length=1000)
    photos: list[PhotoItem] = Field(default_factory=list)
    amenities: list[str] = Field(default_factory=list)
    opening_hours: list[OpeningHoursSpanSchema] = Field(default_factory=list)
    price_bands: list[PriceBandSchema] = Field(default_factory=list)
    duration_multipliers_bps: dict[str, int] = Field(
        default_factory=lambda: {"60": 10000, "90": 10000, "120": 10000}
    )
    add_ons_config: list[AddOnItemSchema] = Field(default_factory=list)

    @field_validator("duration_multipliers_bps")
    @classmethod
    def validate_multipliers(cls, v: dict[str, int]) -> dict[str, int]:
        for dur, mult in v.items():
            if dur not in ("60", "90", "120"):
                raise ValueError(
                    "Duration multiplier keys must be '60', '90', or '120'"
                )
            if mult < 5000 or mult > 30000:
                raise ValueError(
                    f"Multiplier {mult} for {dur} min is outside sane range (5000-30000 bps)"
                )
        return v


class VenueUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    ghanapost_gps: str | None = None
    maps_url: str | None = None
    booking_phone: str | None = None
    booking_whatsapp: str | None = None
    booking_url: str | None = None
    base_rate_pesewas_per_hour: int | None = Field(default=None, ge=1)
    description: str | None = None
    photos: list[PhotoItem] | None = None
    amenities: list[str] | None = None
    opening_hours: list[OpeningHoursSpanSchema] | None = None
    price_bands: list[PriceBandSchema] | None = None
    duration_multipliers_bps: dict[str, int] | None = None
    add_ons_config: list[AddOnItemSchema] | None = None

    @field_validator("duration_multipliers_bps")
    @classmethod
    def validate_multipliers(cls, v: dict[str, int] | None) -> dict[str, int] | None:
        if v is None:
            return None
        for dur, mult in v.items():
            if dur not in ("60", "90", "120"):
                raise ValueError(
                    "Duration multiplier keys must be '60', '90', or '120'"
                )
            if mult < 5000 or mult > 30000:
                raise ValueError(
                    f"Multiplier {mult} for {dur} min is outside sane range (5000-30000 bps)"
                )
        return v


class CourtUpdate(BaseModel):
    lighting: str | None = None
    surface: str | None = None
    notes: str | None = None
    photos: list[PhotoItem] | None = None
    base_rate_pesewas_per_hour: int | None = Field(default=None, ge=1)
    price_bands: list[PriceBandSchema] | None = None
    duration_multipliers_bps: dict[str, int] | None = None


class CourtResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    venue_id: str
    court_number: int
    is_indoor: bool
    surface: str
    lighting: str = ""
    photos: list[dict[str, Any]] = Field(default_factory=list)
    notes: str = ""
    base_rate_pesewas_per_hour: int | None = None
    price_bands: list[dict[str, Any]] = Field(default_factory=list)
    duration_multipliers_bps: dict[str, int] | None = None
    updated_at: datetime | None = None


class PublicEventSummary(BaseModel):
    """Public summary of upcoming events at a venue. Never includes player names."""

    id: str
    title: str
    format: str
    status: str
    start_time: datetime | None = None


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
    base_rate_pesewas_per_hour: int | None = None
    base_rate_formatted: str
    description: str = ""
    photos: list[dict[str, Any]] = Field(default_factory=list)
    amenities: list[str] = Field(default_factory=list)
    opening_hours: list[dict[str, Any]] = Field(default_factory=list)
    price_bands: list[dict[str, Any]] = Field(default_factory=list)
    duration_multipliers_bps: dict[str, int] = Field(
        default_factory=lambda: {"60": 10000, "90": 10000, "120": 10000}
    )
    add_ons_config: list[dict[str, Any]] = Field(default_factory=list)
    price_version: int = 1
    updated_at: datetime | None = None


class VenueDetailResponse(VenueResponse):
    courts: list[CourtResponse] = Field(default_factory=list)
    upcoming_events: list[PublicEventSummary] = Field(default_factory=list)


# --- Dynamic Price Quote Schemas ---


class QuoteRequest(BaseModel):
    venue_id: str = Field(..., min_length=1)
    court_id: str = Field(..., min_length=1)
    start: datetime = Field(
        ..., description="UTC ISO-8601 timestamp on :00 or :30 boundary"
    )
    duration_min: int = Field(
        ..., description="Duration in minutes: strictly 60, 90, or 120"
    )
    add_ons: list[str] = Field(
        default_factory=list, description="List of requested add-on IDs"
    )

    @field_validator("duration_min")
    @classmethod
    def validate_duration(cls, v: int) -> int:
        if v not in (60, 90, 120):
            raise ValueError("Duration must be strictly 60, 90, or 120 minutes")
        return v


class QuoteLineResponse(BaseModel):
    label: str
    amount_pesewas: int
    line_type: str


class QuoteResponse(BaseModel):
    quote_id: str
    token: str
    expires_at: datetime
    lines: list[QuoteLineResponse]
    total_pesewas: int
    court_fee_pesewas: int
    platform_fee_pesewas: int
    add_ons_pesewas: int
    tax_pesewas: int
    price_version: int
    is_priced: bool


class VerifyQuoteRequest(BaseModel):
    token: str = Field(..., min_length=1)


class VerifyQuoteResponse(BaseModel):
    valid: bool
    total_pesewas: int
    recomputed: bool
    new_token: str | None = None
    lines: list[QuoteLineResponse] = Field(default_factory=list)


# --- Open Match & Dashboard Schemas ---


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


class VenueDashboardResponse(BaseModel):
    venue_id: str
    venue_name: str
    court_hours_used: float
    capacity_hours: float
    fill_rate_percent: float
    confirmed_players: int
    waitlist_demand: int
    new_players_count: int
    total_revenue_pesewas: int
    total_revenue_ghs: float
    unreported_matches_count: int = 0
    whatsapp_summary: str = ""
