"""Pure domain tests for box and pair leagues."""

from app.domain.boxes import (
    Box,
    BoxEntry,
    BoxMatchResult,
    compute_box_standings,
    generate_round_robin_fixtures,
    promote_and_relegate,
    resolve_deadline_unplayed_matches,
    validate_substitute_eligibility,
)


def test_box_entry_diff_properties() -> None:
    entry = BoxEntry(
        pair_id="pair-1",
        name="Team Alpha",
        points=7,
        sets_won=5,
        sets_lost=2,
        games_won=32,
        games_lost=20,
    )
    assert entry.set_difference == 3
    assert entry.game_difference == 12


def test_generate_round_robin_fixtures() -> None:
    # 4 pairs: 6 matches
    pairs_4 = ["P1", "P2", "P3", "P4"]
    fixtures_4 = generate_round_robin_fixtures(pairs_4)
    assert len(fixtures_4) == 6
    # Verify every pair plays every other pair exactly once
    pair_matchups = set()
    for home, away in fixtures_4:
        assert home != away
        matchup = tuple(sorted([home, away]))
        assert matchup not in pair_matchups
        pair_matchups.add(matchup)
    assert len(pair_matchups) == 6

    # 5 pairs: 10 matches
    pairs_5 = [f"P{i}" for i in range(1, 6)]
    fixtures_5 = generate_round_robin_fixtures(pairs_5)
    assert len(fixtures_5) == 10

    # 6 pairs: 15 matches
    pairs_6 = [f"P{i}" for i in range(1, 7)]
    fixtures_6 = generate_round_robin_fixtures(pairs_6)
    assert len(fixtures_6) == 15


def test_standings_points_3_1_0_rule() -> None:
    pairs = [
        BoxEntry(pair_id="A", name="Pair A"),
        BoxEntry(pair_id="B", name="Pair B"),
        BoxEntry(pair_id="C", name="Pair C"),
    ]
    # Match 1: A beats B (played: 2 sets to 1) -> A gets 3, B gets 1 (played loss)
    # Match 2: C beats B (played: 2 sets to 0) -> C gets 3, B gets 1
    # Match 3: A beats C via Walkover (C gave walkover) -> A gets 3, C gets 0 (walkover given)
    results = [
        BoxMatchResult(
            match_id="m1",
            team_a_pair_id="A",
            team_b_pair_id="B",
            team_a_sets=2,
            team_b_sets=1,
            team_a_games=14,
            team_b_games=10,
        ),
        BoxMatchResult(
            match_id="m2",
            team_a_pair_id="C",
            team_b_pair_id="B",
            team_a_sets=2,
            team_b_sets=0,
            team_a_games=12,
            team_b_games=4,
        ),
        BoxMatchResult(
            match_id="m3",
            team_a_pair_id="A",
            team_b_pair_id="C",
            is_walkover=True,
            walkover_winner_pair_id="A",
            team_a_sets=2,
            team_b_sets=0,
            team_a_games=12,
            team_b_games=0,
        ),
    ]

    standings = compute_box_standings(pairs, results)

    # A: 2 wins (6 pts) -> 1st
    # B: 2 played losses (2 pts) -> 2nd
    # C: 1 win (3 pts) + 1 walkover loss (0 pts) -> 3 pts
    # Wait: C has 3 pts, B has 2 pts, A has 6 pts
    assert standings[0].pair_id == "A"
    assert standings[0].points == 6
    assert standings[1].pair_id == "C"
    assert standings[1].points == 3
    assert standings[2].pair_id == "B"
    assert standings[2].points == 2


def test_standings_tiebreak_head_to_head_over_sets() -> None:
    # A and B both finish with 3 points, but A beat B head-to-head
    pairs = [
        BoxEntry(pair_id="A", name="Pair A"),
        BoxEntry(pair_id="B", name="Pair B"),
    ]
    # A beats B (2 sets to 1, 13 games to 12)
    # Notice: B has set diff -1 and A has +1, but suppose B played another match giving B better set diff
    # Let's add C:
    pairs = [
        BoxEntry(pair_id="A", name="Pair A"),
        BoxEntry(pair_id="B", name="Pair B"),
        BoxEntry(pair_id="C", name="Pair C"),
    ]
    # A beats B head-to-head: 2-1
    # B beats C: 2-0 (B gains +2 set diff, 12-0 games)
    # C beats A: 2-0 (A gains -2 set diff against C)
    # Points:
    # A: 1 win, 1 loss = 3 + 1 = 4 pts
    # B: 1 win, 1 loss = 3 + 1 = 4 pts
    # C: 1 win, 1 loss = 3 + 1 = 4 pts
    # This is a 3-way cycle: head-to-head is cyclic (A beat B, B beat C, C beat A)
    # So it falls back to set difference:
    # B set diff: (1 - 2) + (2 - 0) = +1
    # C set diff: (0 - 2) + (2 - 0) = 0
    # A set diff: (2 - 1) + (0 - 2) = -1
    results = [
        BoxMatchResult("m1", "A", "B", 2, 1, 14, 11),
        BoxMatchResult("m2", "B", "C", 2, 0, 12, 4),
        BoxMatchResult("m3", "C", "A", 2, 0, 12, 4),
    ]
    standings = compute_box_standings(pairs, results)
    assert [s.pair_id for s in standings] == ["B", "C", "A"]


