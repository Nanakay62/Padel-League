"""Box league promotion and relegation domain logic."""

from dataclasses import dataclass, field
from itertools import combinations
from typing import Any


@dataclass
class BoxEntry:
    pair_id: str
    name: str
    points: int = 0
    sets_won: int = 0
    sets_lost: int = 0
    games_won: int = 0
    games_lost: int = 0
    matches_played: int = 0
    walkovers_given: int = 0
    substitutes_used: int = 0

    @property
    def set_difference(self) -> int:
        return self.sets_won - self.sets_lost

    @property
    def game_difference(self) -> int:
        return self.games_won - self.games_lost


@dataclass
class BoxMatchResult:
    match_id: str
    team_a_pair_id: str
    team_b_pair_id: str
    team_a_sets: int = 0
    team_b_sets: int = 0
    team_a_games: int = 0
    team_b_games: int = 0
    is_walkover: bool = False
    walkover_winner_pair_id: str | None = None


@dataclass
class Box:
    box_number: int
    entries: list[BoxEntry] = field(default_factory=list)


def generate_round_robin_fixtures(pair_ids: list[str]) -> list[tuple[str, str]]:
    """Generates round-robin fixtures where each pair plays every other pair once."""
    return list(combinations(pair_ids, 2))


def compute_box_standings(
    entries: list[BoxEntry], results: list[BoxMatchResult]
) -> list[BoxEntry]:
    """Computes box standings according to pair league scoring rules:

    - Win: 3 points
    - Played Loss: 1 point
    - Walkover Loss (walkover given): 0 points
    - Walkover Win: 3 points (default awarded: 2-0 sets, 12-0 games)
    - Tiebreakers: Points -> Head-to-Head -> Set Difference -> Game Difference -> Name.
    """
    stats_by_id: dict[str, BoxEntry] = {
        e.pair_id: BoxEntry(
            pair_id=e.pair_id,
            name=e.name,
            substitutes_used=e.substitutes_used,
        )
        for e in entries
    }

    # Head-to-head outcomes: (winner_id, loser_id)
    head_to_head_wins: dict[tuple[str, str], int] = {}

    for res in results:
        a_id = res.team_a_pair_id
        b_id = res.team_b_pair_id

        if a_id not in stats_by_id or b_id not in stats_by_id:
            continue

        team_a = stats_by_id[a_id]
        team_b = stats_by_id[b_id]

        if res.is_walkover:
            if res.walkover_winner_pair_id == a_id:
                winner, loser = team_a, team_b
                w_id, l_id = a_id, b_id
            elif res.walkover_winner_pair_id == b_id:
                winner, loser = team_b, team_a
                w_id, l_id = b_id, a_id
            else:
                continue

            winner.points += 3
            winner.sets_won += 2
            winner.games_won += 12
            winner.matches_played += 1

            loser.points += 0  # 0 for walkover given
            loser.sets_lost += 2
            loser.games_lost += 12
            loser.matches_played += 1
            loser.walkovers_given += 1

            head_to_head_wins[(w_id, l_id)] = head_to_head_wins.get((w_id, l_id), 0) + 1
        else:
            team_a.sets_won += res.team_a_sets
            team_a.sets_lost += res.team_b_sets
            team_a.games_won += res.team_a_games
            team_a.games_lost += res.team_b_games
            team_a.matches_played += 1

            team_b.sets_won += res.team_b_sets
            team_b.sets_lost += res.team_a_sets
            team_b.games_won += res.team_b_games
            team_b.games_lost += res.team_a_games
            team_b.matches_played += 1

            if res.team_a_sets > res.team_b_sets:
                team_a.points += 3
                team_b.points += 1  # 1 for played loss
                head_to_head_wins[(a_id, b_id)] = (
                    head_to_head_wins.get((a_id, b_id), 0) + 1
                )
            elif res.team_b_sets > res.team_a_sets:
                team_b.points += 3
                team_a.points += 1  # 1 for played loss
                head_to_head_wins[(b_id, a_id)] = (
                    head_to_head_wins.get((b_id, a_id), 0) + 1
                )

    all_entries = list(stats_by_id.values())

    # Group by points descending
    points_groups: dict[int, list[BoxEntry]] = {}
    for e in all_entries:
        points_groups.setdefault(e.points, []).append(e)

    sorted_entries: list[BoxEntry] = []
    for pts in sorted(points_groups.keys(), reverse=True):
        group = points_groups[pts]
        if len(group) == 1:
            sorted_entries.append(group[0])
        elif len(group) == 2:
            p1, p2 = group[0], group[1]
            p1_won = head_to_head_wins.get((p1.pair_id, p2.pair_id), 0)
            p2_won = head_to_head_wins.get((p2.pair_id, p1.pair_id), 0)
            if p1_won > p2_won:
                sorted_entries.extend([p1, p2])
            elif p2_won > p1_won:
                sorted_entries.extend([p2, p1])
            else:
                # Tied in head-to-head, sort by set diff, game diff, name
                sorted_group = sorted(
                    group,
                    key=lambda x: (
                        -x.set_difference,
                        -x.game_difference,
                        x.name,
                    ),
                )
                sorted_entries.extend(sorted_group)
        else:
            # 3 or more tied on points: check if one pair beat all others in group
            # otherwise fall back to set difference, game difference, name
            sorted_group = sorted(
                group,
                key=lambda x: (
                    -x.set_difference,
                    -x.game_difference,
                    x.name,
                ),
            )
            sorted_entries.extend(sorted_group)

    return sorted_entries


