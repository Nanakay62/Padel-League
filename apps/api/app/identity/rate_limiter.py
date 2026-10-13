"""Rate limiting with progressive backoff for authentication endpoints.

Prevents brute-force credential stuffing and password guessing without hard lockouts
that would enable Denial-of-Service attacks against legitimate account owners.
"""

import asyncio
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status


def _utc_now() -> datetime:
    return datetime.now(UTC)


class AuthRateLimiter:
    """Sliding-window rate limiter with progressive backoff per IP and per account."""

    def __init__(self, window_minutes: int = 15) -> None:
        self.window = timedelta(minutes=window_minutes)
        # key -> list of attempt timestamps
        self._history: dict[str, list[datetime]] = {}

    def _clean_and_get(self, key: str, now: datetime) -> list[datetime]:
        cutoff = now - self.window
        recent = [t for t in self._history.get(key, []) if t >= cutoff]
        self._history[key] = recent
        return recent

    async def check_and_record(
        self,
        action: str,
        client_ip: str | None,
        account_identifier: str | None = None,
        max_attempts_before_delay: int = 3,
        max_attempts_hard_limit: int = 10,
    ) -> float:
        """Check rate limits and apply progressive delay.

        Returns delay in seconds. Raises HTTP 429 if hard limit exceeded.
        """
        now = _utc_now()
        keys_to_check: list[str] = []

        if client_ip:
            keys_to_check.append(f"{action}:ip:{client_ip}")
        if account_identifier:
            norm_account = account_identifier.strip().lower()
            keys_to_check.append(f"{action}:account:{norm_account}")

        ip_count = 0
        if client_ip:
            recent_ip = self._clean_and_get(f"{action}:ip:{client_ip}", now)
            ip_count = len(recent_ip)
            # Only IP addresses can hit hard lockout (HTTP 429) to prevent attackers
            # from locking out real users via account identifier spam
            if ip_count >= max_attempts_hard_limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many authentication attempts from this IP address. Please wait before trying again.",
                    headers={"Retry-After": "60"},
                )

        acct_count = 0
        if account_identifier:
            norm_account = account_identifier.strip().lower()
            recent_acct = self._clean_and_get(f"{action}:account:{norm_account}", now)
            acct_count = len(recent_acct)

        # Progressive delay calculation based on higher of IP or account attempts:
        max_recent_count = max(ip_count, acct_count)
        delay = 0.0
        if max_recent_count >= max_attempts_before_delay:
            excess = max_recent_count - max_attempts_before_delay + 1
            delay = min(float(excess) * 0.25, 2.0)

        # Record this attempt
        for k in keys_to_check:
            self._history[k].append(now)

        if delay > 0:
            await asyncio.sleep(delay)

        return delay

    def clear(self) -> None:
        self._history.clear()


auth_rate_limiter = AuthRateLimiter()
