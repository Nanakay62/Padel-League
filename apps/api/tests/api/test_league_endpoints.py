"""Integration tests for pair and box league endpoints, shared matches, and cycle promotion/relegation."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.identity.service import IdentityService
from app.leagues.schemas import BoxCreate, LeagueCreate
from app.leagues.service import LeagueService
from app.main import app
from tests.conftest import db_session_maker


@pytest.mark.asyncio
async def test_league_lifecycle_and_shared_match_scoring():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        async with db_session_maker() as db:
            identity_svc = IdentityService(db)
            organiser = await identity_svc.create_user(
                phone_e164="+233240001122", name="League Organiser", role="ORGANISER"
            )
            org_token = identity_svc.create_access_token(
                organiser.id, organiser.phone_e164, organiser.role
            )

            p1 = await identity_svc.create_user(
                phone_e164="+233240001133", name="Player One", role="PLAYER"
            )
            p2 = await identity_svc.create_user(
                phone_e164="+233240001144", name="Player Two", role="PLAYER"
            )
            p3 = await identity_svc.create_user(
                phone_e164="+233240001155", name="Player Three", role="PLAYER"
            )
            p4 = await identity_svc.create_user(
                phone_e164="+233240001166", name="Player Four", role="PLAYER"
            )

        headers = {"Authorization": f"Bearer {org_token}"}

        # 1. Create League
        league_payload = {
            "title": "Greater Accra Box League Season 1",
            "season_name": "Autumn 2026",
            "promote_count": 1,
            "relegate_count": 1,
            "cycle_weeks": 4,
        }
        res = await client.post("/leagues", json=league_payload, headers=headers)
        assert res.status_code == 201, res.text
        league = res.json()
        league_id = league["id"]

        # 2. Create Box
        box_payload = {
            "box_number": 1,
            "name": "Division 1 - Box A",
            "min_rating": 3.0,
            "max_rating": 4.5,
        }
        res = await client.post(
            f"/leagues/{league_id}/boxes", json=box_payload, headers=headers
        )
        assert res.status_code == 201, res.text
        box = res.json()
        box_id = box["id"]

        # 3. Add 4 Pairs to Box
        pairs_payload = [
            {"player1_id": p1.id, "player2_id": p2.id, "pair_name": "Thunder Aces"},
            {"player1_id": p3.id, "player2_id": p4.id, "pair_name": "Spin Masters"},
            {"player1_id": p1.id, "player2_id": p3.id, "pair_name": "Accra Smash"},
            {"player1_id": p2.id, "player2_id": p4.id, "pair_name": "Coast Volleyers"},
        ]
        created_pairs = []
        for pair_data in pairs_payload:
            p_res = await client.post(
                f"/leagues/{league_id}/boxes/{box_id}/pairs",
                json=pair_data,
                headers=headers,
            )
            assert p_res.status_code == 201, p_res.text
            created_pairs.append(p_res.json())

        assert len(created_pairs) == 4

        # 4. Generate Round-Robin Fixtures
        gen_res = await client.post(
            f"/leagues/{league_id}/boxes/{box_id}/generate-fixtures", headers=headers
        )
        assert gen_res.status_code == 200, gen_res.text
        fixtures_data = gen_res.json()
        # 4 pairs -> 6 fixtures
        assert len(fixtures_data) == 6

        # Verify fixtures are queryable
        get_fix_res = await client.get(f"/leagues/{league_id}/boxes/{box_id}/fixtures")
        assert get_fix_res.status_code == 200
        fixtures = get_fix_res.json()
        assert len(fixtures) == 6
        first_fixture = fixtures[0]
        assert first_fixture["status"] == "SCHEDULED"

        # 5. Score First Match courtside (with result_id idempotency & venue tracking)
        score_payload = {
            "team_a_sets": 2,
            "team_b_sets": 1,
            "team_a_games": 14,
            "team_b_games": 11,
            "result_id": "client-offline-uuid-999",
            "entered_by": "Player One",
            "venue_name": "Accra City Padel Club",
        }
        score_res = await client.post(
            f"/leagues/{league_id}/matches/{first_fixture['id']}/score",
            json=score_payload,
            headers=headers,
        )
        assert score_res.status_code == 200, score_res.text
        scored = score_res.json()
        assert scored["status"] == "SCORE_ENTERED"
        assert scored["team_a_sets"] == 2
        assert scored["venue_name"] == "Accra City Padel Club"

        # Idempotency check: replay exact same score submission
        replay_res = await client.post(
            f"/leagues/{league_id}/matches/{first_fixture['id']}/score",
            json=score_payload,
            headers=headers,
        )
        assert replay_res.status_code == 200
        assert replay_res.json()["result_id"] == "client-offline-uuid-999"

        # 6. Check Standings
        standings_res = await client.get(
            f"/leagues/{league_id}/boxes/{box_id}/standings"
        )
        assert standings_res.status_code == 200, standings_res.text
        standings = standings_res.json()
        assert len(standings) == 4
        # Winner got 3 points, loser got 1 point (played loss)
        assert standings[0]["points"] == 3
        assert standings[1]["points"] == 1


@pytest.mark.asyncio
async def test_league_advance_cycle_promotion_and_relegation_api():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        async with db_session_maker() as db:
            identity_svc = IdentityService(db)
            org = await identity_svc.create_user(
                phone_e164="+233240099001", name="League Org 2", role="ORGANISER"
            )
            org_token = identity_svc.create_access_token(
                org.id, org.phone_e164, org.role
            )

            # Create 8 players for 4 pairs across 2 boxes
            players = []
            for i in range(8):
                p = await identity_svc.create_user(
                    phone_e164=f"+23324009901{i}",
                    name=f"Player L{i}",
                    role="PLAYER",
                )
                players.append(p)

        headers = {"Authorization": f"Bearer {org_token}"}

        # Create League
        res = await client.post(
            "/leagues",
            json={
                "title": "Accra Multi Box League",
                "promote_count": 1,
                "relegate_count": 1,
            },
            headers=headers,
        )
        league_id = res.json()["id"]

        # Create Box 1 and Box 2
        b1_res = await client.post(
            f"/leagues/{league_id}/boxes",
            json={"box_number": 1, "name": "Box 1"},
            headers=headers,
        )
        b1_id = b1_res.json()["id"]

        b2_res = await client.post(
            f"/leagues/{league_id}/boxes",
            json={"box_number": 2, "name": "Box 2"},
            headers=headers,
        )
        b2_id = b2_res.json()["id"]

        # Add 2 pairs to Box 1
        await client.post(
            f"/leagues/{league_id}/boxes/{b1_id}/pairs",
            json={
                "player1_id": players[0].id,
                "player2_id": players[1].id,
                "pair_name": "Box1 Pair A",
            },
            headers=headers,
        )
        await client.post(
            f"/leagues/{league_id}/boxes/{b1_id}/pairs",
            json={
                "player1_id": players[2].id,
                "player2_id": players[3].id,
                "pair_name": "Box1 Pair B",
            },
            headers=headers,
        )

        # Add 2 pairs to Box 2
        await client.post(
            f"/leagues/{league_id}/boxes/{b2_id}/pairs",
            json={
                "player1_id": players[4].id,
                "player2_id": players[5].id,
                "pair_name": "Box2 Pair C",
            },
            headers=headers,
        )
        await client.post(
            f"/leagues/{league_id}/boxes/{b2_id}/pairs",
            json={
                "player1_id": players[6].id,
                "player2_id": players[7].id,
                "pair_name": "Box2 Pair D",
            },
            headers=headers,
        )

        # Advance cycle API
        adv_res = await client.post(
            f"/leagues/{league_id}/advance-cycle",
            headers=headers,
        )
        assert adv_res.status_code == 200
        boxes = adv_res.json()
        assert len(boxes) == 2


@pytest.mark.asyncio
async def test_league_deadline_unplayed_auto_score_job():
    from datetime import UTC, datetime, timedelta

    from app.events.models import EventMatch
    from app.jobs.tasks import auto_score_league_deadlines_task

    async with db_session_maker() as db:
        identity_svc = IdentityService(db)
        await identity_svc.create_user(
            phone_e164="+233240099099", name="Org Task", role="ORGANISER"
        )
        league_svc = LeagueService(db)
        league = await league_svc.create_league(
            LeagueCreate(title="Deadline Test League")
        )
        box = await league_svc.create_box(
            league.id,
            BoxCreate(box_number=1, name="Box Deadlines"),
        )
        # Create an expired match
        past_time = datetime.now(UTC) - timedelta(hours=2)
        expired_match = EventMatch(
            league_id=league.id,
            box_id=box.id,
            team_a_p1="Player A",
            team_a_p2="Player B",
            team_b_p1="Player C",
            team_b_p2="Player D",
            court_number=1,
            deadline_at=past_time,
            status="SCHEDULED",
        )
        db.add(expired_match)
        await db.commit()

        # Run background job
        swept = await auto_score_league_deadlines_task(db)
        assert swept == 1

        # Check match status updated
        await db.refresh(expired_match)
        assert expired_match.status == "SCORE_ENTERED"
        assert expired_match.entered_by == "SYSTEM_DEADLINE_JOB"
