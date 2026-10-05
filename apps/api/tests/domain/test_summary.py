"""Test WhatsApp summary text generation."""

from app.domain.leaderboard import PlayerStats
from app.domain.summary import format_whatsapp_summary


def test_format_whatsapp_summary() -> None:
    leaderboard = [
        PlayerStats(player_id="Kwame A.", points_won=142, points_lost=114),
        PlayerStats(player_id="Nana K.", points_won=138, points_lost=116),
        PlayerStats(player_id="Ama B.", points_won=130, points_lost=118),
    ]

    summary = format_whatsapp_summary(
        event_title="Thursday Americano",
        venue_name="Accra Padel Club",
        point_target=24,
        total_rounds=8,
        leaderboard=leaderboard,
    )

    assert "PADEL GHANA" in summary
    assert "Thursday Americano" in summary
    assert "Accra Padel Club" in summary
    assert "1. 🥇 *Kwame A.* — 142 pts (+28)" in summary
    assert "2. 🥈 *Nana K.* — 138 pts (+22)" in summary
    assert "3. 🥉 *Ama B.* — 130 pts (+12)" in summary
