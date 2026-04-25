"""
Application configuration. All env vars land here.
Import `settings` anywhere — never read os.getenv directly in routes.
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # tolerate unknown env keys
    )

    # App
    # Read from APP_ENV (not ENV) — the bare `ENV` name collides with a
    # shell-exported variable on some systems (e.g. ENV=/etc/profile),
    # which crashes pydantic-settings validation.
    env: Literal["development", "staging", "production"] = Field(
        default="development",
        validation_alias="APP_ENV",
    )
    # Comma-separated list of allowed frontend origins.
    # Production example:
    #   FRONTEND_ORIGIN=https://finsight.vercel.app,https://finsight-git-main-yourname.vercel.app
    frontend_origin: str = "http://localhost:3000"

    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_key: str
    supabase_jwt_secret: str

    # Groq (Section 2 — optional at boot so dev can run auth-only)
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    # Paystack (Section 3)
    paystack_secret_key: str = ""
    paystack_public_key: str = ""
    paystack_webhook_secret: str = ""
    # Plan codes — create these in the Paystack dashboard first
    paystack_plan_monthly_ngn: str = ""
    paystack_plan_monthly_usd: str = ""
    paystack_plan_yearly_ngn: str = ""
    paystack_plan_yearly_usd: str = ""

    @property
    def is_production(self) -> bool:
        return self.env == "production"

    @property
    def cors_origins(self) -> list[str]:
        # Split comma-separated FRONTEND_ORIGIN so staging/preview URLs work
        origins = [
            o.strip()
            for o in self.frontend_origin.split(",")
            if o.strip()
        ]
        if self.env == "development":
            # Allow local dev variants regardless of env file
            origins.extend(["http://localhost:3000", "http://127.0.0.1:3000"])
        return list(set(origins))


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
