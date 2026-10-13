"""Case-insensitive unique index on normalized email

Revision ID: 0013_case_insensitive_email_unique_index
Revises: 0012_email_verification_and_token_families
Create Date: 2026-10-13 12:15:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0013_case_insensitive_email_unique_index"
down_revision: str | None = "0012_email_verification_and_token_families"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Normalize all existing emails to lowercase
    op.execute("UPDATE users SET email = LOWER(email) WHERE email IS NOT NULL")

    # 2. Drop existing case-sensitive unique index if present
    try:
        op.drop_index("ix_users_email", table_name="users")
    except Exception:  # noqa: S110, BLE001
        pass

    # 3. Create case-insensitive functional unique index on lower(email)
    op.create_index(
        "ix_users_email_lower",
        "users",
        [sa.text("lower(email)")],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_users_email_lower", table_name="users")
    op.create_index("ix_users_email", "users", ["email"], unique=True)
