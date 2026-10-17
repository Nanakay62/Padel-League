"""Pure domain functions for photo upload validation (magic bytes and sizing)."""

ALLOWED_PHOTO_MIME_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


def validate_photo_magic_bytes(content: bytes, declared_mime_type: str) -> str:
    """Validates the binary header of an uploaded image against its declared MIME type.

    Returns the canonical extension (e.g. '.jpg', '.png', '.webp') if valid.
    Raises ValueError if content length is insufficient or magic bytes do not match.
    """
    if len(content) < 12:
        raise ValueError("File content is too small to be a valid image.")

    mime = declared_mime_type.lower().strip()

    if mime in ("image/jpeg", "image/jpg"):
        if not content.startswith(b"\xff\xd8\xff"):
            raise ValueError("Magic byte verification failed for JPEG image.")
        return ".jpg"

    if mime == "image/png":
        if not content.startswith(b"\x89PNG\r\n\x1a\n"):
            raise ValueError("Magic byte verification failed for PNG image.")
        return ".png"

    if mime == "image/webp":
        if not (content.startswith(b"RIFF") and content[8:12] == b"WEBP"):
            raise ValueError("Magic byte verification failed for WebP image.")
        return ".webp"

    raise ValueError(f"Unsupported image MIME type: {declared_mime_type}")
