"""
Supabase client factories.

We keep two flavors:

- `get_supabase_admin()` — uses the service_role key. Bypasses RLS.
  Use ONLY for trusted server-side ops (user provisioning, webhooks).

- `get_supabase_user(jwt)` — uses the anon key but authenticated with the
  user's JWT, so Postgres RLS policies apply. Use this for anything
  touching user-owned rows (transactions, statements, etc.).
"""

from functools import lru_cache

from supabase import Client, create_client

from core.config import settings


@lru_cache
def get_supabase_admin() -> Client:
    """Service-role client. Bypasses RLS. Never expose to the frontend."""
    return create_client(settings.supabase_url, settings.supabase_service_key)


def get_supabase_user(access_token: str) -> Client:
    """
    Anon client authenticated with a user's JWT so RLS applies.
    Create a new one per request — don't cache.
    """
    client = create_client(settings.supabase_url, settings.supabase_anon_key)
    client.postgrest.auth(access_token)
    return client
