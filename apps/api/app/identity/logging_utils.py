"""Privacy-conscious logging utilities and redaction filters for Padel Ghana."""

import logging
import re


def mask_email(email: str | None) -> str:
    """Mask email for privacy-safe logging (e.g. ko***h@example.com)."""
    if not email or "@" not in email:
        return "[redacted-email]"
    local, domain = email.strip().split("@", 1)
    if len(local) <= 2:
        masked_local = local[0] + "***"
    else:
        masked_local = local[:2] + "***" + local[-1]
    return f"{masked_local}@{domain}"


def mask_phone(phone: str | None) -> str:
    """Mask phone for privacy-safe logging (e.g. +233****567)."""
    if not phone or len(phone) < 7:
        return "[redacted-phone]"
    return phone[:4] + "****" + phone[-3:]


class SensitiveDataFilter(logging.Filter):
    """Logging filter that scrubs tokens, passwords, reset links, and unmasked emails from all log records."""

    EMAIL_PATTERN = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b")
    LINK_PATTERN = re.compile(
        r"https?://[^\s]+[?&]token=[A-Za-z0-9_\-\.]+",
        re.IGNORECASE,
    )
    TOKEN_PATTERN = re.compile(
        r"(?:token|password|bearer|secret)[=:\s]+(['\"]?)([^\s'\"]{6,})(['\"]?)",
        re.IGNORECASE,
    )

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            # Redact full reset links with tokens
            record.msg = self.LINK_PATTERN.sub("[REDACTED_LINK]", record.msg)
            # Redact sensitive tokens and passwords
            record.msg = self.TOKEN_PATTERN.sub("[REDACTED_SECRET]", record.msg)
            # Mask emails for privacy
            record.msg = self.EMAIL_PATTERN.sub(
                lambda m: mask_email(m.group(0)), record.msg
            )
        return True
