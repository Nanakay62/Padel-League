"""Tests for pure domain club metrics calculations and weekly summary formatting."""

from app.domain.club_metrics import (
    calculate_venue_metrics,
    format_weekly_club_summary,
)


def test_calculate_venue_metrics():
    metrics = calculate_venue_metrics(
        court_hours_used=24.0,
        capacity_hours=100.0,
        confirmed_players=32,
        waitlist_demand=8,
        new_players_count=6,
        total_revenue_pesewas=176000,  # GH₵ 1,760.00
        unreported_matches_count=1,
    )

    assert metrics.fill_rate_percent == 24.0
    assert metrics.court_hours_used == 24.0
    assert metrics.confirmed_players == 32
    assert metrics.waitlist_demand == 8
    assert metrics.new_players_count == 6
    assert metrics.total_revenue_pesewas == 176000
    assert metrics.total_revenue_ghs == 1760.0
    assert metrics.unreported_matches_count == 1


def test_calculate_venue_metrics_zero_capacity():
    metrics = calculate_venue_metrics(
        court_hours_used=0.0,
        capacity_hours=0.0,
        confirmed_players=0,
        waitlist_demand=0,
        new_players_count=0,
        total_revenue_pesewas=0,
        unreported_matches_count=0,
    )
    assert metrics.fill_rate_percent == 0.0


def test_format_weekly_club_summary():
    metrics = calculate_venue_metrics(
        court_hours_used=36.0,
        capacity_hours=80.0,
        confirmed_players=48,
        waitlist_demand=12,
        new_players_count=7,
        total_revenue_pesewas=264000,  # GH₵ 2,640.00
        unreported_matches_count=0,
    )

    summary = format_weekly_club_summary(
        venue_name="Cantonments Padel Club",
        metrics=metrics,
        week_label="Week 41 (Oct 2026)",
    )

    assert "Cantonments Padel Club" in summary
    assert "Week 41 (Oct 2026)" in summary
    assert "45.0%" in summary  # 36 / 80 = 45%
    assert "36.0 hrs" in summary
    assert "12 players" in summary  # unmet demand
    assert "GH₵ 2,640.00" in summary
    assert "WhatsApp" in summary or "Organiser" in summary
