from app.domain.money import format_ghs, price_per_player, round_up


def test_round_up() -> None:
    assert round_up(0, 100) == 0
    assert round_up(1, 100) == 100
    assert round_up(100, 100) == 100
    assert round_up(101, 100) == 200


def test_price_per_player_coverage() -> None:
    # 200 GHS court + 20 GHS fee = 220 GHS (22,000 pesewas) across 4 players
    # 22,000 / 4 = 5,500 pesewas (GH₵ 55.00)
    court_cost = 20000
    platform_fee = 2000
    capacity = 4
    price = price_per_player(court_cost, platform_fee, capacity, rounding_unit=100)
    assert price == 5500
    # Must sum to at least total cost
    assert price * capacity >= court_cost + platform_fee


def test_price_per_player_rounding_up() -> None:
    # 200 GHS court + 25 GHS fee = 22,500 pesewas across 8 players = 2,812.5 pesewas
    # Ceil = 2,813 pesewas -> Round up 100 = 2,900 pesewas (GH₵ 29.00)
    price = price_per_player(20000, 2500, 8, rounding_unit=100)
    assert price == 2900
    assert price * 8 >= 22500


def test_format_ghs() -> None:
    assert format_ghs(8500) == "GH₵ 85.00"
    assert format_ghs(24050) == "GH₵ 240.50"
    assert format_ghs(0) == "GH₵ 0.00"
