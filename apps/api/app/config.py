"""Typed settings, validated once at boot. Import `settings`; never read os.environ elsewhere."""

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # APP_ENV, not ENV: some shells export ENV=/etc/profile, which breaks validation
    env: Literal["development", "preview", "production"] = Field(
        default="development", validation_alias="APP_ENV"
    )
    frontend_origin: str = "http://localhost:3000"

    database_url: str

    # Neon Auth signs session JWTs; we verify them against its JWKS endpoint
    auth_jwks_url: str = ""
    auth_audience: str = ""

    # LLM providers in fallback order; check free-tier models before changing these
    groq_api_key: str = ""
    groq_model_large: str = "llama-3.3-70b-versatile"
    groq_model_small: str = "llama-3.1-8b-instant"
    gemini_api_key: str = ""
    gemini_model_large: str = "gemini-3.5-flash"
    gemini_model_small: str = "gemini-3.5-flash-lite"

    paystack_secret_key: str = ""

    free_uploads_per_month: int = 1
    max_upload_bytes: int = 4 * 1024 * 1024  # Vercel's request body limit is 4.5 MB

    @property
    def is_production(self) -> bool:
        return self.env == "production"

    @property
    def cors_origins(self) -> list[str]:
        origins = {o.strip() for o in self.frontend_origin.split(",") if o.strip()}
        if self.env == "development":
            origins |= {"http://localhost:3000", "http://127.0.0.1:3000"}
        return sorted(origins)


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
