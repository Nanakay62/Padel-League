"""Americano: fixed rotation, individual scoring. Pure Python domain logic."""

import random
from collections import defaultdict
from dataclasses import dataclass, field


def _counter() -> defaultdict[str, int]:
    return defaultdict(int)


@dataclass
class RotationState:
    """History tracking to keep the rotation fair across the entire event."""

    played: dict[str, int] = field(default_factory=lambda: defaultdict(int))
    partnered: dict[frozenset[str], int] = field(
        default_factory=lambda: defaultdict(int)
    )
    opposed: dict[frozenset[str], int] = field(default_factory=lambda: defaultdict(int))


def _pick_players(
    players: list[str],
    seats: int,
    st: RotationState,
    rng: random.Random,
) -> list[str]:
    """Fewest games played sit in first; ties broken randomly (fair sit-outs)."""
    pool = sorted(players, key=lambda p: (st.played[p], rng.random()))
    return pool[:seats]


def _make_pairs(
    group: list[str],
    st: RotationState,
    rng: random.Random,
) -> list[tuple[str, str]]:
    """Greedy pairing: repeatedly pair the two players who have partnered least."""
    remaining, pairs = list(group), []
    rng.shuffle(remaining)
    while remaining:
        a = remaining.pop(0)
        b = min(
            remaining, key=lambda x: (st.partnered[frozenset((a, x))], rng.random())
        )
        remaining.remove(b)
        pairs.append((a, b))
    return pairs


def _opponent_history(
    st: RotationState, team_a: tuple[str, str], team_b: tuple[str, str]
) -> int:
    return sum(st.opposed[frozenset((x, y))] for x in team_a for y in team_b)


def next_round(
    players: list[str],
    courts: int,
    st: RotationState,
    rng: random.Random | None = None,
) -> list[tuple[int, tuple[str, str], tuple[str, str]]]:
    """Return [(court, team_a, team_b), ...] for one round and update history."""
    if rng is None:
        rng = random.Random()
    seats = min(courts * 4, (len(players) // 4) * 4)
    if seats == 0:
        raise ValueError("Americano needs at least 4 players.")
    pairs = _make_pairs(_pick_players(players, seats, st, rng), st, rng)
    matches: list[tuple[int, tuple[str, str], tuple[str, str]]] = []
    court = 1
    while pairs:
        a = pairs.pop(0)
        b = min(pairs, key=lambda t: (_opponent_history(st, a, t), rng.random()))
        pairs.remove(b)
        matches.append((court, a, b))
        court += 1
        st.partnered[frozenset(a)] += 1
        st.partnered[frozenset(b)] += 1
        for x in a:
            st.played[x] += 1
            for y in b:
                st.opposed[frozenset((x, y))] += 1
        for y in b:
            st.played[y] += 1
    return matches


def award_points(team_a_score: int, team_b_score: int, target: int) -> None:
    """Validate a rally-scoring result: scores must sum exactly to target."""
    if team_a_score < 0 or team_b_score < 0:
        raise ValueError("Scores cannot be negative.")
    if team_a_score + team_b_score != target:
        raise ValueError(
            f"Scores must add up to {target} (got {team_a_score}+{team_b_score})."
        )
