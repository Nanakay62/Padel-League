"""Pydantic schemas for push notifications and device tokens."""

from pydantic import BaseModel, ConfigDict


class PushTokenRegisterRequest(BaseModel):
    token: str
    device_os: str = "android"


class PushTokenResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    token: str
    device_os: str
    is_active: bool


class PushTokenDeactivateResponse(BaseModel):
    status: str
