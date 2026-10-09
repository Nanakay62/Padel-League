import re
from abc import ABC, abstractmethod

from app.config import settings


class SmsProvider(ABC):
    @abstractmethod
    async def send_sms(self, phone_e164: str, message: str) -> bool:
        """Deliver an SMS message to a phone number. Returns True on success."""


class ConsoleSmsProvider(SmsProvider):
    """Dev provider that logs SMS to terminal with the code visible for developer testing."""

    async def send_sms(self, phone_e164: str, message: str) -> bool:
        # Print for local terminal visibility in dev
        print(f"[DEV SMS -> {phone_e164}]: {message}")
        return True


class TestMemorySmsProvider(SmsProvider):
    """Test-only provider that retains the last code in memory, strictly enabled when ENVIRONMENT == 'test'."""

    def __init__(self) -> None:
        self.sent_messages: list[tuple[str, str]] = []
        self._last_code: str | None = None

    async def send_sms(self, phone_e164: str, message: str) -> bool:
        self.sent_messages.append((phone_e164, message))
        match = re.search(r"\b(\d{6})\b", message)
        if match:
            self._last_code = match.group(1)
        return True

    def get_last_code(self) -> str | None:
        if settings.environment != "test":
            raise RuntimeError(
                "Accessing in-memory OTP codes is strictly disabled outside test environment"
            )
        return self._last_code


class ProductionSmsProvider(SmsProvider):
    """Production provider stub: masks phone numbers, never stores codes in memory."""

    async def send_sms(self, phone_e164: str, message: str) -> bool:
        # In production, dispatch to SMS gateway without logging OTP codes
        _ = phone_e164[:4] + "****" + phone_e164[-3:]
        return True


_test_sms_provider = TestMemorySmsProvider()
_console_sms_provider = ConsoleSmsProvider()
_prod_sms_provider = ProductionSmsProvider()


def get_sms_provider() -> SmsProvider:
    if settings.environment == "test":
        return _test_sms_provider
    elif settings.environment == "development":
        return _console_sms_provider
    return _prod_sms_provider


# Backward compatibility alias for tests importing default_sms_provider
default_sms_provider = _test_sms_provider