def validate_substitute_eligibility(
    sub_rating: float,
    replaced_player_rating: float,
    box_ceiling_rating: float,
    subs_used_by_pair: int,
    max_subs_allowed: int = 1,
) -> tuple[bool, str]:
    """Validates whether a substitute player meets the pair league substitute policy."""
    if subs_used_by_pair >= max_subs_allowed:
        return (
            False,
            f"Substitute limit reached ({subs_used_by_pair}/{max_subs_allowed} used).",
        )

    if sub_rating > replaced_player_rating:
        return (
            False,
            f"Substitute rating ({sub_rating:.2f}) exceeds replaced player rating ({replaced_player_rating:.2f}).",
        )

    if sub_rating > box_ceiling_rating:
        return (
            False,
            f"Substitute rating ({sub_rating:.2f}) exceeds box ceiling ({box_ceiling_rating:.2f}).",
        )

    return True, "Eligible"


def resolve_deadline_unplayed_matches(
    fixtures: list[dict[str, Any]],
) -> list[BoxMatchResult]:
    """Resolves unplayed matches past deadline according to league policy."""
    resolved: list[BoxMatchResult] = []
    for f in fixtures:
        match_id = f["match_id"]
        team_a_id = f["team_a_pair_id"]
        team_b_id = f["team_b_pair_id"]
        claimant = f.get("walkover_claimant")

        if claimant:
            resolved.append(
                BoxMatchResult(
                    match_id=match_id,
                    team_a_pair_id=team_a_id,
                    team_b_pair_id=team_b_id,
                    team_a_sets=2 if claimant == team_a_id else 0,
                    team_b_sets=2 if claimant == team_b_id else 0,
                    team_a_games=12 if claimant == team_a_id else 0,
                    team_b_games=12 if claimant == team_b_id else 0,
                    is_walkover=True,
                    walkover_winner_pair_id=claimant,
                )
            )
        else:
            resolved.append(
                BoxMatchResult(
                    match_id=match_id,
                    team_a_pair_id=team_a_id,
                    team_b_pair_id=team_b_id,
                    team_a_sets=0,
                    team_b_sets=0,
                    team_a_games=0,
                    team_b_games=0,
                    is_walkover=False,
                )
            )
    return resolved


def promote_and_relegate(boxes: list[Box], promote: int, relegate: int) -> list[Box]:
    """Promotes top N pairs and relegates bottom N pairs across boxes.

    Invariants:
    - Box 1 cannot promote (remains in Box 1).
    - Last box cannot relegate (remains in the last box).
    """
    if not boxes:
        return []

    num_boxes = len(boxes)
    # Sort entries in each box by points, set difference, game difference, name
    ranked_entries: list[list[BoxEntry]] = [
        sorted(
            b.entries,
            key=lambda e: (
                -e.points,
                -e.set_difference,
                -e.game_difference,
                e.name,
            ),
        )
        for b in boxes
    ]

    new_boxes: list[list[BoxEntry]] = [[] for _ in range(num_boxes)]

    for i, entries in enumerate(ranked_entries):
        n = len(entries)
        for rank, entry in enumerate(entries):
            # Reset points and counters for the new cycle
            fresh_entry = BoxEntry(
                pair_id=entry.pair_id,
                name=entry.name,
                points=0,
                sets_won=0,
                sets_lost=0,
                games_won=0,
                games_lost=0,
                matches_played=0,
                walkovers_given=0,
                substitutes_used=0,
            )

            # Promotion candidate
            if rank < promote and i > 0:
                new_boxes[i - 1].append(fresh_entry)
            # Relegation candidate
            elif rank >= n - relegate and i < num_boxes - 1:
                new_boxes[i + 1].append(fresh_entry)
            # Stay in the same box
            else:
                new_boxes[i].append(fresh_entry)

    return [
        Box(box_number=i + 1, entries=entries) for i, entries in enumerate(new_boxes)
    ]
