"""Leaderboard aggregation and tie-breaking for social padel formats."""

from collections import defaultdict
from dataclasses import dataclass, field
from functools import cmp_to_key
from typing import Any


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


@dataclass
class LeaderboardRow:
    player_id: str
    player_name: str
    total_points: int = 0
    games_played: int = 0
    points_lost: int = 0
    sit_outs: int = 0
    head_to_head: dict[str, int] = field(default_factory=lambda: defaultdict(int))

    @property
    def point_difference(self) -> int:
        return self.total_points - self.points_lost


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


def _compare_rows(a: LeaderboardRow, b: LeaderboardRow) -> int:
    if a.total_points != b.total_points:
        return -1 if a.total_points > b.total_points else 1

    h2h_a = a.head_to_head.get(b.player_id, 0)
    h2h_b = b.head_to_head.get(a.player_id, 0)
    if h2h_a != h2h_b:
        return -1 if h2h_a > h2h_b else 1

    if a.point_difference != b.point_difference:
        return -1 if a.point_difference > b.point_difference else 1

    if a.sit_outs != b.sit_outs:
        return -1 if a.sit_outs < b.sit_outs else 1

    return -1 if a.player_id < b.player_id else 1


def rank_leaderboard(stats: list[PlayerStats]) -> list[PlayerStats]:
    """Sort players according to the social tiebreak order."""
    return sorted(stats, key=cmp_to_key(_compare_players))


def rank_leaderboard_rows(rows: list[LeaderboardRow]) -> list[LeaderboardRow]:
    """Sort leaderboard rows by tiebreak order."""
    return sorted(rows, key=cmp_to_key(_compare_rows))


def calculate_leaderboard(
    players: list[Any],
    matches: list[Any],
) -> list[LeaderboardRow]:
    """Pure domain function aggregating match scores into sorted LeaderboardRows."""
    rows_map: dict[str, LeaderboardRow] = {}
    for p in players:
        pid = getattr(p, "id", None) or getattr(p, "player_id", None) or str(p)
        pname = getattr(p, "name", None) or getattr(p, "player_name", None) or pid
        rows_map[pid] = LeaderboardRow(player_id=pid, player_name=pname)

    for m in matches:
        if m.team_a_score is None or m.team_b_score is None:
            continue
        sa = m.team_a_score
        sb = m.team_b_score

        team_a = [m.team_a_p1, m.team_a_p2]
        team_b = [m.team_b_p1, m.team_b_p2]

        for pa in team_a:
            if pa in rows_map:
                rows_map[pa].total_points += sa
                rows_map[pa].points_lost += sb
                rows_map[pa].games_played += 1
                for pb in team_b:
                    rows_map[pa].head_to_head[pb] += sa

        for pb in team_b:
            if pb in rows_map:
                rows_map[pb].total_points += sb
                rows_map[pb].points_lost += sa
                rows_map[pb].games_played += 1
                for pa in team_a:
                    rows_map[pb].head_to_head[pa] += sb

    return rank_leaderboard_rows(list(rows_map.values()))
