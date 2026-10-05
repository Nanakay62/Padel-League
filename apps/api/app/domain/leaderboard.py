"""Leaderboard aggregation and tie-breaking for social padel formats."""

from collections import defaultdict
from dataclasses import dataclass, field
from functools import cmp_to_key


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


def _compare_players(a: PlayerStats, b: PlayerStats) -> int:
    # 1. Total points won (higher is better)
    if a.points_won != b.points_won:
        return -1 if a.points_won > b.points_won else 1

    # 2. Head-to-head points if played
    h2h_a = a.head_to_head_points.get(b.player_id, 0)
    h2h_b = b.head_to_head_points.get(a.player_id, 0)
    if h2h_a != h2h_b:
        return -1 if h2h_a > h2h_b else 1

    # 3. Point difference (higher is better)
    if a.point_difference != b.point_difference:
        return -1 if a.point_difference > b.point_difference else 1

    # 4. Fewest sit outs (lower is better)
    if a.sit_outs != b.sit_outs:
        return -1 if a.sit_outs < b.sit_outs else 1

    # 5. Deterministic tiebreak on ID
    return -1 if a.player_id < b.player_id else 1


def rank_leaderboard(stats: list[PlayerStats]) -> list[PlayerStats]:
    """Sort players according to the social tiebreak order:
    1. Points won
    2. Head-to-head points
    3. Point difference
    4. Fewest sit-outs
    5. Deterministic identifier
    """
    return sorted(stats, key=cmp_to_key(_compare_players))
