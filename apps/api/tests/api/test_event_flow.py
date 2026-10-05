"""End-to-end integration test for the Americano vertical slice."""

import uuid

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_full_americano_event_flow() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Create an Americano event
        create_payload = {
            "title": "Thursday Americano",
            "venue_name": "Accra Padel Club",
            "format": "AMERICANO",
            "courts": 2,
            "point_target": 24,
            "planned_rounds": 8,
        }
        res = await client.post("/events", json=create_payload)
        assert res.status_code == 201, res.text
        event_data = res.json()
        event_id = event_data["id"]
        assert event_data["title"] == "Thursday Americano"
        assert event_data["point_target"] == 24

        # 2. Add 11 ad-hoc players by name
        player_names = [
            "Kwame Mensah",
            "Nana Konadu",
            "Ama Boateng",
            "Kofi Atta",
            "Abena Serwaa",
            "Yaw Osei",
            "Akua Darko",
            "Kojo Antwi",
            "Esi Mansa",
            "Kwaku Duah",
            "Afia Poku",
        ]
        res = await client.post(
            f"/events/{event_id}/players",
            json={"names": player_names},
        )
        assert res.status_code == 200
        players_res = res.json()
        assert len(players_res["players"]) == 11

        # 3. Generate Round 1 (courts, partners, sit-outs)
        res = await client.post(f"/events/{event_id}/rounds:next")
        assert res.status_code == 200
        round_1 = res.json()
        assert round_1["round_number"] == 1
        assert (
            len(round_1["matches"]) == 2
        )  # 2 courts for 11 players = 8 playing, 3 sit out
        assert len(round_1["sit_outs"]) == 3

        match_1_id = round_1["matches"][0]["id"]
        match_2_id = round_1["matches"][1]["id"]

        # 4. Try generating next round before round 1 is reported -> 409 Conflict
        res = await client.post(f"/events/{event_id}/rounds:next")
        assert res.status_code == 409

        # 5. Submit an invalid score (sum does not equal point_target 24) -> 422 Unprocessable
        bad_score = {
            "result_id": str(uuid.uuid4()),
            "team_a_score": 15,
            "team_b_score": 15,  # 30 != 24
            "entered_by": "Kwame Mensah",
        }
        res = await client.post(
            f"/events/{event_id}/matches/{match_1_id}/score",
            json=bad_score,
        )
        assert res.status_code == 422

        # 6. Submit a valid score for Match 1
        result_id_1 = str(uuid.uuid4())
        valid_score_1 = {
            "result_id": result_id_1,
            "team_a_score": 14,
            "team_b_score": 10,  # 14 + 10 = 24
            "entered_by": "Kwame Mensah",
        }
        res = await client.post(
            f"/events/{event_id}/matches/{match_1_id}/score",
            json=valid_score_1,
        )
        assert res.status_code == 200
        score_res = res.json()
        assert score_res["team_a_score"] == 14
        assert score_res["team_b_score"] == 10

        # 7. Test Idempotency: Replaying the same result_id returns 200 without double-applying
        res_replay = await client.post(
            f"/events/{event_id}/matches/{match_1_id}/score",
            json=valid_score_1,
        )
        assert res_replay.status_code == 200
        assert res_replay.json()["team_a_score"] == 14

        # 8. Check live state (current round + leaderboard)
        res = await client.get(f"/events/{event_id}/live")
        assert res.status_code == 200
        live_data = res.json()
        assert live_data["current_round"] == 1
        assert len(live_data["leaderboard"]) == 11

        # 9. Complete Match 2
        result_id_2 = str(uuid.uuid4())
        valid_score_2 = {
            "result_id": result_id_2,
            "team_a_score": 13,
            "team_b_score": 11,
            "entered_by": "Kojo Antwi",
        }
        res = await client.post(
            f"/events/{event_id}/matches/{match_2_id}/score",
            json=valid_score_2,
        )
        assert res.status_code == 200

        # 10. Generate Round 2 now that Round 1 is complete
        res = await client.post(f"/events/{event_id}/rounds:next")
        assert res.status_code == 200
        round_2 = res.json()
        assert round_2["round_number"] == 2
        assert len(round_2["matches"]) == 2

        # 11. Fetch WhatsApp summary
        res = await client.get(f"/events/{event_id}/summary.txt")
        assert res.status_code == 200
        text = res.text
        assert "PADEL GHANA" in text
        assert "Thursday Americano" in text
        assert "Accra Padel Club" in text
