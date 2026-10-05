"""SQLAdmin back office integration."""

from fastapi import FastAPI
from sqladmin import Admin
from sqlalchemy.ext.asyncio import AsyncEngine


def setup_admin(app: FastAPI, engine: AsyncEngine) -> Admin:
    """Mount SQLAdmin onto FastAPI application."""
    admin = Admin(app, engine, title="Padel Ghana Admin")
    return admin
