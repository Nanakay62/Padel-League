"""Integration tests for rating endpoints, history, and level bands."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.identity.service import IdentityService
from app.main import app
from app.ratings.models import RatingEvent
from tests.conftest import db_session_maker


@pytest.mark.asyncio
async def test_get_level_bands_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/ratings/level-bands")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 5
        band_names = [b["name"] for b in data]
        assert "Beginner" in band_names
        assert "Intermediate" in band_names
        assert "Advanced" in band_names
        assert "Expert" in band_names


@pytest.mark.asyncio
async def test_get_my_rating_history_endpoint():
    async with db_session_maker() as db:
        identity_svc = IdentityService(db)
        player = await identity_svc.create_user(
            phone_e164="+233240099881", name="Kwadwo Rating", role="PLAYER"
        )
        token = identity_svc.create_access_token(
            player.id, player.phone_e164, player.role
        )

        # Seed two RatingEvent rows for this player
        ev1 = RatingEvent(
            user_id=player.id,
            match_id="test_match_01",
            rating_before=2.50,
            rating_after=2.58,
            delta=0.08,
            k_factor=0.30,
            explanation="+0.08: You won 16-8 against higher rated pair",
        )
        ev2 = RatingEvent(
            user_id=player.id,
            match_id="test_match_02",
            rating_before=2.58,
            rating_after=2.64,
            delta=0.06,
            k_factor=0.30,
            explanation="+0.06: You won 14-10 in close contest",
        )
        db.add_all([ev1, ev2])
        await db.commit()

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get(
                "/me/rating-history",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["current_rating"] == 2.64
            assert data["level_band"] == "Improver"
            assert data["is_provisional"] is True
            assert len(data["history"]) == 2
            assert data["history"][0]["delta"] == 0.08
            assert data["history"][1]["delta"] == 0.06
