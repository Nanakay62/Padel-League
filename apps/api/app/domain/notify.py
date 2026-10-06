"""Pure domain logic for notifications, Ghana quiet hours (Africa/Accra), and SMS budget control."""

from datetime import UTC, datetime
from zoneinfo import ZoneInfo


def is_quiet_hours(
    dt: datetime,
    tz_name: str = "Africa/Accra",
    start_hour: int = 22,
    end_hour: int = 6,
) -> bool:
    """Return True if local time in tz_name falls within quiet hours (default: 22:00 to 06:00).

    Ghana (Africa/Accra) is UTC+0 with no daylight saving time.
    During quiet hours, waitlist offers and non-critical messages are suppressed/deferred.
    """
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)

    local_dt = dt.astimezone(ZoneInfo(tz_name))
    hour = local_dt.hour

    if start_hour > end_hour:
        # e.g., 22:00 to 06:00
        return hour >= start_hour or hour < end_hour
    else:
        return start_hour <= hour < end_hour


def check_monthly_sms_cap(sent_count: int, max_cap: int = 5) -> bool:
    """Enforce per-user monthly SMS limit to protect against unexpected telco charges.

    Returns:
        True if the user has not yet reached the monthly quota, False otherwise.
    """
    return sent_count < max_cap


def format_reminder_message(
    event_title: str,
    start_time: datetime,
    venue_name: str,
    court_number: int,
    maps_url: str,
    ghanapost_gps: str,
) -> str:
    """Format an event reminder message containing venue details, court, and digital navigation links."""
    time_str = start_time.strftime("%I:%M %p")
    return (
        f"🎾 Padel Ghana Reminder: '{event_title}' starts today at {time_str}.\n"
        f"Venue: {venue_name} (Court {court_number})\n"
        f"Digital Address: {ghanapost_gps}\n"
        f"Directions: {maps_url}"
    )


def format_whatsapp_invite(
    event_title: str,
    start_time: datetime,
    venue_name: str,
    ghanapost_gps: str,
    join_url: str,
) -> str:
    """Format a viral WhatsApp invitation message for Ghana group chats."""
    date_str = start_time.strftime("%A, %b %d at %I:%M %p")
    return (
        f"🎾 *{event_title}*\n"
        f"📅 {date_str}\n"
        f"📍 {venue_name} (GPS: {ghanapost_gps})\n\n"
        f"Join the tournament and track live scores here:\n{join_url}"
    )
