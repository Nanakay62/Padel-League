"""Billing, Orders, Credits, Registrations, and Audit Logs schema

Revision ID: 0005_billing_schema
Revises: 0004_venues_schema
Create Date: 2026-10-05 23:15:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0005_billing_schema"
down_revision: str | None = "0004_venues_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Add pricing and capacity columns to events
    op.add_column(
        "events",
        sa.Column("price_pesewas", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "events",
        sa.Column(
            "court_rate_pesewas", sa.Integer(), nullable=False, server_default="0"
        ),
    )
    op.add_column(
        "events",
        sa.Column("max_players", sa.Integer(), nullable=False, server_default="8"),
    )
    op.add_column(
        "events",
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=True),
    )

    # Orders table
    op.create_table(
        "orders",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("event_id", sa.String(length=36), nullable=False),
        sa.Column("amount_pesewas", sa.Integer(), nullable=False),
        sa.Column("court_fee_pesewas", sa.Integer(), nullable=False),
        sa.Column("platform_fee_pesewas", sa.Integer(), nullable=False),
        sa.Column(
            "currency", sa.String(length=3), nullable=False, server_default="GHS"
        ),
        sa.Column("method", sa.String(length=32), nullable=False),
        sa.Column(
            "status", sa.String(length=32), nullable=False, server_default="PENDING"
        ),
        sa.Column("reference", sa.String(length=120), nullable=False),
        sa.Column("paystack_reference", sa.String(length=120), nullable=True),
        sa.Column("paystack_authorization_url", sa.String(length=255), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_orders_reference"), "orders", ["reference"], unique=True)
    op.create_index(
        op.f("ix_orders_paystack_reference"),
        "orders",
        ["paystack_reference"],
        unique=False,
    )

    # Credits table
    op.create_table(
        "credits",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("amount_pesewas", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(length=120), nullable=False),
        sa.Column("source_registration_id", sa.String(length=36), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # Registrations table
    op.create_table(
        "registrations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("event_id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("order_id", sa.String(length=36), nullable=True),
        sa.Column(
            "status",
            sa.String(length=32),
            nullable=False,
            server_default="PENDING_PAYMENT",
        ),
        sa.Column("hold_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("waitlist_position", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_registrations_event_id"), "registrations", ["event_id"], unique=False
    )
    op.create_index(
        op.f("ix_registrations_user_id"), "registrations", ["user_id"], unique=False
    )
    op.create_index(
        op.f("ix_registrations_status"), "registrations", ["status"], unique=False
    )
    op.create_index(
        op.f("ix_registrations_hold_expires_at"),
        "registrations",
        ["hold_expires_at"],
        unique=False,
    )

    # Audit Logs table
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("actor_id", sa.String(length=36), nullable=False),
        sa.Column("action", sa.String(length=64), nullable=False),
        sa.Column("target_type", sa.String(length=32), nullable=False),
        sa.Column("target_id", sa.String(length=36), nullable=False),
        sa.Column("amount_pesewas", sa.Integer(), nullable=True),
        sa.Column("reference", sa.String(length=120), nullable=True),
        sa.Column("details", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_audit_logs_actor_id"), "audit_logs", ["actor_id"], unique=False
    )
    op.create_index(
        op.f("ix_audit_logs_action"), "audit_logs", ["action"], unique=False
    )
    op.create_index(
        op.f("ix_audit_logs_target_type"), "audit_logs", ["target_type"], unique=False
    )
    op.create_index(
        op.f("ix_audit_logs_target_id"), "audit_logs", ["target_id"], unique=False
    )


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("registrations")
    op.drop_table("credits")
    op.drop_table("orders")
    op.drop_column("events", "start_time")
    op.drop_column("events", "max_players")
    op.drop_column("events", "court_rate_pesewas")
    op.drop_column("events", "price_pesewas")
