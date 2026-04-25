"""Auth-scoped routes. Most auth happens client-side via Supabase;
this router just exposes /me for the frontend to hydrate its user state."""

from fastapi import APIRouter, Depends

from core.auth import get_current_user
from schemas.auth import CurrentUser

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=CurrentUser)
async def read_me(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    """Return the authenticated user's profile. Use this on app load
    to confirm the session is valid and hydrate the UI."""
    return user
