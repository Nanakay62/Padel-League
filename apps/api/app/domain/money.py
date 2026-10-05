"""Money handling for Ghana Padel Platform: integer pesewas only."""


def round_up(value: int, unit: int) -> int:
    """Round up integer value to the nearest multiple of unit (e.g. 100 for whole Cedis)."""
    if unit <= 0:
        raise ValueError("unit must be positive")
    return -(-value // unit) * unit


def price_per_player(
    court_cost: int,
    platform_fee: int,
    capacity: int,
    rounding_unit: int = 100,
) -> int:
    """All integers in pesewas (1 GHS = 100 pesewas).
    Never returns a price that leaves the organiser or platform short.
    """
    if capacity <= 0:
        raise ValueError("capacity must be positive")
    if court_cost < 0 or platform_fee < 0:
        raise ValueError("costs cannot be negative")

    total = court_cost + platform_fee
    per = -(-total // capacity)  # Ceil division
    return round_up(per, rounding_unit)  # Round up to whole pesewas/cedis unit


def format_ghs(pesewas: int) -> str:
    """Format pesewas as GH₵ X.XX display string."""
    sign = "-" if pesewas < 0 else ""
    abs_val = abs(pesewas)
    cedis = abs_val // 100
    pes = abs_val % 100
    return f"{sign}GH₵ {cedis:,}.{pes:02d}"
