"""Email authentication and password reset tokens

Revision ID: 0011_email_auth_and_password_reset
Revises: 0010_venue_and_court_pricing_fields
Create Date: 2026-10-12 15:45:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0011_email_auth_and_password_reset"
down_revision: str | None = "0010_venue_and_court_pricing_fields"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Allow phone_e164 to be nullable on users for email-only accounts
    with op.batch_alter_table("users") as batch_op:
        batch_op.alter_column(
            "phone_e164",
            existing_type=sa.String(length=32),
            nullable=True,
        )

    # 2. Create password_reset_tokens table
    op.create_table(
        "password_reset_tokens",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("token_hash", sa.String(length=128), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_password_reset_tokens_user_id",
        "password_reset_tokens",
        ["user_id"],
    )
    op.create_index(
        "ix_password_reset_tokens_token_hash",
        "password_reset_tokens",
        ["token_hash"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_password_reset_tokens_token_hash", table_name="password_reset_tokens"
    )
    op.drop_index(
        "ix_password_reset_tokens_user_id", table_name="password_reset_tokens"
    )
    op.drop_table("password_reset_tokens")

    with op.batch_alter_table("users") as batch_op:
        batch_op.alter_column(
            "phone_e164",
            existing_type=sa.String(length=32),
            nullable=False,
        )