def test_standings_two_way_head_to_head_tiebreak() -> None:
    # When exactly two teams tie on points, head-to-head breaks the tie even if set diff is worse.
    # What if A beat B 2-1, but B got a walkover win vs C (3 pts, +2 sets) and A lost to C (1 pt, -2 sets)?
    results_head_to_head = [
        BoxMatchResult("m1", "A", "B", 2, 1, 13, 12),  # A beats B
        BoxMatchResult("m2", "C", "A", 2, 0, 12, 2),  # C beats A 2-0 (played)
        BoxMatchResult(
            "m3",
            "B",
            "C",
            team_a_sets=2,
            team_b_sets=0,
            team_a_games=12,
            team_b_games=0,
            is_walkover=True,
            walkover_winner_pair_id="B",
        ),  # B wins by walkover
    ]
    # A: 1 win (3) + 1 played loss (1) = 4 points. Sets: 2 - 3 = -1.
    # B: 1 played loss (1) + 1 walkover win (3) = 4 points. Sets: 3 - 2 = +1.
    # B has better set diff (+1 vs -1), but A won Head-to-Head against B!
    two_way_standings = compute_box_standings(
        [
            BoxEntry(pair_id="A", name="A"),
            BoxEntry(pair_id="B", name="B"),
            BoxEntry(pair_id="C", name="C"),
        ],
        results_head_to_head,
    )
    # A and B both have 4 points. A beat B head to head, so A must be ranked above B.
    assert two_way_standings[0].pair_id == "A"
    assert two_way_standings[1].pair_id == "B"


def test_substitute_policy_validation() -> None:
    # Substitute player rating must not exceed replaced player rating or box ceiling
    # Valid sub: rating 2.5 replaces rating 3.0 (under ceiling 3.5)
    is_valid, msg = validate_substitute_eligibility(
        sub_rating=2.5,
        replaced_player_rating=3.0,
        box_ceiling_rating=3.5,
        subs_used_by_pair=0,
        max_subs_allowed=1,
    )
    assert is_valid is True
    assert msg == "Eligible"

    # Invalid: exceeds replaced player rating
    is_valid, msg = validate_substitute_eligibility(
        sub_rating=3.2,
        replaced_player_rating=3.0,
        box_ceiling_rating=3.5,
        subs_used_by_pair=0,
        max_subs_allowed=1,
    )
    assert is_valid is False
    assert "exceeds" in msg.lower()

    # Invalid: exceeds box ceiling
    is_valid, msg = validate_substitute_eligibility(
        sub_rating=3.6,
        replaced_player_rating=3.8,
        box_ceiling_rating=3.5,
        subs_used_by_pair=0,
        max_subs_allowed=1,
    )
    assert is_valid is False
    assert "ceiling" in msg.lower()

    # Invalid: already used max substitutes for cycle
    is_valid, msg = validate_substitute_eligibility(
        sub_rating=2.8,
        replaced_player_rating=3.0,
        box_ceiling_rating=3.5,
        subs_used_by_pair=1,
        max_subs_allowed=1,
    )
    assert is_valid is False
    assert "limit" in msg.lower()


