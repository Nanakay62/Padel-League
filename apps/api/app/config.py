"""Application settings with Ghana-specific padel defaults."""

from typing import Any

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # General / Application
    app_name: str = "Padel Ghana Platform"
    environment: str = "development"
    debug: bool = False
    database_url: str = "postgresql+psycopg://padel:padel@localhost:5432/padel"

    # Ghana Market & Locale
    currency: str = "GHS"
    timezone: str = "Africa/Accra"
    rounding_unit_pesewas: int = 100  # Round up to nearest whole cedi
    seat_hold_minutes: int = 10  # Longer hold for Mobile Money approvals
    phone_default_region: str = "GH"

    # Format Rules as Configurable Policies
    point_target: int = 24
    round_minutes: int = 15
    max_games_played_gap: int = 1
    rotation_strategy: str = "1+4_vs_2+3"
    social_tiebreak_order: list[str] = Field(
        default_factory=lambda: [
            "head_to_head",
            "point_difference",
            "fewest_sit_outs",
            "coin_toss",
        ]
    )
    golden_point: bool = True
    third_set_mode: str = "super_tiebreak"
    time_cap_policy: str = "leader_wins"
    level_band_enforcement: str = "strict"
    cost_split_mode: str = "even_split_ceil"
    free_cancel_hours: int = 24
    strike_limit: int = 3
    box_size: int = 4
    promote_count: int = 2
    league_rules: dict[str, Any] = Field(
        default_factory=lambda: {
            "win_points": 3,
            "loss_points": 1,
            "walkover_points": 0,
        }
    )

    # Rating System (0.0 - 7.0 doubles Elo)
    rating_k_new: float = 0.30
    rating_k_stable: float = 0.12
    rating_provisional_threshold: float = 0.85

    # Auth & Security
    secret_key: str = "padel-ghana-insecure-dev-secret-key-32charsmin"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30
    otp_expire_minutes: int = 5
    otp_max_attempts: int = 5
    otp_rate_limit_per_phone_per_hour: int = 3
    otp_rate_limit_per_ip_per_hour: int = 10

    # Payments & Integrations
    paystack_secret_key: str = ""
    paystack_public_key: str = ""
    sms_provider: str = "console"
    # Windows IPv6 note: Windows resolves localhost to either ::1 or 127.0.0.1.
    # Both must be listed in dev CORS origins. In production, origins must come from env.
    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:8081",
            "http://127.0.0.1:8081",
            "http://localhost:8082",
            "http://127.0.0.1:8082",
            "http://localhost:8085",
            "http://127.0.0.1:8085",
            "http://localhost:8086",
            "http://127.0.0.1:8086",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://test",
        ]
    )

    # Venue & Court Pricing / Quotes
    platform_fee_pesewas: int = 500  # GH₵ 5.00 placeholder, business decision
    quote_hold_window_minutes: int = 15  # Unexpired quote hold window
    quote_token_max_age_seconds: int = 86400  # 24h absolute max token age
    quote_keyring: dict[str, str] = Field(
        default_factory=lambda: {"v1": "padel-ghana-quote-key-v1-secret-32ch"}
    )
    public_quote_rate_limit: int = 60  # 60 requests/minute per client IP
    trusted_proxies: list[str] = Field(
        default_factory=lambda: ["127.0.0.1", "::1"]
    )  # Only trust CF-Connecting-IP / X-Forwarded-For when direct peer is here

    # Taxation (Awaits an accountant; tax stays OFF by default)
    tax_enabled: bool = False
    tax_rate_bps: int = 0  # Basis points (100 bps = 1.00%)
    taxable_lines: list[str] = Field(
        default_factory=lambda: ["court_fee", "add_on"]
    )  # Court fee and add-ons; platform fee excluded
    # Tax mode: "exclusive" (tax added on top) or "inclusive" (tax included in rate).
    # Default is "exclusive". Rule awaits an accountant verification.
    tax_mode: str = "exclusive"


settings = Settings()
