"""Tests for Expo push token registration, updates, and deactivation."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.identity.service import IdentityService
from app.main import app
from tests.conftest import db_session_maker


@pytest.mark.asyncio
async def test_push_token_lifecycle():
    async with db_session_maker() as db:
        identity_svc = IdentityService(db)
        user = await identity_svc.create_user(
            phone_e164="+233240099555", name="Akosua Mensah", role="PLAYER"
        )
        token = identity_svc.create_access_token(user.id, user.phone_e164, user.role)

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # 1. Register Expo Push Token
            reg_resp = await client.post(
                "/me/push-tokens",
                json={
                    "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
                    "device_os": "android",
                },
                headers={"Authorization": f"Bearer {token}"},
            )
            assert reg_resp.status_code == 200
            data = reg_resp.json()
            assert data["token"] == "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
            assert data["device_os"] == "android"
            assert data["is_active"] is True

            # 2. Re-registering same token is idempotent and updates OS/timestamp
            re_resp = await client.post(
                "/me/push-tokens",
                json={
                    "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
                    "device_os": "ios",
                },
                headers={"Authorization": f"Bearer {token}"},
            )
            assert re_resp.status_code == 200
            assert re_resp.json()["device_os"] == "ios"

            # 3. Deactivate / Delete token
            del_resp = await client.delete(
                "/me/push-tokens/ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert del_resp.status_code == 200
            assert del_resp.json()["status"] == "deactivated"
