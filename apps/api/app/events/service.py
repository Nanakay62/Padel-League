"""Service orchestrating event creation, round generation, scoring, and live state."""

import random
import uuid
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.audit.models import AuditLog
from app.billing.models import Credit, Order
from app.domain.americano import RotationState, award_points, next_round
from app.domain.leaderboard import PlayerStats, rank_leaderboard
from app.domain.summary import format_whatsapp_summary
from app.events.export import (
    format_registrations_csv,
    format_results_csv,
    format_settlement_csv,
)
from app.events.models import (
    Event,
    EventMatch,
    EventPlayer,
    EventRound,
    Registration,
)
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

    async def duplicate_event(self, event_id: str) -> Event:
        orig = await self.get_event(event_id)
        new_start = orig.start_time + timedelta(days=7) if orig.start_time else None
        cloned = Event(
            id=str(uuid.uuid4()),
            title=orig.title,
            venue_name=orig.venue_name,
            format=orig.format,
            courts=orig.courts,
            point_target=orig.point_target,
            planned_rounds=orig.planned_rounds,
            price_pesewas=orig.price_pesewas,
            court_rate_pesewas=orig.court_rate_pesewas,
            max_players=orig.max_players,
            status="DRAFT",
            start_time=new_start,
        )
        self.db.add(cloned)
        await self.db.commit()
        await self.db.refresh(cloned)
        return cloned

    async def correct_score(
        self,
        event_id: str,
        match_id: str,
        team_a_score: int,
        team_b_score: int,
        reason: str,
        actor_id: str,
    ) -> EventMatch:
        if not reason or not reason.strip():
            raise HTTPException(
                status_code=400, detail="Reason is required for score correction"
            )

        event = await self.get_event(event_id)
        if team_a_score + team_b_score != event.point_target:
            raise HTTPException(
                status_code=400,
                detail=f"Scores ({team_a_score}+{team_b_score}={team_a_score + team_b_score}) must sum to point target {event.point_target}",
            )

        stmt = (
            select(EventMatch)
            .where(EventMatch.id == match_id)
            .options(selectinload(EventMatch.round))
        )
        res = await self.db.execute(stmt)
        match = res.scalar_one_or_none()
        if not match or match.round.event_id != event_id:
            raise HTTPException(status_code=404, detail="Match not found")

        match.team_a_score = team_a_score
        match.team_b_score = team_b_score
        match.status = "CORRECTED"
        match.entered_at = _utc_now()

        audit = AuditLog(
            id=str(uuid.uuid4()),
            actor_id=actor_id,
            action="SCORE_CORRECTION",
            target_type="MATCH",
            target_id=match.id,
            details=f"Scores corrected to {team_a_score}-{team_b_score}. Reason: {reason.strip()}",
            created_at=_utc_now(),
        )
        self.db.add(audit)
        await self.db.commit()
        await self.db.refresh(match)
        return match

    async def cancel_event(
        self,
        event_id: str,
        reason: str,
        actor_id: str,
    ) -> Event:
        if not reason or not reason.strip():
            raise HTTPException(
                status_code=400, detail="Reason is required for cancellation"
            )

        event = await self.get_event(event_id)
        now = _utc_now()
        event.status = "CANCELLED"
        event.cancellation_reason = reason.strip()

        stmt = (
            select(Registration)
            .where(
                Registration.event_id == event_id, Registration.status == "CONFIRMED"
            )
            .options(selectinload(Registration.order))
        )
        res = await self.db.execute(stmt)
        regs = res.scalars().all()

        for reg in regs:
            reg.status = "CANCELLED_FREE"
            if reg.order and reg.order.status == "PAID":
                credit = Credit(
                    id=str(uuid.uuid4()),
                    user_id=reg.user_id,
                    amount_pesewas=reg.order.amount_pesewas,
                    reason=f"Event cancelled: {reason.strip()}",
                    source_registration_id=reg.id,
                    created_at=now,
                )
                self.db.add(credit)

        audit = AuditLog(
            id=str(uuid.uuid4()),
            actor_id=actor_id,
            action="EVENT_CANCELLED",
            target_type="EVENT",
            target_id=event.id,
            details=f"Event cancelled. Reason: {reason.strip()}",
            created_at=now,
        )
        self.db.add(audit)
        await self.db.commit()
        await self.db.refresh(event)
        return event

    async def export_registrations_csv(self, event_id: str) -> str:
        stmt = (
            select(Registration)
            .where(Registration.event_id == event_id)
            .options(selectinload(Registration.user), selectinload(Registration.order))
        )
        res = await self.db.execute(stmt)
        regs = res.scalars().all()

        rows = []
        for reg in regs:
            user = reg.user
            order = reg.order
            amount_ghs = (
                f"{order.amount_pesewas / 100:.2f}"
                if order and order.status == "PAID"
                else "0.00"
            )
            rows.append(
                {
                    "name": user.name if user else "Unknown",
                    "phone": user.phone_e164 if user else "",
                    "status": reg.status,
                    "amount_ghs": amount_ghs,
                    "method": order.method if order else "N/A",
                    "waitlist_position": reg.waitlist_position or "",
                }
            )
        return format_registrations_csv(rows)

    async def export_results_csv(self, event_id: str) -> str:
        event = await self.get_event(event_id)
        rows = []
        for rd in sorted(event.rounds, key=lambda r: r.round_number):
            for m in rd.matches:
                rows.append(
                    {
                        "round": rd.round_number,
                        "court": m.court_number,
                        "team_a": f"{m.team_a_p1} & {m.team_a_p2}",
                        "team_b": f"{m.team_b_p1} & {m.team_b_p2}",
                        "score_a": m.team_a_score if m.team_a_score is not None else "",
                        "score_b": m.team_b_score if m.team_b_score is not None else "",
                        "status": m.status,
                    }
                )
        return format_results_csv(rows)

    async def export_settlement_csv(self, event_id: str) -> str:
        stmt = select(Order).where(Order.event_id == event_id)
        res = await self.db.execute(stmt)
        orders = res.scalars().all()

        paid_orders = [o for o in orders if o.status == "PAID"]
        pending_manual = [
            o
            for o in orders
            if o.status == "PENDING" and o.method in ("MANUAL_MOMO", "CASH")
        ]

        total_collected = sum(o.amount_pesewas for o in paid_orders)
        court_costs = sum(o.court_fee_pesewas for o in paid_orders)
        platform_fees = sum(o.platform_fee_pesewas for o in paid_orders)

        data = {
            "total_paid_players": len(paid_orders),
            "total_collected_ghs": f"{total_collected / 100:.2f}",
            "court_costs_ghs": f"{court_costs / 100:.2f}",
            "platform_fees_ghs": f"{platform_fees / 100:.2f}",
            "pending_manual_count": len(pending_manual),
        }
        return format_settlement_csv(data)
