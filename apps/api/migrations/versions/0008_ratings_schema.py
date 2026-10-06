"""Rating events and immutable history schema

Revision ID: 0008_ratings_schema
Revises: 0007_organizer_schema
Create Date: 2026-10-06 09:20:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0008_ratings_schema"
down_revision: str | None = "0007_organizer_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "rating_events",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("match_id", sa.String(length=36), nullable=False),
        sa.Column("rating_before", sa.Float(), nullable=False),
        sa.Column("rating_after", sa.Float(), nullable=False),
        sa.Column("delta", sa.Float(), nullable=False),
        sa.Column("k_factor", sa.Float(), nullable=False),
        sa.Column("explanation", sa.String(length=255), nullable=False),
        sa.Column(
            "requires_review", sa.Boolean(), nullable=False, server_default="false"
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_rating_events_user_id"), "rating_events", ["user_id"], unique=False
    )
    op.create_index(
        op.f("ix_rating_events_match_id"), "rating_events", ["match_id"], unique=False
    )
    op.create_index(
        op.f("ix_rating_events_created_at"),
        "rating_events",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_table("rating_events")
