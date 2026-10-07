from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

REPOSITORY_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    """Runtime configuration, read from environment variables or the repository-level .env file."""

    model_config = SettingsConfigDict(env_file=REPOSITORY_ROOT / ".env", extra="ignore")

    database_url: str = "postgresql+psycopg://evm:evm@localhost:5433/evm"


@lru_cache
def get_settings() -> Settings:
    return Settings()
