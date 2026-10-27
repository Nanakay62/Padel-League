"""Add player avatar url to player_profiles

Revision ID: 0016_add_player_avatar_url
Revises: 0015_mfa_lockout_and_platform_settings
Create Date: 2026-10-27 10:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0016_add_player_avatar_url"
down_revision: str | None = "0015_mfa_lockout_and_platform_settings"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "player_profiles",
        sa.Column("avatar_url", sa.String(512), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("player_profiles", "avatar_url")
