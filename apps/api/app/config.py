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
    database_pool_size: int = 10
    database_pool_max_overflow: int = 20

    cors_origins: list[str] = ["http://localhost:4200", "http://localhost:3333"]

    log_level: str = "INFO"
    log_format: str = "json"

    # Redis (for arq workers)
    redis_url: str = "redis://localhost:6379"

    # Observability (all optional)
    logfire_token: str | None = None
    langfuse_public_key: str | None = None
    langfuse_secret_key: str | None = None


settings = Settings()
