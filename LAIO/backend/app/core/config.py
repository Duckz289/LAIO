from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_PUBLISHABLE_KEY: str = ""
    DATABASE_URL: str = ""
    DEBUG: bool = False
    APP_NAME: str = "LAIO API"
    VERSION: str = "1.0.0"

    class Config:
        env_file = ".env"

settings = Settings()