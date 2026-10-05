"""Property and edge-case tests for money splitting in pesewas."""

import pytest
from hypothesis import given
from hypothesis import settings as hyp_settings
from hypothesis import strategies as st

from app.domain.money import price_per_player, round_up


@given(
    court_cost=st.integers(
        min_value=0, max_value=2_000_000
    ),  # up to 20,000 GHS in pesewas
    platform_fee=st.integers(min_value=0, max_value=500_000),  # up to 5,000 GHS
    capacity=st.integers(min_value=1, max_value=32),
    rounding_unit=st.sampled_from(
        [50, 100, 200, 500]
    ),  # 50p, 1 GHS, 2 GHS, 5 GHS rounding
)
@hyp_settings(max_examples=100, deadline=None)
def test_price_per_player_always_covers_total_cost(
    court_cost: int, platform_fee: int, capacity: int, rounding_unit: int
) -> None:
    price = price_per_player(
        court_cost, platform_fee, capacity, rounding_unit=rounding_unit
    )

    total_cost = court_cost + platform_fee
    total_collected = price * capacity

    # Invariant: We must never be left short
    assert total_collected >= total_cost, (
        f"Deficit: collected {total_collected} < cost {total_cost} "
        f"(price={price}, cap={capacity})"
    )

    # Invariant: Price is always a multiple of the rounding unit
    assert price % rounding_unit == 0


def test_invalid_parameters_raise_value_error() -> None:
    with pytest.raises(ValueError, match="capacity must be positive"):
        price_per_player(1000, 500, capacity=0)

    with pytest.raises(ValueError, match="costs cannot be negative"):
        price_per_player(-100, 500, capacity=4)

    with pytest.raises(ValueError, match="unit must be positive"):
        round_up(100, unit=0)
