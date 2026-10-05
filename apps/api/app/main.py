"""Main FastAPI application factory."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.admin import setup_admin
from app.config import settings
from app.db import engine


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup tasks
    yield
    # Shutdown tasks
    await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        lifespan=lifespan,
    )

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

    # Include Routers
    from app.events.routes import router as events_router

    app.include_router(events_router)

    # Mount back office admin
    setup_admin(app, engine)

    return app


app = create_app()
