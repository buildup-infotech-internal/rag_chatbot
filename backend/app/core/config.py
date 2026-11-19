from pathlib import Path
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    DATABASE_URL: str
    GROQ_API_KEY: str
    CORS_ORIGINS: str = "http://localhost:3000"
    LOG_LEVEL: str = "INFO"
    MAX_UPLOAD_FILE_SIZE_BYTES: int = Field(default=10 * 1024 * 1024, gt=0)
    MAX_UPLOAD_FILES: int = Field(default=5, ge=1)

    @field_validator("CORS_ORIGINS")
    @classmethod
    def cors_origins_must_be_explicit(cls, value: str) -> str:
        """Reject wildcard origins and require an explicit CORS allowlist."""
        origins = [origin.strip() for origin in value.split(",") if origin.strip()]
        if not origins or "*" in origins:
            raise ValueError("CORS_ORIGINS must contain explicit origins and cannot include '*'.")
        return value

    @field_validator("LOG_LEVEL")
    @classmethod
    def normalize_log_level(cls, value: str) -> str:
        """Accept only standard Python logging levels."""
        normalized = value.upper()
        if normalized not in {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}:
            raise ValueError("LOG_LEVEL must be a standard logging level.")
        return normalized

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
