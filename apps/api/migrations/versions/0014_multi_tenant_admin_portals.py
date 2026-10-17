"""Multi-tenant back office and admin portals schema

Revision ID: 0014_multi_tenant_admin_portals
Revises: 0013_case_insensitive_email_unique_index
Create Date: 2026-10-16 14:30:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0014_multi_tenant_admin_portals"
down_revision: str | None = "0013_case_insensitive_email_unique_index"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Update users table with TOTP columns
    op.add_column("users", sa.Column("totp_secret_enc", sa.String(255), nullable=True))
    op.add_column(
        "users", sa.Column("totp_enabled_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column("users", sa.Column("totp_last_step", sa.Integer(), nullable=True))

    # 2. Update events table with venue_id and owner_id
    op.add_column(
        "events",
        sa.Column(
            "venue_id",
            sa.String(36),
            sa.ForeignKey("venues.id", ondelete="RESTRICT"),
            nullable=True,
        ),
    )
    op.create_index("ix_events_venue_id", "events", ["venue_id"])
    op.add_column(
        "events",
        sa.Column(
            "owner_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index("ix_events_owner_id", "events", ["owner_id"])

    # 3. Update audit_logs table with multi-tenant fields
    op.add_column(
        "audit_logs",
        sa.Column("actor_kind", sa.String(32), nullable=False, server_default="USER"),
    )
    op.add_column("audit_logs", sa.Column("actor_role", sa.String(32), nullable=True))
    op.add_column("audit_logs", sa.Column("venue_id", sa.String(36), nullable=True))
    op.create_index("ix_audit_logs_venue_id", "audit_logs", ["venue_id"])
    op.add_column("audit_logs", sa.Column("old_value", sa.JSON(), nullable=True))
    op.add_column("audit_logs", sa.Column("new_value", sa.JSON(), nullable=True))
    op.add_column(
        "audit_logs",
        sa.Column(
            "is_revertible", sa.Boolean(), nullable=False, server_default=sa.false()
        ),
    )
    op.add_column(
        "audit_logs",
        sa.Column("reverted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "audit_logs", sa.Column("reverts_audit_id", sa.String(36), nullable=True)
    )

    # 4. Create venue_memberships table
    op.create_table(
        "venue_memberships",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "venue_id",
            sa.String(36),
            sa.ForeignKey("venues.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("role", sa.String(32), nullable=False, server_default="CLUB_ADMIN"),
        sa.Column("status", sa.String(32), nullable=False, server_default="ACTIVE"),
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
        sa.UniqueConstraint(
            "venue_id", "user_id", name="uq_venue_membership_venue_user"
        ),
    )

    # 5. Create venue_invites table
    op.create_table(
        "venue_invites",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "venue_id",
            sa.String(36),
            sa.ForeignKey("venues.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("email", sa.String(120), nullable=False, index=True),
        sa.Column("role", sa.String(32), nullable=False, server_default="CLUB_ADMIN"),
        sa.Column(
            "token_hash", sa.String(128), nullable=False, unique=True, index=True
        ),
        sa.Column(
            "invited_by_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    # 6. Create venue_drafts table
    op.create_table(
        "venue_drafts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "venue_id",
            sa.String(36),
            sa.ForeignKey("venues.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("section", sa.String(64), nullable=False),
        sa.Column("draft_payload", sa.JSON(), nullable=False),
        sa.Column(
            "updated_by_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint("venue_id", "section", name="uq_venue_draft_venue_section"),
    )

    # 7. Create venue_photos table
    op.create_table(
        "venue_photos",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "venue_id",
            sa.String(36),
            sa.ForeignKey("venues.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("url", sa.String(255), nullable=False),
        sa.Column("thumbnail_url", sa.String(255), nullable=False, server_default=""),
        sa.Column("caption", sa.String(255), nullable=False, server_default=""),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "uploaded_by_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    # 8. Create recovery_codes table
    op.create_table(
        "recovery_codes",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("code_hash", sa.String(128), nullable=False, index=True),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    # 9. Create user_sessions table
    op.create_table(
        "user_sessions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "session_token_hash",
            sa.String(128),
            nullable=False,
            unique=True,
            index=True,
        ),
        sa.Column("venue_id", sa.String(36), nullable=True, index=True),
        sa.Column("role", sa.String(32), nullable=False),
        sa.Column("host_type", sa.String(32), nullable=False),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.String(255), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "last_seen_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )


def downgrade() -> None:
    op.drop_table("user_sessions")
    op.drop_table("recovery_codes")
    op.drop_table("venue_photos")
    op.drop_table("venue_drafts")
    op.drop_table("venue_invites")
    op.drop_table("venue_memberships")

    op.drop_index("ix_audit_logs_venue_id", table_name="audit_logs")
    op.drop_column("audit_logs", "reverts_audit_id")
    op.drop_column("audit_logs", "reverted_at")
    op.drop_column("audit_logs", "is_revertible")
    op.drop_column("audit_logs", "new_value")
    op.drop_column("audit_logs", "old_value")
    op.drop_column("audit_logs", "venue_id")
    op.drop_column("audit_logs", "actor_role")
    op.drop_column("audit_logs", "actor_kind")

    op.drop_index("ix_events_owner_id", table_name="events")
    op.drop_column("events", "owner_id")
    op.drop_index("ix_events_venue_id", table_name="events")
    op.drop_column("events", "venue_id")

    op.drop_column("users", "totp_last_step")
    op.drop_column("users", "totp_enabled_at")
    op.drop_column("users", "totp_secret_enc")
