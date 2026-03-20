from enum import StrEnum

from pydantic import computed_field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class AuthMode(StrEnum):
    """Authentication mode for the API."""

    NONE = "none"
    LOCAL = "local"
    FULL = "full"


class AuthSettings(BaseSettings):
    """Auth-specific settings.

    Env vars are prefixed with AUTH_ (e.g. AUTH_MODE=local, AUTH_JWT_SECRET=...).
    """

    model_config = SettingsConfigDict(env_prefix="AUTH_")

    mode: AuthMode = AuthMode.NONE
    jwt_secret: str | None = None
    jwt_algorithm: str = "HS256"
    access_token_ttl_minutes: int = 15
    refresh_token_ttl_days: int = 7
    local_password_hash: str | None = None


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    app_name: str = "OpenSpawn API"
    debug: bool = False

    database_url: str = "postgresql+asyncpg://localhost:5432/openspawn"

    @computed_field  # type: ignore[prop-decorator]
    @property
    def is_sqlite(self) -> bool:
        """True when using a SQLite backend."""
        return self.database_url.startswith("sqlite")

    @model_validator(mode="after")
    def _fix_database_url_scheme(self) -> "Settings":
        if self.database_url.startswith("postgresql://"):
            self.database_url = self.database_url.replace(
                "postgresql://", "postgresql+asyncpg://", 1
            )
        return self

    database_pool_size: int = 10
    database_pool_max_overflow: int = 20

    cors_origins: list[str] = [
        "http://localhost:4200",
        "http://localhost:3333",
        "https://bikinibottom.ai",
        "https://openspawn.ai",
    ]

    log_level: str = "INFO"
    log_format: str = "json"

    # Redis (for arq workers)
    redis_url: str = "redis://localhost:6379"

    # Coordination engine
    sla_warning_pct: int = 80
    sla_breach_pct: int = 100

    # Auth configuration
    auth: AuthSettings = AuthSettings()

    # Hosted mode (multi-tenant SaaS)
    hosted_mode: bool = False

    # Observability (all optional)
    logfire_token: str | None = None
    langfuse_public_key: str | None = None
    langfuse_secret_key: str | None = None


settings = Settings()


def get_settings() -> Settings:
    """Return the global settings instance.

    Using a function instead of direct import makes testing easier
    (can be patched or overridden).
    """
    return settings
