"""Throwaway test server runner for real-API integration tests."""

import asyncio
import os
import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

# Force test environment and throwaway database
os.environ["ENVIRONMENT"] = "test"
db_path = root_dir / "throwaway_test.db"
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{db_path}"

import uvicorn

# Import all model modules to register their models on Base.metadata
import app.billing.models
import app.events.models
import app.identity.models
import app.leagues.models
import app.notify.models
import app.ratings.models
import app.venues.models  # noqa: F401
from app.db import Base, engine
from app.main import create_app


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


def run_server(port: int = 8099) -> None:
    asyncio.run(init_db())
    app = create_app()
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="warning")


if __name__ == "__main__":
    port_arg = int(sys.argv[1]) if len(sys.argv) > 1 else 8099
    run_server(port_arg)
