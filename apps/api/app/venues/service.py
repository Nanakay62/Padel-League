"""Venue, court, and open match service."""

import uuid
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.domain.club_metrics import (
    calculate_venue_metrics,
    format_weekly_club_summary,
)
from app.domain.money import (
    OpeningHoursSpan,
    PriceBand,
    calculate_stateless_quote,
    format_ghs,
    is_within_opening_hours,
    price_per_player,
    sign_quote_token,
    validate_quote_start_time,
    verify_quote_token,
)
from app.events.models import Event, EventRound
from app.identity.phone import normalize_ghana_phone
from app.venues.models import Court, OpenMatch, OpenMatchParticipant, Venue
from app.venues.schemas import (
    CourtResponse,
    OpenMatchCreate,
    OpenMatchResponse,
    PublicEventSummary,
    QuoteLineResponse,
    QuoteRequest,
    QuoteResponse,
    VenueCreate,
    VenueDashboardResponse,
    VenueDetailResponse,
    VenueResponse,
    VerifyQuoteResponse,
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

        rate_fmt = (
            format_ghs(venue.base_rate_pesewas_per_hour)
            if venue.base_rate_pesewas_per_hour is not None
            else "Ask the club"
        )
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
            base_rate_formatted=rate_fmt,
            description=venue.description or "",
            photos=venue.photos or [],
            amenities=venue.amenities or [],
            opening_hours=venue.opening_hours or [],
            price_bands=venue.price_bands or [],
            duration_multipliers_bps=venue.duration_multipliers_bps
            or {"60": 10000, "90": 10000, "120": 10000},
            add_ons_config=venue.add_ons_config or [],
            price_version=venue.price_version or 1,
            updated_at=venue.updated_at,
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
                base_rate_formatted=(
                    format_ghs(v.base_rate_pesewas_per_hour)
                    if v.base_rate_pesewas_per_hour is not None
                    else "Ask the club"
                ),
                description=v.description or "",
                photos=v.photos or [],
                amenities=v.amenities or [],
                opening_hours=v.opening_hours or [],
                price_bands=v.price_bands or [],
                duration_multipliers_bps=v.duration_multipliers_bps
                or {"60": 10000, "90": 10000, "120": 10000},
                add_ons_config=v.add_ons_config or [],
                price_version=v.price_version or 1,
                updated_at=v.updated_at,
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
                venue_id=c.venue_id,
                court_number=c.court_number,
                is_indoor=c.is_indoor,
                surface=c.surface,
                lighting=c.lighting or "",
                photos=c.photos or [],
                notes=c.notes or "",
                base_rate_pesewas_per_hour=c.base_rate_pesewas_per_hour,
                price_bands=c.price_bands or [],
                duration_multipliers_bps=c.duration_multipliers_bps,
                updated_at=c.updated_at,
            )
            for c in sorted(venue.courts, key=lambda c: c.court_number)
        ]

        # Fetch upcoming public events at this venue (strictly NO player names)
        events_stmt = (
            select(Event)
            .where(Event.venue_name == venue.name)
            .order_by(Event.created_at.desc())
            .limit(10)
        )
        events_res = await self.db.execute(events_stmt)
        public_events = [
            PublicEventSummary(
                id=e.id,
                title=e.title,
                format=e.format,
                status=e.status,
                start_time=e.created_at,
            )
            for e in events_res.scalars().all()
        ]

        rate_fmt = (
            format_ghs(venue.base_rate_pesewas_per_hour)
            if venue.base_rate_pesewas_per_hour is not None
            else "Ask the club"
        )
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
            base_rate_formatted=rate_fmt,
            description=venue.description or "",
            photos=venue.photos or [],
            amenities=venue.amenities or [],
            opening_hours=venue.opening_hours or [],
            price_bands=venue.price_bands or [],
            duration_multipliers_bps=venue.duration_multipliers_bps
            or {"60": 10000, "90": 10000, "120": 10000},
            add_ons_config=venue.add_ons_config or [],
            price_version=venue.price_version or 1,
            updated_at=venue.updated_at,
            courts=court_resps,
            upcoming_events=public_events,
        )

    async def get_court_detail(self, venue_id: str, court_id: str) -> CourtResponse:
        court = await self.db.get(Court, court_id)
        if not court or court.venue_id != venue_id:
            raise HTTPException(status_code=404, detail="Court not found")

        return CourtResponse(
            id=court.id,
            venue_id=court.venue_id,
            court_number=court.court_number,
            is_indoor=court.is_indoor,
            surface=court.surface,
            lighting=court.lighting or "",
            photos=court.photos or [],
            notes=court.notes or "",
            base_rate_pesewas_per_hour=court.base_rate_pesewas_per_hour,
            price_bands=court.price_bands or [],
            duration_multipliers_bps=court.duration_multipliers_bps,
            updated_at=court.updated_at,
        )

    async def calculate_quote(self, data: QuoteRequest) -> QuoteResponse:
        """Computes stateless, dynamic price quote.

        Rules:
        - Rejects start times >90 days ahead or in past (allowing 5m clock-skew).
        - Start must be on a 30-minute boundary.
        - Checks venue opening hours if configured.
        - Add-ons validated against venue config; unknown add-on raises 422.
        - Malformed stored data safely falls back to is_priced=False ("Ask the club"), never 500.
        - Signs HMAC quote token with current key_id from keyring.
        """
        now = datetime.now(UTC)

        # 1. Start time validation (90 days max, clock skew past tolerance)
        try:
            validate_quote_start_time(data.start, now=now)
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))

        # 2. Boundary validation
        if (
            data.start.minute not in (0, 30)
            or data.start.second != 0
            or data.start.microsecond != 0
        ):
            raise HTTPException(
                status_code=422,
                detail="Session start must be on a 30-minute boundary (:00 or :30)",
            )

        # 3. Load venue and court
        venue = await self.db.get(Venue, data.venue_id)
        if not venue or not venue.is_active:
            raise HTTPException(status_code=404, detail="Venue not found")

        court = await self.db.get(Court, data.court_id)
        if not court or court.venue_id != venue.id:
            raise HTTPException(status_code=404, detail="Court not found")

        # 4. Safe parse of stored config (Malformed JSON returns is_priced=False, never 500)
        try:
            # Parse opening hours
            stored_hours = venue.opening_hours or []
            opening_spans = [
                OpeningHoursSpan(
                    day=int(h["day"]),
                    opens_minute=int(h["opens_minute"]),
                    closes_minute=int(h["closes_minute"]),
                )
                for h in stored_hours
            ]

            # If opening hours are configured, enforce them
            if opening_spans and not is_within_opening_hours(
                data.start, data.duration_min, opening_spans
            ):
                raise HTTPException(
                    status_code=422,
                    detail="Requested time is outside venue opening hours",
                )

            # Validate requested add-ons against venue config (Requirement 7)
            venue_add_ons = venue.add_ons_config or []
            venue_add_ons_map = {item["id"]: item for item in venue_add_ons}
            for add_on_id in data.add_ons:
                if add_on_id not in venue_add_ons_map:
                    raise HTTPException(
                        status_code=422,
                        detail=f"Unknown add-on ID: '{add_on_id}'",
                    )

            # Price bands and fallback rates (Requirement 11)
            # Court with base rate and no bands uses court rate for all hours
            # Court with bands and no base rate leaves gaps unpriced
            has_court_bands = bool(court.price_bands)
            raw_bands = (
                court.price_bands if has_court_bands else (venue.price_bands or [])
            )
            domain_bands = [
                PriceBand(
                    days=tuple(int(d) for d in b["days"]),
                    start_minute=int(b["start_minute"]),
                    end_minute=int(b["end_minute"]),
                    hourly_rate_pesewas=int(b["hourly_rate_pesewas"]),
                    name=str(b.get("name", "Peak")),
                )
                for b in raw_bands
            ]

            if has_court_bands:
                fallback_rate = court.base_rate_pesewas_per_hour
            else:
                fallback_rate = (
                    court.base_rate_pesewas_per_hour
                    if court.base_rate_pesewas_per_hour is not None
                    else venue.base_rate_pesewas_per_hour
                )

            # Duration multiplier
            multipliers_dict = (
                court.duration_multipliers_bps
                if court.duration_multipliers_bps
                else (venue.duration_multipliers_bps or {})
            )
            multiplier_bps = int(multipliers_dict.get(str(data.duration_min), 10000))

            # Calculate quote
            quote_result = calculate_stateless_quote(
                venue_id=venue.id,
                court_id=court.id,
                start=data.start,
                duration_min=data.duration_min,
                bands=domain_bands,
                fallback_hourly_rate=fallback_rate,
                duration_multiplier_bps=multiplier_bps,
                venue_add_ons_config=venue_add_ons,
                requested_add_ons=data.add_ons,
                platform_fee_pesewas=settings.platform_fee_pesewas,
                tax_enabled=settings.tax_enabled,
                tax_rate_bps=settings.tax_rate_bps,
                taxable_lines=settings.taxable_lines,
            )
        except HTTPException:
            raise
        except ValueError as e:
            err_msg = str(e)
            if "unknown add-on" in err_msg.lower():
                raise HTTPException(status_code=422, detail=err_msg)
            # Other calculation / data errors -> return is_priced=False
            return QuoteResponse(
                quote_id="quote_unpriced",
                token="",
                expires_at=now,
                lines=[],
                total_pesewas=0,
                court_fee_pesewas=0,
                platform_fee_pesewas=0,
                add_ons_pesewas=0,
                tax_pesewas=0,
                price_version=venue.price_version or 1,
                is_priced=False,
            )
        except Exception:  # noqa: BLE001
            # Safe read fallback (Req 6): never 500 on malformed DB data
            return QuoteResponse(
                quote_id="quote_unpriced",
                token="",
                expires_at=now,
                lines=[],
                total_pesewas=0,
                court_fee_pesewas=0,
                platform_fee_pesewas=0,
                add_ons_pesewas=0,
                tax_pesewas=0,
                price_version=venue.price_version or 1,
                is_priced=False,
            )

        if not quote_result.is_priced:
            return QuoteResponse(
                quote_id="quote_unpriced",
                token="",
                expires_at=now,
                lines=[],
                total_pesewas=0,
                court_fee_pesewas=0,
                platform_fee_pesewas=0,
                add_ons_pesewas=0,
                tax_pesewas=0,
                price_version=venue.price_version or 1,
                is_priced=False,
            )

        expires_at = now + timedelta(minutes=settings.quote_hold_window_minutes)
        token_payload = {
            "key_id": "v1",
            "venue_id": venue.id,
            "court_id": court.id,
            "start": data.start.isoformat(),
            "duration_min": data.duration_min,
            "add_ons": sorted(data.add_ons),
            "total_pesewas": quote_result.total_pesewas,
            "price_version": venue.price_version or 1,
            "expires_at": expires_at.isoformat(),
            "created_at": now.isoformat(),
        }
        token = sign_quote_token(token_payload, keyring=settings.quote_keyring)

        return QuoteResponse(
            quote_id=quote_result.quote_id,
            token=token,
            expires_at=expires_at,
            lines=[
                QuoteLineResponse(
                    label=line.label,
                    amount_pesewas=line.amount_pesewas,
                    line_type=line.line_type,
                )
                for line in quote_result.lines
            ],
            total_pesewas=quote_result.total_pesewas,
            court_fee_pesewas=quote_result.court_fee_pesewas,
            platform_fee_pesewas=quote_result.platform_fee_pesewas,
            add_ons_pesewas=quote_result.add_ons_pesewas,
            tax_pesewas=quote_result.tax_pesewas,
            price_version=venue.price_version or 1,
            is_priced=True,
        )

    async def verify_quote(self, token: str, user_id: str) -> VerifyQuoteResponse:
        """Verifies quote token during checkout (logged-in user required).

        If token is unexpired: verifies signature and returns valid.
        If expired: recomputes the quote from active DB pricing data.
          - If total changed: raises HTTP 409 Conflict.
          - If total unchanged: issues fresh token and returns recomputed=True.
        """
        now = datetime.now(UTC)
        try:
            verified = verify_quote_token(
                token,
                keyring=settings.quote_keyring,
                now=now,
                max_age_seconds=settings.quote_token_max_age_seconds,
            )
        except KeyError:
            raise HTTPException(
                status_code=400, detail="Unknown key_id in quote token keyring"
            )

        if verified is None:
            raise HTTPException(
                status_code=400, detail="Invalid quote token or signature"
            )

        payload = verified
        is_expired = bool(verified.get("is_expired", False))

        if not is_expired:
            return VerifyQuoteResponse(
                valid=True,
                total_pesewas=payload["total_pesewas"],
                recomputed=False,
                new_token=token,
            )

        # Token is expired: recompute quote to verify pricing stability
        start_dt = datetime.fromisoformat(payload["start"])
        recompute_req = QuoteRequest(
            venue_id=payload["venue_id"],
            court_id=payload["court_id"],
            start=start_dt,
            duration_min=payload["duration_min"],
            add_ons=payload.get("add_ons", []),
        )
        fresh_quote = await self.calculate_quote(recompute_req)

        if (
            not fresh_quote.is_priced
            or fresh_quote.total_pesewas != payload["total_pesewas"]
        ):
            raise HTTPException(
                status_code=409,
                detail={
                    "message": "Price has changed since quote was issued",
                    "old_total_pesewas": payload["total_pesewas"],
                    "new_total_pesewas": fresh_quote.total_pesewas
                    if fresh_quote.is_priced
                    else None,
                },
            )

        return VerifyQuoteResponse(
            valid=True,
            total_pesewas=fresh_quote.total_pesewas,
            recomputed=True,
            new_token=fresh_quote.token,
            lines=fresh_quote.lines,
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
