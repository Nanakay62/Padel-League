"""Tests for leaderboard rankings and tie-breaking."""

from app.domain.leaderboard import PlayerStats, rank_leaderboard


def test_leaderboard_sorting_by_points() -> None:
    p1 = PlayerStats(player_id="p1", points_won=40, points_lost=20)
    p2 = PlayerStats(player_id="p2", points_won=50, points_lost=15)
    p3 = PlayerStats(player_id="p3", points_won=30, points_lost=25)

    ranked = rank_leaderboard([p1, p2, p3])
    assert [p.player_id for p in ranked] == ["p2", "p1", "p3"]


def test_leaderboard_tiebreak_head_to_head_and_point_difference() -> None:
    # p1 and p2 have same points (45)
    # p1 has head-to-head advantage over p2 (e.g. 14 points vs 10)
    p1 = PlayerStats(
        player_id="p1",
        points_won=45,
        points_lost=25,
        head_to_head_points={"p2": 14},
    )
    p2 = PlayerStats(
        player_id="p2",
        points_won=45,
        points_lost=20,  # p2 has better point diff, but p1 won head-to-head
        head_to_head_points={"p1": 10},
    )

    ranked = rank_leaderboard([p2, p1])
    assert ranked[0].player_id == "p1"


def test_leaderboard_tiebreak_point_difference_when_no_h2h() -> None:
    # Equal points, no head-to-head, tie broken by point difference
    p1 = PlayerStats(player_id="p1", points_won=40, points_lost=24)  # diff = +16
    p2 = PlayerStats(player_id="p2", points_won=40, points_lost=20)  # diff = +20

    ranked = rank_leaderboard([p1, p2])
    assert ranked[0].player_id == "p2"
    assert ranked[1].player_id == "p1"
