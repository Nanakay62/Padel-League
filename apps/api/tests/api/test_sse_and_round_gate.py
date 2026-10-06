"""Tests for round gate enforcement and SSE live event stream."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.events.models import Event, EventMatch, EventPlayer, EventRound
from app.identity.service import IdentityService
from app.main import app
from tests.conftest import db_session_maker


@pytest.mark.asyncio
async def test_round_gate_prevents_premature_advance():
    async with db_session_maker() as db:
        identity_svc = IdentityService(db)
        org = await identity_svc.create_user(
            phone_e164="+233240099001", name="Coach Kojo", role="ORGANISER"
        )
        org_token = identity_svc.create_access_token(org.id, org.phone_e164, org.role)

        event = Event(
            title="Gated Americano",
            venue_name="Accra Club",
            format="AMERICANO",
            courts=1,
            max_players=4,
            status="LIVE",
            point_target=24,
            planned_rounds=3,
        )
        db.add(event)
        await db.flush()

        players = [
            EventPlayer(event_id=event.id, name=f"Player {i}") for i in range(1, 5)
        ]
        db.add_all(players)
        await db.flush()

        # Create round 1 with 1 uncompleted match
        r1 = EventRound(event_id=event.id, round_number=1, status="IN_PROGRESS")
        db.add(r1)
        await db.flush()

        m1 = EventMatch(
            round_id=r1.id,
            court_number=1,
            team_a_p1=players[0].name,
            team_a_p2=players[1].name,
            team_b_p1=players[2].name,
            team_b_p2=players[3].name,
            status="SCHEDULED",
        )
        db.add(m1)
        await db.commit()

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # Attempt to advance to next round while match is uncompleted
            adv_resp = await client.post(
                f"/events/{event.id}/rounds/next",
                headers={"Authorization": f"Bearer {org_token}"},
            )
            assert adv_resp.status_code == 409
            assert "unreported or incomplete" in adv_resp.json()["detail"].lower()

            # Now submit score for match 1: 14 - 10 = 24
            score_resp = await client.post(
                f"/events/{event.id}/rounds/{r1.id}/matches/{m1.id}/score",
                json={
                    "team_a_score": 14,
                    "team_b_score": 10,
                    "result_id": "res_gate_001",
                    "entered_by": "Player 1",
                },
            )
            assert score_resp.status_code == 200

            # Now advance to next round should succeed
            adv_success = await client.post(
                f"/events/{event.id}/rounds/next",
                headers={"Authorization": f"Bearer {org_token}"},
            )
            assert adv_success.status_code == 201
            assert adv_success.json()["round_number"] == 2


@pytest.mark.asyncio
async def test_live_stream_endpoint():
    async with db_session_maker() as db:
        event = Event(
            title="Streaming Event",
            venue_name="Labone Padel",
            format="AMERICANO",
            courts=1,
            max_players=4,
            status="LIVE",
        )
        db.add(event)
        await db.commit()

        transport = ASGITransport(app=app)
        async with (
            AsyncClient(transport=transport, base_url="http://test") as client,
            client.stream(
                "GET", f"/events/{event.id}/stream?heartbeats=1"
            ) as stream_resp,
        ):
            assert stream_resp.status_code == 200
            assert "text/event-stream" in stream_resp.headers.get("content-type", "")
            first_chunk = await anext(stream_resp.aiter_text())
            assert "data:" in first_chunk
