"""Tests for pure domain doubles margin-aware Elo rating engine."""

from app.domain.rating import (
    MatchParticipant,
    RatingMatch,
    calculate_rating_updates,
    get_level_band,
    replay_rating_events,
)


def test_level_band_mapping():
    assert get_level_band(1.2) == "Beginner"
    assert get_level_band(2.0) == "Beginner"
    assert get_level_band(2.5) == "Improver"
    assert get_level_band(3.0) == "Improver"
    assert get_level_band(3.5) == "Intermediate"
    assert get_level_band(4.0) == "Intermediate"
    assert get_level_band(4.8) == "Advanced"
    assert get_level_band(5.5) == "Advanced"
    assert get_level_band(6.0) == "Expert"
    assert get_level_band(7.0) == "Expert"


def test_doubles_rating_update_underdog_win():
    # Team A: 3.0 & 3.0 (Avg 3.0)
    # Team B: 4.0 & 4.0 (Avg 4.0) - Favorites
    # Team A upsets Team B 16 - 8 (point target 24)
    team_a = [
        MatchParticipant(
            player_id="p1", rating=3.0, matches_played=3
        ),  # provisional K=0.30
        MatchParticipant(
            player_id="p2", rating=3.0, matches_played=15
        ),  # established K=0.12
    ]
    team_b = [
        MatchParticipant(
            player_id="p3", rating=4.0, matches_played=20
        ),  # established K=0.12
        MatchParticipant(
            player_id="p4", rating=4.0, matches_played=5
        ),  # provisional K=0.30
    ]

    match = RatingMatch(
        match_id="m1",
        team_a=team_a,
        team_b=team_b,
        score_a=16,
        score_b=8,
        point_target=24,
    )

    updates = calculate_rating_updates(match)

    # All four players receive updates
    assert len(updates) == 4
    u1 = next(u for u in updates if u.player_id == "p1")
    u2 = next(u for u in updates if u.player_id == "p2")
    u3 = next(u for u in updates if u.player_id == "p3")
    u4 = next(u for u in updates if u.player_id == "p4")

    # Team A gained points, Team B lost points
    assert u1.delta > 0
    assert u2.delta > 0
    assert u3.delta < 0
    assert u4.delta < 0

    # Provisional player with K=0.30 experiences larger delta than established K=0.12
    assert u1.delta > u2.delta
    assert abs(u4.delta) > abs(u3.delta)

    # Explanation contains context
    assert "beat" in u1.explanation.lower()
    assert "rated" in u1.explanation.lower()


def test_per_match_change_cap_and_boundaries():
    # Extreme blowout: 1.0 vs 7.0 pair, but 1.0 pair somehow wins 24-0
    team_a = [
        MatchParticipant(player_id="weak_1", rating=1.0, matches_played=0),
        MatchParticipant(player_id="weak_2", rating=1.0, matches_played=0),
    ]
    team_b = [
        MatchParticipant(player_id="pro_1", rating=7.0, matches_played=50),
        MatchParticipant(player_id="pro_2", rating=7.0, matches_played=50),
    ]
    match = RatingMatch(
        match_id="m_blowout",
        team_a=team_a,
        team_b=team_b,
        score_a=24,
        score_b=0,
        point_target=24,
    )

    updates = calculate_rating_updates(match)
    for u in updates:
        # Cap is ±0.20 per match
        assert abs(u.delta) <= 0.20
        # Rating clamped between 1.0 and 7.0
        assert 1.0 <= u.new_rating <= 7.0


def test_sandbagging_anomaly_flag():
    # Extreme unexpected result flagged for review
    team_a = [
        MatchParticipant(player_id="p1", rating=2.0, matches_played=2),
        MatchParticipant(player_id="p2", rating=2.0, matches_played=2),
    ]
    team_b = [
        MatchParticipant(player_id="p3", rating=5.5, matches_played=30),
        MatchParticipant(player_id="p4", rating=5.5, matches_played=30),
    ]
    match = RatingMatch(
        match_id="m_upset",
        team_a=team_a,
        team_b=team_b,
        score_a=24,
        score_b=2,
        point_target=24,
    )
    updates = calculate_rating_updates(match)
    # At least one update flags review for potential sandbagging/unrated skill
    assert any(u.requires_review for u in updates)


def test_deterministic_replay_from_match_history():
    # Initial ratings
    initial_ratings = {"alice": 2.5, "bob": 2.5, "charlie": 2.5, "david": 2.5}

    match_1 = RatingMatch(
        match_id="m1",
        team_a=[
            MatchParticipant("alice", 2.5, 0),
            MatchParticipant("bob", 2.5, 0),
        ],
        team_b=[
            MatchParticipant("charlie", 2.5, 0),
            MatchParticipant("david", 2.5, 0),
        ],
        score_a=14,
        score_b=10,
        point_target=24,
    )

    # Replay first match
    ratings_r1, _events_r1 = replay_rating_events(initial_ratings, [match_1])
    assert ratings_r1["alice"] > 2.5
    assert ratings_r1["charlie"] < 2.5

    # If score is corrected from 14-10 to 10-14, replaying reverses the outcome deterministically
    match_1_corrected = RatingMatch(
        match_id="m1",
        team_a=[
            MatchParticipant("alice", 2.5, 0),
            MatchParticipant("bob", 2.5, 0),
        ],
        team_b=[
            MatchParticipant("charlie", 2.5, 0),
            MatchParticipant("david", 2.5, 0),
        ],
        score_a=10,
        score_b=14,
        point_target=24,
    )

    ratings_corr, events_corr = replay_rating_events(
        initial_ratings, [match_1_corrected]
    )
    assert ratings_corr["alice"] < 2.5
    assert ratings_corr["charlie"] > 2.5
    assert len(events_corr) == 4
