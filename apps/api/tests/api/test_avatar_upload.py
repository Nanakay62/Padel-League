"""Integration tests for player profile avatar upload, magic byte validation, and storage."""

import io

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

# Minimal 1x1 valid image binary headers
TINY_JPEG = (
    b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00"
    b"\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t"
    b"\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a"
    b"\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342"
    b"\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f"
    b"\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00"
    b"\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01"
    b"\x00\x00?\x00\xbf\x00\xff\xd9"
)

TINY_PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00"
    b"\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82"
)


async def _get_auth_token(client: AsyncClient, email: str, name: str) -> str:
    await client.post(
        "/auth/register",
        json={"email": email, "password": "StrongPassword123!", "name": name},
    )
    login_res = await client.post(
        "/auth/login",
        json={"email": email, "password": "StrongPassword123!"},
    )
    return str(login_res.json()["access_token"])


@pytest.mark.asyncio
async def test_upload_avatar_unauthenticated_returns_401() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        files = {"file": ("avatar.jpg", io.BytesIO(TINY_JPEG), "image/jpeg")}
        res = await client.post("/me/avatar", files=files)
        assert res.status_code == 401


@pytest.mark.asyncio
async def test_upload_avatar_valid_jpeg_updates_profile() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await _get_auth_token(client, "avatar.user@example.com", "Avatar User")
        headers = {"Authorization": f"Bearer {token}"}

        # Check initial profile has no avatar
        me_res = await client.get("/me", headers=headers)
        assert me_res.status_code == 200
        assert me_res.json().get("avatar_url") is None

        # Upload JPEG
        files = {"file": ("my_photo.jpg", io.BytesIO(TINY_JPEG), "image/jpeg")}
        upload_res = await client.post("/me/avatar", headers=headers, files=files)
        assert upload_res.status_code == 200, upload_res.text
        data = upload_res.json()
        assert data["avatar_url"] is not None
        assert data["avatar_url"].startswith("/static/uploads/avatars/")
        assert data["avatar_url"].endswith(".jpg")

        # Verify GET /me returns the updated avatar_url
        get_res = await client.get("/me", headers=headers)
        assert get_res.status_code == 200
        assert get_res.json()["avatar_url"] == data["avatar_url"]


@pytest.mark.asyncio
async def test_upload_avatar_valid_png_updates_profile() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await _get_auth_token(client, "png.user@example.com", "PNG User")
        headers = {"Authorization": f"Bearer {token}"}

        files = {"file": ("avatar.png", io.BytesIO(TINY_PNG), "image/png")}
        res = await client.post("/me/avatar", headers=headers, files=files)
        assert res.status_code == 200
        assert res.json()["avatar_url"].endswith(".png")


@pytest.mark.asyncio
async def test_upload_avatar_invalid_magic_bytes_rejected() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await _get_auth_token(client, "fake.image@example.com", "Fake Image")
        headers = {"Authorization": f"Bearer {token}"}

        # File claims to be image/jpeg but content is plain text
        fake_content = b"This is a text file spoofing as a jpeg image."
        files = {"file": ("fake.jpg", io.BytesIO(fake_content), "image/jpeg")}
        res = await client.post("/me/avatar", headers=headers, files=files)
        assert res.status_code == 400
        assert (
            "magic" in res.json()["detail"].lower()
            or "invalid" in res.json()["detail"].lower()
        )


@pytest.mark.asyncio
async def test_upload_avatar_oversized_rejected() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await _get_auth_token(client, "oversized@example.com", "Big File")
        headers = {"Authorization": f"Bearer {token}"}

        # Over 5 MB file
        big_content = TINY_JPEG + b"0" * (5 * 1024 * 1024 + 100)
        files = {"file": ("big.jpg", io.BytesIO(big_content), "image/jpeg")}
        res = await client.post("/me/avatar", headers=headers, files=files)
        assert res.status_code in (413, 422, 400)
