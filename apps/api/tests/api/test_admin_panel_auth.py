"""Security tests ensuring SQLAdmin and /admin endpoints strictly reject unauthenticated access."""

import jwt
import pytest
from httpx import ASGITransport, AsyncClient

from app.config import settings
from app.main import app


@pytest.mark.asyncio
async def test_anonymous_admin_request_rejected() -> None:
    """Anonymous requests with no credentials must NEVER access /admin data views."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Requesting /admin/ redirects to login
        resp_root = await client.get("/admin/", follow_redirects=False)
        assert resp_root.status_code == 302
        assert resp_root.headers.get("location") == "http://test/admin/login"

        # Direct view access redirects to login
        resp_venues = await client.get("/admin/venue/list", follow_redirects=False)
        assert resp_venues.status_code == 302
        assert resp_venues.headers.get("location") == "http://test/admin/login"

        # Following redirect leads to the login page, NOT data
        resp_followed = await client.get("/admin/venue/list", follow_redirects=True)
        assert resp_followed.status_code == 200
        assert "/admin/login" in str(resp_followed.url)


@pytest.mark.asyncio
async def test_player_credentials_rejected_on_admin() -> None:
    """Player credentials must be rejected with 403 Forbidden on /admin."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        player_token = jwt.encode(
            {"sub": "player-123", "role": "PLAYER"},
            settings.secret_key,
            algorithm=settings.jwt_algorithm,
        )
        resp = await client.get(
            "/admin/venue/list",
            headers={"Authorization": f"Bearer {player_token}"},
        )
        assert resp.status_code == 403


@pytest.mark.asyncio
async def test_super_admin_credentials_allowed_on_admin() -> None:
    """Super Admin credentials can authenticate on /admin views."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        admin_token = jwt.encode(
            {"sub": "super-admin-1", "role": "SUPER_ADMIN"},
            settings.secret_key,
            algorithm=settings.jwt_algorithm,
        )
        resp = await client.get(
            "/admin/venue/list",
            headers={"Authorization": f"Bearer {admin_token}"},
            follow_redirects=False,
        )
        assert resp.status_code == 200
