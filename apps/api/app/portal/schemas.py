"""Pydantic schemas for back-office admin and club portals."""

from pydantic import BaseModel, EmailStr, Field


class PortalLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
    host_type: str = Field(default="CLUB", pattern="^(CLUB|ADMIN)$")


class PortalLoginResponse(BaseModel):
    requires_mfa: bool = False
    requires_mfa_setup: bool = False
    mfa_token: str | None = None
    user: dict[str, str] | None = None
    venues: list[dict[str, str]] = []


class MfaSetupRequest(BaseModel):
    mfa_token: str


class MfaSetupResponse(BaseModel):
    secret: str
    otpauth_url: str
    recovery_codes: list[str]


class MfaConfirmSetupRequest(BaseModel):
    mfa_token: str
    code: str = Field(min_length=6, max_length=6)
    host_type: str = Field(default="CLUB", pattern="^(CLUB|ADMIN)$")


class MfaVerifyRequest(BaseModel):
    mfa_token: str
    code: str = Field(min_length=6, max_length=32)
    host_type: str = Field(default="CLUB", pattern="^(CLUB|ADMIN)$")


class PortalUserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str


class PortalVenueMembershipResponse(BaseModel):
    venue_id: str
    venue_name: str
    role: str


class PortalMeResponse(BaseModel):
    user: PortalUserResponse
    platform_role: str
    mfa_verified: bool
    memberships: list[PortalVenueMembershipResponse]


class InviteAcceptRequest(BaseModel):
    token: str
    name: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=12, max_length=128)


class InviteAcceptResponse(BaseModel):
    success: bool
    venue_id: str
    email: str
