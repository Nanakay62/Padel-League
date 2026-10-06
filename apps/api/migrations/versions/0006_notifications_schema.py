"""Push tokens and notification logs schema

Revision ID: 0006_notifications_schema
Revises: 0005_billing_schema
Create Date: 2026-10-06 01:30:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0006_notifications_schema"
down_revision: str | None = "0005_billing_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Push Tokens table
    op.create_table(
        "push_tokens",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("token", sa.String(length=255), nullable=False),
        sa.Column(
            "device_os", sa.String(length=32), nullable=False, server_default="android"
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_push_tokens_user_id"), "push_tokens", ["user_id"], unique=False
    )
    op.create_index(op.f("ix_push_tokens_token"), "push_tokens", ["token"], unique=True)

    # Notification Logs table
    op.create_table(
        "notification_logs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("channel", sa.String(length=16), nullable=False),
        sa.Column("notification_type", sa.String(length=32), nullable=False),
        sa.Column("recipient", sa.String(length=120), nullable=False),
        sa.Column("message", sa.String(length=500), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_notification_logs_user_id"),
        "notification_logs",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_notification_logs_channel"),
        "notification_logs",
        ["channel"],
        unique=False,
    )
    op.create_index(
        op.f("ix_notification_logs_notification_type"),
        "notification_logs",
        ["notification_type"],
        unique=False,
    )
    op.create_index(
        op.f("ix_notification_logs_recipient"),
        "notification_logs",
        ["recipient"],
        unique=False,
    )
    op.create_index(
        op.f("ix_notification_logs_status"),
        "notification_logs",
        ["status"],
        unique=False,
    )
    op.create_index(
        op.f("ix_notification_logs_created_at"),
        "notification_logs",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_table("notification_logs")
    op.drop_table("push_tokens")
