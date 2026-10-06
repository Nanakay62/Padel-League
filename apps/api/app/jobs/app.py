"""Procrastinate app definition for Postgres-backed background jobs."""

import procrastinate

from app.config import settings

# Strip SQLAlchemy dialect prefix for direct psycopg connection
procrastinate_conninfo = settings.database_url.replace(
    "postgresql+psycopg://", "postgresql://"
)

app = procrastinate.App(
    connector=procrastinate.PsycopgConnector(conninfo=procrastinate_conninfo)
)
