"""Leaderboard aggregation and tie-breaking for social padel formats."""

from collections import defaultdict
from dataclasses import dataclass, field


@dataclass
class PlayerStats:
    player_id: str
    points_won: int = 0
    points_lost: int = 0
    matches_played: int = 0
    sit_outs: int = 0
    head_to_head_points: dict[str, int] = field(
        default_factory=lambda: defaultdict(int)
    )

    @property
    def point_difference(self) -> int:
        return self.points_won - self.points_lost


def rank_leaderboard(
    stats: list[PlayerStats],
    tiebreak_order: list[str] | None = None,
) -> list[PlayerStats]:
    """Sort players by total points won, then point difference, then fewest sit outs."""
    if tiebreak_order is None:
        tiebreak_order = ["points", "point_difference", "fewest_sit_outs"]

    def sort_key(p: PlayerStats) -> tuple[int, int, int, str]:
        # Sort descending by points and point_difference, ascending by sit_outs
        return (-p.points_won, -p.point_difference, p.sit_outs, p.player_id)

    return sorted(stats, key=sort_key)
