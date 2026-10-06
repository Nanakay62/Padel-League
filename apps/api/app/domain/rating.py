"""Doubles margin-aware Elo rating engine (1.0 to 7.0 scale).

Pure Python domain functions. No FastAPI, no SQLAlchemy dependencies.
"""

from dataclasses import dataclass
from typing import Literal


@dataclass(frozen=True)
class MatchParticipant:
    player_id: str
    rating: float
    matches_played: int


@dataclass(frozen=True)
class RatingMatch:
    match_id: str
    team_a: list[MatchParticipant]
    team_b: list[MatchParticipant]
    score_a: int
    score_b: int
    point_target: int = 24


@dataclass(frozen=True)
class RatingUpdate:
    player_id: str
    old_rating: float
    new_rating: float
    delta: float
    k_factor: float
    explanation: str
    requires_review: bool


LevelBandName = Literal["Beginner", "Improver", "Intermediate", "Advanced", "Expert"]


def get_level_band(rating: float) -> LevelBandName:
    """Map numeric 1.0-7.0 rating to canonical Ghana Padel level band."""
    if rating <= 2.0:
        return "Beginner"
    if rating <= 3.0:
        return "Improver"
    if rating <= 4.0:
        return "Intermediate"
    if rating <= 5.5:
        return "Advanced"
    return "Expert"


def expected_score(rating_a: float, rating_b: float) -> float:
    """Elo logistic expectation on 1.0 - 7.0 scale where 1 full level difference produces ~85% win probability."""
    return 1.0 / (1.0 + 10.0 ** ((rating_b - rating_a) / 1.35))


def calculate_rating_updates(
    match: RatingMatch,
    k_new: float = 0.30,
    k_stable: float = 0.12,
    max_delta_per_match: float = 0.20,
) -> list[RatingUpdate]:
    """Calculate margin-aware, reliability-weighted doubles Elo updates.

    - Compares team average rating vs opponent team average rating.
    - Updates all four participants individually.
    - Caps per-match delta to max_delta_per_match (default ±0.20).
    - Clamps ratings between 1.0 and 7.0.
    """
    total_points = match.score_a + match.score_b
    if total_points == 0:
        raise ValueError("Match must have at least one scored point")

    avg_a = sum(p.rating for p in match.team_a) / len(match.team_a)
    avg_b = sum(p.rating for p in match.team_b) / len(match.team_b)

    exp_a = expected_score(avg_a, avg_b)
    exp_b = 1.0 - exp_a

    act_a = match.score_a / total_points
    act_b = match.score_b / total_points

    # Margin factor (scales between 1.0 for close game and 1.5 for shutouts)
    margin_diff = abs(act_a - 0.5) * 2.0
    margin_multiplier = 1.0 + (0.5 * margin_diff)

    updates: list[RatingUpdate] = []

    # Process Team A
    for p in match.team_a:
        k = k_new if p.matches_played < 10 else k_stable
        raw_delta = k * (act_a - exp_a) * margin_multiplier
        capped_delta = max(-max_delta_per_match, min(max_delta_per_match, raw_delta))
        delta = round(capped_delta, 2)
        if delta == 0.0 and act_a > exp_a:
            delta = 0.01
        elif delta == 0.0 and act_a < exp_a:
            delta = -0.01

        new_rating = round(max(1.0, min(7.0, p.rating + delta)), 2)

        # Flag sandbagging/unexpected outcome if expected win was < 15% but team won by blowout
        requires_review = (exp_a < 0.15 and act_a > 0.65) or (
            exp_a > 0.85 and act_a < 0.35
        )

        if delta > 0:
            explanation = (
                f"+{delta:.2f}: Beat pair rated {avg_b:.2f} "
                f"({match.score_a}-{match.score_b}, expected {exp_a * 100:.0f}%)"
            )
        else:
            explanation = (
                f"{delta:.2f}: Loss to pair rated {avg_b:.2f} "
                f"({match.score_a}-{match.score_b}, expected {exp_a * 100:.0f}%)"
            )

        updates.append(
            RatingUpdate(
                player_id=p.player_id,
                old_rating=p.rating,
                new_rating=new_rating,
                delta=delta,
                k_factor=k,
                explanation=explanation,
                requires_review=requires_review,
            )
        )

    # Process Team B
    for p in match.team_b:
        k = k_new if p.matches_played < 10 else k_stable
        raw_delta = k * (act_b - exp_b) * margin_multiplier
        capped_delta = max(-max_delta_per_match, min(max_delta_per_match, raw_delta))
        delta = round(capped_delta, 2)
        if delta == 0.0 and act_b > exp_b:
            delta = 0.01
        elif delta == 0.0 and act_b < exp_b:
            delta = -0.01

        new_rating = round(max(1.0, min(7.0, p.rating + delta)), 2)
        requires_review = (exp_b < 0.15 and act_b > 0.65) or (
            exp_b > 0.85 and act_b < 0.35
        )

        if delta > 0:
            explanation = (
                f"+{delta:.2f}: Beat pair rated {avg_a:.2f} "
                f"({match.score_b}-{match.score_a}, expected {exp_b * 100:.0f}%)"
            )
        else:
            explanation = (
                f"{delta:.2f}: Loss to pair rated {avg_a:.2f} "
                f"({match.score_b}-{match.score_a}, expected {exp_b * 100:.0f}%)"
            )

        updates.append(
            RatingUpdate(
                player_id=p.player_id,
                old_rating=p.rating,
                new_rating=new_rating,
                delta=delta,
                k_factor=k,
                explanation=explanation,
                requires_review=requires_review,
            )
        )

    return updates


def replay_rating_events(
    initial_ratings: dict[str, float],
    matches: list[RatingMatch],
) -> tuple[dict[str, float], list[RatingUpdate]]:
    """Deterministically replay rating events across chronological matches."""
    current_ratings = dict(initial_ratings)
    matches_counts: dict[str, int] = {pid: 0 for pid in initial_ratings}
    all_events: list[RatingUpdate] = []

    for match in matches:
        # Build match with current ratings
        team_a_participants = [
            MatchParticipant(
                player_id=p.player_id,
                rating=current_ratings.get(p.player_id, p.rating),
                matches_played=matches_counts.get(p.player_id, 0),
            )
            for p in match.team_a
        ]
        team_b_participants = [
            MatchParticipant(
                player_id=p.player_id,
                rating=current_ratings.get(p.player_id, p.rating),
                matches_played=matches_counts.get(p.player_id, 0),
            )
            for p in match.team_b
        ]

        active_match = RatingMatch(
            match_id=match.match_id,
            team_a=team_a_participants,
            team_b=team_b_participants,
            score_a=match.score_a,
            score_b=match.score_b,
            point_target=match.point_target,
        )

        updates = calculate_rating_updates(active_match)
        for u in updates:
            current_ratings[u.player_id] = u.new_rating
            matches_counts[u.player_id] = matches_counts.get(u.player_id, 0) + 1
            all_events.append(u)

    return current_ratings, all_events
