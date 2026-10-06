"""Venue, court, and open match service."""

import uuid
from datetime import UTC, datetime

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.club_metrics import (
    calculate_venue_metrics,
    format_weekly_club_summary,
)
from app.domain.money import format_ghs, price_per_player
from app.events.models import Event, EventRound
from app.identity.phone import normalize_ghana_phone
from app.venues.models import Court, OpenMatch, OpenMatchParticipant, Venue
from app.venues.schemas import (
    CourtResponse,
    OpenMatchCreate,
    OpenMatchResponse,
    VenueCreate,
    VenueDashboardResponse,
    VenueDetailResponse,
    VenueResponse,
)
from app.venues.validation import validate_ghanapost_gps


def _utc_now() -> datetime:
    return datetime.now(UTC)


class VenueService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_venue(self, data: VenueCreate) -> VenueResponse:
        gps_code = validate_ghanapost_gps(data.ghanapost_gps)
        phone = ""
        if data.booking_phone:
            try:
                phone = normalize_ghana_phone(data.booking_phone)
            except ValueError:
                phone = data.booking_phone.strip()

        venue = Venue(
            id=str(uuid.uuid4()),
            name=data.name.strip(),
            address=data.address.strip(),
            ghanapost_gps=gps_code,
            maps_url=data.maps_url or "",
            booking_phone=phone,
            booking_whatsapp=data.booking_whatsapp or "",
            booking_url=data.booking_url or "",
            base_rate_pesewas_per_hour=data.base_rate_pesewas_per_hour,
            outdoor_courts=data.court_count,
            indoor_courts=0,
            is_active=True,
        )
        self.db.add(venue)
        await self.db.flush()

        # Create individual courts
        for i in range(1, data.court_count + 1):
            court = Court(
                id=str(uuid.uuid4()),
                venue_id=venue.id,
                court_number=i,
                is_indoor=False,
                surface="Panoramic Turf",
                notes=f"Court {i}",
            )
            self.db.add(court)

        await self.db.commit()
        await self.db.refresh(venue)

        return VenueResponse(
            id=venue.id,
            name=venue.name,
            address=venue.address,
            ghanapost_gps=venue.ghanapost_gps,
            maps_url=venue.maps_url,
            booking_phone=venue.booking_phone,
            booking_whatsapp=venue.booking_whatsapp,
            booking_url=venue.booking_url,
            court_count=data.court_count,
            base_rate_pesewas_per_hour=venue.base_rate_pesewas_per_hour,
            base_rate_formatted=format_ghs(venue.base_rate_pesewas_per_hour),
        )

    async def get_venues(self) -> list[VenueResponse]:
        stmt = (
            select(Venue)
            .where(Venue.is_active == True)
            .options(selectinload(Venue.courts))
        )
        res = await self.db.execute(stmt)
        venues = res.scalars().all()

        return [
            VenueResponse(
                id=v.id,
                name=v.name,
                address=v.address,
                ghanapost_gps=v.ghanapost_gps,
                maps_url=v.maps_url,
                booking_phone=v.booking_phone,
                booking_whatsapp=v.booking_whatsapp,
                booking_url=v.booking_url,
                court_count=len(v.courts),
                base_rate_pesewas_per_hour=v.base_rate_pesewas_per_hour,
                base_rate_formatted=format_ghs(v.base_rate_pesewas_per_hour),
            )
            for v in venues
        ]

    async def get_venue_detail(self, venue_id: str) -> VenueDetailResponse:
        stmt = (
            select(Venue)
            .where(Venue.id == venue_id)
            .options(selectinload(Venue.courts))
        )
        res = await self.db.execute(stmt)
        venue = res.scalar_one_or_none()
        if not venue:
            raise HTTPException(status_code=404, detail="Venue not found")

        court_resps = [
            CourtResponse(
                id=c.id,
                court_number=c.court_number,
                is_indoor=c.is_indoor,
                surface=c.surface,
                notes=c.notes,
            )
            for c in sorted(venue.courts, key=lambda c: c.court_number)
        ]

        return VenueDetailResponse(
            id=venue.id,
            name=venue.name,
            address=venue.address,
            ghanapost_gps=venue.ghanapost_gps,
            maps_url=venue.maps_url,
            booking_phone=venue.booking_phone,
            booking_whatsapp=venue.booking_whatsapp,
            booking_url=venue.booking_url,
            court_count=len(venue.courts),
            base_rate_pesewas_per_hour=venue.base_rate_pesewas_per_hour,
            base_rate_formatted=format_ghs(venue.base_rate_pesewas_per_hour),
            courts=court_resps,
        )

    async def get_venue_dashboard(self, venue_id: str) -> VenueDashboardResponse:
        stmt = (
            select(Venue)
            .where(Venue.id == venue_id)
            .options(selectinload(Venue.courts), selectinload(Venue.open_matches))
        )
        res = await self.db.execute(stmt)
        venue = res.scalar_one_or_none()
        if not venue:
            raise HTTPException(status_code=404, detail="Venue not found")

        court_count = max(1, len(venue.courts))
        capacity_hours = court_count * 70.0

        events_stmt = (
            select(Event)
            .where(Event.venue_name == venue.name)
            .options(
                selectinload(Event.registrations),
                selectinload(Event.rounds).selectinload(EventRound.matches),
            )
        )
        events_res = await self.db.execute(events_stmt)
        events = events_res.scalars().all()

        court_hours_used = 0.0
        confirmed_players = 0
        waitlist_demand = 0
        total_revenue_pesewas = 0
        unreported_matches_count = 0
        unique_users: set[str] = set()

        for ev in events:
            round_count = len(ev.rounds) if ev.rounds else ev.planned_rounds
            court_hours_used += ev.courts * (round_count * 0.35)
            for reg in ev.registrations:
                if reg.status in ("CONFIRMED", "PLAYED"):
                    confirmed_players += 1
                    total_revenue_pesewas += ev.price_pesewas
                    unique_users.add(reg.user_id)
                elif reg.status == "WAITLISTED":
                    waitlist_demand += 1
            for rd in ev.rounds:
                for m in rd.matches:
                    if m.status in ("SCHEDULED", "IN_PROGRESS"):
                        unreported_matches_count += 1

        for om in venue.open_matches:
            duration_hours = (om.end_time - om.start_time).total_seconds() / 3600.0
            court_hours_used += max(1.0, duration_hours)
            confirmed_players += om.capacity - om.open_seats
            total_revenue_pesewas += (
                om.capacity - om.open_seats
            ) * om.price_per_player_pesewas

        metrics = calculate_venue_metrics(
            court_hours_used=round(court_hours_used, 1),
            capacity_hours=capacity_hours,
            confirmed_players=confirmed_players,
            waitlist_demand=waitlist_demand,
            new_players_count=len(unique_users),
            total_revenue_pesewas=total_revenue_pesewas,
            unreported_matches_count=unreported_matches_count,
        )

        now = _utc_now()
        week_label = f"Week {now.isocalendar()[1]} ({now.strftime('%b %Y')})"
        summary_text = format_weekly_club_summary(
            venue_name=venue.name,
            metrics=metrics,
            week_label=week_label,
        )

        return VenueDashboardResponse(
            venue_id=venue.id,
            venue_name=venue.name,
            court_hours_used=metrics.court_hours_used,
            capacity_hours=metrics.capacity_hours,
            fill_rate_percent=metrics.fill_rate_percent,
            confirmed_players=metrics.confirmed_players,
            waitlist_demand=metrics.waitlist_demand,
            new_players_count=metrics.new_players_count,
            total_revenue_pesewas=metrics.total_revenue_pesewas,
            total_revenue_ghs=metrics.total_revenue_ghs,
            unreported_matches_count=metrics.unreported_matches_count,
            whatsapp_summary=summary_text,
        )

    async def create_open_match(self, data: OpenMatchCreate) -> OpenMatchResponse:
        venue_detail = await self.get_venue_detail(data.venue_id)

        # Calculate integer pesewas price per player using pure domain logic
        per_player_cost = price_per_player(
            data.court_cost_pesewas,
            data.platform_fee_pesewas,
            data.capacity,
            rounding_unit=100,  # Round up to nearest whole Cedi
        )

        host_phone = normalize_ghana_phone(data.host_phone)

        open_match = OpenMatch(
            id=str(uuid.uuid4()),
            venue_id=data.venue_id,
            court_number=data.court_number,
            host_name=data.host_name.strip(),
            host_phone=host_phone,
            level_band=data.level_band,
            start_time=data.start_time,
            end_time=data.end_time,
            court_cost_pesewas=data.court_cost_pesewas,
            platform_fee_pesewas=data.platform_fee_pesewas,
            price_per_player_pesewas=per_player_cost,
            capacity=data.capacity,
            open_seats=data.capacity - 1,
            underfilled_policy=data.underfilled_policy,
            status="OPEN",
        )
        self.db.add(open_match)
        await self.db.flush()

        # Host is first confirmed participant
        host_p = OpenMatchParticipant(
            id=str(uuid.uuid4()),
            open_match_id=open_match.id,
            player_name=open_match.host_name,
            player_phone=open_match.host_phone,
        )
        self.db.add(host_p)
        await self.db.commit()

        return OpenMatchResponse(
            id=open_match.id,
            venue_id=open_match.venue_id,
            venue_name=venue_detail.name,
            court_number=open_match.court_number,
            host_name=open_match.host_name,
            level_band=open_match.level_band,
            start_time=open_match.start_time,
            end_time=open_match.end_time,
            court_cost_pesewas=open_match.court_cost_pesewas,
            platform_fee_pesewas=open_match.platform_fee_pesewas,
            price_per_player_pesewas=open_match.price_per_player_pesewas,
            price_per_player_formatted=format_ghs(open_match.price_per_player_pesewas),
            capacity=open_match.capacity,
            open_seats=open_match.open_seats,
            status=open_match.status,
            confirmed_players=[open_match.host_name],
        )

    async def join_open_match(
        self, match_id: str, player_name: str, player_phone: str
    ) -> OpenMatchResponse:
        stmt = (
            select(OpenMatch)
            .where(OpenMatch.id == match_id)
            .options(
                selectinload(OpenMatch.venue),
                selectinload(OpenMatch.participants),
            )
        )
        res = await self.db.execute(stmt)
        match = res.scalar_one_or_none()
        if not match:
            raise HTTPException(status_code=404, detail="Open match not found")

        if match.status != "OPEN" or match.open_seats <= 0:
            raise HTTPException(
                status_code=409, detail="This match is full or no longer open"
            )

        phone_e164 = normalize_ghana_phone(player_phone)
        participant = OpenMatchParticipant(
            id=str(uuid.uuid4()),
            open_match_id=match.id,
            player_name=player_name.strip(),
            player_phone=phone_e164,
        )
        self.db.add(participant)
        match.open_seats -= 1

        if match.open_seats == 0:
            match.status = "FULL"

        await self.db.commit()
        await self.db.refresh(match)

        return await self.get_open_match(match.id)

    async def get_open_match(self, match_id: str) -> OpenMatchResponse:
        stmt = (
            select(OpenMatch)
            .where(OpenMatch.id == match_id)
            .options(
                selectinload(OpenMatch.venue),
                selectinload(OpenMatch.participants),
            )
        )
        res = await self.db.execute(stmt)
        match = res.scalar_one_or_none()
        if not match:
            raise HTTPException(status_code=404, detail="Open match not found")

        confirmed_names = [p.player_name for p in match.participants]
        return OpenMatchResponse(
            id=match.id,
            venue_id=match.venue_id,
            venue_name=match.venue.name if match.venue else "",
            court_number=match.court_number,
            host_name=match.host_name,
            level_band=match.level_band,
            start_time=match.start_time,
            end_time=match.end_time,
            court_cost_pesewas=match.court_cost_pesewas,
            platform_fee_pesewas=match.platform_fee_pesewas,
            price_per_player_pesewas=match.price_per_player_pesewas,
            price_per_player_formatted=format_ghs(match.price_per_player_pesewas),
            capacity=match.capacity,
            open_seats=match.open_seats,
            status=match.status,
            confirmed_players=confirmed_names,
        )

    async def list_open_matches(self) -> list[OpenMatchResponse]:
        stmt = (
            select(OpenMatch)
            .where(OpenMatch.status.in_(["OPEN", "FULL"]))
            .order_by(OpenMatch.start_time.asc())
            .options(
                selectinload(OpenMatch.venue),
                selectinload(OpenMatch.participants),
            )
        )
        res = await self.db.execute(stmt)
        matches = res.scalars().all()

        return [
            OpenMatchResponse(
                id=m.id,
                venue_id=m.venue_id,
                venue_name=m.venue.name if m.venue else "",
                court_number=m.court_number,
                host_name=m.host_name,
                level_band=m.level_band,
                start_time=m.start_time,
                end_time=m.end_time,
                court_cost_pesewas=m.court_cost_pesewas,
                platform_fee_pesewas=m.platform_fee_pesewas,
                price_per_player_pesewas=m.price_per_player_pesewas,
                price_per_player_formatted=format_ghs(m.price_per_player_pesewas),
                capacity=m.capacity,
                open_seats=m.open_seats,
                status=m.status,
                confirmed_players=[p.player_name for p in m.participants],
            )
            for m in matches
        ]
