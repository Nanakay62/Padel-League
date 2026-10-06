"""Pure domain tests for Team Americano (fixed pairs round robin)."""

from app.domain.team_americano import generate_team_round_robin


def test_team_round_robin_4_teams_2_courts():
    teams = ["Team Alpha", "Team Bravo", "Team Charlie", "Team Delta"]
    schedule = generate_team_round_robin(teams=teams, courts=2)

    # 4 teams = 3 rounds of round robin
    assert len(schedule) == 3

    for round_matches in schedule:
        assert len(round_matches) == 2
        active_teams = []
        for m in round_matches:
            active_teams.extend([m.team_a, m.team_b])
        # Invariant: No team on two courts simultaneously
        assert len(active_teams) == len(set(active_teams)) == 4


def test_team_round_robin_all_pairs_meet_once():
    teams = [f"T{i}" for i in range(1, 7)]  # 6 teams
    schedule = generate_team_round_robin(teams=teams, courts=3)

    # Total possible pairs = 6 * 5 / 2 = 15
    played_matchups = set()
    for round_matches in schedule:
        for m in round_matches:
            pair = tuple(sorted([m.team_a, m.team_b]))
            assert pair not in played_matchups, f"Teams {pair} met more than once"
            played_matchups.add(pair)

    assert len(played_matchups) == 15
