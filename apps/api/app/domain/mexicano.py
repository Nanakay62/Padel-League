"""Mexicano: leaderboard-driven pairing. Pure Python domain logic."""


def mexicano_round(
    leaderboard: list[str],
    courts: int,
    strategy: str = "1+4_vs_2+3",
) -> list[tuple[int, tuple[str, str], tuple[str, str]]]:
    """Leaderboard best-first. Court 1 = ranks 1-4, court 2 = ranks 5-8 ...
    Inside a court: 1+4 vs 2+3 (default). Also supports 1+3 vs 2+4 as a setting.
    """
    matches: list[tuple[int, tuple[str, str], tuple[str, str]]] = []
    for court in range(1, courts + 1):
        block = leaderboard[(court - 1) * 4 : court * 4]
        if len(block) < 4:
            break
        p1, p2, p3, p4 = block
        if strategy == "1+3_vs_2+4":
            matches.append((court, (p1, p3), (p2, p4)))
        else:
            matches.append((court, (p1, p4), (p2, p3)))
    return matches
