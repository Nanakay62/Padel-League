"""Organizer tools and event cancellation reason schema

Revision ID: 0007_organizer_schema
Revises: 0006_notifications_schema
Create Date: 2026-10-06 06:10:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0007_organizer_schema"
down_revision: str | None = "0006_notifications_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "events",
        sa.Column("cancellation_reason", sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("events", "cancellation_reason")
