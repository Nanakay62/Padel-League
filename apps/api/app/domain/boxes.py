"""Box league promotion and relegation domain logic."""

from dataclasses import dataclass


@dataclass
class BoxEntry:
    name: str
    points: int = 0
    sets_won: int = 0
    sets_lost: int = 0
    games_won: int = 0
    games_lost: int = 0

    @property
    def set_difference(self) -> int:
        return self.sets_won - self.sets_lost

    @property
    def game_difference(self) -> int:
        return self.games_won - self.games_lost


@dataclass
class Box:
    box_number: int
    entries: list[BoxEntry]


def standings_key(e: BoxEntry) -> tuple[int, int, int, str]:
    return (-e.points, -e.set_difference, -e.game_difference, e.name)


def promote_and_relegate(boxes: list[Box], promote: int, relegate: int) -> list[Box]:
    """Top N of each box move up, bottom N move down, middle stays.
    Box 1 has nowhere to be promoted to; the last box nowhere to relegate.
    """
    if not boxes:
        return []

    num_boxes = len(boxes)
    # Sort entries in each box
    ranked_entries: list[list[BoxEntry]] = [
        sorted(b.entries, key=standings_key) for b in boxes
    ]

    new_boxes: list[list[BoxEntry]] = [[] for _ in range(num_boxes)]

    for i, entries in enumerate(ranked_entries):
        n = len(entries)
        for rank, entry in enumerate(entries):
            # Promotion candidate
            if rank < promote and i > 0:
                new_boxes[i - 1].append(entry)
            # Relegation candidate
            elif rank >= n - relegate and i < num_boxes - 1:
                new_boxes[i + 1].append(entry)
            # Stay in the same box
            else:
                new_boxes[i].append(entry)

    return [
        Box(box_number=i + 1, entries=entries) for i, entries in enumerate(new_boxes)
    ]
