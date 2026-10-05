"""Integration tests for Venues, Courts, and Open Matches (Looking for a fourth)."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_venues_directory_and_court_counts() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Create a 3-court venue
        v3_payload = {
            "name": "Cantonments Padel Club",
            "address": "12 Rangoon Lane, Cantonments, Accra",
            "ghanapost_gps": "GL-045-8901",
            "maps_url": "https://maps.google.com/?q=cantonments_padel",
            "booking_phone": "0241234567",
            "booking_whatsapp": "https://wa.me/233241234567",
            "booking_url": "https://cantonmentspadel.com/book",
            "court_count": 3,
            "base_rate_pesewas_per_hour": 18000,  # GH₵ 180.00
        }
        res = await client.post("/venues", json=v3_payload)
        assert res.status_code == 201, res.text
        v3_data = res.json()
        assert v3_data["name"] == "Cantonments Padel Club"
        assert v3_data["court_count"] == 3
        assert v3_data["ghanapost_gps"] == "GL-045-8901"

        # 2. Create a 14-court mega venue
        v14_payload = {
            "name": "Accra Padel Arena",
            "address": "Airport Residential Area, Accra",
            "ghanapost_gps": "GA-111-2233",
            "court_count": 14,
            "base_rate_pesewas_per_hour": 22000,  # GH₵ 220.00
        }
        res = await client.post("/venues", json=v14_payload)
        assert res.status_code == 201
        v14_data = res.json()
        assert v14_data["court_count"] == 14

        # 3. Retrieve venues directory
        res = await client.get("/venues")
        assert res.status_code == 200
        venues = res.json()
        assert len(venues) >= 2
        assert any(v["name"] == "Cantonments Padel Club" for v in venues)
        assert any(v["name"] == "Accra Padel Arena" for v in venues)

        # 4. Detail view renders correctly for both
        v3_detail = await client.get(f"/venues/{v3_data['id']}")
        assert v3_detail.status_code == 200
        assert len(v3_detail.json()["courts"]) == 3

        v14_detail = await client.get(f"/venues/{v14_data['id']}")
        assert v14_detail.status_code == 200
        assert len(v14_detail.json()["courts"]) == 14


@pytest.mark.asyncio
async def test_open_match_looking_for_a_fourth_lifecycle() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create venue
        v_res = await client.post(
            "/venues",
            json={
                "name": "East Legon Padel Hub",
                "address": "Lagos Avenue, East Legon",
                "ghanapost_gps": "GE-234-5678",
                "court_count": 4,
                "base_rate_pesewas_per_hour": 20000,
            },
        )
        venue_id = v_res.json()["id"]

        # Player creates open match: "Looking for a fourth" (1 host + 3 open seats)
        open_match_payload = {
            "venue_id": venue_id,
            "court_number": 1,
            "host_name": "Nana Kwame",
            "host_phone": "0241234567",
            "level_band": "3.0 – 4.0",
            "start_time": "2026-10-10T18:00:00Z",
            "end_time": "2026-10-10T19:30:00Z",
            "court_cost_pesewas": 30000,  # 300 GHS for 1.5h
            "platform_fee_pesewas": 2000,  # 20 GHS
            "capacity": 4,
            "underfilled_policy": "CANCEL_REFUND",
        }
        res = await client.post("/open-matches", json=open_match_payload)
        assert res.status_code == 201, res.text
        match_data = res.json()
        match_id = match_data["id"]

        # Price per player: (30000 + 2000) / 4 = 8,000 pesewas (GH₵ 80.00)
        assert match_data["price_per_player_pesewas"] == 8000
        assert match_data["open_seats"] == 3
        assert match_data["status"] == "OPEN"

        # 3 players join the open match
        players_to_join = [
            ("Kofi Mensah", "0551112233"),
            ("Ama Boateng", "0203334455"),
            ("Daniel Kojo", "0275556677"),
        ]

        for name, phone in players_to_join:
            join_res = await client.post(
                f"/open-matches/{match_id}/join",
                json={"player_name": name, "player_phone": phone},
            )
            assert join_res.status_code == 200

        # After 3 players joined, match is now FULL
        res_full = await client.get(f"/open-matches/{match_id}")
        assert res_full.status_code == 200
        data_full = res_full.json()
        assert data_full["status"] == "FULL"
        assert data_full["open_seats"] == 0
        assert len(data_full["confirmed_players"]) == 4

        # Total revenue collected covers total cost
        total_collected = data_full["price_per_player_pesewas"] * 4
        assert total_collected >= 32000
