"""FastAPI routes for venues, courts, and open matches."""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.venues.schemas import (
    OpenMatchCreate,
    OpenMatchJoinRequest,
    OpenMatchResponse,
    VenueCreate,
    VenueDetailResponse,
    VenueResponse,
)
from app.venues.service import VenueService

router = APIRouter(tags=["Venues & Open Matches"])

DatabaseSession = Annotated[AsyncSession, Depends(get_db)]


@router.post(
    "/venues", response_model=VenueResponse, status_code=status.HTTP_201_CREATED
)
async def create_venue(
    payload: VenueCreate,
    db: DatabaseSession,
) -> VenueResponse:
    service = VenueService(db)
    return await service.create_venue(payload)


@router.get("/venues", response_model=list[VenueResponse])
async def list_venues(
    db: DatabaseSession,
) -> list[VenueResponse]:
    service = VenueService(db)
    return await service.get_venues()


@router.get("/venues/{venue_id}", response_model=VenueDetailResponse)
async def get_venue_detail(
    venue_id: str,
    db: DatabaseSession,
) -> VenueDetailResponse:
    service = VenueService(db)
    return await service.get_venue_detail(venue_id)


@router.post(
    "/open-matches",
    response_model=OpenMatchResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_open_match(
    payload: OpenMatchCreate,
    db: DatabaseSession,
) -> OpenMatchResponse:
    service = VenueService(db)
    return await service.create_open_match(payload)


@router.get("/open-matches", response_model=list[OpenMatchResponse])
async def list_open_matches(
    db: DatabaseSession,
) -> list[OpenMatchResponse]:
    service = VenueService(db)
    return await service.list_open_matches()


@router.get("/open-matches/{match_id}", response_model=OpenMatchResponse)
async def get_open_match(
    match_id: str,
    db: DatabaseSession,
) -> OpenMatchResponse:
    service = VenueService(db)
    return await service.get_open_match(match_id)


@router.post("/open-matches/{match_id}/join", response_model=OpenMatchResponse)
async def join_open_match(
    match_id: str,
    payload: OpenMatchJoinRequest,
    db: DatabaseSession,
) -> OpenMatchResponse:
    service = VenueService(db)
    return await service.join_open_match(
        match_id, payload.player_name, payload.player_phone
    )
