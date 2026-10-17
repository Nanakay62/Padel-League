"""Audit log service for immutable change tracking, staff step-in alerts, and state reversion."""

import html as html_lib
import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.audit.models import AuditLog
from app.identity.models import User
from app.notify.email import EmailMessage, get_email_provider
from app.venues.models import Court, Venue, VenueMembership


def _utc_now() -> datetime:
    return datetime.now(UTC)


class AuditService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def record_audit(
        self,
        actor_id: str,
        action: str,
        target_type: str,
        target_id: str,
        venue_id: str | None = None,
        actor_kind: str = "USER",  # USER, SUPER_ADMIN, SYSTEM
        actor_role: str | None = None,
        amount_pesewas: int | None = None,
        reference: str | None = None,
        details: str | None = None,
        old_value: dict[str, Any] | None = None,
        new_value: dict[str, Any] | None = None,
        is_revertible: bool = False,
    ) -> AuditLog:
        """Create an immutable audit log entry and dispatch alerts on Super Admin step-in."""
        log = AuditLog(
            id=str(uuid.uuid4()),
            actor_id=actor_id,
            actor_kind=actor_kind,
            actor_role=actor_role,
            venue_id=venue_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            amount_pesewas=amount_pesewas,
            reference=reference,
            details=details,
            old_value=old_value,
            new_value=new_value,
            is_revertible=is_revertible,
            created_at=_utc_now(),
        )
        self.db.add(log)
        await self.db.flush()

        # If Super Admin stepped in to edit venue data, alert the Club Owner(s)
        if actor_kind == "SUPER_ADMIN" and venue_id:
            await self._alert_venue_owners_of_staff_action(
                venue_id=venue_id,
                action=action,
                audit_id=log.id,
                details=details,
            )

        return log

    async def _alert_venue_owners_of_staff_action(
        self,
        venue_id: str,
        action: str,
        audit_id: str,
        details: str | None,
    ) -> None:
        """Find venue owners and send an alert notifying them of platform staff actions."""
        stmt = (
            select(User)
            .join(VenueMembership, VenueMembership.user_id == User.id)
            .where(
                VenueMembership.venue_id == venue_id,
                VenueMembership.role == "CLUB_OWNER",
                VenueMembership.status == "ACTIVE",
                User.is_active.is_(True),
            )
        )
        res = await self.db.execute(stmt)
        owners = res.scalars().all()

        email_provider = get_email_provider()
        for owner in owners:
            if not owner.email:
                continue
            subject = "[Padel Ghana] Updated by Padel Ghana staff"
            body = (
                f"Hello {owner.name},\n\n"
                f"Your club settings/profile have been updated by Padel Ghana platform staff.\n"
                f"Action: {action}\n"
                f"Audit ID: {audit_id}\n"
                f"Details: {details or 'No additional details provided.'}\n\n"
                f"If you did not request this or have questions, please reach out to support@padelghana.com."
            )
            html = (
                f"<p>Hello {html_lib.escape(owner.name)},</p>"
                f"<p>Your club settings/profile have been <strong>Updated by Padel Ghana staff</strong>.</p>"
                f"<ul>"
                f"<li><strong>Action:</strong> {html_lib.escape(action)}</li>"
                f"<li><strong>Audit ID:</strong> {html_lib.escape(audit_id)}</li>"
                f"<li><strong>Details:</strong> {html_lib.escape(details or 'None')}</li>"
                f"</ul>"
                f"<p>If you have questions, contact <a href='mailto:support@padelghana.com'>support@padelghana.com</a>.</p>"
            )
            msg = EmailMessage(
                to=owner.email,
                subject=subject,
                body_text=body,
                body_html=html,
            )
            try:
                await email_provider.send_email(msg)
            except Exception:  # noqa: BLE001, S110
                # Do not block the primary operation if email delivery encounters a transient failure
                pass

    async def revert_audit(
        self,
        audit_id: str,
        actor_id: str,
        actor_kind: str = "SUPER_ADMIN",
    ) -> AuditLog:
        """Revert the changes recorded in an audit log entry back to its previous state."""
        audit = await self.db.get(AuditLog, audit_id)
        if not audit:
            raise ValueError("Audit log not found")
        if not audit.is_revertible:
            raise ValueError("Audit log is not revertible")
        if audit.reverted_at is not None:
            raise ValueError("Audit log already reverted")
        if audit.old_value is None:
            raise ValueError("Audit log has no old value to restore")

        # Restore target entity
        target_type = audit.target_type.lower()
        if target_type == "venue":
            venue = await self.db.get(Venue, audit.target_id)
            if venue:
                for k, v in audit.old_value.items():
                    if hasattr(venue, k):
                        setattr(venue, k, v)
        elif target_type == "court":
            court = await self.db.get(Court, audit.target_id)
            if court:
                for k, v in audit.old_value.items():
                    if hasattr(court, k):
                        setattr(court, k, v)
        else:
            raise ValueError(f"Target type {audit.target_type} is not revertible")

        # Mark original audit log as reverted
        audit.reverted_at = _utc_now()

        # Create new revert record
        revert_log = AuditLog(
            id=str(uuid.uuid4()),
            actor_id=actor_id,
            actor_kind=actor_kind,
            venue_id=audit.venue_id,
            action=f"REVERT_{audit.action}",
            target_type=audit.target_type,
            target_id=audit.target_id,
            old_value=audit.new_value,
            new_value=audit.old_value,
            is_revertible=False,
            reverts_audit_id=audit.id,
            details=f"Reverted audit log {audit.id}",
            created_at=_utc_now(),
        )
        self.db.add(revert_log)
        await self.db.flush()

        return revert_log
