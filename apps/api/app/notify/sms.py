"""SMS provider interface and console/dev implementation."""

from abc import ABC, abstractmethod


class SmsProvider(ABC):
    @abstractmethod
    async def send_sms(self, phone_e164: str, message: str) -> bool:
        """Deliver an SMS message to a phone number. Returns True on success."""


class ConsoleSmsProvider(SmsProvider):
    """Dev and testing provider that logs SMS messages and retains them in-memory."""

    def __init__(self) -> None:
        self.sent_messages: list[tuple[str, str]] = []

    async def send_sms(self, phone_e164: str, message: str) -> bool:
        self.sent_messages.append((phone_e164, message))
        # Print for local terminal visibility
        print(f"[SMS -> {phone_e164}]: {message}")
        return True


# Global default instance for dev and tests
default_sms_provider = ConsoleSmsProvider()


def get_sms_provider() -> SmsProvider:
    return default_sms_provider
