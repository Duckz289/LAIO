from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[2]

class Settings(BaseSettings):
    SUPABASE_URL: str = ""
    SUPABASE_PUBLISHABLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    DATABASE_URL: str = ""
    DEBUG: bool = False
    APP_NAME: str = "LAIO API"
    VERSION: str = "1.0.0"
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    ALLOWED_HOSTS: list[str] = ["localhost", "127.0.0.1", "testserver"]
    DATABASE_POOL_SIZE: int = Field(default=5, ge=1, le=50)
    DATABASE_MAX_OVERFLOW: int = Field(default=10, ge=0, le=100)
    DATABASE_POOL_TIMEOUT_SECONDS: int = Field(default=10, ge=1, le=60)
    MAX_REQUEST_BODY_BYTES: int = Field(default=1_048_576, ge=16_384, le=10_485_760)
    API_RATE_LIMIT_PER_MINUTE: int = Field(default=180, ge=10, le=10_000)
    TTS_RATE_LIMIT_PER_MINUTE: int = Field(default=20, ge=1, le=1_000)
    VBEE_API_URL: str = "https://vbee.vn/api/v1/tts"
    VBEE_APP_ID: str = ""
    VBEE_TOKEN: str = ""
    # A clear US-English voice, suitable for vocabulary pronunciation.
    VBEE_VOICE_CODE: str = "en-US-Standard-F"
    VBEE_AUDIO_TYPE: str = "mp3"
    VBEE_BITRATE: int = 128
    VBEE_SPEED_RATE: float = 0.9

    model_config = SettingsConfigDict(
        # Resolve from this file instead of the shell working directory. This
        # keeps `pytest`, Alembic and Uvicorn consistent when launched at root.
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("CORS_ORIGINS", "ALLOWED_HOSTS", mode="before")
    @classmethod
    def parse_comma_separated_values(cls, value):
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @model_validator(mode="after")
    def reject_unsafe_cors_configuration(self):
        if "*" in self.CORS_ORIGINS:
            raise ValueError("CORS_ORIGINS must list explicit trusted origins")
        return self

    @field_validator("DATABASE_URL", mode="after")
    @classmethod
    def use_psycopg3_driver(cls, value: str) -> str:
        if not value:
            raise ValueError("DATABASE_URL is required")
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+psycopg://", 1)
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+psycopg://", 1)
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
