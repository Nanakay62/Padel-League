"""Pure domain tests for notification formatting, Ghana quiet hours, and SMS quotas."""

from datetime import UTC, datetime

from app.domain.notify import (
    check_monthly_sms_cap,
    format_reminder_message,
    format_whatsapp_invite,
    is_quiet_hours,
)


def test_is_quiet_hours_africa_accra():
    # Accra is UTC+0 with no daylight saving
    # Quiet hours are 22:00 - 06:00
    t_2330 = datetime(2026, 10, 10, 23, 30, tzinfo=UTC)
    assert is_quiet_hours(t_2330) is True

    t_0200 = datetime(2026, 10, 11, 2, 0, tzinfo=UTC)
    assert is_quiet_hours(t_0200) is True

    t_0559 = datetime(2026, 10, 11, 5, 59, tzinfo=UTC)
    assert is_quiet_hours(t_0559) is True

    t_0600 = datetime(2026, 10, 11, 6, 0, tzinfo=UTC)
    assert is_quiet_hours(t_0600) is False

    t_1430 = datetime(2026, 10, 11, 14, 30, tzinfo=UTC)
    assert is_quiet_hours(t_1430) is False

    t_2159 = datetime(2026, 10, 11, 21, 59, tzinfo=UTC)
    assert is_quiet_hours(t_2159) is False

    t_2200 = datetime(2026, 10, 11, 22, 0, tzinfo=UTC)
    assert is_quiet_hours(t_2200) is True


def test_format_reminder_message_includes_ghanapost_and_maps():
    msg = format_reminder_message(
        event_title="Saturday Social Americano",
        start_time=datetime(2026, 10, 10, 16, 0, tzinfo=UTC),
        venue_name="Cantonments Padel Club",
        court_number=2,
        maps_url="https://maps.google.com/?q=cantonments_padel",
        ghanapost_gps="GL-045-8901",
    )

    assert "Saturday Social Americano" in msg
    assert "Cantonments Padel Club" in msg
    assert "Court 2" in msg
    assert "GL-045-8901" in msg
    assert "https://maps.google.com/?q=cantonments_padel" in msg


def test_format_whatsapp_invite_message():
    msg = format_whatsapp_invite(
        event_title="Friday Sunset Mexicano",
        start_time=datetime(2026, 10, 16, 18, 0, tzinfo=UTC),
        venue_name="Accra Padel Club",
        ghanapost_gps="GA-111-2233",
        join_url="https://padelghana.com/events/evt_123",
    )

    assert "Friday Sunset Mexicano" in msg
    assert "Accra Padel Club" in msg
    assert "GA-111-2233" in msg
    assert "https://padelghana.com/events/evt_123" in msg


def test_check_monthly_sms_cap():
    # Max 5 SMS per month for budget control
    assert check_monthly_sms_cap(sent_count=0, max_cap=5) is True
    assert check_monthly_sms_cap(sent_count=4, max_cap=5) is True
    assert check_monthly_sms_cap(sent_count=5, max_cap=5) is False
    assert check_monthly_sms_cap(sent_count=6, max_cap=5) is False
