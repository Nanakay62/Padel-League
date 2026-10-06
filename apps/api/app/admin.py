"""SQLAdmin back office integration for venues, events, orders, and immutable audit logs."""

from typing import Any, ClassVar

from fastapi import FastAPI
from sqladmin import Admin, ModelView
from sqlalchemy.ext.asyncio import AsyncEngine

from app.audit.models import AuditLog
from app.billing.models import Credit, Order
from app.events.models import Event, Registration
from app.identity.models import User
from app.notify.models import NotificationLog, PushToken
from app.venues.models import Court, OpenMatch, Venue


# --- CRUD Views ---
class VenueAdmin(ModelView, model=Venue):
    column_list: ClassVar[list[Any]] = [
        Venue.id,
        Venue.name,
        Venue.address,
        Venue.ghanapost_gps,
        Venue.base_rate_pesewas_per_hour,
        Venue.is_active,
    ]
    column_searchable_list: ClassVar[list[Any]] = [Venue.name, Venue.ghanapost_gps]
    column_filters: ClassVar[list[Any]] = [Venue.is_active]
    name = "Venue"
    name_plural = "Venues"
    icon = "fa-solid fa-map-location-dot"


class CourtAdmin(ModelView, model=Court):
    column_list: ClassVar[list[Any]] = [
        Court.id,
        Court.venue_id,
        Court.court_number,
        Court.is_indoor,
        Court.surface,
    ]
    name = "Court"
    name_plural = "Courts"
    icon = "fa-solid fa-table-tennis-paddle-ball"


class EventAdmin(ModelView, model=Event):
    column_list: ClassVar[list[Any]] = [
        Event.id,
        Event.title,
        Event.venue_name,
        Event.format,
        Event.status,
        Event.price_pesewas,
        Event.start_time,
    ]
    column_searchable_list: ClassVar[list[Any]] = [Event.title, Event.venue_name]
    column_filters: ClassVar[list[Any]] = [Event.status, Event.format]
    name = "Event"
    name_plural = "Events"
    icon = "fa-solid fa-calendar-days"


class OpenMatchAdmin(ModelView, model=OpenMatch):
    column_list: ClassVar[list[Any]] = [
        OpenMatch.id,
        OpenMatch.venue_id,
        OpenMatch.host_name,
        OpenMatch.level_band,
        OpenMatch.start_time,
        OpenMatch.open_seats,
        OpenMatch.status,
    ]
    name = "Open Match"
    name_plural = "Open Matches"
    icon = "fa-solid fa-users"


# --- Read-Mostly / Audit Views ---
class UserAdmin(ModelView, model=User):
    can_create = False
    can_delete = False
    column_list: ClassVar[list[Any]] = [
        User.id,
        User.name,
        User.phone_e164,
        User.role,
        User.is_active,
        User.created_at,
    ]
    column_searchable_list: ClassVar[list[Any]] = [User.name, User.phone_e164]
    name = "Player / User"
    name_plural = "Players & Users"
    icon = "fa-solid fa-user"


class RegistrationAdmin(ModelView, model=Registration):
    can_create = False
    can_delete = False
    column_list: ClassVar[list[Any]] = [
        Registration.id,
        Registration.event_id,
        Registration.user_id,
        Registration.status,
        Registration.waitlist_position,
        Registration.created_at,
    ]
    column_filters: ClassVar[list[Any]] = [Registration.status]
    name = "Registration"
    name_plural = "Registrations"
    icon = "fa-solid fa-clipboard-list"


class OrderAdmin(ModelView, model=Order):
    can_create = False
    can_delete = False
    column_list: ClassVar[list[Any]] = [
        Order.id,
        Order.reference,
        Order.amount_pesewas,
        Order.currency,
        Order.method,
        Order.status,
        Order.created_at,
    ]
    column_searchable_list: ClassVar[list[Any]] = [Order.reference]
    column_filters: ClassVar[list[Any]] = [Order.status, Order.method]
    name = "Order"
    name_plural = "Orders"
    icon = "fa-solid fa-receipt"


class CreditAdmin(ModelView, model=Credit):
    can_create = False
    can_delete = False
    column_list: ClassVar[list[Any]] = [
        Credit.id,
        Credit.user_id,
        Credit.amount_pesewas,
        Credit.reason,
        Credit.created_at,
    ]
    name = "Credit"
    name_plural = "Credits"
    icon = "fa-solid fa-wallet"


class AuditLogAdmin(ModelView, model=AuditLog):
    can_create = False
    can_edit = False
    can_delete = False
    column_list: ClassVar[list[Any]] = [
        AuditLog.id,
        AuditLog.actor_id,
        AuditLog.action,
        AuditLog.target_type,
        AuditLog.target_id,
        AuditLog.details,
        AuditLog.created_at,
    ]
    column_searchable_list: ClassVar[list[Any]] = [AuditLog.action, AuditLog.target_id]
    column_filters: ClassVar[list[Any]] = [AuditLog.action, AuditLog.target_type]
    name = "Audit Log"
    name_plural = "Audit Logs"
    icon = "fa-solid fa-shield-halved"


class NotificationLogAdmin(ModelView, model=NotificationLog):
    can_create = False
    can_edit = False
    can_delete = False
    column_list: ClassVar[list[Any]] = [
        NotificationLog.id,
        NotificationLog.user_id,
        NotificationLog.channel,
        NotificationLog.notification_type,
        NotificationLog.recipient,
        NotificationLog.status,
        NotificationLog.created_at,
    ]
    column_filters: ClassVar[list[Any]] = [
        NotificationLog.channel,
        NotificationLog.status,
    ]
    name = "Notification Log"
    name_plural = "Notification Logs"
    icon = "fa-solid fa-bell"


class PushTokenAdmin(ModelView, model=PushToken):
    can_create = False
    can_delete = False
    column_list: ClassVar[list[Any]] = [
        PushToken.id,
        PushToken.user_id,
        PushToken.device_os,
        PushToken.is_active,
        PushToken.updated_at,
    ]
    name = "Push Token"
    name_plural = "Push Tokens"
    icon = "fa-solid fa-mobile-screen"


def setup_admin(app: FastAPI, engine: AsyncEngine) -> Admin:
    """Mount SQLAdmin onto FastAPI application with scoped CRUD and audit views."""
    admin = Admin(app, engine, title="Padel Ghana Admin")
    admin.add_view(VenueAdmin)
    admin.add_view(CourtAdmin)
    admin.add_view(EventAdmin)
    admin.add_view(OpenMatchAdmin)
    admin.add_view(UserAdmin)
    admin.add_view(RegistrationAdmin)
    admin.add_view(OrderAdmin)
    admin.add_view(CreditAdmin)
    admin.add_view(AuditLogAdmin)
    admin.add_view(NotificationLogAdmin)
    admin.add_view(PushTokenAdmin)
    return admin
