"""FastAPI routes for Expo push token registration and lifecycle management."""

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.identity.deps import get_current_user_id
from app.notify.models import PushToken
from app.notify.schemas import (
    PushTokenDeactivateResponse,
    PushTokenRegisterRequest,
    PushTokenResponse,
)

router = APIRouter(tags=["Notifications"])

DatabaseSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUserId = Annotated[str, Depends(get_current_user_id)]


@router.post("/me/push-tokens", response_model=PushTokenResponse)
async def register_push_token(
    payload: PushTokenRegisterRequest,
    current_user_id: CurrentUserId,
    db: DatabaseSession,
) -> PushTokenResponse:
    """Register or update an Expo push token for the authenticated user."""
    stmt = select(PushToken).where(PushToken.token == payload.token)
    res = await db.execute(stmt)
    existing = res.scalar_one_or_none()

    now = datetime.now(UTC)
    if existing:
        existing.user_id = current_user_id
        existing.device_os = payload.device_os
        existing.is_active = True
        existing.updated_at = now
        await db.commit()
        await db.refresh(existing)
        return PushTokenResponse(
            token=existing.token,
            device_os=existing.device_os,
            is_active=existing.is_active,
        )

    new_token = PushToken(
        user_id=current_user_id,
        token=payload.token,
        device_os=payload.device_os,
        is_active=True,
        created_at=now,
        updated_at=now,
    )
    db.add(new_token)
    await db.commit()
    await db.refresh(new_token)

    return PushTokenResponse(
        token=new_token.token,
        device_os=new_token.device_os,
        is_active=new_token.is_active,
    )


@router.delete("/me/push-tokens/{token}", response_model=PushTokenDeactivateResponse)
async def deactivate_push_token(
    token: str,
    current_user_id: CurrentUserId,
    db: DatabaseSession,
) -> PushTokenDeactivateResponse:
    """Deactivate an Expo push token for the authenticated user."""
    stmt = select(PushToken).where(
        PushToken.token == token,
        PushToken.user_id == current_user_id,
    )
    res = await db.execute(stmt)
    push_token = res.scalar_one_or_none()

    if push_token:
        push_token.is_active = False
        push_token.updated_at = datetime.now(UTC)
        await db.commit()

    return PushTokenDeactivateResponse(status="deactivated")
