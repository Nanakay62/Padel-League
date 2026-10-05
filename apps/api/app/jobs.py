"""Background jobs application using Procrastinate (PostgreSQL-backed queue)."""

import procrastinate

from app.config import settings

# In production and async contexts, Procrastinate uses psycopg connector
app = procrastinate.App(
    connector=procrastinate.AiopgConnector()
    if "aiopg" in settings.database_url
    else procrastinate.PsycopgConnector(
        conninfo=settings.database_url.replace("+psycopg", "")
    )
)


@app.task
async def noop_health_job() -> None:
    """Sample task to verify worker execution."""
