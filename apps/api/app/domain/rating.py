"""Doubles rating engine on 0.0-7.0 scale. Pure Python domain logic."""

from collections.abc import Mapping


def expected_score(rating_a: float, rating_b: float) -> float:
    """Elo expectation on a 0-7 padel-style scale (1 level ~ 400 Elo points / 7)."""
    return 1.0 / (1.0 + 10 ** ((rating_b - rating_a) * 7 / 400))


def update_doubles_rating(
    team_a: Mapping[str, float],
    team_b: Mapping[str, float],
    games_a: int,
    games_b: int,
    reliability: Mapping[str, float],
    k_new: float = 0.30,
    k_stable: float = 0.12,
    max_change_per_match: float = 0.50,
) -> dict[str, float]:
    """team_a/team_b: {player_id: rating}.
    Margin-aware: a 6-0 6-1 win moves ratings more than 7-5 7-6.
    Returns new ratings bounded between 0.00 and 7.00.
    """
    total_games = games_a + games_b
    if total_games == 0:
        raise ValueError("A rated match needs at least one game or point.")
    if not team_a or not team_b:
        raise ValueError("Both teams must have players.")

    avg_a = sum(team_a.values()) / len(team_a)
    avg_b = sum(team_b.values()) / len(team_b)
    expected = expected_score(avg_a, avg_b)
    actual = games_a / total_games

    out: dict[str, float] = {}
    for team, sign in ((team_a, 1), (team_b, -1)):
        for player, rating in team.items():
            k = k_new if reliability.get(player, 0.0) < 0.85 else k_stable
            delta = sign * k * (actual - expected)
            # Cap delta per match
            delta = max(-max_change_per_match, min(max_change_per_match, delta))
            new_rating = round(min(7.0, max(0.0, rating + delta)), 2)
            out[player] = new_rating
    return out