def test_resolve_deadline_unplayed_matches() -> None:
    # Matches unplayed at cycle deadline:
    # 1. Neither pair played: both get 0 points, status UNPLAYED_VOID
    # 2. Pair A submitted walkover claim vs Pair B (defaulting): Pair A gets walkover win (3 pts, 2-0 sets, 12-0 games), B gets walkover loss (0 pts)
    fixtures = [
        {
            "match_id": "m1",
            "team_a_pair_id": "P1",
            "team_b_pair_id": "P2",
            "walkover_claimant": None,
        },
        {
            "match_id": "m2",
            "team_a_pair_id": "P3",
            "team_b_pair_id": "P4",
            "walkover_claimant": "P3",
        },
    ]
    resolved = resolve_deadline_unplayed_matches(fixtures)
    assert len(resolved) == 2

    # m1: voided
    assert resolved[0].match_id == "m1"
    assert resolved[0].team_a_sets == 0
    assert resolved[0].team_b_sets == 0
    assert resolved[0].is_walkover is False

    # m2: walkover awarded to P3
    assert resolved[1].match_id == "m2"
    assert resolved[1].is_walkover is True
    assert resolved[1].walkover_winner_pair_id == "P3"
    assert resolved[1].team_a_sets == 2
    assert resolved[1].team_b_sets == 0


def test_four_week_cycle_simulation_promotion_and_relegation() -> None:
    """Acceptance criterion: A simulated four-week box cycle promotes and relegates automatically;
    Box 1 cannot be promoted, last box cannot be relegated.
    """
    # 3 Boxes with 4 entries each
    box1_entries = [
        BoxEntry("B1_P1", "Box 1 Champion", points=9),
        BoxEntry("B1_P2", "Box 1 Runner Up", points=6),
        BoxEntry("B1_P3", "Box 1 Mid", points=3),
        BoxEntry("B1_P4", "Box 1 Last", points=0),
    ]
    box2_entries = [
        BoxEntry("B2_P1", "Box 2 Top", points=9),
        BoxEntry("B2_P2", "Box 2 Mid Top", points=6),
        BoxEntry("B2_P3", "Box 2 Mid Bottom", points=3),
        BoxEntry("B2_P4", "Box 2 Bottom", points=0),
    ]
    box3_entries = [
        BoxEntry("B3_P1", "Box 3 Top", points=9),
        BoxEntry("B3_P2", "Box 3 Mid Top", points=6),
        BoxEntry("B3_P3", "Box 3 Mid Bottom", points=3),
        BoxEntry("B3_P4", "Box 3 Bottom", points=0),
    ]

    boxes = [
        Box(box_number=1, entries=box1_entries),
        Box(box_number=2, entries=box2_entries),
        Box(box_number=3, entries=box3_entries),
    ]

    # Promote 1, Relegate 1
    cycle_1 = promote_and_relegate(boxes, promote=1, relegate=1)

    # Box 1: B1_P1 (was 1st in Box 1) CANNOT be promoted (stays in Box 1)
    # B1_P4 (was 4th in Box 1) relegated to Box 2
    # B2_P1 (was 1st in Box 2) promoted to Box 1
    box1_names = [e.name for e in cycle_1[0].entries]
    assert "Box 1 Champion" in box1_names  # Top of Box 1 stayed in Box 1
    assert "Box 2 Top" in box1_names  # Top of Box 2 entered Box 1
    assert "Box 1 Last" not in box1_names  # Relegated out

    # Box 2:
    box2_names = [e.name for e in cycle_1[1].entries]
    assert "Box 1 Last" in box2_names  # Relegated down from Box 1
    assert "Box 3 Top" in box2_names  # Promoted up from Box 3
    assert "Box 2 Top" not in box2_names  # Promoted out
    assert "Box 2 Bottom" not in box2_names  # Relegated out

    # Box 3: Last box
    # B3_P4 (was 4th in Box 3) CANNOT be relegated (stays in Box 3)
    # B2_P4 (was 4th in Box 2) relegated to Box 3
    box3_names = [e.name for e in cycle_1[2].entries]
    assert "Box 3 Bottom" in box3_names  # Bottom of Box 3 stayed in Box 3
    assert "Box 2 Bottom" in box3_names  # Relegated down from Box 2
    assert "Box 3 Top" not in box3_names  # Promoted up to Box 2

    # Simulate multi-cycle transitions over a 4-week league season
    current_boxes = cycle_1
    for week in range(2, 5):
        # Invert points in each cycle to test continuous churn
        for b in current_boxes:
            for idx, entry in enumerate(b.entries):
                entry.points = (4 - idx) * 3
        current_boxes = promote_and_relegate(current_boxes, promote=1, relegate=1)

        # Invariants must strictly hold in every single cycle:
        assert len(current_boxes) == 3
        assert len(current_boxes[0].entries) == 4
        assert len(current_boxes[1].entries) == 4
        assert len(current_boxes[2].entries) == 4
