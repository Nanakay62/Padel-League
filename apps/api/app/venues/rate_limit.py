"""Rate limiting and client IP resolution with trusted proxy verification."""

import time
from typing import Annotated

from fastapi import Depends, HTTPException, Request

from app.config import settings


def get_client_ip(request: Request, trusted_proxies: list[str] | None = None) -> str:
    """Extract client IP, trusting proxy headers ONLY if direct peer is a trusted proxy.

    Rules:
    1. If the direct peer (request.client.host) is NOT in trusted_proxies, ignore all proxy
       headers (CF-Connecting-IP, X-Forwarded-For) and return the connection address.
    2. If the direct peer IS in trusted_proxies:
       - Check CF-Connecting-IP first.
       - Otherwise inspect X-Forwarded-For, choosing the right-most untrusted entry.
    """
    proxies = set(
        trusted_proxies if trusted_proxies is not None else settings.trusted_proxies
    )
    direct_peer = request.client.host if request.client else "127.0.0.1"

    if direct_peer not in proxies:
        return direct_peer

    # Direct peer is a trusted proxy. Check headers.
    cf_ip = request.headers.get("cf-connecting-ip")
    if cf_ip and cf_ip.strip():
        return cf_ip.strip()

    xff = request.headers.get("x-forwarded-for")
    if xff and xff.strip():
        ips = [ip.strip() for ip in xff.split(",") if ip.strip()]
        # Walk from right to left to find the right-most untrusted entry
        for ip in reversed(ips):
            if ip not in proxies:
                return ip
        # If all were trusted proxies, return the first
        if ips:
            return ips[0]

    return direct_peer


class QuoteRateLimiter:
    """In-memory rate limiter per IP with automatic idle entry eviction."""

    def __init__(self) -> None:
        self._history: dict[str, list[float]] = {}
        self._last_sweep: float = 0.0

    def check(
        self,
        client_ip: str,
        limit: int | None = None,
        window_seconds: float = 60.0,
    ) -> None:
        max_requests = limit or settings.public_quote_rate_limit
        now = time.time()

        # Evict idle IP entries periodically or when history grows
        if now - self._last_sweep > 60.0 or len(self._history) > 200:
            self._evict_idle(now, window_seconds)

        timestamps = self._history.get(client_ip, [])
        valid = [t for t in timestamps if now - t < window_seconds]

        if len(valid) >= max_requests:
            raise HTTPException(
                status_code=429,
                detail="Too many quote requests. Please wait a minute.",
                headers={"Retry-After": "60"},
            )

        valid.append(now)
        self._history[client_ip] = valid

    def _evict_idle(self, now: float, window_seconds: float) -> None:
        self._last_sweep = now
        dead_ips = []
        for ip, ts in self._history.items():
            alive = [t for t in ts if now - t < window_seconds]
            if not alive:
                dead_ips.append(ip)
            else:
                self._history[ip] = alive
        for ip in dead_ips:
            self._history.pop(ip, None)


quote_limiter = QuoteRateLimiter()


def rate_limit_quote_request(request: Request) -> str:
    """Dependency that enforces rate limiting on public quote endpoint."""
    client_ip = get_client_ip(request)
    quote_limiter.check(client_ip)
    return client_ip


RateLimitedClientIP = Annotated[str, Depends(rate_limit_quote_request)]
