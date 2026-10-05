"""Unit and property-based tests for Americano rotation and scoring."""

import random

import pytest
from hypothesis import given
from hypothesis import settings as hyp_settings
from hypothesis import strategies as st

from app.domain.americano import RotationState, award_points, next_round


def test_award_points_valid() -> None:
    # 24-point target
    award_points(14, 10, 24)
    award_points(24, 0, 24)
    award_points(12, 12, 24)


def test_award_points_invalid() -> None:
    with pytest.raises(ValueError, match="Scores must add up to 24"):
        award_points(14, 11, 24)

    with pytest.raises(ValueError, match="Scores cannot be negative"):
        award_points(-1, 25, 24)


def test_four_players_one_court_produces_three_unique_partnerships() -> None:
    players = ["Kwame", "Kofi", "Ama", "Abena"]
    state = RotationState()
    rng = random.Random(42)

    partnerships: set[frozenset[str]] = set()

    for _ in range(3):
        matches = next_round(players, courts=1, st=state, rng=rng)
        assert len(matches) == 1
        court, team_a, team_b = matches[0]
        assert court == 1
        partnerships.add(frozenset(team_a))
        partnerships.add(frozenset(team_b))

    # With 4 players, there are exactly 3 possible pairs (Kwame+Kofi, Kwame+Ama, Kwame+Abena, etc.)
    # In each round, 2 pairs play, so over 3 rounds all 3 pairs must occur twice each (each round has 2 pairs)
    # Total unique pairs in combinations(4, 2) is 6.
    # In 3 rounds with 2 pairs each = 6 pairs. Since nobody partners twice until all pairs used:
    # All 6 possible pairings should be exhausted!
    assert len(partnerships) == 6


@given(
    num_players=st.integers(min_value=4, max_value=24),
    courts=st.integers(min_value=1, max_value=6),
    num_rounds=st.integers(min_value=1, max_value=8),
)
@hyp_settings(max_examples=50, deadline=None)
def test_rotation_invariants_hypothesis(
    num_players: int, courts: int, num_rounds: int
) -> None:
    players = [f"player_{i}" for i in range(num_players)]
    state = RotationState()
    rng = random.Random(1337)

    for _ in range(num_rounds):
        matches = next_round(players, courts=courts, st=state, rng=rng)

        # 1. Matches count matches formula: min(courts, len(players) // 4)
        expected_matches = min(courts, num_players // 4)
        assert len(matches) == expected_matches

        # 2. No player on two courts in the same round
        round_players: list[str] = []
        for _court, team_a, team_b in matches:
            round_players.extend(team_a)
            round_players.extend(team_b)

        assert len(round_players) == len(set(round_players)), (
            "A player was scheduled on multiple courts in the same round!"
        )

        # 3. Games-played gap never exceeds 1 across all participants
        played_counts = [state.played[p] for p in players]
        gap = max(played_counts) - min(played_counts)
        assert gap <= 1, (
            f"Fairness gap exceeded 1: min={min(played_counts)}, max={max(played_counts)}"
        )
