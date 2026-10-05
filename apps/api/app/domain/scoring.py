"""Scoring logic for rally scoring and standard sets with golden point."""

from dataclasses import dataclass


@dataclass(frozen=True)
class RallyScore:
    team_a: int
    team_b: int

    def validate(self, point_target: int) -> None:
        if self.team_a < 0 or self.team_b < 0:
            raise ValueError("Scores cannot be negative.")
        if self.team_a + self.team_b != point_target:
            raise ValueError(
                f"Scores must add up to {point_target} (got {self.team_a}+{self.team_b})."
            )


@dataclass(frozen=True)
class SetScore:
    games_a: int
    games_b: int
    golden_point: bool = True

    def validate(self) -> None:
        if self.games_a < 0 or self.games_b < 0:
            raise ValueError("Games cannot be negative.")
        # Valid set finishes: 6-0 to 6-4, 7-5, 7-6 (or 6-7, 5-7, 4-6..0-6)
        max_g = max(self.games_a, self.games_b)
        min_g = min(self.games_a, self.games_b)
        if max_g == 6 and min_g <= 4:
            return
        if max_g == 7 and min_g in (5, 6):
            return
        raise ValueError(f"Invalid set score: {self.games_a}-{self.games_b}")
