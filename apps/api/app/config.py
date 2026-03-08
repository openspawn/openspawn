from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    app_name: str = "OpenSpawn API"
    debug: bool = False

    database_url: str = "postgresql+asyncpg://localhost:5432/openspawn"

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

    # Observability (all optional)
    logfire_token: str | None = None
    langfuse_public_key: str | None = None
    langfuse_secret_key: str | None = None


settings = Settings()
