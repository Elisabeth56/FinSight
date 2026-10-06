"""Pydantic schemas for auth-related payloads."""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class CurrentUser(BaseModel):
    """The user derived from a verified Supabase JWT + public.users row."""

    id: str  # auth.users.id (UUID as string)
    email: EmailStr
    full_name: str | None = None
    avatar_url: str | None = None
    plan: str = "free"  # updated when Paystack webhook fires (Section 3)
    created_at: datetime | None = None

    # Raw JWT — stash it so downstream code can build a user-scoped
    # Supabase client for RLS-aware queries.
    access_token: str = Field(exclude=True)
