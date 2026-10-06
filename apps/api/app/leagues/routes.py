"""FastAPI routes for pair leagues, boxes, fixtures, scoring, and standings."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.identity.deps import get_current_user
from app.identity.models import User
from app.leagues.schemas import (
    BoxCreate,
    BoxResponse,
    BoxStandingResponse,
    LeagueCreate,
    LeagueMatchResponse,
    LeagueMatchScoreRequest,
    LeagueResponse,
    PairCreate,
    PairResponse,
)
from app.leagues.service import LeagueService

router = APIRouter(prefix="/leagues", tags=["Leagues"])

DatabaseSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.post("", response_model=LeagueResponse, status_code=status.HTTP_201_CREATED)
async def create_league(
    payload: LeagueCreate,
    user: CurrentUser,
    db: DatabaseSession,
) -> LeagueResponse:
    if user.role not in ("ADMIN", "ORGANISER", "ORGANIZER"):
        raise HTTPException(
            status_code=403, detail="Organiser or Admin privileges required"
        )
    service = LeagueService(db)
    league = await service.create_league(payload)
    return LeagueResponse(
        id=league.id,
        title=league.title,
        season_name=league.season_name,
        status=league.status,
        promote_count=league.promote_count,
        relegate_count=league.relegate_count,
        cycle_weeks=league.cycle_weeks,
        substitute_policy=league.substitute_policy,
        created_at=league.created_at,
        boxes=[],
    )


@router.get("", response_model=list[LeagueResponse])
async def list_leagues(db: DatabaseSession) -> list[LeagueResponse]:
    service = LeagueService(db)
    leagues = await service.list_leagues()
    return [
        LeagueResponse(
            id=l.id,
            title=l.title,
            season_name=l.season_name,
            status=l.status,
            promote_count=l.promote_count,
            relegate_count=l.relegate_count,
            cycle_weeks=l.cycle_weeks,
            substitute_policy=l.substitute_policy,
            created_at=l.created_at,
            boxes=[
                BoxResponse(
                    id=b.id,
                    league_id=b.league_id,
                    box_number=b.box_number,
                    name=b.name,
                    min_rating=b.min_rating,
                    max_rating=b.max_rating,
                    cycle_deadline=b.cycle_deadline,
                    created_at=b.created_at,
                )
                for b in l.boxes
            ],
        )
        for l in leagues
    ]


@router.get("/{league_id}", response_model=LeagueResponse)
async def get_league(league_id: str, db: DatabaseSession) -> LeagueResponse:
    service = LeagueService(db)
    league = await service.get_league(league_id)
    return LeagueResponse(
        id=league.id,
        title=league.title,
        season_name=league.season_name,
        status=league.status,
        promote_count=league.promote_count,
        relegate_count=league.relegate_count,
        cycle_weeks=league.cycle_weeks,
        substitute_policy=league.substitute_policy,
        created_at=league.created_at,
        boxes=[
            BoxResponse(
                id=b.id,
                league_id=b.league_id,
                box_number=b.box_number,
                name=b.name,
                min_rating=b.min_rating,
                max_rating=b.max_rating,
                cycle_deadline=b.cycle_deadline,
                created_at=b.created_at,
            )
            for b in league.boxes
        ],
    )


@router.post(
    "/{league_id}/boxes",
    response_model=BoxResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_box(
    league_id: str,
    payload: BoxCreate,
    user: CurrentUser,
    db: DatabaseSession,
) -> BoxResponse:
    if user.role not in ("ADMIN", "ORGANISER", "ORGANIZER"):
        raise HTTPException(status_code=403, detail="Organiser privileges required")
    service = LeagueService(db)
    box = await service.create_box(league_id, payload)
    return BoxResponse(
        id=box.id,
        league_id=box.league_id,
        box_number=box.box_number,
        name=box.name,
        min_rating=box.min_rating,
        max_rating=box.max_rating,
        cycle_deadline=box.cycle_deadline,
        created_at=box.created_at,
    )


@router.post(
    "/{league_id}/boxes/{box_id}/pairs",
    response_model=PairResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_pair_to_box(
    league_id: str,
    box_id: str,
    payload: PairCreate,
    user: CurrentUser,
    db: DatabaseSession,
) -> PairResponse:
    service = LeagueService(db)
    pair = await service.add_pair_to_box(league_id, box_id, payload)
    return PairResponse(
        id=pair.id,
        box_id=pair.box_id,
        player1_id=pair.player1_id,
        player2_id=pair.player2_id,
        pair_name=pair.pair_name,
        combined_rating=pair.combined_rating,
        status=pair.status,
        substitutes_used=pair.substitutes_used,
        created_at=pair.created_at,
    )


@router.post(
    "/{league_id}/boxes/{box_id}/generate-fixtures",
    response_model=list[LeagueMatchResponse],
)
async def generate_fixtures(
    league_id: str,
    box_id: str,
    user: CurrentUser,
    db: DatabaseSession,
) -> list[LeagueMatchResponse]:
    if user.role not in ("ADMIN", "ORGANISER", "ORGANIZER"):
        raise HTTPException(status_code=403, detail="Organiser privileges required")
    service = LeagueService(db)
    matches = await service.generate_box_fixtures(league_id, box_id)
    return [
        LeagueMatchResponse(
            id=m.id,
            league_id=m.league_id,
            box_id=m.box_id,
            team_a_pair_id=m.team_a_pair_id,
            team_b_pair_id=m.team_b_pair_id,
            team_a_p1=m.team_a_p1,
            team_a_p2=m.team_a_p2,
            team_b_p1=m.team_b_p1,
            team_b_p2=m.team_b_p2,
            team_a_sets=m.team_a_sets,
            team_b_sets=m.team_b_sets,
            team_a_games=m.team_a_games,
            team_b_games=m.team_b_games,
            is_walkover=m.is_walkover,
            walkover_winner=m.walkover_winner,
            venue_name=m.venue_name,
            result_id=m.result_id,
            status=m.status,
        )
        for m in matches
    ]


@router.get(
    "/{league_id}/boxes/{box_id}/fixtures",
    response_model=list[LeagueMatchResponse],
)
async def get_fixtures(
    league_id: str,
    box_id: str,
    db: DatabaseSession,
) -> list[LeagueMatchResponse]:
    service = LeagueService(db)
    matches = await service.get_box_fixtures(league_id, box_id)
    return [
        LeagueMatchResponse(
            id=m.id,
            league_id=m.league_id,
            box_id=m.box_id,
            team_a_pair_id=m.team_a_pair_id,
            team_b_pair_id=m.team_b_pair_id,
            team_a_p1=m.team_a_p1,
            team_a_p2=m.team_a_p2,
            team_b_p1=m.team_b_p1,
            team_b_p2=m.team_b_p2,
            team_a_sets=m.team_a_sets,
            team_b_sets=m.team_b_sets,
            team_a_games=m.team_a_games,
            team_b_games=m.team_b_games,
            is_walkover=m.is_walkover,
            walkover_winner=m.walkover_winner,
            venue_name=m.venue_name,
            result_id=m.result_id,
            status=m.status,
        )
        for m in matches
    ]


@router.post(
    "/{league_id}/matches/{match_id}/score",
    response_model=LeagueMatchResponse,
)
async def submit_match_score(
    league_id: str,
    match_id: str,
    payload: LeagueMatchScoreRequest,
    user: CurrentUser,
    db: DatabaseSession,
) -> LeagueMatchResponse:
    service = LeagueService(db)
    match = await service.submit_league_match_score(league_id, match_id, payload)
    return LeagueMatchResponse(
        id=match.id,
        league_id=match.league_id,
        box_id=match.box_id,
        team_a_pair_id=match.team_a_pair_id,
        team_b_pair_id=match.team_b_pair_id,
        team_a_p1=match.team_a_p1,
        team_a_p2=match.team_a_p2,
        team_b_p1=match.team_b_p1,
        team_b_p2=match.team_b_p2,
        team_a_sets=match.team_a_sets,
        team_b_sets=match.team_b_sets,
        team_a_games=match.team_a_games,
        team_b_games=match.team_b_games,
        is_walkover=match.is_walkover,
        walkover_winner=match.walkover_winner,
        venue_name=match.venue_name,
        result_id=match.result_id,
        status=match.status,
    )


@router.get(
    "/{league_id}/boxes/{box_id}/standings",
    response_model=list[BoxStandingResponse],
)
async def get_box_standings(
    league_id: str,
    box_id: str,
    db: DatabaseSession,
) -> list[BoxStandingResponse]:
    service = LeagueService(db)
    return await service.get_box_standings(league_id, box_id)


@router.post(
    "/{league_id}/advance-cycle",
    response_model=list[BoxResponse],
)
async def advance_cycle(
    league_id: str,
    user: CurrentUser,
    db: DatabaseSession,
) -> list[BoxResponse]:
    if user.role not in ("ADMIN", "ORGANISER", "ORGANIZER"):
        raise HTTPException(status_code=403, detail="Organiser privileges required")
    service = LeagueService(db)
    boxes = await service.advance_league_cycle(league_id)
    return [
        BoxResponse(
            id=b.id,
            league_id=b.league_id,
            box_number=b.box_number,
            name=b.name,
            min_rating=b.min_rating,
            max_rating=b.max_rating,
            cycle_deadline=b.cycle_deadline,
            created_at=b.created_at,
        )
        for b in boxes
    ]
