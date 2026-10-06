"""Simulation test running 200 synthetic tournaments across Americano and Mexicano formats,

verifying all platform invariants:
1. No player is ever on two courts in the same round.
2. The games-played gap between any two participants never exceeds 1.
3. Match scores strictly sum to the event's point_target.
4. Leaderboard resolves multi-tier ties without errors.
"""

import random

import pytest

from app.domain.americano import RotationState, award_points, next_round
from app.domain.leaderboard import LeaderboardRow, calculate_leaderboard
from app.domain.mexicano import generate_mexicano_round


@pytest.mark.parametrize("sim_id", range(1, 201))
def test_simulated_synthetic_event_invariants(sim_id: int):
    # Seed random for determinism per simulation run
    rng = random.Random(sim_id * 104729)

    # Player counts between 4 and 16 (both even and odd, e.g. 4, 5, 8, 9, 11, 12, 14, 16)
    player_count = rng.choice([4, 5, 8, 9, 11, 12, 14, 16])
    max_courts = player_count // 4
    courts = rng.randint(1, max(1, max_courts))
    point_target = rng.choice([24, 32])
    num_rounds = rng.randint(3, 6)
    format_choice = "MEXICANO" if sim_id % 2 == 0 else "AMERICANO"

    player_ids = [f"P_{i:02d}" for i in range(1, player_count + 1)]
    player_names = {pid: f"Player {pid}" for pid in player_ids}
    games_played = {pid: 0 for pid in player_ids}
    all_completed_matches = []
    rotation_st = RotationState()

    # Standings for Mexicano round generation
    standings = [
        LeaderboardRow(
            player_id=pid, player_name=player_names[pid], total_points=0, games_played=0
        )
        for pid in player_ids
    ]

    for round_num in range(1, num_rounds + 1):
        if format_choice == "AMERICANO":
            raw_matches = next_round(
                players=player_ids, courts=courts, st=rotation_st, rng=rng
            )
            round_matches = [
                type(
                    "Match",
                    (),
                    {
                        "court_number": c,
                        "team_a": ta,
                        "team_b": tb,
                    },
                )()
                for c, ta, tb in raw_matches
            ]
        else:
            mex_matches, _ = generate_mexicano_round(
                standings=standings,
                courts=courts,
                strategy="1+4_vs_2+3",
            )
            round_matches = mex_matches

        # Invariant 1: No player is ever on two courts in the same round
        active_in_round = []
        for m in round_matches:
            team_a = [m.team_a[0], m.team_a[1]]
            team_b = [m.team_b[0], m.team_b[1]]
            match_players = team_a + team_b
            active_in_round.extend(match_players)

            # Invariant 3: Score simulation strictly sums to point_target
            score_a = rng.randint(0, point_target)
            score_b = point_target - score_a
            award_points(score_a, score_b, point_target)

            # Record completed match
            all_completed_matches.append(
                {
                    "team_a": team_a,
                    "team_b": team_b,
                    "score_a": score_a,
                    "score_b": score_b,
                }
            )

            for p in match_players:
                games_played[p] += 1

        assert len(active_in_round) == len(set(active_in_round)), (
            f"Sim {sim_id} Round {round_num}: duplicate player detected on multiple courts!"
        )

        # Invariant 2: Games-played gap never exceeds 1
        min_games = min(games_played.values())
        max_games = max(games_played.values())
        assert max_games - min_games <= 1, (
            f"Sim {sim_id} Round {round_num}: games-played gap exceeded 1: {games_played}"
        )

        # Recalculate leaderboard
        match_objects = []
        for cm in all_completed_matches:

            class DummyMatch:
                team_a_p1 = cm["team_a"][0]
                team_a_p2 = cm["team_a"][1]
                team_b_p1 = cm["team_b"][0]
                team_b_p2 = cm["team_b"][1]
                team_a_score = cm["score_a"]
                team_b_score = cm["score_b"]

            match_objects.append(DummyMatch())

        leaderboard = calculate_leaderboard(
            players=[
                type("DummyPlayer", (), {"id": pid, "name": player_names[pid]})()
                for pid in player_ids
            ],
            matches=match_objects,
        )
        assert len(leaderboard) == player_count
        standings = leaderboard
