from app.config import settings


def test_ghana_market_defaults() -> None:
    assert settings.currency == "GHS"
    assert settings.timezone == "Africa/Accra"
    assert settings.rounding_unit_pesewas == 100
    assert settings.seat_hold_minutes == 10
    assert settings.phone_default_region == "GH"
    assert settings.point_target == 24
    assert settings.max_games_played_gap == 1
    assert settings.strike_limit == 3
