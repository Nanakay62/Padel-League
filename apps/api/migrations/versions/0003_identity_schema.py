"""Identity and authentication schema

Revision ID: 0003_identity_schema
Revises: 0002_events_schema
Create Date: 2026-10-05 16:30:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0003_identity_schema"
down_revision: str | None = "0002_events_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("phone_e164", sa.String(length=32), nullable=False),
        sa.Column("email", sa.String(length=120), nullable=True),
        sa.Column("hashed_password", sa.String(length=255), nullable=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column(
            "role", sa.String(length=32), nullable=False, server_default="PLAYER"
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("is_guest", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("claim_token", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_phone_e164", "users", ["phone_e164"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_claim_token", "users", ["claim_token"], unique=True)

    op.create_table(
        "player_profiles",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("level", sa.Float(), nullable=False, server_default="2.5"),
        sa.Column("reliability", sa.Float(), nullable=False, server_default="0.5"),
        sa.Column(
            "is_provisional", sa.Boolean(), nullable=False, server_default="true"
        ),
        sa.Column(
            "preferred_side",
            sa.String(length=16),
            nullable=False,
            server_default="EITHER",
        ),
        sa.Column("home_venue_id", sa.String(length=64), nullable=True),
        sa.Column(
            "competitiveness",
            sa.String(length=16),
            nullable=False,
            server_default="BOTH",
        ),
        sa.Column("usual_play_times", sa.String(length=255), nullable=True),
        sa.Column("strikes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("external_level_note", sa.String(length=255), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )

    op.create_table(
        "phone_otps",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("phone_e164", sa.String(length=32), nullable=False),
        sa.Column("otp_hash", sa.String(length=128), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "attempts_remaining", sa.Integer(), nullable=False, server_default="5"
        ),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_phone_otps_phone_e164", "phone_otps", ["phone_e164"])

    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("token_hash", sa.String(length=128), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_refresh_tokens_token_hash", "refresh_tokens", ["token_hash"], unique=True
    )


def downgrade() -> None:
    op.drop_index("ix_refresh_tokens_token_hash", table_name="refresh_tokens")
    op.drop_table("refresh_tokens")
    op.drop_index("ix_phone_otps_phone_e164", table_name="phone_otps")
    op.drop_table("phone_otps")
    op.drop_table("player_profiles")
    op.drop_index("ix_users_claim_token", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_phone_e164", table_name="users")
    op.drop_table("users")
