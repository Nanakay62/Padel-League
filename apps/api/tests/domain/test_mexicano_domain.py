"""Pure domain tests for Mexicano dynamic leaderboard pairing and sit-out balancing."""

from app.domain.leaderboard import LeaderboardRow
from app.domain.mexicano import generate_mexicano_round


def test_mexicano_4_players_1_court_1_plus_4_vs_2_plus_3():
    standings = [
        LeaderboardRow(
            player_id="P1", player_name="Kofi", total_points=50, games_played=2
        ),
        LeaderboardRow(
            player_id="P2", player_name="Ama", total_points=45, games_played=2
        ),
        LeaderboardRow(
            player_id="P3", player_name="Kwame", total_points=40, games_played=2
        ),
        LeaderboardRow(
            player_id="P4", player_name="Akosua", total_points=35, games_played=2
        ),
    ]

    assignments, sit_outs = generate_mexicano_round(
        standings=standings,
        courts=1,
        strategy="1+4_vs_2+3",
    )

    assert len(sit_outs) == 0
    assert len(assignments) == 1
    m = assignments[0]
    assert m.court_number == 1
    # Team A: 1 + 4
    assert {m.team_a[0], m.team_a[1]} == {"P1", "P4"}
    # Team B: 2 + 3
    assert {m.team_b[0], m.team_b[1]} == {"P2", "P3"}


def test_mexicano_4_players_1_court_1_plus_3_vs_2_plus_4():
    standings = [
        LeaderboardRow(
            player_id="P1", player_name="Kofi", total_points=50, games_played=2
        ),
        LeaderboardRow(
            player_id="P2", player_name="Ama", total_points=45, games_played=2
        ),
        LeaderboardRow(
            player_id="P3", player_name="Kwame", total_points=40, games_played=2
        ),
        LeaderboardRow(
            player_id="P4", player_name="Akosua", total_points=35, games_played=2
        ),
    ]

    assignments, _ = generate_mexicano_round(
        standings=standings,
        courts=1,
        strategy="1+3_vs_2+4",
    )

    assert len(assignments) == 1
    m = assignments[0]
    assert {m.team_a[0], m.team_a[1]} == {"P1", "P3"}
    assert {m.team_b[0], m.team_b[1]} == {"P2", "P4"}


def test_mexicano_8_players_2_courts():
    standings = [
        LeaderboardRow(
            player_id=f"P{i}",
            player_name=f"Player {i}",
            total_points=100 - i * 5,
            games_played=3,
        )
        for i in range(1, 9)
    ]

    assignments, sit_outs = generate_mexicano_round(
        standings=standings,
        courts=2,
        strategy="1+4_vs_2+3",
    )

    assert len(sit_outs) == 0
    assert len(assignments) == 2

    # Court 1: top 4 (P1, P2, P3, P4)
    c1 = assignments[0]
    assert c1.court_number == 1
    assert {c1.team_a[0], c1.team_a[1]} == {"P1", "P4"}
    assert {c1.team_b[0], c1.team_b[1]} == {"P2", "P3"}

    # Court 2: next 4 (P5, P6, P7, P8)
    c2 = assignments[1]
    assert c2.court_number == 2
    assert {c2.team_a[0], c2.team_a[1]} == {"P5", "P8"}
    assert {c2.team_b[0], c2.team_b[1]} == {"P6", "P7"}


def test_mexicano_11_players_2_courts_sit_out_fairness():
    # 11 players on 2 courts -> 8 play, 3 sit out
    # Players P1, P2, P3 have played 3 games, others have played 2 games
    standings = [
        LeaderboardRow(
            player_id="P1", player_name="P1", total_points=70, games_played=3
        ),
        LeaderboardRow(
            player_id="P2", player_name="P2", total_points=65, games_played=3
        ),
        LeaderboardRow(
            player_id="P3", player_name="P3", total_points=60, games_played=3
        ),
    ] + [
        LeaderboardRow(
            player_id=f"P{i}", player_name=f"P{i}", total_points=50 - i, games_played=2
        )
        for i in range(4, 12)
    ]

    assignments, sit_outs = generate_mexicano_round(
        standings=standings,
        courts=2,
        strategy="1+4_vs_2+3",
    )

    assert len(sit_outs) == 3
    # Players with most games (P1, P2, P3) must sit out to keep games-played gap <= 1
    assert set(sit_outs) == {"P1", "P2", "P3"}
    assert len(assignments) == 2

    # Invariant: no player on 2 courts
    active_players = []
    for m in assignments:
        active_players.extend([m.team_a[0], m.team_a[1], m.team_b[0], m.team_b[1]])
    assert len(active_players) == len(set(active_players)) == 8
