"""Pydantic schemas for authentication, profiles, OTP, and partner search."""

from pydantic import BaseModel, ConfigDict, Field


class OtpRequest(BaseModel):
    phone: str = Field(..., min_length=9, max_length=20)


class OtpResponse(BaseModel):
    message: str
    phone_e164: str
    expires_in_seconds: int


class OtpVerifyRequest(BaseModel):
    phone: str
    otp: str = Field(..., min_length=6, max_length=6)
    name: str | None = Field(default=None, max_length=120)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    is_new_user: bool = False


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    phone_e164: str
    name: str
    email: str | None = None
    role: str
    is_guest: bool
    level: float
    level_band: str
    reliability: float
    is_provisional: bool
    preferred_side: str
    home_venue_id: str | None = None
    competitiveness: str


class UserProfileUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    preferred_side: str | None = None
    home_venue_id: str | None = None
    competitiveness: str | None = None
    usual_play_times: str | None = None
    external_level_note: str | None = None


class LevelOnboardingQuestions(BaseModel):
    years_playing: str = Field(..., description="less_than_1, 1_to_3, more_than_3")
    match_experience: str = Field(..., description="social_only, regular, tournament")
    uses_bandeja_vibora: bool
    wall_confidence: str = Field(..., description="learning, comfortable, advanced")


class LevelOnboardingResponse(BaseModel):
    level: float
    level_band: str
    is_provisional: bool
    explanation: str


class PartnerItemResponse(BaseModel):
    id: str
    display_name: str  # First name + initial, e.g. "Nana K."
    level: float
    level_band: str
    preferred_side: str
    home_venue_id: str | None = None


class GuestCreateRequest(BaseModel):
    name: str
    phone: str


class GuestCreateResponse(BaseModel):
    id: str
    name: str
    phone_e164: str
    claim_link: str
