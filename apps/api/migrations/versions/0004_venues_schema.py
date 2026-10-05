"""Venues, Courts, and Open Matches schema

Revision ID: 0004_venues_schema
Revises: 0003_identity_schema
Create Date: 2026-10-05 21:10:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0004_venues_schema"
down_revision: str | None = "0003_identity_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "venues",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("address", sa.String(length=255), nullable=False),
        sa.Column(
            "ghanapost_gps", sa.String(length=32), nullable=False, server_default=""
        ),
        sa.Column("maps_url", sa.String(length=255), nullable=False, server_default=""),
        sa.Column(
            "booking_phone", sa.String(length=32), nullable=False, server_default=""
        ),
        sa.Column(
            "booking_whatsapp", sa.String(length=255), nullable=False, server_default=""
        ),
        sa.Column(
            "booking_url", sa.String(length=255), nullable=False, server_default=""
        ),
        sa.Column(
            "base_rate_pesewas_per_hour",
            sa.Integer(),
            nullable=False,
            server_default="18000",
        ),
        sa.Column("indoor_courts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("outdoor_courts", sa.Integer(), nullable=False, server_default="2"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "courts",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("venue_id", sa.String(length=36), nullable=False),
        sa.Column("court_number", sa.Integer(), nullable=False),
        sa.Column("is_indoor", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column(
            "surface", sa.String(length=64), nullable=False, server_default="Turf"
        ),
        sa.Column("notes", sa.String(length=255), nullable=False, server_default=""),
        sa.ForeignKeyConstraint(["venue_id"], ["venues.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "open_matches",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("venue_id", sa.String(length=36), nullable=False),
        sa.Column("court_number", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("host_name", sa.String(length=120), nullable=False),
        sa.Column("host_phone", sa.String(length=32), nullable=False),
        sa.Column(
            "level_band",
            sa.String(length=64),
            nullable=False,
            server_default="3.0 – 4.0",
        ),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("court_cost_pesewas", sa.Integer(), nullable=False),
        sa.Column("platform_fee_pesewas", sa.Integer(), nullable=False),
        sa.Column("price_per_player_pesewas", sa.Integer(), nullable=False),
        sa.Column("capacity", sa.Integer(), nullable=False, server_default="4"),
        sa.Column("open_seats", sa.Integer(), nullable=False, server_default="3"),
        sa.Column(
            "underfilled_policy",
            sa.String(length=32),
            nullable=False,
            server_default="CANCEL_REFUND",
        ),
        sa.Column(
            "status", sa.String(length=32), nullable=False, server_default="OPEN"
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["venue_id"], ["venues.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "open_match_participants",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("open_match_id", sa.String(length=36), nullable=False),
        sa.Column("player_name", sa.String(length=120), nullable=False),
        sa.Column("player_phone", sa.String(length=32), nullable=False),
        sa.Column("joined_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["open_match_id"], ["open_matches.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("open_match_participants")
    op.drop_table("open_matches")
    op.drop_table("courts")
    op.drop_table("venues")
