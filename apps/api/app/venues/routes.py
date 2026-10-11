"""FastAPI routes for venues, courts, and open matches."""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.identity.deps import get_current_user_id
from app.venues.rate_limit import RateLimitedClientIP
from app.venues.schemas import (
    CourtResponse,
    OpenMatchCreate,
    OpenMatchJoinRequest,
    OpenMatchResponse,
    QuoteRequest,
    QuoteResponse,
    VenueCreate,
    VenueDashboardResponse,
    VenueDetailResponse,
    VenueResponse,
    VerifyQuoteRequest,
    VerifyQuoteResponse,
)
from app.venues.service import VenueService

router = APIRouter(tags=["Venues & Open Matches"])

DatabaseSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUserId = Annotated[str, Depends(get_current_user_id)]


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


@router.get("/venues/{venue_id}/courts/{court_id}", response_model=CourtResponse)
async def get_court_detail(
    venue_id: str,
    court_id: str,
    db: DatabaseSession,
) -> CourtResponse:
    service = VenueService(db)
    return await service.get_court_detail(venue_id, court_id)


@router.post("/quotes", response_model=QuoteResponse)
async def calculate_quote(
    payload: QuoteRequest,
    _client_ip: RateLimitedClientIP,
    db: DatabaseSession,
) -> QuoteResponse:
    """Public stateless dynamic price quote calculation.

    Rate-limited per client IP (trusting proxies only when direct peer is trusted).
    Does NOT persist any database rows.
    """
    service = VenueService(db)
    return await service.calculate_quote(payload)


@router.post("/checkout/verify-quote", response_model=VerifyQuoteResponse)
async def verify_quote(
    payload: VerifyQuoteRequest,
    user_id: CurrentUserId,
    db: DatabaseSession,
) -> VerifyQuoteResponse:
    """Verifies quote token validity before checkout. Requires logged-in user.

    If quote is expired, recomputes current price. If changed, returns 409 Conflict.
    """
    service = VenueService(db)
    return await service.verify_quote(payload.token, user_id)


@router.get("/venues/{venue_id}/dashboard", response_model=VenueDashboardResponse)
async def get_venue_dashboard(
    venue_id: str,
    db: DatabaseSession,
) -> VenueDashboardResponse:
    service = VenueService(db)
    return await service.get_venue_dashboard(venue_id)


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
