from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    SUPABASE_URL: str = ""
    SUPABASE_PUBLISHABLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    DATABASE_URL: str = ""
    DEBUG: bool = False
    APP_NAME: str = "LAIO API"
    VERSION: str = "1.0.0"
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    VBEE_API_URL: str = "https://vbee.vn/api/v1/tts"
    VBEE_APP_ID: str = ""
    VBEE_TOKEN: str = ""
    # A clear US-English voice, suitable for vocabulary pronunciation.
    VBEE_VOICE_CODE: str = "en-US-Standard-F"
    VBEE_AUDIO_TYPE: str = "mp3"
    VBEE_BITRATE: int = 128
    VBEE_SPEED_RATE: float = 0.9

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

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
