"""MFA lockout and platform settings schema

Revision ID: 0015_mfa_lockout_and_platform_settings
Revises: 0014_multi_tenant_admin_portals
Create Date: 2026-10-17 18:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0015_mfa_lockout_and_platform_settings"
down_revision: str | None = "0014_multi_tenant_admin_portals"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Add MFA lockout columns to users table
    op.add_column(
        "users",
        sa.Column(
            "failed_mfa_attempts",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "mfa_locked_until",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    # 2. Create platform_settings table
    op.create_table(
        "platform_settings",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "allow_multi_venue_per_user",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column("platform_announcement", sa.String(500), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )


def downgrade() -> None:
    op.drop_table("platform_settings")
    op.drop_column("users", "mfa_locked_until")
    op.drop_column("users", "failed_mfa_attempts")
