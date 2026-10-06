"""Production readiness, health metadata, version gating, and SSE buffering tests."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.config import settings
from app.main import app


@pytest.mark.asyncio
async def test_health_endpoint_metadata() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"
        assert data["app"] == "Padel Ghana Platform"
        assert data["currency"] == "GHS"
        assert data["timezone"] == "Africa/Accra"
        assert data["version"] == "1.0.0"


@pytest.mark.asyncio
async def test_app_version_gating() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/app/version")
        assert res.status_code == 200
        data = res.json()
        assert "minimum_version" in data
        assert "latest_version" in data
        assert data["force_update"] is False


@pytest.mark.asyncio
async def test_unbuffered_sse_headers() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create an event
        res = await client.post(
            "/events",
            json={
                "title": "SSE Production Test",
                "format": "AMERICANO",
                "point_target": 24,
                "courts": 1,
            },
        )
        assert res.status_code == 201
        event_id = res.json()["id"]

        # Request SSE stream with single heartbeat
        stream_res = await client.get(
            f"/events/{event_id}/stream?heartbeats=1",
        )
        assert stream_res.status_code == 200
        assert stream_res.headers.get("x-accel-buffering") == "no"
        assert "no-cache" in stream_res.headers.get("cache-control", "")
        assert "text/event-stream" in stream_res.headers.get("content-type", "")


def test_production_settings_invariants() -> None:
    assert settings.currency == "GHS"
    assert settings.timezone == "Africa/Accra"
    assert settings.rounding_unit_pesewas == 100
    assert settings.seat_hold_minutes >= 10  # Long hold for MoMo approvals
