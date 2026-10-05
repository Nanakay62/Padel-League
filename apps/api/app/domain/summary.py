"""WhatsApp-ready results summary formatting."""

from collections.abc import Sequence

from app.domain.leaderboard import PlayerStats


def format_whatsapp_summary(
    event_title: str,
    venue_name: str,
    point_target: int,
    total_rounds: int,
    leaderboard: Sequence[PlayerStats],
) -> str:
    """Format final event standings as rich WhatsApp-shareable message."""
    medals = {1: "🥇", 2: "🥈", 3: "🥉"}

    lines = [
        "🇬🇭 *PADEL GHANA — TOURNAMENT RESULTS* 🇬🇭",
        f"🎾 *{event_title}*",
        f"📍 Venue: {venue_name}",
        f"📊 Format: Americano ({point_target} pts/match)",
        f"🔄 Rounds: {total_rounds} | Players: {len(leaderboard)}",
        "",
        "🏆 *FINAL STANDINGS*:",
    ]

    for rank, p in enumerate(leaderboard, start=1):
        medal = f" {medals[rank]}" if rank in medals else ""
        diff_str = (
            f"+{p.point_difference}"
            if p.point_difference > 0
            else f"{p.point_difference}"
        )
        lines.append(
            f"{rank}.{medal} *{p.player_id}* — {p.points_won} pts ({diff_str})"
        )

    lines.extend(
        [
            "",
            "Play. Connect. Compete. 🇬🇭",
            "https://padelghana.com",
        ]
    )

    return "\n".join(lines)
