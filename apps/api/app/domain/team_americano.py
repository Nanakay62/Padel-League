"""Pure domain logic for Team Americano (fixed pairs round robin schedule)."""

from dataclasses import dataclass


@dataclass(frozen=True)
class TeamMatch:
    court_number: int
    team_a: str
    team_b: str


def generate_team_round_robin(
    teams: list[str],
    courts: int,
) -> list[list[TeamMatch]]:
    """Generate round-robin schedule for fixed doubles teams.

    Uses standard circle / Berger tournament scheduling algorithm:
    - If number of teams is odd, a dummy bye is added.
    - Each team plays every other team once.
    - No team plays on two courts simultaneously.
    - Courts are assigned sequentially up to available court capacity.

    Returns:
        list of rounds, where each round is a list of TeamMatch objects.
    """
    n = len(teams)
    if n < 2:
        raise ValueError("Team round robin requires at least 2 teams.")

    team_list = list(teams)
    if n % 2 != 0:
        team_list.append("__BYE__")
        n += 1

    total_rounds = n - 1
    schedule: list[list[TeamMatch]] = []

    # Berger circle scheduling
    fixed = team_list[0]
    rotating = team_list[1:]

    for _ in range(total_rounds):
        round_matches: list[TeamMatch] = []
        current_circle = [fixed] + rotating
        court_num = 1

        for i in range(n // 2):
            t1 = current_circle[i]
            t2 = current_circle[n - 1 - i]

            # Skip dummy bye matchup
            if t1 == "__BYE__" or t2 == "__BYE__":
                continue

            if court_num <= courts:
                round_matches.append(
                    TeamMatch(
                        court_number=court_num,
                        team_a=t1,
                        team_b=t2,
                    )
                )
                court_num += 1

        if round_matches:
            schedule.append(round_matches)

        # Rotate circle elements clockwise, keeping the first element fixed
        rotating = [rotating[-1]] + rotating[:-1]

    return schedule
