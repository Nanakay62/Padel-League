"""Venue and court pricing fields, bands, hours, and versioning

Revision ID: 0010_venue_and_court_pricing_fields
Revises: 0009_leagues_schema
Create Date: 2026-10-10 12:00:00.000000

Existing price fields report:
- `venues.base_rate_pesewas_per_hour` was non-nullable with a default of 18000 pesewas.
- No `peak_rate_pesewas_per_hour` or old price band columns existed.
- Action: Make `venues.base_rate_pesewas_per_hour` nullable with server_default=None,
  and reset existing venues to NULL so existing venues become unpriced until explicitly set.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0010_venue_and_court_pricing_fields"
down_revision: str | None = "0009_leagues_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Update venues base_rate_pesewas_per_hour to nullable and reset existing rows to unpriced (NULL)
    op.alter_column(
        "venues",
        "base_rate_pesewas_per_hour",
        existing_type=sa.Integer(),
        nullable=True,
        server_default=None,
    )
    op.execute("UPDATE venues SET base_rate_pesewas_per_hour = NULL")

    # 2. Add rich profile and pricing fields to venues
    op.add_column(
        "venues",
        sa.Column(
            "description", sa.String(length=1000), nullable=False, server_default=""
        ),
    )
    op.add_column(
        "venues",
        sa.Column("photos", sa.JSON(), nullable=False, server_default="[]"),
    )
    op.add_column(
        "venues",
        sa.Column("amenities", sa.JSON(), nullable=False, server_default="[]"),
    )
    op.add_column(
        "venues",
        sa.Column("opening_hours", sa.JSON(), nullable=False, server_default="[]"),
    )
    op.add_column(
        "venues",
        sa.Column("price_bands", sa.JSON(), nullable=False, server_default="[]"),
    )
    op.add_column(
        "venues",
        sa.Column(
            "duration_multipliers_bps",
            sa.JSON(),
            nullable=False,
            server_default='{"60": 10000, "90": 10000, "120": 10000}',
        ),
    )
    op.add_column(
        "venues",
        sa.Column("add_ons_config", sa.JSON(), nullable=False, server_default="[]"),
    )
    op.add_column(
        "venues",
        sa.Column("price_version", sa.Integer(), nullable=False, server_default="1"),
    )
    op.add_column(
        "venues",
        sa.Column(
            "price_hash", sa.String(length=64), nullable=False, server_default=""
        ),
    )
    op.add_column(
        "venues",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    # 3. Add court lighting, photos, pricing overrides, and timestamps
    op.add_column(
        "courts",
        sa.Column("lighting", sa.String(length=64), nullable=False, server_default=""),
    )
    op.add_column(
        "courts",
        sa.Column("photos", sa.JSON(), nullable=False, server_default="[]"),
    )
    op.add_column(
        "courts",
        sa.Column("base_rate_pesewas_per_hour", sa.Integer(), nullable=True),
    )
    op.add_column(
        "courts",
        sa.Column("price_bands", sa.JSON(), nullable=False, server_default="[]"),
    )
    op.add_column(
        "courts",
        sa.Column("duration_multipliers_bps", sa.JSON(), nullable=True),
    )
    op.add_column(
        "courts",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )


def downgrade() -> None:
    op.drop_column("courts", "updated_at")
    op.drop_column("courts", "duration_multipliers_bps")
    op.drop_column("courts", "price_bands")
    op.drop_column("courts", "base_rate_pesewas_per_hour")
    op.drop_column("courts", "photos")
    op.drop_column("courts", "lighting")

    op.drop_column("venues", "updated_at")
    op.drop_column("venues", "price_hash")
    op.drop_column("venues", "price_version")
    op.drop_column("venues", "add_ons_config")
    op.drop_column("venues", "duration_multipliers_bps")
    op.drop_column("venues", "price_bands")
    op.drop_column("venues", "opening_hours")
    op.drop_column("venues", "amenities")
    op.drop_column("venues", "photos")
    op.drop_column("venues", "description")

    op.execute(
        "UPDATE venues SET base_rate_pesewas_per_hour = 18000 WHERE base_rate_pesewas_per_hour IS NULL"
    )
    op.alter_column(
        "venues",
        "base_rate_pesewas_per_hour",
        existing_type=sa.Integer(),
        nullable=False,
        server_default="18000",
    )
