"""Email verification and refresh token families

Revision ID: 0012_email_verification_and_token_families
Revises: 0011_email_auth_and_password_reset
Create Date: 2026-10-13 10:50:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0012_email_verification_and_token_families"
down_revision: str | None = "0011_email_auth_and_password_reset"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Add verification flags to users table
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(
            sa.Column(
                "email_verified", sa.Boolean(), nullable=False, server_default="false"
            )
        )
        batch_op.add_column(
            sa.Column(
                "phone_verified", sa.Boolean(), nullable=False, server_default="false"
            )
        )

    # For existing users with verified phone numbers, mark phone_verified = true
    op.execute("UPDATE users SET phone_verified = 1 WHERE phone_e164 IS NOT NULL")

    # 2. Add family_id to refresh_tokens for reuse attack detection
    with op.batch_alter_table("refresh_tokens") as batch_op:
        batch_op.add_column(
            sa.Column(
                "family_id",
                sa.String(length=36),
                nullable=False,
                server_default="default-family",
            )
        )
        batch_op.create_index("ix_refresh_tokens_family_id", ["family_id"])

    # 3. Create email_verification_tokens table
    op.create_table(
        "email_verification_tokens",
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
        "ix_email_verification_tokens_user_id",
        "email_verification_tokens",
        ["user_id"],
    )
    op.create_index(
        "ix_email_verification_tokens_token_hash",
        "email_verification_tokens",
        ["token_hash"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_email_verification_tokens_token_hash",
        table_name="email_verification_tokens",
    )
    op.drop_index(
        "ix_email_verification_tokens_user_id",
        table_name="email_verification_tokens",
    )
    op.drop_table("email_verification_tokens")

    with op.batch_alter_table("refresh_tokens") as batch_op:
        batch_op.drop_index("ix_refresh_tokens_family_id")
        batch_op.drop_column("family_id")

    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("phone_verified")
        batch_op.drop_column("email_verified")
