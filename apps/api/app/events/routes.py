"""FastAPI router for events, courtside scoring, and live leaderboards."""

import asyncio
import json
from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import PlainTextResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.events.schemas import (
    AddPlayersRequest,
    AddPlayersResponse,
    CancelEventRequest,
    EventCreate,
    EventResponse,
    LiveEventResponse,
    MatchResponse,
    RoundResponse,
    ScoreCorrectionRequest,
    ScoreSubmissionRequest,
)
from app.events.service import EventService
from app.identity.deps import get_current_user_id

router = APIRouter(prefix="/events", tags=["Events"])

DatabaseSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUserId = Annotated[str, Depends(get_current_user_id)]


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    payload: EventCreate,
    db: DatabaseSession,
) -> EventResponse:
    service = EventService(db)
    event = await service.create_event(payload)
    return EventResponse.model_validate(event)


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: str,
    db: DatabaseSession,
) -> EventResponse:
    service = EventService(db)
    event = await service.get_event(event_id)
    return EventResponse.model_validate(event)


@router.post("/{event_id}/players", response_model=AddPlayersResponse)
async def add_players(
    event_id: str,
    payload: AddPlayersRequest,
    db: DatabaseSession,
) -> AddPlayersResponse:
    service = EventService(db)
    added = await service.add_players(event_id, payload.names)
    return AddPlayersResponse(players=added)


@router.post("/{event_id}/rounds:next", response_model=RoundResponse)
@router.post(
    "/{event_id}/rounds/next",
    response_model=RoundResponse,
    status_code=status.HTTP_201_CREATED,
)
async def generate_next_round(
    event_id: str,
    db: DatabaseSession,
) -> RoundResponse:
    service = EventService(db)
    return await service.generate_next_round(event_id)


@router.post("/{event_id}/matches/{match_id}/score", response_model=MatchResponse)
@router.post(
    "/{event_id}/rounds/{round_id}/matches/{match_id}/score",
    response_model=MatchResponse,
)
async def submit_match_score(
    event_id: str,
    match_id: str,
    payload: ScoreSubmissionRequest,
    db: DatabaseSession,
    round_id: str | None = None,
) -> MatchResponse:
    service = EventService(db)
    match = await service.submit_match_score(event_id, match_id, payload)
    return MatchResponse.model_validate(match)


@router.get("/{event_id}/live", response_model=LiveEventResponse)
async def get_live_state(
    event_id: str,
    db: DatabaseSession,
) -> LiveEventResponse:
    service = EventService(db)
    return await service.get_live_state(event_id)


@router.get("/{event_id}/stream")
async def event_live_stream(
    event_id: str,
    db: DatabaseSession,
    request: Request,
    heartbeats: int = 3,
) -> StreamingResponse:
    service = EventService(db)

    async def event_generator() -> AsyncGenerator[str, None]:
        # Send initial snapshot
        try:
            live = await service.get_live_state(event_id)
            yield f"data: {json.dumps(live.model_dump(mode='json'))}\n\n"
        except HTTPException:
            yield "data: {}\n\n"

        # Stream periodic heartbeat / updates
        for _ in range(heartbeats):
            if await request.is_disconnected():
                break
            await asyncio.sleep(0.5 if heartbeats == 1 else 5)
            yield ": keepalive\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/{event_id}/summary.txt", response_class=PlainTextResponse)
async def get_summary_text(
    event_id: str,
    db: DatabaseSession,
) -> PlainTextResponse:
    service = EventService(db)
    summary = await service.get_summary_text(event_id)
    return PlainTextResponse(summary)


@router.post("/{event_id}/duplicate", response_model=EventResponse)
async def duplicate_event(
    event_id: str,
    db: DatabaseSession,
    current_user_id: CurrentUserId,
) -> EventResponse:
    service = EventService(db)
    cloned = await service.duplicate_event(event_id)
    return EventResponse.model_validate(cloned)


@router.post(
    "/{event_id}/matches/{match_id}/correct-score", response_model=MatchResponse
)
async def correct_score(
    event_id: str,
    match_id: str,
    payload: ScoreCorrectionRequest,
    db: DatabaseSession,
    current_user_id: CurrentUserId,
) -> MatchResponse:
    service = EventService(db)
    match = await service.correct_score(
        event_id=event_id,
        match_id=match_id,
        team_a_score=payload.team_a_score,
        team_b_score=payload.team_b_score,
        reason=payload.reason,
        actor_id=current_user_id,
    )
    return MatchResponse.model_validate(match)


@router.post("/{event_id}/cancel", response_model=EventResponse)
async def cancel_event(
    event_id: str,
    payload: CancelEventRequest,
    db: DatabaseSession,
    current_user_id: CurrentUserId,
) -> EventResponse:
    service = EventService(db)
    cancelled = await service.cancel_event(
        event_id=event_id,
        reason=payload.reason,
        actor_id=current_user_id,
    )
    return EventResponse.model_validate(cancelled)


@router.get("/{event_id}/export/registrations.csv")
async def export_registrations_csv(
    event_id: str,
    db: DatabaseSession,
    current_user_id: CurrentUserId,
) -> Response:
    service = EventService(db)
    csv_content = await service.export_registrations_csv(event_id)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=registrations_{event_id}.csv"
        },
    )


@router.get("/{event_id}/export/results.csv")
async def export_results_csv(
    event_id: str,
    db: DatabaseSession,
    current_user_id: CurrentUserId,
) -> Response:
    service = EventService(db)
    csv_content = await service.export_results_csv(event_id)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=results_{event_id}.csv"},
    )


@router.get("/{event_id}/export/settlement.csv")
async def export_settlement_csv(
    event_id: str,
    db: DatabaseSession,
    current_user_id: CurrentUserId,
) -> Response:
    service = EventService(db)
    csv_content = await service.export_settlement_csv(event_id)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=settlement_{event_id}.csv"
        },
    )
