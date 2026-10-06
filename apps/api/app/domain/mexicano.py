"""Pure domain logic for Mexicano dynamic pairing and sit-out balancing."""

from dataclasses import dataclass
from typing import Literal

from app.domain.leaderboard import LeaderboardRow


@dataclass(frozen=True)
class MexicanoMatch:
    court_number: int
    team_a: tuple[str, str]
    team_b: tuple[str, str]


def generate_mexicano_round(
    standings: list[LeaderboardRow],
    courts: int,
    strategy: Literal["1+4_vs_2+3", "1+3_vs_2+4"] = "1+4_vs_2+3",
) -> tuple[list[MexicanoMatch], list[str]]:
    """Generate Mexicano round pairings dynamically based on current leaderboard standings.

    - Total slots available = courts * 4.
    - If total players > available slots:
      - Players with the HIGHEST games played sit out first to guarantee
        that the games-played gap between any two participants never exceeds 1.
    - Active players are ordered by standing.
    - Each court takes 4 consecutive players (Court 1: 1-4, Court 2: 5-8, etc.).
    - Pairings per court adhere to selected rotation strategy:
      - 1+4 vs 2+3 (default: balanced high+low vs middle)
      - 1+3 vs 2+4 (alternate option)

    Returns:
        tuple[list[MexicanoMatch], list[str_sit_out_player_ids]]
    """
    total_players = len(standings)
    needed_players = courts * 4

    if total_players < 4:
        raise ValueError("Mexicano requires at least 4 players.")
    if courts < 1:
        raise ValueError("Must specify at least 1 court.")

    sit_outs: list[str] = []
    active_standings = list(standings)

    if total_players > needed_players:
        num_sit_outs = total_players - needed_players
        # Sort candidates to sit out:
        # 1. Highest games played first (ensures gap <= 1)
        # 2. Lowest total points won next (standard social convention)
        # 3. Deterministic player_id
        sit_out_candidates = sorted(
            standings,
            key=lambda r: (-r.games_played, r.total_points, r.player_id),
        )
        sit_out_set = {r.player_id for r in sit_out_candidates[:num_sit_outs]}
        sit_outs = [r.player_id for r in sit_out_candidates[:num_sit_outs]]
        active_standings = [r for r in standings if r.player_id not in sit_out_set]

    # Re-sort active standings by rank (total points desc, tiebreaks)
    active_standings.sort(
        key=lambda r: (-r.total_points, -r.point_difference, r.player_id)
    )

    matches: list[MexicanoMatch] = []
    for court_idx in range(courts):
        start_idx = court_idx * 4
        group = active_standings[start_idx : start_idx + 4]
        if len(group) < 4:
            break

        p1, p2, p3, p4 = (
            group[0].player_id,
            group[1].player_id,
            group[2].player_id,
            group[3].player_id,
        )

        if strategy == "1+3_vs_2+4":
            team_a = (p1, p3)
            team_b = (p2, p4)
        else:  # default "1+4_vs_2+3"
            team_a = (p1, p4)
            team_b = (p2, p3)

        matches.append(
            MexicanoMatch(
                court_number=court_idx + 1,
                team_a=team_a,
                team_b=team_b,
            )
        )

    return matches, sit_outs
