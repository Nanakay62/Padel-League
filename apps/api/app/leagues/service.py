"""Service layer for leagues, boxes, pairs, fixtures, scoring, and standings."""

import uuid
from datetime import UTC, datetime

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.boxes import (
    Box,
    BoxEntry,
    BoxMatchResult,
    compute_box_standings,
    generate_round_robin_fixtures,
    promote_and_relegate,
    validate_substitute_eligibility,
)
from app.events.models import EventMatch
from app.identity.models import PlayerProfile
from app.leagues.models import League, LeagueBox, LeaguePair
from app.leagues.schemas import (
    BoxCreate,
    BoxStandingResponse,
    LeagueCreate,
    LeagueMatchScoreRequest,
    PairCreate,
)


def _utc_now() -> datetime:
    return datetime.now(UTC)


class LeagueService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_league(self, data: LeagueCreate) -> League:
        league = League(
            id=str(uuid.uuid4()),
            title=data.title,
            season_name=data.season_name,
            promote_count=data.promote_count,
            relegate_count=data.relegate_count,
            cycle_weeks=data.cycle_weeks,
            substitute_policy=data.substitute_policy,
        )
        self.db.add(league)
        await self.db.commit()
        await self.db.refresh(league)
        return league

    async def get_league(self, league_id: str) -> League:
        stmt = (
            select(League)
            .options(selectinload(League.boxes))
            .where(League.id == league_id)
        )
        res = await self.db.execute(stmt)
        league = res.scalar_one_or_none()
        if not league:
            raise HTTPException(status_code=404, detail="League not found")
        return league

    async def list_leagues(self) -> list[League]:
        stmt = (
            select(League)
            .options(selectinload(League.boxes))
            .order_by(League.created_at.desc())
        )
        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def create_box(self, league_id: str, data: BoxCreate) -> LeagueBox:
        await self.get_league(league_id)
        box = LeagueBox(
            id=str(uuid.uuid4()),
            league_id=league_id,
            box_number=data.box_number,
            name=data.name,
            min_rating=data.min_rating,
            max_rating=data.max_rating,
            cycle_deadline=data.cycle_deadline,
        )
        self.db.add(box)
        await self.db.commit()
        await self.db.refresh(box)
        return box

    async def add_pair_to_box(
        self, league_id: str, box_id: str, data: PairCreate
    ) -> LeaguePair:
        stmt = select(LeagueBox).where(
            LeagueBox.id == box_id, LeagueBox.league_id == league_id
        )
        res = await self.db.execute(stmt)
        box = res.scalar_one_or_none()
        if not box:
            raise HTTPException(status_code=404, detail="Box not found in league")

        # Get player ratings from PlayerProfile
        stmt1 = select(PlayerProfile).where(PlayerProfile.user_id == data.player1_id)
        res1 = await self.db.execute(stmt1)
        prof1 = res1.scalar_one_or_none()
        r1 = prof1.level if prof1 else 2.5

        stmt2 = select(PlayerProfile).where(PlayerProfile.user_id == data.player2_id)
        res2 = await self.db.execute(stmt2)
        prof2 = res2.scalar_one_or_none()
        r2 = prof2.level if prof2 else 2.5

        combined = round(r1 + r2, 2)

        pair = LeaguePair(
            id=str(uuid.uuid4()),
            box_id=box_id,
            player1_id=data.player1_id,
            player2_id=data.player2_id,
            pair_name=data.pair_name,
            combined_rating=combined,
            status="ACTIVE",
            substitutes_used=0,
        )
        self.db.add(pair)
        await self.db.commit()
        await self.db.refresh(pair)
        return pair

    async def generate_box_fixtures(
        self, league_id: str, box_id: str
    ) -> list[EventMatch]:
        stmt = (
            select(LeagueBox)
            .options(
                selectinload(LeagueBox.pairs).selectinload(LeaguePair.player1),
                selectinload(LeagueBox.pairs).selectinload(LeaguePair.player2),
            )
            .where(LeagueBox.id == box_id, LeagueBox.league_id == league_id)
        )
        res = await self.db.execute(stmt)
        box = res.scalar_one_or_none()
        if not box:
            raise HTTPException(status_code=404, detail="Box not found")

        active_pairs = [p for p in box.pairs if p.status == "ACTIVE"]
        if len(active_pairs) < 2:
            raise HTTPException(
                status_code=400, detail="Need at least 2 pairs to generate fixtures"
            )

        pair_map = {p.id: p for p in active_pairs}
        pair_ids = list(pair_map.keys())
        matchups = generate_round_robin_fixtures(pair_ids)

        created_matches: list[EventMatch] = []
        for home_id, away_id in matchups:
            home_pair = pair_map[home_id]
            away_pair = pair_map[away_id]

            match = EventMatch(
                id=str(uuid.uuid4()),
                league_id=league_id,
                box_id=box_id,
                round_id=None,
                team_a_pair_id=home_id,
                team_b_pair_id=away_id,
                court_number=1,
                team_a_p1=home_pair.player1.name if home_pair.player1 else "Player 1",
                team_a_p2=home_pair.player2.name if home_pair.player2 else "Player 2",
                team_b_p1=away_pair.player1.name if away_pair.player1 else "Player 3",
                team_b_p2=away_pair.player2.name if away_pair.player2 else "Player 4",
                status="SCHEDULED",
            )
            self.db.add(match)
            created_matches.append(match)

        await self.db.commit()
        for m in created_matches:
            await self.db.refresh(m)
        return created_matches

    async def get_box_fixtures(self, league_id: str, box_id: str) -> list[EventMatch]:
        stmt = (
            select(EventMatch)
            .where(EventMatch.league_id == league_id, EventMatch.box_id == box_id)
            .order_by(EventMatch.entered_at.desc().nulls_last())
        )
        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def submit_league_match_score(
        self, league_id: str, match_id: str, data: LeagueMatchScoreRequest
    ) -> EventMatch:
        stmt = select(EventMatch).where(
            EventMatch.id == match_id, EventMatch.league_id == league_id
        )
        res = await self.db.execute(stmt)
        match = res.scalar_one_or_none()
        if not match:
            raise HTTPException(status_code=404, detail="League match not found")

        # Idempotency check
        if match.result_id == data.result_id and match.status == "SCORE_ENTERED":
            return match

        # Validate substitute if present
        if data.substitute_player_id and match.team_a_pair_id:
            pair = await self.db.get(LeaguePair, match.team_a_pair_id)
            box = await self.db.get(LeagueBox, match.box_id)
            sub_prof = await self.db.execute(
                select(PlayerProfile).where(
                    PlayerProfile.user_id == data.substitute_player_id
                )
            )
            prof_row = sub_prof.scalar_one_or_none()
            sub_level = prof_row.level if prof_row else 2.5
            if pair and box:
                valid, msg = validate_substitute_eligibility(
                    sub_rating=sub_level,
                    replaced_player_rating=pair.combined_rating / 2.0,
                    box_ceiling_rating=box.max_rating,
                    subs_used_by_pair=pair.substitutes_used,
                )
                if not valid:
                    raise HTTPException(status_code=400, detail=msg)
                pair.substitutes_used += 1

        match.team_a_sets = data.team_a_sets
        match.team_b_sets = data.team_b_sets
        match.team_a_games = data.team_a_games
        match.team_b_games = data.team_b_games
        match.is_walkover = data.is_walkover
        match.walkover_winner = data.walkover_winner
        match.venue_name = data.venue_name
        match.venue_id = data.venue_id
        match.result_id = data.result_id
        match.entered_by = data.entered_by
        match.entered_at = _utc_now()
        match.status = "SCORE_ENTERED"

        await self.db.commit()
        await self.db.refresh(match)
        return match

    async def get_box_standings(
        self, league_id: str, box_id: str
    ) -> list[BoxStandingResponse]:
        league = await self.get_league(league_id)
        stmt = (
            select(LeagueBox)
            .options(selectinload(LeagueBox.pairs))
            .where(LeagueBox.id == box_id, LeagueBox.league_id == league_id)
        )
        res = await self.db.execute(stmt)
        box = res.scalar_one_or_none()
        if not box:
            raise HTTPException(status_code=404, detail="Box not found")

        matches_stmt = select(EventMatch).where(
            EventMatch.league_id == league_id,
            EventMatch.box_id == box_id,
            EventMatch.status == "SCORE_ENTERED",
        )
        matches_res = await self.db.execute(matches_stmt)
        matches = list(matches_res.scalars().all())

        domain_entries = [
            BoxEntry(
                pair_id=p.id,
                name=p.pair_name,
                substitutes_used=p.substitutes_used,
            )
            for p in box.pairs
        ]

        domain_results = [
            BoxMatchResult(
                match_id=m.id,
                team_a_pair_id=m.team_a_pair_id or "",
                team_b_pair_id=m.team_b_pair_id or "",
                team_a_sets=m.team_a_sets or 0,
                team_b_sets=m.team_b_sets or 0,
                team_a_games=m.team_a_games or 0,
                team_b_games=m.team_b_games or 0,
                is_walkover=m.is_walkover,
                walkover_winner_pair_id=m.walkover_winner,
            )
            for m in matches
        ]

        ranked = compute_box_standings(domain_entries, domain_results)

        # Count total boxes in league
        total_boxes_stmt = select(func.count(LeagueBox.id)).where(
            LeagueBox.league_id == league_id
        )
        total_boxes_res = await self.db.execute(total_boxes_stmt)
        total_boxes = total_boxes_res.scalar_one() or 1

        total_teams = len(ranked)
        responses: list[BoxStandingResponse] = []

        for idx, entry in enumerate(ranked, start=1):
            # Zone calculation
            if box.box_number > 1 and idx <= league.promote_count:
                zone = "PROMOTION"
            elif (
                box.box_number < total_boxes
                and idx > total_teams - league.relegate_count
            ):
                zone = "RELEGATION"
            else:
                zone = "SAFE"

            responses.append(
                BoxStandingResponse(
                    rank=idx,
                    pair_id=entry.pair_id,
                    pair_name=entry.name,
                    points=entry.points,
                    matches_played=entry.matches_played,
                    sets_won=entry.sets_won,
                    sets_lost=entry.sets_lost,
                    games_won=entry.games_won,
                    games_lost=entry.games_lost,
                    set_difference=entry.set_difference,
                    game_difference=entry.game_difference,
                    walkovers_given=entry.walkovers_given,
                    zone=zone,
                )
            )

        return responses

    async def advance_league_cycle(self, league_id: str) -> list[LeagueBox]:
        league = await self.get_league(league_id)
        boxes_stmt = (
            select(LeagueBox)
            .options(selectinload(LeagueBox.pairs))
            .where(LeagueBox.league_id == league_id)
            .order_by(LeagueBox.box_number.asc())
        )
        boxes_res = await self.db.execute(boxes_stmt)
        boxes = list(boxes_res.scalars().all())

        if not boxes:
            return []

        domain_boxes: list[Box] = []
        for b in boxes:
            standings = await self.get_box_standings(league_id, b.id)
            domain_entries = [
                BoxEntry(
                    pair_id=s.pair_id,
                    name=s.pair_name,
                    points=s.points,
                    sets_won=s.sets_won,
                    sets_lost=s.sets_lost,
                    games_won=s.games_won,
                    games_lost=s.games_lost,
                )
                for s in standings
            ]
            domain_boxes.append(Box(box_number=b.box_number, entries=domain_entries))

        promoted_boxes = promote_and_relegate(
            domain_boxes,
            promote=league.promote_count,
            relegate=league.relegate_count,
        )

        # Update pairs' box_id
        for box_model, domain_box in zip(boxes, promoted_boxes, strict=False):
            for entry in domain_box.entries:
                pair = await self.db.get(LeaguePair, entry.pair_id)
                if pair:
                    pair.box_id = box_model.id
                    pair.substitutes_used = 0

        await self.db.commit()
        return boxes
