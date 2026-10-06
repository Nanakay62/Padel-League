"""Pair leagues, boxes, pairs, and shared match columns

Revision ID: 0009_leagues_schema
Revises: 0008_ratings_schema
Create Date: 2026-10-06 11:15:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0009_leagues_schema"
down_revision: str | None = "0008_ratings_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Create leagues table
    op.create_table(
        "leagues",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=120), nullable=False),
        sa.Column(
            "season_name",
            sa.String(length=64),
            nullable=False,
            server_default="Season 1",
        ),
        sa.Column(
            "status", sa.String(length=32), nullable=False, server_default="ACTIVE"
        ),
        sa.Column("promote_count", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("relegate_count", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("cycle_weeks", sa.Integer(), nullable=False, server_default="4"),
        sa.Column(
            "substitute_policy",
            sa.String(length=255),
            nullable=False,
            server_default="MAX_1_RATING_LE_REPLACED",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # 2. Create league_boxes table
    op.create_table(
        "league_boxes",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("league_id", sa.String(length=36), nullable=False),
        sa.Column("box_number", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("min_rating", sa.Float(), nullable=False, server_default="1.0"),
        sa.Column("max_rating", sa.Float(), nullable=False, server_default="7.0"),
        sa.Column("cycle_deadline", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["league_id"], ["leagues.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_league_boxes_league_id"), "league_boxes", ["league_id"], unique=False
    )

    # 3. Create league_pairs table
    op.create_table(
        "league_pairs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("box_id", sa.String(length=36), nullable=False),
        sa.Column("player1_id", sa.String(length=36), nullable=False),
        sa.Column("player2_id", sa.String(length=36), nullable=False),
        sa.Column("pair_name", sa.String(length=120), nullable=False),
        sa.Column("combined_rating", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column(
            "status", sa.String(length=32), nullable=False, server_default="ACTIVE"
        ),
        sa.Column("substitutes_used", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["box_id"], ["league_boxes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["player1_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["player2_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_league_pairs_box_id"), "league_pairs", ["box_id"], unique=False
    )
    op.create_index(
        op.f("ix_league_pairs_player1_id"), "league_pairs", ["player1_id"], unique=False
    )
    op.create_index(
        op.f("ix_league_pairs_player2_id"), "league_pairs", ["player2_id"], unique=False
    )

    # 4. Alter event_matches table for shared match support
    op.alter_column("event_matches", "round_id", nullable=True)
    op.add_column(
        "event_matches", sa.Column("league_id", sa.String(length=36), nullable=True)
    )
    op.add_column(
        "event_matches", sa.Column("box_id", sa.String(length=36), nullable=True)
    )
    op.add_column(
        "event_matches",
        sa.Column("team_a_pair_id", sa.String(length=36), nullable=True),
    )
    op.add_column(
        "event_matches",
        sa.Column("team_b_pair_id", sa.String(length=36), nullable=True),
    )
    op.add_column(
        "event_matches", sa.Column("team_a_sets", sa.Integer(), nullable=True)
    )
    op.add_column(
        "event_matches", sa.Column("team_b_sets", sa.Integer(), nullable=True)
    )
    op.add_column(
        "event_matches", sa.Column("team_a_games", sa.Integer(), nullable=True)
    )
    op.add_column(
        "event_matches", sa.Column("team_b_games", sa.Integer(), nullable=True)
    )
    op.add_column(
        "event_matches",
        sa.Column("is_walkover", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "event_matches",
        sa.Column("walkover_winner", sa.String(length=36), nullable=True),
    )
    op.add_column(
        "event_matches",
        sa.Column("substitute_p1", sa.String(length=120), nullable=True),
    )
    op.add_column(
        "event_matches", sa.Column("venue_id", sa.String(length=36), nullable=True)
    )
    op.add_column(
        "event_matches", sa.Column("venue_name", sa.String(length=120), nullable=True)
    )
    op.add_column(
        "event_matches",
        sa.Column("deadline_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_foreign_key(
        "fk_event_matches_league_id",
        "event_matches",
        "leagues",
        ["league_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_event_matches_box_id",
        "event_matches",
        "league_boxes",
        ["box_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_event_matches_team_a_pair_id",
        "event_matches",
        "league_pairs",
        ["team_a_pair_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_event_matches_team_b_pair_id",
        "event_matches",
        "league_pairs",
        ["team_b_pair_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_event_matches_venue_id",
        "event_matches",
        "venues",
        ["venue_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.create_index(
        op.f("ix_event_matches_league_id"), "event_matches", ["league_id"], unique=False
    )
    op.create_index(
        op.f("ix_event_matches_box_id"), "event_matches", ["box_id"], unique=False
    )
    op.create_index(
        op.f("ix_event_matches_team_a_pair_id"),
        "event_matches",
        ["team_a_pair_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_event_matches_team_b_pair_id"),
        "event_matches",
        ["team_b_pair_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_constraint("fk_event_matches_venue_id", "event_matches", type_="foreignkey")
    op.drop_constraint(
        "fk_event_matches_team_b_pair_id", "event_matches", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_event_matches_team_a_pair_id", "event_matches", type_="foreignkey"
    )
    op.drop_constraint("fk_event_matches_box_id", "event_matches", type_="foreignkey")
    op.drop_constraint(
        "fk_event_matches_league_id", "event_matches", type_="foreignkey"
    )

    op.drop_index(op.f("ix_event_matches_team_b_pair_id"), table_name="event_matches")
    op.drop_index(op.f("ix_event_matches_team_a_pair_id"), table_name="event_matches")
    op.drop_index(op.f("ix_event_matches_box_id"), table_name="event_matches")
    op.drop_index(op.f("ix_event_matches_league_id"), table_name="event_matches")

    op.drop_column("event_matches", "deadline_at")
    op.drop_column("event_matches", "venue_name")
    op.drop_column("event_matches", "venue_id")
    op.drop_column("event_matches", "substitute_p1")
    op.drop_column("event_matches", "walkover_winner")
    op.drop_column("event_matches", "is_walkover")
    op.drop_column("event_matches", "team_b_games")
    op.drop_column("event_matches", "team_a_games")
    op.drop_column("event_matches", "team_b_sets")
    op.drop_column("event_matches", "team_a_sets")
    op.drop_column("event_matches", "team_b_pair_id")
    op.drop_column("event_matches", "team_a_pair_id")
    op.drop_column("event_matches", "box_id")
    op.drop_column("event_matches", "league_id")
    op.alter_column("event_matches", "round_id", nullable=False)

    op.drop_table("league_pairs")
    op.drop_table("league_boxes")
    op.drop_table("leagues")
