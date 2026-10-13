import logging
from collections.abc import AsyncGenerator, Callable
from contextlib import asynccontextmanager
from typing import Any

import jwt
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.admin import setup_admin
from app.config import settings
from app.db import engine
from app.identity.logging_utils import SensitiveDataFilter


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup tasks
    yield
    # Shutdown tasks
    await engine.dispose()


def create_app() -> FastAPI:
    # Ensure sensitive data redaction filter is attached to logging
    logging.getLogger().addFilter(SensitiveDataFilter())
    logging.getLogger("uvicorn").addFilter(SensitiveDataFilter())
    logging.getLogger("app").addFilter(SensitiveDataFilter())

    app = FastAPI(
        title=settings.app_name,
        lifespan=lifespan,
    )

    @app.middleware("http")
    async def add_security_headers(
        request: Request, call_next: Callable[[Request], Any]
    ) -> Response:
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        if settings.environment != "development" or request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )
        return response

    @app.middleware("http")
    async def admin_role_separation_middleware(
        request: Request, call_next: Callable[[Request], Any]
    ) -> Response:
        if (
            request.url.path.startswith("/admin")
            and request.url.path != "/admin/verify-access"
        ):
            player_cookie = request.cookies.get("padel_refresh_token")
            auth_header = request.headers.get("Authorization")
            bearer_token = (
                auth_header.split(" ")[1]
                if auth_header and auth_header.startswith("Bearer ")
                else None
            )

            # Player cookie or player bearer token rejected on admin paths
            token_to_check = request.cookies.get("padel_admin_token") or bearer_token
            if player_cookie and not request.cookies.get("padel_admin_token"):
                return Response(
                    content='{"detail":"Admin privileges required. Player credentials are not permitted."}',
                    status_code=403,
                    media_type="application/json",
                )

            if token_to_check:
                try:
                    payload = jwt.decode(
                        token_to_check,
                        settings.secret_key,
                        algorithms=[settings.jwt_algorithm],
                    )
                    if payload.get("role") != "ADMIN":
                        return Response(
                            content='{"detail":"Admin privileges required. Player credentials are not permitted."}',
                            status_code=403,
                            media_type="application/json",
                        )
                except (jwt.PyJWTError, ValueError):
                    return Response(
                        content='{"detail":"Invalid admin credentials."}',
                        status_code=401,
                        media_type="application/json",
                    )
        return await call_next(request)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["System"])
    async def health_check() -> dict[str, Any]:
        return {
            "status": "ok",
            "app": settings.app_name,
            "currency": settings.currency,
            "timezone": settings.timezone,
            "version": "1.0.0",
        }

    @app.get("/app/version", tags=["System"])
    async def app_version() -> dict[str, Any]:
        return {
            "minimum_version": "1.0.0",
            "latest_version": "1.0.0",
            "force_update": False,
        }

    from app.billing.routes import router as billing_router
    from app.events.routes import router as events_router
    from app.identity.routes import router as identity_router
    from app.leagues.routes import router as leagues_router
    from app.notify.routes import router as notify_router
    from app.ratings.routes import router as ratings_router
    from app.venues.routes import router as venues_router

    app.include_router(billing_router)
    app.include_router(events_router)
    app.include_router(identity_router)
    app.include_router(leagues_router)
    app.include_router(notify_router)
    app.include_router(ratings_router)
    app.include_router(venues_router)

    # Mount back office admin
    setup_admin(app, engine)

    return app


app = create_app()
