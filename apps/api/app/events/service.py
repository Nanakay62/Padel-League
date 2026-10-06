"""Service orchestrating event creation, round generation, scoring, and live state."""

import random
import uuid
from datetime import UTC, datetime

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.americano import RotationState, award_points, next_round
from app.domain.leaderboard import PlayerStats, rank_leaderboard
from app.domain.summary import format_whatsapp_summary
from app.events.models import Event, EventMatch, EventPlayer, EventRound
from app.events.schemas import (
    EventCreate,
    EventResponse,
    LeaderboardEntryResponse,
    LiveEventResponse,
    MatchResponse,
    RoundResponse,
    ScoreSubmissionRequest,
)


def _utc_now() -> datetime:
    return datetime.now(UTC)


class EventService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_event(self, data: EventCreate) -> Event:
        event = Event(
            id=str(uuid.uuid4()),
            title=data.title,
            venue_name=data.venue_name,
            format=data.format,
            courts=data.courts,
            point_target=data.point_target,
            planned_rounds=data.planned_rounds,
            status="LIVE",
        )
        self.db.add(event)
        await self.db.commit()
        await self.db.refresh(event)
        return event

    async def get_event(self, event_id: str) -> Event:
        stmt = (
            select(Event)
            .where(Event.id == event_id)
            .options(
                selectinload(Event.players),
                selectinload(Event.rounds).selectinload(EventRound.matches),
            )
        )
        result = await self.db.execute(stmt)
        event = result.scalar_one_or_none()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        return event

    async def add_players(self, event_id: str, names: list[str]) -> list[str]:
        event = await self.get_event(event_id)
        added: list[str] = []
        for name in names:
            clean_name = name.strip()
            if clean_name:
                player = EventPlayer(
                    id=str(uuid.uuid4()),
                    event_id=event.id,
                    name=clean_name,
                )
                self.db.add(player)
                added.append(clean_name)
        await self.db.commit()
        return added

    async def generate_next_round(
        self, event_id: str, rng: random.Random | None = None
    ) -> RoundResponse:
        event = await self.get_event(event_id)
        if event.status == "FINISHED":
            raise HTTPException(status_code=409, detail="Event is finished")

        players = [p.name for p in event.players]
        if len(players) < 4:
            raise HTTPException(
                status_code=400, detail="At least 4 players required to generate rounds"
            )

        # Check if previous round has un-reported matches (Round Gate)
        if event.rounds:
            last_round = max(event.rounds, key=lambda r: r.round_number)
            open_matches = [
                m
                for m in last_round.matches
                if m.status not in ["SCORE_ENTERED", "CONFIRMED"]
            ]
            if open_matches:
                raise HTTPException(
                    status_code=409,
                    detail="Cannot start next round: current round has unreported or incomplete match scores.",
                )
            next_round_num = last_round.round_number + 1
        else:
            next_round_num = 1

        if next_round_num > event.planned_rounds:
            event.status = "FINISHED"
            await self.db.commit()
            raise HTTPException(status_code=409, detail="All planned rounds completed")

        if event.format == "MEXICANO":
            from app.domain.leaderboard import calculate_leaderboard
            from app.domain.mexicano import generate_mexicano_round

            all_prior_matches = [m for r in event.rounds for m in r.matches]
            standings = calculate_leaderboard(event.players, all_prior_matches)
            mex_matches, _ = generate_mexicano_round(standings, event.courts)
            generated_matches = [
                (m.court_number, m.team_a, m.team_b) for m in mex_matches
            ]
        else:
            # Build RotationState from match history for Americano
            st = RotationState()
            for r in event.rounds:
                for m in r.matches:
                    if m.status in ["SCORE_ENTERED", "CONFIRMED", "SCHEDULED"]:
                        team_a = (m.team_a_p1, m.team_a_p2)
                        team_b = (m.team_b_p1, m.team_b_p2)
                        st.partnered[frozenset(team_a)] += 1
                        st.partnered[frozenset(team_b)] += 1
                        for x in team_a:
                            st.played[x] += 1
                            for y in team_b:
                                st.opposed[frozenset((x, y))] += 1
                        for y in team_b:
                            st.played[y] += 1

            generated_matches = next_round(players, event.courts, st, rng=rng)

        round_obj = EventRound(
            id=str(uuid.uuid4()),
            event_id=event.id,
            round_number=next_round_num,
            status="IN_PROGRESS",
        )
        self.db.add(round_obj)
        await self.db.flush()

        match_responses: list[MatchResponse] = []
        playing_names: set[str] = set()
        for court_num, team_a, team_b in generated_matches:
            playing_names.update(team_a)
            playing_names.update(team_b)
            match_obj = EventMatch(
                id=str(uuid.uuid4()),
                round_id=round_obj.id,
                court_number=court_num,
                team_a_p1=team_a[0],
                team_a_p2=team_a[1],
                team_b_p1=team_b[0],
                team_b_p2=team_b[1],
                status="SCHEDULED",
            )
            self.db.add(match_obj)
            match_responses.append(
                MatchResponse(
                    id=match_obj.id,
                    court_number=match_obj.court_number,
                    team_a_p1=match_obj.team_a_p1,
                    team_a_p2=match_obj.team_a_p2,
                    team_b_p1=match_obj.team_b_p1,
                    team_b_p2=match_obj.team_b_p2,
                    team_a_score=None,
                    team_b_score=None,
                    result_id=None,
                    status=match_obj.status,
                )
            )

        await self.db.commit()

        sit_outs = [p for p in players if p not in playing_names]
        return RoundResponse(
            round_number=next_round_num,
            status="IN_PROGRESS",
            matches=match_responses,
            sit_outs=sit_outs,
        )

    async def submit_match_score(
        self, event_id: str, match_id: str, data: ScoreSubmissionRequest
    ) -> EventMatch:
        event = await self.get_event(event_id)
        if event.status == "FINISHED":
            raise HTTPException(status_code=409, detail="Event is finished")

        # Find match
        stmt = (
            select(EventMatch)
            .join(EventRound)
            .where(EventMatch.id == match_id, EventRound.event_id == event_id)
        )
        res = await self.db.execute(stmt)
        match = res.scalar_one_or_none()
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")

        # Idempotency check: if result_id is already recorded, return unchanged
        if match.result_id == data.result_id and match.status == "SCORE_ENTERED":
            return match

        # Score validation
        try:
            award_points(data.team_a_score, data.team_b_score, event.point_target)
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))

        match.team_a_score = data.team_a_score
        match.team_b_score = data.team_b_score
        match.result_id = data.result_id
        match.entered_by = data.entered_by
        match.entered_at = _utc_now()
        match.status = "SCORE_ENTERED"

        await self.db.commit()
        await self.db.refresh(match)
        return match

    async def get_live_state(self, event_id: str) -> LiveEventResponse:
        event = await self.get_event(event_id)
        players = [p.name for p in event.players]

        # Aggregate stats
        stats_map: dict[str, PlayerStats] = {
            p: PlayerStats(player_id=p) for p in players
        }

        current_round_resp: RoundResponse | None = None
        current_round_num = 0

        if event.rounds:
            latest_round = max(event.rounds, key=lambda r: r.round_number)
            current_round_num = latest_round.round_number

            match_resps: list[MatchResponse] = []
            playing_in_latest: set[str] = set()

            for m in latest_round.matches:
                playing_in_latest.update(
                    [m.team_a_p1, m.team_a_p2, m.team_b_p1, m.team_b_p2]
                )
                match_resps.append(
                    MatchResponse(
                        id=m.id,
                        court_number=m.court_number,
                        team_a_p1=m.team_a_p1,
                        team_a_p2=m.team_a_p2,
                        team_b_p1=m.team_b_p1,
                        team_b_p2=m.team_b_p2,
                        team_a_score=m.team_a_score,
                        team_b_score=m.team_b_score,
                        result_id=m.result_id,
                        status=m.status,
                    )
                )

            current_round_resp = RoundResponse(
                round_number=latest_round.round_number,
                status=latest_round.status,
                matches=match_resps,
                sit_outs=[p for p in players if p not in playing_in_latest],
            )

        # Process reported scores across all rounds
        for r in event.rounds:
            for m in r.matches:
                if (
                    m.status == "SCORE_ENTERED"
                    and m.team_a_score is not None
                    and m.team_b_score is not None
                ):
                    # Team A
                    for p in (m.team_a_p1, m.team_a_p2):
                        if p in stats_map:
                            stats_map[p].points_won += m.team_a_score
                            stats_map[p].points_lost += m.team_b_score
                            stats_map[p].matches_played += 1
                            for opp in (m.team_b_p1, m.team_b_p2):
                                stats_map[p].head_to_head_points[opp] += m.team_a_score
                    # Team B
                    for p in (m.team_b_p1, m.team_b_p2):
                        if p in stats_map:
                            stats_map[p].points_won += m.team_b_score
                            stats_map[p].points_lost += m.team_a_score
                            stats_map[p].matches_played += 1
                            for opp in (m.team_a_p1, m.team_a_p2):
                                stats_map[p].head_to_head_points[opp] += m.team_b_score

        # Calculate sit-outs
        for p in players:
            stats_map[p].sit_outs = max(
                0, current_round_num - stats_map[p].matches_played
            )

        ranked = rank_leaderboard(list(stats_map.values()))
        leaderboard_resps = [
            LeaderboardEntryResponse(
                rank=idx,
                name=p.player_id,
                points=p.points_won,
                point_difference=p.point_difference,
                matches_played=p.matches_played,
                sit_outs=p.sit_outs,
            )
            for idx, p in enumerate(ranked, start=1)
        ]

        return LiveEventResponse(
            event=EventResponse.model_validate(event),
            current_round=current_round_num,
            round=current_round_resp,
            leaderboard=leaderboard_resps,
        )

    async def get_summary_text(self, event_id: str) -> str:
        live_state = await self.get_live_state(event_id)
        stats = [
            PlayerStats(
                player_id=l.name,
                points_won=l.points,
                points_lost=l.points - l.point_difference,
                matches_played=l.matches_played,
                sit_outs=l.sit_outs,
            )
            for l in live_state.leaderboard
        ]
        return format_whatsapp_summary(
            event_title=live_state.event.title,
            venue_name=live_state.event.venue_name,
            point_target=live_state.event.point_target,
            total_rounds=live_state.current_round,
            leaderboard=stats,
        )
