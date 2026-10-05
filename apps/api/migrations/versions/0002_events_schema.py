"""Events, players, rounds, and matches schema

Revision ID: 0002_events_schema
Revises: 0001_baseline
Create Date: 2026-10-05 16:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002_events_schema"
down_revision: str | None = "0001_baseline"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "events",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=120), nullable=False),
        sa.Column(
            "venue_name", sa.String(length=120), nullable=False, server_default=""
        ),
        sa.Column(
            "format", sa.String(length=32), nullable=False, server_default="AMERICANO"
        ),
        sa.Column("courts", sa.Integer(), nullable=False, server_default="2"),
        sa.Column("point_target", sa.Integer(), nullable=False, server_default="24"),
        sa.Column("planned_rounds", sa.Integer(), nullable=False, server_default="8"),
        sa.Column(
            "status", sa.String(length=32), nullable=False, server_default="DRAFT"
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "event_players",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("event_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "event_rounds",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("event_id", sa.String(length=36), nullable=False),
        sa.Column("round_number", sa.Integer(), nullable=False),
        sa.Column(
            "status", sa.String(length=32), nullable=False, server_default="IN_PROGRESS"
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "event_matches",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("round_id", sa.String(length=36), nullable=False),
        sa.Column("court_number", sa.Integer(), nullable=False),
        sa.Column("team_a_p1", sa.String(length=120), nullable=False),
        sa.Column("team_a_p2", sa.String(length=120), nullable=False),
        sa.Column("team_b_p1", sa.String(length=120), nullable=False),
        sa.Column("team_b_p2", sa.String(length=120), nullable=False),
        sa.Column("team_a_score", sa.Integer(), nullable=True),
        sa.Column("team_b_score", sa.Integer(), nullable=True),
        sa.Column("result_id", sa.String(length=64), nullable=True),
        sa.Column("entered_by", sa.String(length=120), nullable=True),
        sa.Column("entered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "status", sa.String(length=32), nullable=False, server_default="SCHEDULED"
        ),
        sa.ForeignKeyConstraint(["round_id"], ["event_rounds.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_event_matches_result_id", "event_matches", ["result_id"])


def downgrade() -> None:
    op.drop_index("ix_event_matches_result_id", table_name="event_matches")
    op.drop_table("event_matches")
    op.drop_table("event_rounds")
    op.drop_table("event_players")
    op.drop_table("events")
