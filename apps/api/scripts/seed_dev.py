"""Seed development database with sample venues and courts."""

import asyncio
import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

import app.audit.models
import app.billing.models
import app.events.models
import app.identity.models
import app.leagues.models
import app.notify.models
import app.ratings.models
import app.venues.models  # noqa: F401
from app.db import Base, async_session_maker, engine
from app.venues.models import Court, Venue


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_maker() as session:
        # Check if v1 exists
        existing_v1 = await session.get(Venue, "v1")
        if not existing_v1:
            v1 = Venue(
                id="v1",
                name="Accra City Padel Club",
                address="Airport Residential, Accra",
                ghanapost_gps="GA-492-8012",
                maps_url="https://maps.google.com/?q=accra_padel",
                booking_phone="+233240001122",
                booking_whatsapp="+233240001122",
                booking_url="",
                base_rate_pesewas_per_hour=12000,
                indoor_courts=0,
                outdoor_courts=4,
                description="4 World Padel Tour spec panoramic glass courts, LED floodlights, pro shop & smoothie bar.",
                photos=[
                    {
                        "url": "https://lh3.googleusercontent.com/aida-public/AB6AXuAM6s_WuWCQzL4lY-Fl-CtBlZz4OI_p7sR6cCmh1LD1elOHhL2QWM2UbmAkzrtbLmwLXyLlBcPoXuxBASkUPn932yDZ6xYFx1B40wybcSGCJVXyEtbribyoOmzFIbXMRuFyuy-sdwUOsR3uWhrLe04mGJh8DVfiknnZo6MskbERwsOrQhrIsUD9v8i-ClPH-BS-4Ey7u7Dxe4_h3oP_Q-SOOlaY3QY8wZ-zWgPpGVas_an8seUrWo-z",
                        "alt": "Accra City Padel Club exterior",
                    }
                ],
                amenities=[
                    "Pro Shop",
                    "Locker Rooms",
                    "Refreshments",
                    "Floodlights",
                    "Free Parking",
                ],
                opening_hours=[
                    {"day": 0, "opens_minute": 360, "closes_minute": 1380},
                    {"day": 1, "opens_minute": 360, "closes_minute": 1380},
                    {"day": 2, "opens_minute": 360, "closes_minute": 1380},
                    {"day": 3, "opens_minute": 360, "closes_minute": 1380},
                    {"day": 4, "opens_minute": 360, "closes_minute": 120},
                    {"day": 5, "opens_minute": 420, "closes_minute": 120},
                    {"day": 6, "opens_minute": 480, "closes_minute": 1320},
                ],
                price_bands=[
                    {
                        "name": "Evening Prime",
                        "days": [0, 1, 2, 3, 4],
                        "start_minute": 1020,
                        "end_minute": 1320,
                        "hourly_rate_pesewas": 15000,
                    }
                ],
                duration_multipliers_bps={"60": 10000, "90": 10000, "120": 10000},
                add_ons_config=[
                    {
                        "id": "balls",
                        "name": "Can of Head Padel Pro Balls",
                        "price_pesewas": 6500,
                    },
                    {
                        "id": "racket",
                        "name": "Bullpadel Racket Rental",
                        "price_pesewas": 4000,
                    },
                ],
                price_version=1,
                is_active=True,
            )
            c1 = Court(
                id="c1",
                venue_id="v1",
                court_number=1,
                is_indoor=False,
                surface="Panoramic Supercourt Pro Blue",
                lighting="LED Floodlights 400 Lux",
                notes="Center Court with grandstand seating",
                base_rate_pesewas_per_hour=None,
                price_bands=[],
                photos=[
                    {
                        "url": "https://lh3.googleusercontent.com/aida-public/AB6AXuAM6s_WuWCQzL4lY-Fl-CtBlZz4OI_p7sR6cCmh1LD1elOHhL2QWM2UbmAkzrtbLmwLXyLlBcPoXuxBASkUPn932yDZ6xYFx1B40wybcSGCJVXyEtbribyoOmzFIbXMRuFyuy-sdwUOsR3uWhrLe04mGJh8DVfiknnZo6MskbERwsOrQhrIsUD9v8i-ClPH-BS-4Ey7u7Dxe4_h3oP_Q-SOOlaY3QY8wZ-zWgPpGVas_an8seUrWo-z",
                        "alt": "Court 1 Center Court",
                    }
                ],
            )
            c2 = Court(
                id="c2",
                venue_id="v1",
                court_number=2,
                is_indoor=False,
                surface="Panoramic Supercourt Pro Blue",
                lighting="LED Floodlights 400 Lux",
                notes="Court 2",
                base_rate_pesewas_per_hour=None,
                price_bands=[],
                photos=[],
            )
            session.add_all([v1, c1, c2])

        # Seed Super Admin and Club Owner users for manual portal testing
        from app.identity.models import User
        from app.identity.password_policy import hash_password
        from app.venues.models import VenueMembership

        # 1. Super Admin
        sa = await session.get(User, "sa-dev")
        if not sa:
            sa = User(
                id="sa-dev",
                name="Super Administrator",
                email="admin@padelghana.com",
                role="SUPER_ADMIN",
                hashed_password=hash_password("PadelGhana2026!"),
                is_active=True,
            )
            session.add(sa)

        # 2. Club Owner
        owner = await session.get(User, "owner-dev")
        if not owner:
            owner = User(
                id="owner-dev",
                name="Kwame Mensah",
                email="owner@accrapadel.com",
                role="PLAYER",
                hashed_password=hash_password("PadelGhana2026!"),
                is_active=True,
            )
            session.add(owner)

            owner_mem = VenueMembership(
                id="mem-owner-dev",
                user_id="owner-dev",
                venue_id="v1",
                role="CLUB_OWNER",
                status="ACTIVE",
            )
            session.add(owner_mem)

        await session.commit()
        print("Dev DB seeded successfully!")
        print("Demo Credentials:")
        print("  Super Admin Portal: admin@padelghana.com / PadelGhana2026!")
        print("  Club Back Office:   owner@accrapadel.com / PadelGhana2026!")


if __name__ == "__main__":
    asyncio.run(seed())
